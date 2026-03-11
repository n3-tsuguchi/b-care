-- ============================================================
-- B-Care: ビュー定義
-- ============================================================

-- 利用者 × 現在有効な受給者証
CREATE OR REPLACE VIEW v_client_current_certificates AS
SELECT
  c.id,
  c.office_id,
  c.client_number,
  c.family_name,
  c.given_name,
  c.family_name_kana,
  c.given_name_kana,
  c.birth_date,
  c.gender,
  c.disability_type,
  c.support_category,
  c.status,
  c.enrollment_date,
  cert.id AS certificate_id,
  cert.certificate_number,
  cert.municipality_code,
  cert.decision_start_date,
  cert.decision_end_date,
  cert.monthly_days_limit,
  cert.income_category,
  cert.copay_limit,
  cert.is_copay_limit_manager,
  -- 期限までの残日数
  (cert.decision_end_date - CURRENT_DATE) AS days_until_expiry
FROM clients c
LEFT JOIN certificates cert ON c.id = cert.client_id AND cert.is_current = true
WHERE c.deleted_at IS NULL;

-- 月次出席サマリー
CREATE OR REPLACE VIEW v_monthly_attendance_summary AS
SELECT
  a.office_id,
  a.client_id,
  EXTRACT(YEAR FROM a.attendance_date)::integer AS year,
  EXTRACT(MONTH FROM a.attendance_date)::integer AS month,
  COUNT(*) FILTER (WHERE a.status = 'present') AS present_days,
  COUNT(*) FILTER (WHERE a.status = 'late') AS late_days,
  COUNT(*) FILTER (WHERE a.status = 'early_leave') AS early_leave_days,
  COUNT(*) FILTER (WHERE a.status = 'absent') AS absent_days,
  COUNT(*) FILTER (WHERE a.status IN ('present','late','early_leave')) AS service_days,
  COUNT(*) FILTER (WHERE a.pickup_outbound = true) AS pickup_outbound_days,
  COUNT(*) FILTER (WHERE a.pickup_inbound = true) AS pickup_inbound_days,
  COUNT(*) FILTER (WHERE a.meal_provided = true) AS meal_days,
  COALESCE(SUM(a.service_hours), 0) AS total_service_hours
FROM attendances a
GROUP BY a.office_id, a.client_id,
         EXTRACT(YEAR FROM a.attendance_date),
         EXTRACT(MONTH FROM a.attendance_date);

-- 年度平均工賃月額（リアルタイム算出）
CREATE OR REPLACE VIEW v_fiscal_year_avg_wage AS
SELECT
  mws.office_id,
  mws.fiscal_year,
  SUM(mws.total_wage_paid) AS total_wage_year,
  AVG(mws.avg_daily_users) AS avg_daily_users,
  COUNT(mws.id) AS months_elapsed,
  CASE
    WHEN AVG(mws.avg_daily_users) > 0 AND COUNT(mws.id) > 0
    THEN ROUND(SUM(mws.total_wage_paid) / AVG(mws.avg_daily_users) / COUNT(mws.id))
    ELSE 0
  END AS current_avg_wage_monthly
FROM monthly_wage_summaries mws
GROUP BY mws.office_id, mws.fiscal_year;

-- 事業所の日別出席集計
CREATE OR REPLACE VIEW v_daily_attendance_stats AS
SELECT
  a.office_id,
  a.attendance_date,
  COUNT(*) FILTER (WHERE a.status = 'present') AS present_count,
  COUNT(*) FILTER (WHERE a.status = 'absent') AS absent_count,
  COUNT(*) FILTER (WHERE a.status = 'late') AS late_count,
  COUNT(*) FILTER (WHERE a.status = 'early_leave') AS early_leave_count,
  COUNT(*) FILTER (WHERE a.status IN ('present','late','early_leave')) AS total_service_count,
  COUNT(*) AS total_records
FROM attendances a
GROUP BY a.office_id, a.attendance_date;

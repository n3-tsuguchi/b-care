-- ============================================================
-- Phase 2 RLSポリシー修正: can_access_office() を使用
-- ============================================================

-- 既存ポリシーを削除
DROP POLICY IF EXISTS isp_select ON individual_support_plans;
DROP POLICY IF EXISTS isp_insert ON individual_support_plans;
DROP POLICY IF EXISTS isp_update ON individual_support_plans;

DROP POLICY IF EXISTS spg_select ON support_plan_goals;
DROP POLICY IF EXISTS spg_insert ON support_plan_goals;
DROP POLICY IF EXISTS spg_update ON support_plan_goals;
DROP POLICY IF EXISTS spg_delete ON support_plan_goals;

DROP POLICY IF EXISTS sr_select ON support_records;
DROP POLICY IF EXISTS sr_insert ON support_records;
DROP POLICY IF EXISTS sr_update ON support_records;

DROP POLICY IF EXISTS spr_select ON support_plan_reviews;
DROP POLICY IF EXISTS spr_insert ON support_plan_reviews;
DROP POLICY IF EXISTS spr_update ON support_plan_reviews;

-- ============================================================
-- individual_support_plans (office_id直接)
-- ============================================================
CREATE POLICY "individual_support_plans_select" ON individual_support_plans
  FOR SELECT USING (public.can_access_office(office_id));

CREATE POLICY "individual_support_plans_insert" ON individual_support_plans
  FOR INSERT WITH CHECK (public.can_access_office(office_id));

CREATE POLICY "individual_support_plans_update" ON individual_support_plans
  FOR UPDATE USING (public.can_access_office(office_id));

-- ============================================================
-- support_records (office_id直接)
-- ============================================================
CREATE POLICY "support_records_select" ON support_records
  FOR SELECT USING (public.can_access_office(office_id));

CREATE POLICY "support_records_insert" ON support_records
  FOR INSERT WITH CHECK (public.can_access_office(office_id));

CREATE POLICY "support_records_update" ON support_records
  FOR UPDATE USING (public.can_access_office(office_id));

-- ============================================================
-- support_plan_goals (plan経由)
-- ============================================================
CREATE POLICY "support_plan_goals_select" ON support_plan_goals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM individual_support_plans p WHERE p.id = support_plan_goals.plan_id AND public.can_access_office(p.office_id))
  );

CREATE POLICY "support_plan_goals_insert" ON support_plan_goals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM individual_support_plans p WHERE p.id = support_plan_goals.plan_id AND public.can_access_office(p.office_id))
  );

CREATE POLICY "support_plan_goals_update" ON support_plan_goals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM individual_support_plans p WHERE p.id = support_plan_goals.plan_id AND public.can_access_office(p.office_id))
  );

CREATE POLICY "support_plan_goals_delete" ON support_plan_goals
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM individual_support_plans p WHERE p.id = support_plan_goals.plan_id AND public.can_access_office(p.office_id))
  );

-- ============================================================
-- support_plan_reviews (plan経由)
-- ============================================================
CREATE POLICY "support_plan_reviews_select" ON support_plan_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM individual_support_plans p WHERE p.id = support_plan_reviews.plan_id AND public.can_access_office(p.office_id))
  );

CREATE POLICY "support_plan_reviews_insert" ON support_plan_reviews
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM individual_support_plans p WHERE p.id = support_plan_reviews.plan_id AND public.can_access_office(p.office_id))
  );

CREATE POLICY "support_plan_reviews_update" ON support_plan_reviews
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM individual_support_plans p WHERE p.id = support_plan_reviews.plan_id AND public.can_access_office(p.office_id))
  );

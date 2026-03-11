-- ============================================================
-- B-Care Phase 1: テーブル作成
-- ============================================================

-- UUID生成用
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. 法人・事業所・ユーザー
-- ============================================================

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(200) NOT NULL,
  corporate_type varchar(20) NOT NULL CHECK (corporate_type IN ('social_welfare','npo','corporation','association')),
  corporate_number varchar(13),
  representative_name varchar(100),
  postal_code varchar(8),
  address text,
  phone varchar(20),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE offices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  office_number varchar(10) NOT NULL,
  name varchar(200) NOT NULL,
  service_type varchar(10) NOT NULL CHECK (service_type IN ('type_1','type_2','type_3','type_4','type_5','type_6')),
  staffing_ratio varchar(10) NOT NULL CHECK (staffing_ratio IN ('7.5_to_1','6_to_1')),
  capacity integer NOT NULL,
  postal_code varchar(8),
  address text,
  phone varchar(20),
  fax varchar(20),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT offices_office_number_unique UNIQUE (office_number)
);

CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  office_id uuid REFERENCES offices(id),
  email varchar(255) NOT NULL,
  display_name varchar(100) NOT NULL,
  role varchar(20) NOT NULL CHECK (role IN ('admin','service_manager','staff','accounting')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX idx_users_org_office ON users(organization_id, office_id);

-- ============================================================
-- 2. 事業所設定・マスタ
-- ============================================================

CREATE TABLE fiscal_years (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES offices(id),
  fiscal_year integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  prev_avg_wage integer,
  reward_tier varchar(30),
  annual_opening_days integer,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fiscal_years_office_year_unique UNIQUE (office_id, fiscal_year)
);

CREATE TABLE office_additions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES offices(id),
  fiscal_year integer NOT NULL,
  addition_code varchar(20) NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  tier varchar(20),
  parameters jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT office_additions_unique UNIQUE (office_id, fiscal_year, addition_code)
);

CREATE TABLE work_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES offices(id),
  name varchar(100) NOT NULL,
  description text,
  unit_type varchar(20) NOT NULL CHECK (unit_type IN ('hourly','piece','daily')),
  unit_price numeric(10,2),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wage_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES offices(id),
  fiscal_year integer NOT NULL,
  calculation_method varchar(20) NOT NULL CHECK (calculation_method IN ('hourly','daily','piece','mixed')),
  base_hourly_rate numeric(10,2),
  base_daily_rate numeric(10,2),
  payment_day integer,
  payment_method varchar(20) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','bank_transfer')),
  rounding_method varchar(10) NOT NULL DEFAULT 'floor' CHECK (rounding_method IN ('floor','round','ceil')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wage_rules_office_year_unique UNIQUE (office_id, fiscal_year)
);

CREATE TABLE staff_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES offices(id),
  user_id uuid REFERENCES users(id),
  name varchar(100) NOT NULL,
  position varchar(30) NOT NULL CHECK (position IN ('manager','service_manager','vocational_instructor','life_support_worker','other')),
  qualifications text[],
  employment_type varchar(20) NOT NULL CHECK (employment_type IN ('full_time','part_time')),
  hire_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. 利用者管理
-- ============================================================

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES offices(id),
  client_number varchar(20),
  family_name varchar(50) NOT NULL,
  given_name varchar(50) NOT NULL,
  family_name_kana varchar(100),
  given_name_kana varchar(100),
  birth_date date NOT NULL,
  gender varchar(10) CHECK (gender IN ('male','female','other')),
  disability_type varchar(30) CHECK (disability_type IN ('physical','intellectual','mental','developmental','intractable')),
  disability_grade varchar(20),
  support_category integer CHECK (support_category BETWEEN 1 AND 6),
  postal_code varchar(8),
  address text,
  phone varchar(20),
  emergency_contact_name varchar(100),
  emergency_contact_phone varchar(20),
  emergency_contact_relation varchar(50),
  bank_name varchar(100),
  bank_branch varchar(100),
  bank_account_type varchar(10) CHECK (bank_account_type IN ('ordinary','current')),
  bank_account_number varchar(10),
  bank_account_holder varchar(100),
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','terminated')),
  enrollment_date date,
  termination_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT clients_office_number_unique UNIQUE (office_id, client_number)
);

CREATE INDEX idx_clients_office_status ON clients(office_id, status);

CREATE TABLE certificates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES clients(id),
  certificate_number varchar(20) NOT NULL,
  municipality_code varchar(6) NOT NULL,
  municipality_name varchar(100),
  service_type varchar(20) NOT NULL,
  decision_start_date date NOT NULL,
  decision_end_date date NOT NULL,
  monthly_days_limit integer NOT NULL,
  income_category varchar(20) NOT NULL CHECK (income_category IN ('seikatsu_hogo','low_income','general_1','general_2')),
  copay_limit integer NOT NULL,
  copay_limit_manager_office varchar(10),
  is_copay_limit_manager boolean NOT NULL DEFAULT false,
  is_current boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_certificates_client_current ON certificates(client_id, is_current);
CREATE INDEX idx_certificates_expiry ON certificates(decision_end_date);

CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES clients(id),
  contract_date date NOT NULL,
  contract_start_date date NOT NULL,
  contract_end_date date,
  important_doc_agreed_at timestamptz,
  termination_reason text,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','terminated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. 出席管理
-- ============================================================

CREATE TABLE attendances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES offices(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  attendance_date date NOT NULL,
  status varchar(20) NOT NULL CHECK (status IN ('present','absent','late','early_leave','absent_notified')),
  check_in_time time,
  check_out_time time,
  pickup_outbound boolean NOT NULL DEFAULT false,
  pickup_inbound boolean NOT NULL DEFAULT false,
  meal_provided boolean NOT NULL DEFAULT false,
  service_hours numeric(4,2),
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendances_client_date_unique UNIQUE (client_id, attendance_date)
);

CREATE INDEX idx_attendances_office_date ON attendances(office_id, attendance_date);
CREATE INDEX idx_attendances_office_date_status ON attendances(office_id, attendance_date, status);

CREATE TABLE attendance_work_details (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id uuid NOT NULL REFERENCES attendances(id) ON DELETE CASCADE,
  work_type_id uuid NOT NULL REFERENCES work_types(id),
  work_hours numeric(4,2),
  piece_count integer,
  amount numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_work_details_unique UNIQUE (attendance_id, work_type_id)
);

-- ============================================================
-- 5. 工賃管理
-- ============================================================

CREATE TABLE production_revenues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES offices(id),
  work_type_id uuid NOT NULL REFERENCES work_types(id),
  fiscal_year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  revenue_date date,
  description varchar(200),
  quantity numeric(10,2),
  unit_price numeric(10,2),
  amount numeric(12,2) NOT NULL,
  tax_amount numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_production_revenues_office_period ON production_revenues(office_id, fiscal_year, month);

CREATE TABLE production_expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES offices(id),
  work_type_id uuid REFERENCES work_types(id),
  fiscal_year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  expense_date date,
  category varchar(50) NOT NULL CHECK (category IN ('material','outsourcing','utility','equipment','other')),
  description varchar(200),
  amount numeric(12,2) NOT NULL,
  tax_amount numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_production_expenses_office_period ON production_expenses(office_id, fiscal_year, month);

CREATE TABLE monthly_wages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES offices(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  fiscal_year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  working_days integer NOT NULL DEFAULT 0,
  total_hours numeric(6,2) NOT NULL DEFAULT 0,
  base_wage numeric(10,2) NOT NULL DEFAULT 0,
  piece_wage numeric(10,2) NOT NULL DEFAULT 0,
  adjustment numeric(10,2) NOT NULL DEFAULT 0,
  total_wage numeric(10,2) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed','paid')),
  paid_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT monthly_wages_client_period_unique UNIQUE (client_id, fiscal_year, month)
);

CREATE INDEX idx_monthly_wages_office_period ON monthly_wages(office_id, fiscal_year, month);

CREATE TABLE monthly_wage_summaries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES offices(id),
  fiscal_year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_production_revenue numeric(12,2) NOT NULL DEFAULT 0,
  total_production_expense numeric(12,2) NOT NULL DEFAULT 0,
  distributable_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_wage_paid numeric(12,2) NOT NULL DEFAULT 0,
  avg_wage_per_person numeric(10,2),
  avg_daily_users numeric(6,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT monthly_wage_summaries_unique UNIQUE (office_id, fiscal_year, month)
);

-- ============================================================
-- 6. 国保連請求
-- ============================================================

CREATE TABLE billing_batches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES offices(id),
  target_year integer NOT NULL,
  target_month integer NOT NULL CHECK (target_month BETWEEN 1 AND 12),
  billing_type varchar(20) NOT NULL DEFAULT 'normal' CHECK (billing_type IN ('normal','delayed')),
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','checked','exported','submitted','paid','returned')),
  total_units integer NOT NULL DEFAULT 0,
  total_amount integer NOT NULL DEFAULT 0,
  total_copay integer NOT NULL DEFAULT 0,
  ai_check_result jsonb,
  ai_checked_at timestamptz,
  exported_at timestamptz,
  submitted_at timestamptz,
  paid_at date,
  paid_amount integer,
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_batches_unique UNIQUE (office_id, target_year, target_month, billing_type)
);

CREATE TABLE billing_details (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  billing_batch_id uuid NOT NULL REFERENCES billing_batches(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id),
  certificate_id uuid NOT NULL REFERENCES certificates(id),
  municipality_code varchar(6) NOT NULL,
  service_code varchar(6) NOT NULL,
  service_days integer NOT NULL,
  base_units integer NOT NULL,
  addition_units integer NOT NULL DEFAULT 0,
  subtraction_units integer NOT NULL DEFAULT 0,
  total_units integer NOT NULL,
  unit_price numeric(6,4) NOT NULL,
  total_amount integer NOT NULL,
  public_expense integer NOT NULL,
  copay_amount integer NOT NULL,
  copay_limit_result varchar(5),
  copay_after_limit integer,
  pickup_outbound_days integer NOT NULL DEFAULT 0,
  pickup_inbound_days integer NOT NULL DEFAULT 0,
  meal_provision_days integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_details_batch_client_unique UNIQUE (billing_batch_id, client_id)
);

CREATE TABLE billing_addition_details (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  billing_detail_id uuid NOT NULL REFERENCES billing_details(id) ON DELETE CASCADE,
  addition_code varchar(20) NOT NULL,
  addition_name varchar(100) NOT NULL,
  units integer NOT NULL,
  days_or_times integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE billing_client_invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  billing_batch_id uuid NOT NULL REFERENCES billing_batches(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  invoice_number varchar(30) NOT NULL,
  invoice_date date NOT NULL,
  copay_amount integer NOT NULL,
  meal_cost integer NOT NULL DEFAULT 0,
  other_cost integer NOT NULL DEFAULT 0,
  total_amount integer NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','paid','overdue')),
  paid_at date,
  receipt_number varchar(30),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT billing_client_invoices_number_unique UNIQUE (invoice_number)
);

CREATE TABLE billing_returns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES offices(id),
  original_batch_id uuid NOT NULL REFERENCES billing_batches(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  return_date date NOT NULL,
  return_reason_code varchar(10),
  return_reason text,
  rebilling_batch_id uuid REFERENCES billing_batches(id),
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','rebilled','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. アラート
-- ============================================================

CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES offices(id),
  alert_type varchar(30) NOT NULL CHECK (alert_type IN ('cert_expiry','plan_review','billing_deadline','wage_payment','other')),
  severity varchar(10) NOT NULL CHECK (severity IN ('info','warning','critical')),
  title varchar(200) NOT NULL,
  message text NOT NULL,
  related_entity_type varchar(30),
  related_entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX idx_alerts_office_unread ON alerts(office_id, is_read, created_at);
CREATE INDEX idx_alerts_office_type ON alerts(office_id, alert_type);

-- ============================================================
-- 8. システム共通マスタ（全テナント共有）
-- ============================================================

CREATE TABLE service_code_masters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  revision_year integer NOT NULL,
  service_code varchar(6) NOT NULL,
  service_name varchar(200) NOT NULL,
  service_type varchar(10) NOT NULL,
  staffing_ratio varchar(10),
  capacity_range varchar(30),
  wage_tier varchar(50),
  units integer NOT NULL,
  effective_from date NOT NULL,
  effective_to date,
  CONSTRAINT service_code_masters_unique UNIQUE (revision_year, service_code)
);

CREATE TABLE addition_masters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  revision_year integer NOT NULL,
  addition_code varchar(20) NOT NULL,
  addition_name varchar(200) NOT NULL,
  calculation_type varchar(20) NOT NULL CHECK (calculation_type IN ('per_day','per_month','per_time','percentage')),
  units integer,
  percentage numeric(5,4),
  requirements jsonb,
  capacity_variations jsonb,
  effective_from date NOT NULL,
  effective_to date,
  CONSTRAINT addition_masters_unique UNIQUE (revision_year, addition_code)
);

CREATE TABLE unit_price_masters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  revision_year integer NOT NULL,
  area_code varchar(2) NOT NULL,
  area_name varchar(50) NOT NULL,
  unit_price numeric(6,4) NOT NULL,
  effective_from date NOT NULL,
  effective_to date
);

CREATE TABLE municipality_masters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  municipality_code varchar(6) NOT NULL,
  prefecture_name varchar(10) NOT NULL,
  municipality_name varchar(50) NOT NULL,
  area_code varchar(2) NOT NULL,
  CONSTRAINT municipality_masters_code_unique UNIQUE (municipality_code)
);

-- ============================================================
-- 9. updated_at 自動更新トリガー
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- テナント系テーブル
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organizations','offices','users','fiscal_years','office_additions',
    'work_types','wage_rules','staff_members',
    'clients','certificates','contracts',
    'attendances','attendance_work_details',
    'production_revenues','production_expenses','monthly_wages','monthly_wage_summaries',
    'billing_batches','billing_details','billing_client_invoices','billing_returns'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

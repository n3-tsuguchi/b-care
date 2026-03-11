-- ============================================================
-- B-Care Phase 2: 支援記録・個別支援計画
-- ============================================================

-- ============================================================
-- 1. 個別支援計画
-- ============================================================

CREATE TABLE individual_support_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES offices(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  plan_number integer NOT NULL DEFAULT 1,
  plan_start_date date NOT NULL,
  plan_end_date date NOT NULL,
  long_term_goal text,
  short_term_goal text,
  support_policy text,
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed','cancelled')),
  created_by uuid REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT isp_office_client_number UNIQUE (office_id, client_id, plan_number)
);

CREATE INDEX idx_isp_client ON individual_support_plans(client_id, status);
CREATE INDEX idx_isp_office ON individual_support_plans(office_id, status);

-- ============================================================
-- 2. 支援計画の目標
-- ============================================================

CREATE TABLE support_plan_goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id uuid NOT NULL REFERENCES individual_support_plans(id) ON DELETE CASCADE,
  goal_category varchar(50) NOT NULL CHECK (goal_category IN ('work','life_skills','health','social','independence','other')),
  goal_description text NOT NULL,
  support_content text,
  achievement_criteria text,
  sort_order integer NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','achieved','cancelled')),
  achieved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_spg_plan ON support_plan_goals(plan_id, status);

-- ============================================================
-- 3. 支援記録
-- ============================================================

CREATE TABLE support_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id uuid NOT NULL REFERENCES offices(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  attendance_id uuid REFERENCES attendances(id),
  record_date date NOT NULL,
  record_content text NOT NULL,
  health_status varchar(20) CHECK (health_status IN ('good','fair','poor')),
  mood varchar(20) CHECK (mood IN ('good','normal','low')),
  work_performance varchar(20) CHECK (work_performance IN ('excellent','good','fair','poor')),
  special_notes text,
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_records_client_date UNIQUE (office_id, client_id, record_date)
);

CREATE INDEX idx_sr_office_date ON support_records(office_id, record_date);
CREATE INDEX idx_sr_client ON support_records(client_id, record_date);

-- ============================================================
-- 4. 支援計画レビュー
-- ============================================================

CREATE TABLE support_plan_reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id uuid NOT NULL REFERENCES individual_support_plans(id) ON DELETE CASCADE,
  review_date date NOT NULL,
  review_type varchar(20) NOT NULL CHECK (review_type IN ('regular','interim','final')),
  overall_evaluation text,
  achievements text,
  challenges text,
  next_steps text,
  reviewer_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_spr_plan ON support_plan_reviews(plan_id);

-- ============================================================
-- 5. updated_at トリガー追加
-- ============================================================

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'individual_support_plans','support_plan_goals',
    'support_records','support_plan_reviews'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 6. RLS ポリシー
-- ============================================================

ALTER TABLE individual_support_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_plan_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_plan_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY isp_select ON individual_support_plans FOR SELECT USING (
  office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
);
CREATE POLICY isp_insert ON individual_support_plans FOR INSERT WITH CHECK (
  office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
);
CREATE POLICY isp_update ON individual_support_plans FOR UPDATE USING (
  office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
);

CREATE POLICY spg_select ON support_plan_goals FOR SELECT USING (
  plan_id IN (SELECT id FROM individual_support_plans WHERE office_id IN (SELECT office_id FROM users WHERE id = auth.uid()))
);
CREATE POLICY spg_insert ON support_plan_goals FOR INSERT WITH CHECK (
  plan_id IN (SELECT id FROM individual_support_plans WHERE office_id IN (SELECT office_id FROM users WHERE id = auth.uid()))
);
CREATE POLICY spg_update ON support_plan_goals FOR UPDATE USING (
  plan_id IN (SELECT id FROM individual_support_plans WHERE office_id IN (SELECT office_id FROM users WHERE id = auth.uid()))
);
CREATE POLICY spg_delete ON support_plan_goals FOR DELETE USING (
  plan_id IN (SELECT id FROM individual_support_plans WHERE office_id IN (SELECT office_id FROM users WHERE id = auth.uid()))
);

CREATE POLICY sr_select ON support_records FOR SELECT USING (
  office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
);
CREATE POLICY sr_insert ON support_records FOR INSERT WITH CHECK (
  office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
);
CREATE POLICY sr_update ON support_records FOR UPDATE USING (
  office_id IN (SELECT office_id FROM users WHERE id = auth.uid())
);

CREATE POLICY spr_select ON support_plan_reviews FOR SELECT USING (
  plan_id IN (SELECT id FROM individual_support_plans WHERE office_id IN (SELECT office_id FROM users WHERE id = auth.uid()))
);
CREATE POLICY spr_insert ON support_plan_reviews FOR INSERT WITH CHECK (
  plan_id IN (SELECT id FROM individual_support_plans WHERE office_id IN (SELECT office_id FROM users WHERE id = auth.uid()))
);
CREATE POLICY spr_update ON support_plan_reviews FOR UPDATE USING (
  plan_id IN (SELECT id FROM individual_support_plans WHERE office_id IN (SELECT office_id FROM users WHERE id = auth.uid()))
);

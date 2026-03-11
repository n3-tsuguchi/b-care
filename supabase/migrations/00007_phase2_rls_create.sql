-- ============================================================
-- Phase 2 RLSポリシー作成（can_access_office使用）
-- ============================================================

-- individual_support_plans
CREATE POLICY "individual_support_plans_select" ON individual_support_plans
  FOR SELECT USING (public.can_access_office(office_id));

CREATE POLICY "individual_support_plans_insert" ON individual_support_plans
  FOR INSERT WITH CHECK (public.can_access_office(office_id));

CREATE POLICY "individual_support_plans_update" ON individual_support_plans
  FOR UPDATE USING (public.can_access_office(office_id));

-- support_records
CREATE POLICY "support_records_select" ON support_records
  FOR SELECT USING (public.can_access_office(office_id));

CREATE POLICY "support_records_insert" ON support_records
  FOR INSERT WITH CHECK (public.can_access_office(office_id));

CREATE POLICY "support_records_update" ON support_records
  FOR UPDATE USING (public.can_access_office(office_id));

-- support_plan_goals
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

-- support_plan_reviews
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

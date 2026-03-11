-- ============================================================
-- B-Care: Row Level Security (RLS) ポリシー
-- ============================================================
-- 方針:
--   1. ユーザーは自法人(organization)のデータのみアクセス可能
--   2. office_id指定ユーザーは自事業所のデータのみ、NULL=全事業所アクセス可
--   3. システム共通マスタは全ユーザー読み取り可
-- ============================================================

-- ============================================================
-- ヘルパー関数（publicスキーマに配置）
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_user_organization_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_user_office_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT office_id FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.can_access_office(target_office_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.offices o ON o.organization_id = u.organization_id
    WHERE u.id = auth.uid()
      AND o.id = target_office_id
      AND (u.office_id IS NULL OR u.office_id = target_office_id)
  )
$$;

-- ============================================================
-- organizations
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_select" ON organizations
  FOR SELECT USING (id = public.current_user_organization_id());

CREATE POLICY "organizations_update" ON organizations
  FOR UPDATE USING (id = public.current_user_organization_id() AND public.current_user_role() = 'admin');

-- ============================================================
-- offices
-- ============================================================
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offices_select" ON offices
  FOR SELECT USING (
    organization_id = public.current_user_organization_id()
    AND (public.current_user_office_id() IS NULL OR id = public.current_user_office_id())
  );

CREATE POLICY "offices_insert" ON offices
  FOR INSERT WITH CHECK (
    organization_id = public.current_user_organization_id()
    AND public.current_user_role() = 'admin'
  );

CREATE POLICY "offices_update" ON offices
  FOR UPDATE USING (
    organization_id = public.current_user_organization_id()
    AND public.current_user_role() = 'admin'
  );

-- ============================================================
-- users
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select" ON users
  FOR SELECT USING (organization_id = public.current_user_organization_id());

CREATE POLICY "users_update_self" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "users_admin_manage" ON users
  FOR ALL USING (
    organization_id = public.current_user_organization_id()
    AND public.current_user_role() = 'admin'
  );

-- ============================================================
-- テナントデータ（office_id ベース）汎用ポリシー
-- ============================================================

-- clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_select" ON clients
  FOR SELECT USING (public.can_access_office(office_id) AND deleted_at IS NULL);

CREATE POLICY "clients_insert" ON clients
  FOR INSERT WITH CHECK (public.can_access_office(office_id));

CREATE POLICY "clients_update" ON clients
  FOR UPDATE USING (public.can_access_office(office_id));

-- certificates
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificates_select" ON certificates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients c WHERE c.id = certificates.client_id AND public.can_access_office(c.office_id))
  );

CREATE POLICY "certificates_insert" ON certificates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients c WHERE c.id = certificates.client_id AND public.can_access_office(c.office_id))
  );

CREATE POLICY "certificates_update" ON certificates
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM clients c WHERE c.id = certificates.client_id AND public.can_access_office(c.office_id))
  );

-- contracts
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_select" ON contracts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM clients c WHERE c.id = contracts.client_id AND public.can_access_office(c.office_id))
  );

CREATE POLICY "contracts_insert" ON contracts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM clients c WHERE c.id = contracts.client_id AND public.can_access_office(c.office_id))
  );

CREATE POLICY "contracts_update" ON contracts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM clients c WHERE c.id = contracts.client_id AND public.can_access_office(c.office_id))
  );

-- ============================================================
-- office_id を直接持つテーブル群（共通パターン）
-- ============================================================

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'fiscal_years','office_additions','work_types','wage_rules','staff_members',
    'attendances','production_revenues','production_expenses',
    'monthly_wages','monthly_wage_summaries',
    'billing_batches','billing_returns','alerts'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format(
      'CREATE POLICY "%I_select" ON %I FOR SELECT USING (public.can_access_office(office_id))',
      t, t
    );

    EXECUTE format(
      'CREATE POLICY "%I_insert" ON %I FOR INSERT WITH CHECK (public.can_access_office(office_id))',
      t, t
    );

    EXECUTE format(
      'CREATE POLICY "%I_update" ON %I FOR UPDATE USING (public.can_access_office(office_id))',
      t, t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 親テーブル経由でアクセス制御するテーブル
-- ============================================================

-- attendance_work_details (attendances 経由)
ALTER TABLE attendance_work_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_work_details_select" ON attendance_work_details
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM attendances a WHERE a.id = attendance_work_details.attendance_id AND public.can_access_office(a.office_id))
  );

CREATE POLICY "attendance_work_details_insert" ON attendance_work_details
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM attendances a WHERE a.id = attendance_work_details.attendance_id AND public.can_access_office(a.office_id))
  );

CREATE POLICY "attendance_work_details_update" ON attendance_work_details
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM attendances a WHERE a.id = attendance_work_details.attendance_id AND public.can_access_office(a.office_id))
  );

-- billing_details (billing_batches 経由)
ALTER TABLE billing_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_details_select" ON billing_details
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM billing_batches b WHERE b.id = billing_details.billing_batch_id AND public.can_access_office(b.office_id))
  );

CREATE POLICY "billing_details_insert" ON billing_details
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM billing_batches b WHERE b.id = billing_details.billing_batch_id AND public.can_access_office(b.office_id))
  );

CREATE POLICY "billing_details_update" ON billing_details
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM billing_batches b WHERE b.id = billing_details.billing_batch_id AND public.can_access_office(b.office_id))
  );

-- billing_addition_details (billing_details → billing_batches 経由)
ALTER TABLE billing_addition_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_addition_details_select" ON billing_addition_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM billing_details bd
      JOIN billing_batches b ON b.id = bd.billing_batch_id
      WHERE bd.id = billing_addition_details.billing_detail_id
      AND public.can_access_office(b.office_id)
    )
  );

CREATE POLICY "billing_addition_details_insert" ON billing_addition_details
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM billing_details bd
      JOIN billing_batches b ON b.id = bd.billing_batch_id
      WHERE bd.id = billing_addition_details.billing_detail_id
      AND public.can_access_office(b.office_id)
    )
  );

-- billing_client_invoices (billing_batches 経由)
ALTER TABLE billing_client_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_client_invoices_select" ON billing_client_invoices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM billing_batches b WHERE b.id = billing_client_invoices.billing_batch_id AND public.can_access_office(b.office_id))
  );

CREATE POLICY "billing_client_invoices_insert" ON billing_client_invoices
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM billing_batches b WHERE b.id = billing_client_invoices.billing_batch_id AND public.can_access_office(b.office_id))
  );

CREATE POLICY "billing_client_invoices_update" ON billing_client_invoices
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM billing_batches b WHERE b.id = billing_client_invoices.billing_batch_id AND public.can_access_office(b.office_id))
  );

-- ============================================================
-- システム共通マスタ（全認証ユーザーが読み取り可能）
-- ============================================================

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'service_code_masters','addition_masters','unit_price_masters','municipality_masters'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format(
      'CREATE POLICY "%I_select" ON %I FOR SELECT USING (auth.uid() IS NOT NULL)',
      t, t
    );
  END LOOP;
END;
$$;

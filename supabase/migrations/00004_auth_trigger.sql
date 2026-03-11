-- ============================================================
-- サインアップ時に organization / office / users を自動作成するトリガー
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  new_office_id uuid;
  v_org_name text;
  v_office_name text;
  v_office_number text;
  v_display_name text;
BEGIN
  -- メタデータから取得
  v_org_name := COALESCE(NEW.raw_user_meta_data->>'organization_name', '未設定法人');
  v_office_name := COALESCE(NEW.raw_user_meta_data->>'office_name', '未設定事業所');
  v_office_number := COALESCE(NEW.raw_user_meta_data->>'office_number', '0000000000');
  v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', '管理者');

  -- 法人を作成
  INSERT INTO public.organizations (name, corporate_type)
  VALUES (v_org_name, 'corporation')
  RETURNING id INTO new_org_id;

  -- 事業所を作成
  INSERT INTO public.offices (
    organization_id, office_number, name,
    service_type, staffing_ratio, capacity
  )
  VALUES (
    new_org_id, v_office_number, v_office_name,
    'type_1', '7.5_to_1', 20
  )
  RETURNING id INTO new_office_id;

  -- ユーザーレコードを作成（admin ロール）
  INSERT INTO public.users (
    id, organization_id, office_id,
    email, display_name, role
  )
  VALUES (
    NEW.id, new_org_id, new_office_id,
    NEW.email, v_display_name, 'admin'
  );

  -- デフォルトの年度設定を作成
  INSERT INTO public.fiscal_years (
    office_id, fiscal_year, start_date, end_date, is_current
  )
  VALUES (
    new_office_id,
    EXTRACT(YEAR FROM CURRENT_DATE)::integer,
    make_date(EXTRACT(YEAR FROM CURRENT_DATE)::integer, 4, 1),
    make_date(EXTRACT(YEAR FROM CURRENT_DATE)::integer + 1, 3, 31),
    true
  );

  -- デフォルトの工賃規程を作成
  INSERT INTO public.wage_rules (
    office_id, fiscal_year, calculation_method,
    base_hourly_rate, payment_day, payment_method
  )
  VALUES (
    new_office_id,
    EXTRACT(YEAR FROM CURRENT_DATE)::integer,
    'hourly', 250, 25, 'cash'
  );

  RETURN NEW;
END;
$$;

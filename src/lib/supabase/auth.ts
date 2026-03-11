import { createServerSupabaseClient } from "./server";

export type UserProfile = {
  id: string;
  organization_id: string;
  office_id: string | null;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
};

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, organization_id, office_id, email, display_name, role, is_active")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function getCurrentOfficeId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.office_id ?? null;
}

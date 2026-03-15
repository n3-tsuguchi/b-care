import { getOfficeId } from "./common";
import { createServerSupabaseClient } from "../server";

// ============================================================
// 個別支援計画 (Phase 2)
// ============================================================

export type SupportPlan = {
  id: string;
  office_id: string;
  client_id: string;
  plan_number: number;
  plan_start_date: string;
  plan_end_date: string;
  long_term_goal: string | null;
  short_term_goal: string | null;
  support_policy: string | null;
  status: string;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  family_name?: string;
  given_name?: string;
  client_number?: string | null;
  goals?: SupportPlanGoal[];
};

export type SupportPlanGoal = {
  id: string;
  plan_id: string;
  goal_category: string;
  goal_description: string;
  support_content: string | null;
  achievement_criteria: string | null;
  sort_order: number;
  status: string;
  achieved_at: string | null;
};

export type SupportPlanReview = {
  id: string;
  plan_id: string;
  review_date: string;
  review_type: string;
  overall_evaluation: string | null;
  achievements: string | null;
  challenges: string | null;
  next_steps: string | null;
  reviewer_id: string | null;
};

export async function getSupportPlans(): Promise<SupportPlan[]> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const { data: plans } = await supabase
    .from("individual_support_plans")
    .select("*")
    .eq("office_id", officeId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<SupportPlan[]>();

  if (!plans?.length) return [];

  const clientIds = [...new Set(plans.map((p) => p.client_id))];
  const { data: clients } = await supabase
    .from("clients")
    .select("id, family_name, given_name, client_number")
    .in("id", clientIds)
    .returns<{ id: string; family_name: string; given_name: string; client_number: string | null }[]>();

  const clientMap = new Map(clients?.map((c) => [c.id, c]) ?? []);

  return plans.map((p) => {
    const c = clientMap.get(p.client_id);
    return {
      ...p,
      family_name: c?.family_name ?? "",
      given_name: c?.given_name ?? "",
      client_number: c?.client_number ?? null,
    };
  });
}

export async function getSupportPlanDetail(planId: string): Promise<SupportPlan | null> {
  const officeId = await getOfficeId();
  const supabase = await createServerSupabaseClient();

  const { data: plan } = await supabase
    .from("individual_support_plans")
    .select("*")
    .eq("id", planId)
    .eq("office_id", officeId)
    .is("deleted_at", null)
    .returns<SupportPlan[]>()
    .single();

  if (!plan) return null;

  const { data: goals } = await supabase
    .from("support_plan_goals")
    .select("*")
    .eq("plan_id", planId)
    .order("sort_order", { ascending: true })
    .returns<SupportPlanGoal[]>();

  const { data: client } = await supabase
    .from("clients")
    .select("family_name, given_name, client_number")
    .eq("id", plan.client_id)
    .returns<{ family_name: string; given_name: string; client_number: string | null }[]>()
    .single();

  return {
    ...plan,
    goals: goals ?? [],
    family_name: client?.family_name ?? "",
    given_name: client?.given_name ?? "",
    client_number: client?.client_number ?? null,
  };
}

import { getCurrentUser } from "../auth";

export async function getOfficeId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user?.office_id) throw new Error("Office not found");
  return user.office_id;
}

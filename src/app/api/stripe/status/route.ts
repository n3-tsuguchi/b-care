import { NextResponse } from "next/server";
import { getSubscription, isSubscriptionActive } from "@/lib/subscription";

export async function GET() {
  const sub = await getSubscription();
  return NextResponse.json({
    ...sub,
    isActive: isSubscriptionActive(sub.status),
  });
}

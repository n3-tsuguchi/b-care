import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 認証不要のパス
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

// 認証済みだがサブスクリプション不要のパス（課金ページ自体、API）
const SUBSCRIPTION_FREE_PATHS = ["/subscription", "/api/stripe"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // セッションのリフレッシュ（重要: getUser()でトークンを検証・更新）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  const isApiPath = request.nextUrl.pathname.startsWith("/api");

  // 未認証 + 保護ページ → ログインページへリダイレクト
  if (!user && !isPublicPath && !isApiPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // 未認証 + API → 401レスポンス
  if (!user && isApiPath) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 認証済み + ログインページ → ダッシュボードへリダイレクト
  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // サブスクリプションチェック（認証済み + 保護ページのみ）
  const isSubscriptionFree = SUBSCRIPTION_FREE_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (user && !isApiPath && !isSubscriptionFree) {
    // usersテーブルからorganization_idを取得
    const { data: profile } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("organization_id", profile.organization_id)
        .in("status", ["trialing", "active"])
        .limit(1)
        .single();

      if (!sub) {
        const url = request.nextUrl.clone();
        url.pathname = "/subscription";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

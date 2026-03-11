"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import Link from "next/link";

export function SignupForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    organizationName: "",
    officeName: "",
    officeNumber: "",
    displayName: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.passwordConfirm) {
      setError("パスワードが一致しません");
      return;
    }

    if (formData.password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Supabase Auth でユーザー作成
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.displayName,
            organization_name: formData.organizationName,
            office_name: formData.officeName,
            office_number: formData.officeNumber,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (authData.user) {
        // 注: organization, office, users レコードは
        // Supabase の Database Function (trigger) で自動作成する想定
        // 下の00004_auth_trigger.sql で定義
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("登録中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">法人名</label>
          <input
            type="text"
            value={formData.organizationName}
            onChange={(e) => updateField("organizationName", e.target.value)}
            placeholder="例: 社会福祉法人 ○○会"
            required
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">事業所名</label>
            <input
              type="text"
              value={formData.officeName}
              onChange={(e) => updateField("officeName", e.target.value)}
              placeholder="例: ○○作業所"
              required
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">事業所番号</label>
            <input
              type="text"
              value={formData.officeNumber}
              onChange={(e) => updateField("officeNumber", e.target.value)}
              placeholder="10桁の番号"
              maxLength={10}
              required
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">お名前</label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => updateField("displayName", e.target.value)}
            placeholder="管理者名"
            required
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">メールアドレス</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="example@bcare.jp"
            required
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">パスワード</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="8文字以上"
              required
              minLength={8}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">パスワード確認</label>
            <input
              type="password"
              value={formData.passwordConfirm}
              onChange={(e) => updateField("passwordConfirm", e.target.value)}
              placeholder="再入力"
              required
              minLength={8}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          <UserPlus className="h-4 w-4" />
          {loading ? "登録中..." : "アカウントを作成"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          既にアカウントをお持ちの方は
          <Link href="/login" className="text-primary hover:underline ml-1">
            ログイン
          </Link>
        </p>
      </form>
    </Card>
  );
}

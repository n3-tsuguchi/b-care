import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground text-2xl font-bold">
            B
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">新規登録</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            事業所情報を入力してアカウントを作成
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}

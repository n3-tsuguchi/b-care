export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ログインページはサイドバーなしのレイアウト
  return <>{children}</>;
}

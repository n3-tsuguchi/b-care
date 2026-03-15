"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((path) => pathname.startsWith(path));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-[240px] transition-all duration-300">
        {children}
      </main>
    </div>
  );
}

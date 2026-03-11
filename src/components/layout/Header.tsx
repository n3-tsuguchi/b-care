"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, User, LogOut, X } from "lucide-react";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    await fetch("/auth/signout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const searchPages = [
    { label: "ダッシュボード", path: "/", keywords: "ダッシュボード トップ home" },
    { label: "利用者管理", path: "/clients", keywords: "利用者 クライアント 管理 一覧" },
    { label: "新規利用者登録", path: "/clients/new", keywords: "新規 登録 利用者 追加" },
    { label: "出席管理", path: "/attendance", keywords: "出席 欠席 出勤 attendance" },
    { label: "支援記録", path: "/support-records", keywords: "支援 記録 日報 support record" },
    { label: "個別支援計画", path: "/support-plans", keywords: "支援計画 個別 計画 目標 plan" },
    { label: "新規支援計画", path: "/support-plans/new", keywords: "新規 支援計画 作成" },
    { label: "工賃管理", path: "/wages", keywords: "工賃 賃金 給与 wage" },
    { label: "請求管理", path: "/billing", keywords: "請求 billing 国保連" },
    { label: "請求データ作成", path: "/billing/new", keywords: "請求 作成 新規 csv" },
    { label: "設定", path: "/settings", keywords: "設定 事業所 setting" },
  ];

  const filteredPages = searchQuery
    ? searchPages.filter(
        (p) =>
          p.label.includes(searchQuery) ||
          p.keywords.includes(searchQuery.toLowerCase())
      )
    : searchPages;

  const handleSearchSelect = (path: string) => {
    setShowSearch(false);
    setSearchQuery("");
    router.push(path);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-sm">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* 検索 */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>

        {showSearch && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
            />
            <div className="absolute right-16 top-full z-50 mt-1 w-80 rounded-lg border border-border bg-card shadow-lg">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="ページを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setShowSearch(false);
                      setSearchQuery("");
                    }
                    if (e.key === "Enter" && filteredPages.length > 0) {
                      handleSearchSelect(filteredPages[0].path);
                    }
                  }}
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto p-1">
                {filteredPages.map((page) => (
                  <button
                    key={page.path}
                    onClick={() => handleSearchSelect(page.path)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    {page.label}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {page.path}
                    </span>
                  </button>
                ))}
                {filteredPages.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    該当するページがありません
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* 通知 */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>

        {showNotifications && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowNotifications(false)}
            />
            <div className="absolute right-16 top-full z-50 mt-1 w-80 rounded-lg border border-border bg-card shadow-lg">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">通知</h3>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                <div className="rounded-md bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-800">
                    受給者証期限切れ間近
                  </p>
                  <p className="mt-1 text-xs text-amber-600">
                    期限切れが近い受給者証がないか利用者管理で確認してください
                  </p>
                </div>
                <div className="mt-2 rounded-md bg-blue-50 p-3">
                  <p className="text-xs font-medium text-blue-800">
                    請求締め切りのお知らせ
                  </p>
                  <p className="mt-1 text-xs text-blue-600">
                    毎月10日までに国保連への請求データを提出してください
                  </p>
                </div>
              </div>
              <div className="border-t border-border px-4 py-2">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    router.push("/");
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  ダッシュボードで確認
                </button>
              </div>
            </div>
          </>
        )}

        {/* ユーザーメニュー */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <span className="hidden md:inline">管理者</span>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  ログアウト
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

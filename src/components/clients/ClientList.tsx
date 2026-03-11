"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  disabilityTypeLabels,
  statusLabels,
  incomeCategoryLabels,
} from "@/lib/constants";
import type { ClientWithCertificate } from "@/lib/supabase/queries";
import { Plus, Search, Filter, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  clients: ClientWithCertificate[];
};

type FilterState = {
  status: string;
  disabilityType: string;
  expiringOnly: boolean;
};

export function ClientList({ clients }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: "",
    disabilityType: "",
    expiringOnly: false,
  });

  const hasActiveFilters = filters.status !== "" || filters.disabilityType !== "" || filters.expiringOnly;

  const filteredClients = clients.filter((client) => {
    const fullName = `${client.family_name}${client.given_name}${client.family_name_kana ?? ""}${client.given_name_kana ?? ""}`;
    const matchesSearch =
      fullName.includes(searchQuery) ||
      (client.client_number ?? "").includes(searchQuery);

    const matchesStatus = !filters.status || client.status === filters.status;
    const matchesDisability = !filters.disabilityType || client.disability_type === filters.disabilityType;
    const matchesExpiring = !filters.expiringOnly || (client.certificate && (() => {
      const diff = new Date(client.certificate.decision_end_date).getTime() - Date.now();
      return Math.ceil(diff / (1000 * 60 * 60 * 24)) <= 30;
    })());

    return matchesSearch && matchesStatus && matchesDisability && matchesExpiring;
  });

  const getDaysUntilExpiry = (endDate: string) => {
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-4">
      {/* ツールバー */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="氏名・利用者番号で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilter(!showFilter)}
              className={cn(hasActiveFilters && "border-primary text-primary")}
            >
              <Filter className="h-4 w-4" />
              フィルタ
              {hasActiveFilters && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  !
                </span>
              )}
            </Button>
            {showFilter && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowFilter(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-border bg-card p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">フィルタ</h4>
                    {hasActiveFilters && (
                      <button
                        onClick={() => setFilters({ status: "", disabilityType: "", expiringOnly: false })}
                        className="text-xs text-primary hover:underline"
                      >
                        クリア
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">状態</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="h-8 w-full rounded-md border border-border bg-card px-2 text-sm"
                      >
                        <option value="">すべて</option>
                        <option value="active">利用中</option>
                        <option value="suspended">休止中</option>
                        <option value="terminated">終了</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">障害種別</label>
                      <select
                        value={filters.disabilityType}
                        onChange={(e) => setFilters({ ...filters, disabilityType: e.target.value })}
                        className="h-8 w-full rounded-md border border-border bg-card px-2 text-sm"
                      >
                        <option value="">すべて</option>
                        <option value="physical">身体障害</option>
                        <option value="intellectual">知的障害</option>
                        <option value="mental">精神障害</option>
                        <option value="developmental">発達障害</option>
                        <option value="intractable">難病</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.expiringOnly}
                        onChange={(e) => setFilters({ ...filters, expiringOnly: e.target.checked })}
                        className="rounded border-border"
                      />
                      受給者証期限切れ間近のみ
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
          <Button size="sm" onClick={() => router.push("/clients/new")}>
            <Plus className="h-4 w-4" />
            新規登録
          </Button>
        </div>
      </div>

      {/* テーブル */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>利用者番号</TableHead>
              <TableHead>氏名</TableHead>
              <TableHead>障害種別</TableHead>
              <TableHead>区分</TableHead>
              <TableHead>受給者証期限</TableHead>
              <TableHead>負担上限</TableHead>
              <TableHead>状態</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => {
              const cert = client.certificate;
              const daysUntilExpiry = cert
                ? getDaysUntilExpiry(cert.decision_end_date)
                : null;
              const isExpiringSoon =
                daysUntilExpiry !== null && daysUntilExpiry <= 30;

              return (
                <TableRow key={client.id}>
                  <TableCell className="font-mono text-xs">
                    {client.client_number ?? "-"}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">
                        {client.family_name} {client.given_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {client.family_name_kana} {client.given_name_kana}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {disabilityTypeLabels[client.disability_type ?? ""] ?? "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {client.support_category
                        ? `区分${client.support_category}`
                        : "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {cert?.decision_end_date ?? "-"}
                      </span>
                      {isExpiringSoon && (
                        <Badge variant="danger">
                          残{daysUntilExpiry}日
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {cert ? (
                      <>
                        <span className="text-sm">
                          {cert.copay_limit === 0
                            ? "0円"
                            : `${cert.copay_limit.toLocaleString()}円`}
                        </span>
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({incomeCategoryLabels[cert.income_category] ?? "-"})
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        client.status === "active"
                          ? "success"
                          : client.status === "suspended"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {statusLabels[client.status] ?? client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/clients/${client.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <p className="text-sm text-muted-foreground">
        全{filteredClients.length}名の利用者を表示
      </p>
    </div>
  );
}

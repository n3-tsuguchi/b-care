"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyAttendanceStats } from "@/lib/supabase/queries";
import { formatDateShort } from "@/lib/utils";

type Props = {
  data: DailyAttendanceStats[];
  capacity: number;
};

export function AttendanceChart({ data, capacity }: Props) {
  const maxValue = capacity;

  return (
    <Card>
      <CardHeader>
        <CardTitle>直近の出席状況</CardTitle>
      </CardHeader>
      {data.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground">
          出席データがありません
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((day) => {
            const presentPercent = (day.present / maxValue) * 100;
            const latePercent = (day.late / maxValue) * 100;

            return (
              <div key={day.date} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-sm text-muted-foreground">
                  {formatDateShort(day.date)}
                </span>
                <div className="flex-1">
                  <div className="h-8 w-full overflow-hidden rounded-lg bg-muted">
                    <div className="flex h-full">
                      <div
                        className="bg-green-500 transition-all"
                        style={{ width: `${presentPercent}%` }}
                      />
                      <div
                        className="bg-amber-400 transition-all"
                        style={{ width: `${latePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex w-28 shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {day.present}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    {day.late}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    {day.absent}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          出席
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          遅刻
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
          欠席
        </span>
      </div>
    </Card>
  );
}

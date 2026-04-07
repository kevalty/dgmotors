"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DashboardDateFilterProps {
  selectedDate: string; // YYYY-MM-DD
}

export function DashboardDateFilter({ selectedDate }: DashboardDateFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goTo(dateStr: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("fecha", dateStr);
    router.push(`${pathname}?${params.toString()}`);
  }

  function prevDay() {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() - 1);
    goTo(d.toISOString().split("T")[0]);
  }

  function nextDay() {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + 1);
    goTo(d.toISOString().split("T")[0]);
  }

  function goToday() {
    goTo(new Date().toISOString().split("T")[0]);
  }

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const label = new Date(selectedDate + "T12:00:00").toLocaleDateString("es-EC", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevDay}>
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <CalendarDays className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-medium capitalize truncate">{label}</span>
      </div>

      <Input
        type="date"
        value={selectedDate}
        onChange={(e) => e.target.value && goTo(e.target.value)}
        className="h-8 w-36 text-sm"
      />

      <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextDay}>
        <ChevronRight className="w-4 h-4" />
      </Button>

      {!isToday && (
        <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={goToday}>
          Hoy
        </Button>
      )}
    </div>
  );
}

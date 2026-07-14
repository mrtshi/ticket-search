"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Clock,
  HelpCircle,
  Loader2,
  RotateCcw,
  Trash2,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ticket } from "@/lib/mock-data";
import { UploadReport } from "@/components/upload-report";
import {
  computeStatsByPeriod,
  getWaitingPartsTickets,
  computeDailyChart,
  PERIOD_LABELS,
  Period,
  StatsByStatus,
  countRepeatSerialNumbers,
} from "@/lib/stats";
import { toast } from "sonner";

const HOURS_24_MS = 24 * 60 * 60 * 1000;

const statusColors: Record<string, string> = {
  Утвержден: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400",
  "В работе": "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-400",
  Регистрация: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Ожидание запчастей": "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400",
};

function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] || "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300";
  return <Badge variant="outline" className={color}>{status}</Badge>;
}

function StatsTable({ data }: { data: StatsByStatus[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">Нет данных</p>;
  }
  return (
    <div className="space-y-1.5">
      {data.map((item) => (
        <div key={item.status} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
          <span className="text-sm font-medium">{item.status}</span>
          <span className="text-sm font-bold tabular-nums">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function DailyChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">Нет данных</p>;
  }
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-1">
      {data.map((item) => {
        const pct = (item.count / maxCount) * 100;
        return (
          <div key={item.date} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 shrink-0 text-right">{item.date}</span>
            <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-bold w-6 text-left">{item.count}</span>
          </div>
        );
      })}
    </div>
  );
}

function WaitingPartsList({ tickets }: { tickets: Ticket[] }) {
  if (tickets.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">Нет заявок</p>;
  }
  return (
    <div className="space-y-2">
      {tickets.map((t) => (
        <div key={`${t.ticketNumber}-${t.serialNumber}`} className="rounded-lg border bg-card p-3 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{t.ticketNumber}</span>
            <StatusBadge status={t.status} />
          </div>
          <p className="text-muted-foreground">{t.itemName}</p>
          <p className="text-xs text-muted-foreground">{t.address}</p>
        </div>
      ))}
    </div>
  );
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isStale(isoString: string): boolean {
  return Date.now() - new Date(isoString).getTime() > HOURS_24_MS;
}

function shortenPerformer(name: string): string {
  return name
    .replace(/^Индивидуальный предприниматель\s*/iu, "ИП ")
    .replace(/^Общество с ограниченной ответственностью\s*/iu, "ООО ");
}

const PERIOD_OPTIONS: Period[] = ["7d", "30d", "2026", "2025", "2024", "2023", "2022", "2021", "2020", "all"];

export function StatsDashboard({ onBackToSearch: _onBackToSearch }: { onBackToSearch?: () => void }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [uploadedAt, setUploadedAt] = useState<string | null>(null);
  const [archiveUploadedAt, setArchiveUploadedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("7d");
  const [selectedPerformer, setSelectedPerformer] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tickets")
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить данные");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setTickets(data.tickets);
          setUploadedAt(data.uploadedAt);
          setArchiveUploadedAt(data.archiveUploadedAt);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return <Card><CardContent className="py-8 text-center text-destructive">{error}</CardContent></Card>;
  }

  const performerList = Array.from(new Set(tickets.map((t) => t.performer))).sort();
  const filteredTickets = selectedPerformer ? tickets.filter((t) => t.performer === selectedPerformer) : tickets;
  const stats = computeStatsByPeriod(filteredTickets, selectedPeriod);
  const waitingParts = getWaitingPartsTickets(filteredTickets);
  const repeats = countRepeatSerialNumbers(filteredTickets);
  const dailyData = computeDailyChart(filteredTickets, selectedPeriod);

  const hasArchive = archiveUploadedAt !== null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold">Статистика</h1>
        <p className="text-sm text-muted-foreground">Всего заявок: {tickets.length}</p>

        {uploadedAt && (
          <p className="text-xs text-muted-foreground">
            Дата последней загрузки отчёта: {formatDate(uploadedAt)}
            {hasArchive && " (текущий период)"}
          </p>
        )}
        {hasArchive && archiveUploadedAt && (
          <p className="text-xs text-muted-foreground">Архив загружен: {formatDate(archiveUploadedAt)}</p>
        )}

        {uploadedAt && isStale(uploadedAt) && (
          <div className="mx-auto flex max-w-md items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Данные загружены более 24 часов назад. Рекомендуется загрузить свежий отчёт.</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <UploadReport onUploadComplete={() => setRefreshKey((k) => k + 1)} />
          <UploadReport label="Загрузить отчёт за предыдущий период" uploadUrl="/api/tickets/upload?type=archive" onUploadComplete={() => setRefreshKey((k) => k + 1)} />
          <Button variant="outline" size="sm" onClick={async () => {
            try {
              await fetch("/api/tickets/clear", { method: "POST" });
              localStorage.removeItem("polair_tickets");
              localStorage.removeItem("polair_archive_tickets");
              localStorage.removeItem("polair_uploaded_at");
              localStorage.removeItem("polair_archive_uploaded_at");
              toast.success("Данные удалены");
              setRefreshKey((k) => k + 1);
            } catch {
              toast.error("Ошибка при удалении");
            }
          }} className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
            Удалить данные
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setSelectedPerformer(null); setSelectedPeriod("7d"); }} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Сброс
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Исполнитель:</span>
            <Select value={selectedPerformer ?? ""} onValueChange={(v) => setSelectedPerformer(v === "" ? null : v)}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Все исполнители" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Все исполнители</SelectItem>
                {performerList.map((p) => (
                  <SelectItem key={p} value={p}>{shortenPerformer(p)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Период:</span>
            <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as Period)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>{PERIOD_LABELS[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Заявки по дням
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DailyChart data={dailyData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {selectedPeriod === "7d" && <Clock className="h-4 w-4 text-muted-foreground" />}
            {selectedPeriod === "30d" && <CalendarDays className="h-4 w-4 text-muted-foreground" />}
            {selectedPeriod !== "7d" && selectedPeriod !== "30d" && <CalendarDays className="h-4 w-4 text-muted-foreground" />}
            {selectedPerformer ? `${shortenPerformer(selectedPerformer)} — за ${PERIOD_LABELS[selectedPeriod].toLowerCase()}` : `За ${PERIOD_LABELS[selectedPeriod].toLowerCase()}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatsTable data={stats} />
          {repeats > 0 && (
            <div className="mt-3 border-t pt-3">
              <p className="text-sm text-muted-foreground">
                Повторные заявки: <span className="font-bold text-foreground">{repeats}</span> серийных номеров
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            Ожидание запчастей
            {waitingParts.length > 0 && (
              <Badge variant="outline" className="ml-auto bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400">
                {waitingParts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WaitingPartsList tickets={waitingParts} />
        </CardContent>
      </Card>

      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            toast("Что умеет сайт", {
              description: [
                "🔍 Поиск по номеру заявки — введите номер заявки",
                "🔍 Поиск по серийному номеру — введите серийный номер",
                "🔍 Поиск по исполнителю — введите имя исполнителя",
                "📊 Статистика — введите код 2218",
                "📈 График заявок по дням — на странице статистики",
                "📋 Список ожидания запчастей — на странице статистики",
                "🔄 Повторные заявки — считаются по серийным номерам",
                "👤 Фильтр по исполнителю — выберите в списке",
                "📅 Фильтр по периоду — выберите в списке",
                "🌙 Тёмная тема — кнопка в шапке",
                "❌ Очистка поиска — крестик в поле или клавиша Esc",
                "📁 Загрузка отчёта — кнопка на странице статистики",
                "🗑️ Удалить данные — кнопка на странице статистики",
              ].join("\n"),
              duration: 10000,
            });
          }}
          className="gap-2 text-muted-foreground"
        >
          <HelpCircle className="h-4 w-4" />
          Что умеет сайт
        </Button>
      </div>
    </div>
  );
}

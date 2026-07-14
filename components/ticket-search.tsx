"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsDashboard } from "@/components/stats-dashboard";
import { Ticket } from "@/lib/mock-data";
import { getStoredTickets } from "@/lib/local-storage";

const statusColors: Record<string, string> = {
  Утвержден: "bg-green-100 text-green-700 border-green-300",
  "В работе": "bg-cyan-100 text-cyan-700 border-cyan-300",
  Регистрация: "bg-yellow-100 text-yellow-700 border-yellow-300",
  "Ожидание запчастей":
    "bg-orange-100 text-orange-700 border-orange-300",
};

function StatusBadge({ status }: { status: string }) {
  const color =
    statusColors[status] ||
    "bg-slate-100 text-slate-700 border-slate-300";
  return (
    <Badge variant="outline" className={color}>
      {status}
    </Badge>
  );
}

function ResultCard({ ticket }: { ticket: Ticket }) {
  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Заявка {ticket.ticketNumber}</h2>
          <StatusBadge status={ticket.status} />
        </div>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-0.5">Номенклатура</p>
            <p className="text-sm font-medium">{ticket.itemName}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-0.5">Серийный номер</p>
            <p className="text-sm font-medium">{ticket.serialNumber}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-0.5">Дата заявки</p>
            <p className="text-sm font-medium">{ticket.date}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-0.5">Адрес</p>
            <p className="text-sm">{ticket.address}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground mb-0.5">Исполнитель</p>
            <p className="text-sm font-medium">{ticket.performer}</p>
          </div>
          {ticket.completionDate && (
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-0.5">
                Дата выполнения ремонта
              </p>
              <p className="text-sm font-medium">{ticket.completionDate}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TicketSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Ticket[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const stored = getStoredTickets();
    if (stored.length > 0) {
      setTickets(stored);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    if (trimmed === "2218") {
      setShowStats(true);
      setResults([]);
      setNotFound(false);
      setError(null);
      return;
    }

    setLoading(true);
    setResults([]);
    setNotFound(false);
    setError(null);

    try {
      const res = await fetch("/api/tickets");
      if (!res.ok) throw new Error("Ошибка загрузки данных");
      const data = await res.json();
      const allTickets: Ticket[] = data.tickets || [];

      const found = allTickets.filter(
        (t) =>
          t.ticketNumber === trimmed ||
          t.serialNumber === trimmed ||
          t.performer.toLowerCase().includes(trimmed.toLowerCase())
      );

      if (found.length > 0) {
        setResults(found);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Неизвестная ошибка";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setNotFound(false);
    setError(null);
    setShowStats(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClear();
    }
  };

  if (showStats) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <StatsDashboard onBackToSearch={handleClear} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Отслеживание заявок на ремонт оборудования
        </h1>
        <p className="text-sm text-muted-foreground">
          Введите номер заявки или серийный номер оборудования для получения
          информации
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="relative"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Номер заявки или серийный номер"
            className="flex h-14 w-full rounded-full border border-input bg-background pl-12 pr-12 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="flex items-center justify-center gap-2 text-destructive">
                <Info className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {notFound && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Ничего не найдено</p>
            </CardContent>
          </Card>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((ticket) => (
              <ResultCard key={`${ticket.ticketNumber}-${ticket.serialNumber}`} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

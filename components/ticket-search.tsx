"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  FileText,
  Hash,
  Calendar,
  CalendarCheck,
  MapPin,
  User,
  XCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsDashboard } from "@/components/stats-dashboard";
import { Ticket } from "@/lib/mock-data";
import { getStoredTickets, getStoredArchiveTickets, getStoredUploadedAt, getStoredArchiveUploadedAt } from "@/lib/local-storage";

const statusColors: Record<string, string> = {
  Утвержден: "bg-green-100 text-green-700 border-green-300",
  "В работе": "bg-cyan-100 text-cyan-700 border-cyan-300",
  Регистрация: "bg-yellow-100 text-yellow-700 border-yellow-300",
};

function ResultCard({ ticket }: { ticket: Ticket }) {
  const statusClass =
    statusColors[ticket.status] ||
    "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                Заявка {ticket.ticketNumber}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {ticket.itemName}
              </p>
            </div>
          </div>
          <Badge className={`${statusClass} shrink-0`}>{ticket.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
          <div className="mt-0.5 shrink-0">
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Адрес</p>
            <p className="text-sm font-medium">{ticket.address}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
          <div className="mt-0.5 shrink-0">
            <Hash className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Серийный номер</p>
            <p className="text-sm font-medium">{ticket.serialNumber}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
          <div className="mt-0.5 shrink-0">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Исполнитель</p>
            <p className="text-sm font-medium">{ticket.performer}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
          <div className="mt-0.5 shrink-0">
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Дата заявки</p>
            <p className="text-sm font-medium">{ticket.date}</p>
          </div>
        </div>
        {ticket.completionDate && (
          <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
            <div className="mt-0.5 shrink-0">
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Дата выполнения ремонта</p>
              <p className="text-sm font-medium">{ticket.completionDate}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TicketSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Ticket[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    if (restored) return;
    
    const storedTickets = getStoredTickets();
    const storedArchive = getStoredArchiveTickets();
    const storedUploadedAt = getStoredUploadedAt();
    const storedArchiveUploadedAt = getStoredArchiveUploadedAt();
    
    if (storedTickets.length > 0 || storedArchive.length > 0) {
      fetch("/api/tickets/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tickets: storedTickets,
          uploadedAt: storedUploadedAt,
          archiveTickets: storedArchive,
          archiveUploadedAt: storedArchiveUploadedAt,
        }),
      }).catch(() => {});
    }
    
    setRestored(true);
  }, [restored]);

  const fetchTickets = useCallback(async (): Promise<Ticket[]> => {
    const res = await fetch("/api/tickets");
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Не удалось загрузить данные");
    }
    const data = await res.json();
    return data.tickets;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setError(null);
    setResults([]);
    setNotFound(false);
    setShowStats(false);
    setLoading(true);

    if (trimmed === "2218") {
      setShowStats(true);
      setLoading(false);
      return;
    }

    try {
      const tickets = await fetchTickets();
      const q = trimmed.toLowerCase();

      const matched = tickets.filter(
        (t: Ticket) =>
          t.ticketNumber.toLowerCase() === q ||
          t.serialNumber.toLowerCase() === q
      );

      if (matched.length > 0) {
        setResults(matched);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setNotFound(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClear();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto text-center space-y-6">
      <p className="text-sm text-muted-foreground tracking-wide uppercase">
        Отслеживание заявок на ремонт оборудования
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Номер заявки или серийный номер"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-14 text-base pl-5 pr-12 shadow-sm"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Очистить поиск"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="h-14 px-8 gap-2 text-base font-medium shrink-0"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
          {loading ? "Поиск..." : "Найти"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground -mt-4">
        Введите номер заявки или серийный номер оборудования для получения информации
      </p>

      {error && (
        <div className="flex flex-col items-center gap-3 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-destructive font-medium">{error}</p>
        </div>
      )}

      {notFound && (
        <div className="flex flex-col items-center gap-3 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <XCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Ничего не найдено</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((ticket, index) => (
            <ResultCard
              key={`${ticket.ticketNumber}-${ticket.serialNumber}-${index}`}
              ticket={ticket}
            />
          ))}
        </div>
      )}

      {showStats && (
        <StatsDashboard
          onBackToSearch={() => {
            setShowStats(false);
            setQuery("");
            setResults([]);
            setNotFound(false);
            setError(null);
          }}
        />
      )}
    </div>
  );
}

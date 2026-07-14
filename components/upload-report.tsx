"use client";

import { useRef, useState } from "react";
import { Loader2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { saveTickets } from "@/lib/local-storage";
import { Ticket } from "@/lib/mock-data";

interface UploadReportProps {
  onUploadComplete: () => void;
  label?: string;
  uploadUrl?: string;
}

export function UploadReport({
  onUploadComplete,
  label = "Загрузить отчёт",
  uploadUrl = "/api/tickets/upload",
}: UploadReportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls") &&
      !file.name.endsWith(".csv")
    ) {
      toast.error("Пожалуйста, выберите файл формата .xlsx, .xls или .csv");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Загрузка отчёта...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка при загрузке файла");
      }

      const tickets: Ticket[] = data.tickets;
      const isArchive = uploadUrl.includes("type=archive");
      const uploadType = isArchive ? "archive" : "current";
      const uploadedAt: string = data.uploadedAt || new Date().toISOString();

      saveTickets(tickets, uploadType, uploadedAt);

      toast.success(`Отчёт загружен: ${data.count} заявок`, { id: toastId });
      onUploadComplete();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Неизвестная ошибка";
      toast.error(message, { id: toastId });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex justify-center">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={uploading}
        className="gap-2"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        {uploading ? "Загрузка..." : label}
      </Button>
    </div>
  );
}

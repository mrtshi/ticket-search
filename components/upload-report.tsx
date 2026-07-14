"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { saveTickets } from "@/lib/local-storage";

export function UploadReport({
  label = "Загрузить отчёт",
  uploadUrl = "/api/tickets/upload",
  onUploadComplete,
}: {
  label?: string;
  uploadUrl?: string;
  onUploadComplete?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading("Загрузка...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка загрузки");
      }

      const data = await res.json();

      // Сохраняем в localStorage как резервную копию
      const isArchive = uploadUrl.includes("type=archive");
      if (data.tickets) {
        saveTickets(data.tickets, isArchive);
      }

      toast.success(`Отчёт загружен: ${data.count} заявок`, { id: toastId });
      onUploadComplete?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка загрузки", {
        id: toastId,
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
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
          <Upload className="h-4 w-4" />
        )}
        {label}
      </Button>
    </>
  );
}

import { sheetConfig } from "./sheet-config";

export function hasCsvUrl(): boolean {
  return !!sheetConfig.csvUrl;
}

export async function fetchCsvValues(): Promise<string[][]> {
  if (!sheetConfig.csvUrl) {
    throw new Error("CSV URL не настроен. Укажите csvUrl в lib/sheet-config.ts");
  }

  const response = await fetch(sheetConfig.csvUrl);

  if (!response.ok) {
    throw new Error(`Ошибка загрузки CSV: ${response.status}`);
  }

  const csvText = await response.text();
  const lines: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        current.push(field.trim());
        field = "";
      } else if (char === "\n" || (char === "\r" && next === "\n")) {
        current.push(field.trim());
        if (current.length > 0 && current.some((c) => c !== "")) {
          lines.push(current);
        }
        current = [];
        field = "";
        if (char === "\r") i++;
      } else if (char === "\r") {
        current.push(field.trim());
        if (current.length > 0 && current.some((c) => c !== "")) {
          lines.push(current);
        }
        current = [];
        field = "";
      } else {
        field += char;
      }
    }
  }

  if (field.trim() || current.length > 0) {
    current.push(field.trim());
    if (current.some((c) => c !== "")) {
      lines.push(current);
    }
  }

  return lines;
}

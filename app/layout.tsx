import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Search } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";

const appName = "Polair";

export const metadata: Metadata = {
  title: appName,
  description: "Поиск по заявкам и серийным номерам",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background flex flex-col">
        <ThemeProvider>
          <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-14 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold tracking-tight"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Search className="h-4 w-4" />
                </div>
                {appName}
              </Link>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t">
            <div className="container mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} {appName}
            </div>
          </footer>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

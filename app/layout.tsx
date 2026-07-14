import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
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
            <div className="container mx-auto px-4 h-14 flex items-center justify-center">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="https://www.polair.com/local/templates/cult/img/logo.svg"
                  alt="Polair"
                  width={100}
                  height={32}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
              <div className="absolute right-4">
                <ThemeToggle />
              </div>
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

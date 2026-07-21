import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Timesheet App",
  description: "Manage your time effectively",
};

import { Providers } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${prompt.variable} antialiased min-h-screen`}
        suppressHydrationWarning
      >
        <Providers>
          <TooltipProvider>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">{children}</main>
            <footer className="border-t border-stone-800/80 px-4 py-5 text-center text-xs font-medium text-stone-500">
              © 2026 TPT Team • Version 1.0
            </footer>
          </div>
          <Toaster />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}

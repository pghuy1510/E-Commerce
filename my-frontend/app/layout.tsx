"use client";

import type { ReactNode } from "react";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { PreferencesProvider } from "@/lib/i18n";
import TokenSynchronizer from "@/components/layout/TokenSynchronizer";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <TokenSynchronizer />
          <PreferencesProvider>{children}</PreferencesProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

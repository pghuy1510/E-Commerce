"use client";

import type { ReactNode } from "react";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { PreferencesProvider } from "@/lib/i18n";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <PreferencesProvider>{children}</PreferencesProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

"use client";

import type { ReactNode } from "react";
import "./globals.css";
import { SessionProvider } from "next-auth/react";


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

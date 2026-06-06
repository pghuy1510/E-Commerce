"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { PreferencesProvider } from "@/lib/i18n";
import TokenSynchronizer from "@/components/layout/TokenSynchronizer";
import CustomAlert from "@/components/layout/CustomAlert";

function ThemeInitializer() {
  useEffect(() => {
    const applyTheme = () => {
      const storedTheme = localStorage.getItem("theme") || "system";
      const root = document.documentElement;
      
      if (storedTheme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else if (storedTheme === "light") {
        root.classList.remove("dark");
        root.classList.add("light");
      } else {
        root.classList.remove("light");
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (isDark) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };

    applyTheme();

    window.addEventListener("storage", applyTheme);
    
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme === "system" || !storedTheme) {
        applyTheme();
      }
    };
    
    if (media.addEventListener) {
      media.addEventListener("change", handleSystemChange);
    } else {
      media.addListener(handleSystemChange);
    }

    return () => {
      window.removeEventListener("storage", applyTheme);
      if (media.removeEventListener) {
        media.removeEventListener("change", handleSystemChange);
      } else {
        media.removeListener(handleSystemChange);
      }
    };
  }, []);

  return null;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <TokenSynchronizer />
          <ThemeInitializer />
          <PreferencesProvider>
            <CustomAlert />
            {children}
          </PreferencesProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

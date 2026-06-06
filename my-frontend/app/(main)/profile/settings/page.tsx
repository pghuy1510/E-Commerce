"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Palette,
  Globe,
  Bell,
  Shield,
  Settings,
  CheckCircle2,
} from "lucide-react";
import { usePreferences } from "@/lib/i18n";
import { getBrowserToken } from "@/lib/auth-token";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { t } = usePreferences();

  const [hasAuth, setHasAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    const token = getBrowserToken() || session?.backendAccessToken;
    setHasAuth(Boolean(token));
    setLoading(false);
  }, [session]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      setTheme("system");
    }
  }, []);

  const handleSelectTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else if (newTheme === "light") {
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

    window.dispatchEvent(new Event("storage"));
  };

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 text-lg bg-brand-bg">
        {t("label.loading")}
      </div>
    );
  }

  if (!hasAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 text-lg bg-brand-bg">
        {t("settings.loginPrompt")}
      </div>
    );
  }

  const sideMenus = [
    { id: "appearance", label: t("settings.appearance"), icon: Palette, disabled: false },
    { id: "language", label: t("settings.language"), icon: Globe, disabled: true },
    { id: "notifications", label: t("settings.notifications"), icon: Bell, disabled: true },
    { id: "security", label: t("settings.security"), icon: Shield, disabled: true },
  ];

  const themes = [
    {
      id: "light" as const,
      label: t("settings.light"),
      desc: t("settings.lightDesc"),
      preview: (
        <div className="w-full h-24 rounded-xl p-3 border flex flex-col justify-between shadow-inner light-mode-mockup">
          <div className="flex items-center justify-between border-b pb-1.5 light-mode-mockup-border">
            <div className="w-10 h-2.5 rounded light-mode-mockup-text" />
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-[#a7794a]" />
              <div className="w-3 h-3 rounded-full light-mode-mockup-text-muted" />
            </div>
          </div>
          <div className="flex-1 py-2 space-y-1.5">
            <div className="w-full h-2 rounded light-mode-mockup-text-muted" />
            <div className="w-3/4 h-2 rounded light-mode-mockup-text-muted" />
          </div>
          <div className="flex justify-end">
            <div className="w-8 h-4 rounded bg-[#a7794a]" />
          </div>
        </div>
      ),
    },
    {
      id: "dark" as const,
      label: t("settings.dark"),
      desc: t("settings.darkDesc"),
      preview: (
        <div className="w-full h-24 rounded-xl p-3 border flex flex-col justify-between shadow-inner dark-mode-mockup">
          <div className="flex items-center justify-between border-b pb-1.5 dark-mode-mockup-border">
            <div className="w-10 h-2.5 rounded dark-mode-mockup-text" />
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-[#a7794a]" />
              <div className="w-3 h-3 rounded-full dark-mode-mockup-text-muted" />
            </div>
          </div>
          <div className="flex-1 py-2 space-y-1.5">
            <div className="w-full h-2 rounded dark-mode-mockup-text-muted" />
            <div className="w-3/4 h-2 rounded dark-mode-mockup-text-muted" />
          </div>
          <div className="flex justify-end">
            <div className="w-8 h-4 rounded bg-[#a7794a]" />
          </div>
        </div>
      ),
    },
    {
      id: "system" as const,
      label: t("settings.system"),
      desc: t("settings.systemDesc"),
      preview: (
        <div className="w-full h-24 rounded-xl border overflow-hidden flex shadow-inner light-mode-mockup-system-border">
          {/* Light half */}
          <div className="w-1/2 h-full p-3 flex flex-col justify-between border-r light-mode-mockup light-mode-mockup-system-border-r">
            <div className="border-b pb-1.5 light-mode-mockup-border">
              <div className="w-6 h-2 rounded light-mode-mockup-text" />
            </div>
            <div className="flex-1 py-2">
              <div className="w-full h-2 rounded light-mode-mockup-text-muted" />
            </div>
            <div className="w-6 h-3 rounded bg-[#a7794a]" />
          </div>
          {/* Dark half */}
          <div className="w-1/2 h-full p-3 flex flex-col justify-between dark-mode-mockup">
            <div className="border-b pb-1.5 dark-mode-mockup-border">
              <div className="w-6 h-2 rounded dark-mode-mockup-text" />
            </div>
            <div className="flex-1 py-2">
              <div className="w-full h-2 rounded dark-mode-mockup-text-muted" />
            </div>
            <div className="w-6 h-3 rounded bg-[#a7794a]" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-brand-bg min-h-screen py-10 px-4 lg:px-10">
      <style dangerouslySetInnerHTML={{ __html: `
        .light-mode-mockup {
          background-color: #faf6ed !important;
          border-color: #eadfcc !important;
        }
        .light-mode-mockup-border {
          border-bottom-color: rgba(234, 223, 204, 0.5) !important;
        }
        .light-mode-mockup-text {
          background-color: rgba(59, 47, 35, 0.2) !important;
        }
        .light-mode-mockup-text-muted {
          background-color: rgba(59, 47, 35, 0.1) !important;
        }

        .light-mode-mockup-system-border {
          border-color: #eadfcc !important;
        }
        .light-mode-mockup-system-border-r {
          border-right-color: rgba(234, 223, 204, 0.5) !important;
        }

        .dark-mode-mockup {
          background-color: #1e150f !important;
          border-color: #3b2f23 !important;
        }
        .dark-mode-mockup-border {
          border-bottom-color: rgba(59, 47, 35, 0.55) !important;
        }
        .dark-mode-mockup-text {
          background-color: rgba(247, 243, 236, 0.2) !important;
        }
        .dark-mode-mockup-text-muted {
          background-color: rgba(247, 243, 236, 0.1) !important;
        }
      `}} />
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        
        {/* SIDEBAR */}
        <aside className="bg-brand-surface rounded-3xl border border-brand-border p-6 h-fit shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-brand-border pb-5">
            <div className="w-14 h-14 rounded-full bg-brand-bg flex items-center justify-center">
              <Settings className="w-7 h-7 text-brand-muted" />
            </div>
            <div>
              <h3 className="font-semibold text-brand-text">{t("settings.title")}</h3>
              <p className="text-sm text-brand-muted">{t("header.settings")}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {sideMenus.map((menu) => {
              const Icon = menu.icon;
              return (
                <button
                  key={menu.id}
                  disabled={menu.disabled}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all duration-200 text-left ${
                    menu.id === "appearance"
                      ? "bg-brand-primary-light/40 border-brand-border text-brand-primary font-semibold"
                      : "bg-brand-surface border-transparent text-brand-muted opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span>{menu.label}</span>
                  </div>
                  {menu.disabled && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full shrink-0">
                      {t("settings.comingSoon")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="border-t pt-5">
            <Link
              href="/profile"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-brand-border hover:border-brand-primary rounded-2xl text-sm font-semibold text-brand-primary hover:bg-brand-primary-light/10 transition duration-200"
            >
              {t("settings.profileBack")}
            </Link>
          </div>
        </aside>

        {/* CONTENT */}
        <section className="bg-brand-surface rounded-3xl border border-brand-border p-6 lg:p-10 shadow-sm text-brand-text">
          <div className="border-b border-brand-border pb-5 mb-8">
            <h1 className="text-3xl font-bold text-brand-text">{t("settings.appearanceTitle")}</h1>
            <p className="text-brand-muted mt-2">{t("settings.appearanceSubtitle")}</p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {themes.map((tOpt) => {
              const isActive = theme === tOpt.id;
              return (
                <div
                  key={tOpt.id}
                  onClick={() => handleSelectTheme(tOpt.id)}
                  className={`cursor-pointer rounded-2xl border-2 p-5 flex flex-col gap-4 transition-all duration-300 ${
                    isActive
                      ? "border-brand-primary ring-2 ring-brand-primary/20 bg-brand-primary-light/10"
                      : "border-brand-border hover:border-brand-primary/50 bg-brand-surface"
                  }`}
                >
                  {tOpt.preview}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-brand-text text-sm">{tOpt.label}</h4>
                      <p className="text-xs text-brand-muted mt-1">{tOpt.desc}</p>
                    </div>
                    {isActive && (
                      <CheckCircle2 size={20} className="text-brand-primary shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}

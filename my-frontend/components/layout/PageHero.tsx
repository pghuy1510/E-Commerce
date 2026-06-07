"use client";

import React from "react";
import Link from "next/link";
import { usePreferences } from "@/lib/i18n";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeroProps {
  title: string;
  eyebrow?: string; // Optional tag above title
  description?: string; // Optional description below title
  breadcrumbs: BreadcrumbItem[];
  centered?: boolean;
  variant?: "default" | "checkout" | "catalog";
  currentStep?: "cart" | "checkout" | "complete";
  className?: string;
}

export default function PageHero({
  title,
  eyebrow,
  description,
  breadcrumbs,
  centered = true,
  variant = "default",
  currentStep,
  className = "",
}: PageHeroProps) {
  const { t, language } = usePreferences();

  // Progress Steps for Checkout Variant
  const steps = [
    { id: "cart", label: t("nav.cart") || "Cart", href: "/cart" },
    { id: "checkout", label: t("label.checkout") || "Checkout", href: "/checkout" },
    { id: "complete", label: language === "vi" ? "Hoàn thành" : "Complete" },
  ];

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-r from-brand-primary-light/60 via-brand-surface to-brand-bg py-14 border-b border-brand-border/30 shadow-xs ${className}`}
    >
      {/* Premium radial gradient accent overlay */}
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(167,121,74,0.15),transparent_70%)] pointer-events-none"
      />

      <div
        className={`max-w-7xl mx-auto px-6 relative z-10 flex flex-col gap-2.5 ${
          centered ? "items-center text-center" : "items-start text-left"
        }`}
      >
        {/* Eyebrow Label */}
        {eyebrow && (
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-primary select-none">
            {eyebrow}
          </span>
        )}

        {/* Main Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-text tracking-tight font-serif-luxury">
          {title}
        </h1>

        {/* Optional Description */}
        {description && (
          <p className="text-sm text-brand-muted max-w-2xl font-medium leading-relaxed">
            {description}
          </p>
        )}

        {/* Breadcrumbs Navigation */}
        <nav className="flex flex-wrap items-center gap-2 text-xs text-brand-muted font-medium mt-1 select-none">
          <Link href="/" className="hover:text-brand-primary transition-colors">
            {t("label.home") || "Home"}
          </Link>
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <span className="text-brand-border/80 select-none">/</span>
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-brand-primary transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-brand-text/90">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Checkout Progress Steps */}
        {variant === "checkout" && currentStep && (
          <div className="mt-8 flex items-center justify-center gap-3 text-xs md:text-sm font-semibold max-w-md w-full border-t border-brand-border/40 pt-6">
            {steps.map((step, idx) => {
              const isActive = currentStep === step.id;
              const isPast =
                (currentStep === "checkout" && step.id === "cart") ||
                (currentStep === "complete" && ["cart", "checkout"].includes(step.id));

              return (
                <React.Fragment key={step.id}>
                  {idx > 0 && (
                    <span className="h-[1px] flex-1 bg-brand-border/65 min-w-[32px] max-w-[64px]" />
                  )}
                  {step.href && !isActive ? (
                    <Link
                      href={step.href}
                      className={`transition duration-200 ${
                        isPast
                          ? "text-brand-primary hover:text-brand-primary-hover font-bold"
                          : "text-brand-muted hover:text-brand-primary"
                      }`}
                    >
                      {step.label}
                    </Link>
                  ) : (
                    <span
                      className={`${
                        isActive
                          ? "text-brand-primary font-black scale-105"
                          : "text-brand-muted/70 font-medium"
                      }`}
                    >
                      {step.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

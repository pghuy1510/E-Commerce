"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sparkles, CalendarClock } from "lucide-react";
import type { Deal } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

interface HomeFlashSaleBannerProps {
  deal: Deal;
  serverTime: string;
}

export default function HomeFlashSaleBanner({ deal, serverTime }: HomeFlashSaleBannerProps) {
  const router = useRouter();
  const { t } = usePreferences();

  // State-based image fallback
  const [imageSrc, setImageSrc] = useState(deal.bannerUrl || "/img/sale.jpg");
  const [isExpired, setIsExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  // Client-to-server clock offset
  const [clockOffset, setClockOffset] = useState(0);

  // Calibrate clock offset on mount
  useEffect(() => {
    if (serverTime) {
      const offset = Date.now() - new Date(serverTime).getTime();
      setClockOffset(offset);
    }
  }, [serverTime]);

  // Image source update if deal props change
  useEffect(() => {
    setImageSrc(deal.bannerUrl || "/img/sale.jpg");
  }, [deal.bannerUrl]);

  // Countdown timer logic
  useEffect(() => {
    if (!deal.expiresAt) return;

    const updateTimer = () => {
      const adjustedNow = Date.now() - clockOffset;
      const targetTime = new Date(deal.expiresAt).getTime();
      const difference = targetTime - adjustedNow;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    // Initial update
    updateTimer();

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deal.expiresAt, clockOffset]);

  // Strict visibility check
  if (!deal.isActive || !deal.bannerEnabled || isExpired || !timeLeft) {
    return null;
  }

  // Sanitized CTA link
  const getSanitizedLink = (url?: string) => {
    if (!url) return "/deals";
    const trimmed = url.trim();
    if (trimmed.startsWith("/") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return "/deals";
  };

  const ctaUrl = getSanitizedLink(deal.bannerButtonUrl);
  const ctaText = deal.bannerButtonText || t("deals.flashSale.cta");
  const title = deal.bannerTitle || deal.name;
  const subtitle = deal.bannerSubtitle || deal.description || t("deals.flashSale.subtitle");

  const handleCtaClick = () => {
    if (ctaUrl.startsWith("http://") || ctaUrl.startsWith("https://")) {
      window.open(ctaUrl, "_blank", "noopener,noreferrer");
    } else {
      router.push(ctaUrl);
    }
  };

  return (
    <section className="w-full max-w-[1330px] mx-auto px-4 mt-10">
      <div className="relative min-h-[360px] md:h-[400px] rounded-3xl overflow-hidden group shadow-2xl border border-[#e8dfc7]">
        {/* Next.js optimized background Image */}
        <div className="absolute inset-0 transition-transform duration-1000 ease-out group-hover:scale-105">
          <Image
            src={imageSrc}
            alt="Promotion Banner Background"
            fill
            priority
            sizes="(max-w: 1280px) 100vw, 1280px"
            className="object-cover"
            onError={() => setImageSrc("/img/sale.jpg")}
          />
        </div>

        {/* Dynamic linear overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900/90 via-[#8b5e3c]/50 to-stone-900/80 transition-opacity duration-500 group-hover:opacity-95" />

        {/* Content container */}
        <div className="relative z-10 h-full w-full flex flex-col lg:flex-row items-center justify-between p-6 md:p-12 gap-8">
          
          {/* Info Side */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left text-white max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs md:text-sm font-black tracking-widest text-[#fbd38d] bg-white/10 backdrop-blur-md px-4 py-2 rounded-full uppercase border border-white/20 mb-4 animate-pulse">
              <Sparkles size={14} className="text-amber-300 animate-spin-slow" />
              {t("deals.flashSale.event")}
            </span>

            <h2 className="font-serif italic font-extrabold text-3xl md:text-5xl leading-tight drop-shadow-xl text-transparent bg-clip-text bg-gradient-to-b from-white via-stone-100 to-amber-100 mb-4">
              {title}
            </h2>

            <p className="text-sm md:text-base text-gray-200/90 drop-shadow font-medium max-w-xl leading-relaxed">
              {subtitle}
            </p>

            <button
              type="button"
              onClick={handleCtaClick}
              className="relative mt-8 overflow-hidden bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-stone-900 px-8 py-3.5 rounded-full text-xs md:text-sm font-black tracking-wider uppercase transition-all shadow-lg shadow-amber-500/25 hover:shadow-xl hover:scale-105 duration-300 group/btn cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2">
                {ctaText}
              </span>
            </button>
          </div>

          {/* Countdown Clock Side */}
          <div className="flex flex-col items-center justify-center bg-stone-950/45 border border-white/10 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-inner min-w-[280px] md:min-w-[340px] animate-fadeIn">
            <div className="text-xs font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5 mb-4 select-none">
              <CalendarClock size={15} className="animate-bounce" />
              {t("deals.flashSale.timeLeft")}
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {/* Days cell */}
              {timeLeft.days > 0 && (
                <>
                  <div className="flex flex-col items-center">
                    <div className="bg-white/10 rounded-2xl w-14 h-14 md:w-16 md:h-16 flex items-center justify-center border border-white/15 shadow-md">
                      <span className="font-black text-xl md:text-2xl text-white tracking-tight">
                        {String(timeLeft.days).padStart(2, "0")}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-gray-300 mt-2 select-none">{t("deals.countdown.days")}</span>
                  </div>
                  <span className="text-xl md:text-2xl font-black text-white/50 -mt-6">:</span>
                </>
              )}

              {/* Hours cell */}
              <div className="flex flex-col items-center">
                <div className="bg-white/10 rounded-2xl w-14 h-14 md:w-16 md:h-16 flex items-center justify-center border border-white/15 shadow-md">
                  <span className="font-black text-xl md:text-2xl text-white tracking-tight">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-gray-300 mt-2 select-none">{t("deals.countdown.hours")}</span>
              </div>

              <span className="text-xl md:text-2xl font-black text-white/50 -mt-6">:</span>

              {/* Minutes cell */}
              <div className="flex flex-col items-center">
                <div className="bg-white/10 rounded-2xl w-14 h-14 md:w-16 md:h-16 flex items-center justify-center border border-white/15 shadow-md">
                  <span className="font-black text-xl md:text-2xl text-white tracking-tight">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-gray-300 mt-2 select-none">{t("deals.countdown.minutes")}</span>
              </div>

              <span className="text-xl md:text-2xl font-black text-white/50 -mt-6">:</span>

              {/* Seconds cell */}
              <div className="flex flex-col items-center">
                <div className="bg-white/10 rounded-2xl w-14 h-14 md:w-16 md:h-16 flex items-center justify-center border border-white/15 shadow-md">
                  <span className="font-black text-xl md:text-2xl text-amber-300 tracking-tight animate-pulse">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-amber-300 mt-2 select-none">{t("deals.countdown.seconds")}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

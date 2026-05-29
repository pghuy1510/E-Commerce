"use client";

import { usePreferences } from "@/lib/i18n";
import { useRouter } from "next/navigation";

export default function ParallaxBanner() {
  const { t } = usePreferences();
  const router = useRouter();

  return (
    <section className="w-full max-w-[1330px] mx-auto px-4 mt-20">
      <div className="relative h-[400px] rounded-2xl overflow-hidden group shadow-lg">
        {/* 🔥 BACKGROUND FIXED */}
        <div
          className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
          style={{
            backgroundImage: "url('/img/sale.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed", // 👈 KEY CHÍNH
          }}
        />

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900/70 via-[#8B5E3C]/50 to-stone-900/60 transition-opacity duration-500 group-hover:opacity-95" />

        {/* CONTENT (scroll bình thường) */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-4">
          <span className="text-xs md:text-sm font-bold tracking-widest text-[#f5d0a9] bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full uppercase border border-white/20 mb-4 animate-pulse">
            {t("parallax.get25Off")}
          </span>

          <h2 className="font-serif italic font-extrabold text-4xl md:text-6xl leading-tight max-w-3xl drop-shadow-xl text-transparent bg-clip-text bg-gradient-to-b from-white via-stone-100 to-amber-100">
            {t("parallax.titleLine1")} <br />
            {t("parallax.titleLine2")}
          </h2>

          <button
            type="button"
            onClick={() => router.push("/shop")}
            className="relative mt-8 overflow-hidden bg-white text-[#8B5E3C] px-8 py-3.5 rounded-full text-sm font-semibold tracking-wider uppercase transition shadow-md hover:shadow-xl hover:scale-105 duration-300 group/btn cursor-pointer">
            <span className="absolute inset-0 bg-[#8B5E3C] translate-x-[-100%] group-hover/btn:translate-x-0 transition-transform duration-500 ease-out"></span>

            <span className="relative z-10 group-hover/btn:text-white transition-colors duration-300">
              {t("action.shopNow")}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

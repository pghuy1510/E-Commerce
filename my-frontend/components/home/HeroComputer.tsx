"use client";

import Image from "next/image";
import { usePreferences } from "@/lib/i18n";

export default function HeroComputer() {
  const { t } = usePreferences();
  return (
    <section className="relative w-full h-[650px] overflow-hidden">
      {/* BACKGROUND IMAGE */}
      <Image
        src="/img/computer.avif"
        alt=""
        fill
        className="object-cover"
        priority
      />

      {/* CONTENT */}
      <div className="relative z-20 max-w-7xl mx-auto h-full flex items-center px-6">
        {/* TEXT LEFT */}
        <div className="text-black max-w-xl">
          {/* TAG */}
          <p className="text-sm mb-3 text-black">{t("heroComputer.tag")}</p>

          {/* TITLE */}
          <h1 className="text-5xl font-bold leading-tight mb-4">
            {t("heroComputer.titleLine1")} <br />
            {t("heroComputer.titleLine2")}
          </h1>

          {/* DESC */}
          <p className="text-black mb-6">{t("heroComputer.subtitle")}</p>

        </div>
      </div>
    </section>
  );
}

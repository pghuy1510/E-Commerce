"use client";

import { useEffect, useState } from "react";
import { usePreferences } from "@/lib/i18n";

type DealCountdownProps = {
  target: string;
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export default function DealCountdown({ target }: DealCountdownProps) {
  const { t } = usePreferences();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date(target).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(targetDate - now, 0);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [target]);

  return (
    <div className="flex gap-3">
      {[
        { label: t("deals.countdown.days"), value: timeLeft.days },
        { label: t("deals.countdown.hours"), value: timeLeft.hours },
        { label: t("deals.countdown.minutes"), value: timeLeft.minutes },
        { label: t("deals.countdown.seconds"), value: timeLeft.seconds },
      ].map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-2xl border border-gray-200 px-4 py-3 text-center min-w-[72px]">
          <p className="text-xl font-bold text-gray-900">{pad(item.value)}</p>
          <p className="text-xs uppercase text-gray-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

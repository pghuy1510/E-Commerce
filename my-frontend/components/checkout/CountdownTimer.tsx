"use client";

import React, { useEffect, useMemo, useState } from "react";

type CountdownTimerProps = {
  expiresAt: string | null;
  onExpire?: () => void;
};

export default function CountdownTimer({
  expiresAt,
  onExpire,
}: CountdownTimerProps) {
  const target = useMemo(
    () => (expiresAt ? new Date(expiresAt).getTime() : null),
    [expiresAt],
  );
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!target) return;

    const tick = () => {
      const diff = target - Date.now();
      setRemaining(diff > 0 ? diff : 0);
      if (diff <= 0 && onExpire) {
        onExpire();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target, onExpire]);

  if (!target) {
    return null;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return (
    <div className="rounded-2xl border border-sale/20 bg-sale/10 px-4 py-2 text-sm font-semibold text-sale">
      Expires in {minutes}:{seconds}
    </div>
  );
}

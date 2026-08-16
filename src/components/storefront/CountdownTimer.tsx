"use client";
import { useEffect, useRef, useState } from "react";

export default function CountdownTimer({
  endAt,
  className = "",
  onExpire,
}: {
  endAt: string;
  className?: string;
  onExpire?: () => void;
}) {
  // The initial render (SSR + hydration) must be deterministic: computing
  // Date.now() in the state initializer caused a server/client mismatch. We
  // render zeros until the client has mounted, then compute the real
  // countdown. The first tick is deferred so no state is set synchronously
  // inside the effect.
  const [remaining, setRemaining] = useState(0);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(new Date(endAt).getTime() - Date.now(), 0);
      setRemaining(ms);
      if (ms === 0) onExpireRef.current?.();
    };
    const interval = setInterval(tick, 1000);
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(interval);
      clearTimeout(first);
    };
  }, [endAt]);

  const totalSec = Math.floor(remaining / 1000);
  const values = [
    Math.floor(totalSec / 86400),
    Math.floor((totalSec % 86400) / 3600),
    Math.floor((totalSec % 3600) / 60),
    totalSec % 60,
  ];
  const labels = ["Days", "Hrs", "Min", "Sec"];
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {labels.map((label, i) => (
        <div key={label} className="flex flex-col items-center">
          <div className="bg-[#4A3B2C] text-white text-lg md:text-xl font-bold w-12 md:w-14 py-1.5 text-center rounded-none">
            {pad(values[i])}
          </div>
          <span className="text-[9px] uppercase tracking-widest text-[#4A3B2C] mt-1">{label}</span>
        </div>
      ))}
    </div>
  );
}

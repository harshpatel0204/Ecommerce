import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const totalSec = Math.floor(ms / 1000);
  return {
    h: Math.floor(totalSec / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
    done: ms <= 0,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Compact HH:MM:SS countdown for deal timers. Ticks every second. */
export function Countdown({ to, className = "" }: { to: Date | string | number; className?: string }) {
  const target = new Date(to).getTime();
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const parts: [string, number][] = [
    ["Hrs", t.h],
    ["Min", t.m],
    ["Sec", t.s],
  ];

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {parts.map(([label, val], i) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-gray-900 px-1.5 text-sm font-bold tabular-nums text-white">
              {pad(val)}
            </span>
            <span className="mt-0.5 text-[9px] font-medium uppercase text-muted-foreground">{label}</span>
          </div>
          {i < parts.length - 1 && <span className="pb-3 font-bold text-gray-400">:</span>}
        </div>
      ))}
    </div>
  );
}

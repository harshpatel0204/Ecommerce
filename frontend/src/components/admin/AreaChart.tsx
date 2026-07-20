import { useId } from "react";

/** Build a smooth cubic area + line path from a series of values. */
function buildPaths(values: number[], w = 100, h = 40, pad = 3) {
  const max = Math.max(...values, 1);
  const n = values.length;
  const pts = values.map((v, i): [number, number] => [
    n <= 1 ? 0 : (i / (n - 1)) * w,
    h - pad - (v / max) * (h - pad * 2),
  ]);
  if (pts.length === 0) return { line: "", area: "" };
  let line = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    line += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  const area = `${line} L ${pts[pts.length - 1][0]},${h} L ${pts[0][0]},${h} Z`;
  return { line, area };
}

interface Props {
  values: number[];
  labels: string[];
  className?: string;
}

/** Amber gradient-fill area chart used on the admin Dashboard + Analytics pages. */
export function AreaChart({ values, labels, className = "h-48" }: Props) {
  const gid = useId();
  const paths = buildPaths(values);

  return (
    <div className={`relative w-full ${className}`}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(245,158,11)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(245,158,11)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 10, 20, 30, 40].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" />
        ))}
        <path d={paths.area} fill={`url(#${gid})`} />
        <path
          d={paths.line}
          fill="none"
          stroke="rgb(245,158,11)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.5))" }}
        />
      </svg>
      {labels.length > 0 && (
        <div className="mt-2 flex justify-between text-[10px] text-slate-500">
          <span>{labels[0]}</span>
          <span>{labels[Math.floor(labels.length / 2)]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}

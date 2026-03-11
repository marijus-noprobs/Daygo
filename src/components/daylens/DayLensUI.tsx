import { ReactNode } from "react";
import { X } from "lucide-react";
import { scoreGradient, scoreLabel } from "@/lib/daylens-utils";

// ─── Glass Card ───────────────────────────────────────────────────────────────
export const GlassCard = ({
  children, className = "", onClick, style = {},
}: {
  children: ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties;
}) => (
  <div onClick={onClick} style={style}
    className={`glass rounded-3xl p-5 ${onClick ? "cursor-pointer hover:border-foreground/15 transition-colors" : ""} ${className}`}>
    {children}
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) => (
  <div className="flex justify-between items-end mb-4">
    <div>
      <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── Score Ring ───────────────────────────────────────────────────────────────
export const ScoreRing = ({ score, max = 5, size = 140, thick = 10 }: { score: number; max?: number; size?: number; thick?: number }) => {
  const r = (size - thick * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / max));
  const [c1, c2] = scoreGradient(score, max);
  const id = `gr-${size}-${Math.floor(score * 10)}-${max}`;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={thick} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={thick} strokeLinecap="round"
          strokeDasharray={`${pct * circ} ${circ}`} style={{ transition: "stroke-dasharray .8s cubic-bezier(.34,1.56,.64,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tracking-tighter">{typeof score === "number" ? score.toFixed(1) : score}</span>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1">{scoreLabel(score)}</span>
      </div>
    </div>
  );
};

// ─── List Input ───────────────────────────────────────────────────────────────
export const ListInput = ({ label, value, unit, onChange, min = 0, max = 9999, step = 1 }: {
  label: string; value: number; unit: string; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) => (
  <div className="flex items-center justify-between py-3.5 border-b border-secondary last:border-0">
    <span className="text-sm font-medium text-foreground/70">{label}</span>
    <div className="flex items-center gap-2">
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="bg-transparent text-right text-sm font-semibold text-foreground focus:outline-none w-16" />
      <span className="text-xs text-muted-foreground w-8 text-right">{unit}</span>
    </div>
  </div>
);

// ─── Mood Row ─────────────────────────────────────────────────────────────────
export const MoodRow = ({ label, value, onChange, max = 5 }: {
  label: string; value: number; onChange: (v: number) => void; max?: number;
}) => {
  const [c1] = scoreGradient(value, max);
  return (
    <div className="mb-5">
      <div className="flex justify-between mb-2.5">
        <span className="text-sm font-medium text-foreground/70">{label}</span>
        <span className="text-sm font-semibold" style={{ color: c1 }}>{value}/{max}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: max }, (_, i) => i + 1).map(v => (
          <button key={v} onClick={() => onChange(v)}
            className={`flex-1 h-9 rounded-xl text-xs font-semibold transition-all duration-200 ${
              value === v ? "text-foreground shadow-lg scale-105" : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground/70"
            }`}
            style={value === v ? {
              background: `linear-gradient(135deg,${scoreGradient(v, max).join(",")})`,
              boxShadow: `0 4px 14px ${scoreGradient(v, max)[0]}40`
            } : {}}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Stat Tile ────────────────────────────────────────────────────────────────
export const StatTile = ({ label, value, unit, colorClass, icon: Icon }: {
  label: string; value: string | number; unit: string; colorClass: string;
  icon: React.ComponentType<any>;
}) => (
  <div className="bg-secondary/60 rounded-2xl p-4">
    <div className="flex items-center gap-1.5 mb-1.5">
      <Icon className={`w-3.5 h-3.5 ${colorClass}`} size={14} />
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
    <div className={`text-xl font-bold tracking-tight ${colorClass}`}>
      {value}<span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
    </div>
  </div>
);

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
export const BottomSheet = ({ open, onClose, children, title }: {
  open: boolean; onClose: () => void; children: ReactNode; title?: string;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/75 backdrop-blur-sm fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-popover border border-foreground/10 rounded-t-3xl shadow-2xl scale-in" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-4 mb-5" />
        {title && <div className="px-6 pb-3"><h3 className="text-lg font-semibold text-foreground">{title}</h3></div>}
        <div className="px-6 pb-10 overflow-y-auto" style={{ maxHeight: "82vh" }}>{children}</div>
      </div>
    </div>
  );
};

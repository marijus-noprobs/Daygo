import { useMemo } from "react";
import { Shield } from "lucide-react";
import ParticleRing from "./ParticleRing";
import { computeRecovery, type RecoveryData } from "@/lib/whoop-utils";
import { avg, computeDayScore } from "@/lib/daylens-utils";
import type { DayEntry } from "@/lib/daylens-constants";

interface Props {
  entries: DayEntry[];
  recent: DayEntry[];
}

const statusColor = (s: "good" | "fair" | "poor") =>
  s === "good" ? "hsl(var(--primary))" : s === "fair" ? "rgba(255,255,255,0.5)" : "hsl(var(--color-red))";

const levelColor = (l: "green" | "yellow" | "red") =>
  l === "green" ? "hsl(var(--primary))" : l === "yellow" ? "rgba(255,255,255,0.5)" : "hsl(var(--color-red))";

export const RecoveryScreen = ({ entries, recent }: Props) => {
  const recovery = useMemo(() => recent[0] ? computeRecovery(recent[0], entries) : null, [entries, recent]);
  const history = useMemo(() =>
    recent.slice(0, 7).map(e => computeRecovery(e, entries)?.score || 50).reverse(),
    [entries, recent]
  );

  if (!recovery) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 fade-up">
        <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
          <Shield className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-[11px] text-center">No recovery data yet.<br />Sync your wearable to begin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28 fade-up">
      {/* Hero */}
      <div className="card-dark-gradient rounded-[22px] p-6 fade-up d1">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-5">Recovery</div>
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0" style={{ width: 130, height: 130 }}>
            <ParticleRing size={130} progress={recovery.score / 100} color={levelColor(recovery.level)} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-[34px] font-bold" style={{ color: levelColor(recovery.level), letterSpacing: '-0.04em' }}>
                {recovery.score}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">%</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="font-display text-[20px] font-extrabold" style={{ color: levelColor(recovery.level) }}>
              {recovery.label}
            </div>
            <p className="text-[11px] text-foreground/70 mt-2 leading-relaxed">{recovery.recommendation}</p>
          </div>
        </div>
      </div>

      {/* 7-day trend */}
      <div className="card-dark rounded-[18px] p-4 fade-up d2">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">7-Day Recovery</div>
        <div className="flex items-end gap-[6px] h-[60px]">
          {history.map((val, i) => {
            const h = Math.max(8, (val / 100) * 56);
            const color = val >= 67 ? "hsl(var(--primary))" : val >= 34 ? "rgba(255,255,255,0.35)" : "hsl(var(--color-red))";
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-md transition-all" style={{ height: h, background: color }} />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i} className="flex-1 text-center text-[8px] text-muted-foreground">{d}</span>
          ))}
        </div>
      </div>

      {/* Contributing factors */}
      <div className="card-dark rounded-[18px] p-4 fade-up d3">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">Contributing Factors</div>
        <div className="space-y-3">
          {recovery.factors.map(f => (
            <div key={f.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-[3px] h-6 rounded-full" style={{ background: statusColor(f.status) }} />
                <div>
                  <div className="text-[12px] font-bold text-foreground">{f.label}</div>
                  <div className="text-[10px] text-muted-foreground">{f.weight}% weight</div>
                </div>
              </div>
              <div className="font-mono text-[16px] font-bold" style={{ color: statusColor(f.status), letterSpacing: '-0.03em' }}>
                {f.value}{f.label === "SpO₂" ? "%" : f.label === "Sleep Score" ? "" : f.label === "Resting HR" ? " bpm" : " ms"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Training recommendation */}
      <div className="card-dark rounded-[18px] p-4 fade-up d4">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Training Zone</div>
        <div className="text-[13px] font-bold text-foreground mb-1">
          {recovery.level === "green" ? "All systems go" : recovery.level === "yellow" ? "Steady state" : "Rest & recover"}
        </div>
        <div className="text-[11px] text-foreground/60 leading-relaxed">
          {recovery.level === "green"
            ? "Push boundaries — HIIT, heavy lifts, or long endurance sessions are ideal today."
            : recovery.level === "yellow"
            ? "Moderate intensity — tempo runs, steady lifts, or skill-based training."
            : "Active recovery only — yoga, stretching, walking. Sleep early tonight."}
        </div>
      </div>
    </div>
  );
};

import { useMemo } from "react";
import { Flame } from "lucide-react";
import ParticleRing from "./ParticleRing";
import { computeLoad, type LoadData } from "@/lib/whoop-utils";
import { avg } from "@/lib/daylens-utils";
import type { DayEntry } from "@/lib/daylens-constants";

interface Props {
  entries: DayEntry[];
  recent: DayEntry[];
}

const loadColor = (score: number) =>
  score >= 18 ? "hsl(var(--color-red))" : score >= 14 ? "hsl(var(--primary))" : score >= 8 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)";

export const LoadScreen = ({ entries, recent }: Props) => {
  const load = useMemo(() => recent[0] ? computeLoad(recent[0]) : null, [recent]);
  const history = useMemo(() =>
    recent.slice(0, 7).map(e => computeLoad(e)?.score || 0).reverse(),
    [recent]
  );
  const weekTotal = useMemo(() => Math.round(history.reduce((s, v) => s + v, 0) * 10) / 10, [history]);

  if (!load) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 fade-up">
        <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
          <Flame className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-[11px] text-center">No load data yet.<br />Log a workout to begin tracking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28 fade-up">
      {/* Hero gauge */}
      <div className="card-dark-gradient rounded-[22px] p-6 fade-up d1">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-5">Day Strain</div>
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0" style={{ width: 130, height: 130 }}>
            <ParticleRing size={130} progress={Math.min(1, strain.score / 21)} color={strainColor(strain.score)} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-[34px] font-bold" style={{ color: strainColor(strain.score), letterSpacing: '-0.04em' }}>
                {strain.score.toFixed(1)}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">/21</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="font-display text-[18px] font-extrabold" style={{ color: strainColor(strain.score) }}>
              {strain.label}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Active Cal</div>
                <div className="font-mono text-[16px] font-bold text-foreground">{strain.activeKcal}</div>
              </div>
              <div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Peak HR</div>
                <div className="font-mono text-[16px] font-bold text-foreground">{strain.peakHR}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HR Zones */}
      <div className="card-dark rounded-[18px] p-4 fade-up d2">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">Heart Rate Zones</div>
        <div className="space-y-2">
          {strain.zones.map(z => {
            const maxMin = Math.max(...strain.zones.map(zone => zone.minutes), 1);
            const pct = (z.minutes / maxMin) * 100;
            return (
              <div key={z.zone} className="flex items-center gap-3">
                <div className="w-[40px] text-[10px] font-bold text-muted-foreground">Z{z.zone}</div>
                <div className="flex-1 h-[8px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: z.color }} />
                </div>
                <div className="w-[40px] text-right text-[10px] font-mono text-foreground">{z.minutes}m</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-day strain */}
      <div className="card-dark rounded-[18px] p-4 fade-up d3">
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">7-Day Strain</div>
          <div className="font-mono text-[14px] font-bold text-foreground">{weekTotal}<span className="text-[10px] text-muted-foreground ml-1">total</span></div>
        </div>
        <div className="flex items-end gap-[6px] h-[60px]">
          {history.map((val, i) => {
            const h = Math.max(6, (val / 21) * 56);
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full rounded-t-md" style={{ height: h, background: strainColor(val) }} />
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

      {/* Strain vs Recovery insight */}
      <div className="card-dark rounded-[18px] p-4 fade-up d4">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Strain Guidance</div>
        <p className="text-[11px] text-foreground/70 leading-relaxed">
          {strain.score >= 14
            ? "You've pushed hard today. Ensure tonight's sleep and tomorrow's recovery match this effort."
            : strain.score >= 8
            ? "Moderate strain — you've done solid work. Room for more intensity if recovery allows."
            : "Light strain day. If recovery is green, consider adding a workout session."}
        </p>
      </div>
    </div>
  );
};

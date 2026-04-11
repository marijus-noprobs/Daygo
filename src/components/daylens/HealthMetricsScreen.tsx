import { useMemo } from "react";
import { Heart, Moon, Activity } from "lucide-react";
import { HealthSuggestions } from "./HealthSuggestions";
import ParticleRing from "./ParticleRing";
import type { DayEntry } from "@/lib/daylens-constants";
import type { HealthSuggestion } from "@/lib/daylens-utils";
import { avg, computeDayScore } from "@/lib/daylens-utils";

interface HealthMetricsScreenProps {
  entries: DayEntry[];
  recent: DayEntry[];
  suggestions: HealthSuggestion[];
  detectedLevel: string | null;
  detectedLevelLabel: string | null;
}

/* ── Tiny sparkline (SVG) ──────────────────────────────── */
const Sparkline = ({ data, color, height = 28, width = 80 }: { data: number[]; color: string; height?: number; width?: number }) => {
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} className="mt-2">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ── Sleep ring chart (particle-based) ────────────────────── */
const SleepRing = ({ score, size = 110 }: { score: number; size?: number }) => {
  const pct = Math.max(0, Math.min(1, score / 100));
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <ParticleRing size={size} progress={pct} color="#ffffff" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[22px] font-bold text-foreground" style={{ letterSpacing: '-0.04em' }}>{score}</span>
        <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-semibold">score</span>
      </div>
    </div>
  );
};

/* ── Sleep stage bar ───────────────────────────────────── */
const SleepStageBar = ({ deep, rem, total }: { deep: number; rem: number; total: number }) => {
  const light = Math.max(0, total - deep - rem);
  const pctD = (deep / total) * 100, pctR = (rem / total) * 100, pctL = (light / total) * 100;
  return (
    <div className="mt-3">
      <div className="flex h-[6px] rounded-full overflow-hidden gap-[1px]">
        <div className="rounded-l-full" style={{ width: `${pctD}%`, background: 'hsl(var(--primary))' }} />
        <div style={{ width: `${pctR}%`, background: 'rgba(255,255,255,0.35)' }} />
        <div className="rounded-r-full" style={{ width: `${pctL}%`, background: 'rgba(255,255,255,0.1)' }} />
      </div>
      <div className="flex justify-between mt-2 text-[9px] text-muted-foreground">
        <span>Deep {deep.toFixed(1)}h</span>
        <span>REM {rem.toFixed(1)}h</span>
        <span>Light {light.toFixed(1)}h</span>
      </div>
    </div>
  );
};

/* ── Vital status color ────────────────────────────────── */
const vitalColor = (metric: string, val: number): string => {
  switch (metric) {
    case "hrv": return val >= 50 ? "hsl(var(--primary))" : val >= 35 ? "rgba(255,255,255,0.55)" : "hsl(var(--destructive))";
    case "hr": return val <= 60 ? "hsl(var(--primary))" : val <= 72 ? "rgba(255,255,255,0.55)" : "hsl(var(--destructive))";
    case "spo2": return val >= 96 ? "hsl(var(--primary))" : val >= 94 ? "rgba(255,255,255,0.55)" : "hsl(var(--destructive))";
    case "stress": return val <= 30 ? "hsl(var(--primary))" : val <= 55 ? "rgba(255,255,255,0.55)" : "hsl(var(--destructive))";
    default: return "rgba(255,255,255,0.55)";
  }
};

const getBatteryLabel = (val: number) => {
  if (val >= 75) return "Fully charged — high energy";
  if (val >= 50) return "Steady energy — pace yourself";
  if (val >= 25) return "Low — prioritize rest today";
  return "Depleted — recovery day recommended";
};

export const HealthMetricsScreen = ({ entries, recent, suggestions, detectedLevel, detectedLevelLabel }: HealthMetricsScreenProps) => {
  const latestEntry = recent[0];
  const body = latestEntry?.wearable?.body;
  const sleep = latestEntry?.wearable?.sleep;

  // AI narrative summary
  const aiSummary = useMemo(() => {
    if (!body || !sleep) return null;
    const parts: string[] = [];
    if (sleep.score >= 80) parts.push("sleep is strong");
    else if (sleep.score >= 60) parts.push("sleep was decent but could improve");
    else parts.push("sleep needs attention");
    if (body.hrv >= 50) parts.push("recovery looks excellent");
    else if (body.hrv >= 35) parts.push("recovery is moderate");
    else parts.push("your body is under stress");
    if (body.stressLevel > 55) parts.push("stress is elevated — consider a lighter day");
    return parts.length ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + ", " + parts.slice(1).join(", and ") + "." : null;
  }, [body, sleep]);

  if (!body || !sleep) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 fade-up">
        <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
          <Heart className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-[11px] text-center">No health data yet.<br />Sync your wearable to see metrics.</p>
      </div>
    );
  }

  // 7-day sparkline data
  const last7 = recent.slice(0, 7).reverse();
  const hrvData = last7.map(e => e.wearable?.body?.hrv || 0);
  const hrData = last7.map(e => e.wearable?.body?.restingHR || 0);
  const spo2Data = last7.map(e => e.wearable?.body?.spo2 || 0);
  const stressData = last7.map(e => e.wearable?.body?.stressLevel || 0);

  const avgHRV = Math.round(avg(last7.map(e => e.wearable?.body?.hrv || 0)));
  const avgHR = Math.round(avg(last7.map(e => e.wearable?.body?.restingHR || 0)));

  // Readiness interpretation
  const readinessText = body.bodyBattery >= 70 && body.hrv >= 50 && sleep.score >= 75
    ? "Your body is well-recovered and ready for high-intensity activity."
    : body.bodyBattery >= 40 && body.hrv >= 35
    ? "Moderate recovery — stick to steady activity and avoid overexertion."
    : "Your body needs rest. Prioritize sleep and light movement today.";

  return (
    <div className="space-y-4 pb-28 fade-up">
      {/* AI Coach Summary */}
      {aiSummary && (
        <div className="fade-up d1 px-1">
          <p className="font-display text-[15px] font-bold text-foreground leading-snug">{aiSummary}</p>
        </div>
      )}

      {/* ── SLEEP HERO CARD ─────────────────────────────── */}
      <div className="card-dark-gradient rounded-[22px] p-5 fade-up d1">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-4">Sleep</div>
        <div className="flex items-center gap-5">
          <SleepRing score={sleep.score} />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[28px] font-bold text-foreground leading-none" style={{ letterSpacing: '-0.03em' }}>
              {sleep.totalHours.toFixed(1)}<span className="text-[12px] text-muted-foreground ml-1 font-normal">hrs</span>
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
              <span>Bed {sleep.bedtime}</span>
              <span>Wake {sleep.wakeTime}</span>
            </div>
          </div>
        </div>
        <SleepStageBar deep={sleep.deepHours} rem={sleep.remHours} total={sleep.totalHours} />
      </div>

      {/* ── VITALS GRID (2x2) ──────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 fade-up d2">
        {[
          { label: "HRV", value: body.hrv, unit: "ms", metric: "hrv", data: hrvData, trend: `${body.hrv >= avgHRV ? "↑" : "↓"} ${Math.abs(body.hrv - avgHRV)}ms vs avg` },
          { label: "Resting HR", value: body.restingHR, unit: "bpm", metric: "hr", data: hrData, trend: `${body.restingHR <= avgHR ? "↓" : "↑"} ${Math.abs(body.restingHR - avgHR)} vs avg` },
          { label: "SpO₂", value: body.spo2, unit: "%", metric: "spo2", data: spo2Data, trend: body.spo2 >= 96 ? "Optimal" : "Below normal" },
          { label: "Stress", value: body.stressLevel, unit: "%", metric: "stress", data: stressData, trend: body.stressLevel <= 30 ? "Low" : body.stressLevel <= 55 ? "Moderate" : "High" },
        ].map(tile => {
          const color = vitalColor(tile.metric, tile.value);
          return (
            <div key={tile.label} className="card-dark rounded-[18px] p-4">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-1.5">{tile.label}</div>
              <div className="font-mono text-[24px] font-bold leading-none" style={{ color, letterSpacing: '-0.03em' }}>
                {tile.value}<span className="text-[10px] font-normal text-muted-foreground ml-0.5">{tile.unit}</span>
              </div>
              <Sparkline data={tile.data} color={color} />
              <div className="text-[9px] font-semibold mt-1.5" style={{ color }}>{tile.trend}</div>
            </div>
          );
        })}
      </div>

      {/* ── READINESS / RECOVERY ───────────────────────── */}
      <div className="card-dark rounded-[22px] p-5 fade-up d3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Body Battery</div>
          <div className="font-mono text-[18px] font-bold" style={{
            color: body.bodyBattery >= 60 ? 'hsl(var(--primary))' : body.bodyBattery >= 30 ? 'rgba(255,255,255,0.55)' : 'hsl(var(--destructive))',
            letterSpacing: '-0.03em',
          }}>
            {body.bodyBattery}<span className="text-[10px] text-muted-foreground font-normal">/100</span>
          </div>
        </div>
        {/* Horizontal gauge */}
        <div className="h-[6px] rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{
            width: `${body.bodyBattery}%`,
            background: body.bodyBattery >= 60 ? 'hsl(var(--primary))' : body.bodyBattery >= 30 ? 'rgba(255,255,255,0.35)' : 'hsl(var(--destructive))',
          }} />
        </div>
        <p className="text-[11px] text-foreground/70 mt-3 leading-relaxed">{readinessText}</p>
        <div className="text-[9px] text-muted-foreground mt-1">{getBatteryLabel(body.bodyBattery)}</div>
      </div>

      <HealthSuggestions suggestions={suggestions} detectedLevel={detectedLevel} detectedLevelLabel={detectedLevelLabel} />
    </div>
  );
};

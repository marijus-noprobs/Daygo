import { useMemo } from "react";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { GlassCard } from "./DayLensUI";
import type { DayEntry } from "@/lib/daylens-constants";
import {
  avg, computeDayScore, computeActivityCorrelations, detectAnomalies, formatDuration,
} from "@/lib/daylens-utils";

interface InsightScreenProps {
  entries: DayEntry[];
  recent: DayEntry[];
  isPro: boolean;
  onShowPricing: () => void;
}

/* ── Sparkline ─────────────────────────────────────────── */
const Sparkline = ({ data, color, height = 48, width }: { data: number[]; color: string; height?: number; width?: number }) => {
  if (data.length < 2) return null;
  const w = width || 200;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(" ");
  // fill area
  const areaPoints = `0,${height} ${points} ${w},${height}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="mt-1">
      <polygon points={areaPoints} fill={color} fillOpacity="0.08" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ── Pct change helper ─────────────────────────────────── */
const pctChange = (curr: number, prev: number) => {
  if (!prev) return null;
  return Math.round(((curr - prev) / prev) * 100);
};

const PctBadge = ({ pct }: { pct: number | null }) => {
  if (pct === null) return null;
  const positive = pct >= 0;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold" style={{
      color: positive ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
    }}>
      {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {positive ? "+" : ""}{pct}%
    </span>
  );
};

export const InsightScreen = ({ entries, recent, isPro, onShowPricing }: InsightScreenProps) => {
  const activityCorrelations = useMemo(() => computeActivityCorrelations(recent), [recent]);
  const anomalies = useMemo(() => detectAnomalies(recent), [recent]);

  const thisWeek = recent.slice(0, 7);
  const lastWeek = recent.slice(7, 14);
  const last7 = useMemo(() => [...thisWeek].reverse(), [thisWeek]);
  const scores = useMemo(() => last7.map(computeDayScore), [last7]);

  const avgScore = avg(thisWeek.map(computeDayScore));
  const prevAvgScore = lastWeek.length >= 3 ? avg(lastWeek.map(computeDayScore)) : null;

  const avgSleep = avg(thisWeek.map(e => e.wearable?.sleep?.totalHours || 0));
  const prevSleep = lastWeek.length >= 3 ? avg(lastWeek.map(e => e.wearable?.sleep?.totalHours || 0)) : null;

  const avgMood = avg(thisWeek.map(e => e.mood?.overallMood || 0));
  const prevMood = lastWeek.length >= 3 ? avg(lastWeek.map(e => e.mood?.overallMood || 0)) : null;

  const avgSteps = avg(thisWeek.map(e => e.wearable?.activity?.steps || 0));
  const prevSteps = lastWeek.length >= 3 ? avg(lastWeek.map(e => e.wearable?.activity?.steps || 0)) : null;

  const aiNarrative = useMemo(() => {
    const parts: string[] = [];
    const scoreDelta = prevAvgScore ? avgScore - prevAvgScore : 0;
    if (scoreDelta > 0.3) parts.push("Your overall wellness is trending up this week");
    else if (scoreDelta < -0.3) parts.push("Your scores have dipped compared to last week");
    else parts.push("You're holding steady this week");

    const topPositive = activityCorrelations.find(c => c.diff > 0.2);
    const topNegative = activityCorrelations.find(c => c.diff < -0.2);
    if (topNegative) parts.push(`${topNegative.label.toLowerCase()} is pulling your scores down`);
    if (topPositive) parts.push(`${topPositive.label.toLowerCase()} gives you a noticeable boost`);

    return parts.join(", ") + ".";
  }, [avgScore, prevAvgScore, activityCorrelations]);

  return (
    <div className="space-y-4 pb-28 fade-up">
      {/* AI Narrative */}
      <div className="px-1 fade-up d1">
        <p className="font-display text-[15px] font-bold text-foreground leading-snug">{aiNarrative.charAt(0).toUpperCase() + aiNarrative.slice(1)}</p>
      </div>

      {/* ── WEEKLY SNAPSHOT ─────────────────────────────── */}
      <div className="card-dark-gradient rounded-[22px] p-5 fade-up d1">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Day Score · 7 Days</div>
          <div className="font-mono text-[18px] font-bold text-foreground" style={{ letterSpacing: '-0.03em' }}>
            {avgScore.toFixed(1)}
          </div>
        </div>
        <Sparkline data={scores} color="hsl(var(--primary))" height={56} />
        <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
          {last7.map((e, i) => (
            <span key={i}>{new Date(e.date + "T12:00").toLocaleDateString("en", { weekday: "short" }).charAt(0)}</span>
          ))}
        </div>
      </div>

      {/* Quick-glance tiles */}
      <div className="grid grid-cols-3 gap-3 fade-up d2">
        {[
          { label: "Avg Sleep", value: avgSleep.toFixed(1) + "h", pct: pctChange(avgSleep, prevSleep || 0) },
          { label: "Avg Mood", value: avgMood.toFixed(1) + "/5", pct: pctChange(avgMood, prevMood || 0) },
          { label: "Avg Steps", value: (avgSteps / 1000).toFixed(1) + "k", pct: pctChange(avgSteps, prevSteps || 0) },
        ].map(t => (
          <div key={t.label} className="card-dark rounded-[16px] p-3 text-center">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{t.label}</div>
            <div className="font-mono text-[18px] font-bold text-foreground" style={{ letterSpacing: '-0.03em' }}>{t.value}</div>
            <div className="mt-1"><PctBadge pct={t.pct} /></div>
          </div>
        ))}
      </div>

      {/* ── ACTIVITY IMPACT CARDS ──────────────────────── */}
      {activityCorrelations.length > 0 && (
        <div className="space-y-3 fade-up d3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold px-1">What's Impacting You</div>
          {activityCorrelations.slice(0, 5).map(c => {
            const positive = c.diff > 0;
            const impactPct = Math.round(Math.abs(c.diff / (c.avgWithout || 1)) * 100);
            return (
              <div key={c.type} className="card-dark rounded-[18px] p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[13px] font-bold text-foreground">{c.label}</div>
                    <div className="text-[11px] text-foreground/70 mt-1 leading-relaxed">
                      {positive
                        ? `${c.label} boosts your next-day score by ${impactPct}%`
                        : `${c.label} drops your next-day score by ${impactPct}%`}
                    </div>
                    {c.avgDuration > 0 && (
                      <div className="text-[9px] text-muted-foreground mt-1">Avg {formatDuration(c.avgDuration)} · {c.sampleSize} days</div>
                    )}
                  </div>
                  <div className="font-mono text-[16px] font-bold flex-shrink-0 ml-3" style={{
                    color: positive ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
                  }}>
                    {positive ? "+" : ""}{c.diff.toFixed(2)}
                  </div>
                </div>
                {/* With vs Without comparison */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">With</div>
                    <div className="font-mono text-[14px] font-bold" style={{ color: positive ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>{c.avgWith}</div>
                  </div>
                  <div className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Without</div>
                    <div className="font-mono text-[14px] font-bold text-foreground/50">{c.avgWithout}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── COACH ALERTS ───────────────────────────────── */}
      {anomalies.length > 0 && (
        <div className="space-y-3 fade-up d4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold px-1">Coach Alerts</div>
          {anomalies.map((a, i) => (
            <div key={i} className="card-dark rounded-[18px] p-4 flex items-start gap-3" style={{ borderLeft: '3px solid hsl(var(--destructive))' }}>
              <AlertTriangle size={16} className="text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-[12px] font-bold text-foreground mb-0.5">{a.label} Alert</div>
                <p className="text-[11px] text-foreground/60 leading-relaxed">
                  {a.label === "HRV" && "We've noticed a drop in your HRV — try prioritizing an extra hour of sleep tonight."}
                  {a.label === "Mood" && "Your mood has been trending lower. Consider adding social time or a walk outdoors."}
                  {a.label === "Sleep" && "Sleep quality has declined. Try cutting screen time 30 minutes before bed."}
                  {a.label === "Anxiety" && "Anxiety levels are elevated. Deep breathing or meditation could help reset."}
                  {!["HRV", "Mood", "Sleep", "Anxiety"].includes(a.label) && `${a.label} is ${a.direction}. Consider adjusting your routine.`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pro upsell */}
      {!isPro && (
        <div className="card-dark rounded-[22px] p-4 flex items-center justify-between cursor-pointer fade-up d5" onClick={onShowPricing}>
          <div>
            <div className="font-display text-[13px] font-bold text-primary">Unlock Pro</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">AI insights, advanced trends & more</div>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-muted-foreground"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </div>
        </div>
      )}
    </div>
  );
};

import { useMemo, useState } from "react";
import { Moon, Heart, Footprints, Smile, Droplets, Sparkles, ArrowUp, ArrowDown } from "lucide-react";
import { GlassCard, SectionHeader } from "./DayLensUI";
import type { DayEntry } from "@/lib/daylens-constants";
import { avg, computeDayScore, formatDuration, computeActivityCorrelations } from "@/lib/daylens-utils";

interface PerfectDayScreenProps {
  entries: DayEntry[];
  isPro: boolean;
  onShowPricing: () => void;
}

export const PerfectDayScreen = ({ entries, isPro, onShowPricing }: PerfectDayScreenProps) => {
  const [aiPerfect, setAiPerfect] = useState("");
  const [loadingPD, setLoadingPD] = useState(false);

  const recent = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14), [entries]);
  const activityCorrelations = useMemo(() => computeActivityCorrelations(recent), [recent]);

  if (!isPro) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-5 fade-up">
      <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center font-display text-lg font-bold text-foreground">PD</div>
      <div><h2 className="text-xl font-semibold mb-2">Perfect Day Profile</h2><p className="text-sm text-muted-foreground max-w-[260px] mx-auto leading-relaxed">Unlock your personalized optimal day including ideal activity schedule.</p></div>
      <button onClick={onShowPricing} className="w-full bg-foreground text-background font-semibold py-4 rounded-2xl active:scale-95 transition-transform">Upgrade to Pro</button>
    </div>
  );

  if (entries.length < 7) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 fade-up">
      <h2 className="text-xl font-semibold">Not Enough Data</h2>
      <p className="text-sm text-muted-foreground">Log {7 - entries.length} more days.</p>
    </div>
  );

  const sorted = [...entries].sort((a, b) => computeDayScore(b) - computeDayScore(a));
  const best = sorted.slice(0, Math.max(3, Math.ceil(entries.length * 0.2)));
  const topPositive = activityCorrelations.filter(c => c.diff > 0)[0];
  const topNegative = activityCorrelations.filter(c => c.diff < 0)[0];

  const metrics = [
    { label: "Sleep", val: avg(best.map(e => e.wearable.sleep.totalHours)).toFixed(1), unit: "hrs", colorClass: "text-primary", icon: Moon },
    { label: "Deep Sleep", val: avg(best.map(e => e.wearable.sleep.deepHours)).toFixed(1), unit: "hrs", colorClass: "text-foreground/60", icon: Moon },
    { label: "HRV", val: Math.round(avg(best.map(e => e.wearable.body.hrv))), unit: "ms", colorClass: "text-foreground/60", icon: Heart },
    { label: "Steps", val: Math.round(avg(best.map(e => e.wearable.activity.steps))).toLocaleString(), unit: "", colorClass: "text-foreground/60", icon: Footprints },
    { label: "Mood", val: avg(best.map(e => e.mood.overallMood)).toFixed(1), unit: "/5", colorClass: "text-primary", icon: Smile },
    { label: "Water", val: avg(best.map(e => e.nutrition.waterLiters)).toFixed(1), unit: "L", colorClass: "text-foreground/60", icon: Droplets },
  ];

  return (
    <div className="space-y-5 pb-28 fade-up">
      <p className="text-xs text-muted-foreground px-1">Based on your top {best.length} best days.</p>
      <GlassCard>
        <SectionHeader title="Your Optimal Metrics" />
        {metrics.map((s, i, arr) => (
          <div key={s.label} className={`flex items-center py-3.5 ${i < arr.length - 1 ? "border-b border-secondary/60" : ""}`}>
            <s.icon className={`w-4 h-4 mr-3 ${s.colorClass}`} />
            <span className="text-sm text-foreground/70 flex-1">{s.label}</span>
            <span className={`text-sm font-semibold ${s.colorClass}`}>{s.val}<span className="text-muted-foreground font-normal text-xs ml-1">{s.unit}</span></span>
          </div>
        ))}
      </GlassCard>

      {(topPositive || topNegative) && (
        <GlassCard>
          <SectionHeader title="Activity Blueprint" subtitle="What your best days look like" />
          {topPositive && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/[0.06] border border-primary/[0.12] mb-3">
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[10px] font-bold uppercase text-primary" style={{ background: 'rgba(255,127,50,0.08)' }}>{topPositive.label.slice(0, 2)}</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-primary">{topPositive.label} — Do more of this</div>
                <div className="text-xs text-muted-foreground">+{topPositive.diff.toFixed(2)} next-day score · avg {formatDuration(topPositive.avgDuration)}</div>
              </div>
              <ArrowUp className="text-primary w-4 h-4" />
            </div>
          )}
          {topNegative && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/[0.06] border border-destructive/[0.12] mb-3">
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[10px] font-bold uppercase text-destructive" style={{ background: 'rgba(224,80,80,0.08)' }}>{topNegative.label.slice(0, 2)}</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-destructive">{topNegative.label} — Watch the timing</div>
                <div className="text-xs text-muted-foreground">{topNegative.diff.toFixed(2)} next-day score · esp. late at night</div>
              </div>
              <ArrowDown className="text-destructive w-4 h-4" />
            </div>
          )}
        </GlassCard>
      )}

      <GlassCard className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.05] blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary w-4 h-4" />
              <h3 className="text-sm font-semibold">AI Perfect Day</h3>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Tap Generate to get your personalized perfect day including ideal activity schedule.</p>
        </div>
      </GlassCard>
    </div>
  );
};

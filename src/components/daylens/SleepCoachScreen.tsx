import { useMemo } from "react";
import { Moon, Clock, TrendingUp, TrendingDown } from "lucide-react";
import ParticleRing from "./ParticleRing";
import { computeSleepCoach } from "@/lib/whoop-utils";
import type { DayEntry } from "@/lib/daylens-constants";

interface Props {
  entries: DayEntry[];
}

export const SleepCoachScreen = ({ entries }: Props) => {
  const coach = useMemo(() => computeSleepCoach(entries), [entries]);

  if (!coach) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 fade-up">
        <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
          <Moon className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-[11px] text-center">Not enough sleep data.<br />Log a few more nights.</p>
      </div>
    );
  }

  const debtColor = coach.sleepDebt > 10 ? "hsl(var(--color-red))" : coach.sleepDebt > 5 ? "rgba(255,255,255,0.5)" : "hsl(var(--primary))";

  return (
    <div className="space-y-4 pb-28 fade-up">
      {/* Sleep Debt Hero */}
      <div className="card-dark-gradient rounded-[22px] p-6 fade-up d1">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-5">Sleep Coach</div>
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
            <ParticleRing size={120} progress={Math.max(0.05, 1 - coach.sleepDebt / 20)} color={debtColor} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-[28px] font-bold" style={{ color: debtColor, letterSpacing: '-0.04em' }}>
                {coach.sleepDebt.toFixed(1)}
              </span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">hrs debt</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-foreground/70 leading-relaxed">
              {coach.sleepDebt <= 3
                ? "Your sleep bank is healthy. Keep it up."
                : coach.sleepDebt <= 8
                ? "Moderate sleep debt. Add 30 min to tonight's sleep."
                : "Significant sleep debt. Prioritize an early bedtime this week."}
            </div>
          </div>
        </div>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 gap-3 fade-up d2">
        <div className="card-dark rounded-[18px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Optimal Bedtime</span>
          </div>
          <div className="font-mono text-[24px] font-bold text-foreground" style={{ letterSpacing: '-0.03em' }}>
            {coach.optimalBedtime}
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">Based on your wake pattern</div>
        </div>

        <div className="card-dark rounded-[18px] p-4">
          <div className="flex items-center gap-2 mb-2">
            {coach.trend > 0 ? <TrendingUp className="w-3.5 h-3.5 text-primary" /> : <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" />}
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Avg Sleep</span>
          </div>
          <div className="font-mono text-[24px] font-bold text-foreground" style={{ letterSpacing: '-0.03em' }}>
            {coach.avgSleep.toFixed(1)}<span className="text-[10px] text-muted-foreground ml-1">hrs</span>
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">Need: {coach.sleepNeed}h / night</div>
        </div>
      </div>

      {/* Consistency Score */}
      <div className="card-dark rounded-[18px] p-4 fade-up d3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Bedtime Consistency</div>
          <div className="font-mono text-[18px] font-bold" style={{
            color: coach.consistencyScore >= 70 ? 'hsl(var(--primary))' : coach.consistencyScore >= 40 ? 'rgba(255,255,255,0.5)' : 'hsl(var(--color-red))',
            letterSpacing: '-0.03em',
          }}>
            {coach.consistencyScore}<span className="text-[10px] text-muted-foreground font-normal">/100</span>
          </div>
        </div>
        <div className="h-[6px] rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{
            width: `${coach.consistencyScore}%`,
            background: coach.consistencyScore >= 70 ? 'hsl(var(--primary))' : coach.consistencyScore >= 40 ? 'rgba(255,255,255,0.35)' : 'hsl(var(--color-red))',
          }} />
        </div>
        <p className="text-[11px] text-foreground/60 mt-3 leading-relaxed">
          {coach.consistencyScore >= 70
            ? "Excellent consistency. Regular bedtimes improve sleep quality and circadian rhythm."
            : coach.consistencyScore >= 40
            ? "Inconsistent bedtime detected. Try going to bed within a 30-minute window each night."
            : "Your bedtime varies widely. This disrupts your body clock and lowers sleep quality."}
        </p>
      </div>

      {/* Tips */}
      <div className="card-dark rounded-[18px] p-4 fade-up d4">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">Tonight's Tips</div>
        <div className="space-y-2.5">
          {coach.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-[3px] h-5 rounded-full mt-0.5" style={{ background: 'hsl(var(--primary))' }} />
              <p className="text-[12px] text-foreground/80 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

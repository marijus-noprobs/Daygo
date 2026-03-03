import { useMemo, useState } from "react";
import { Moon, Heart, Footprints, Smile, Info, Sparkles, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { GlassCard, SectionHeader, ScoreRing } from "./DayLensUI";
import type { DayEntry } from "@/lib/daylens-constants";
import {
  avg, pearson, computeDayScore, scoreGradient, formatDuration,
  isLateNight, computeActivityCorrelations, detectAnomalies,
  type ActivityCorrelation, type Anomaly,
} from "@/lib/daylens-utils";

interface InsightScreenProps {
  entries: DayEntry[];
  recent: DayEntry[];
  isPro: boolean;
  onShowPricing: () => void;
}

export const InsightScreen = ({ entries, recent, isPro, onShowPricing }: InsightScreenProps) => {
  const [insightTab, setInsightTab] = useState("overview");
  const [aiInsight, setAiInsight] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  const activityCorrelations = useMemo(() => computeActivityCorrelations(recent), [recent]);
  const biometricCorrelations = useMemo(() => {
    if (recent.length < 7) return [];
    const scores = recent.map(computeDayScore);
    return [
      { label: "Sleep hours", vals: recent.map(e => e.wearable.sleep.totalHours) },
      { label: "Deep sleep", vals: recent.map(e => e.wearable.sleep.deepHours) },
      { label: "HRV", vals: recent.map(e => e.wearable.body.hrv) },
      { label: "Steps", vals: recent.map(e => e.wearable.activity.steps) },
      { label: "Mood", vals: recent.map(e => e.mood.overallMood) },
      { label: "Anxiety", vals: recent.map(e => e.mood.anxiety) },
      { label: "Water", vals: recent.map(e => e.nutrition.waterLiters) },
      { label: "Protein", vals: recent.map(e => e.nutrition.proteinG) },
      { label: "Alcohol", vals: recent.map(e => e.nutrition.alcoholUnits) },
    ].map(m => ({ ...m, r: pearson(m.vals, scores) })).sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  }, [recent]);

  const anomalies = useMemo(() => detectAnomalies(recent), [recent]);

  if (entries.length < 3) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4 fade-up">
      <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-muted-foreground">
        <TrendingUp size={32} />
      </div>
      <h2 className="text-xl font-semibold">Gathering Data</h2>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">Log a few more days to unlock patterns and AI insights.</p>
    </div>
  );

  const last7 = [...recent].slice(0, 7).reverse();
  const tabs = ["overview", "activity", "correlations", "anomalies", "weekly"];

  return (
    <div className="space-y-5 pb-28 fade-up">
      <div className="flex p-1 bg-secondary/80 rounded-xl overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setInsightTab(t)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize whitespace-nowrap transition-all px-2 ${insightTab === t ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground/70"}`}>
            {t === "activity" ? "Impact" : t}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {insightTab === "overview" && (
        <>
          <GlassCard className="flex flex-col items-center py-6">
            <SectionHeader title="7-Day Trend" />
            <div className="flex items-end gap-2 w-full mt-2" style={{ height: 100 }}>
              {last7.map((e, i) => {
                const s = computeDayScore(e);
                const [c1] = scoreGradient(s);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-lg" style={{
                      height: `${(s / 5) * 80}px`,
                      background: `linear-gradient(180deg, ${c1}, ${c1}88)`,
                      transition: "height .5s ease",
                    }} />
                    <span className="text-[9px] text-muted-foreground">{new Date(e.date + "T12:00").toLocaleDateString("en", { weekday: "short" }).charAt(0)}</span>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Anomalies inline */}
          {anomalies.length > 0 && (
            <GlassCard style={{ borderLeft: `3px solid ${anomalies[0].color}` }}>
              <div className="flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Anomaly Detected</h3>
                  {anomalies.map((a, i) => (
                    <p key={i} className="text-xs text-foreground/60 leading-relaxed">
                      {a.label} is <span style={{ color: a.color }} className="font-semibold">{a.direction}</span> — {a.z}σ deviation
                    </p>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}

          <GlassCard>
            <SectionHeader title="14-Day Averages" />
            {[
              { label: "Sleep", val: avg(recent.map(e => e.wearable.sleep.totalHours)).toFixed(1), unit: "hrs", colorClass: "text-dl-indigo", icon: Moon },
              { label: "HRV", val: Math.round(avg(recent.map(e => e.wearable.body.hrv))), unit: "ms", colorClass: "text-dl-blue", icon: Heart },
              { label: "Steps", val: Math.round(avg(recent.map(e => e.wearable.activity.steps))).toLocaleString(), unit: "", colorClass: "text-dl-orange", icon: Footprints },
              { label: "Mood", val: avg(recent.map(e => e.mood.overallMood)).toFixed(1), unit: "/5", colorClass: "text-dl-yellow", icon: Smile },
            ].map((r, i, arr) => (
              <div key={r.label} className={`flex items-center justify-between py-3.5 ${i < arr.length - 1 ? "border-b border-secondary/60" : ""}`}>
                <div className="flex items-center gap-2.5">
                  <r.icon className={`w-4 h-4 ${r.colorClass}`} size={16} />
                  <span className="text-sm text-foreground/70">{r.label}</span>
                </div>
                <span className={`text-sm font-semibold ${r.colorClass}`}>{r.val}<span className="text-muted-foreground font-normal text-xs ml-1">{r.unit}</span></span>
              </div>
            ))}
          </GlassCard>

          {/* AI Analysis */}
          <GlassCard className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-dl-purple/[0.08] blur-3xl rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-dl-purple w-4 h-4" />
                  <h3 className="text-sm font-semibold">AI Analysis</h3>
                  {!isPro && <span className="bg-secondary text-[9px] px-2 py-0.5 rounded text-muted-foreground font-medium">PRO</span>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{isPro ? "Tap Generate to analyze your patterns." : "Upgrade to Pro to unlock AI analysis."}</p>
            </div>
          </GlassCard>
        </>
      )}

      {/* ACTIVITY IMPACT */}
      {insightTab === "activity" && (
        <>
          <div className="bg-secondary/50 border border-foreground/5 rounded-2xl p-4 text-sm text-muted-foreground leading-relaxed">
            <div className="flex items-start gap-2.5">
              <Info className="text-dl-indigo mt-0.5 flex-shrink-0 w-4 h-4" />
              <p>Shows how yesterday's activities affect today's wellness score. Based on your actual data.</p>
            </div>
          </div>

          {activityCorrelations.length === 0 ? (
            <GlassCard className="text-center py-8">
              <p className="text-sm text-muted-foreground">Log activities for at least 7 days to see impact patterns.</p>
            </GlassCard>
          ) : activityCorrelations.map((c) => {
            const positive = c.diff > 0;
            const [g1, g2] = positive ? ["#30D158", "#34C759"] : ["#FF453A", "#FF3B30"];
            return (
              <GlassCard key={c.type}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 border ${c.bgClass} ${c.borderClass}`}>
                      {c.emoji}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{c.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {c.avgDuration > 0 ? "Avg " + formatDuration(c.avgDuration) + " · " : ""}{c.sampleSize} days tracked
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className={`text-lg font-bold ${positive ? "text-dl-emerald" : "text-dl-red"}`}>
                      {positive ? "+" : ""}{c.diff.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">next-day score</div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Days with {c.label.toLowerCase()}</span>
                    <span className={`font-semibold ${positive ? "text-dl-emerald" : "text-dl-red"}`}>{c.avgWith} avg</span>
                  </div>
                  <div className="w-full h-2 bg-secondary/60 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: (c.avgWith / 5 * 100) + "%", background: `linear-gradient(90deg,${g1},${g2})`, transition: "width .7s ease" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Days without</span>
                    <span className="font-semibold text-foreground/70">{c.avgWithout} avg</span>
                  </div>
                  <div className="w-full h-2 bg-secondary/60 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-muted-foreground/40" style={{ width: (c.avgWithout / 5 * 100) + "%", transition: "width .7s ease" }} />
                  </div>
                </div>
                <div className={`mt-4 rounded-xl px-3 py-2.5 text-xs leading-relaxed border ${positive ? "bg-dl-emerald/[0.08] border-dl-emerald/20 text-dl-emerald" : "bg-dl-red/[0.08] border-dl-red/20 text-dl-red"}`}>
                  {positive
                    ? `Days after ${c.label.toLowerCase()} your score is ${c.diff.toFixed(2)} points higher on average.`
                    : `Days after ${c.label.toLowerCase()} your score drops by ${Math.abs(c.diff).toFixed(2)} points on average.`}
                </div>
              </GlassCard>
            );
          })}
        </>
      )}

      {/* CORRELATIONS */}
      {insightTab === "correlations" && (
        <GlassCard>
          <SectionHeader title="Metric Correlations" subtitle="How each metric relates to your overall score" />
          {biometricCorrelations.map((c, i) => {
            const isPos = c.r >= 0;
            const strength = Math.abs(c.r);
            const clr = strength > 0.5 ? (isPos ? "#30D158" : "#FF453A") : strength > 0.25 ? "#FFD60A" : "rgba(255,255,255,0.2)";
            return (
              <div key={c.label} className={`flex items-center gap-3 py-3.5 ${i < biometricCorrelations.length - 1 ? "border-b border-secondary/60" : ""}`}>
                <span className="text-sm text-foreground/70 flex-1">{c.label}</span>
                <div className="w-20 h-1.5 bg-secondary rounded-full relative overflow-hidden">
                  <div className="absolute top-0 bottom-0 rounded-full" style={{ width: (strength * 100) + "%", background: clr, left: isPos ? "50%" : undefined, right: isPos ? undefined : ((1 - strength) * 50) + "%" }} />
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-muted-foreground/30" />
                </div>
                <span className="text-xs font-mono font-bold w-10 text-right" style={{ color: clr }}>{isPos ? "+" : ""}{c.r.toFixed(2)}</span>
              </div>
            );
          })}
        </GlassCard>
      )}

      {/* ANOMALIES */}
      {insightTab === "anomalies" && (
        <>
          <p className="text-xs text-muted-foreground px-1 leading-relaxed">Comparing your last 3 days to your baseline.</p>
          {anomalies.length === 0
            ? <GlassCard className="text-center py-8"><div className="text-3xl mb-3">✅</div><h3 className="text-base font-semibold mb-1">All Clear</h3><p className="text-sm text-muted-foreground">No significant deviations detected.</p></GlassCard>
            : anomalies.map((a, i) => (
              <GlassCard key={i} style={{ borderLeft: `3px solid ${a.color}` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-semibold mb-1">{a.label}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {a.label} is <span style={{ color: a.color }} className="font-semibold">{a.direction}</span> — {a.z}σ from your baseline over the last 3 days.
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg font-semibold ml-3" style={{ background: a.color + "18", color: a.color }}>{a.direction.split(" ")[0]}</span>
                </div>
              </GlassCard>
            ))
          }
        </>
      )}

      {/* WEEKLY */}
      {insightTab === "weekly" && (() => {
        const thisWeek = recent.slice(0, 7), lastWeek = recent.slice(7, 14);
        if (thisWeek.length < 3) return <GlassCard className="text-center py-8"><p className="text-sm text-muted-foreground">Log at least 3 days this week.</p></GlassCard>;
        const rows = [
          { label: "Avg Score", tw: avg(thisWeek.map(computeDayScore)).toFixed(2), lw: lastWeek.length ? avg(lastWeek.map(computeDayScore)).toFixed(2) : "—", unit: "" },
          { label: "Sleep", tw: avg(thisWeek.map(e => e.wearable.sleep.totalHours)).toFixed(1), lw: lastWeek.length ? avg(lastWeek.map(e => e.wearable.sleep.totalHours)).toFixed(1) : "—", unit: "h" },
          { label: "HRV", tw: Math.round(avg(thisWeek.map(e => e.wearable.body.hrv))).toString(), lw: lastWeek.length ? Math.round(avg(lastWeek.map(e => e.wearable.body.hrv))).toString() : "—", unit: "ms" },
          { label: "Steps", tw: Math.round(avg(thisWeek.map(e => e.wearable.activity.steps))).toLocaleString(), lw: lastWeek.length ? Math.round(avg(lastWeek.map(e => e.wearable.activity.steps))).toLocaleString() : "—", unit: "" },
          { label: "Mood", tw: avg(thisWeek.map(e => e.mood.overallMood)).toFixed(1), lw: lastWeek.length ? avg(lastWeek.map(e => e.mood.overallMood)).toFixed(1) : "—", unit: "/5" },
        ];
        const lateNightDays = thisWeek.filter(e => (e.activities || []).some(a => isLateNight(a.startTime))).length;
        return (
          <>
            <GlassCard>
              <SectionHeader title="This Week vs Last" />
              {rows.map((r, i) => {
                const up = parseFloat(r.tw) >= parseFloat(r.lw);
                return (
                  <div key={r.label} className={`flex items-center justify-between py-3.5 ${i < rows.length - 1 ? "border-b border-secondary/60" : ""}`}>
                    <span className="text-sm text-muted-foreground">{r.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground/60">{r.lw}{r.unit}</span>
                      <ArrowRight className="text-muted-foreground/30 w-2.5 h-2.5" />
                      <span className={`text-sm font-semibold ${up ? "text-dl-emerald" : "text-dl-red"}`}>{r.tw}{r.unit}</span>
                      <span className="text-xs">{up ? "↑" : "↓"}</span>
                    </div>
                  </div>
                );
              })}
            </GlassCard>
            <GlassCard>
              <p className="text-sm text-foreground/70 leading-relaxed">
                You logged <strong className="text-foreground">{thisWeek.length} days</strong> this week.{" "}
                {lateNightDays > 0 && <span className="text-dl-orange">You had <strong>{lateNightDays} late-night activity session{lateNightDays !== 1 ? "s" : ""}</strong> — check the Activity Impact tab to see how they affected you. </span>}
                {avg(thisWeek.map(computeDayScore)) >= avg((lastWeek.length ? lastWeek : thisWeek).map(computeDayScore)) ? "📈 Trending up compared to last week." : "📉 Last week was slightly stronger — check your correlations for clues."}
              </p>
            </GlassCard>
          </>
        );
      })()}
    </div>
  );
};

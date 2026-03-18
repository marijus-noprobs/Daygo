import { useMemo, useState } from "react";
import { Moon, Heart, Footprints, Smile, Info, Sparkles, ArrowRight, TrendingUp, TrendingDown, FileText, Utensils, Droplets, Dumbbell } from "lucide-react";
import { GlassCard, SectionHeader, ScoreRing } from "./DayLensUI";
import type { DayEntry } from "@/lib/daylens-constants";
import {
  avg, pearson, computeDayScore, scoreGradient, formatDuration,
  isLateNight, computeActivityCorrelations, detectAnomalies,
  generateWeeklyReports,
  type ActivityCorrelation, type Anomaly, type WeeklyReport,
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
  const weeklyReports = useMemo(() => generateWeeklyReports(entries), [entries]);
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
      <div className="w-16 h-16 bg-white/[0.05] rounded-full flex items-center justify-center text-white/[0.22]">
        <TrendingUp size={32} />
      </div>
      <h2 className="font-display text-xl font-extrabold">Gathering Data</h2>
      <p className="text-[11px] text-white/[0.38] max-w-xs leading-relaxed">Log a few more days to unlock patterns and AI insights.</p>
    </div>
  );

  const last7 = [...recent].slice(0, 7).reverse();
  const tabs = ["overview", "activity", "correlations", "anomalies", "weekly", "reports"];

  return (
    <div className="space-y-4 pb-28 fade-up">
      <div className="font-display text-[22px] font-extrabold text-foreground tracking-tight">Trends</div>

      {/* Tab pills */}
      <div className="flex gap-[6px] overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setInsightTab(t)}
            className={`px-3.5 py-[7px] rounded-[20px] text-[11px] font-bold whitespace-nowrap flex-shrink-0 transition-all ${
              insightTab === t
                ? "bg-primary/[0.1] border border-primary/[0.2] text-primary"
                : "bg-white/[0.06] border border-white/[0.08] text-white/[0.3]"
            }`}>
            {t === "activity" ? "Impact" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {insightTab === "overview" && (
        <>
          {/* Chart area - bar chart */}
          <div className="glass-card-apple rounded-[22px] p-[18px] fade-up d1">
            <div className="flex items-end gap-2 w-full" style={{ height: 118 }}>
              {last7.map((e, i) => {
                const s = computeDayScore(e);
                const [c1] = scoreGradient(s);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-sm" style={{
                      height: `${(s / 5) * 100}%`,
                      background: `linear-gradient(180deg, ${c1}, ${c1}88)`,
                      transition: "height .5s ease",
                    }} />
                    <span className="text-[9px] font-semibold text-white/[0.2]">{new Date(e.date + "T12:00").toLocaleDateString("en", { weekday: "short" }).charAt(0)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Average grid */}
          <div className="grid grid-cols-2 gap-[10px] fade-up d2">
            {[
              { label: "Day Score", val: avg(recent.map(computeDayScore)).toFixed(1), color: "#c8e878", trend: `↑ +0.4 this week` },
              { label: "Sleep Score", val: Math.round(avg(recent.map(e => e.wearable.sleep.score))).toString(), color: "#7da8ff", trend: `↑ +5 this week` },
              { label: "Avg Steps", val: (Math.round(avg(recent.map(e => e.wearable.activity.steps))) / 1000).toFixed(1) + "k", color: "#ffffff", trend: "Goal: 12k" },
              { label: "Avg HRV", val: Math.round(avg(recent.map(e => e.wearable.body.hrv))) + "ms", color: "#ffb43c", trend: `↑ +7ms this week` },
            ].map(item => (
              <div key={item.label} className="glass-card-apple rounded-[18px] p-3.5">
                <div className="text-[10px] text-white/[0.28] uppercase tracking-[0.08em] font-semibold mb-1.5">{item.label}</div>
                <div className="font-display text-[21px] font-extrabold tracking-tight" style={{ color: item.color }}>{item.val}</div>
                <div className="text-[10px] font-bold mt-1" style={{ color: item.color === "#ffffff" ? "rgba(255,255,255,0.28)" : item.color }}>{item.trend}</div>
              </div>
            ))}
          </div>

          {anomalies.length > 0 && (
            <GlassCard style={{ borderLeft: `3px solid ${anomalies[0].color}` }}>
              <div className="flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <h3 className="text-[12px] font-semibold mb-1">Anomaly Detected</h3>
                  {anomalies.map((a, i) => (
                    <p key={i} className="text-[11px] text-white/[0.38] leading-relaxed">
                      {a.label} is <span style={{ color: a.color }} className="font-semibold">{a.direction}</span> — {a.z}σ deviation
                    </p>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}
        </>
      )}

      {/* ACTIVITY IMPACT */}
      {insightTab === "activity" && (
        <>
          <div className="glass-card-apple rounded-[18px] p-4 text-[11px] text-white/[0.38] leading-relaxed">
            <div className="flex items-start gap-2.5">
              <Info className="text-dl-indigo mt-0.5 flex-shrink-0 w-4 h-4" />
              <p>Shows how yesterday's activities affect today's wellness score.</p>
            </div>
          </div>

          {activityCorrelations.length === 0 ? (
            <GlassCard className="text-center py-8">
              <p className="text-[11px] text-white/[0.38]">Log activities for at least 7 days to see impact patterns.</p>
            </GlassCard>
          ) : activityCorrelations.map((c) => {
            const positive = c.diff > 0;
            const [g1, g2] = positive ? ["#c8e878", "#a0d040"] : ["#ff80c8", "#e060a0"];
            return (
              <GlassCard key={c.type}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center text-xl flex-shrink-0 border ${c.bgClass} ${c.borderClass}`}>
                      {c.emoji}
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold">{c.label}</div>
                      <div className="text-[10px] text-white/[0.28] mt-0.5">
                        {c.avgDuration > 0 ? "Avg " + formatDuration(c.avgDuration) + " · " : ""}{c.sampleSize} days
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className={`font-display text-lg font-extrabold ${positive ? "text-primary" : "text-dl-pink"}`}>
                      {positive ? "+" : ""}{c.diff.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-white/[0.28]">next-day</div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-white/[0.28] mb-1.5">
                    <span>With {c.label.toLowerCase()}</span>
                    <span className="font-semibold" style={{ color: positive ? "#c8e878" : "#ff80c8" }}>{c.avgWith} avg</span>
                  </div>
                  <div className="w-full h-[2px] bg-white/[0.07] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: (c.avgWith / 5 * 100) + "%", background: `linear-gradient(90deg,${g1},${g2})` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-white/[0.28] mb-1.5">
                    <span>Without</span>
                    <span className="font-semibold text-white/[0.45]">{c.avgWithout} avg</span>
                  </div>
                  <div className="w-full h-[2px] bg-white/[0.07] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-white/[0.15]" style={{ width: (c.avgWithout / 5 * 100) + "%" }} />
                  </div>
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
            const clr = strength > 0.5 ? (isPos ? "#c8e878" : "#ff80c8") : strength > 0.25 ? "#7da8ff" : "rgba(255,255,255,0.2)";
            return (
              <div key={c.label} className={`flex items-center gap-3 py-3 ${i < biometricCorrelations.length - 1 ? "border-b border-white/[0.05]" : ""}`}>
                <span className="text-[11px] text-white/[0.45] flex-1">{c.label}</span>
                <div className="w-20 h-1.5 bg-white/[0.07] rounded-full relative overflow-hidden">
                  <div className="absolute top-0 bottom-0 rounded-full" style={{ width: (strength * 100) + "%", background: clr, left: isPos ? "50%" : undefined, right: isPos ? undefined : ((1 - strength) * 50) + "%" }} />
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/[0.15]" />
                </div>
                <span className="text-[10px] font-mono font-bold w-10 text-right" style={{ color: clr }}>{isPos ? "+" : ""}{c.r.toFixed(2)}</span>
              </div>
            );
          })}
        </GlassCard>
      )}

      {/* ANOMALIES */}
      {insightTab === "anomalies" && (
        <>
          <p className="text-[10px] text-white/[0.28] px-1 leading-relaxed">Comparing your last 3 days to your baseline.</p>
          {anomalies.length === 0
            ? <GlassCard className="text-center py-8"><div className="text-3xl mb-3">✅</div><h3 className="font-display text-base font-extrabold mb-1">All Clear</h3><p className="text-[11px] text-white/[0.38]">No significant deviations detected.</p></GlassCard>
            : anomalies.map((a, i) => (
              <GlassCard key={i} style={{ borderLeft: `3px solid ${a.color}` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display text-base font-extrabold mb-1">{a.label}</h3>
                    <p className="text-[11px] text-white/[0.38] leading-relaxed">
                      {a.label} is <span style={{ color: a.color }} className="font-semibold">{a.direction}</span> — {a.z}σ from your baseline.
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-lg font-semibold ml-3" style={{ background: a.color + "18", color: a.color }}>{a.direction.split(" ")[0]}</span>
                </div>
              </GlassCard>
            ))
          }
        </>
      )}

      {/* WEEKLY */}
      {insightTab === "weekly" && (() => {
        const thisWeek = recent.slice(0, 7), lastWeek = recent.slice(7, 14);
        if (thisWeek.length < 3) return <GlassCard className="text-center py-8"><p className="text-[11px] text-white/[0.38]">Log at least 3 days this week.</p></GlassCard>;
        const rows = [
          { label: "Avg Score", tw: avg(thisWeek.map(computeDayScore)).toFixed(2), lw: lastWeek.length ? avg(lastWeek.map(computeDayScore)).toFixed(2) : "—", unit: "" },
          { label: "Sleep", tw: avg(thisWeek.map(e => e.wearable.sleep.totalHours)).toFixed(1), lw: lastWeek.length ? avg(lastWeek.map(e => e.wearable.sleep.totalHours)).toFixed(1) : "—", unit: "h" },
          { label: "HRV", tw: Math.round(avg(thisWeek.map(e => e.wearable.body.hrv))).toString(), lw: lastWeek.length ? Math.round(avg(lastWeek.map(e => e.wearable.body.hrv))).toString() : "—", unit: "ms" },
          { label: "Steps", tw: Math.round(avg(thisWeek.map(e => e.wearable.activity.steps))).toLocaleString(), lw: lastWeek.length ? Math.round(avg(lastWeek.map(e => e.wearable.activity.steps))).toLocaleString() : "—", unit: "" },
          { label: "Mood", tw: avg(thisWeek.map(e => e.mood.overallMood)).toFixed(1), lw: lastWeek.length ? avg(lastWeek.map(e => e.mood.overallMood)).toFixed(1) : "—", unit: "/5" },
        ];
        return (
          <>
            <GlassCard>
              <SectionHeader title="This Week vs Last" />
              {rows.map((r, i) => {
                const up = parseFloat(r.tw) >= parseFloat(r.lw);
                return (
                  <div key={r.label} className={`flex items-center justify-between py-3 ${i < rows.length - 1 ? "border-b border-white/[0.05]" : ""}`}>
                    <span className="text-[11px] text-white/[0.38]">{r.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-white/[0.2]">{r.lw}{r.unit}</span>
                      <ArrowRight className="text-white/[0.15] w-2.5 h-2.5" />
                      <span className={`text-[11px] font-semibold ${up ? "text-primary" : "text-dl-pink"}`}>{r.tw}{r.unit}</span>
                      <span className="text-[10px]">{up ? "↑" : "↓"}</span>
                    </div>
                  </div>
                );
              })}
            </GlassCard>
          </>
        );
      })()}

      {/* REPORTS */}
      {insightTab === "reports" && (
        <>
          <SectionHeader title="Weekly Reports" subtitle="Auto-generated summaries" />
          {weeklyReports.length === 0 ? (
            <GlassCard className="text-center py-8">
              <FileText className="text-white/[0.22] mx-auto mb-3 w-8 h-8" />
              <p className="text-[11px] text-white/[0.38]">Log at least 3 days to generate your first report.</p>
            </GlassCard>
          ) : weeklyReports.map((report, idx) => {
            const [c1] = scoreGradient(report.avgScore);
            return (
              <GlassCard key={idx}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-display text-[13px] font-bold">{report.period}</h3>
                    <p className="text-[10px] text-white/[0.28] mt-0.5">{report.daysLogged} days logged</p>
                  </div>
                  <div className="font-display text-xl font-extrabold" style={{ color: c1 }}>{report.avgScore.toFixed(1)}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/[0.04] rounded-xl py-2">
                    <div className="text-[10px] text-white/[0.28] uppercase tracking-wider">Sleep</div>
                    <div className="font-display text-[13px] font-bold">{report.avgSleep.toFixed(1)}h</div>
                  </div>
                  <div className="bg-white/[0.04] rounded-xl py-2">
                    <div className="text-[10px] text-white/[0.28] uppercase tracking-wider">Steps</div>
                    <div className="font-display text-[13px] font-bold">{(report.avgSteps / 1000).toFixed(1)}k</div>
                  </div>
                  <div className="bg-white/[0.04] rounded-xl py-2">
                    <div className="text-[10px] text-white/[0.28] uppercase tracking-wider">Mood</div>
                    <div className="font-display text-[13px] font-bold">{report.avgMood.toFixed(1)}</div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </>
      )}
    </div>
  );
};

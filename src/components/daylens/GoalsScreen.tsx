import { useState, useMemo } from "react";
import { Plus, Target, Crown, Flame, Trophy } from "lucide-react";
import { GlassCard, BottomSheet, SectionHeader } from "./DayLensUI";
import type { Goal, DayEntry } from "@/lib/daylens-constants";
import { scoreGradient, getMetricVal, calcStreak, computeBadges } from "@/lib/daylens-utils";

interface GoalsScreenProps {
  goals: Goal[];
  setGoals: (fn: (g: Goal[]) => Goal[]) => void;
  entries: DayEntry[];
  recent: DayEntry[];
  isPremium: boolean;
  onShowPricing: () => void;
}

const GOAL_COLORS = ["hsl(78,68%,62%)", "rgba(255,255,255,0.7)", "rgba(255,255,255,0.4)", "hsl(0,84%,60%)", "rgba(255,255,255,0.55)"];

export const GoalsScreen = ({ goals, setGoals, entries, recent, isPremium, onShowPricing }: GoalsScreenProps) => {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [tab, setTab] = useState<"goals" | "badges">("goals");
  const [newGoal, setNewGoal] = useState<{ metric: string; label: string; target: number; unit: string; op: "gte" | "lte" }>({ metric: "sleep_hrs", label: "", target: 7.5, unit: "hrs", op: "gte" });

  const badges = useMemo(() => computeBadges(entries), [entries]);
  const earnedCount = badges.filter(b => b.earned).length;

  const goalProgress = (goal: Goal) => {
    const last7 = recent.slice(0, 7).filter(e => e.wearable);
    if (!last7.length) return 0;
    const hits = last7.filter(e => { const val = getMetricVal(e, goal.metric); return goal.op === "gte" ? val >= goal.target : val <= goal.target; });
    return Math.round((hits.length / last7.length) * 100);
  };

  return (
    <div className="space-y-4 pb-28 fade-up">
      <div className="flex justify-between items-center">
        <span className="font-display text-[22px] font-extrabold text-foreground tracking-tight">Goals</span>
        <button onClick={() => setShowAddGoal(true)}
          className="text-[12px] font-bold font-display text-primary px-3.5 py-1.5 rounded-[20px] bg-primary/[0.07] border border-primary/[0.2] hover:bg-primary/[0.12] transition-colors">
          + New
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex p-1 glass-card-apple !rounded-xl overflow-hidden">
        {(["goals", "badges"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-[11px] font-bold rounded-lg capitalize transition-all flex items-center justify-center gap-1.5 ${tab === t ? "bg-primary/[0.12] text-primary border border-primary/[0.2]" : "text-white/[0.3]"}`}>
            {t === "goals" ? <Target size={13} /> : <Trophy size={13} />}
            {t === "badges" ? `Badges (${earnedCount}/${badges.length})` : "Goals"}
          </button>
        ))}
      </div>

      {tab === "goals" && (
        <>
          {goals.filter(g => g.active).map((g, gi) => {
            const pct = goalProgress(g);
            const streak = calcStreak(entries, g.metric, g.target, g.op);
            const color = GOAL_COLORS[gi % GOAL_COLORS.length];
            return (
              <div key={g.id} className={`glass-card-apple rounded-[20px] p-4 cursor-pointer hover:translate-y-[-1px] transition-transform fade-up d${gi + 1}`}>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[13px] font-semibold text-foreground">{g.label}</span>
                  <span className="font-display text-[15px] font-extrabold" style={{ color }}>{pct}%</span>
                </div>
                <div className="h-[3px] rounded-full bg-white/[0.08] mb-2">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className="text-[10px] text-white/[0.28]">
                  {g.op === "gte" ? "≥" : "≤"} {g.target} {g.unit} · Streak: {streak.current} day{streak.current !== 1 ? "s" : ""} · Best: {streak.best}
                </div>
              </div>
            );
          })}

          {goals.filter(g => g.active).length === 0 && (
            <GlassCard className="text-center py-10">
              <Target className="text-white/[0.22] mx-auto mb-3 w-10 h-10" />
              <p className="text-white/[0.38] text-[11px]">No active goals.</p>
            </GlassCard>
          )}

          {!isPremium && (
            <div className="glass-card-apple rounded-[22px] p-4 flex items-center justify-between cursor-pointer" style={{ borderColor: "rgba(255,255,255,0.08)" }} onClick={onShowPricing}>
              <div>
                <div className="font-display text-[13px] font-bold text-primary">Unlock Pro</div>
                <div className="text-[11px] text-white/[0.28] mt-0.5">AI insights, advanced trends & more</div>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-muted-foreground"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "badges" && (
        <>
          <SectionHeader title="Achievements" subtitle={`${earnedCount} of ${badges.length} unlocked`} />
          <div className="grid grid-cols-2 gap-3">
            {badges.map(b => (
              <GlassCard key={b.id} className={`text-center py-5 ${!b.earned ? "opacity-40" : ""}`}>
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-[11px] font-bold uppercase" style={{ background: b.earned ? 'rgba(212,255,94,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${b.earned ? 'rgba(212,255,94,0.15)' : 'rgba(255,255,255,0.06)'}`, color: b.earned ? 'hsl(78,68%,62%)' : 'rgba(255,255,255,0.2)' }}>
                  {b.earned ? b.title.slice(0, 2) : "—"}
                </div>
                <h4 className="text-[12px] font-semibold mb-0.5">{b.title}</h4>
                <p className="text-[10px] text-white/[0.28] leading-snug">{b.description}</p>
              </GlassCard>
            ))}
          </div>
        </>
      )}

      {/* Add Goal Sheet */}
      <BottomSheet open={showAddGoal} onClose={() => setShowAddGoal(false)} title="New Goal">
        <div className="space-y-4 mb-5">
          <div>
            <label className="text-[10px] text-white/[0.28] mb-2 block uppercase tracking-wider font-semibold">Metric</label>
            <div className="flex flex-wrap gap-2">
              {[{ v: "sleep_hrs", l: "Sleep" }, { v: "steps", l: "Steps" }, { v: "hrv", l: "HRV" }, { v: "water", l: "Water" }, { v: "mood", l: "Mood" }, { v: "bedtime", l: "Bedtime" }].map(m => (
                <button key={m.v} onClick={() => setNewGoal(g => ({ ...g, metric: m.v }))}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors ${newGoal.metric === m.v ? "bg-primary/[0.12] text-primary border border-primary/[0.2]" : "bg-white/[0.05] text-white/[0.3] border border-white/[0.07]"}`}>
                  {m.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-white/[0.28] mb-2 block uppercase tracking-wider font-semibold">Label</label>
            <input type="text" value={newGoal.label} onChange={e => setNewGoal(g => ({ ...g, label: e.target.value }))} placeholder="e.g. Sleep ≥ 8hrs"
              className="bg-white/[0.05] border border-white/[0.08] rounded-xl text-foreground w-full p-3 text-[13px] outline-none focus:border-primary/[0.3] placeholder:text-white/[0.15]" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-white/[0.28] mb-2 block uppercase tracking-wider font-semibold">Target</label>
              <input type="number" value={newGoal.target} onChange={e => setNewGoal(g => ({ ...g, target: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-[13px] text-foreground outline-none focus:border-primary/[0.3]" />
            </div>
            <div>
              <label className="text-[10px] text-white/[0.28] mb-2 block uppercase tracking-wider font-semibold">Direction</label>
              <div className="flex gap-2">
                {([["gte", "≥"], ["lte", "≤"]] as const).map(([op, l]) => (
                  <button key={op} onClick={() => setNewGoal(g => ({ ...g, op }))}
                    className={`px-4 py-3 rounded-xl text-[13px] font-semibold transition-colors ${newGoal.op === op ? "bg-primary/[0.12] text-primary border border-primary/[0.2]" : "bg-white/[0.05] text-white/[0.3] border border-white/[0.07]"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => {
          if (!newGoal.label) return;
          setGoals(gs => [...gs, { ...newGoal, id: Date.now(), active: true }]);
          setNewGoal({ metric: "sleep_hrs", label: "", target: 7.5, unit: "hrs", op: "gte" });
          setShowAddGoal(false);
        }}
          className="w-full bg-primary text-primary-foreground font-display font-extrabold py-4 rounded-[18px] active:scale-[0.98] transition-transform mb-2 text-[15px]">
          Add Goal
        </button>
      </BottomSheet>
    </div>
  );
};

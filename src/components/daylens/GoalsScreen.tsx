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
      {/* Tab switcher */}
      <div className="flex p-1 bg-secondary/80 rounded-xl">
        {(["goals", "badges"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-all flex items-center justify-center gap-1.5 ${tab === t ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground/70"}`}>
            {t === "goals" ? <Target size={14} /> : <Trophy size={14} />}
            {t === "badges" ? `Badges (${earnedCount}/${badges.length})` : "Goals"}
          </button>
        ))}
      </div>

      {tab === "goals" && (
        <>
          {goals.filter(g => g.active).map(g => {
            const pct = goalProgress(g);
            const streak = calcStreak(entries, g.metric, g.target, g.op);
            const [c1, c2] = scoreGradient(pct, 100);
            return (
              <GlassCard key={g.id}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-base font-medium">{g.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Target: {g.op === "gte" ? "≥" : "≤"} {g.target} {g.unit} · Last 7 days</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: c1 }}>{pct}%</div>
                    <button onClick={() => setGoals(gs => gs.map(x => x.id === g.id ? { ...x, active: false } : x))} className="text-[11px] text-muted-foreground hover:text-dl-red transition-colors mt-0.5">Remove</button>
                  </div>
                </div>
                <div className="w-full bg-secondary/60 h-1.5 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: pct + "%", background: `linear-gradient(90deg,${c1},${c2})` }} />
                </div>
                {/* Streak display */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Flame size={14} className={streak.current >= 3 ? "text-dl-pink" : "text-muted-foreground"} />
                    <span className={`text-xs font-semibold ${streak.current >= 3 ? "text-dl-pink" : "text-muted-foreground"}`}>
                      {streak.current} day{streak.current !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">current</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Trophy size={12} className="text-dl-lime" />
                    <span className="text-xs text-muted-foreground">
                      Best: <span className="font-semibold text-dl-lime">{streak.best}</span>
                    </span>
                  </div>
                </div>
              </GlassCard>
            );
          })}

          {goals.filter(g => g.active).length === 0 && (
            <GlassCard className="text-center py-10">
              <Target className="text-muted-foreground mx-auto mb-3 w-10 h-10" />
              <p className="text-muted-foreground text-sm">No active goals.</p>
            </GlassCard>
          )}

          <button onClick={() => setShowAddGoal(true)}
            className="w-full py-4 border border-secondary border-dashed rounded-3xl text-muted-foreground hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2 text-sm">
            <Plus size={16} /> Add Custom Goal
          </button>

          {!isPremium && (
            <GlassCard className="text-center py-6 border-dl-purple/20 bg-dl-purple/5">
              <Crown className="text-dl-purple mx-auto mb-2 w-6 h-6" />
              <p className="text-sm font-medium mb-1">Custom Categories</p>
              <p className="text-xs text-muted-foreground mb-4">Track supplements, sunlight, cold exposure and more. Premium only.</p>
              <button onClick={onShowPricing} className="text-xs text-dl-purple font-semibold border border-dl-purple/30 px-4 py-2 rounded-xl hover:bg-dl-purple/10 transition-colors">Upgrade to Premium</button>
            </GlassCard>
          )}
        </>
      )}

      {tab === "badges" && (
        <>
          <SectionHeader title="Achievements" subtitle={`${earnedCount} of ${badges.length} unlocked`} />
          <div className="grid grid-cols-2 gap-3">
            {badges.map(b => (
              <GlassCard key={b.id} className={`text-center py-5 ${!b.earned ? "opacity-40" : ""}`}>
                <div className="text-3xl mb-2">{b.earned ? b.emoji : "🔒"}</div>
                <h4 className="text-sm font-semibold mb-0.5">{b.title}</h4>
                <p className="text-[10px] text-muted-foreground leading-snug">{b.description}</p>
              </GlassCard>
            ))}
          </div>
        </>
      )}

      {/* Add Goal Sheet */}
      <BottomSheet open={showAddGoal} onClose={() => setShowAddGoal(false)} title="New Goal">
        <div className="space-y-4 mb-5">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Metric</label>
            <div className="flex flex-wrap gap-2">
              {[{ v: "sleep_hrs", l: "Sleep" }, { v: "steps", l: "Steps" }, { v: "hrv", l: "HRV" }, { v: "water", l: "Water" }, { v: "mood", l: "Mood" }, { v: "bedtime", l: "Bedtime" }].map(m => (
                <button key={m.v} onClick={() => setNewGoal(g => ({ ...g, metric: m.v }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${newGoal.metric === m.v ? "bg-dl-indigo text-foreground" : "bg-secondary text-muted-foreground hover:text-foreground/70"}`}>
                  {m.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Label</label>
            <input type="text" value={newGoal.label} onChange={e => setNewGoal(g => ({ ...g, label: e.target.value }))} placeholder="e.g. Sleep ≥ 8hrs"
              className="bg-foreground/[0.06] border border-foreground/[0.08] rounded-xl text-foreground w-full p-3 text-sm outline-none focus:border-dl-indigo/50 placeholder:text-foreground/20" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-2 block">Target</label>
              <input type="number" value={newGoal.target} onChange={e => setNewGoal(g => ({ ...g, target: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-secondary/60 border border-muted rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:border-dl-indigo/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Direction</label>
              <div className="flex gap-2">
                {([["gte", "≥"], ["lte", "≤"]] as const).map(([op, l]) => (
                  <button key={op} onClick={() => setNewGoal(g => ({ ...g, op }))}
                    className={`px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${newGoal.op === op ? "bg-dl-indigo text-foreground" : "bg-secondary text-muted-foreground"}`}>
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
          className="w-full bg-foreground text-background font-semibold py-4 rounded-2xl active:scale-95 transition-transform mb-2">
          Add Goal
        </button>
      </BottomSheet>
    </div>
  );
};

import { useState, useMemo } from "react";
import { Target, Check, X, ChevronRight } from "lucide-react";
import { GlassCard, BottomSheet } from "./DayLensUI";
import ParticleRing from "./ParticleRing";
import type { Goal, DayEntry } from "@/lib/daylens-constants";
import { getMetricVal, calcStreak } from "@/lib/daylens-utils";

interface GoalsScreenProps {
  goals: Goal[];
  setGoals: (fn: (g: Goal[]) => Goal[]) => void;
  entries: DayEntry[];
  recent: DayEntry[];
  isPremium: boolean;
  onShowPricing: () => void;
}

/* ── Goal Ring (particle-based) ─────────────────────────── */
const GoalRing = ({ pct, size = 64, color }: { pct: number; size?: number; color: string }) => {
  const p = Math.max(0, Math.min(1, pct / 100));
  const hexColor = color.startsWith('#') ? color : '#ffffff';
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <ParticleRing size={size} progress={p} color={hexColor} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[14px] font-bold text-foreground">{pct}%</span>
      </div>
    </div>
  );
};

/* ── Dot Row (7-day success) ───────────────────────────── */
const DotRow = ({ hits }: { hits: boolean[] }) => (
  <div className="flex items-center gap-1.5 mt-2">
    {hits.map((hit, i) => (
      <div key={i} className="w-5 h-5 rounded-full flex items-center justify-center text-[9px]" style={{
        background: hit ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.06)',
        color: hit ? 'hsl(var(--primary-foreground))' : 'rgba(255,255,255,0.2)',
      }}>
        {hit ? <Check size={10} strokeWidth={3} /> : <X size={9} strokeWidth={2} />}
      </div>
    ))}
  </div>
);

/* ── Goal templates ────────────────────────────────────── */
const GOAL_TEMPLATES = [
  { metric: "sleep_hrs", label: "7.5h Sleep", target: 7.5, unit: "hrs", op: "gte" as const },
  { metric: "steps", label: "10K Steps", target: 10000, unit: "steps", op: "gte" as const },
  { metric: "hrv", label: "HRV ≥ 50", target: 50, unit: "ms", op: "gte" as const },
  { metric: "water", label: "2.5L Water", target: 2.5, unit: "L", op: "gte" as const },
  { metric: "mood", label: "Mood ≥ 4", target: 4, unit: "/5", op: "gte" as const },
];

export const GoalsScreen = ({ goals, setGoals, entries, recent, isPremium, onShowPricing }: GoalsScreenProps) => {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<{ metric: string; label: string; target: number; unit: string; op: "gte" | "lte" }>({ metric: "sleep_hrs", label: "", target: 7.5, unit: "hrs", op: "gte" });

  // AI narrative
  const aiNarrative = useMemo(() => {
    const activeGoals = goals.filter(g => g.active);
    if (activeGoals.length === 0) return "Set your first goal to start tracking progress.";
    const bestGoal = activeGoals.reduce((best, g) => {
      const last7 = recent.slice(0, 7).filter(e => e.wearable);
      const hits = last7.filter(e => { const val = getMetricVal(e, g.metric); return g.op === "gte" ? val >= g.target : val <= g.target; });
      const pct = last7.length ? (hits.length / last7.length) * 100 : 0;
      return pct > best.pct ? { pct, label: g.label } : best;
    }, { pct: 0, label: "" });
    const streak = calcStreak(entries, activeGoals[0].metric, activeGoals[0].target, activeGoals[0].op);
    if (streak.current >= 7) return `You're on a ${streak.current}-day streak. Keep the momentum going.`;
    if (bestGoal.pct >= 80) return `Strong consistency on "${bestGoal.label}" — you're hitting it most days.`;
    return `Focus on building consistency. Small wins compound over time.`;
  }, [goals, recent, entries]);

  const goalProgress = (goal: Goal) => {
    const last7 = recent.slice(0, 7).filter(e => e.wearable);
    if (!last7.length) return { pct: 0, hits: [] as boolean[] };
    const hits = last7.map(e => {
      const val = getMetricVal(e, goal.metric);
      return goal.op === "gte" ? val >= goal.target : val <= goal.target;
    });
    return { pct: Math.round((hits.filter(Boolean).length / last7.length) * 100), hits };
  };

  const RING_COLORS = ["hsl(var(--primary))", "rgba(255,255,255,0.6)", "rgba(255,255,255,0.35)"];

  const addFromTemplate = (t: typeof GOAL_TEMPLATES[0]) => {
    if (goals.some(g => g.metric === t.metric && g.target === t.target && g.active)) return;
    setGoals(gs => [...gs, { ...t, id: Date.now(), active: true }]);
  };

  return (
    <div className="space-y-4 pb-28 fade-up">
      {/* AI Narrative */}
      <div className="px-1 fade-up d1">
        <p className="font-display text-[15px] font-bold text-foreground leading-snug">{aiNarrative}</p>
      </div>

      <div className="flex justify-between items-center">
        <span className="font-display text-[22px] font-extrabold text-foreground tracking-tight">Goals</span>
        <button onClick={() => setShowAddGoal(true)}
          className="text-[12px] font-bold font-display text-primary px-3.5 py-1.5 rounded-[20px] bg-primary/[0.07] border border-primary/[0.2] hover:bg-primary/[0.12] transition-colors">
          + New
        </button>
      </div>

      {goals.filter(g => g.active).map((g, gi) => {
        const { pct, hits } = goalProgress(g);
        const streak = calcStreak(entries, g.metric, g.target, g.op);
        const color = RING_COLORS[gi % RING_COLORS.length];
        return (
          <div key={g.id} className={`card-dark rounded-[20px] p-5 fade-up d${gi + 1}`}>
            <div className="flex items-center gap-4">
              <GoalRing pct={pct} color={color} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-foreground">{g.label}</div>
                <div className="font-mono text-[28px] font-bold text-foreground leading-none mt-1" style={{ letterSpacing: '-0.04em' }}>
                  {streak.current}<span className="text-[11px] text-muted-foreground font-normal ml-1">day streak</span>
                </div>
                <div className="text-[9px] text-muted-foreground mt-1">
                  {g.op === "gte" ? "≥" : "≤"} {g.target} {g.unit} · Best: {streak.best} days
                </div>
              </div>
            </div>
            <DotRow hits={hits} />
          </div>
        );
      })}

      {goals.filter(g => g.active).length === 0 && (
        <GlassCard className="text-center py-10">
          <Target className="text-muted-foreground mx-auto mb-3 w-10 h-10" />
          <p className="text-muted-foreground text-[11px]">No active goals.</p>
        </GlassCard>
      )}

      {!isPremium && (
        <div className="card-dark rounded-[22px] p-4 flex items-center justify-between cursor-pointer" onClick={onShowPricing}>
          <div>
            <div className="font-display text-[13px] font-bold text-primary">Unlock Pro</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">AI insights, advanced trends & more</div>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </div>
      )}

      {/* Add Goal Sheet */}
      <BottomSheet open={showAddGoal} onClose={() => setShowAddGoal(false)} title="New Goal">
        {/* Quick templates */}
        <div className="mb-5">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">Quick Add</div>
          <div className="flex flex-wrap gap-2">
            {GOAL_TEMPLATES.map(t => (
              <button key={t.metric + t.target} onClick={() => { addFromTemplate(t); setShowAddGoal(false); }}
                className="px-3.5 py-2 rounded-xl text-[11px] font-bold transition-colors bg-primary/[0.08] text-primary border border-primary/[0.15] hover:bg-primary/[0.15] active:scale-[0.97]">
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/[0.06] mb-5" />
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">Custom Goal</div>

        <div className="space-y-4 mb-5">
          <div>
            <label className="text-[10px] text-muted-foreground mb-2 block uppercase tracking-wider font-semibold">Metric</label>
            <div className="flex flex-wrap gap-2">
              {[{ v: "sleep_hrs", l: "Sleep" }, { v: "steps", l: "Steps" }, { v: "hrv", l: "HRV" }, { v: "water", l: "Water" }, { v: "mood", l: "Mood" }, { v: "bedtime", l: "Bedtime" }].map(m => (
                <button key={m.v} onClick={() => setNewGoal(g => ({ ...g, metric: m.v }))}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-colors ${newGoal.metric === m.v ? "bg-primary/[0.12] text-primary border border-primary/[0.2]" : "bg-white/[0.05] text-muted-foreground border border-white/[0.07]"}`}>
                  {m.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-2 block uppercase tracking-wider font-semibold">Label</label>
            <input type="text" value={newGoal.label} onChange={e => setNewGoal(g => ({ ...g, label: e.target.value }))} placeholder="e.g. Sleep ≥ 8hrs"
              className="bg-white/[0.05] border border-white/[0.08] rounded-xl text-foreground w-full p-3 text-[13px] outline-none focus:border-primary/[0.3] placeholder:text-white/[0.15]" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground mb-2 block uppercase tracking-wider font-semibold">Target</label>
              <input type="number" value={newGoal.target} onChange={e => setNewGoal(g => ({ ...g, target: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-[13px] text-foreground outline-none focus:border-primary/[0.3]" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-2 block uppercase tracking-wider font-semibold">Direction</label>
              <div className="flex gap-2">
                {([["gte", "≥"], ["lte", "≤"]] as const).map(([op, l]) => (
                  <button key={op} onClick={() => setNewGoal(g => ({ ...g, op }))}
                    className={`px-4 py-3 rounded-xl text-[13px] font-semibold transition-colors ${newGoal.op === op ? "bg-primary/[0.12] text-primary border border-primary/[0.2]" : "bg-white/[0.05] text-muted-foreground border border-white/[0.07]"}`}>
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

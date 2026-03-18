import { Crown, AlertCircle } from "lucide-react";
import { GlassCard, SectionHeader, ListInput } from "./DayLensUI";
import type { DayEntry, UserProfile } from "@/lib/daylens-constants";
import { ACTIVITY_LEVEL_LABELS, GOAL_LABELS } from "@/lib/daylens-constants";
import { calcCalorieRecommendation, computeDayScore, avg } from "@/lib/daylens-utils";

interface AccountScreenProps {
  entries: DayEntry[];
  plan: string;
  onShowPricing: () => void;
  onReset: () => void;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
}

export const AccountScreen = ({ entries, plan, onShowPricing, onReset, profile, setProfile }: AccountScreenProps) => {
  const rec = calcCalorieRecommendation(profile, null);
  const avgScore = entries.length ? avg(entries.slice(0, 14).map(computeDayScore)).toFixed(1) : "—";

  // Calculate streak
  const streak = (() => {
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    let count = 0;
    const now = new Date();
    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date(now);
      expected.setDate(expected.getDate() - i);
      if (sorted[i]?.date === expected.toISOString().split("T")[0]) count++;
      else break;
    }
    return count;
  })();

  const initials = "JC";

  return (
    <div className="space-y-4 pb-28 fade-up">
      <div className="font-display text-[22px] font-extrabold text-foreground tracking-tight">Profile</div>

      {/* Profile Hero */}
      <div className="rounded-[26px] p-5 fade-up d1" style={{ background: "rgba(200,232,120,0.1)", border: "1px solid rgba(200,232,120,0.2)", backdropFilter: "blur(40px)" }}>
        <div className="w-[52px] h-[52px] rounded-[18px] flex items-center justify-center mb-2.5" style={{ background: "rgba(200,232,120,0.15)", border: "1.5px solid rgba(200,232,120,0.3)" }}>
          <span className="font-display text-lg font-extrabold text-primary">{initials}</span>
        </div>
        <div className="font-display text-[22px] font-extrabold text-foreground tracking-tight">Jacob Clarke</div>
        <div className="text-[12px] text-white/[0.4] mt-0.5">{plan === "free" ? "Free Plan · Upgrade for AI Insights" : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`}</div>
        <div className="flex mt-4 pt-3.5 border-t border-white/[0.08]">
          <div className="flex-1 text-center border-r border-white/[0.08]">
            <div className="font-display text-[19px] font-extrabold text-foreground">{entries.length}</div>
            <div className="text-[10px] text-white/[0.3] uppercase tracking-[0.07em] mt-0.5">Days</div>
          </div>
          <div className="flex-1 text-center border-r border-white/[0.08]">
            <div className="font-display text-[19px] font-extrabold text-foreground">{streak}</div>
            <div className="text-[10px] text-white/[0.3] uppercase tracking-[0.07em] mt-0.5">Streak</div>
          </div>
          <div className="flex-1 text-center">
            <div className="font-display text-[19px] font-extrabold text-foreground">{avgScore}</div>
            <div className="text-[10px] text-white/[0.3] uppercase tracking-[0.07em] mt-0.5">Avg</div>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="glass-card-apple rounded-[22px] overflow-hidden fade-up d2">
        {[
          { label: "Height", value: `${profile.heightCm} cm` },
          { label: "Weight", value: `${profile.weightKg} kg` },
          { label: "Goal", value: GOAL_LABELS[profile.goal] || profile.goal },
          { label: "Activity Level", value: ACTIVITY_LEVEL_LABELS[profile.activityLevel]?.split(" (")[0] || profile.activityLevel },
        ].map((row, i, arr) => (
          <div key={row.label} className={`flex items-center justify-between px-[18px] py-[15px] cursor-pointer hover:bg-white/[0.04] transition-colors ${i < arr.length - 1 ? "border-b border-white/[0.06]" : ""}`}>
            <span className="text-[13px] text-white/[0.55] font-medium">{row.label}</span>
            <span className="text-[13px] text-white/[0.22]">{row.value} ›</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-[18px] py-[15px] cursor-pointer hover:bg-white/[0.04] transition-colors border-t border-white/[0.06]" onClick={onReset}>
          <span className="text-[13px] text-dl-red font-medium">Sign Out</span>
          <span className="text-white/[0.15]">›</span>
        </div>
      </div>

      {/* Upgrade CTA */}
      {plan === "free" && (
        <div className="glass-card-apple rounded-[22px] p-4 flex items-center justify-between cursor-pointer fade-up d3" style={{ borderColor: "rgba(125,168,255,0.15)" }} onClick={onShowPricing}>
          <div>
            <div className="font-display text-[13px] font-bold text-dl-blue">Unlock Pro</div>
            <div className="text-[11px] mt-0.5" style={{ color: "rgba(125,168,255,0.4)" }}>AI insights, advanced trends & more</div>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(125,168,255,0.1)", border: "1px solid rgba(125,168,255,0.18)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7da8ff" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </div>
        </div>
      )}
    </div>
  );
};

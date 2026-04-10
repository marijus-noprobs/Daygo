import { ChevronRight } from "lucide-react";
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
  const avgScore = entries.length ? avg(entries.slice(0, 14).map(computeDayScore)).toFixed(1) : "—";

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
      {/* Profile Hero */}
      <div className="card-dark rounded-[24px] p-5 fade-up d1">
        <div className="w-[52px] h-[52px] rounded-[18px] bg-primary/10 border border-primary/20 flex items-center justify-center mb-2.5">
          <span className="font-display text-lg font-extrabold text-primary">{initials}</span>
        </div>
        <div className="font-display text-[22px] font-extrabold text-foreground tracking-tight">Jacob Clarke</div>
        <div className="text-[12px] text-muted-foreground mt-0.5">{plan === "free" ? "Free Plan · Upgrade for AI Insights" : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`}</div>
        <div className="flex mt-4 pt-3.5 border-t border-border">
          <div className="flex-1 text-center border-r border-border">
            <div className="font-display text-[19px] font-extrabold text-foreground">{entries.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-[0.07em] mt-0.5">Days</div>
          </div>
          <div className="flex-1 text-center border-r border-border">
            <div className="font-display text-[19px] font-extrabold text-foreground">{streak}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-[0.07em] mt-0.5">Streak</div>
          </div>
          <div className="flex-1 text-center">
            <div className="font-display text-[19px] font-extrabold text-foreground">{avgScore}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-[0.07em] mt-0.5">Avg</div>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="card-dark rounded-[20px] overflow-hidden fade-up d2">
        {[
          { label: "Height", value: `${profile.heightCm} cm` },
          { label: "Weight", value: `${profile.weightKg} kg` },
          { label: "Goal", value: GOAL_LABELS[profile.goal] || profile.goal },
          { label: "Activity Level", value: ACTIVITY_LEVEL_LABELS[profile.activityLevel]?.split(" (")[0] || profile.activityLevel },
        ].map((row, i, arr) => (
          <div key={row.label} className={`flex items-center justify-between px-[18px] py-[15px] cursor-pointer hover:bg-card/80 transition-colors ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
            <span className="text-[13px] text-foreground/60 font-medium">{row.label}</span>
            <div className="flex items-center gap-1">
              <span className="text-[13px] text-muted-foreground">{row.value}</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between px-[18px] py-[15px] cursor-pointer hover:bg-card/80 transition-colors border-t border-border" onClick={onReset}>
          <span className="text-[13px] text-destructive font-medium">Sign Out</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Upgrade CTA */}
      {plan === "free" && (
        <div className="card-dark rounded-[20px] p-4 flex items-center justify-between cursor-pointer fade-up d3" onClick={onShowPricing}>
          <div>
            <div className="font-display text-[13px] font-bold text-primary">Unlock Pro</div>
            <div className="text-[11px] mt-0.5 text-muted-foreground">AI insights, advanced trends & more</div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

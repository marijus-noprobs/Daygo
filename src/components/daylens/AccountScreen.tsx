import { Crown, AlertCircle, Ruler, Weight, Calendar, User as UserIcon } from "lucide-react";
import { GlassCard, SectionHeader, ListInput } from "./DayLensUI";
import type { DayEntry, UserProfile } from "@/lib/daylens-constants";
import { ACTIVITY_LEVEL_LABELS, GOAL_LABELS } from "@/lib/daylens-constants";
import { calcCalorieRecommendation } from "@/lib/daylens-utils";

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

  return (
    <div className="space-y-5 pb-28 fade-up">
      <div className="flex flex-col items-center pt-4 pb-2">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-dl-indigo to-dl-purple p-0.5 mb-3">
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-dl-indigo to-dl-purple">JD</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold">John Doe</h2>
        <span className="text-[10px] px-3 py-1 rounded-full bg-secondary text-muted-foreground mt-1.5 uppercase tracking-widest">{plan} Member</span>
      </div>

      {/* Body Profile */}
      <GlassCard>
        <SectionHeader title="Body Profile" subtitle="Used for calorie & nutrition recommendations" />
        <div className="space-y-0">
          <ListInput label="Height" value={profile.heightCm} unit="cm" step={1} min={100} max={250} onChange={v => setProfile({ ...profile, heightCm: v })} />
          <ListInput label="Weight" value={profile.weightKg} unit="kg" step={0.5} min={30} max={250} onChange={v => setProfile({ ...profile, weightKg: v })} />
          <ListInput label="Age" value={profile.age} unit="yrs" step={1} min={13} max={100} onChange={v => setProfile({ ...profile, age: v })} />
          <div className="flex items-center justify-between py-3.5 border-b border-secondary">
            <span className="text-sm font-medium text-foreground/70">Sex</span>
            <div className="flex gap-1.5">
              {(["male", "female"] as const).map(s => (
                <button key={s} onClick={() => setProfile({ ...profile, sex: s })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                    profile.sex === s ? "bg-dl-indigo/20 text-dl-indigo border border-dl-indigo/30" : "bg-secondary text-muted-foreground hover:text-foreground/70"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Activity Level */}
      <GlassCard>
        <SectionHeader title="Activity Level" />
        <div className="space-y-2">
          {(Object.keys(ACTIVITY_LEVEL_LABELS) as UserProfile["activityLevel"][]).map(level => (
            <button key={level} onClick={() => setProfile({ ...profile, activityLevel: level })}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                profile.activityLevel === level
                  ? "bg-dl-indigo/15 text-dl-indigo border border-dl-indigo/25"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground/70 border border-transparent"
              }`}>
              {ACTIVITY_LEVEL_LABELS[level]}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Goal */}
      <GlassCard>
        <SectionHeader title="Goal" />
        <div className="flex gap-2">
          {(Object.keys(GOAL_LABELS) as UserProfile["goal"][]).map(g => (
            <button key={g} onClick={() => setProfile({ ...profile, goal: g })}
              className={`flex-1 py-3 rounded-xl text-xs font-semibold transition-colors ${
                profile.goal === g
                  ? "bg-dl-emerald/15 text-dl-emerald border border-dl-emerald/25"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground/70 border border-transparent"
              }`}>
              {GOAL_LABELS[g]}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Calorie Summary */}
      <GlassCard className="border-dl-emerald/20 bg-dl-emerald/[0.03]">
        <SectionHeader title="Your Daily Targets" subtitle="Based on your profile" />
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">BMR</div>
            <div className="text-lg font-bold">{rec.bmr}</div>
            <div className="text-[10px] text-muted-foreground">kcal/day</div>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">TDEE</div>
            <div className="text-lg font-bold">{rec.tdee}</div>
            <div className="text-[10px] text-muted-foreground">kcal/day</div>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Target</div>
            <div className="text-lg font-bold text-dl-emerald">{rec.baseTarget}</div>
            <div className="text-[10px] text-muted-foreground">kcal/day</div>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Protein</div>
            <div className="text-lg font-bold text-dl-blue">{rec.proteinG}g</div>
            <div className="text-[10px] text-muted-foreground">/day</div>
          </div>
        </div>
      </GlassCard>

      {/* Stats */}
      <GlassCard>
        {[
          { label: "Days logged", val: entries.length },
          { label: "Activities logged", val: entries.reduce((s, e) => s + (e.activities?.length || 0), 0) },
          { label: "Tracking since", val: entries.length ? new Date(entries[0].date + "T12:00").toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—" },
        ].map((r, i, arr) => (
          <div key={r.label} className={`flex justify-between py-3.5 ${i < arr.length - 1 ? "border-b border-secondary/60" : ""}`}>
            <span className="text-sm text-muted-foreground">{r.label}</span>
            <span className="text-sm font-semibold">{r.val}</span>
          </div>
        ))}
      </GlassCard>

      <div className="space-y-3">
        <GlassCard className="flex items-center justify-between" onClick={onShowPricing}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-dl-amber/10 flex items-center justify-center text-dl-amber">
              <Crown size={16} />
            </div>
            <span className="text-sm font-medium">{plan === "free" ? "Upgrade Plan" : "Manage Subscription"}</span>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center justify-between" onClick={onReset}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-dl-red/10 flex items-center justify-center text-dl-red">
              <AlertCircle size={16} />
            </div>
            <span className="text-sm font-medium text-dl-red">Reset Data</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

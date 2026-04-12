import { useRef, useState } from "react";
import { ChevronRight, Camera, X } from "lucide-react";
import type { DayEntry, UserProfile } from "@/lib/daylens-constants";
import { ACTIVITY_LEVEL_LABELS, GOAL_LABELS } from "@/lib/daylens-constants";
import { calcCalorieRecommendation, computeDayScore, avg, save, load } from "@/lib/daylens-utils";

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<string | null>(() => load("dl_avatar", null));
  const [editing, setEditing] = useState<"weight" | "goal" | null>(null);
  const [tempWeight, setTempWeight] = useState(String(profile.weightKg));

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatar(result);
      save("dl_avatar", result);
    };
    reader.readAsDataURL(file);
  };

  const saveWeight = () => {
    const val = parseFloat(tempWeight);
    if (!isNaN(val) && val > 0) {
      setProfile({ ...profile, weightKg: val });
    }
    setEditing(null);
  };

  const saveGoal = (goal: "lose" | "maintain" | "gain") => {
    setProfile({ ...profile, goal });
    setEditing(null);
  };

  return (
    <div className="space-y-4 pb-28 fade-up">
      {/* Profile Hero */}
      <div className="card-dark-gradient rounded-[24px] p-5 fade-up d1">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative w-[60px] h-[60px] rounded-[20px] overflow-hidden mb-2.5 group"
        >
          {avatar ? (
            <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="font-display text-lg font-extrabold text-primary">{initials}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
            <Camera className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />
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
        {/* Height — read-only, set during onboarding */}
        <div className="flex items-center justify-between px-[18px] py-[15px] border-b border-border">
          <span className="text-[13px] text-foreground/60 font-medium">Height</span>
          <span className="text-[13px] text-muted-foreground">{profile.heightCm} cm</span>
        </div>

        {/* Weight — editable */}
        <div
          className="flex items-center justify-between px-[18px] py-[15px] cursor-pointer hover:bg-card/80 transition-colors border-b border-border"
          onClick={() => { setTempWeight(String(profile.weightKg)); setEditing("weight"); }}
        >
          <span className="text-[13px] text-foreground/60 font-medium">Weight</span>
          <div className="flex items-center gap-1">
            <span className="text-[13px] text-muted-foreground">{profile.weightKg} kg</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* Goal — editable */}
        <div
          className="flex items-center justify-between px-[18px] py-[15px] cursor-pointer hover:bg-card/80 transition-colors border-b border-border"
          onClick={() => setEditing("goal")}
        >
          <span className="text-[13px] text-foreground/60 font-medium">Goal</span>
          <div className="flex items-center gap-1">
            <span className="text-[13px] text-muted-foreground">{GOAL_LABELS[profile.goal] || profile.goal}</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* Activity Level — auto-detected, read-only */}
        <div className="flex items-center justify-between px-[18px] py-[15px]">
          <span className="text-[13px] text-foreground/60 font-medium">Activity Level</span>
          <span className="text-[13px] text-muted-foreground">{ACTIVITY_LEVEL_LABELS[profile.activityLevel]?.split(" (")[0] || profile.activityLevel}</span>
        </div>

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

      {/* Weight Editor Modal */}
      {editing === "weight" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center fade-in" onClick={() => setEditing(null)}
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)' }}>
          <div className="w-[85%] max-w-xs rounded-[22px] p-5 scale-in" onClick={e => e.stopPropagation()}
            style={{ background: '#1c1c1d', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-extrabold text-foreground">Update Weight</h3>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="number"
                value={tempWeight}
                onChange={e => setTempWeight(e.target.value)}
                className="flex-1 bg-card rounded-xl px-4 py-3 text-foreground text-[16px] font-mono font-bold outline-none border border-border focus:border-primary/30"
                autoFocus
              />
              <span className="text-muted-foreground text-[13px] font-medium">kg</span>
            </div>
            <button onClick={saveWeight}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-[13px] font-bold hover:opacity-90 transition-opacity">
              Save
            </button>
          </div>
        </div>
      )}

      {/* Goal Editor Modal */}
      {editing === "goal" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center fade-in" onClick={() => setEditing(null)}
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)' }}>
          <div className="w-[85%] max-w-xs rounded-[22px] p-5 scale-in" onClick={e => e.stopPropagation()}
            style={{ background: '#1c1c1d', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-extrabold text-foreground">Set Goal</h3>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-2">
              {(Object.entries(GOAL_LABELS) as [("lose" | "maintain" | "gain"), string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => saveGoal(key)}
                  className={`w-full py-3.5 px-4 rounded-xl text-[13px] font-bold text-left transition-all ${
                    profile.goal === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground/70 hover:bg-card/80 border border-border"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

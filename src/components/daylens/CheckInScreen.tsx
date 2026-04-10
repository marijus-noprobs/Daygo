import { useState } from "react";
import { Moon, Star, Zap, Activity as ActivityIcon, Heart, Wind, BatteryCharging, Footprints, Flame, CheckCircle, Plus, Trash2, Calendar, X, UtensilsCrossed, ChevronLeft } from "lucide-react";
import { GlassCard, SectionHeader, ScoreRing, StatTile, ListInput, MoodRow, BottomSheet } from "./DayLensUI";
import { ActivityCard, ActivityTypePicker, AddFoodItem } from "./ActivityComponents";
import type { WearableData, NutritionData, MoodData, Activity, DayEntry, UserProfile } from "@/lib/daylens-constants";
import { ACTIVITY_TYPES } from "@/lib/daylens-constants";
import {
  simulateWearable, durationHours, formatDuration, isLateNight,
  computeDayScore, scoreGradient, newActivityBlank, calcCalorieRecommendation,
} from "@/lib/daylens-utils";

interface CheckInScreenProps {
  submitted: boolean;
  hasToday: boolean;
  todayScore: number | null;
  wearable: WearableData | null;
  setWearable: (fn: (w: WearableData) => WearableData) => void;
  setWearableRaw: (w: WearableData) => void;
  nutrition: NutritionData;
  setNutrition: (fn: (n: NutritionData) => NutritionData) => void;
  mood: MoodData;
  setMood: (fn: (m: MoodData) => MoodData) => void;
  todayActivities: Activity[];
  setTodayActivities: (fn: (a: Activity[]) => Activity[]) => void;
  note: string;
  setNote: (n: string) => void;
  onSubmit: () => void;
  onViewInsights: () => void;
  yesterdayEntry: DayEntry | undefined;
  profile: UserProfile;
}

export const CheckInScreen = ({
  submitted, hasToday, todayScore, wearable, setWearable, setWearableRaw,
  nutrition, setNutrition, mood, setMood,
  todayActivities, setTodayActivities, note, setNote,
  onSubmit, onViewInsights, yesterdayEntry, profile,
}: CheckInScreenProps) => {
  const [section, setSection] = useState("sleep");
  const [syncing, setSyncing] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setWearableRaw(simulateWearable(Date.now() % 100) as WearableData);
      setSyncing(false);
    }, 1500);
  };

  const sections = ["sleep", "activity", "nutrition", "mood", "activities"];
  const sectionIndex = sections.indexOf(section);

  if (submitted || hasToday) return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] gap-8 fade-up">
      <div className="relative">
        <div className="absolute inset-0 blur-3xl rounded-full opacity-25" style={{ background: scoreGradient(todayScore || 3.5)[0] }} />
        <ScoreRing score={todayScore || 3.5} size={180} thick={12} />
      </div>
      <div className="text-center">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Log Complete</h2>
        <p className="text-white/[0.38] text-[11px] mt-1">Your data has been saved.</p>
      </div>
      <button onClick={onViewInsights} className="w-full bg-primary text-primary-foreground font-display font-extrabold py-4 rounded-[18px] active:scale-[0.98] transition-transform text-[15px]">View Insights →</button>
    </div>
  );

  if (!wearable) return (
    <div className="flex flex-col justify-center min-h-[65vh] fade-up">
      <GlassCard className="flex flex-col items-center text-center gap-5 py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-dl-indigo/[0.04] pointer-events-none" />
        <div className={`w-20 h-20 rounded-full bg-white/[0.05] flex items-center justify-center text-dl-indigo ${syncing ? "spin-slow" : ""}`}>
          <ActivityIcon size={36} />
        </div>
        <div className="z-10">
          <h2 className="font-display text-xl font-extrabold mb-2">{syncing ? "Syncing..." : "Sync Wearable"}</h2>
          <p className="text-[11px] text-white/[0.38] max-w-[220px] mx-auto leading-relaxed">{syncing ? "Pulling sleep, HRV & activity data..." : "Connect Apple Health, Oura, Whoop or Garmin."}</p>
        </div>
        {syncing
          ? <div className="w-full h-1 bg-white/[0.07] rounded-full overflow-hidden"><div className="h-full w-3/5 bg-dl-indigo rounded-full shimmer" /></div>
          : <button onClick={handleSync} className="w-full bg-dl-indigo hover:opacity-90 text-foreground font-display font-bold py-3.5 rounded-[18px] transition-all shadow-lg shadow-dl-indigo/25 active:scale-[0.98] z-10 text-[13px]">Connect & Sync</button>
        }
      </GlassCard>
    </div>
  );

  return (
    <div className="space-y-4 pb-28 fade-up">
      {/* Header */}
      <div className="font-display text-[18px] font-extrabold text-foreground tracking-tight">Daily Check-in</div>

      {/* Progress bar */}
      <div className="flex gap-[5px]">
        {sections.map((s, i) => (
          <div key={s} className={`flex-1 h-[2px] rounded-full transition-colors duration-400 ${i <= sectionIndex ? "bg-primary" : "bg-white/[0.1]"}`} />
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex p-1 glass-card-apple !rounded-[18px] overflow-x-auto">
        {sections.map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`flex-1 py-[7px] text-[10px] font-bold rounded-[13px] capitalize whitespace-nowrap transition-all px-1 uppercase tracking-[0.04em] ${
              section === s
                ? "bg-primary/[0.12] text-primary border border-primary/[0.2]"
                : "text-white/[0.3]"
            }`}>
            {s === "activities" ? "Log" : s}
          </button>
        ))}
      </div>

      {/* SLEEP */}
      {section === "sleep" && (
        <div className="space-y-3 slide-in">
          <div className="card-dark rounded-[22px] p-[18px]">
            <div className="flex flex-col items-center mb-4">
              <svg width="88" height="88" viewBox="0 0 88 88" className="mb-1">
                <defs><linearGradient id="sleepG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="hsl(var(--color-lime))" /><stop offset="100%" stopColor="hsl(var(--primary))" /></linearGradient></defs>
                <circle cx="44" cy="44" r="35" fill="none" stroke="hsl(var(--border))" strokeWidth="7" />
                <circle cx="44" cy="44" r="35" fill="none" stroke="url(#sleepG)" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={`${(wearable.sleep.score / 100) * 2 * Math.PI * 35} ${2 * Math.PI * 35}`}
                  transform="rotate(-90 44 44)" />
              </svg>
              <div className="font-display text-[26px] font-extrabold text-primary text-center">{wearable.sleep.score}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Sleep Score</div>
            </div>
            <div className="font-display text-[14px] font-extrabold text-foreground mb-3">Sleep Breakdown</div>
            <div className="space-y-0">
              <ReadOnlyRow label="Total sleep" value={`${wearable.sleep.totalHours}h`} />
              <ReadOnlyRow label="Deep sleep" value={`${wearable.sleep.deepHours}h`} />
              <ReadOnlyRow label="REM sleep" value={`${wearable.sleep.remHours}h`} />
            </div>
          </div>
          <button onClick={() => setSection("activity")} className="w-full py-[17px] rounded-[18px] bg-primary text-primary-foreground font-display text-[15px] font-extrabold active:scale-[0.98] transition-transform">Next: Body Metrics →</button>
        </div>
      )}

      {/* ACTIVITY */}
      {section === "activity" && (
        <div className="space-y-3 slide-in">
          <div className="glass-card-apple rounded-[22px] p-[18px]">
            <div className="font-display text-[14px] font-extrabold text-foreground mb-3">Body & Recovery</div>
            <SliderRow label="HRV" value={wearable.body.hrv} min={20} max={120} step={1} unit="ms"
              onChange={v => setWearable(w => ({ ...w, body: { ...w.body, hrv: v } }))} />
            <SliderRow label="Resting HR" value={wearable.body.restingHR} min={40} max={100} step={1} unit="bpm"
              onChange={v => setWearable(w => ({ ...w, body: { ...w.body, restingHR: v } }))} />
            <SliderRow label="SpO₂" value={wearable.body.spo2} min={90} max={100} step={1} unit="%"
              onChange={v => setWearable(w => ({ ...w, body: { ...w.body, spo2: v } }))} />
            <SliderRow label="Body Battery" value={wearable.body.bodyBattery} min={0} max={100} step={1} unit=""
              onChange={v => setWearable(w => ({ ...w, body: { ...w.body, bodyBattery: v } }))} />
            <SliderRow label="Steps" value={wearable.activity.steps} min={0} max={25000} step={100} unit=""
              onChange={v => setWearable(w => ({ ...w, activity: { ...w.activity, steps: v } }))}
              formatVal={v => v >= 1000 ? (v/1000).toFixed(1) + "k" : String(v)} />
          </div>
          <button onClick={() => setSection("nutrition")} className="w-full py-[17px] rounded-[18px] bg-primary text-primary-foreground font-display text-[15px] font-extrabold active:scale-[0.98] transition-transform">Next: Nutrition →</button>
        </div>
      )}

      {/* NUTRITION */}
      {section === "nutrition" && (
        <div className="space-y-3 slide-in">
          <div className="glass-card-apple rounded-[22px] p-[18px]">
            <div className="font-display text-[14px] font-extrabold text-foreground mb-3">Nutrition</div>
            <SliderRow label="Calories" value={nutrition.calories} min={0} max={5000} step={50} unit=" kcal"
              onChange={v => setNutrition(n => ({ ...n, calories: v }))} />
            <SliderRow label="Protein" value={nutrition.proteinG} min={0} max={300} step={5} unit="g"
              onChange={v => setNutrition(n => ({ ...n, proteinG: v }))} />
            <SliderRow label="Water" value={nutrition.waterLiters} min={0} max={5} step={0.25} unit="L"
              onChange={v => setNutrition(n => ({ ...n, waterLiters: v }))} />
            <SliderRow label="Alcohol" value={nutrition.alcoholUnits} min={0} max={10} step={1} unit=" units"
              onChange={v => setNutrition(n => ({ ...n, alcoholUnits: v }))} />
          </div>
          <div className="glass-card-apple rounded-[22px] p-[18px]">
            <div className="font-display text-[14px] font-extrabold text-foreground mb-3">Meal Quality</div>
            <div className="grid grid-cols-5 gap-[6px]">
              {["😔","😐","🙂","😊","🥗"].map((e, i) => (
                <button key={i} onClick={() => setNutrition(n => ({ ...n, meals: n.meals.map((m, mi) => mi === 0 ? { ...m, quality: i + 1 } : m) }))}
                  className={`py-2.5 rounded-xl text-[17px] text-center transition-all ${
                    nutrition.meals[0]?.quality === i + 1
                      ? "bg-primary/[0.12] border border-primary/[0.25] scale-110"
                      : "bg-white/[0.05] border border-white/[0.07]"
                  }`}>{e}</button>
              ))}
            </div>
          </div>
          <button onClick={() => setSection("mood")} className="w-full py-[17px] rounded-[18px] bg-primary text-primary-foreground font-display text-[15px] font-extrabold active:scale-[0.98] transition-transform">Next: Mood →</button>
        </div>
      )}

      {/* MOOD */}
      {section === "mood" && (
        <div className="space-y-3 slide-in">
          <div className="glass-card-apple rounded-[22px] p-[18px]">
            <div className="font-display text-[14px] font-extrabold text-foreground mb-3">Mental State</div>
            <SliderRow label="Overall Mood" value={mood.overallMood} min={1} max={5} step={1} unit="/5"
              onChange={v => setMood(m => ({ ...m, overallMood: v }))} />
            <SliderRow label="Focus" value={mood.focus} min={1} max={5} step={1} unit="/5"
              onChange={v => setMood(m => ({ ...m, focus: v }))} />
            <SliderRow label="Energy" value={mood.energy} min={1} max={5} step={1} unit="/5"
              onChange={v => setMood(m => ({ ...m, energy: v }))} />
            <SliderRow label="Anxiety" value={mood.anxiety} min={1} max={5} step={1} unit="/5"
              onChange={v => setMood(m => ({ ...m, anxiety: v }))} />
          </div>
          <div className="glass-card-apple rounded-[22px] p-[18px]">
            <div className="font-display text-[14px] font-extrabold text-foreground mb-3">How are you feeling?</div>
            <div className="grid grid-cols-5 gap-[6px]">
              {["😔","😐","🙂","😄","🤩"].map((e, i) => {
                const val = i + 1;
                return (
                  <button key={i} onClick={() => setMood(m => ({ ...m, overallMood: val }))}
                    className={`py-2.5 rounded-xl text-[17px] text-center transition-all ${
                      mood.overallMood === val
                        ? "bg-primary/[0.12] border border-primary/[0.25] scale-110"
                        : "bg-white/[0.05] border border-white/[0.07]"
                    }`}>{e}</button>
                );
              })}
            </div>
          </div>
          <button onClick={onSubmit} className="w-full py-[17px] rounded-[18px] bg-primary text-primary-foreground font-display text-[15px] font-extrabold active:scale-[0.98] transition-transform">Complete Check-in ✓</button>
        </div>
      )}

      {/* ACTIVITIES */}
      {section === "activities" && (
        <div className="space-y-3 slide-in">
          <SectionHeader title="Today's Activities" action={
            <button onClick={() => setShowAddActivity(true)} className="text-[11px] text-primary font-bold flex items-center gap-1"><Plus size={14} />Add</button>
          } />
          {todayActivities.length === 0 && (
            <GlassCard className="text-center py-8">
              <Calendar className="text-white/[0.22] mx-auto mb-3 w-10 h-10" />
              <p className="text-white/[0.38] text-[11px]">No activities logged for today.</p>
            </GlassCard>
          )}
          {todayActivities.map((a, i) => (
            <ActivityCard key={a.id} activity={a}
              onUpdate={u => setTodayActivities(as => as.map(x => x.id === a.id ? u : x))}
              onRemove={() => setTodayActivities(as => as.filter(x => x.id !== a.id))} />
          ))}
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Quick notes about your day..."
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-[18px] p-4 text-[13px] text-foreground placeholder-white/[0.15] resize-none outline-none focus:border-primary/[0.3] min-h-[80px]" />
          <button onClick={onSubmit} className="w-full py-[17px] rounded-[18px] bg-primary text-primary-foreground font-display text-[15px] font-extrabold active:scale-[0.98] transition-transform">Complete Check-in ✓</button>

          <BottomSheet open={showAddActivity} onClose={() => setShowAddActivity(false)} title="Add Activity">
            <ActivityTypePicker onSelect={type => { setTodayActivities(as => [...as, { ...newActivityBlank(), type }]); setShowAddActivity(false); }} />
          </BottomSheet>
        </div>
      )}
    </div>
  );
};

/* ─── Read-Only Row ──────────────── */
const ReadOnlyRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
    <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
    <span className="font-mono text-[13px] font-bold text-foreground">{value}</span>
  </div>
);

/* ─── Slider Row (HTML-matching style) ──────────────── */
const SliderRow = ({ label, value, min, max, step, unit, onChange, formatVal }: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void; formatVal?: (v: number) => string;
}) => (
  <div className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-0">
    <span className="text-[11px] text-muted-foreground font-medium w-[86px] flex-shrink-0">{label}</span>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="flex-1" />
    <span className="font-mono text-[11px] font-bold text-foreground w-[48px] text-right flex-shrink-0">
      {formatVal ? formatVal(value) : `${value}${unit}`}
    </span>
  </div>
);

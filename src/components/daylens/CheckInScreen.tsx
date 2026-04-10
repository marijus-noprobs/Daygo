import { useState } from "react";
import { ScoreRing } from "./DayLensUI";
import { MealLogSection } from "./MealLogSection";
import type { WearableData, NutritionData, MoodData, Activity, DayEntry, UserProfile } from "@/lib/daylens-constants";
import { scoreGradient } from "@/lib/daylens-utils";

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
  const [section, setSection] = useState("nutrition");

  const sections = ["nutrition", "mood"];
  const sectionIndex = sections.indexOf(section);

  if (submitted || hasToday) return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] gap-8 fade-up">
      <div className="relative">
        <div className="absolute inset-0 blur-3xl rounded-full opacity-25" style={{ background: scoreGradient(todayScore || 3.5)[0] }} />
        <ScoreRing score={todayScore || 3.5} size={180} thick={12} />
      </div>
      <div className="text-center">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Log Complete</h2>
        <p className="text-muted-foreground text-[11px] mt-1">Your data has been saved.</p>
      </div>
      <button onClick={onViewInsights} className="w-full bg-primary text-primary-foreground font-display font-extrabold py-4 rounded-[18px] active:scale-[0.98] transition-transform text-[15px]">View Insights →</button>
    </div>
  );

  return (
    <div className="space-y-4 pb-28 fade-up">
      <div className="font-display text-[18px] font-extrabold text-foreground tracking-tight">Daily Check-in</div>

      {/* Progress bar */}
      <div className="flex gap-[5px]">
        {sections.map((s, i) => (
          <div key={s} className={`flex-1 h-[2px] rounded-full transition-colors duration-400 ${i <= sectionIndex ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex p-1 card-dark !rounded-[18px] overflow-x-auto">
        {sections.map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`flex-1 py-[7px] text-[10px] font-bold rounded-[13px] capitalize whitespace-nowrap transition-all px-1 uppercase tracking-[0.04em] ${
              section === s
                ? "bg-primary/[0.12] text-primary border border-primary/[0.2]"
                : "text-muted-foreground"
            }`}>
            {s}
          </button>
        ))}
      </div>

      {/* NUTRITION — Meal-by-meal logging */}
      {section === "nutrition" && (
        <div className="space-y-3 slide-in">
          <MealLogSection nutrition={nutrition} setNutrition={setNutrition} />
          <button onClick={() => setSection("mood")} className="w-full py-[17px] rounded-[18px] bg-primary text-primary-foreground font-display text-[15px] font-extrabold active:scale-[0.98] transition-transform">Next: Mood →</button>
        </div>
      )}

      {/* MOOD */}
      {section === "mood" && (
        <div className="space-y-3 slide-in">
          <div className="card-dark rounded-[22px] p-[18px]">
            <div className="font-display text-[14px] font-extrabold text-foreground mb-3">How are you feeling?</div>
            <div className="grid grid-cols-5 gap-[6px] mb-4">
              {["😔","😐","🙂","😄","🤩"].map((e, i) => {
                const val = i + 1;
                return (
                  <button key={i} onClick={() => setMood(m => ({ ...m, overallMood: val }))}
                    className={`py-2.5 rounded-xl text-[17px] text-center transition-all ${
                      mood.overallMood === val
                        ? "bg-primary/[0.12] border border-primary/[0.25] scale-110"
                        : "bg-card border border-border"
                    }`}>{e}</button>
                );
              })}
            </div>
            <SliderRow label="Focus" value={mood.focus} min={1} max={5} step={1} unit="/5"
              onChange={v => setMood(m => ({ ...m, focus: v }))} />
            <SliderRow label="Energy" value={mood.energy} min={1} max={5} step={1} unit="/5"
              onChange={v => setMood(m => ({ ...m, energy: v }))} />
            <SliderRow label="Anxiety" value={mood.anxiety} min={1} max={5} step={1} unit="/5"
              onChange={v => setMood(m => ({ ...m, anxiety: v }))} />
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Quick notes about your day..."
            className="w-full bg-card border border-border rounded-[18px] p-4 text-[13px] text-foreground placeholder-muted-foreground resize-none outline-none focus:border-primary/[0.3] min-h-[80px]" />
          <button onClick={onSubmit} className="w-full py-[17px] rounded-[18px] bg-primary text-primary-foreground font-display text-[15px] font-extrabold active:scale-[0.98] transition-transform">Complete Check-in ✓</button>
        </div>
      )}
    </div>
  );
};

/* ─── Slider Row ──────────────── */
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

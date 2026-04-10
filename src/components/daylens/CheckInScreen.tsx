import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { ScoreRing, BottomSheet } from "./DayLensUI";
import { MealLogSection } from "./MealLogSection";
import { ActivityCard, ActivityTypePicker } from "./ActivityComponents";
import { SentimentScreen } from "./SentimentScreen";
import type { WearableData, NutritionData, MoodData, Activity, DayEntry, UserProfile } from "@/lib/daylens-constants";
import { scoreGradient, newActivityBlank } from "@/lib/daylens-utils";

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
  initialSection?: string;
  forceOpen?: boolean;
}

export const CheckInScreen = ({
  submitted, hasToday, todayScore, wearable, setWearable, setWearableRaw,
  nutrition, setNutrition, mood, setMood,
  todayActivities, setTodayActivities, note, setNote,
  onSubmit, onViewInsights, yesterdayEntry, profile, initialSection, forceOpen = false,
}: CheckInScreenProps) => {
  const [section, setSection] = useState(initialSection || "nutrition");
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showSentiment, setShowSentiment] = useState(false);
  const sections = ["nutrition", "activities"];
  const sectionIndex = sections.indexOf(section);

  useEffect(() => {
    if (initialSection) setSection(initialSection);
  }, [initialSection]);

  if (!forceOpen && (submitted || hasToday)) return (
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
          <button onClick={() => setSection("activities")} className="w-full py-[17px] rounded-[18px] bg-primary text-primary-foreground font-display text-[15px] font-extrabold active:scale-[0.98] transition-transform">Next: Activities →</button>
        </div>
      )}

      {/* ACTIVITIES */}
      {section === "activities" && (
        <div className="space-y-3 slide-in">
          <div className="card-dark rounded-[22px] p-[18px]">
            <div className="font-display text-[14px] font-extrabold text-foreground mb-3">What did you do today?</div>
            {todayActivities.length === 0 && (
              <p className="text-[11px] text-muted-foreground/50 mb-3">No activities logged yet.</p>
            )}
            {todayActivities.map((a, i) => (
              <ActivityCard key={a.id} activity={a}
                onUpdate={updated => setTodayActivities(acts => acts.map((x, j) => j === i ? updated : x))}
                onRemove={() => setTodayActivities(acts => acts.filter((_, j) => j !== i))} />
            ))}
            <button onClick={() => setShowAddActivity(true)}
              className="w-full py-2.5 border border-dashed border-muted rounded-xl text-xs text-muted-foreground hover:text-foreground/70 hover:border-foreground/30 transition-colors flex items-center justify-center gap-1.5">
              <Plus size={14} /> Add activity
            </button>
          </div>

          <BottomSheet open={showAddActivity} onClose={() => setShowAddActivity(false)} title="Add Activity">
            <ActivityTypePicker onSelect={type => {
              const blank = newActivityBlank();
              blank.type = type;
              setTodayActivities(a => [...a, blank]);
              setShowAddActivity(false);
            }} />
          </BottomSheet>

          <button onClick={() => setShowSentiment(true)} className="w-full py-[17px] rounded-[18px] bg-primary text-primary-foreground font-display text-[15px] font-extrabold active:scale-[0.98] transition-transform">Next: Mood →</button>
        </div>
      )}

      {showSentiment && (
        <SentimentScreen
          onSubmit={(moodData, sentimentNote) => {
            setMood(() => moodData);
            if (sentimentNote) setNote(sentimentNote);
            setShowSentiment(false);
            onSubmit();
          }}
          onClose={() => setShowSentiment(false)}
        />
      )}
    </div>
  );
};
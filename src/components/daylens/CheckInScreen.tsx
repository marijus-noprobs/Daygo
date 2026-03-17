import { useState } from "react";
import { Moon, Star, Zap, Activity as ActivityIcon, Heart, Wind, BatteryCharging, Footprints, Flame, CheckCircle, Plus, Trash2, Calendar, X, UtensilsCrossed } from "lucide-react";
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

  if (submitted || hasToday) return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] gap-8 fade-up">
      <div className="relative">
        <div className="absolute inset-0 blur-3xl rounded-full opacity-25" style={{ background: scoreGradient(todayScore || 3.5)[0] }} />
        <ScoreRing score={todayScore || 3.5} size={180} thick={12} />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Log Complete</h2>
        <p className="text-muted-foreground text-sm mt-1">Your data has been saved.</p>
      </div>
      <button onClick={onViewInsights} className="w-full bg-foreground text-background font-semibold py-4 rounded-2xl active:scale-95 transition-transform">View Insights →</button>
    </div>
  );

  if (!wearable) return (
    <div className="flex flex-col justify-center min-h-[65vh] fade-up">
      <GlassCard className="flex flex-col items-center text-center gap-5 py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-dl-indigo/[0.04] pointer-events-none" />
        <div className={`w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-dl-indigo ${syncing ? "spin-slow" : ""}`}>
          <ActivityIcon size={36} />
        </div>
        <div className="z-10">
          <h2 className="text-xl font-semibold mb-2">{syncing ? "Syncing..." : "Sync Wearable"}</h2>
          <p className="text-sm text-muted-foreground max-w-[220px] mx-auto leading-relaxed">{syncing ? "Pulling sleep, HRV & activity data..." : "Connect Apple Health, Oura, Whoop or Garmin."}</p>
        </div>
        {syncing
          ? <div className="w-full h-1 bg-secondary rounded-full overflow-hidden"><div className="h-full w-3/5 bg-dl-indigo rounded-full shimmer" /></div>
          : <button onClick={handleSync} className="w-full bg-dl-indigo hover:opacity-90 text-foreground font-medium py-3.5 rounded-2xl transition-all shadow-lg shadow-dl-indigo/25 active:scale-95 z-10 text-sm">Connect & Sync</button>
        }
      </GlassCard>
    </div>
  );

  const sections = ["sleep", "activity", "nutrition", "mood", "activities"];

  return (
    <div className="space-y-5 pb-28 fade-up">
      {/* Synced banner */}
      <div className="flex items-center justify-between glass-card-apple px-4 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-dl-emerald/10 flex items-center justify-center text-dl-emerald">
            <CheckCircle size={18} />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Synced</div>
            <div className="text-sm font-medium">Apple Watch · Sleep score: <span className="text-dl-indigo font-semibold">{wearable.sleep.score}</span></div>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex p-1 bg-secondary/80 rounded-xl overflow-x-auto">
        {sections.map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize whitespace-nowrap transition-all px-2 ${section === s ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground/70"}`}>
            {s === "activities" ? "📅 Log" : s}
          </button>
        ))}
      </div>

      {/* SLEEP */}
      {section === "sleep" && (
        <div className="space-y-3 slide-in">
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Total Sleep" value={wearable.sleep.totalHours} unit="hrs" colorClass="text-dl-indigo" icon={Moon} />
            <StatTile label="Sleep Score" value={wearable.sleep.score} unit="/100" colorClass="text-dl-emerald" icon={Star} />
            <StatTile label="Deep Sleep" value={wearable.sleep.deepHours} unit="hrs" colorClass="text-dl-purple" icon={Moon} />
            <StatTile label="REM Sleep" value={wearable.sleep.remHours} unit="hrs" colorClass="text-dl-blue" icon={Moon} />
          </div>
          <GlassCard>
            <SectionHeader title="Adjust Values" subtitle="Edit if needed" />
            <ListInput label="Total sleep" value={wearable.sleep.totalHours} unit="h" step={0.1} max={14} onChange={v => setWearable(w => ({ ...w, sleep: { ...w.sleep, totalHours: v } }))} />
            <ListInput label="Deep sleep" value={wearable.sleep.deepHours} unit="h" step={0.1} max={6} onChange={v => setWearable(w => ({ ...w, sleep: { ...w.sleep, deepHours: v } }))} />
            <ListInput label="REM sleep" value={wearable.sleep.remHours} unit="h" step={0.1} max={6} onChange={v => setWearable(w => ({ ...w, sleep: { ...w.sleep, remHours: v } }))} />
            <ListInput label="Sleep score" value={wearable.sleep.score} unit="/100" step={1} max={100} onChange={v => setWearable(w => ({ ...w, sleep: { ...w.sleep, score: v } }))} />
          </GlassCard>
          <button onClick={() => setSection("activity")} className="w-full py-3.5 border border-secondary rounded-2xl text-muted-foreground text-sm font-medium hover:bg-secondary transition-colors">Next: Activity →</button>
        </div>
      )}

      {/* ACTIVITY */}
      {section === "activity" && (
        <div className="space-y-3 slide-in">
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Steps" value={wearable.activity.steps.toLocaleString()} unit="" colorClass="text-dl-orange" icon={Footprints} />
            <StatTile label="Active kcal" value={wearable.activity.activeKcal} unit="" colorClass="text-dl-red" icon={Flame} />
            <StatTile label="HRV" value={wearable.body.hrv} unit="ms" colorClass="text-dl-blue" icon={Heart} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Resting HR" value={wearable.body.restingHR} unit="bpm" colorClass="text-dl-pink" icon={Heart} />
            <StatTile label="SpO₂" value={wearable.body.spo2} unit="%" colorClass="text-dl-emerald" icon={Wind} />
            <StatTile label="Body Batt." value={wearable.body.bodyBattery} unit="" colorClass="text-dl-yellow" icon={BatteryCharging} />
          </div>
          <GlassCard>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold">Workouts</h3>
              <button onClick={() => setWearable(p => ({ ...p, activity: { ...p.activity, workouts: [...p.activity.workouts, { type: "Running", durationMin: 30, intensity: "Moderate", avgHR: 145 }] } }))}
                className="flex items-center gap-1 text-xs text-dl-indigo font-medium">
                <Plus size={16} /> Add
              </button>
            </div>
            {wearable.activity.workouts.length === 0
              ? <p className="text-center text-sm text-muted-foreground py-3">No workouts logged</p>
              : wearable.activity.workouts.map((w, wi) => (
                <div key={wi} className="bg-secondary/40 rounded-2xl p-4 mb-2">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm font-semibold">{w.type}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{w.durationMin} min · {w.intensity} · {w.avgHR} bpm</div>
                    </div>
                    <button onClick={() => setWearable(p => ({ ...p, activity: { ...p.activity, workouts: p.activity.workouts.filter((_, i) => i !== wi) } }))}
                      className="text-muted-foreground hover:text-dl-red">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {["Running", "Cycling", "Weight Training", "HIIT", "Yoga", "Walking", "Swimming", "Other"].map(t => (
                      <button key={t} onClick={() => setWearable(p => { const wk = [...p.activity.workouts]; wk[wi] = { ...wk[wi], type: t }; return { ...p, activity: { ...p.activity, workouts: wk } }; })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${w.type === t ? "bg-dl-indigo/30 text-dl-indigo border border-dl-indigo/30" : "bg-muted/50 text-muted-foreground hover:text-foreground/70"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            }
          </GlassCard>
          <button onClick={() => setSection("nutrition")} className="w-full py-3.5 border border-secondary rounded-2xl text-muted-foreground text-sm font-medium hover:bg-secondary transition-colors">Next: Nutrition →</button>
        </div>
      )}

      {/* NUTRITION */}
      {section === "nutrition" && (
        <div className="space-y-3 slide-in">
          {/* Calorie Recommendation */}
          {(() => {
            const rec = calcCalorieRecommendation(profile, wearable);
            const allItems = nutrition.meals.flatMap(m => m.items || []);
            const eaten = allItems.reduce((s, i) => s + (i.kcal || 0), 0) || nutrition.calories;
            const remaining = rec.adjustedTarget - eaten;
            const pct = Math.min(100, Math.round((eaten / rec.adjustedTarget) * 100));
            return (
              <GlassCard className="border-dl-emerald/20 bg-dl-emerald/[0.03]">
                <div className="flex items-center gap-2 mb-3">
                  <UtensilsCrossed className="w-4 h-4 text-dl-emerald" />
                  <h3 className="text-sm font-semibold">Daily Calorie Target</h3>
                </div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-3xl font-bold text-dl-emerald">{rec.adjustedTarget.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">kcal recommended</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-secondary rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: remaining >= 0
                        ? "linear-gradient(90deg, hsl(var(--dl-emerald)), hsl(var(--dl-blue)))"
                        : "linear-gradient(90deg, hsl(var(--dl-orange)), hsl(var(--dl-red)))",
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs mb-3">
                  <span className="text-muted-foreground">Eaten: <span className="text-foreground font-semibold">{eaten.toLocaleString()}</span></span>
                  <span className={remaining >= 0 ? "text-dl-emerald font-semibold" : "text-dl-red font-semibold"}>
                    {remaining >= 0 ? `${remaining.toLocaleString()} left` : `${Math.abs(remaining).toLocaleString()} over`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-secondary/50 rounded-xl py-2">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">BMR</div>
                    <div className="text-sm font-semibold">{rec.bmr}</div>
                  </div>
                  <div className="bg-secondary/50 rounded-xl py-2">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Exercise</div>
                    <div className="text-sm font-semibold text-dl-orange">+{rec.exerciseBonus}</div>
                  </div>
                  <div className="bg-secondary/50 rounded-xl py-2">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Protein</div>
                    <div className="text-sm font-semibold text-dl-blue">{rec.proteinG}g</div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-2.5 leading-relaxed">
                  Based on your profile ({profile.heightCm}cm, {profile.weightKg}kg, {profile.age}y, {profile.goal} goal). Exercise bonus from today's active calories.
                </p>
              </GlassCard>
            );
          })()}
          {nutrition.meals.map((m, mi) => (
            <GlassCard key={mi}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  {["Breakfast", "Lunch", "Dinner", "Snack"].map(t => (
                    <button key={t} onClick={() => setNutrition(p => { const ms = [...p.meals]; ms[mi] = { ...ms[mi], name: t }; return { ...p, meals: ms }; })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${m.name === t ? "bg-dl-amber/20 text-dl-amber border border-dl-amber/30" : "bg-secondary text-muted-foreground hover:text-foreground/70"}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {nutrition.meals.length > 1 && (
                  <button onClick={() => setNutrition(p => ({ ...p, meals: p.meals.filter((_, i) => i !== mi) }))} className="text-muted-foreground hover:text-dl-red transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="space-y-2 mb-3">
                {(m.items || []).map((item, ii) => (
                  <div key={ii} className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2.5">
                    <span className="text-sm text-foreground flex-1">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.kcal > 0 ? item.kcal + "kcal" : ""}</span>
                    <span className="text-xs text-muted-foreground/60">{item.proteinG > 0 ? item.proteinG + "g protein" : ""}</span>
                    <button onClick={() => setNutrition(p => { const ms = [...p.meals]; ms[mi] = { ...ms[mi], items: (ms[mi].items || []).filter((_, i) => i !== ii) }; return { ...p, meals: ms }; })}
                      className="text-muted-foreground/50 hover:text-dl-red transition-colors ml-1 flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <AddFoodItem onAdd={(item) => setNutrition(p => { const ms = [...p.meals]; ms[mi] = { ...ms[mi], items: [...(ms[mi].items || []), item] }; return { ...p, meals: ms }; })} />
              <div className="mt-4 pt-4 border-t border-secondary/60">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Overall meal quality</span>
                  <span className="font-semibold text-foreground">{m.quality}/5</span>
                </div>
                <input type="range" min="1" max="5" step="1" value={m.quality} className="w-full"
                  onChange={e => { const ms = [...nutrition.meals]; ms[mi] = { ...ms[mi], quality: +e.target.value }; setNutrition(n => ({ ...n, meals: ms })); }} />
              </div>
              <textarea rows={1} placeholder="Notes about this meal..." className="mt-3 text-xs bg-foreground/[0.04] border border-foreground/[0.08] rounded-2xl text-foreground w-full resize-none outline-none p-3 leading-relaxed placeholder:text-foreground/20 focus:border-dl-indigo/50"
                value={m.notes || ""} onChange={e => setNutrition(p => { const ms = [...p.meals]; ms[mi] = { ...ms[mi], notes: e.target.value }; return { ...p, meals: ms }; })} />
            </GlassCard>
          ))}
          <button onClick={() => setNutrition(p => ({ ...p, meals: [...p.meals, { name: "Snack", quality: 3, notes: "", items: [] }] }))}
            className="w-full py-3.5 border border-secondary border-dashed rounded-2xl text-muted-foreground text-sm font-medium hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2">
            <Plus size={16} /> Add another meal
          </button>
          <GlassCard>
            <SectionHeader title="Daily Totals" />
            {(() => {
              const allItems = nutrition.meals.flatMap(m => m.items || []);
              const autoKcal = allItems.reduce((s, i) => s + (i.kcal || 0), 0);
              const autoProtein = allItems.reduce((s, i) => s + (i.proteinG || 0), 0);
              return (
                <div className="space-y-1">
                  <ListInput label="Water intake" value={nutrition.waterLiters} unit="L" step={0.25} max={8} onChange={v => setNutrition(n => ({ ...n, waterLiters: v }))} />
                  <ListInput label="Calories" value={autoKcal || nutrition.calories} unit="kcal" step={50} max={6000} onChange={v => setNutrition(n => ({ ...n, calories: v }))} />
                  <ListInput label="Protein" value={autoProtein || nutrition.proteinG} unit="g" step={5} max={400} onChange={v => setNutrition(n => ({ ...n, proteinG: v }))} />
                  <ListInput label="Alcohol" value={nutrition.alcoholUnits} unit="units" step={1} max={20} onChange={v => setNutrition(n => ({ ...n, alcoholUnits: v }))} />
                </div>
              );
            })()}
          </GlassCard>
          <button onClick={() => setSection("mood")} className="w-full py-3.5 border border-secondary rounded-2xl text-muted-foreground text-sm font-medium hover:bg-secondary transition-colors">Next: Mood →</button>
        </div>
      )}

      {/* MOOD */}
      {section === "mood" && (
        <div className="space-y-3 slide-in">
          <GlassCard>
            <SectionHeader title="Mental State" />
            <MoodRow label="Overall Mood" value={mood.overallMood} onChange={v => setMood(m => ({ ...m, overallMood: v }))} />
            <MoodRow label="Anxiety (1=calm)" value={mood.anxiety} onChange={v => setMood(m => ({ ...m, anxiety: v }))} />
            <MoodRow label="Focus & Clarity" value={mood.focus} onChange={v => setMood(m => ({ ...m, focus: v }))} />
            <MoodRow label="Mental Energy" value={mood.energy} onChange={v => setMood(m => ({ ...m, energy: v }))} />
          </GlassCard>
          <GlassCard>
            <SectionHeader title="Context" subtitle="Optional — helps AI analysis" />
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-2 block">Stress events today?</label>
              <textarea rows={2} placeholder="Anything notable..." value={mood.stressEvents}
                onChange={e => setMood(m => ({ ...m, stressEvents: e.target.value }))}
                className="bg-foreground/[0.04] border border-foreground/[0.08] rounded-2xl text-foreground w-full resize-none outline-none p-3 text-sm leading-relaxed placeholder:text-foreground/20 focus:border-dl-indigo/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">One thing you're grateful for</label>
              <textarea rows={2} placeholder="Optional..." value={mood.gratitude}
                onChange={e => setMood(m => ({ ...m, gratitude: e.target.value }))}
                className="bg-foreground/[0.04] border border-foreground/[0.08] rounded-2xl text-foreground w-full resize-none outline-none p-3 text-sm leading-relaxed placeholder:text-foreground/20 focus:border-dl-indigo/50" />
            </div>
          </GlassCard>
          <button onClick={() => setSection("activities")} className="w-full py-3.5 border border-secondary rounded-2xl text-muted-foreground text-sm font-medium hover:bg-secondary transition-colors">Next: Log Activities →</button>
        </div>
      )}

      {/* ACTIVITIES LOG */}
      {section === "activities" && (
        <div className="space-y-3 slide-in">
          {yesterdayEntry?.activities && yesterdayEntry.activities.length > 0 && (
            <GlassCard className="border-dl-orange/20 bg-dl-orange/5">
              <SectionHeader title="Yesterday's Activities" subtitle="For context — how does today feel compared?" />
              <div className="space-y-2">
                {yesterdayEntry.activities.map((a, i) => {
                  const at = ACTIVITY_TYPES.find(t => t.key === a.type) || ACTIVITY_TYPES[0];
                  const dur = durationHours(a.startTime, a.endTime);
                  const late = isLateNight(a.startTime);
                  return (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${at.bgClass} ${at.borderClass}`}>
                      <span className="text-lg">{at.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${at.colorClass}`}>{at.label}</div>
                        <div className="text-xs text-muted-foreground">{a.startTime} – {a.endTime} · {formatDuration(dur)}{a.notes ? " · " + a.notes : ""}</div>
                      </div>
                      {late && <span className="text-[10px] px-2 py-0.5 rounded bg-dl-orange/15 text-dl-orange border border-dl-orange/20 font-medium flex-shrink-0">Late</span>}
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          <GlassCard>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-semibold">Today's Activities</h3>
                <p className="text-xs text-muted-foreground mt-0.5">What did you do today? When?</p>
              </div>
              <button onClick={() => setShowAddActivity(true)}
                className="flex items-center gap-1.5 bg-dl-indigo/20 border border-dl-indigo/30 text-dl-indigo text-xs font-semibold px-3 py-2 rounded-xl hover:bg-dl-indigo/30 transition-colors">
                <Plus size={14} /> Add
              </button>
            </div>
            {todayActivities.length === 0
              ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-3xl mb-2">📅</div>
                  <p className="text-sm">No activities logged yet.</p>
                  <p className="text-xs mt-1 text-muted-foreground/50">Add gaming, work, social time and more.</p>
                </div>
              )
              : todayActivities.map(a => (
                <ActivityCard key={a.id} activity={a}
                  onUpdate={updated => setTodayActivities(acts => acts.map(x => x.id === a.id ? updated : x))}
                  onRemove={() => setTodayActivities(acts => acts.filter(x => x.id !== a.id))} />
              ))
            }
          </GlassCard>

          <GlassCard>
            <label className="text-xs text-muted-foreground mb-2 block">General note</label>
            <textarea rows={2} placeholder="Anything else notable..." value={note} onChange={e => setNote(e.target.value)}
              className="bg-foreground/[0.04] border border-foreground/[0.08] rounded-2xl text-foreground w-full resize-none outline-none p-3 text-sm leading-relaxed placeholder:text-foreground/20 focus:border-dl-indigo/50" />
          </GlassCard>

          <button onClick={onSubmit}
            className="w-full py-4 bg-foreground text-background font-semibold rounded-2xl shadow-xl shadow-foreground/10 active:scale-95 transition-all flex items-center justify-center gap-2 text-base">
            <CheckCircle size={18} /> Complete Check-in
          </button>
        </div>
      )}

      {/* Add Activity Sheet */}
      <BottomSheet open={showAddActivity} onClose={() => setShowAddActivity(false)} title="Add Activity">
        <p className="text-xs text-muted-foreground mb-4 -mt-1">What did you do today? Pick a type to add it.</p>
        <ActivityTypePicker onSelect={type => {
          setTodayActivities(acts => [...acts, { ...newActivityBlank(), type }]);
          setShowAddActivity(false);
        }} />
      </BottomSheet>
    </div>
  );
};


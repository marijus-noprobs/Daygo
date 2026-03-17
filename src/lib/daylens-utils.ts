import { ACTIVITY_TYPES, SAMPLE_ACTIVITIES, type DayEntry, type NutritionData, type MoodData, type Activity, type UserProfile, type WearableData } from "./daylens-constants";

// ─── STORAGE ──────────────────────────────────────────────────────────────────
export const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
export const load = <T>(k: string, fb: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };

// ─── MATH ─────────────────────────────────────────────────────────────────────
export const avg = (a: number[]) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

export const pearson = (xs: number[], ys: number[]) => {
  if (xs.length < 5) return 0;
  const mx = avg(xs), my = avg(ys);
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0));
  return den ? num / den : 0;
};

export const timeToHour = (t: string): number | null => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
};

export const durationHours = (start: string, end: string) => {
  if (!start || !end) return 0;
  let s = timeToHour(start)!, e = timeToHour(end)!;
  if (e < s) e += 24;
  return Math.max(0, e - s);
};

export const formatDuration = (h: number) => {
  if (h <= 0) return "0m";
  const hrs = Math.floor(h), mins = Math.round((h - hrs) * 60);
  return hrs > 0 ? (mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`) : `${mins}m`;
};

export const isLateNight = (startTime: string) => {
  const h = timeToHour(startTime);
  return h !== null && (h >= 22 || h < 3);
};

export const scoreGradient = (val: number, max = 5): [string, string] => {
  const n = val / max;
  if (n >= 0.65) return ["#D4FF5E", "#C5F467"];  // lime
  if (n >= 0.35) return ["#7B7BF7", "#6B6BE7"];  // blue
  return ["#F06B9E", "#E05B8E"];                   // pink
};

export const scoreLabel = (v: number) => (["", "Poor", "Fair", "Good", "Great", "Peak"][Math.round(v)] || "");

// ─── SIMULATION ───────────────────────────────────────────────────────────────
export const simulateWearable = (seed = 0) => {
  const r = (min: number, max: number) => min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min);
  const workoutTypes = ["Running", "HIIT", "Yoga", "Walking", "Cycling"];
  const intensities = ["Low", "Moderate", "High"];
  return {
    sleep: { totalHours: +(6 + r(0, 3)).toFixed(1), deepHours: +(0.6 + r(0, 1.2)).toFixed(1), remHours: +(1 + r(0, 1.4)).toFixed(1), score: Math.floor(58 + r(0, 42)), bedtime: "23:00", wakeTime: "07:00" },
    activity: { steps: Math.floor(3000 + r(0, 10000)), activeKcal: Math.floor(180 + r(0, 520)), standHours: Math.floor(7 + r(0, 7)), workouts: r(0, 1) > 0.45 ? [{ type: workoutTypes[Math.floor(r(0, 5))], durationMin: Math.floor(20 + r(0, 60)), intensity: intensities[Math.floor(r(0, 3))], avgHR: Math.floor(100 + r(0, 70)) }] : [] },
    body: { hrv: Math.floor(25 + r(0, 75)), restingHR: Math.floor(46 + r(0, 28)), spo2: +(95.5 + r(0, 3.5)).toFixed(1), bodyBattery: Math.floor(15 + r(0, 85)), stressLevel: Math.floor(10 + r(0, 80)), bloodPressureSys: Math.floor(105 + r(0, 35)), bloodPressureDia: Math.floor(65 + r(0, 25)) },
  };
};

export const buildSampleData = (): DayEntry[] => {
  const entries: DayEntry[] = [];
  const now = new Date();
  for (let i = 29; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const activities: Activity[] = SAMPLE_ACTIVITIES[i % SAMPLE_ACTIVITIES.length].map(a => ({ ...a, id: Date.now() + Math.random() }));
    const hasLateGaming = activities.some(a => a.type === "gaming" && isLateNight(a.startTime));
    const hasExercise = activities.some(a => a.type === "exercise");
    const lateDur = activities.filter(a => isLateNight(a.startTime)).reduce((s, a) => s + durationHours(a.startTime, a.endTime), 0);
    const moodBase = 3 - (hasLateGaming ? 1.2 : 0) + (hasExercise ? 0.8 : 0) - lateDur * 0.2;
    entries.push({
      date: d.toISOString().split("T")[0],
      wearable: simulateWearable(i),
      nutrition: {
        meals: [
          { name: "Breakfast", quality: Math.ceil(2 + Math.random() * 3), notes: "", items: [] },
          { name: "Lunch", quality: Math.ceil(2 + Math.random() * 3), notes: "", items: [] },
        ],
        waterLiters: +(1.5 + Math.random() * 2).toFixed(1),
        calories: Math.floor(1600 + Math.random() * 900),
        proteinG: Math.floor(60 + Math.random() * 100),
        alcoholUnits: activities.some(a => a.type === "drinking") ? Math.ceil(Math.random() * 3) : 0,
      },
      mood: {
        overallMood: Math.min(5, Math.max(1, Math.round(moodBase + Math.random() * 1.5))),
        anxiety: Math.min(5, Math.max(1, Math.round(2 + (hasLateGaming ? 0.8 : 0) + Math.random() * 1.5))),
        focus: Math.min(5, Math.max(1, Math.round(moodBase + Math.random()))),
        energy: Math.min(5, Math.max(1, Math.round(moodBase - 0.5 + Math.random() * 1.5))),
        stressEvents: "",
        gratitude: "",
      },
      activities,
      note: "",
    });
  }
  return entries;
};

export const computeDayScore = (e: DayEntry) => {
  if (!e?.wearable) return 0;
  const w = e.wearable, m = e.mood, n = e.nutrition;
  return avg([
    Math.min(5, (w.sleep.totalHours / 8) * 5),
    Math.min(5, (w.sleep.score / 100) * 5),
    Math.min(5, (w.activity.steps / 10000) * 5),
    w.activity.workouts?.length > 0 ? 4.5 : 2.5,
    Math.min(5, (w.body.hrv / 80) * 5),
    m.overallMood, 6 - m.anxiety, m.focus,
    Math.min(5, (n.waterLiters / 2.5) * 5),
    Math.min(5, avg(n.meals.map(ml => ml.quality))),
  ]);
};

export const getMetricVal = (entry: DayEntry, metric: string) => {
  const fns: Record<string, (e: DayEntry) => number> = {
    sleep_hrs: e => e.wearable.sleep.totalHours,
    steps: e => e.wearable.activity.steps,
    hrv: e => e.wearable.body.hrv,
    water: e => e.nutrition.waterLiters,
    mood: e => e.mood.overallMood,
    protein: e => e.nutrition.proteinG,
    bedtime: e => { const h = timeToHour(e.wearable.sleep.bedtime); return h && h > 12 ? h - 24 : h || 0; },
  };
  return fns[metric] ? fns[metric](entry) : 0;
};

// ─── ACTIVITY CORRELATION ENGINE ──────────────────────────────────────────────
export interface ActivityCorrelation {
  type: string;
  label: string;
  emoji: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  diff: number;
  avgWith: number;
  avgWithout: number;
  avgDuration: number;
  sampleSize: number;
}

export const computeActivityCorrelations = (entries: DayEntry[]): ActivityCorrelation[] => {
  if (entries.length < 7) return [];
  const pairs: { yesterday: DayEntry; today: DayEntry }[] = [];
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i < sorted.length; i++) {
    if (!sorted[i - 1].activities || !sorted[i].wearable) continue;
    pairs.push({ yesterday: sorted[i - 1], today: sorted[i] });
  }
  if (pairs.length < 5) return [];

  const results: ActivityCorrelation[] = [];

  ACTIVITY_TYPES.forEach(at => {
    const withAct = pairs.filter(p => p.yesterday.activities.some(a => a.type === at.key));
    const withoutAct = pairs.filter(p => !p.yesterday.activities.some(a => a.type === at.key));
    if (withAct.length < 3 || withoutAct.length < 3) return;
    const scoresWith = withAct.map(p => computeDayScore(p.today));
    const scoresWithout = withoutAct.map(p => computeDayScore(p.today));
    const diff = avg(scoresWith) - avg(scoresWithout);
    const avgDuration = avg(withAct.map(p => p.yesterday.activities.filter(a => a.type === at.key).reduce((s, a) => s + durationHours(a.startTime, a.endTime), 0)));
    results.push({
      type: at.key, label: at.label, emoji: at.emoji,
      colorClass: at.colorClass, bgClass: at.bgClass, borderClass: at.borderClass,
      diff, avgWith: +avg(scoresWith).toFixed(2), avgWithout: +avg(scoresWithout).toFixed(2),
      avgDuration, sampleSize: withAct.length,
    });
  });

  // Late-night impact
  const lateNightPairs = pairs.filter(p => p.yesterday.activities.some(a => isLateNight(a.startTime)));
  const normalPairs = pairs.filter(p => !p.yesterday.activities.some(a => isLateNight(a.startTime)));
  if (lateNightPairs.length >= 3 && normalPairs.length >= 3) {
    results.push({
      type: "late_night", label: "Late Night (past 10pm)", emoji: "🌙",
      colorClass: "text-dl-indigo", bgClass: "bg-dl-indigo/10", borderClass: "border-dl-indigo/20",
      diff: avg(lateNightPairs.map(p => computeDayScore(p.today))) - avg(normalPairs.map(p => computeDayScore(p.today))),
      avgWith: +avg(lateNightPairs.map(p => computeDayScore(p.today))).toFixed(2),
      avgWithout: +avg(normalPairs.map(p => computeDayScore(p.today))).toFixed(2),
      avgDuration: avg(lateNightPairs.map(p => p.yesterday.activities.filter(a => isLateNight(a.startTime)).reduce((s, a) => s + durationHours(a.startTime, a.endTime), 0))),
      sampleSize: lateNightPairs.length,
    });
  }

  return results.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
};

export interface Anomaly {
  label: string;
  direction: string;
  z: string;
  color: string;
}

export const detectAnomalies = (entries: DayEntry[]): Anomaly[] => {
  if (entries.length < 10) return [];
  const recent = entries.slice(0, 3), base = entries.slice(3);
  const checks = [
    { key: (e: DayEntry) => e.wearable.body.hrv, label: "HRV", low: true, color: "#FF453A" },
    { key: (e: DayEntry) => e.mood.overallMood, label: "Mood", low: true, color: "#FF453A" },
    { key: (e: DayEntry) => e.wearable.sleep.totalHours, label: "Sleep", low: true, color: "#FF453A" },
    { key: (e: DayEntry) => e.mood.anxiety, label: "Anxiety", low: false, color: "#FF9F0A" },
  ];
  return checks.flatMap(({ key, label, low, color }) => {
    const bm = avg(base.map(key)), bs = Math.sqrt(avg(base.map(k => (key(k) - bm) ** 2)));
    const rm = avg(recent.map(key)), z = bs ? (rm - bm) / bs : 0;
    if (low && z < -1.5) return [{ label, direction: "lower than usual", z: Math.abs(z).toFixed(1), color }];
    if (!low && z > 1.5) return [{ label, direction: "higher than usual", z: Math.abs(z).toFixed(1), color }];
    return [];
  });
};

export const defaultNutrition = (): NutritionData => ({
  meals: [
    { name: "Breakfast", quality: 3, notes: "", items: [] },
    { name: "Lunch", quality: 3, notes: "", items: [] },
  ],
  waterLiters: 1.5, calories: 1800, proteinG: 80, alcoholUnits: 0,
});

export const defaultMood = (): MoodData => ({
  overallMood: 3, anxiety: 2, focus: 3, energy: 3, stressEvents: "", gratitude: "",
});

export const newActivityBlank = (): Activity => ({
  id: Date.now() + Math.random(), type: "gaming", startTime: "21:00", endTime: "23:00", notes: "",
});

export const getGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

// ─── CALORIE RECOMMENDATION ENGINE ───────────────────────────────────────────

/** Mifflin-St Jeor BMR */
export const calcBMR = (profile: UserProfile): number => {
  const { weightKg, heightCm, age, sex } = profile;
  if (sex === "male") return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
};

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_OFFSETS: Record<string, number> = {
  lose: -500,
  maintain: 0,
  gain: 400,
};

/** Base TDEE from profile (without today's exercise) */
export const calcTDEE = (profile: UserProfile): number => {
  const bmr = calcBMR(profile);
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
};

/** Goal-adjusted daily target (without exercise bonus) */
export const calcDailyTarget = (profile: UserProfile): number => {
  return calcTDEE(profile) + (GOAL_OFFSETS[profile.goal] || 0);
};

/** Estimate extra kcal burned from today's logged workouts */
export const calcExerciseBonus = (wearable: WearableData | null): number => {
  if (!wearable) return 0;
  return wearable.activity.activeKcal;
};

/** Full recommendation including exercise adjustment */
export const calcCalorieRecommendation = (profile: UserProfile, wearable: WearableData | null) => {
  const bmr = calcBMR(profile);
  const tdee = calcTDEE(profile);
  const baseTarget = calcDailyTarget(profile);
  const exerciseBonus = calcExerciseBonus(wearable);
  const adjustedTarget = baseTarget + exerciseBonus;
  const proteinG = Math.round(profile.weightKg * (profile.goal === "gain" ? 2.0 : profile.goal === "lose" ? 1.8 : 1.6));

  return { bmr: Math.round(bmr), tdee, baseTarget, exerciseBonus, adjustedTarget, proteinG };
};

// ─── STREAKS & BADGES ────────────────────────────────────────────────────────

export const calcStreak = (entries: DayEntry[], metric: string, target: number, op: "gte" | "lte"): { current: number; best: number } => {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  let current = 0;
  let best = 0;
  let streak = 0;
  let foundBreak = false;

  for (const e of sorted) {
    const val = getMetricVal(e, metric);
    const hit = op === "gte" ? val >= target : val <= target;
    if (hit) {
      streak++;
      if (!foundBreak) current = streak;
    } else {
      foundBreak = true;
      best = Math.max(best, streak);
      streak = 0;
    }
  }
  best = Math.max(best, streak);
  return { current, best };
};

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  earned: boolean;
}

export const computeBadges = (entries: DayEntry[]): Badge[] => {
  const totalDays = entries.length;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  const sleepStreaks = calcStreak(entries, "sleep_hrs", 7, "gte");
  const stepStreaks = calcStreak(entries, "steps", 8000, "gte");
  const moodStreaks = calcStreak(entries, "mood", 4, "gte");

  const perfectDays = entries.filter(e => computeDayScore(e) >= 4).length;
  const workoutDays = entries.filter(e => e.wearable.activity.workouts?.length > 0).length;
  const waterDays = entries.filter(e => e.nutrition.waterLiters >= 2.5).length;

  return [
    { id: "first_log", emoji: "🌱", title: "First Step", description: "Log your first day", earned: totalDays >= 1 },
    { id: "week_streak", emoji: "🔥", title: "On Fire", description: "7-day logging streak", earned: totalDays >= 7 },
    { id: "month_streak", emoji: "💎", title: "Diamond Habit", description: "30-day logging streak", earned: totalDays >= 30 },
    { id: "sleep_7", emoji: "😴", title: "Sleep Champion", description: "7+ hrs sleep for 7 days straight", earned: sleepStreaks.best >= 7 },
    { id: "steps_7", emoji: "🏃", title: "Step Master", description: "8K+ steps for 7 days straight", earned: stepStreaks.best >= 7 },
    { id: "mood_5", emoji: "😊", title: "Good Vibes", description: "Mood 4+ for 5 days straight", earned: moodStreaks.best >= 5 },
    { id: "perfect_5", emoji: "⭐", title: "Star Performer", description: "5 days with score ≥ 4.0", earned: perfectDays >= 5 },
    { id: "workout_10", emoji: "💪", title: "Gym Rat", description: "10 days with workouts logged", earned: workoutDays >= 10 },
    { id: "hydrated_7", emoji: "💧", title: "Hydration Hero", description: "2.5L+ water for 7 days", earned: waterDays >= 7 },
    { id: "perfect_10", emoji: "👑", title: "Royalty", description: "10 days with score ≥ 4.0", earned: perfectDays >= 10 },
  ];
};

// ─── REPORT GENERATION ───────────────────────────────────────────────────────

export interface WeeklyReport {
  period: string;
  startDate: string;
  endDate: string;
  daysLogged: number;
  avgScore: number;
  avgSleep: number;
  avgSteps: number;
  avgHRV: number;
  avgMood: number;
  avgCalories: number;
  avgProtein: number;
  avgWater: number;
  workoutDays: number;
  lateNightDays: number;
  topActivity: { label: string; emoji: string; count: number } | null;
  scoreChange: number | null; // vs previous period
}

export const generateWeeklyReports = (entries: DayEntry[]): WeeklyReport[] => {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 3) return [];

  const weeks: DayEntry[][] = [];
  let currentWeek: DayEntry[] = [];

  sorted.forEach((e, i) => {
    currentWeek.push(e);
    if (currentWeek.length === 7 || i === sorted.length - 1) {
      if (currentWeek.length >= 3) weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  return weeks.map((week, idx) => {
    const prevWeek = idx > 0 ? weeks[idx - 1] : null;
    const scores = week.map(computeDayScore);

    // Count activities
    const actCounts: Record<string, number> = {};
    week.forEach(e => e.activities?.forEach(a => { actCounts[a.type] = (actCounts[a.type] || 0) + 1; }));
    const topActKey = Object.entries(actCounts).sort((a, b) => b[1] - a[1])[0];
    const actType = topActKey ? ACTIVITY_TYPES.find(a => a.key === topActKey[0]) : null;

    return {
      period: `Week ${idx + 1}`,
      startDate: week[0].date,
      endDate: week[week.length - 1].date,
      daysLogged: week.length,
      avgScore: +avg(scores).toFixed(2),
      avgSleep: +avg(week.map(e => e.wearable.sleep.totalHours)).toFixed(1),
      avgSteps: Math.round(avg(week.map(e => e.wearable.activity.steps))),
      avgHRV: Math.round(avg(week.map(e => e.wearable.body.hrv))),
      avgMood: +avg(week.map(e => e.mood.overallMood)).toFixed(1),
      avgCalories: Math.round(avg(week.map(e => e.nutrition.calories))),
      avgProtein: Math.round(avg(week.map(e => e.nutrition.proteinG))),
      avgWater: +avg(week.map(e => e.nutrition.waterLiters)).toFixed(1),
      workoutDays: week.filter(e => e.wearable.activity.workouts?.length > 0).length,
      lateNightDays: week.filter(e => e.activities?.some(a => isLateNight(a.startTime))).length,
      topActivity: actType && topActKey ? { label: actType.label, emoji: actType.emoji, count: topActKey[1] } : null,
      scoreChange: prevWeek ? +(avg(scores) - avg(prevWeek.map(computeDayScore))).toFixed(2) : null,
    };
  }).reverse(); // most recent first
};

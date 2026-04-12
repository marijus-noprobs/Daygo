import type { DayEntry, WearableData } from "./daylens-constants";
import { avg } from "./daylens-utils";

// ─── RECOVERY SCORE (0-100%) ────────────────────────────────────────────────
export interface RecoveryData {
  score: number;
  level: "green" | "yellow" | "red";
  label: string;
  factors: { label: string; value: number; weight: number; status: "good" | "fair" | "poor" }[];
  recommendation: string;
}

export const computeRecovery = (entry: DayEntry, recent: DayEntry[]): RecoveryData | null => {
  if (!entry?.wearable) return null;
  const w = entry.wearable;
  const avgHRV = avg(recent.filter(e => e.wearable).map(e => e.wearable!.body.hrv));
  const avgRHR = avg(recent.filter(e => e.wearable).map(e => e.wearable!.body.restingHR));

  // HRV relative to baseline (40% weight)
  const hrvRatio = avgHRV > 0 ? w.body.hrv / avgHRV : 1;
  const hrvScore = Math.min(100, Math.max(0, hrvRatio * 70 + 15));

  // RHR relative to baseline (25% weight) — lower is better
  const rhrRatio = avgRHR > 0 ? avgRHR / w.body.restingHR : 1;
  const rhrScore = Math.min(100, Math.max(0, rhrRatio * 65 + 20));

  // Sleep quality (25% weight)
  const sleepScore = w.sleep.score;

  // SpO2 (10% weight)
  const spo2Score = Math.min(100, Math.max(0, (w.body.spo2 - 90) * 10));

  const total = Math.round(hrvScore * 0.4 + rhrScore * 0.25 + sleepScore * 0.25 + spo2Score * 0.1);

  const factors = [
    { label: "HRV", value: w.body.hrv, weight: 40, status: hrvScore >= 70 ? "good" as const : hrvScore >= 45 ? "fair" as const : "poor" as const },
    { label: "Resting HR", value: w.body.restingHR, weight: 25, status: rhrScore >= 70 ? "good" as const : rhrScore >= 45 ? "fair" as const : "poor" as const },
    { label: "Sleep Score", value: w.sleep.score, weight: 25, status: sleepScore >= 75 ? "good" as const : sleepScore >= 55 ? "fair" as const : "poor" as const },
    { label: "SpO₂", value: w.body.spo2, weight: 10, status: spo2Score >= 70 ? "good" as const : spo2Score >= 45 ? "fair" as const : "poor" as const },
  ];

  const level = total >= 67 ? "green" : total >= 34 ? "yellow" : "red";
  const label = total >= 67 ? "Recovered" : total >= 34 ? "Moderate" : "Under-recovered";
  const recommendation = total >= 67
    ? "You're well recovered. Push yourself today — high intensity is on the table."
    : total >= 34
    ? "Moderate recovery. Stick to steady-state cardio or skill work. Avoid max efforts."
    : "Your body needs rest. Light movement only — yoga, walking, or a full rest day.";

  return { score: total, level, label, factors, recommendation };
};

// ─── LOAD SCORE (0-21) ─────────────────────────────────────────────────────
export interface LoadData {
  score: number;
  level: "light" | "moderate" | "high" | "overreaching";
  label: string;
  zones: { zone: number; label: string; minutes: number; color: string }[];
  activeKcal: number;
  peakHR: number;
  avgHR: number;
}

const loadFromHR = (avgHR: number, durationMin: number, restingHR: number): number => {
  const maxHR = 220 - 30; // assume age 30
  const hrReserve = maxHR - restingHR;
  const intensity = (avgHR - restingHR) / hrReserve;
  // WHOOP-style logarithmic scale
  return Math.min(21, Math.max(0, Math.log2(1 + intensity * durationMin / 10) * 3.5));
};

export const computeLoad = (entry: DayEntry): LoadData | null => {
  if (!entry?.wearable) return null;
  const w = entry.wearable;
  const workouts = w.activity.workouts || [];
  const rhr = w.body.restingHR;

  // Calculate load from workouts
  let totalLoad = 0;
  workouts.forEach(wo => {
    totalLoad += loadFromHR(wo.avgHR, wo.durationMin, rhr);
  });

  // Add baseline load from daily activity (steps)
  const baseLoad = Math.min(5, (w.activity.steps / 10000) * 3);
  totalLoad = Math.min(21, totalLoad + baseLoad);
  totalLoad = Math.round(totalLoad * 10) / 10;

  // Simulate HR zones
  const totalMin = workouts.reduce((s, wo) => s + wo.durationMin, 0) + Math.floor(w.activity.steps / 100);
  const zones = [
    { zone: 1, label: "Rest", minutes: Math.max(0, Math.round(totalMin * 0.3)), color: "rgba(255,255,255,0.15)" },
    { zone: 2, label: "Light", minutes: Math.round(totalMin * 0.25), color: "rgba(255,255,255,0.3)" },
    { zone: 3, label: "Moderate", minutes: Math.round(totalMin * 0.2), color: "hsl(84 100% 50% / 0.5)" },
    { zone: 4, label: "Hard", minutes: Math.round(totalMin * 0.15), color: "hsl(84 100% 50% / 0.8)" },
    { zone: 5, label: "Max", minutes: Math.round(totalMin * 0.1), color: "hsl(84 100% 50%)" },
  ];

  const peakHR = workouts.length > 0 ? Math.max(...workouts.map(wo => wo.avgHR + Math.floor(Math.random() * 20))) : Math.floor(rhr + 30);
  const avgHR = workouts.length > 0 ? Math.round(avg(workouts.map(wo => wo.avgHR))) : rhr + 15;

  const level = totalLoad >= 18 ? "overreaching" : totalLoad >= 14 ? "high" : totalLoad >= 8 ? "moderate" : "light";
  const label = totalLoad >= 18 ? "Overreaching" : totalLoad >= 14 ? "High Load" : totalLoad >= 8 ? "Moderate" : "Light";

  return { score: totalLoad, level, label, zones, activeKcal: w.activity.activeKcal, peakHR, avgHR };
};

// ─── SLEEP COACH ────────────────────────────────────────────────────────────
export interface SleepCoachData {
  sleepDebt: number;
  optimalBedtime: string;
  consistencyScore: number;
  sleepNeed: number;
  avgSleep: number;
  trend: number;
  tips: string[];
}

export const computeSleepCoach = (entries: DayEntry[]): SleepCoachData | null => {
  const withSleep = entries.filter(e => e.wearable?.sleep);
  if (withSleep.length < 3) return null;

  const recent = [...withSleep].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  const sleepHours = recent.map(e => e.wearable!.sleep.totalHours);
  const sleepNeed = 7.5; // baseline
  const avgSleep = avg(sleepHours);
  const sleepDebt = Math.max(0, (sleepNeed - avgSleep) * recent.length);
  
  // Consistency: std dev of bedtimes
  const bedtimes = recent.map(e => {
    const [h, m] = e.wearable!.sleep.bedtime.split(":").map(Number);
    return h >= 12 ? h + m / 60 - 24 : h + m / 60;
  });
  const bedtimeStd = Math.sqrt(avg(bedtimes.map(b => (b - avg(bedtimes)) ** 2)));
  const consistencyScore = Math.round(Math.max(0, Math.min(100, 100 - bedtimeStd * 30)));

  // Trend
  const first7 = sleepHours.slice(0, 7);
  const last7 = sleepHours.slice(Math.max(0, sleepHours.length - 7));
  const trend = avg(first7) - avg(last7);

  // Optimal bedtime based on avg wake time and sleep need
  const wakeHours = recent.map(e => {
    const [h, m] = e.wearable!.sleep.wakeTime.split(":").map(Number);
    return h + m / 60;
  });
  const avgWake = avg(wakeHours);
  let optBed = avgWake - sleepNeed - 0.25; // 15 min to fall asleep
  if (optBed < 0) optBed += 24;
  const optH = Math.floor(optBed);
  const optM = Math.round((optBed - optH) * 60);
  const optimalBedtime = `${String(optH).padStart(2, "0")}:${String(optM).padStart(2, "0")}`;

  const tips: string[] = [];
  if (sleepDebt > 5) tips.push("You have significant sleep debt. Add 30 min to your sleep tonight.");
  if (consistencyScore < 60) tips.push("Your bedtime varies a lot. Try going to bed at the same time daily.");
  if (avgSleep < 7) tips.push("You're averaging under 7 hours. Prioritize an earlier bedtime.");
  if (trend > 0.3) tips.push("Your sleep has been improving — keep it up!");
  if (tips.length === 0) tips.push("Your sleep is looking solid. Maintain your rhythm.");

  return { sleepDebt: Math.round(sleepDebt * 10) / 10, optimalBedtime, consistencyScore, sleepNeed, avgSleep, trend, tips };
};

// ─── WEEKLY PERFORMANCE REPORT ──────────────────────────────────────────────
export interface PerformanceReport {
  period: string;
  avgRecovery: number;
  avgLoad: number;
  avgSleep: number;
  sleepConsistency: number;
  moodCorrelation: string;
  topInsight: string;
  metrics: { label: string; value: string; change: number | null }[];
}

export const generatePerformanceReport = (entries: DayEntry[]): PerformanceReport | null => {
  if (entries.length < 7) return null;
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  const prev = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(7, 14);

  const recoveries = recent.map(e => computeRecovery(e, entries)?.score || 50);
  const loads = recent.map(e => computeLoad(e)?.score || 5);
  const sleeps = recent.map(e => e.wearable?.sleep?.totalHours || 7);
  const moods = recent.map(e => e.mood.overallMood);

  const avgRec = Math.round(avg(recoveries));
  const avgLd = Math.round(avg(loads) * 10) / 10;
  const avgSlp = Math.round(avg(sleeps) * 10) / 10;

  const prevRec = prev.length >= 3 ? Math.round(avg(prev.map(e => computeRecovery(e, entries)?.score || 50))) : null;
  const prevLd = prev.length >= 3 ? Math.round(avg(prev.map(e => computeLoad(e)?.score || 5)) * 10) / 10 : null;
  const prevSlp = prev.length >= 3 ? Math.round(avg(prev.map(e => e.wearable?.sleep?.totalHours || 7)) * 10) / 10 : null;

  // Mood correlation insight
  const highRecDays = recent.filter((_, i) => recoveries[i] >= 67);
  const lowRecDays = recent.filter((_, i) => recoveries[i] < 34);
  const moodWithHighRec = highRecDays.length > 0 ? avg(highRecDays.map(e => e.mood.overallMood)) : 0;
  const moodCorrelation = moodWithHighRec >= 4
    ? "High recovery days strongly correlate with better mood"
    : "Recovery and mood show mixed correlation this week";

  const topInsight = avgRec >= 67
    ? `Strong week — ${avgRec}% avg recovery with ${avgLd} avg load. Your body is handling the load well.`
    : avgRec >= 34
    ? `Mixed recovery this week (${avgRec}%). Consider reducing load on low-recovery days.`
    : `Tough week — recovery averaged ${avgRec}%. Prioritize sleep and reduce intensity next week.`;

  return {
    period: `${recent[recent.length - 1].date} → ${recent[0].date}`,
    avgRecovery: avgRec,
    avgLoad: avgLd,
    avgSleep: avgSlp,
    sleepConsistency: computeSleepCoach(entries)?.consistencyScore || 70,
    moodCorrelation,
    topInsight,
    metrics: [
      { label: "Recovery", value: `${avgRec}%`, change: prevRec ? avgRec - prevRec : null },
      { label: "Load", value: `${avgLd}`, change: prevLd ? Math.round((avgLd - prevLd) * 10) / 10 : null },
      { label: "Sleep", value: `${avgSlp}h`, change: prevSlp ? Math.round((avgSlp - prevSlp) * 10) / 10 : null },
      { label: "Mood", value: `${avg(moods).toFixed(1)}/5`, change: prev.length >= 3 ? Math.round((avg(moods) - avg(prev.map(e => e.mood.overallMood))) * 10) / 10 : null },
    ],
  };
};

// ─── COMMUNITY CHALLENGES ───────────────────────────────────────────────────
export interface Challenge {
  id: string;
  name: string;
  description: string;
  metric: "load" | "recovery" | "sleep" | "steps";
  goal: string;
  startDate: string;
  endDate: string;
  participants: { name: string; avatar: string; score: number }[];
  userScore: number;
  userRank: number;
  status: "active" | "upcoming" | "completed";
}

export const generateMockChallenges = (entries: DayEntry[]): Challenge[] => {
  const now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
  const nextWeek = new Date(now); nextWeek.setDate(nextWeek.getDate() + 7);

  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  const userLoad = Math.round(recent.reduce((s, e) => s + (computeLoad(e)?.score || 5), 0) * 10) / 10;
  const userSleep = Math.round(avg(recent.map(e => e.wearable?.sleep?.totalHours || 7)) * 10) / 10;
  const userSteps = Math.round(avg(recent.map(e => e.wearable?.activity?.steps || 5000)));

  return [
    {
      id: "weekly-load",
      name: "Weekly Load Challenge",
      description: "Accumulate the highest total load this week",
      metric: "load",
      goal: "100+ total load",
      startDate: weekAgo.toISOString().split("T")[0],
      endDate: now.toISOString().split("T")[0],
      status: "active",
      userScore: userLoad,
      userRank: 3,
      participants: [
        { name: "Alex M.", avatar: "AM", score: userLoad + 18.2 },
        { name: "Sarah K.", avatar: "SK", score: userLoad + 7.5 },
        { name: "You", avatar: "YO", score: userLoad },
        { name: "Mike R.", avatar: "MR", score: userLoad - 4.3 },
        { name: "Jess T.", avatar: "JT", score: userLoad - 11.8 },
      ].sort((a, b) => b.score - a.score),
    },
    {
      id: "sleep-streak",
      name: "7-Hour Sleep Streak",
      description: "Sleep 7+ hours every night for a week",
      metric: "sleep",
      goal: "7+ hrs × 7 nights",
      startDate: weekAgo.toISOString().split("T")[0],
      endDate: now.toISOString().split("T")[0],
      status: "active",
      userScore: recent.filter(e => (e.wearable?.sleep?.totalHours || 0) >= 7).length,
      userRank: 2,
      participants: [
        { name: "Lisa P.", avatar: "LP", score: 7 },
        { name: "You", avatar: "YO", score: recent.filter(e => (e.wearable?.sleep?.totalHours || 0) >= 7).length },
        { name: "Tom B.", avatar: "TB", score: 5 },
        { name: "Amy W.", avatar: "AW", score: 4 },
      ].sort((a, b) => b.score - a.score),
    },
    {
      id: "step-challenge",
      name: "10K Steps Daily",
      description: "Average 10,000+ steps per day this week",
      metric: "steps",
      goal: "10K avg steps/day",
      startDate: nextWeek.toISOString().split("T")[0],
      endDate: new Date(nextWeek.getTime() + 7 * 86400000).toISOString().split("T")[0],
      status: "upcoming",
      userScore: 0,
      userRank: 0,
      participants: [],
    },
  ];
};

import { useState, useMemo } from "react";
import { Home, TrendingUp, ClipboardList, Heart, User, Zap, SlidersHorizontal, Plus, ChevronRight } from "lucide-react";
import { BottomSheet } from "./DayLensUI";
import { MoodCalendar } from "./MoodCalendar";
import { CheckInScreen } from "./CheckInScreen";
import { InsightScreen } from "./InsightScreen";
import { GoalsScreen } from "./GoalsScreen";
import { AccountScreen } from "./AccountScreen";
import { OnboardingScreen } from "./OnboardingScreen";
import { SentimentScreen } from "./SentimentScreen";
import { HealthMetricsScreen } from "./HealthMetricsScreen";
import { PLAN_OPTIONS, DEFAULT_GOALS, DEFAULT_PROFILE, type Goal, type UserProfile, type WearableData, type NutritionData, type MoodData, type Activity, type DayEntry } from "@/lib/daylens-constants";
import { save, load, buildSampleData, computeDayScore, defaultNutrition, defaultMood, getGreeting, calcCalorieRecommendation, detectActivityLevel, generateHealthSuggestions } from "@/lib/daylens-utils";
import { ACTIVITY_LEVEL_LABELS } from "@/lib/daylens-constants";

const DayLensApp = () => {
  const [onboarded, setOnboarded] = useState<boolean>(() => load("dl_onboarded", false));
  const [entries, setEntries] = useState<DayEntry[]>(() => load("dl_entries", buildSampleData()));
  const [goals, setGoals] = useState<Goal[]>(() => load("dl_goals", DEFAULT_GOALS));
  const [profile, setProfile] = useState<UserProfile>(() => load("dl_profile", DEFAULT_PROFILE));
  const [plan, setPlan] = useState<string>(() => load("dl_plan", "free"));
  const [screen, setScreen] = useState("checkin");
  const [wearable, setWearable] = useState<WearableData | null>(null);
  const [nutrition, setNutrition] = useState<NutritionData>(defaultNutrition());
  const [mood, setMood] = useState<MoodData>(defaultMood());
  const [todayActivities, setTodayActivities] = useState<Activity[]>([]);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showSentiment, setShowSentiment] = useState<boolean>(() => {
    const todayKey = new Date().toISOString().split("T")[0];
    return !load(`dl_sentiment_done_${todayKey}`, false);
  });

  useState(() => { save("dl_entries", entries); });

  const today = new Date().toISOString().split("T")[0];
  const isPro = plan !== "free";
  const isPremium = plan === "premium";
  const hasToday = entries.some(e => e.date === today);
  const recent = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14), [entries]);
  const todayEntry = entries.find(e => e.date === today);
  const todayScore = todayEntry ? computeDayScore(todayEntry) : null;

  const detectedLevel = useMemo(() => detectActivityLevel(entries), [entries]);
  const detectedLevelLabel = detectedLevel ? ACTIVITY_LEVEL_LABELS[detectedLevel] || null : null;

  useMemo(() => {
    if (detectedLevel && detectedLevel !== profile.activityLevel) {
      const updated = { ...profile, activityLevel: detectedLevel };
      setProfile(updated);
      save("dl_profile", updated);
    }
  }, [detectedLevel]);

  const healthSuggestions = useMemo(() => generateHealthSuggestions(entries, profile), [entries, profile]);

  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayEntry = entries.find(e => e.date === yesterday.toISOString().split("T")[0]);

  const streak = useMemo(() => {
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
  }, [entries]);

  const handleSubmit = () => {
    if (!wearable) return;
    setEntries(p => [...p.filter(e => e.date !== today), { date: today, wearable, nutrition, mood, activities: todayActivities, note }]);
    setSubmitted(true);
    save("dl_entries", [...entries.filter(e => e.date !== today), { date: today, wearable, nutrition, mood, activities: todayActivities, note }]);
  };

  const NAV = [
    { id: "checkin", icon: Home, label: "Home" },
    { id: "health", icon: Heart, label: "Health" },
    { id: "insights", icon: TrendingUp, label: "Trends" },
    { id: "goals", icon: ClipboardList, label: "Goals" },
    { id: "account", icon: User, label: "Me" },
  ];

  const handleOnboardingComplete = (p: UserProfile) => {
    setProfile(p);
    save("dl_profile", p);
    setOnboarded(true);
    save("dl_onboarded", true);
  };

  if (!onboarded) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  const handleSentimentSubmit = (moodData: MoodData, sentimentNote: string) => {
    setMood(() => moodData);
    if (sentimentNote) setNote(sentimentNote);
    const todayKey = new Date().toISOString().split("T")[0];
    save(`dl_sentiment_done_${todayKey}`, true);
    setShowSentiment(false);
  };

  if (showSentiment) {
    return <SentimentScreen onSubmit={handleSentimentSubmit} onClose={() => setShowSentiment(false)} />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen relative">
      {/* Header — minimal dark */}
      <div className="header-dark">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-display text-[28px] font-extrabold text-foreground tracking-tight leading-none">
              {screen === "checkin" ? "Dashboard" : screen === "health" ? "Health" : screen === "insights" ? "Trends" : screen === "goals" ? "Goals" : "Profile"}
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <MoodCalendar entries={entries} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            <button className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-card transition-colors">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-card transition-colors" onClick={() => !hasToday && setScreen("checkin")}>
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="px-[18px] pt-2 pb-28 min-h-[60vh]">
        {screen === "checkin" && (
          <HomeScreen
            entries={entries} recent={recent} todayScore={todayScore} wearable={wearable}
            submitted={submitted} hasToday={hasToday} onViewInsights={() => setScreen("insights")}
            onGoToCheckin={() => setScreen("checkin")} setWearable={setWearable} setWearableRaw={setWearable}
            nutrition={nutrition} setNutrition={setNutrition} mood={mood} setMood={setMood}
            todayActivities={todayActivities} setTodayActivities={setTodayActivities}
            note={note} setNote={setNote} onSubmit={handleSubmit} yesterdayEntry={yesterdayEntry}
            profile={profile} isPro={isPro} onShowPricing={() => setShowPricing(true)} streak={streak}
          />
        )}
        {screen === "health" && <HealthMetricsScreen entries={entries} recent={recent} suggestions={healthSuggestions} detectedLevel={detectedLevel} detectedLevelLabel={detectedLevelLabel} />}
        {screen === "insights" && <InsightScreen entries={entries} recent={recent} isPro={isPro} onShowPricing={() => setShowPricing(true)} />}
        {screen === "goals" && <GoalsScreen goals={goals} setGoals={setGoals} entries={entries} recent={recent} isPremium={isPremium} onShowPricing={() => setShowPricing(true)} />}
        {screen === "account" && (
          <AccountScreen entries={entries} plan={plan} onShowPricing={() => setShowPricing(true)}
            onReset={() => { if (confirm("Reset all data?")) { setEntries(buildSampleData()); setGoals(DEFAULT_GOALS); } }}
            profile={profile} setProfile={(p) => { setProfile(p); save("dl_profile", p); }}
          />
        )}
      </main>

      {/* Bottom nav — minimal icons */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <nav className="flex items-center gap-0 px-5 h-[56px] rounded-full nav-blur">
          {NAV.map(item => {
            const active = screen === item.id;
            return (
              <button key={item.id} onClick={() => setScreen(item.id)}
                className={`flex items-center justify-center w-11 h-11 rounded-full transition-all ${active ? "bg-primary" : ""}`}>
                <item.icon className={`w-[18px] h-[18px] ${active ? "text-primary-foreground" : "text-muted-foreground"}`} strokeWidth={active ? 2.5 : 1.5} />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Pricing Sheet */}
      <BottomSheet open={showPricing} onClose={() => setShowPricing(false)} title="Unlock DayLens">
        <p className="text-[11px] text-muted-foreground mb-5 -mt-1">Discover how your activities, sleep and habits connect.</p>
        <div className="space-y-3 mb-5">
          {PLAN_OPTIONS.map(p => (
            <div key={p.id} onClick={() => { setPlan(p.id); save("dl_plan", p.id); setShowPricing(false); }}
              className={`relative p-4 rounded-[20px] border cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform ${
                p.id === plan ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}>
              {p.highlight && <span className="absolute -top-2 right-4 text-[10px] font-bold bg-dl-blue text-foreground px-2 py-0.5 rounded-full">Popular</span>}
              {plan === p.id && <span className="absolute top-4 right-4 text-foreground">✓</span>}
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-display font-bold text-base">{p.label}</span>
                <span className="font-display text-xl font-extrabold">{p.price}<span className="text-[11px] text-muted-foreground font-normal">{p.period}</span></span>
              </div>
              <ul className="space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-[11px] text-muted-foreground">✓ {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <button onClick={() => setShowPricing(false)} className="w-full py-3 text-[11px] text-muted-foreground hover:text-foreground/50 transition-colors">Maybe Later</button>
      </BottomSheet>
    </div>
  );
};

/* ─── Home Screen ──────────────────────────────────────────── */

const HomeScreen = ({
  entries, recent, todayScore, wearable, submitted, hasToday,
  onViewInsights, setWearable, setWearableRaw, nutrition, setNutrition,
  mood, setMood, todayActivities, setTodayActivities, note, setNote,
  onSubmit, yesterdayEntry, profile, isPro, onShowPricing, onGoToCheckin, streak,
}: any) => {
  const latestEntry = recent[0];
  const steps = latestEntry?.wearable?.activity?.steps || 12482;
  const kcal = latestEntry?.wearable?.activity?.activeKcal || 482;
  const hrv = latestEntry?.wearable?.body?.hrv || 72;
  const restingHR = latestEntry?.wearable?.body?.restingHR || 62;
  const sleepScore = latestEntry?.wearable?.sleep?.score || 82;
  const sleepTotal = latestEntry?.wearable?.sleep?.totalHours || 7.5;
  const deepSleep = latestEntry?.wearable?.sleep?.deepHours || 1.75;
  const remSleep = latestEntry?.wearable?.sleep?.remHours || 1.5;
  const bodyWeight = profile?.weightKg || 75;
  const score = todayScore || (latestEntry ? computeDayScore(latestEntry) : 8.5);

  if (!submitted && !hasToday && !wearable) {
    return (
      <CheckInScreen submitted={submitted} hasToday={hasToday} todayScore={todayScore} wearable={wearable}
        setWearable={(fn: any) => setWearable((w: any) => w ? fn(w) : w)} setWearableRaw={setWearableRaw}
        nutrition={nutrition} setNutrition={setNutrition} mood={mood} setMood={setMood}
        todayActivities={todayActivities} setTodayActivities={setTodayActivities}
        note={note} setNote={setNote} onSubmit={onSubmit} onViewInsights={onViewInsights}
        yesterdayEntry={yesterdayEntry} profile={profile} />
    );
  }

  if (!submitted && !hasToday && wearable) {
    return (
      <CheckInScreen submitted={submitted} hasToday={hasToday} todayScore={todayScore} wearable={wearable}
        setWearable={(fn: any) => setWearable((w: any) => w ? fn(w) : w)} setWearableRaw={setWearableRaw}
        nutrition={nutrition} setNutrition={setNutrition} mood={mood} setMood={setMood}
        todayActivities={todayActivities} setTodayActivities={setTodayActivities}
        note={note} setNote={setNote} onSubmit={onSubmit} onViewInsights={onViewInsights}
        yesterdayEntry={yesterdayEntry} profile={profile} />
    );
  }

  const goalPct = Math.min(100, Math.round((steps / 15000) * 100));
  const scoreNorm = Math.min(score, 10) / 10;
  const ringR = 28;
  const ringCirc = 2 * Math.PI * ringR;

  // Generate dot matrix for last 3 months
  const dotMatrix = useMemo(() => {
    const months: { label: string; dots: boolean[] }[] = [];
    const now = new Date();
    for (let m = 2; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const label = d.toLocaleString("default", { month: "short" });
      const dots: boolean[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        dots.push(entries.some((e: DayEntry) => e.date === dateStr));
      }
      months.push({ label, dots });
    }
    return months;
  }, [entries]);

  return (
    <div className="space-y-4 fade-up">
      {/* Top 2-col grid: Score ring + Body weight */}
      <div className="grid grid-cols-2 gap-3 fade-up d1">
        {/* Score card with ring */}
        <div className="card-dark p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="relative" style={{ width: 68, height: 68 }}>
              <svg width="68" height="68" className="transform -rotate-90">
                <circle cx="34" cy="34" r={ringR} fill="none" stroke="hsl(0 0% 15%)" strokeWidth="4" />
                <circle cx="34" cy="34" r={ringR} fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${scoreNorm * ringCirc} ${ringCirc}`}
                  style={{ transition: "stroke-dasharray .6s ease" }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-lg font-extrabold text-foreground">{score.toFixed(0)}</span>
              </div>
            </div>
            <button className="w-7 h-7 rounded-lg border border-border flex items-center justify-center">
              <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
          <div className="text-[13px] font-semibold text-foreground">Today's Score</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{streak > 0 ? `${streak}-day streak` : "Start your streak"}</div>
        </div>

        {/* Body weight card */}
        <div className="card-dark p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="font-display text-[36px] font-extrabold text-foreground leading-none tracking-tight">
              {bodyWeight}<span className="text-sm font-medium text-muted-foreground ml-0.5">kg</span>
            </div>
            <button className="w-7 h-7 rounded-lg border border-border flex items-center justify-center">
              <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
          <div className="text-[13px] font-semibold text-foreground">Body weight</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">31 min ago</div>
        </div>
      </div>

      {/* Dot matrix calendar card */}
      <div className="card-dark p-5 fade-up d2">
        <div className="flex justify-between mb-4">
          {dotMatrix.map((month) => (
            <div key={month.label} className="flex-1 text-center">
              <span className="text-[11px] text-muted-foreground font-medium">{month.label}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          {dotMatrix.map((month) => (
            <div key={month.label} className="flex-1">
              <div className="grid grid-cols-7 gap-[3px]">
                {month.dots.map((active, i) => (
                  <div key={i} className={`w-[5px] h-[5px] rounded-full ${active ? "bg-foreground" : "bg-border"}`} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Activity item below dots */}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border">
          <div className="w-10 h-10 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
            <span className="font-display text-sm font-bold text-foreground">{streak}</span>
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-foreground">Daily check-in</div>
            <div className="text-[11px] text-muted-foreground">Every day</div>
          </div>
          <button className="w-7 h-7 rounded-lg border border-border flex items-center justify-center">
            <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Stats card — Steps this week */}
      <div className="card-dark p-5 fade-up d3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-foreground">Steps today</div>
            <div className="text-[11px] text-muted-foreground">Last 7 days</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-[28px] font-extrabold text-foreground tracking-tight">{steps >= 1000 ? `${(steps/1000).toFixed(1)}` : steps}</span>
            <span className="text-sm text-muted-foreground font-medium">steps</span>
          </div>
          <button className="w-7 h-7 rounded-lg border border-border flex items-center justify-center">
            <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Bento grid — HR, Calories, HRV, Sleep */}
      <div className="grid grid-cols-2 gap-3 fade-up d4">
        <MetricCard label="Resting HR" value={String(restingHR)} unit="bpm" accentVar="--color-blue" />
        <MetricCard label="Burned" value={String(kcal)} unit="kcal" accentVar="--color-pink" />
        <MetricCard label="HRV" value={String(hrv)} unit="ms" accentVar="--color-lime" />
        <MetricCard label="Sleep" value={sleepTotal.toFixed(1)} unit="hrs" accentVar="--color-blue" />
      </div>

      {/* CTA */}
      {!hasToday ? (
        <div className="card-dark p-4 flex items-center justify-between cursor-pointer hover:bg-card/80 transition-colors fade-up d5" onClick={onGoToCheckin}>
          <div>
            <div className="text-[13px] font-semibold text-foreground">Log Today's Check-in</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Takes less than 2 minutes</div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      ) : (
        <div className="card-dark p-4 flex items-center justify-between cursor-pointer hover:bg-card/80 transition-colors fade-up d5" onClick={onViewInsights}>
          <div>
            <div className="text-[13px] font-semibold text-foreground">View Insights</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">See your trends and patterns</div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

/* ─── Metric Card ───────────────────────────────────────── */
const MetricCard = ({ label, value, unit, accentVar }: {
  label: string; value: string; unit: string; accentVar: string;
}) => (
  <div className="card-dark p-4">
    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-2">{label}</div>
    <div className="font-display text-[22px] font-extrabold tracking-tight leading-none" style={{ color: `hsl(var(${accentVar}))` }}>
      {value}<span className="text-[11px] font-normal text-muted-foreground ml-0.5">{unit}</span>
    </div>
  </div>
);

export default DayLensApp;

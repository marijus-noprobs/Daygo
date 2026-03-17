import { useState, useMemo } from "react";
import { Home, TrendingUp, ClipboardList, Heart, User, Plus, Zap, Download, RefreshCw, ChevronRight } from "lucide-react";
import { BottomSheet } from "./DayLensUI";
import { MoodCalendar } from "./MoodCalendar";
import { CheckInScreen } from "./CheckInScreen";
import { InsightScreen } from "./InsightScreen";
import { GoalsScreen } from "./GoalsScreen";
import { PerfectDayScreen } from "./PerfectDayScreen";
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

  // Auto-detect activity level from wearable data
  const detectedLevel = useMemo(() => detectActivityLevel(entries), [entries]);
  const detectedLevelLabel = detectedLevel ? ACTIVITY_LEVEL_LABELS[detectedLevel] || null : null;

  // Auto-update profile when detected level changes
  useMemo(() => {
    if (detectedLevel && detectedLevel !== profile.activityLevel) {
      const updated = { ...profile, activityLevel: detectedLevel };
      setProfile(updated);
      save("dl_profile", updated);
    }
  }, [detectedLevel]);

  // Generate health suggestions
  const healthSuggestions = useMemo(() => generateHealthSuggestions(entries, profile), [entries, profile]);

  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayEntry = entries.find(e => e.date === yesterday.toISOString().split("T")[0]);

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
      {/* Status Bar + Header Section */}
      <div className="header-lime px-6 pt-10 pb-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" strokeWidth={2} />
              </div>
              {isPro && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-dl-blue text-white uppercase">Pro</span>
              )}
            </div>
            <span className="text-xs text-primary-foreground/70 font-medium">Welcome Back, Jacob</span>
          </div>
          <div className="flex items-center gap-2">
            <MoodCalendar
              entries={entries}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="px-6 pt-6 pb-28 min-h-[60vh]">
        {screen === "checkin" && (
          <HomeScreen
            entries={entries}
            recent={recent}
            todayScore={todayScore}
            wearable={wearable}
            submitted={submitted}
            hasToday={hasToday}
            onViewInsights={() => setScreen("insights")}
            onGoToCheckin={() => setScreen("checkin")}
            setWearable={setWearable}
            setWearableRaw={setWearable}
            nutrition={nutrition}
            setNutrition={setNutrition}
            mood={mood}
            setMood={setMood}
            todayActivities={todayActivities}
            setTodayActivities={setTodayActivities}
            note={note}
            setNote={setNote}
            onSubmit={handleSubmit}
            yesterdayEntry={yesterdayEntry}
            profile={profile}
            isPro={isPro}
            onShowPricing={() => setShowPricing(true)}
          />
        )}
        {screen === "health" && <HealthMetricsScreen entries={entries} recent={recent} suggestions={healthSuggestions} detectedLevel={detectedLevel} detectedLevelLabel={detectedLevelLabel} />}
        {screen === "insights" && <InsightScreen entries={entries} recent={recent} isPro={isPro} onShowPricing={() => setShowPricing(true)} />}
        {screen === "goals" && <GoalsScreen goals={goals} setGoals={setGoals} entries={entries} recent={recent} isPremium={isPremium} onShowPricing={() => setShowPricing(true)} />}
        {screen === "account" && (
          <AccountScreen
            entries={entries} plan={plan}
            onShowPricing={() => setShowPricing(true)}
            onReset={() => { if (confirm("Reset all data?")) { setEntries(buildSampleData()); setGoals(DEFAULT_GOALS); } }}
            profile={profile}
            setProfile={(p) => { setProfile(p); save("dl_profile", p); }}
          />
        )}
      </main>

      {/* Floating pill bottom nav */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <nav className="flex items-center gap-0 px-4 h-16 rounded-full nav-blur shadow-2xl shadow-black/25">
          {NAV.map(item => {
            const active = screen === item.id;
            return (
              <button key={item.id} onClick={() => setScreen(item.id)}
                className={`flex items-center gap-2 h-10 px-4 rounded-full transition-all ${active ? "bg-primary" : ""}`}>
                <item.icon className={`w-5 h-5 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                {active && <span className="text-xs font-bold text-primary-foreground">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Pricing Sheet */}
      <BottomSheet open={showPricing} onClose={() => setShowPricing(false)} title="Unlock DayLens">
        <p className="text-sm text-muted-foreground mb-5 -mt-1">Discover how your activities, sleep and habits connect.</p>
        <div className="space-y-3 mb-5">
          {PLAN_OPTIONS.map(p => (
            <div key={p.id} onClick={() => { setPlan(p.id); save("dl_plan", p.id); setShowPricing(false); }}
              className={`relative p-4 rounded-2xl border cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform ${
                p.id === plan ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}>
              {p.highlight && <span className="absolute -top-2 right-4 text-[10px] font-bold bg-dl-blue text-white px-2 py-0.5 rounded-full">Popular</span>}
              {plan === p.id && <span className="absolute top-4 right-4 text-foreground">✓</span>}
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-semibold text-base">{p.label}</span>
                <span className="text-xl font-bold">{p.price}<span className="text-xs text-muted-foreground font-normal">{p.period}</span></span>
              </div>
              <ul className="space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">✓ {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <button onClick={() => setShowPricing(false)} className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">Maybe Later</button>
      </BottomSheet>
    </div>
  );
};

/* ─── Home Screen (Figma Design) ──────────────────────────────────────────── */

const HomeScreen = ({
  entries, recent, todayScore, wearable, submitted, hasToday,
  onViewInsights, setWearable, setWearableRaw, nutrition, setNutrition,
  mood, setMood, todayActivities, setTodayActivities, note, setNote,
  onSubmit, yesterdayEntry, profile, isPro, onShowPricing, onGoToCheckin,
}: any) => {
  // Get some data for display
  const latestEntry = recent[0];
  const steps = latestEntry?.wearable?.activity?.steps || 12482;
  const kcal = latestEntry?.wearable?.activity?.activeKcal || 482;
  const goalPct = latestEntry ? Math.min(100, Math.round((steps / 15000) * 100)) : 83;

  // If user needs to do check-in (no wearable synced), show the check-in flow
  if (!submitted && !hasToday && !wearable) {
    return (
      <CheckInScreen
        submitted={submitted} hasToday={hasToday} todayScore={todayScore}
        wearable={wearable}
        setWearable={(fn: any) => setWearable((w: any) => w ? fn(w) : w)}
        setWearableRaw={setWearableRaw}
        nutrition={nutrition} setNutrition={setNutrition}
        mood={mood} setMood={setMood}
        todayActivities={todayActivities} setTodayActivities={setTodayActivities}
        note={note} setNote={setNote}
        onSubmit={onSubmit} onViewInsights={onViewInsights}
        yesterdayEntry={yesterdayEntry}
        profile={profile}
      />
    );
  }

  if (!submitted && !hasToday && wearable) {
    return (
      <CheckInScreen
        submitted={submitted} hasToday={hasToday} todayScore={todayScore}
        wearable={wearable}
        setWearable={(fn: any) => setWearable((w: any) => w ? fn(w) : w)}
        setWearableRaw={setWearableRaw}
        nutrition={nutrition} setNutrition={setNutrition}
        mood={mood} setMood={setMood}
        todayActivities={todayActivities} setTodayActivities={setTodayActivities}
        note={note} setNote={setNote}
        onSubmit={onSubmit} onViewInsights={onViewInsights}
        yesterdayEntry={yesterdayEntry}
        profile={profile}
      />
    );
  }

  const sleepHrs = latestEntry?.wearable?.sleep?.totalHours || 7.2;
  const hrv = latestEntry?.wearable?.body?.hrv || 52;
  const restingHR = latestEntry?.wearable?.body?.restingHR || 58;
  const bodyBattery = latestEntry?.wearable?.body?.bodyBattery || 72;
  const sleepScore = latestEntry?.wearable?.sleep?.score || 78;
  const stressLevel = latestEntry?.wearable?.body?.stressLevel || 34;
  const workouts = latestEntry?.wearable?.activity?.workouts || [];

  const today_ = new Date();
  const dateStr = today_.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase();
  const dayStr = today_.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();

  return (
    <div className="space-y-0 fade-up -mx-6 -mt-6">
      {/* ── Hero metric block ── */}
      <div className="relative px-6 pt-2 pb-8">
        {/* Micro text top */}
        <div className="flex justify-between items-center mb-8">
          <span className="text-[8px] tracking-[0.3em] text-foreground/20 uppercase font-medium">daygo.ai __ performance __ tracking</span>
          <span className="text-[8px] tracking-[0.3em] text-foreground/20 uppercase font-medium">v2.0</span>
        </div>

        {/* Main step count — NOCTA style */}
        <div className="text-center mb-2">
          <p className="text-[9px] tracking-[0.4em] text-foreground/30 uppercase mb-3 font-medium">Daily Steps</p>
          <span className="text-6xl font-bold tracking-tight text-foreground font-display">{steps.toLocaleString()}</span>
        </div>

        {/* Thin divider line */}
        <div className="w-full h-px bg-foreground/10 mt-6" />

        {/* Framed stats row */}
        <div className="flex items-stretch mt-6">
          <div className="flex-1 border border-foreground/10 px-4 py-3">
            <p className="text-[8px] tracking-[0.3em] text-foreground/30 uppercase mb-1">Calories</p>
            <span className="text-lg font-bold text-foreground font-display">{kcal}</span>
            <span className="text-[9px] text-foreground/30 ml-1">kcal</span>
          </div>
          <div className="flex-1 border-y border-r border-foreground/10 px-4 py-3">
            <p className="text-[8px] tracking-[0.3em] text-foreground/30 uppercase mb-1">Goal</p>
            <span className="text-lg font-bold text-primary font-display">{goalPct}%</span>
          </div>
          <div className="flex-1 border-y border-r border-foreground/10 px-4 py-3">
            <p className="text-[8px] tracking-[0.3em] text-foreground/30 uppercase mb-1">Workouts</p>
            <span className="text-lg font-bold text-foreground font-display">{workouts.length}</span>
          </div>
        </div>
      </div>

      {/* ── Thin full-width divider ── */}
      <div className="w-full h-px bg-foreground/8" />

      {/* ── Vitals grid — framed cells ── */}
      <div className="px-6 py-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[10px] tracking-[0.35em] text-foreground/40 uppercase font-bold">Vitals</h2>
          <span className="text-[8px] tracking-[0.3em] text-foreground/15 uppercase">Live Data</span>
        </div>

        <div className="grid grid-cols-2 gap-0">
          {[
            { label: "Sleep", value: `${sleepHrs}`, unit: "hrs", sub: `Score ${sleepScore}%` },
            { label: "HRV", value: `${hrv}`, unit: "ms", sub: "Variability" },
            { label: "Resting HR", value: `${restingHR}`, unit: "bpm", sub: "Heart Rate" },
            { label: "Body Battery", value: `${bodyBattery}`, unit: "%", sub: "Recovery" },
          ].map((m, i) => (
            <div key={m.label} className={`border border-foreground/10 px-4 py-5 ${i < 2 ? "" : ""}`}>
              <p className="text-[8px] tracking-[0.3em] text-foreground/30 uppercase mb-2">{m.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground font-display">{m.value}</span>
                <span className="text-[9px] text-foreground/25">{m.unit}</span>
              </div>
              <p className="text-[8px] text-foreground/20 mt-1 tracking-wider uppercase">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Thin full-width divider ── */}
      <div className="w-full h-px bg-foreground/8" />

      {/* ── Stress / Activity bar ── */}
      <div className="px-6 py-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[10px] tracking-[0.35em] text-foreground/40 uppercase font-bold">Status</h2>
        </div>

        <div className="space-y-4">
          {/* Stress bar */}
          <div className="border border-foreground/10 p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[8px] tracking-[0.3em] text-foreground/30 uppercase">Stress Level</span>
              <span className="text-sm font-bold text-foreground font-display">{stressLevel}%</span>
            </div>
            <div className="w-full h-1 bg-foreground/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: `${stressLevel}%`,
                background: stressLevel > 60 ? "hsl(var(--dl-pink))" : stressLevel > 35 ? "hsl(var(--dl-indigo))" : "hsl(var(--primary))"
              }} />
            </div>
          </div>

          {/* Activity progress */}
          <div className="border border-foreground/10 p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[8px] tracking-[0.3em] text-foreground/30 uppercase">Activity Progress</span>
              <span className="text-sm font-bold text-primary font-display">{goalPct}%</span>
            </div>
            <div className="w-full h-1 bg-foreground/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${goalPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Thin full-width divider ── */}
      <div className="w-full h-px bg-foreground/8" />

      {/* ── Bottom frame — date + CTA ── */}
      <div className="px-6 py-6">
        {/* Micro text scattered */}
        <div className="flex justify-between mb-6">
          <span className="text-[8px] tracking-[0.3em] text-foreground/15 uppercase">daygo __ daygo __ daygo</span>
          <span className="text-[8px] tracking-[0.3em] text-foreground/15 uppercase">daygo __ daygo</span>
        </div>

        {/* Date frame */}
        <div className="flex border border-foreground/10">
          <div className="flex-1 px-4 py-3">
            <span className="text-[9px] tracking-[0.25em] text-foreground/40 uppercase font-bold">{dateStr}</span>
          </div>
          <div className="border-l border-foreground/10 px-4 py-3">
            <span className="text-[9px] tracking-[0.25em] text-foreground/40 uppercase font-bold">{dayStr}</span>
          </div>
        </div>

        {/* CTA */}
        {!hasToday && (
          <button onClick={onGoToCheckin}
            className="w-full mt-6 py-4 border border-foreground/15 text-foreground text-[10px] tracking-[0.35em] uppercase font-bold hover:bg-foreground/5 active:scale-[0.98] transition-all">
            Log Today's Check-in →
          </button>
        )}

        {hasToday && (
          <button onClick={onViewInsights}
            className="w-full mt-6 py-4 border border-primary/30 text-primary text-[10px] tracking-[0.35em] uppercase font-bold hover:bg-primary/5 active:scale-[0.98] transition-all">
            View Insights →
          </button>
        )}

        {/* Bottom micro text */}
        <div className="flex justify-between mt-6">
          <span className="text-[7px] tracking-[0.2em] text-foreground/10 uppercase leading-relaxed max-w-[45%]">
            Data collected from wearable devices. Auto-synced daily for performance tracking.
          </span>
          <span className="text-[7px] tracking-[0.2em] text-foreground/10 uppercase text-right leading-relaxed max-w-[45%]">
            Optimized insights. Powered by daygo.ai analytics engine.
          </span>
        </div>
      </div>
    </div>
  );
};

export default DayLensApp;

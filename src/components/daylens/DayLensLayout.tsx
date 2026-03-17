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
      {/* Header */}
      <div className="header-lime px-6 pt-10 pb-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-foreground flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" strokeWidth={2} />
              </div>
              {isPro && (
                <span className="font-mono-label px-2 py-0.5 bg-primary-foreground text-primary">Pro</span>
              )}
            </div>
            <span className="font-mono-label text-primary-foreground/70">Welcome Back, Jacob</span>
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

      {/* Bottom nav */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <nav className="flex items-center gap-0 px-3 h-14 nav-blur">
          {NAV.map(item => {
            const active = screen === item.id;
            return (
              <button key={item.id} onClick={() => setScreen(item.id)}
                className={`flex items-center gap-2 h-9 px-4 transition-all ${active ? "bg-primary" : ""}`}>
                <item.icon className={`w-4 h-4 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                {active && <span className="font-mono-label text-primary-foreground">{item.label}</span>}
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
              className={`relative p-4 border cursor-pointer hover:bg-white/[0.02] active:scale-[0.99] transition-all ${
                p.id === plan ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}>
              {p.highlight && <span className="absolute -top-2 right-4 font-mono-label bg-primary text-primary-foreground px-2 py-0.5">Popular</span>}
              {plan === p.id && <span className="absolute top-4 right-4 text-primary">✓</span>}
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-display text-lg tracking-wider">{p.label}</span>
                <span className="font-display text-2xl text-primary">{p.price}<span className="font-mono-label text-muted-foreground ml-1">{p.period}</span></span>
              </div>
              <ul className="space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-primary font-mono">—</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <button onClick={() => setShowPricing(false)} className="w-full py-3 font-mono-label text-muted-foreground hover:text-foreground transition-colors">Maybe Later</button>
      </BottomSheet>
    </div>
  );
};

/* ─── Home Screen ──────────────────────────────────────────── */

const HomeScreen = ({
  entries, recent, todayScore, wearable, submitted, hasToday,
  onViewInsights, setWearable, setWearableRaw, nutrition, setNutrition,
  mood, setMood, todayActivities, setTodayActivities, note, setNote,
  onSubmit, yesterdayEntry, profile, isPro, onShowPricing, onGoToCheckin,
}: any) => {
  const latestEntry = recent[0];
  const steps = latestEntry?.wearable?.activity?.steps || 12482;
  const kcal = latestEntry?.wearable?.activity?.activeKcal || 482;
  const goalPct = latestEntry ? Math.min(100, Math.round((steps / 15000) * 100)) : 83;

  if (!submitted && !hasToday) {
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

  return (
    <div className="space-y-8 fade-up">
      {/* Summary Card */}
      <div className="glass-card-apple p-6 relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-mono-label text-muted-foreground mb-2">Activity Summary</p>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-5xl text-foreground">{steps.toLocaleString()}</span>
              <span className="font-mono-label text-muted-foreground">Steps</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-mono-label text-muted-foreground">🔥 {kcal} kcal</span>
              <span className="font-mono-label bg-primary text-primary-foreground px-2 py-0.5">{goalPct}%</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button className="w-8 h-8 border border-border flex items-center justify-center hover:border-foreground/30 transition-colors">
              <Download className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-8 h-8 border border-primary/30 flex items-center justify-center hover:bg-primary/10 transition-colors">
              <RefreshCw className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>

        {/* Arc */}
        <div className="flex flex-col items-center mt-4">
          <div className="relative w-[220px] h-[110px] overflow-hidden">
            <svg width="220" height="110" viewBox="0 0 220 110" className="absolute top-0 left-0">
              <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="rgba(240,237,232,0.06)" strokeWidth="20" strokeLinecap="butt" />
              <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="hsl(72, 100%, 50%)" strokeWidth="20" strokeLinecap="butt"
                strokeDasharray={`${(goalPct / 100) * 283} 283`} />
            </svg>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 border border-border bg-card">
              <span className="font-mono-label text-foreground">Active Goals</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
          <div className="flex justify-between w-[180px] -mt-1">
            <div className="w-6 h-6 bg-primary flex items-center justify-center">
              <span className="font-mono text-[9px] font-bold text-primary-foreground">S</span>
            </div>
            <div className="w-6 h-6 bg-dl-indigo flex items-center justify-center">
              <span className="font-mono text-[9px] font-bold text-foreground">C</span>
            </div>
            <div className="w-6 h-6 bg-dl-pink flex items-center justify-center">
              <span className="font-mono text-[9px] font-bold text-foreground">R</span>
            </div>
          </div>
        </div>
      </div>

      {/* My Activity */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-2xl tracking-wider text-foreground">My Activity</h2>
          <button className="font-mono-label px-4 py-1.5 bg-primary text-primary-foreground hover:opacity-80 transition-opacity">
            + Add
          </button>
        </div>

        <div className="overflow-x-auto pl-8 pr-8 pt-4 pb-10">
          <div className="flex w-fit min-w-max gap-3 mx-auto pr-2">
            <ActivityFigmaCard
              iconBg="bg-dl-purple/10"
              iconColor="text-dl-purple"
              barColor="#c8ff00"
              label="Running"
              value="5.20 KM"
              subtext="34:12 mins"
              change="+12%"
              changePositive
            />
            <ActivityFigmaCard
              iconBg="bg-dl-blue/10"
              iconColor="text-dl-blue"
              barColor="#F87171"
              label="Cycling"
              value="12.8 KM"
              subtext="45:00 mins"
              change="-3.4%"
              changePositive={false}
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {!hasToday && (
        <button onClick={onGoToCheckin}
          className="w-full py-4 bg-primary text-primary-foreground font-mono-label active:scale-95 transition-transform">
          Log Today's Check-in →
        </button>
      )}

      {hasToday && (
        <button onClick={onViewInsights}
          className="w-full py-4 glass-card-apple text-foreground font-mono-label active:scale-95 transition-transform border border-border">
          View Insights →
        </button>
      )}
    </div>
  );
};

/* ─── Activity Card ─────────────────────────────────────────── */

const ActivityFigmaCard = ({
  iconBg, iconColor, barColor, label, value, subtext, change, changePositive,
}: {
  iconBg: string; iconColor: string; barColor: string;
  label: string; value: string; subtext: string; change: string; changePositive: boolean;
}) => (
  <div className="min-w-[160px] w-[160px] p-4 glass-card-apple flex flex-col justify-between h-[155px] flex-shrink-0">
    <div className="flex justify-between items-start">
      <div className={`w-10 h-10 ${iconBg} flex items-center justify-center`}>
        <Zap className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="flex items-end gap-0.5 h-6">
        {[8, 16, 12, 20].map((h, i) => (
          <div key={i} className="w-1" style={{ height: h, background: barColor }} />
        ))}
      </div>
    </div>
    <div className="mt-6">
      <div className="flex items-center gap-1">
        <span className="font-mono-label text-muted-foreground">{label}</span>
        <span className={`font-mono-label px-1.5 ${
          changePositive ? "bg-primary text-primary-foreground" : "bg-destructive/20 text-destructive"
        }`}>{change}</span>
      </div>
      <div className="font-display text-2xl text-foreground mt-0.5">{value}</div>
      <div className="font-mono-label text-muted-foreground">{subtext}</div>
    </div>
  </div>
);

export default DayLensApp;

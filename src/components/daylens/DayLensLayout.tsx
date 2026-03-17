import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Home, Search, ClipboardList, Sparkles, User, Plus, Zap, Download, RefreshCw, ChevronRight, CalendarIcon } from "lucide-react";
import { BottomSheet } from "./DayLensUI";
import { CheckInScreen } from "./CheckInScreen";
import { InsightScreen } from "./InsightScreen";
import { GoalsScreen } from "./GoalsScreen";
import { PerfectDayScreen } from "./PerfectDayScreen";
import { AccountScreen } from "./AccountScreen";
import { OnboardingScreen } from "./OnboardingScreen";
import { SentimentScreen } from "./SentimentScreen";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PLAN_OPTIONS, DEFAULT_GOALS, DEFAULT_PROFILE, type Goal, type UserProfile, type WearableData, type NutritionData, type MoodData, type Activity, type DayEntry } from "@/lib/daylens-constants";
import { save, load, buildSampleData, computeDayScore, defaultNutrition, defaultMood, getGreeting, calcCalorieRecommendation } from "@/lib/daylens-utils";

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
    { id: "insights", icon: Search, label: "Search" },
    { id: "goals", icon: ClipboardList, label: "Goals" },
    { id: "perfect", icon: Sparkles, label: "Perfect" },
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
    <div className="max-w-md mx-auto min-h-screen relative bg-background">
      {/* Status Bar + Header Section */}
      <div className="header-lime rounded-b-[40px] px-6 pt-10 pb-6">
        {/* Header content */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" strokeWidth={2} />
              </div>
              {isPro && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-dl-blue text-white uppercase">Pro</span>
              )}
            </div>
            <span className="text-xs text-primary-foreground/60 font-medium">Welcome Back, Jacob</span>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors">
                  <CalendarIcon className="w-4 h-4 text-primary-foreground" />
                  <span className="text-xs font-bold text-primary-foreground">{format(selectedDate, "MMM d")}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <button onClick={() => setScreen("account")} className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary-foreground/30">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/0440ec97d35cfb90d5c4e49072ca29ffe4dbce91?width=64"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>
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
        {screen === "insights" && <InsightScreen entries={entries} recent={recent} isPro={isPro} onShowPricing={() => setShowPricing(true)} />}
        {screen === "goals" && <GoalsScreen goals={goals} setGoals={setGoals} entries={entries} recent={recent} isPremium={isPremium} onShowPricing={() => setShowPricing(true)} />}
        {screen === "perfect" && <PerfectDayScreen entries={entries} isPro={isPro} onShowPricing={() => setShowPricing(true)} />}
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

  return (
    <div className="space-y-8 fade-up">
      {/* Summary Card - Dark */}
      <div className="bg-foreground rounded-[32px] p-6 text-background shadow-xl shadow-black/10 relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs font-medium text-background/50 mb-1">Activity Summary</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{steps.toLocaleString()}</span>
              <span className="text-xs text-background/40 font-medium">Steps</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-background/50">🔥 {kcal} kcal</span>
              <span className="text-[10px] font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-full">{goalPct}%</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button className="w-8 h-8 rounded-full bg-background/10 flex items-center justify-center">
              <Download className="w-4 h-4 text-background/70" />
            </button>
            <button className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* Arc Visualization */}
        <div className="flex flex-col items-center mt-4">
          <div className="relative w-[220px] h-[110px] overflow-hidden">
            {/* Background arc */}
            <svg width="220" height="110" viewBox="0 0 220 110" className="absolute top-0 left-0">
              <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="#262626" strokeWidth="20" strokeLinecap="round" />
              <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="hsl(78, 100%, 68%)" strokeWidth="20" strokeLinecap="round"
                strokeDasharray={`${(goalPct / 100) * 283} 283`} />
            </svg>
            {/* Center label */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full border border-background/20 bg-background/10">
              <span className="text-[10px] font-bold text-background">Active Goals</span>
              <ChevronRight className="w-3 h-3 text-background" />
            </div>
          </div>
          {/* Category icons */}
          <div className="flex justify-between w-[180px] -mt-1">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">S</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-dl-blue flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">C</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-dl-purple flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">R</span>
            </div>
          </div>
        </div>
      </div>

      {/* My Activity Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">My Activity</h2>
          <button className="px-4 py-1.5 rounded-full bg-foreground text-background text-xs font-bold">
            + Add
          </button>
        </div>

        {/* Horizontal scroll activity cards */}
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
          {/* Running card */}
          <ActivityFigmaCard
            iconBg="bg-purple-100"
            iconColor="text-dl-purple"
            barColor="#D4FF5E"
            label="Running"
            value="5.20 KM"
            subtext="34:12 mins"
            change="+12%"
            changePositive
          />
          {/* Cycling card */}
          <ActivityFigmaCard
            iconBg="bg-blue-100"
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

      {/* Quick action to log today */}
      {!hasToday && (
        <button onClick={onGoToCheckin}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-transform">
          Log Today's Check-in →
        </button>
      )}

      {hasToday && (
        <button onClick={onViewInsights}
          className="w-full py-4 rounded-2xl bg-foreground text-background font-semibold text-sm active:scale-95 transition-transform">
          View Insights →
        </button>
      )}
    </div>
  );
};

/* ─── Activity Card (Figma Style) ─────────────────────────────────────────── */

const ActivityFigmaCard = ({
  iconBg, iconColor, barColor, label, value, subtext, change, changePositive,
}: {
  iconBg: string; iconColor: string; barColor: string;
  label: string; value: string; subtext: string; change: string; changePositive: boolean;
}) => (
  <div className="min-w-[160px] w-[160px] p-4 rounded-3xl border border-border bg-card flex flex-col justify-between h-[155px] flex-shrink-0">
    <div className="flex justify-between items-start">
      <div className={`w-10 h-10 rounded-2xl ${iconBg} flex items-center justify-center`}>
        <Zap className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="flex items-end gap-0.5 h-6">
        {[8, 16, 12, 20].map((h, i) => (
          <div key={i} className="w-1 rounded-sm" style={{ height: h, background: barColor }} />
        ))}
      </div>
    </div>
    <div className="mt-6">
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
        <span className={`text-[10px] font-bold px-1.5 rounded-full ${
          changePositive ? "bg-primary text-primary-foreground" : "bg-red-100 text-dl-red"
        }`}>{change}</span>
      </div>
      <div className="text-lg font-bold text-foreground mt-0.5">{value}</div>
      <div className="text-[10px] text-muted-foreground">{subtext}</div>
    </div>
  </div>
);

export default DayLensApp;

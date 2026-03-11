import { useState, useMemo } from "react";
import { Home, TrendingUp, Target, Sparkles, User } from "lucide-react";
import { BottomSheet } from "./DayLensUI";
import { CheckInScreen } from "./CheckInScreen";
import { InsightScreen } from "./InsightScreen";
import { GoalsScreen } from "./GoalsScreen";
import { PerfectDayScreen } from "./PerfectDayScreen";
import { AccountScreen } from "./AccountScreen";
import { PLAN_OPTIONS, DEFAULT_GOALS, DEFAULT_PROFILE, type Goal, type UserProfile, type WearableData, type NutritionData, type MoodData, type Activity, type DayEntry } from "@/lib/daylens-constants";
import { save, load, buildSampleData, computeDayScore, defaultNutrition, defaultMood, getGreeting, calcCalorieRecommendation } from "@/lib/daylens-utils";

const DayLensApp = () => {
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

  // Persist
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
    { id: "checkin", icon: Home, label: "Today" },
    { id: "insights", icon: TrendingUp, label: "Trends" },
    { id: "goals", icon: Target, label: "Goals" },
    { id: "perfect", icon: Sparkles, label: "Perfect" },
    { id: "account", icon: User, label: "Me" },
  ];

  return (
    <div className="max-w-md mx-auto min-h-screen relative bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto z-40 header-blur px-6 pt-10 pb-4 flex justify-between items-center">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-0.5">{getGreeting()}</div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {screen === "checkin" ? "Today" : screen === "insights" ? "Trends" : screen === "goals" ? "Goals" : screen === "perfect" ? "Perfect Day" : "Account"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isPro && <button onClick={() => setShowPricing(true)} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-dl-indigo/20 text-dl-indigo border border-dl-indigo/20">Pro ✦</button>}
          {isPro && <span className="text-[10px] px-2.5 py-1 rounded-lg bg-dl-indigo/20 text-dl-indigo border border-dl-indigo/20 font-semibold capitalize">{plan}</span>}
          <button onClick={() => setScreen("account")} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-muted">
            <span className="text-xs font-bold text-foreground/70">JD</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-28 px-5 min-h-screen">
        {screen === "checkin" && (
          <CheckInScreen
            submitted={submitted} hasToday={hasToday} todayScore={todayScore}
            wearable={wearable}
            setWearable={(fn) => setWearable(w => w ? fn(w) : w)}
            setWearableRaw={(w) => setWearable(w)}
            nutrition={nutrition} setNutrition={setNutrition}
            mood={mood} setMood={setMood}
            todayActivities={todayActivities} setTodayActivities={setTodayActivities}
            note={note} setNote={setNote}
            onSubmit={handleSubmit} onViewInsights={() => setScreen("insights")}
            yesterdayEntry={yesterdayEntry}
          />
        )}
        {screen === "insights" && <InsightScreen entries={entries} recent={recent} isPro={isPro} onShowPricing={() => setShowPricing(true)} />}
        {screen === "goals" && <GoalsScreen goals={goals} setGoals={setGoals} entries={entries} recent={recent} isPremium={isPremium} onShowPricing={() => setShowPricing(true)} />}
        {screen === "perfect" && <PerfectDayScreen entries={entries} isPro={isPro} onShowPricing={() => setShowPricing(true)} />}
        {screen === "account" && <AccountScreen entries={entries} plan={plan} onShowPricing={() => setShowPricing(true)} onReset={() => { if (confirm("Reset all data?")) { setEntries(buildSampleData()); setGoals(DEFAULT_GOALS); } }} />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto nav-blur pb-6 pt-3 px-2 z-40 flex justify-around items-center">
        {NAV.map(item => {
          const active = screen === item.id;
          return (
            <button key={item.id} onClick={() => setScreen(item.id)} className="flex flex-col items-center gap-1 w-14 group relative">
              <div className={`transition-all duration-200 ${active ? "text-foreground -translate-y-0.5" : "text-muted-foreground group-hover:text-foreground/70"}`}>
                <item.icon size={22} />
              </div>
              <span className={`text-[9px] font-medium ${active ? "text-foreground" : "text-muted-foreground/60"}`}>{item.label}</span>
              {active && <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-dl-indigo" />}
            </button>
          );
        })}
      </nav>

      {/* Ambient glow */}
      <div className="fixed top-24 left-0 w-72 h-72 bg-dl-blue/[0.03] blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-24 right-0 w-64 h-64 bg-dl-purple/[0.03] blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Pricing Sheet */}
      <BottomSheet open={showPricing} onClose={() => setShowPricing(false)} title="Unlock DayLens">
        <p className="text-sm text-muted-foreground mb-5 -mt-1">Discover how your activities, sleep and habits connect.</p>
        <div className="space-y-3 mb-5">
          {PLAN_OPTIONS.map(p => (
            <div key={p.id} onClick={() => { setPlan(p.id); save("dl_plan", p.id); setShowPricing(false); }}
              className={`relative p-4 rounded-2xl border cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform bg-gradient-to-br ${p.gradientClass} ${p.borderClass}`}>
              {p.highlight && <span className="absolute -top-2 right-4 text-[10px] font-bold bg-dl-indigo text-foreground px-2 py-0.5 rounded-full">Popular</span>}
              {plan === p.id && <span className="absolute top-4 right-4 text-foreground">✓</span>}
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-semibold text-base">{p.label}</span>
                <span className="text-xl font-bold">{p.price}<span className="text-xs text-foreground/50 font-normal">{p.period}</span></span>
              </div>
              <ul className="space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-foreground/70">✓ {f}</li>
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

export default DayLensApp;

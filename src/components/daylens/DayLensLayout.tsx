import { useState, useMemo } from "react";
import ParticleRing from "./ParticleRing";
import { Home, TrendingUp, ClipboardList, Heart, User, Zap, Plus, ChevronRight, Sparkles, Sun, Moon, ArrowUp, ArrowDown, UtensilsCrossed, Dumbbell, Users, MessageCircle, HelpCircle } from "lucide-react";
import { BottomSheet } from "./DayLensUI";
import { AICoachSheet } from "./AICoachSheet";
import { FoodModal, ActivityModal, SocialModal } from "./QuickAddModals";
import { WeeklyTimeline } from "./WeeklyTimeline";
import { CheckInScreen } from "./CheckInScreen";
import { InsightScreen } from "./InsightScreen";
import { GoalsScreen } from "./GoalsScreen";
import { AccountScreen } from "./AccountScreen";
import { OnboardingScreen } from "./OnboardingScreen";
import { SentimentScreen } from "./SentimentScreen";
import { HealthMetricsScreen } from "./HealthMetricsScreen";
import { PLAN_OPTIONS, DEFAULT_GOALS, DEFAULT_PROFILE, type Goal, type UserProfile, type WearableData, type NutritionData, type MoodData, type Activity, type DayEntry } from "@/lib/daylens-constants";
import { save, load, buildSampleData, computeDayScore, defaultNutrition, defaultMood, getGreeting, calcCalorieRecommendation, detectActivityLevel, generateHealthSuggestions, scoreLabel, computeActivityCorrelations, avg, formatDuration, generateDailyPlan, getReadinessLevel, getStreakMessage } from "@/lib/daylens-utils";
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
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddModal, setQuickAddModal] = useState<"food" | "activity" | "social" | null>(null);
  const [quickAddSection, setQuickAddSection] = useState<string>("nutrition");
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
    const entry = { date: today, wearable: wearable || undefined, nutrition, mood, activities: todayActivities, note };
    setEntries(p => [...p.filter(e => e.date !== today), entry]);
    setSubmitted(true);
    save("dl_entries", [...entries.filter(e => e.date !== today), entry]);
  };

  const prepareQuickAdd = () => {
    if (todayEntry) {
      const entry = typeof structuredClone === "function"
        ? structuredClone(todayEntry)
        : JSON.parse(JSON.stringify(todayEntry));
      setWearable(entry.wearable ?? null);
      setNutrition(entry.nutrition);
      setMood(entry.mood);
      setTodayActivities(entry.activities ?? []);
      setNote(entry.note ?? "");
    }
  };

  const openQuickAddModal = (modal: "food" | "activity" | "social") => {
    prepareQuickAdd();
    setShowQuickAdd(false);
    setQuickAddModal(modal);
  };

  const handleQuickAddSave = () => {
    handleSubmit();
    setQuickAddModal(null);
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
    <div className="max-w-md mx-auto min-h-screen relative" style={{ background: '#0e0e0f' }}>
      {/* Header */}
      <div className="px-4 pt-14 pb-2">
        <div className="flex justify-between items-center">
          <h1 className="font-display text-[30px] font-extrabold text-foreground" style={{ letterSpacing: '-0.04em' }}>
            {screen === "checkin" ? "Dashboard" : screen === "health" ? "Health" : screen === "insights" ? "Insights" : screen === "goals" ? "Goals" : "Profile"}
          </h1>
          <button className="flex items-center justify-center" onClick={() => setShowQuickAdd(true)}>
            <Plus className="w-[28px] h-[28px] text-white" strokeWidth={3} />
          </button>
        </div>
      </div>
      

      {/* Main content */}
      <main className="px-4 pb-28 min-h-[60vh]">
        {screen === "checkin" && (
          <HomeScreen
            entries={entries} recent={recent} todayScore={todayScore} wearable={wearable}
            submitted={submitted} hasToday={hasToday} onViewInsights={() => setScreen("insights")}
            onGoToCheckin={() => setScreen("checkin")} setWearable={setWearable} setWearableRaw={setWearable}
            nutrition={nutrition} setNutrition={setNutrition} mood={mood} setMood={setMood}
            todayActivities={todayActivities} setTodayActivities={setTodayActivities}
            note={note} setNote={setNote} onSubmit={handleSubmit} yesterdayEntry={yesterdayEntry}
            profile={profile} isPro={isPro} onShowPricing={() => setShowPricing(true)} streak={streak}
            quickAddSection={quickAddSection}
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

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40">
        <nav className="flex justify-around items-center px-0 py-2.5 pb-[22px]" style={{ background: 'rgba(14,14,15,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {NAV.map((item) => {
            const active = screen === item.id;
            return (
              <button key={item.id} onClick={() => { setScreen(item.id); }}
                className="flex flex-col items-center gap-1 px-5 py-1 transition-colors">
                <item.icon className={`w-5 h-5 ${active ? "text-foreground" : ""}`} strokeWidth={1.8} style={active ? {} : { color: 'rgba(255,255,255,0.14)' }} />
                <span className="text-[10px] font-bold uppercase" style={{ letterSpacing: '0.04em', color: active ? '#f2f2f3' : 'rgba(255,255,255,0.14)' }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center fade-in" onClick={() => setShowQuickAdd(false)}
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="w-[85%] max-w-xs rounded-[22px] p-5 scale-in" onClick={e => e.stopPropagation()}
            style={{ background: '#1c1c1d', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="font-display text-base font-extrabold text-foreground mb-4">Log</h3>
            <div className="space-y-1">
              {[
                { icon: UtensilsCrossed, label: "Food", desc: "Log a meal or snack", modal: "food" as const },
                { icon: Dumbbell, label: "Activity", desc: "Log exercise or movement", modal: "activity" as const },
                { icon: Users, label: "Social", desc: "Log social interaction", modal: "social" as const },
              ].map(item => (
                <button key={item.label} onClick={() => openQuickAddModal(item.modal)}
                  className="w-full flex items-center gap-3.5 px-2 py-3.5 rounded-2xl hover:bg-white/[0.03] active:scale-[0.98] transition-all"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <item.icon className="w-[18px] h-[18px] text-foreground" strokeWidth={1.8} />
                  </div>
                  <div className="text-left">
                    <div className="text-[14px] font-bold text-foreground">{item.label}</div>
                    <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                  </div>
                  <ChevronRight className="ml-auto w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Category Modals */}
      {quickAddModal === "food" && (
        <FoodModal nutrition={nutrition} setNutrition={setNutrition} onClose={() => setQuickAddModal(null)} onSave={handleQuickAddSave} />
      )}
      {quickAddModal === "activity" && (
        <ActivityModal activities={todayActivities} setActivities={setTodayActivities} onClose={() => setQuickAddModal(null)} onSave={handleQuickAddSave} />
      )}
      {quickAddModal === "social" && (
        <SocialModal activities={todayActivities} setActivities={setTodayActivities} onClose={() => setQuickAddModal(null)} onSave={handleQuickAddSave} />
      )}

      {/* Pricing Sheet */}
      <BottomSheet open={showPricing} onClose={() => setShowPricing(false)} title="Unlock DayLens">
        <p className="text-[11px] text-muted-foreground mb-5 -mt-1">Discover how your activities, sleep and habits connect.</p>
        <div className="space-y-3 mb-5">
          {PLAN_OPTIONS.map(p => (
            <div key={p.id} onClick={() => { setPlan(p.id); save("dl_plan", p.id); setShowPricing(false); }}
              className={`relative p-4 rounded-[20px] border cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform ${
                p.id === plan ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}>
              {p.highlight && <span className="absolute -top-2 right-4 text-[10px] font-bold bg-primary text-foreground px-2 py-0.5 rounded-full">Popular</span>}
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
  onSubmit, yesterdayEntry, profile, isPro, onShowPricing, onGoToCheckin, streak, quickAddSection,
}: any) => {
  const latestEntry = recent[0];
  const score = todayScore || (latestEntry ? computeDayScore(latestEntry) : 8.5);
  const sleepTotal = latestEntry?.wearable?.sleep?.totalHours || 7.5;
  const avgMood = recent.length > 0 ? avg(recent.slice(0, 7).map((e: DayEntry) => e.mood.overallMood)) : 3.5;
  const moodTrend = recent.length >= 7
    ? avg(recent.slice(0, 3).map((e: DayEntry) => e.mood.overallMood)) - avg(recent.slice(3, 7).map((e: DayEntry) => e.mood.overallMood))
    : 0;

  const dailyPlan = useMemo(() => generateDailyPlan(entries, profile), [entries, profile]);
  const readiness = getReadinessLevel(score);
  const suggestions = useMemo(() => generateHealthSuggestions(entries, profile), [entries, profile]);
  const activityCorrelations = useMemo(() => computeActivityCorrelations(recent), [recent]);

  const [showCoach, setShowCoach] = useState(false);
  const [coachQuestion, setCoachQuestion] = useState<string | null>(null);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const aiSummary = useMemo(() => {
    const parts: string[] = [];
    if (readiness.level === "recovering") parts.push("recovery and rest");
    else if (readiness.level === "peak") parts.push("high-intensity training");
    else parts.push("moderate activity");
    const recentSocial = recent.filter((e: DayEntry) => e.activities?.some((a: any) => a.type === "social")).length;
    if (recentSocial < 2) parts.push("social connection");
    const avgSleep = avg(recent.map((e: DayEntry) => e.wearable?.sleep?.totalHours || 7));
    if (avgSleep < 7) parts.push("sleep prioritization");
    else parts.push("maintaining sleep rhythm");
    return `Today favors ${parts.join(" and ")}.`;
  }, [readiness, recent]);

  // Best streak for messaging
  const bestStreak = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    let best = 0, run = 0;
    const now = new Date();
    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date(now);
      expected.setDate(expected.getDate() - i);
      if (sorted[i]?.date === expected.toISOString().split("T")[0]) { run++; best = Math.max(best, run); }
      else { run = 0; }
    }
    return best;
  }, [entries]);
  const streakMsg = getStreakMessage(streak, bestStreak);

  // Dot matrix — last 3 months
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



  const scoreNorm = Math.min(score, 10) / 10;
  const ringR = 44;
  const ringCirc = 2 * Math.PI * ringR;

  const categoryIcons: Record<string, string> = {
    activity: "→", sleep: "→", social: "→", recovery: "→", nutrition: "→",
  };

  return (
    <div className="space-y-5 fade-up">

      {/* ── HERO: Today's Optimal Day ───────────────────────── */}
      <div className="card-dark-gradient fade-up d1" style={{ padding: '28px 22px 24px' }}>
        {/* Score + Status */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative flex-shrink-0" style={{ width: 148, height: 148 }}>
            <ParticleRing
              size={148}
              progress={scoreNorm}
              color="#ffffff"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-[30px] font-bold text-foreground" style={{ letterSpacing: '-0.05em' }}>{score.toFixed(0)}</span>
              <span className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground font-bold mt-0.5">score</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-[22px] font-extrabold text-foreground leading-tight" style={{ letterSpacing: '-0.03em' }}>
              Today's Plan
            </div>
            <div className="font-display text-[13px] font-bold mt-1" style={{
              color: readiness.level === 'peak' || readiness.level === 'high_performance' ? 'hsl(var(--color-lime))' :
                     readiness.level === 'recovering' ? 'hsl(var(--color-red))' : 'rgba(255,255,255,0.5)'
            }}>
              {readiness.label}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              {readiness.level === 'recovering' ? "Take it easy today. Your body needs rest." :
               readiness.level === 'balanced' ? "You're in a good place. Follow the plan below." :
               readiness.level === 'high_performance' ? "Great shape. Push a little harder today." :
               "You're firing on all cylinders. Make it count."}
            </div>
          </div>
        </div>

        {/* Coaching Recommendations */}
        <div className="space-y-0">
          {dailyPlan.map((rec, i) => (
            <div key={rec.category + i} className="flex items-start gap-3 py-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="w-[3px] rounded-full flex-shrink-0 mt-1" style={{
                height: 32,
                background: rec.category === 'recovery' ? 'hsl(var(--color-red))' :
                           rec.category === 'activity' ? 'hsl(var(--color-lime))' :
                           rec.category === 'sleep' ? 'rgba(255,255,255,0.3)' :
                           rec.category === 'social' ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.15)',
              }} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-foreground">{rec.label}</div>
                <div className="text-[12px] text-foreground/80 mt-0.5 leading-relaxed">{rec.action}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{rec.reason}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI COACH ENTRY ──────────────────────────────── */}
      <div className="fade-up d1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const input = form.elements.namedItem('coachInput') as HTMLInputElement;
            const val = input.value.trim();
            setCoachQuestion(val || null);
            setShowCoach(true);
            input.value = '';
          }}
          className="w-full"
        >
          {/* Main input area */}
          <div className="rounded-[16px] flex items-center gap-3 px-4 py-2.5" style={{ background: '#1a1a1b', border: '1px solid rgba(255,255,255,0.06)' }}>
            <input
              name="coachInput"
              type="text"
              placeholder="How can Coach help?"
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-foreground/25 outline-none"
            />
            <button type="submit" className="h-7 px-4 rounded-full bg-foreground text-background text-[11px] font-bold hover:bg-foreground/90 transition-colors flex-shrink-0">
              Ask
            </button>
          </div>
        </form>
      </div>




      {/* ── KEY WARNING ────────────────────────────────────── */}
      {suggestions.length > 0 && suggestions[0].priority === 'high' && (
        <div className="fade-up d2" style={{ padding: '14px 18px', background: 'rgba(224,80,80,0.06)', border: '1px solid rgba(224,80,80,0.12)', borderRadius: 20 }}>
          <div className="text-[13px] font-bold text-foreground">{suggestions[0].title}</div>
          <div className="text-[11px] text-foreground/70 mt-1 leading-relaxed">{suggestions[0].description}</div>
          <button
            onClick={() => { setCoachQuestion(`Explain why: ${suggestions[0].title}`); setShowCoach(true); }}
            className="flex items-center gap-1.5 mt-2 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <HelpCircle className="w-3 h-3" />
            Ask Coach About This
          </button>
        </div>
      )}

      <motion.div
        className="card-dark fade-up d3 cursor-pointer"
        style={{ padding: '20px 22px' }}
        whileTap={{ scale: 0.98 }}
        whileHover={{ borderColor: 'rgba(255,255,255,0.12)' }}
        onClick={onViewInsights}
      >
        <div className="flex items-baseline gap-3 mb-1">
          <span className="font-mono text-[42px] font-bold text-foreground leading-none" style={{ letterSpacing: '-0.04em' }}>
            {streak}
          </span>
          <span className="font-display text-[14px] font-bold text-foreground/60">day streak</span>
        </div>
        {streakMsg && (
          <div className="text-[11px] text-muted-foreground mt-1">{streakMsg}</div>
        )}

        {/* Dot matrix */}
        <div className="flex justify-between mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {dotMatrix.map(month => (
            <div key={month.label} className="flex-1">
              <div className="label-ref text-center mb-2" style={{ fontSize: 10 }}>{month.label}</div>
              <div className="grid gap-[5px]" style={{ gridTemplateColumns: `repeat(7, 1fr)` }}>
                {month.dots.map((filled, i) => (
                  <div key={i} className="rounded-full" style={{
                    background: filled ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.06)',
                    width: 10,
                    height: 10,
                  }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── SUPPORTING METRICS ─────────────────────────────── */}
      <div className="grid grid-cols-3 gap-[10px] fade-up d4">
        <div className="card-dark" style={{ padding: '14px 12px', textAlign: 'center' }}>
          <div className="font-mono text-[20px] font-bold text-foreground" style={{ letterSpacing: '-0.03em' }}>{sleepTotal.toFixed(1)}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">hrs sleep</div>
        </div>
        <div className="card-dark" style={{ padding: '14px 12px', textAlign: 'center' }}>
          <div className="font-mono text-[20px] font-bold text-foreground" style={{ letterSpacing: '-0.03em' }}>{avgMood.toFixed(1)}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">mood /5</div>
        </div>
        <div className="card-dark" style={{ padding: '14px 12px', textAlign: 'center' }}>
          <div className="font-mono text-[20px] font-bold text-foreground" style={{ letterSpacing: '-0.03em', color: moodTrend > 0.2 ? 'hsl(var(--color-lime))' : moodTrend < -0.2 ? 'hsl(var(--color-red))' : undefined }}>
            {moodTrend > 0 ? '+' : ''}{moodTrend.toFixed(1)}
          </div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">trend</div>
        </div>
      </div>

      {/* ── ACTIONABLE INSIGHTS (below fold) ────────────────── */}
      {suggestions.length > 1 && (
        <div className="card-dark fade-up d5" style={{ padding: '16px 18px' }}>
          <div className="label-ref mb-2">Coaching Notes</div>
          {suggestions.slice(1, 4).map((s: any, i: number, arr: any[]) => {
            const isExpanded = expandedInsight === s.id;
            return (
              <div key={s.id} className="py-3" style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div className="text-[13px] font-bold text-foreground">{s.title}</div>
                <div className="text-[11px] text-foreground/70 mt-0.5 leading-relaxed">{s.description}</div>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => setExpandedInsight(isExpanded ? null : s.id)}
                    className="text-[10px] font-semibold text-foreground/40 hover:text-foreground/60 transition-colors flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3" />
                    {isExpanded ? "Hide reasoning" : "View reasoning"}
                  </button>
                  <button
                    onClick={() => { setCoachQuestion(`Explain in detail: ${s.title}. ${s.description}`); setShowCoach(true); }}
                    className="text-[10px] font-semibold text-primary/70 hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Ask Coach
                  </button>
                </div>
                {isExpanded && (
                  <div className="mt-3 px-3 py-2.5 rounded-xl text-[11px] text-foreground/60 leading-relaxed fade-up"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div className="text-[10px] text-primary/70 font-bold uppercase tracking-wider mb-1.5">Why this matters</div>
                    <div>{s.description}</div>
                    <div className="mt-2 text-[10px] text-muted-foreground">
                      Category: {s.category} · Priority: {s.priority}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── AI COACH SHEET ─────────────────────────────────── */}
      <AICoachSheet
        open={showCoach}
        onClose={() => { setShowCoach(false); setCoachQuestion(null); }}
        entries={entries}
        recent={recent}
        profile={profile}
        score={score}
        streak={streak}
        preloadedQuestion={coachQuestion}
      />
    </div>
  );
};

export default DayLensApp;

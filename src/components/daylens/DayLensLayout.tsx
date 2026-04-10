import { useState, useMemo } from "react";
import { Home, TrendingUp, ClipboardList, Heart, User, Zap, SlidersHorizontal, Plus, ChevronRight, Sparkles, Sun, Moon, ArrowUp, ArrowDown } from "lucide-react";
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
import { save, load, buildSampleData, computeDayScore, defaultNutrition, defaultMood, getGreeting, calcCalorieRecommendation, detectActivityLevel, generateHealthSuggestions, scoreLabel, computeActivityCorrelations, avg, formatDuration } from "@/lib/daylens-utils";
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
    const entry = { date: today, wearable: wearable || undefined, nutrition, mood, activities: todayActivities, note };
    setEntries(p => [...p.filter(e => e.date !== today), entry]);
    setSubmitted(true);
    save("dl_entries", [...entries.filter(e => e.date !== today), entry]);
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
      <div className="px-4 pt-14 pb-3">
        <div className="flex justify-between items-center">
          <h1 className="font-display text-[30px] font-extrabold text-foreground" style={{ letterSpacing: '-0.04em' }}>
            {screen === "checkin" ? "Dashboard" : screen === "health" ? "Health" : screen === "insights" ? "Insights" : screen === "goals" ? "Goals" : "Profile"}
          </h1>
          <div className="flex items-center gap-[9px]">
            <MoodCalendar entries={entries} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            <button className="w-[38px] h-[38px] rounded-full flex items-center justify-center" style={{ background: '#1f1f21', color: 'rgba(255,255,255,0.36)' }} onClick={() => !hasToday && setScreen("checkin")}>
              <Plus className="w-[18px] h-[18px]" />
            </button>
          </div>
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
              <button key={item.id} onClick={() => setScreen(item.id)}
                className="flex flex-col items-center gap-1 px-5 py-1 transition-colors">
                <item.icon className={`w-5 h-5 ${active ? "text-foreground" : ""}`} strokeWidth={1.8} style={active ? {} : { color: 'rgba(255,255,255,0.14)' }} />
                <span className="text-[10px] font-bold uppercase" style={{ letterSpacing: '0.04em', color: active ? '#f2f2f3' : 'rgba(255,255,255,0.14)' }}>{item.label}</span>
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
  const score = todayScore || (latestEntry ? computeDayScore(latestEntry) : 8.5);
  const sleepScore = latestEntry?.wearable?.sleep?.score || 82;
  const sleepTotal = latestEntry?.wearable?.sleep?.totalHours || 7.5;
  const avgMood = recent.length > 0 ? avg(recent.slice(0, 7).map((e: DayEntry) => e.mood.overallMood)) : 3.5;
  const moodTrend = recent.length >= 7
    ? avg(recent.slice(0, 3).map((e: DayEntry) => e.mood.overallMood)) - avg(recent.slice(3, 7).map((e: DayEntry) => e.mood.overallMood))
    : 0;

  const suggestions = useMemo(() => generateHealthSuggestions(entries, profile), [entries, profile]);
  const activityCorrelations = useMemo(() => computeActivityCorrelations(recent), [recent]);
  const topPositive = activityCorrelations.filter((c: any) => c.diff > 0)[0];
  const topNegative = activityCorrelations.filter((c: any) => c.diff < 0)[0];

  const moodEmojis = ["", "😔", "😐", "🙂", "😄", "🤩"];
  const moodLabel = moodEmojis[Math.round(avgMood)] || "🙂";

  if (!submitted && !hasToday) {
    return (
      <CheckInScreen submitted={submitted} hasToday={hasToday} todayScore={todayScore} wearable={wearable}
        setWearable={(fn: any) => setWearable((w: any) => w ? fn(w) : w)} setWearableRaw={setWearableRaw}
        nutrition={nutrition} setNutrition={setNutrition} mood={mood} setMood={setMood}
        todayActivities={todayActivities} setTodayActivities={setTodayActivities}
        note={note} setNote={setNote} onSubmit={onSubmit} onViewInsights={onViewInsights}
        yesterdayEntry={yesterdayEntry} profile={profile} />
    );
  }

  const scoreNorm = Math.min(score, 10) / 10;
  const ringR = 44;
  const ringCirc = 2 * Math.PI * ringR;

  return (
    <div className="space-y-[14px] fade-up">
      {/* Greeting + Wellness Score Hero */}
      <div className="card-dark fade-up d1" style={{ padding: '20px 18px' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[13px] text-muted-foreground font-medium">{getGreeting()}, {profile?.name || "there"}</div>
            <div className="font-display text-[18px] font-extrabold text-foreground tracking-tight mt-0.5">
              {scoreLabel(score / 2)} day so far
            </div>
          </div>
          {streak > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(212,255,94,0.08)', border: '1px solid rgba(212,255,94,0.15)' }}>
              <span className="text-[13px]">🔥</span>
              <span className="text-[11px] font-bold" style={{ color: '#D4FF5E' }}>{streak} days</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0" style={{ width: 96, height: 96 }}>
            <svg width="96" height="96" className="transform -rotate-90">
              <circle cx="48" cy="48" r={ringR} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
              <circle cx="48" cy="48" r={ringR} fill="none" stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${scoreNorm * ringCirc} ${ringCirc}`}
                style={{ transition: "stroke-dasharray .7s cubic-bezier(.4,0,.2,1)" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-[26px] font-extrabold text-foreground leading-none">{score.toFixed(0)}</span>
              <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Score</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2.5">
            <MiniStat emoji="😴" label="Sleep" value={`${sleepTotal.toFixed(1)}h`} sub={`${sleepScore}% quality`} />
            <MiniStat emoji={moodLabel} label="Mood" value={avgMood.toFixed(1)} sub={moodTrend > 0.2 ? "↑ improving" : moodTrend < -0.2 ? "↓ declining" : "→ steady"} />
          </div>
        </div>
      </div>

      {/* Today's Suggestions — the core value */}
      {suggestions.length > 0 && (
        <div className="fade-up d2">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Sparkles size={13} className="text-primary" />
            <span className="font-display text-[13px] font-extrabold text-foreground uppercase tracking-wider">Today's Insights</span>
          </div>
          <div className="space-y-[10px]">
            {suggestions.slice(0, 3).map((s, i) => (
              <div key={s.id} className="card-dark fade-up" style={{ padding: '14px 16px', animationDelay: `${i * 60}ms` }}>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0"
                    style={{
                      background: s.priority === 'high' ? 'rgba(255,128,200,0.1)' : s.priority === 'medium' ? 'rgba(125,168,255,0.1)' : 'rgba(200,232,120,0.1)',
                      border: `1px solid ${s.priority === 'high' ? 'rgba(255,128,200,0.15)' : s.priority === 'medium' ? 'rgba(125,168,255,0.15)' : 'rgba(200,232,120,0.15)'}`,
                    }}>
                    <span className="text-[15px]">{s.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-foreground">{s.title}</div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{s.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Perfect Day Blueprint Preview */}
      {(topPositive || topNegative) && (
        <div className="card-dark fade-up d3" style={{ padding: '16px 18px' }}>
          <div className="flex items-center gap-2 mb-3">
            <Sun size={14} className="text-primary" />
            <span className="font-display text-[13px] font-extrabold text-foreground">Your Perfect Day</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Based on your best scoring days</p>
          {topPositive && (
            <div className="flex items-center gap-3 p-3 rounded-[14px] mb-2" style={{ background: 'rgba(212,255,94,0.06)', border: '1px solid rgba(212,255,94,0.1)' }}>
              <span className="text-[18px]">{topPositive.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold" style={{ color: '#D4FF5E' }}>Do more: {topPositive.label}</div>
                <div className="text-[10px] text-muted-foreground">+{topPositive.diff.toFixed(1)} score impact · avg {formatDuration(topPositive.avgDuration)}</div>
              </div>
              <ArrowUp size={14} style={{ color: '#D4FF5E' }} />
            </div>
          )}
          {topNegative && (
            <div className="flex items-center gap-3 p-3 rounded-[14px]" style={{ background: 'rgba(240,107,158,0.06)', border: '1px solid rgba(240,107,158,0.1)' }}>
              <span className="text-[18px]">{topNegative.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold" style={{ color: '#F06B9E' }}>Watch out: {topNegative.label}</div>
                <div className="text-[10px] text-muted-foreground">{topNegative.diff.toFixed(1)} score impact · esp. late evening</div>
              </div>
              <ArrowDown size={14} style={{ color: '#F06B9E' }} />
            </div>
          )}
        </div>
      )}

      {/* Mood Trend Card */}
      <div className="card-dark fade-up d4" style={{ padding: '14px 18px' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-[13px] font-extrabold text-foreground">Mood This Week</span>
          <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--primary))' }}>Details →</span>
        </div>
        <div className="flex items-end gap-[6px] h-[48px]">
          {recent.slice(0, 7).reverse().map((entry: DayEntry, i: number) => {
            const moodVal = entry.mood.overallMood;
            const barH = (moodVal / 5) * 100;
            const isToday = i === Math.min(6, recent.length - 1);
            return (
              <div key={entry.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-[4px] transition-all"
                  style={{
                    height: `${barH}%`,
                    background: isToday ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.08)',
                    minHeight: 4,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          {recent.slice(0, 7).reverse().map((entry: DayEntry, i: number) => {
            const d = new Date(entry.date);
            return (
              <span key={entry.date} className="flex-1 text-center text-[8px] text-muted-foreground font-medium">
                {d.toLocaleDateString("en", { weekday: "narrow" })}
              </span>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      {!hasToday ? (
        <button onClick={onGoToCheckin}
          className="w-full py-[14px] rounded-2xl font-display font-bold text-[14px] bg-primary text-primary-foreground hover:brightness-95 active:scale-[0.98] transition-all fade-up d5"
          style={{ letterSpacing: '-0.02em' }}>
          Start Today's Check-in
        </button>
      ) : (
        <button onClick={onViewInsights}
          className="w-full py-[14px] rounded-2xl font-display font-bold text-[14px] bg-primary text-primary-foreground hover:brightness-95 active:scale-[0.98] transition-all fade-up d5"
          style={{ letterSpacing: '-0.02em' }}>
          View Full Insights →
        </button>
      )}
    </div>
  );
};

/* ─── Mini Stat ─────────────────────────────────────────── */
const MiniStat = ({ emoji, label, value, sub }: { emoji: string; label: string; value: string; sub: string }) => (
  <div className="rounded-[14px] p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
    <div className="flex items-center gap-1.5 mb-1">
      <span className="text-[12px]">{emoji}</span>
      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</span>
    </div>
    <div className="font-display text-[16px] font-extrabold text-foreground leading-none">{value}</div>
    <div className="text-[9px] text-muted-foreground mt-1">{sub}</div>
  </div>
);

export default DayLensApp;

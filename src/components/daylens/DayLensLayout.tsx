import { useState, useMemo } from "react";
import { Home, TrendingUp, ClipboardList, Heart, User, Zap, ChevronRight, Menu } from "lucide-react";
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

  // Calculate streak
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
      {/* Header — Dark with greeting */}
      <div className="header-dark">
        <div className="flex justify-between items-center mb-4">
          <div className="w-9 h-9 rounded-xl glass flex items-center justify-center cursor-pointer">
            <Menu className="w-4 h-4 text-white/[0.55]" />
          </div>
          <MoodCalendar
            entries={entries}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
        <div className="text-[13px] text-white/[0.35] font-medium">Welcome back</div>
        <div className="font-display text-[28px] font-extrabold text-foreground tracking-tight">Jacob!</div>
        {streak > 1 && (
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full bg-primary/[0.08] border border-primary/[0.15]">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[11px] font-bold text-primary">{streak}-day streak</span>
          </div>
        )}
        {isPro && (
          <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-dl-blue/20 text-dl-blue uppercase">Pro</span>
        )}
      </div>

      {/* Main content */}
      <main className="px-[18px] pt-2 pb-28 min-h-[60vh]">
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
        <nav className="flex items-center gap-0 px-4 h-[60px] rounded-full nav-blur">
          {NAV.map(item => {
            const active = screen === item.id;
            return (
              <button key={item.id} onClick={() => setScreen(item.id)}
                className={`flex items-center gap-2 h-10 px-4 rounded-full transition-all ${active ? "bg-primary" : ""}`}>
                <item.icon className={`w-[18px] h-[18px] ${active ? "text-primary-foreground" : "text-white/[0.22]"}`} strokeWidth={2} />
                {active && <span className="text-[11px] font-bold text-primary-foreground">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Pricing Sheet */}
      <BottomSheet open={showPricing} onClose={() => setShowPricing(false)} title="Unlock DayLens">
        <p className="text-[11px] text-white/[0.38] mb-5 -mt-1">Discover how your activities, sleep and habits connect.</p>
        <div className="space-y-3 mb-5">
          {PLAN_OPTIONS.map(p => (
            <div key={p.id} onClick={() => { setPlan(p.id); save("dl_plan", p.id); setShowPricing(false); }}
              className={`relative p-4 rounded-[20px] border cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform ${
                p.id === plan ? "border-primary bg-primary/10" : "border-white/[0.06] glass"
              }`}>
              {p.highlight && <span className="absolute -top-2 right-4 text-[10px] font-bold bg-dl-blue text-white px-2 py-0.5 rounded-full">Popular</span>}
              {plan === p.id && <span className="absolute top-4 right-4 text-foreground">✓</span>}
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-display font-bold text-base">{p.label}</span>
                <span className="font-display text-xl font-extrabold">{p.price}<span className="text-[11px] text-white/[0.28] font-normal">{p.period}</span></span>
              </div>
              <ul className="space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-[11px] text-white/[0.38]">✓ {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <button onClick={() => setShowPricing(false)} className="w-full py-3 text-[11px] text-white/[0.28] hover:text-white/[0.5] transition-colors">Maybe Later</button>
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
  const hrv = latestEntry?.wearable?.body?.hrv || 72;
  const restingHR = latestEntry?.wearable?.body?.restingHR || 62;
  const sleepScore = latestEntry?.wearable?.sleep?.score || 82;
  const sleepTotal = latestEntry?.wearable?.sleep?.totalHours || 7.5;
  const deepSleep = latestEntry?.wearable?.sleep?.deepHours || 1.75;
  const remSleep = latestEntry?.wearable?.sleep?.remHours || 1.5;
  const score = todayScore || (latestEntry ? computeDayScore(latestEntry) : 8.5);

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

  const goalPct = Math.min(100, Math.round((steps / 15000) * 100));
  const scoreStatus = score >= 4 ? "Excellent — Push Hard Today" : score >= 3 ? "Good — Stay Consistent" : "Rest & Recover";

  return (
    <div className="space-y-5 fade-up">
      {/* Today's Score Hero Card */}
      <div className="glass-hero rounded-[26px] p-5 cursor-pointer d1 fade-up" onClick={onViewInsights}>
        <div className="text-[10px] font-semibold text-white/[0.28] uppercase tracking-[0.08em] mb-2">Today's Score</div>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-baseline">
              <span className="font-display text-[42px] font-extrabold text-primary leading-none">{score.toFixed(1)}</span>
              <span className="font-display text-lg font-bold text-white/[0.22] ml-1">/10</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[11px] text-white/[0.45] font-medium">{scoreStatus}</span>
            </div>
          </div>
          <svg width="78" height="78" viewBox="0 0 78 78">
            <defs><linearGradient id="score-rg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#c8e878" /><stop offset="100%" stopColor="#a0d040" /></linearGradient></defs>
            <circle cx="39" cy="39" r="31" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
            <circle cx="39" cy="39" r="31" fill="none" stroke="url(#score-rg)" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${(Math.min(score, 10) / 10) * 2 * Math.PI * 31} ${2 * Math.PI * 31}`}
              strokeDashoffset={2 * Math.PI * 31 * 0.25}
              transform="rotate(-90 39 39)" />
          </svg>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          <span className="text-[10px] font-semibold text-white/[0.35] px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.06]">HRV ↑ {hrv}ms</span>
          <span className="text-[10px] font-semibold text-white/[0.35] px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.06]">Sleep {sleepTotal}h</span>
          <span className="text-[10px] font-semibold text-white/[0.35] px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.06]">Low Stress</span>
        </div>
        <div className="absolute top-5 right-5 w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center border border-white/[0.08]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </div>
      </div>

      {/* Bento Grid — 4 metrics */}
      <div className="grid grid-cols-2 gap-3 fade-up d2">
        <BentoCard icon="⚡" iconBg="rgba(200,232,120,0.12)" iconStroke="#c8e878" label="Steps" value={steps >= 1000 ? (steps/1000).toFixed(1) : String(steps)} unit="k" barPct={goalPct} barColor="#c8e878" trend={`${goalPct}% of goal`} trendColor="#c8e878" />
        <BentoCard icon="❤️" iconBg="rgba(125,168,255,0.12)" iconStroke="#7da8ff" label="Resting HR" value={String(restingHR)} unit="bpm" barPct={55} barColor="#7da8ff" trend="↓ -3 vs avg" trendColor="#7da8ff" />
        <BentoCard icon="🔥" iconBg="rgba(255,128,200,0.12)" iconStroke="#ff80c8" label="Burned" value={String(kcal)} unit="kcal" barPct={60} barColor="#ff80c8" trend="+42 vs avg" trendColor="#ff80c8" />
        <BentoCard icon="📊" iconBg="rgba(255,180,60,0.12)" iconStroke="#ffb43c" label="HRV" value={String(hrv)} unit="ms" barPct={72} barColor="#ffb43c" trend="↑ +8ms avg" trendColor="#ffb43c" />
      </div>

      {/* Sleep Card */}
      <div className="glass-card-apple rounded-[22px] p-5 fade-up d3">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="font-display text-[28px] font-extrabold text-foreground">{sleepScore}</span>
            <div className="text-[10px] text-white/[0.28] font-medium mt-0.5">Sleep Score · Last Night</div>
          </div>
          <span className="text-[10px] font-bold text-primary px-2.5 py-1 rounded-full bg-primary/[0.08] border border-primary/[0.15]">
            {sleepScore >= 75 ? "Great Sleep" : sleepScore >= 50 ? "Okay" : "Needs Work"}
          </span>
        </div>
        {/* Weekly bars */}
        <div className="flex gap-2 mb-4 items-end h-16">
          {["M","T","W","T","F","S","S"].map((day, i) => {
            const h = [54, 72, 46, 80, 64, 90, 82][i];
            const isToday = i === 6;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-sm" style={{ height: `${h}%`, background: isToday ? "#c8e878" : `rgba(200,232,120,${0.15 + (h/100)*0.25})` }} />
                <span className="text-[9px] font-semibold" style={{ color: isToday ? "#c8e878" : "rgba(255,255,255,0.2)" }}>{day}</span>
              </div>
            );
          })}
        </div>
        {/* Sleep stats */}
        <div className="flex border-t border-white/[0.06] pt-3">
          <div className="flex-1 text-center">
            <div className="font-display text-[15px] font-extrabold text-foreground">{sleepTotal}h</div>
            <div className="text-[9px] text-white/[0.25] font-semibold uppercase tracking-wider">Total</div>
          </div>
          <div className="flex-1 text-center border-x border-white/[0.06]">
            <div className="font-display text-[15px] font-extrabold text-dl-blue">{deepSleep}h</div>
            <div className="text-[9px] text-white/[0.25] font-semibold uppercase tracking-wider">Deep</div>
          </div>
          <div className="flex-1 text-center">
            <div className="font-display text-[15px] font-extrabold text-dl-pink">{remSleep}h</div>
            <div className="text-[9px] text-white/[0.25] font-semibold uppercase tracking-wider">REM</div>
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div className="fade-up d4">
        <div className="flex justify-between items-center mb-3">
          <span className="font-display text-base font-bold text-foreground">Activity</span>
          <span className="text-[11px] text-primary font-semibold cursor-pointer">See all</span>
        </div>
        <div className="overflow-x-auto -mx-[18px] px-[18px]">
          <div className="flex gap-3 w-fit">
            <ActivityHTMLCard iconBg="rgba(200,232,120,0.1)" stroke="#c8e878" label="Running" value="5.2 km" sub="34:12 · 147 bpm" badge="+12%" badgeUp />
            <ActivityHTMLCard iconBg="rgba(125,168,255,0.1)" stroke="#7da8ff" label="Cycling" value="12.8 km" sub="45:00 · 138 bpm" badge="-3.4%" badgeUp={false} />
            <ActivityHTMLCard iconBg="rgba(255,128,200,0.1)" stroke="#ff80c8" label="Weights" value="55 min" sub="Full body · High" badge="+8%" badgeUp />
          </div>
        </div>
      </div>

      {/* CTA */}
      {!hasToday ? (
        <div className="glass-card-apple rounded-[22px] p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.06] transition-all fade-up d5" onClick={onGoToCheckin}>
          <div>
            <div className="font-display text-[13px] font-bold text-foreground">Log Today's Check-in</div>
            <div className="text-[11px] text-white/[0.28] mt-0.5">Takes less than 2 minutes</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/[0.08] border border-primary/[0.15] flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c8e878" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </div>
        </div>
      ) : (
        <div className="glass-card-apple rounded-[22px] p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.06] transition-all fade-up d5" onClick={onViewInsights}>
          <div>
            <div className="font-display text-[13px] font-bold text-foreground">View Insights</div>
            <div className="text-[11px] text-white/[0.28] mt-0.5">See your trends and patterns</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/[0.08] border border-primary/[0.15] flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c8e878" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Bento Metric Card ─────────────────────────────────── */
const BentoCard = ({ icon, iconBg, iconStroke, label, value, unit, barPct, barColor, trend, trendColor }: {
  icon: string; iconBg: string; iconStroke: string; label: string; value: string; unit: string;
  barPct: number; barColor: string; trend: string; trendColor: string;
}) => (
  <div className="glass-card-apple rounded-[18px] p-4">
    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: iconBg }}>
      <span className="text-base">{icon}</span>
    </div>
    <div className="text-[10px] font-semibold text-white/[0.28] uppercase tracking-[0.08em] mb-1">{label}</div>
    <div className="font-display text-[22px] font-extrabold tracking-tight leading-none" style={{ color: barColor }}>
      {value}<span className="text-[11px] font-normal text-white/[0.28] ml-0.5">{unit}</span>
    </div>
    <div className="h-[2px] rounded-full bg-white/[0.07] mt-2.5 mb-1.5">
      <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: barColor }} />
    </div>
    <div className="text-[10px] font-bold" style={{ color: trendColor }}>{trend}</div>
  </div>
);

/* ─── Activity Card (HTML Style) ────────────────────────── */
const ActivityHTMLCard = ({ iconBg, stroke, label, value, sub, badge, badgeUp }: {
  iconBg: string; stroke: string; label: string; value: string; sub: string; badge: string; badgeUp: boolean;
}) => (
  <div className="glass-card-apple rounded-[22px] p-4 w-[155px] flex-shrink-0">
    <div className="flex justify-between items-start mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
        <Zap className="w-5 h-5" style={{ color: stroke }} />
      </div>
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeUp ? "bg-primary/[0.12] text-primary" : "bg-red-500/[0.12] text-dl-red"}`}>{badge}</span>
    </div>
    <div className="text-[11px] text-white/[0.35] font-medium">{label}</div>
    <div className="font-display text-lg font-extrabold text-foreground mt-0.5">{value}</div>
    <div className="text-[10px] text-white/[0.22] mt-0.5">{sub}</div>
  </div>
);

export default DayLensApp;

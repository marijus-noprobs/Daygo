import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Sparkles, TrendingUp, Target, Activity, Watch, Check, Bell } from "lucide-react";
import { type UserProfile, type UnitSystem, GOAL_LABELS, DIET_OPTIONS, WEARABLE_OPTIONS } from "@/lib/daylens-constants";
import { MultiWheelPicker, ScrollWheelPicker } from "./ScrollWheelPicker";
import { PaywallScreen } from "./PaywallScreen";

import dietStandard from "@/assets/diet-standard.jpg";
import dietKeto from "@/assets/diet-keto.jpg";
import dietPaleo from "@/assets/diet-paleo.jpg";
import dietVegan from "@/assets/diet-vegan.jpg";
import dietVegetarian from "@/assets/diet-vegetarian.jpg";
import dietMediterranean from "@/assets/diet-mediterranean.jpg";
import dietCarnivore from "@/assets/diet-carnivore.jpg";
import dietIf from "@/assets/diet-if.jpg";

const DIET_IMAGES: Record<string, string> = {
  "diet-standard": dietStandard,
  "diet-keto": dietKeto,
  "diet-paleo": dietPaleo,
  "diet-vegan": dietVegan,
  "diet-vegetarian": dietVegetarian,
  "diet-mediterranean": dietMediterranean,
  "diet-carnivore": dietCarnivore,
  "diet-if": dietIf,
};

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const STEPS = ["welcome", "name", "birthday", "sex", "units", "height", "weight", "goal", "diet", "features", "wearable", "notifications", "paywall"] as const;
type Step = typeof STEPS[number];

const FEATURES = [
  { icon: Activity, title: "Daily Check-in", desc: "Log sleep, nutrition, mood & activities in seconds", color: "text-muted-foreground" },
  { icon: TrendingUp, title: "Smart Insights", desc: "See how your habits affect tomorrow's performance", color: "text-muted-foreground" },
  { icon: Target, title: "Goal Tracking", desc: "Set targets and track streaks across all metrics", color: "text-foreground" },
  { icon: Sparkles, title: "Perfect Day Blueprint", desc: "AI analyzes your best days to find your formula", color: "text-foreground" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 80 }, (_, i) => 2010 - i);

// Metric
const HEIGHTS_CM = Array.from({ length: 121 }, (_, i) => i + 120); // 120-240 cm
const WEIGHTS_KG = Array.from({ length: 181 }, (_, i) => i + 30); // 30-210 kg

// Imperial: feet display values
const FEET_OPTIONS: string[] = [];
for (let ft = 3; ft <= 7; ft++) {
  for (let inch = 0; inch < 12; inch++) {
    FEET_OPTIONS.push(`${ft}'${inch}"`);
  }
}
const FEET_CM: number[] = [];
for (let ft = 3; ft <= 7; ft++) {
  for (let inch = 0; inch < 12; inch++) {
    FEET_CM.push(Math.round((ft * 12 + inch) * 2.54));
  }
}
// Imperial: lbs 66-462
const WEIGHTS_LBS = Array.from({ length: 397 }, (_, i) => i + 66);
const LBS_TO_KG = (lbs: number) => Math.round(lbs * 0.453592);
const KG_TO_LBS = (kg: number) => Math.round(kg / 0.453592);

const SEX_OPTIONS: { value: "male" | "female"; label: string; emoji: string }[] = [
  { value: "male", label: "Male", emoji: "♂" },
  { value: "female", label: "Female", emoji: "♀" },
];

function calcAgeFromBirthday(birthday: string): number {
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export const OnboardingScreen = ({ onComplete }: OnboardingProps) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [name, setName] = useState("");
  const [birthDay, setBirthDay] = useState(18);
  const [birthMonth, setBirthMonth] = useState(1);
  const [birthYear, setBirthYear] = useState(1995);
  const [units, setUnits] = useState<UnitSystem>("metric");
  const [profile, setProfile] = useState<UserProfile>({
    heightCm: 175, weightKg: 75, age: 25, sex: "male",
    activityLevel: "moderate", goal: "maintain", diet: "standard",
  });

  const step = STEPS[stepIdx];
  const isLast = step === "paywall";
  const isPaywall = step === "paywall";

  // Height/weight indices for pickers
  const heightIndexMetric = useMemo(() => HEIGHTS_CM.indexOf(profile.heightCm), [profile.heightCm]);
  const weightIndexMetric = useMemo(() => WEIGHTS_KG.indexOf(profile.weightKg), [profile.weightKg]);

  const heightIndexImperial = useMemo(() => {
    const closest = FEET_CM.reduce((best, cm, i) => Math.abs(cm - profile.heightCm) < Math.abs(FEET_CM[best] - profile.heightCm) ? i : best, 0);
    return closest;
  }, [profile.heightCm]);

  const weightIndexImperial = useMemo(() => {
    const lbs = KG_TO_LBS(profile.weightKg);
    return Math.max(0, Math.min(WEIGHTS_LBS.length - 1, lbs - 66));
  }, [profile.weightKg]);

  const dayIndex = DAYS.indexOf(birthDay);
  const yearIndex = YEARS.indexOf(birthYear);

  const finalize = (plan?: string) => {
    const birthday = `${birthYear}-${String(birthMonth + 1).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`;
    const age = calcAgeFromBirthday(birthday);
    onComplete({ ...profile, name: name.trim() || undefined, birthday, age, units });
  };

  const next = () => {
    if (isLast) finalize();
    else setStepIdx(i => i + 1);
  };

  const prev = () => setStepIdx(i => Math.max(0, i - 1));

  const handlePaywallSubscribe = (plan: string) => {
    finalize(plan);
  };

  const requestNotifications = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    next();
  };

  const slideVariants = {
    enter: { opacity: 0, x: 60 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  };

  const canContinue = step === "name" ? name.trim().length > 0 : true;

  // Paywall is rendered as a full-screen replacement
  if (isPaywall) {
    return <PaywallScreen onSubscribe={handlePaywallSubscribe} />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen relative bg-background flex flex-col overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed top-20 -left-20 w-80 h-80 bg-white/[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-32 -right-20 w-72 h-72 bg-white/[0.03] blur-[100px] rounded-full pointer-events-none" />

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 pt-14 pb-4 z-10">
        {STEPS.filter(s => s !== "paywall").map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
            i === stepIdx ? "w-8 bg-foreground" : i < stepIdx ? "w-3 bg-foreground/30" : "w-3 bg-muted/40"
          }`} />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col"
          >
            {/* ─── WELCOME ─── */}
            {step === "welcome" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center -mt-10 px-6">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="w-24 h-24 rounded-3xl bg-gradient-to-br from-muted to-muted-foreground flex items-center justify-center mb-8">
                  <Sparkles className="text-background" size={40} />
                </motion.div>
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }} className="font-display text-4xl font-extrabold tracking-tight mb-3">
                  daygo<span className="text-muted-foreground">.ai</span>
                </motion.h1>
                <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }} className="text-muted-foreground text-base max-w-[260px] leading-relaxed">
                  Understand your days. Optimize your life.
                </motion.p>
              </div>
            )}

            {/* ─── NAME ─── */}
            {step === "name" && (
              <div className="flex-1 flex flex-col items-center justify-center px-8">
                <motion.h2 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="font-display text-2xl font-extrabold tracking-tight mb-8 text-center">
                  What's your first name?
                </motion.h2>
                <motion.input
                  initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                  className="w-full text-center text-3xl font-extrabold font-display bg-transparent border-b-2 border-muted/30 focus:border-muted-foreground/50 pb-3 text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-colors"
                />
              </div>
            )}

            {/* ─── BIRTHDAY ─── */}
            {step === "birthday" && (
              <div className="flex-1 flex flex-col items-center justify-center px-6">
                <motion.h2 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="font-display text-2xl font-extrabold tracking-tight mb-8 text-center">
                  When's your birthday?
                </motion.h2>
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}>
                  <MultiWheelPicker
                    columns={[
                      { items: DAYS, selectedIndex: dayIndex >= 0 ? dayIndex : 17, onChange: (i) => setBirthDay(DAYS[i]), width: "w-20" },
                      { items: MONTHS, selectedIndex: birthMonth, onChange: (i) => setBirthMonth(i), width: "w-20" },
                      { items: YEARS, selectedIndex: yearIndex >= 0 ? yearIndex : 15, onChange: (i) => setBirthYear(YEARS[i]), width: "w-24" },
                    ]}
                  />
                </motion.div>
              </div>
            )}

            {/* ─── SEX ─── */}
            {step === "sex" && (
              <div className="flex-1 flex flex-col items-center justify-center px-8">
                <motion.h2 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="font-display text-2xl font-extrabold tracking-tight mb-8 text-center">
                  What's your sex?
                </motion.h2>
                <div className="flex gap-3 w-full max-w-xs">
                  {SEX_OPTIONS.map(s => (
                    <motion.button
                      key={s.value}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: s.value === "male" ? 0.1 : 0.15 }}
                      onClick={() => setProfile(p => ({ ...p, sex: s.value }))}
                      className={`flex-1 py-5 rounded-2xl text-base font-bold transition-all ${
                        profile.sex === s.value
                          ? "bg-foreground/[0.08] text-foreground border-2 border-foreground/25"
                          : "bg-foreground/[0.04] text-muted-foreground border-2 border-foreground/[0.06]"
                      }`}
                    >
                      <span className="text-2xl block mb-1">{s.emoji}</span>
                      {s.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── UNITS ─── */}
            {step === "units" && (
              <div className="flex-1 flex flex-col items-center justify-center px-8">
                <motion.h2 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="font-display text-2xl font-extrabold tracking-tight mb-8 text-center">
                  Preferred units?
                </motion.h2>
                <div className="flex gap-3 w-full max-w-xs">
                  {([
                    { value: "metric" as UnitSystem, label: "Metric", sub: "kg · cm" },
                    { value: "imperial" as UnitSystem, label: "Imperial", sub: "lbs · ft" },
                  ]).map((u, i) => (
                    <motion.button
                      key={u.value}
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      onClick={() => setUnits(u.value)}
                      className={`flex-1 py-5 rounded-2xl text-base font-bold transition-all ${
                        units === u.value
                          ? "bg-foreground/[0.08] text-foreground border-2 border-foreground/25"
                          : "bg-foreground/[0.04] text-muted-foreground border-2 border-foreground/[0.06]"
                      }`}
                    >
                      {u.label}
                      <span className="text-[11px] block mt-1 opacity-50">{u.sub}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── HEIGHT ─── */}
            {step === "height" && (
              <div className="flex-1 flex flex-col items-center justify-center px-6">
                <motion.h2 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="font-display text-2xl font-extrabold tracking-tight mb-2 text-center">
                  How tall are you?
                </motion.h2>
                <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05 }} className="text-muted-foreground/50 text-xs mb-6">
                  {units === "metric" ? "in centimeters" : "in feet & inches"}
                </motion.p>
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}>
                  {units === "metric" ? (
                    <ScrollWheelPicker
                      items={HEIGHTS_CM}
                      selectedIndex={heightIndexMetric >= 0 ? heightIndexMetric : 55}
                      onChange={(i) => setProfile(p => ({ ...p, heightCm: HEIGHTS_CM[i] }))}
                      className="w-28"
                    />
                  ) : (
                    <ScrollWheelPicker
                      items={FEET_OPTIONS}
                      selectedIndex={heightIndexImperial}
                      onChange={(i) => setProfile(p => ({ ...p, heightCm: FEET_CM[i] }))}
                      className="w-28"
                    />
                  )}
                </motion.div>
                <span className="text-muted-foreground/40 text-sm mt-3 font-medium">
                  {units === "metric" ? "cm" : "ft/in"}
                </span>
              </div>
            )}

            {/* ─── WEIGHT ─── */}
            {step === "weight" && (
              <div className="flex-1 flex flex-col items-center justify-center px-6">
                <motion.h2 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="font-display text-2xl font-extrabold tracking-tight mb-2 text-center">
                  What's your weight?
                </motion.h2>
                <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05 }} className="text-muted-foreground/50 text-xs mb-6">
                  {units === "metric" ? "in kilograms" : "in pounds"}
                </motion.p>
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}>
                  {units === "metric" ? (
                    <ScrollWheelPicker
                      items={WEIGHTS_KG}
                      selectedIndex={weightIndexMetric >= 0 ? weightIndexMetric : 45}
                      onChange={(i) => setProfile(p => ({ ...p, weightKg: WEIGHTS_KG[i] }))}
                      className="w-28"
                    />
                  ) : (
                    <ScrollWheelPicker
                      items={WEIGHTS_LBS}
                      selectedIndex={weightIndexImperial}
                      onChange={(i) => setProfile(p => ({ ...p, weightKg: LBS_TO_KG(WEIGHTS_LBS[i]) }))}
                      className="w-28"
                    />
                  )}
                </motion.div>
                <span className="text-muted-foreground/40 text-sm mt-3 font-medium">
                  {units === "metric" ? "kg" : "lbs"}
                </span>
              </div>
            )}

            {/* ─── GOAL ─── */}
            {step === "goal" && (
              <div className="flex-1 flex flex-col items-center justify-center px-8">
                <motion.h2 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="font-display text-2xl font-extrabold tracking-tight mb-8 text-center">
                  What's your goal?
                </motion.h2>
                <div className="w-full max-w-xs space-y-3">
                  {Object.entries(GOAL_LABELS).map(([key, label], i) => (
                    <motion.button
                      key={key}
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.08 + i * 0.06 }}
                      onClick={() => setProfile(p => ({ ...p, goal: key as UserProfile["goal"] }))}
                      className={`w-full py-4 rounded-2xl text-[15px] font-bold transition-all flex items-center justify-between px-6 ${
                        profile.goal === key
                          ? "bg-foreground/[0.08] text-foreground border-2 border-foreground/25"
                          : "bg-foreground/[0.04] text-muted-foreground border-2 border-foreground/[0.06]"
                      }`}
                    >
                      {label}
                      {profile.goal === key && (
                         <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                          <Check size={12} className="text-background" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── DIET ─── */}
            {step === "diet" && (
              <div className="flex-1 flex flex-col pt-4 px-6">
                <h2 className="font-display text-2xl font-extrabold tracking-tight mb-1 text-center">Your diet</h2>
                <p className="text-[11px] text-muted-foreground/50 mb-6 text-center">
                  We'll tailor your macro recommendations.
                </p>
                <div className="grid grid-cols-2 gap-2.5 flex-1 overflow-y-auto pb-4">
                  {DIET_OPTIONS.map((d, i) => (
                    <motion.button
                      key={d.value}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setProfile(p => ({ ...p, diet: d.value }))}
                      className={`relative rounded-2xl p-4 text-left transition-all ${
                        profile.diet === d.value
                          ? "bg-foreground/[0.08] border-2 border-foreground/25"
                          : "bg-foreground/[0.04] border-2 border-foreground/[0.06] hover:border-foreground/10"
                      }`}
                    >
                      {profile.diet === d.value && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                          <Check size={12} className="text-background" />
                        </div>
                      )}
                      {d.image && DIET_IMAGES[d.image] ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden mb-2">
                          <img src={DIET_IMAGES[d.image]} alt={d.label} className="w-full h-full object-cover" loading="lazy" width={40} height={40} />
                        </div>
                      ) : (
                        <span className="text-xl mb-2 block">{d.emoji}</span>
                      )}
                      <span className={`text-[13px] font-semibold block mb-0.5 ${
                        profile.diet === d.value ? "text-foreground" : "text-foreground/80"
                      }`}>{d.label}</span>
                      <span className="text-[10px] text-muted-foreground/50 leading-relaxed">{d.desc}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── FEATURES ─── */}
            {step === "features" && (
              <div className="flex-1 flex flex-col pt-4 px-6">
                <h2 className="font-display text-2xl font-extrabold tracking-tight mb-1 text-center">What you'll get</h2>
                <p className="text-[11px] text-muted-foreground/50 mb-6 text-center">
                  Powerful tools to understand & improve your daily life.
                </p>
                <div className="space-y-3 flex-1">
                  {FEATURES.map((f, i) => (
                    <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.1 }}
                      className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <h3 className="text-[13px] font-semibold text-foreground mb-0.5">{f.title}</h3>
                      <p className="text-[10px] text-muted-foreground/50 leading-relaxed">{f.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── WEARABLE ─── */}
            {step === "wearable" && (
              <div className="flex-1 flex flex-col pt-4 px-6">
                <div className="flex flex-col items-center text-center mb-6">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted to-muted-foreground flex items-center justify-center mb-5">
                    <Watch size={36} className="text-background" />
                  </motion.div>
                  <h2 className="font-display text-2xl font-extrabold tracking-tight mb-2">Your wearable</h2>
                  <p className="text-[11px] text-muted-foreground/50 max-w-[280px] leading-relaxed">
                    Select your device for automatic sleep, activity & health data sync.
                  </p>
                </div>
                <div className="space-y-2.5 flex-1 overflow-y-auto pb-4">
                  {WEARABLE_OPTIONS.map((w, i) => (
                    <motion.button
                      key={w.value}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setProfile(p => ({ ...p, wearableType: w.value }))}
                       className={`w-full py-3.5 rounded-2xl text-[13px] font-semibold transition-all flex items-center justify-between px-5 ${
                         profile.wearableType === w.value
                           ? "bg-foreground/[0.08] text-foreground border-2 border-foreground/25"
                           : "bg-foreground/[0.04] text-muted-foreground/60 border-2 border-foreground/[0.06] hover:border-foreground/10"
                       }`}
                    >
                      {w.label}
                      {profile.wearableType === w.value && (
                         <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                          <Check size={12} className="text-background" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/40 text-center mt-2">You can also enter data manually.</p>
              </div>
            )}

            {/* ─── NOTIFICATIONS ─── */}
            {step === "notifications" && (
              <div className="flex-1 flex flex-col items-center justify-center px-8">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="w-20 h-20 rounded-3xl bg-gradient-to-br from-muted to-muted-foreground flex items-center justify-center mb-6">
                  <Bell className="text-background" size={36} />
                </motion.div>
                <motion.h2 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="font-display text-2xl font-extrabold tracking-tight mb-3 text-center">
                  Stay on track
                </motion.h2>
                <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-muted-foreground text-sm max-w-[280px] leading-relaxed text-center mb-8">
                  Get gentle reminders to check in, plus weekly insight summaries.
                </motion.p>
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }} className="flex flex-col gap-3 w-full max-w-xs">
                  <button
                    onClick={requestNotifications}
                    className="w-full h-12 rounded-2xl font-display font-extrabold text-[15px] flex items-center justify-center gap-2 bg-foreground text-background hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    <Bell size={16} /> Enable Notifications
                  </button>
                  <button
                    onClick={next}
                    className="w-full h-10 rounded-2xl text-[13px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    Not now
                  </button>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {step !== "notifications" && (
        <div className="px-6 pb-10 pt-4 flex items-center gap-3 z-10">
          {stepIdx > 0 && (
            <button onClick={prev} className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border">
              <ChevronLeft size={20} />
            </button>
          )}
          <button
            onClick={next}
            disabled={!canContinue}
            className={`flex-1 h-12 rounded-2xl font-display font-extrabold text-[15px] flex items-center justify-center gap-2 transition-all ${
              canContinue
                ? "bg-foreground text-background hover:opacity-90 active:scale-[0.98]"
                : "bg-foreground/10 text-muted-foreground/40 cursor-not-allowed"
            }`}
          >
            {step === "welcome" ? "Get Started" : "Continue"}
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

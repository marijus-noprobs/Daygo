import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Sparkles, TrendingUp, Target, Activity, Watch, SkipForward } from "lucide-react";
import { type UserProfile, ACTIVITY_LEVEL_LABELS, GOAL_LABELS } from "@/lib/daylens-constants";

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const STEPS = ["welcome", "profile", "features", "wearable"] as const;
type Step = typeof STEPS[number];

const FEATURES = [
  { icon: Activity, title: "Daily Check-in", desc: "Log sleep, nutrition, mood & activities in seconds", color: "text-primary" },
  { icon: TrendingUp, title: "Smart Insights", desc: "See how your habits affect tomorrow's performance", color: "text-primary" },
  { icon: Target, title: "Goal Tracking", desc: "Set targets and track streaks across all metrics", color: "text-foreground" },
  { icon: Sparkles, title: "Perfect Day Blueprint", desc: "AI analyzes your best days to find your formula", color: "text-foreground" },
];

const SEX_OPTIONS: { value: "male" | "female"; label: string; emoji: string }[] = [
  { value: "male", label: "Male", emoji: "♂" },
  { value: "female", label: "Female", emoji: "♀" },
];

export const OnboardingScreen = ({ onComplete }: OnboardingProps) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    heightCm: 175, weightKg: 75, age: 25, sex: "male",
    activityLevel: "moderate", goal: "maintain",
  });

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      onComplete(profile);
    } else {
      setStepIdx(i => i + 1);
    }
  };

  const prev = () => setStepIdx(i => Math.max(0, i - 1));
  const skip = () => onComplete(profile);

  const slideVariants = {
    enter: { opacity: 0, x: 60 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative bg-background flex flex-col overflow-hidden">
      <div className="fixed top-20 -left-20 w-80 h-80 bg-white/[0.06] blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-32 -right-20 w-72 h-72 bg-white/[0.06] blur-[100px] rounded-full pointer-events-none" />

      {step !== "welcome" && (
        <button onClick={skip} className="absolute top-12 right-6 z-50 text-[11px] text-white/[0.3] hover:text-white/[0.5] transition-colors flex items-center gap-1">
          Skip <SkipForward size={12} />
        </button>
      )}

      <div className="flex justify-center gap-2 pt-14 pb-4 z-10">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === stepIdx ? "w-8 bg-primary" : i < stepIdx ? "w-4 bg-primary/40" : "w-4 bg-white/[0.1]"}`} />
        ))}
      </div>

      <div className="flex-1 flex flex-col px-6 relative">
        <AnimatePresence mode="wait">
          <motion.div key={step} variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="flex-1 flex flex-col">

            {step === "welcome" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center -mt-10">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center mb-8 shadow-lg shadow-primary/30">
                  <Sparkles className="text-primary-foreground" size={40} />
                </motion.div>
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }} className="font-display text-4xl font-extrabold tracking-tight mb-3">
                  daygo<span className="text-primary">.ai</span>
                </motion.h1>
                <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }} className="text-white/[0.38] text-base max-w-[260px] leading-relaxed">
                  Understand your days. Optimize your life.
                </motion.p>
              </div>
            )}

            {step === "profile" && (
              <div className="flex-1 flex flex-col pt-4">
                <h2 className="font-display text-2xl font-extrabold tracking-tight mb-1">About you</h2>
                <p className="text-[11px] text-white/[0.38] mb-6">We'll use this to personalize your calorie targets and insights.</p>

                <div className="space-y-5 flex-1 overflow-y-auto pb-4">
                  <div>
                    <label className="text-[10px] font-semibold text-white/[0.28] uppercase tracking-wider mb-2 block">Sex</label>
                    <div className="flex gap-2">
                      {SEX_OPTIONS.map(s => (
                        <button key={s.value} onClick={() => setProfile(p => ({ ...p, sex: s.value }))}
                          className={`flex-1 py-3 rounded-[18px] text-[13px] font-semibold transition-all ${
                            profile.sex === s.value
                              ? "bg-primary/[0.12] text-primary border border-primary/[0.2]"
                              : "bg-white/[0.05] text-white/[0.3] border border-white/[0.07]"
                          }`}>
                          {s.emoji} {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { label: "Age", key: "age" as const, unit: "yrs", min: 13, max: 100 },
                      { label: "Height", key: "heightCm" as const, unit: "cm", min: 100, max: 250 },
                      { label: "Weight", key: "weightKg" as const, unit: "kg", min: 30, max: 250 },
                    ] as const).map(f => (
                      <div key={f.key}>
                        <label className="text-[10px] font-semibold text-white/[0.28] uppercase tracking-wider mb-2 block">{f.label}</label>
                        <div className="glass rounded-[14px] px-3 py-3 flex items-baseline gap-1">
                          <input type="number" value={profile[f.key]} min={f.min} max={f.max}
                            onChange={e => setProfile(p => ({ ...p, [f.key]: parseFloat(e.target.value) || 0 }))}
                            className="bg-transparent font-display text-lg font-extrabold text-foreground focus:outline-none w-full" />
                          <span className="text-[10px] text-white/[0.28]">{f.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-white/[0.28] uppercase tracking-wider mb-2 block">Activity Level</label>
                    <div className="glass rounded-[14px] px-4 py-3 flex items-center justify-between">
                      <span className="text-[11px] text-white/[0.38]">Auto-detected from your wearable</span>
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-primary/[0.1] text-primary font-bold">Smart</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-white/[0.28] uppercase tracking-wider mb-2 block">Goal</label>
                    <div className="flex gap-2">
                      {Object.entries(GOAL_LABELS).map(([key, label]) => (
                        <button key={key} onClick={() => setProfile(p => ({ ...p, goal: key as UserProfile["goal"] }))}
                          className={`flex-1 py-3 rounded-[18px] text-[13px] font-semibold transition-all ${
                            profile.goal === key
                              ? "bg-primary/[0.12] text-primary border border-primary/[0.2]"
                              : "bg-white/[0.05] text-white/[0.3] border border-white/[0.07]"
                          }`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === "features" && (
              <div className="flex-1 flex flex-col pt-4">
                <h2 className="font-display text-2xl font-extrabold tracking-tight mb-1">What you'll get</h2>
                <p className="text-[11px] text-white/[0.38] mb-6">Powerful tools to understand & improve your daily life.</p>
                <div className="space-y-3 flex-1">
                  {FEATURES.map((f, i) => (
                    <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.1 }}
                      className="glass rounded-[18px] p-4 flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0 ${f.color}`}>
                        <f.icon size={20} />
                      </div>
                      <div>
                        <h3 className="text-[12px] font-semibold text-foreground mb-0.5">{f.title}</h3>
                        <p className="text-[10px] text-white/[0.38] leading-relaxed">{f.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {step === "wearable" && (
              <div className="flex-1 flex flex-col items-center justify-center text-center -mt-10">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/30">
                  <Watch size={36} className="text-foreground" />
                </motion.div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight mb-2">Connect a wearable</h2>
                <p className="text-[11px] text-white/[0.38] max-w-[280px] leading-relaxed mb-8">
                  Sync your Apple Watch, Garmin, or Fitbit for automatic sleep & activity data.
                </p>
                <div className="space-y-3 w-full max-w-[280px]">
                  {["Apple Health", "Garmin Connect", "Fitbit"].map(name => (
                    <button key={name} className="w-full py-3.5 rounded-[18px] bg-white/[0.05] text-[13px] font-semibold text-white/[0.55] border border-white/[0.07] hover:border-white/[0.12] transition-all">
                      {name}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-white/[0.28] mt-6">You can also enter data manually.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 pb-10 pt-4 flex items-center gap-3 z-10">
        {stepIdx > 0 && (
          <button onClick={prev} className="w-12 h-12 rounded-[18px] bg-white/[0.05] flex items-center justify-center text-white/[0.45] hover:text-white/[0.7] transition-colors border border-white/[0.07]">
            <ChevronLeft size={20} />
          </button>
        )}
        <button onClick={next}
          className="flex-1 h-12 rounded-[18px] bg-primary text-primary-foreground font-display font-extrabold text-[15px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all">
          {step === "welcome" ? "Get Started" : isLast ? "Let's Go" : "Continue"}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

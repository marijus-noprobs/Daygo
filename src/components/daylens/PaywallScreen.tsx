import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Shield, Zap } from "lucide-react";

interface PaywallProps {
  onSubscribe: (plan: string) => void;
}

const PLANS = [
  {
    id: "yearly",
    label: "Yearly",
    price: "$5.99",
    period: "/mo",
    billed: "Billed $71.88/year",
    savings: "Save 50%",
    highlight: true,
  },
  {
    id: "monthly",
    label: "Monthly",
    price: "$11.99",
    period: "/mo",
    billed: "Billed monthly",
    savings: null,
    highlight: false,
  },
];

const PERKS = [
  { icon: Sparkles, text: "AI-powered daily insights" },
  { icon: Zap, text: "Unlimited check-ins & history" },
  { icon: Shield, text: "Perfect Day Blueprint" },
  { icon: Crown, text: "Advanced goal tracking & streaks" },
];

export const PaywallScreen = ({ onSubscribe }: PaywallProps) => {
  const [selectedPlan, setSelectedPlan] = useState("yearly");

  return (
    <div className="max-w-md mx-auto min-h-screen relative bg-background flex flex-col overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed top-20 -left-20 w-80 h-80 bg-foreground/[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-32 -right-20 w-72 h-72 bg-foreground/[0.03] blur-[100px] rounded-full pointer-events-none" />

      <div className="flex-1 flex flex-col pt-16 px-6">
        {/* Header */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex flex-col items-center text-center mb-8"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-foreground/80 to-foreground flex items-center justify-center mb-5 shadow-lg shadow-foreground/10">
            <Crown className="text-background" size={36} />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">
            Unlock daygo<span className="text-muted-foreground">.ai</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-[280px] leading-relaxed">
            Start your 14-day free trial. Cancel anytime before it ends and pay nothing.
          </p>
        </motion.div>

        {/* Perks */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="space-y-3 mb-8"
        >
          {PERKS.map((perk, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-foreground/[0.08] flex items-center justify-center shrink-0">
                <perk.icon size={16} className="text-foreground" />
              </div>
              <span className="text-[13px] text-foreground/80 font-medium">{perk.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Plans */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="space-y-3 mb-6"
        >
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`w-full rounded-2xl p-4 text-left transition-all flex items-center justify-between ${
                selectedPlan === plan.id
                  ? "bg-foreground/[0.08] border-2 border-foreground/25"
                  : "bg-foreground/[0.04] border-2 border-foreground/[0.06] hover:border-foreground/10"
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[15px] font-bold ${selectedPlan === plan.id ? "text-foreground" : "text-foreground/80"}`}>
                    {plan.label}
                  </span>
                  {plan.savings && (
                    <span className="text-[10px] font-bold bg-foreground/15 text-foreground px-2 py-0.5 rounded-full">
                      {plan.savings}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground/50">{plan.billed}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xl font-extrabold font-display ${selectedPlan === plan.id ? "text-foreground" : "text-foreground/60"}`}>
                  {plan.price}
                </span>
                <span className="text-[11px] text-muted-foreground/40">{plan.period}</span>
                {selectedPlan === plan.id && (
                  <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center ml-2">
                    <Check size={12} className="text-background" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </motion.div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 pt-4 space-y-3 z-10">
        <button
          onClick={() => onSubscribe(selectedPlan)}
          className="w-full h-14 rounded-2xl font-display font-extrabold text-[15px] flex items-center justify-center gap-2 bg-foreground text-background hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Start Free 14-Day Trial
        </button>
        <p className="text-[10px] text-muted-foreground/40 text-center leading-relaxed">
          No charge today. You'll be billed after your trial ends.
          <br />Cancel anytime in settings.
        </p>
      </div>
    </div>
  );
};

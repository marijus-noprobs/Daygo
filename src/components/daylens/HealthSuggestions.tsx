import { motion } from "framer-motion";
import { Sparkles, ChevronRight } from "lucide-react";
import { GlassCard, SectionHeader } from "./DayLensUI";
import type { HealthSuggestion } from "@/lib/daylens-utils";

interface HealthSuggestionsProps {
  suggestions: HealthSuggestion[];
  detectedLevel: string | null;
  detectedLevelLabel: string | null;
}

const PRIORITY_STYLES = {
  high: "border-dl-pink/30 bg-dl-pink/[0.04]",
  medium: "border-dl-indigo/30 bg-dl-indigo/[0.04]",
  low: "border-dl-lime/30 bg-dl-lime/[0.04]",
};

const PRIORITY_DOT = {
  high: "bg-dl-pink",
  medium: "bg-dl-indigo",
  low: "bg-dl-lime",
};

export const HealthSuggestions = ({ suggestions, detectedLevel, detectedLevelLabel }: HealthSuggestionsProps) => {
  if (suggestions.length === 0 && !detectedLevel) return null;

  return (
    <div className="space-y-4">
      {/* Detected Activity Level */}
      {detectedLevel && detectedLevelLabel && (
        <GlassCard className="border-dl-indigo/20 bg-dl-indigo/[0.03]">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-dl-indigo/15 flex items-center justify-center">
              <Sparkles size={16} className="text-dl-indigo" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Detected Activity Level</p>
              <p className="text-sm font-bold text-foreground">{detectedLevelLabel}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mt-2">
            Based on your steps, workouts, and active calories from the past 7 days. This auto-updates your calorie targets.
          </p>
        </GlassCard>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <SectionHeader title="Smart Suggestions" subtitle="Personalized insights based on your data" />
          <div className="space-y-3 mt-3">
            {suggestions.slice(0, 5).map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-2xl border p-4 ${PRIORITY_STYLES[s.priority]}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0 mt-0.5">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[s.priority]}`} />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

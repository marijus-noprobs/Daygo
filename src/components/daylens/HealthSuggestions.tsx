import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GlassCard, SectionHeader } from "./DayLensUI";
import type { HealthSuggestion } from "@/lib/daylens-utils";

interface HealthSuggestionsProps {
  suggestions: HealthSuggestion[];
  detectedLevel: string | null;
  detectedLevelLabel: string | null;
}

const PRIORITY_ICON_BG: Record<string, string> = {
  high: "rgba(255,128,200,0.12)",
  medium: "rgba(125,168,255,0.12)",
  low: "rgba(200,232,120,0.12)",
};

const PRIORITY_STROKE: Record<string, string> = {
  high: "#ff80c8",
  medium: "#7da8ff",
  low: "#c8e878",
};

export const HealthSuggestions = ({ suggestions, detectedLevel, detectedLevelLabel }: HealthSuggestionsProps) => {
  if (suggestions.length === 0 && !detectedLevel) return null;

  return (
    <div className="space-y-3">
      {detectedLevel && detectedLevelLabel && (
        <GlassCard>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-[11px] flex items-center justify-center" style={{ background: "rgba(125,168,255,0.12)" }}>
              <Sparkles size={15} style={{ color: "#7da8ff" }} />
            </div>
            <div>
              <p className="text-[10px] text-white/[0.28] uppercase tracking-wider font-semibold">Detected Activity Level</p>
              <p className="text-[12px] font-bold text-foreground">{detectedLevelLabel}</p>
            </div>
          </div>
          <p className="text-[11px] text-white/[0.38] leading-relaxed mt-2">
            Based on your steps, workouts, and active calories from the past 7 days.
          </p>
        </GlassCard>
      )}

      {suggestions.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="font-display text-sm font-bold text-foreground">Suggestions</span>
          </div>
          <div className="space-y-2.5">
            {suggestions.slice(0, 5).map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass-card-apple rounded-[18px] p-4 flex gap-3 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: PRIORITY_ICON_BG[s.priority] }}>
                  <span className="text-sm">{s.icon}</span>
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-foreground mb-0.5">{s.title}</div>
                  <div className="text-[11px] text-white/[0.38] leading-relaxed">{s.description}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

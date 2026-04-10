import { motion } from "framer-motion";
import { GlassCard, SectionHeader } from "./DayLensUI";
import type { HealthSuggestion } from "@/lib/daylens-utils";

interface HealthSuggestionsProps {
  suggestions: HealthSuggestion[];
  detectedLevel: string | null;
  detectedLevelLabel: string | null;
}

export const HealthSuggestions = ({ suggestions, detectedLevel, detectedLevelLabel }: HealthSuggestionsProps) => {
  if (suggestions.length === 0 && !detectedLevel) return null;

  return (
    <div className="space-y-3">
      {detectedLevel && detectedLevelLabel && (
        <GlassCard>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-[11px] flex items-center justify-center text-[10px] font-bold uppercase text-muted-foreground" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              AL
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
                <div className="w-[3px] rounded-full flex-shrink-0 mt-0.5" style={{
                  height: 32,
                  background: s.priority === 'high' ? 'hsl(var(--destructive))' : 'rgba(255,255,255,0.25)',
                }} />
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

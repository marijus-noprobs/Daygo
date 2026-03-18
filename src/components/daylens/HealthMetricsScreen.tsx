import { Heart, BatteryCharging, Activity, Wind, Gauge, Thermometer } from "lucide-react";
import { GlassCard } from "./DayLensUI";
import { HealthSuggestions } from "./HealthSuggestions";
import type { DayEntry } from "@/lib/daylens-constants";
import type { HealthSuggestion } from "@/lib/daylens-utils";
import { scoreGradient } from "@/lib/daylens-utils";

interface HealthMetricsScreenProps {
  entries: DayEntry[];
  recent: DayEntry[];
  suggestions: HealthSuggestion[];
  detectedLevel: string | null;
  detectedLevelLabel: string | null;
}

const HealthMetricTile = ({
  label, value, unit, barPct, barColor, trend, trendColor,
}: {
  label: string; value: string | number; unit: string;
  barPct: number; barColor: string; trend: string; trendColor: string;
}) => (
  <div className="glass-card-apple rounded-[18px] p-4 cursor-pointer hover:translate-y-[-2px] transition-transform">
    <div className="text-[10px] font-semibold text-white/[0.28] uppercase tracking-[0.08em] mb-2">{label}</div>
    <div className="font-display text-[22px] font-extrabold tracking-tight leading-none" style={{ color: barColor }}>
      {value}<span className="text-[11px] font-normal text-white/[0.28] ml-0.5">{unit}</span>
    </div>
    <div className="h-[2px] rounded-full bg-white/[0.07] mt-2.5 mb-1.5">
      <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: barColor }} />
    </div>
    <div className="text-[10px] font-bold" style={{ color: trendColor }}>{trend}</div>
  </div>
);

const getStressLabel = (level: number) => {
  if (level <= 25) return "Low — Relaxed";
  if (level <= 50) return "Moderate — Manageable";
  if (level <= 75) return "High — Take a break";
  return "Very High — Rest needed";
};

const getBPLabel = (sys: number, dia: number) => {
  if (sys < 120 && dia < 80) return "Normal";
  if (sys < 130 && dia < 80) return "Elevated";
  if (sys < 140 || dia < 90) return "High (Stage 1)";
  return "High (Stage 2)";
};

const getBatteryLabel = (val: number) => {
  if (val >= 75) return "High energy";
  if (val >= 50) return "Steady energy";
  if (val >= 25) return "Low — rest";
  return "Depleted";
};

export const HealthMetricsScreen = ({ entries, recent, suggestions, detectedLevel, detectedLevelLabel }: HealthMetricsScreenProps) => {
  const latestEntry = recent[0];
  const body = latestEntry?.wearable?.body;

  if (!body) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 fade-up">
        <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center">
          <Heart className="w-8 h-8 text-white/[0.22]" />
        </div>
        <p className="text-white/[0.38] text-[11px] text-center">No health data yet.<br />Sync your wearable to see metrics.</p>
      </div>
    );
  }

  const recentBodies = recent.slice(0, 7).map(e => e.wearable?.body).filter(Boolean);
  const avgHR = recentBodies.length ? Math.round(recentBodies.reduce((s, b) => s + (b?.restingHR || 0), 0) / recentBodies.length) : null;
  const avgHRV = recentBodies.length ? Math.round(recentBodies.reduce((s, b) => s + (b?.hrv || 0), 0) / recentBodies.length) : null;

  return (
    <div className="space-y-4 pb-28 fade-up">
      <div className="font-display text-[22px] font-extrabold text-foreground tracking-tight">Health</div>

      {/* 2x2 Health Grid */}
      <div className="grid grid-cols-2 gap-3 fade-up d1">
        <HealthMetricTile label="HRV" value={body.hrv} unit=" ms" barPct={Math.min(100, body.hrv)} barColor="#c8e878"
          trend={avgHRV ? `↑ +${body.hrv - avgHRV}ms vs avg` : "Optimal"} trendColor="#c8e878" />
        <HealthMetricTile label="Resting HR" value={body.restingHR} unit=" bpm" barPct={55} barColor="#7da8ff"
          trend={avgHR ? `↓ ${body.restingHR - avgHR} vs avg` : "Normal"} trendColor="#7da8ff" />
        <HealthMetricTile label="SpO₂" value={body.spo2} unit=" %" barPct={body.spo2} barColor="#60efaa"
          trend={body.spo2 >= 95 ? "Optimal" : "Below normal"} trendColor="#60efaa" />
        <HealthMetricTile label="Body Battery" value={body.bodyBattery} unit="/100" barPct={body.bodyBattery} barColor="#ffb43c"
          trend={getBatteryLabel(body.bodyBattery)} trendColor="#ffb43c" />
      </div>

      {/* Suggestions */}
      <HealthSuggestions
        suggestions={suggestions}
        detectedLevel={detectedLevel}
        detectedLevelLabel={detectedLevelLabel}
      />
    </div>
  );
};

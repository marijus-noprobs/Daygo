import { Heart } from "lucide-react";
import { HealthSuggestions } from "./HealthSuggestions";
import type { DayEntry } from "@/lib/daylens-constants";
import type { HealthSuggestion } from "@/lib/daylens-utils";

interface HealthMetricsScreenProps {
  entries: DayEntry[];
  recent: DayEntry[];
  suggestions: HealthSuggestion[];
  detectedLevel: string | null;
  detectedLevelLabel: string | null;
}

const HealthMetricTile = ({
  label, value, unit, barPct, positive, trend,
}: {
  label: string; value: string | number; unit: string;
  barPct: number; positive: boolean; trend: string;
}) => (
  <div className="card-dark rounded-[18px] p-4 cursor-pointer hover:translate-y-[-2px] transition-transform">
    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-2">{label}</div>
    <div className="font-display text-[22px] font-extrabold tracking-tight leading-none text-foreground">
      {value}<span className="text-[11px] font-normal text-muted-foreground ml-0.5">{unit}</span>
    </div>
    <div className="h-[2px] rounded-full bg-border mt-2.5 mb-1.5">
      <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: positive ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }} />
    </div>
    <div className="text-[10px] font-bold" style={{ color: positive ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>{trend}</div>
  </div>
);

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
        <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
          <Heart className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-[11px] text-center">No health data yet.<br />Sync your wearable to see metrics.</p>
      </div>
    );
  }

  const recentBodies = recent.slice(0, 7).map(e => e.wearable?.body).filter(Boolean);
  const avgHR = recentBodies.length ? Math.round(recentBodies.reduce((s, b) => s + (b?.restingHR || 0), 0) / recentBodies.length) : null;
  const avgHRV = recentBodies.length ? Math.round(recentBodies.reduce((s, b) => s + (b?.hrv || 0), 0) / recentBodies.length) : null;

  return (
    <div className="space-y-4 pb-28 fade-up">
      <div className="grid grid-cols-2 gap-3 fade-up d1">
        <HealthMetricTile label="HRV" value={body.hrv} unit=" ms" barPct={Math.min(100, body.hrv)} positive={body.hrv >= 40}
          trend={avgHRV ? `${body.hrv >= avgHRV ? "↑" : "↓"} ${Math.abs(body.hrv - avgHRV)}ms vs avg` : "Optimal"} />
        <HealthMetricTile label="Resting HR" value={body.restingHR} unit=" bpm" barPct={55} positive={body.restingHR <= 70}
          trend={avgHR ? `${body.restingHR <= avgHR ? "↓" : "↑"} ${Math.abs(body.restingHR - avgHR)} vs avg` : "Normal"} />
        <HealthMetricTile label="SpO2" value={body.spo2} unit=" %" barPct={body.spo2} positive={body.spo2 >= 95}
          trend={body.spo2 >= 95 ? "Optimal" : "Below normal"} />
        <HealthMetricTile label="Body Battery" value={body.bodyBattery} unit="/100" barPct={body.bodyBattery} positive={body.bodyBattery >= 50}
          trend={getBatteryLabel(body.bodyBattery)} />
      </div>

      <HealthSuggestions suggestions={suggestions} detectedLevel={detectedLevel} detectedLevelLabel={detectedLevelLabel} />
    </div>
  );
};

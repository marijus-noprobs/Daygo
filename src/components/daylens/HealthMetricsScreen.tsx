import { Heart, BatteryCharging, Activity, Wind, Gauge, Thermometer } from "lucide-react";
import { GlassCard } from "./DayLensUI";
import type { DayEntry } from "@/lib/daylens-constants";
import { scoreGradient } from "@/lib/daylens-utils";

interface HealthMetricsScreenProps {
  entries: DayEntry[];
  recent: DayEntry[];
}

const MetricCard = ({
  icon: Icon, label, value, unit, subtitle, color, min, max, current,
}: {
  icon: any; label: string; value: string | number; unit: string;
  subtitle?: string; color: string; min?: number; max?: number; current?: number;
}) => {
  const pct = min !== undefined && max !== undefined && current !== undefined
    ? Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100))
    : null;

  return (
    <GlassCard className="relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold" style={{ color }}>{value}</span>
              <span className="text-xs text-muted-foreground">{unit}</span>
            </div>
          </div>
        </div>
      </div>
      {pct !== null && (
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      )}
      {subtitle && (
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      )}
    </GlassCard>
  );
};

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
  if (val >= 75) return "Fully charged — Great energy";
  if (val >= 50) return "Good — Steady energy";
  if (val >= 25) return "Low — Consider resting";
  return "Depleted — Rest urgently";
};

export const HealthMetricsScreen = ({ entries, recent }: HealthMetricsScreenProps) => {
  const latestEntry = recent[0];
  const body = latestEntry?.wearable?.body;

  if (!body) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 fade-up">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
          <Heart className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm text-center">No health data yet.<br />Sync your wearable to see metrics.</p>
      </div>
    );
  }

  const stressColor = body.stressLevel <= 25 ? "#30D158" : body.stressLevel <= 50 ? "#FFD60A" : body.stressLevel <= 75 ? "#FF9F0A" : "#FF453A";
  const bpLabel = getBPLabel(body.bloodPressureSys, body.bloodPressureDia);
  const bpColor = bpLabel === "Normal" ? "#30D158" : bpLabel === "Elevated" ? "#FFD60A" : "#FF453A";

  // Trend: compare to average of last 7 days
  const recentBodies = recent.slice(0, 7).map(e => e.wearable?.body).filter(Boolean);
  const avgHR = recentBodies.length ? Math.round(recentBodies.reduce((s, b) => s + (b?.restingHR || 0), 0) / recentBodies.length) : null;
  const avgHRV = recentBodies.length ? Math.round(recentBodies.reduce((s, b) => s + (b?.hrv || 0), 0) / recentBodies.length) : null;

  return (
    <div className="space-y-4 pb-28 fade-up">
      <div>
        <h1 className="text-2xl font-bold">Health Vitals</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Real-time metrics from your wearable</p>
      </div>

      {/* Body Battery — hero */}
      <div className="rounded-3xl p-6 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${scoreGradient(body.bodyBattery / 20)[0]}20, ${scoreGradient(body.bodyBattery / 20)[1]}10)` }}>
        <p className="text-xs font-medium text-muted-foreground mb-1">Body Battery</p>
        <div className="text-5xl font-bold mb-1" style={{ color: scoreGradient(body.bodyBattery / 20)[0] }}>
          {body.bodyBattery}
        </div>
        <div className="w-full h-3 bg-secondary/60 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${body.bodyBattery}%`,
              background: `linear-gradient(90deg, ${scoreGradient(body.bodyBattery / 20)[0]}, ${scoreGradient(body.bodyBattery / 20)[1]})`,
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{getBatteryLabel(body.bodyBattery)}</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Gauge}
          label="Stress Level"
          value={body.stressLevel}
          unit="/100"
          color={stressColor}
          min={0} max={100} current={body.stressLevel}
          subtitle={getStressLabel(body.stressLevel)}
        />
        <MetricCard
          icon={Heart}
          label="Resting HR"
          value={body.restingHR}
          unit="bpm"
          color="#FF6B6B"
          min={40} max={100} current={body.restingHR}
          subtitle={avgHR ? `7-day avg: ${avgHR} bpm` : undefined}
        />
        <MetricCard
          icon={Activity}
          label="HRV"
          value={body.hrv}
          unit="ms"
          color="#5E8BFF"
          min={15} max={100} current={body.hrv}
          subtitle={avgHRV ? `7-day avg: ${avgHRV} ms` : undefined}
        />
        <MetricCard
          icon={Wind}
          label="SpO₂"
          value={body.spo2}
          unit="%"
          color="#30D158"
          min={90} max={100} current={body.spo2}
          subtitle={body.spo2 >= 95 ? "Normal range" : "Below normal"}
        />
      </div>

      {/* Blood Pressure — full width */}
      <GlassCard className="relative overflow-hidden">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${bpColor}15` }}>
              <Thermometer className="w-5 h-5" style={{ color: bpColor }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Blood Pressure</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{ color: bpColor }}>{body.bloodPressureSys}/{body.bloodPressureDia}</span>
                <span className="text-xs text-muted-foreground">mmHg</span>
              </div>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full`} style={{ backgroundColor: `${bpColor}20`, color: bpColor }}>
            {bpLabel}
          </span>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground mb-1">Systolic</p>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (body.bloodPressureSys / 180) * 100)}%`, backgroundColor: bpColor }} />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground mb-1">Diastolic</p>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (body.bloodPressureDia / 120) * 100)}%`, backgroundColor: bpColor }} />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Ranges reference */}
      <GlassCard>
        <p className="text-xs font-semibold mb-2">Reference Ranges</p>
        <div className="space-y-1.5 text-[10px] text-muted-foreground">
          <div className="flex justify-between"><span>Resting HR</span><span>60–100 bpm (athletes 40–60)</span></div>
          <div className="flex justify-between"><span>HRV</span><span>20–100 ms (higher = better)</span></div>
          <div className="flex justify-between"><span>SpO₂</span><span>95–100% (normal)</span></div>
          <div className="flex justify-between"><span>Blood Pressure</span><span>&lt;120/80 mmHg (normal)</span></div>
          <div className="flex justify-between"><span>Stress</span><span>0–25 low, 26–50 moderate</span></div>
        </div>
      </GlassCard>
    </div>
  );
};

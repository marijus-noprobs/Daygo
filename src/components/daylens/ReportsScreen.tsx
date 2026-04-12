import { useMemo } from "react";
import { FileText, ArrowUp, ArrowDown } from "lucide-react";
import { generatePerformanceReport } from "@/lib/whoop-utils";
import type { DayEntry } from "@/lib/daylens-constants";

interface Props {
  entries: DayEntry[];
}

export const ReportsScreen = ({ entries }: Props) => {
  const report = useMemo(() => generatePerformanceReport(entries), [entries]);

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 fade-up">
        <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-[11px] text-center">Not enough data for a report.<br />Log a full week first.</p>
      </div>
    );
  }

  const recoveryColor = report.avgRecovery >= 67 ? "hsl(var(--primary))" : report.avgRecovery >= 34 ? "rgba(255,255,255,0.5)" : "hsl(var(--color-red))";

  return (
    <div className="space-y-4 pb-28 fade-up">
      {/* Header */}
      <div className="fade-up d1 px-1">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Weekly Report</div>
        <div className="text-[11px] text-muted-foreground">{report.period}</div>
      </div>

      {/* AI Summary */}
      <div className="card-dark-gradient rounded-[22px] p-5 fade-up d1">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">AI Summary</div>
        <p className="font-display text-[14px] font-bold text-foreground leading-snug">{report.topInsight}</p>
        <p className="text-[11px] text-foreground/50 mt-3 leading-relaxed">{report.moodCorrelation}</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 fade-up d2">
        {report.metrics.map(m => (
          <div key={m.label} className="card-dark rounded-[18px] p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">{m.label}</div>
            <div className="font-mono text-[22px] font-bold text-foreground" style={{ letterSpacing: '-0.03em' }}>
              {m.value}
            </div>
            {m.change !== null && (
              <div className="flex items-center gap-1 mt-1.5">
                {m.change > 0 ? <ArrowUp className="w-3 h-3 text-primary" /> : m.change < 0 ? <ArrowDown className="w-3 h-3" style={{ color: 'hsl(var(--color-red))' }} /> : null}
                <span className="text-[10px] font-bold" style={{
                  color: m.change > 0 ? 'hsl(var(--primary))' : m.change < 0 ? 'hsl(var(--color-red))' : 'rgba(255,255,255,0.4)'
                }}>
                  {m.change > 0 ? "+" : ""}{m.change} vs last week
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recovery & Sleep bar */}
      <div className="card-dark rounded-[18px] p-4 fade-up d3">
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">Recovery Trend</div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-bold text-foreground">Avg Recovery</span>
          <span className="font-mono text-[16px] font-bold" style={{ color: recoveryColor }}>{report.avgRecovery}%</span>
        </div>
        <div className="h-[6px] rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${report.avgRecovery}%`, background: recoveryColor }} />
        </div>

        <div className="flex items-center justify-between mb-2 mt-4">
          <span className="text-[12px] font-bold text-foreground">Sleep Consistency</span>
          <span className="font-mono text-[16px] font-bold text-foreground">{report.sleepConsistency}%</span>
        </div>
        <div className="h-[6px] rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full rounded-full" style={{
            width: `${report.sleepConsistency}%`,
            background: report.sleepConsistency >= 70 ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.35)',
          }} />
        </div>
      </div>
    </div>
  );
};

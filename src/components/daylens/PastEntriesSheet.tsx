import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronDown, Dumbbell } from "lucide-react";
import type { DayEntry } from "@/lib/daylens-constants";
import { computeDayScore, scoreLabel } from "@/lib/daylens-utils";

interface PastEntriesSheetProps {
  open: boolean;
  onClose: () => void;
  entries: DayEntry[];
}

const EntryDetail = ({ entry, onBack }: { entry: DayEntry; onBack: () => void }) => {
  const score = computeDayScore(entry);
  const d = new Date(entry.date + "T12:00:00");
  const dateLabel = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="fade-up">
      <button onClick={onBack} className="text-[12px] text-primary font-bold mb-4">← Back to history</button>
      <div className="text-[18px] font-extrabold text-foreground mb-1">{dateLabel}</div>
      <div className="flex items-baseline gap-2 mb-5">
        <span className="font-mono text-[32px] font-bold text-foreground" style={{ letterSpacing: "-0.04em" }}>{score.toFixed(1)}</span>
        <span
          className="text-[11px] font-bold uppercase"
          style={{
            color: score >= 4 ? "hsl(var(--primary))" : score >= 3 ? "rgba(255,255,255,0.5)" : "rgba(224,80,80,0.8)",
          }}
        >
          {scoreLabel(score)}
        </span>
      </div>

      <div className="space-y-2">
        {entry.wearable && (
          <div className="card-dark rounded-[16px] p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Sleep</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="font-mono text-[18px] font-bold text-foreground">{entry.wearable.sleep.totalHours.toFixed(1)}</div>
                <div className="text-[9px] text-muted-foreground">hrs total</div>
              </div>
              <div>
                <div className="font-mono text-[18px] font-bold text-foreground">{entry.wearable.sleep.deepHours.toFixed(1)}</div>
                <div className="text-[9px] text-muted-foreground">hrs deep</div>
              </div>
              <div>
                <div className="font-mono text-[18px] font-bold text-foreground">{entry.wearable.sleep.score}</div>
                <div className="text-[9px] text-muted-foreground">score</div>
              </div>
            </div>
          </div>
        )}

        {entry.wearable && (
          <div className="card-dark rounded-[16px] p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Body</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="font-mono text-[18px] font-bold text-foreground">{entry.wearable.body.hrv}</div>
                <div className="text-[9px] text-muted-foreground">HRV ms</div>
              </div>
              <div>
                <div className="font-mono text-[18px] font-bold text-foreground">{entry.wearable.body.restingHR}</div>
                <div className="text-[9px] text-muted-foreground">RHR bpm</div>
              </div>
              <div>
                <div className="font-mono text-[18px] font-bold text-foreground">{entry.wearable.activity.steps.toLocaleString()}</div>
                <div className="text-[9px] text-muted-foreground">steps</div>
              </div>
            </div>
          </div>
        )}

        <div className="card-dark rounded-[16px] p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Mood</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="font-mono text-[18px] font-bold text-foreground">{entry.mood.overallMood}</div>
              <div className="text-[9px] text-muted-foreground">overall /5</div>
            </div>
            <div>
              <div className="font-mono text-[18px] font-bold text-foreground">{entry.mood.energy}</div>
              <div className="text-[9px] text-muted-foreground">energy /5</div>
            </div>
            <div>
              <div className="font-mono text-[18px] font-bold text-foreground">{entry.mood.anxiety}</div>
              <div className="text-[9px] text-muted-foreground">anxiety /5</div>
            </div>
          </div>
        </div>

        <div className="card-dark rounded-[16px] p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Nutrition</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="font-mono text-[18px] font-bold text-foreground">{entry.nutrition.calories}</div>
              <div className="text-[9px] text-muted-foreground">kcal</div>
            </div>
            <div>
              <div className="font-mono text-[18px] font-bold text-foreground">{entry.nutrition.proteinG}g</div>
              <div className="text-[9px] text-muted-foreground">protein</div>
            </div>
            <div>
              <div className="font-mono text-[18px] font-bold text-foreground">{entry.nutrition.waterLiters.toFixed(1)}L</div>
              <div className="text-[9px] text-muted-foreground">water</div>
            </div>
          </div>
        </div>

        {entry.activities && entry.activities.length > 0 && (
          <div className="card-dark rounded-[16px] p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Activities</div>
            <div className="space-y-2">
              {entry.activities.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5" style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <Dumbbell size={13} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-bold text-foreground capitalize">{a.type}</div>
                    <div className="text-[10px] text-muted-foreground">{a.startTime} – {a.endTime}{a.notes ? ` · ${a.notes}` : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {entry.note && (
          <div className="card-dark rounded-[16px] p-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Note</div>
            <div className="text-[12px] text-foreground/70 leading-relaxed">{entry.note}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const getWeekLabel = (dateStr: string): string => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const d = new Date(dateStr + "T12:00:00");
  const dayOfWeek = d.getDay();
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - dayOfWeek);

  const nowDayOfWeek = now.getDay();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - nowDayOfWeek);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);

  if (weekStart.toISOString().split("T")[0] === thisWeekStart.toISOString().split("T")[0]) return "This Week";
  if (weekStart.toISOString().split("T")[0] === lastWeekStart.toISOString().split("T")[0]) return "Last Week";
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
};

export const PastEntriesSheet = ({ open, onClose, entries }: PastEntriesSheetProps) => {
  const [selectedEntry, setSelectedEntry] = useState<DayEntry | null>(null);
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const groups: { label: string; entries: DayEntry[]; avgScore: number }[] = [];
    const map = new Map<string, DayEntry[]>();

    sorted.forEach((entry) => {
      const label = getWeekLabel(entry.date);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(entry);
    });

    map.forEach((weekEntries, label) => {
      const avg = weekEntries.reduce((s, e) => s + computeDayScore(e), 0) / weekEntries.length;
      groups.push({ label, entries: weekEntries, avgScore: avg });
    });

    return groups;
  }, [entries]);

  const toggleWeek = (label: string) => {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 fade-in"
      onClick={onClose}
      style={{
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div
        className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-[24px] p-5 pt-4 scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#141415", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-display text-[20px] font-extrabold text-foreground">
            {selectedEntry ? "Entry Detail" : "History"}
          </h2>
          <button
            onClick={() => {
              setSelectedEntry(null);
              onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <X size={16} className="text-foreground/60" />
          </button>
        </div>

        {selectedEntry ? (
          <EntryDetail entry={selectedEntry} onBack={() => setSelectedEntry(null)} />
        ) : (
          <div className="space-y-3">
            {grouped.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-[12px]">No entries yet. Start logging!</p>
              </div>
            )}
            {grouped.map((week) => {
              const isCollapsed = collapsedWeeks.has(week.label);

              return (
                <div key={week.label}>
                  {/* Week header */}
                  <button
                    onClick={() => toggleWeek(week.label)}
                    className="w-full flex items-center justify-between px-2 py-2 rounded-xl transition-colors hover:bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-2.5">
                      <ChevronDown
                        size={14}
                        className="text-muted-foreground/50 transition-transform"
                        style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
                      />
                      <span className="text-[12px] font-bold text-foreground/80">{week.label}</span>
                      <span className="text-[10px] text-muted-foreground">{week.entries.length} days</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: week.avgScore >= 4 ? "hsl(var(--primary))" : week.avgScore >= 3 ? "rgba(255,255,255,0.3)" : "rgba(224,80,80,0.6)",
                        }}
                      />
                      <span className="text-[11px] font-mono font-bold text-muted-foreground">
                        {week.avgScore.toFixed(1)}
                      </span>
                    </div>
                  </button>

                  {/* Week entries */}
                  {!isCollapsed && (
                    <div className="ml-2 mt-1 space-y-0.5">
                      {week.entries.map((entry) => {
                        const score = computeDayScore(entry);
                        const d = new Date(entry.date + "T12:00:00");
                        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        const isToday = entry.date === new Date().toISOString().split("T")[0];

                        return (
                          <button
                            key={entry.date}
                            onClick={() => setSelectedEntry(entry)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-[14px] text-left transition-all active:scale-[0.98] hover:bg-white/[0.02]"
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{
                                background: score >= 4 ? "rgba(132,204,22,0.1)" : score >= 3 ? "rgba(255,255,255,0.05)" : "rgba(224,80,80,0.08)",
                                border: `1.5px solid ${score >= 4 ? "rgba(132,204,22,0.25)" : score >= 3 ? "rgba(255,255,255,0.1)" : "rgba(224,80,80,0.2)"}`,
                              }}
                            >
                              <span
                                className="font-mono text-[11px] font-bold"
                                style={{
                                  color: score >= 4 ? "hsl(var(--primary))" : score >= 3 ? "rgba(255,255,255,0.7)" : "rgba(224,80,80,0.8)",
                                }}
                              >
                                {score.toFixed(1)}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] font-bold text-foreground">{isToday ? "Today" : dayName}</span>
                                <span className="text-[10px] text-muted-foreground">{dateStr}</span>
                              </div>
                            </div>

                            <ChevronRight size={14} className="text-muted-foreground/30 flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : modal;
};

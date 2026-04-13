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

export const PastEntriesSheet = ({ open, onClose, entries }: PastEntriesSheetProps) => {
  const [selectedEntry, setSelectedEntry] = useState<DayEntry | null>(null);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  );

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
          <div className="space-y-1.5">
            {sorted.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-[12px]">No entries yet. Start logging!</p>
              </div>
            )}
            {sorted.map((entry) => {
              const score = computeDayScore(entry);
              const d = new Date(entry.date + "T12:00:00");
              const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
              const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const isToday = entry.date === new Date().toISOString().split("T")[0];

              return (
                <button
                  key={entry.date}
                  onClick={() => setSelectedEntry(entry)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-[16px] text-left transition-all active:scale-[0.98] hover:bg-white/[0.02]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: score >= 4 ? "rgba(132,204,22,0.1)" : score >= 3 ? "rgba(255,255,255,0.05)" : "rgba(224,80,80,0.08)",
                      border: `1.5px solid ${score >= 4 ? "rgba(132,204,22,0.25)" : score >= 3 ? "rgba(255,255,255,0.1)" : "rgba(224,80,80,0.2)"}`,
                    }}
                  >
                    <span
                      className="font-mono text-[13px] font-bold"
                      style={{
                        color: score >= 4 ? "hsl(var(--primary))" : score >= 3 ? "rgba(255,255,255,0.7)" : "rgba(224,80,80,0.8)",
                      }}
                    >
                      {score.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-foreground">{isToday ? "Today" : dayName}</span>
                      <span className="text-[11px] text-muted-foreground">{dateStr}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                      {entry.wearable && <span>{entry.wearable.sleep.totalHours.toFixed(1)}h sleep</span>}
                      {entry.wearable && <span>·</span>}
                      <span>Mood {entry.mood.overallMood}/5</span>
                      {entry.activities.length > 0 && <span>· {entry.activities.length} activities</span>}
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-muted-foreground/40 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : modal;
};

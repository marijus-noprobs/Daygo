import { useState } from "react";
import { X, Plus } from "lucide-react";
import { ACTIVITY_TYPES, FOOD_DB, type Activity, type FoodDBEntry } from "@/lib/daylens-constants";
import { durationHours, formatDuration, isLateNight } from "@/lib/daylens-utils";

// ─── Activity Card ────────────────────────────────────────────────────────────
export const ActivityCard = ({ activity, onUpdate, onRemove }: {
  activity: Activity; onUpdate: (a: Activity) => void; onRemove: () => void;
}) => {
  const at = ACTIVITY_TYPES.find(t => t.key === activity.type) || ACTIVITY_TYPES[0];
  const dur = durationHours(activity.startTime, activity.endTime);
  const late = isLateNight(activity.startTime);
  return (
    <div className={`rounded-2xl p-4 mb-3 border ${at.bgClass} ${at.borderClass}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-[11px] font-bold uppercase ${at.bgClass} ${at.colorClass}`} style={{ border: '1px solid currentColor', opacity: 0.8 }}>
            {at.label.slice(0, 2)}
          </div>
          <div>
            <span className={`text-sm font-semibold ${at.colorClass}`}>{at.label}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{activity.startTime} – {activity.endTime}</span>
              <span className="text-xs text-muted-foreground/50">·</span>
              <span className="text-xs text-foreground/60 font-medium">{formatDuration(dur)}</span>
              {late && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive border border-destructive/20 font-medium">Late night</span>}
            </div>
          </div>
        </div>
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors mt-0.5">
          <X size={16} />
        </button>
      </div>
      <div className="flex gap-2 mb-2.5">
        <div className="flex-1">
          <div className="text-[10px] text-muted-foreground/60 mb-1 uppercase tracking-wide">Start</div>
          <input type="time" value={activity.startTime} onChange={e => onUpdate({ ...activity, startTime: e.target.value })} className="w-full" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-muted-foreground/60 mb-1 uppercase tracking-wide">End</div>
          <input type="time" value={activity.endTime} onChange={e => onUpdate({ ...activity, endTime: e.target.value })} className="w-full" />
        </div>
      </div>
      <input type="text" value={activity.notes || ""} onChange={e => onUpdate({ ...activity, notes: e.target.value })}
        placeholder="Notes (optional)"
        className="text-sm py-2 px-3 bg-foreground/[0.06] border border-foreground/[0.08] rounded-xl text-foreground w-full outline-none focus:border-primary/50 placeholder:text-foreground/20" />
    </div>
  );
};

// ─── Activity Type Picker ─────────────────────────────────────────────────────
export const ActivityTypePicker = ({ onSelect }: { onSelect: (type: string) => void }) => (
  <div className="grid grid-cols-5 gap-2 mb-4">
    {ACTIVITY_TYPES.map(at => (
      <button key={at.key} onClick={() => onSelect(at.key)}
        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${at.bgClass} ${at.borderClass}`}>
        <div className={`text-[11px] font-bold uppercase ${at.colorClass}`}>{at.label.slice(0, 2)}</div>
        <span className={`text-[10px] font-medium ${at.colorClass}`}>{at.label.split("/")[0]}</span>
      </button>
    ))}
  </div>
);

// ─── Add Food Item ────────────────────────────────────────────────────────────
export const AddFoodItem = ({ onAdd }: { onAdd: (item: { name: string; kcal: number; proteinG: number }) => void }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"quick" | "custom">("quick");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FoodDBEntry | null>(null);
  const [qty, setQty] = useState("");
  const [customName, setCustomName] = useState("");
  const [customKcal, setCustomKcal] = useState("");
  const [customProt, setCustomProt] = useState("");

  const filtered = search.length > 0
    ? FOOD_DB.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : FOOD_DB;

  const preview = selected && qty
    ? { kcal: Math.round((selected.kcalPer100 / 100) * parseFloat(qty)), protein: Math.round((selected.proteinPer100 / 100) * parseFloat(qty) * 10) / 10 }
    : null;

  const handleQuickAdd = (food: FoodDBEntry, quantity: string) => {
    const q = parseFloat(quantity) || food.defaultQty;
    const kcal = Math.round((food.kcalPer100 / 100) * q);
    const protein = Math.round((food.proteinPer100 / 100) * q * 10) / 10;
    onAdd({ name: `${food.name} (${q}${food.unit})`, kcal, proteinG: protein });
    setSelected(null); setQty(""); setSearch(""); setOpen(false);
  };

  const handleCustomAdd = () => {
    if (!customName.trim()) return;
    onAdd({ name: customName, kcal: parseFloat(customKcal) || 0, proteinG: parseFloat(customProt) || 0 });
    setCustomName(""); setCustomKcal(""); setCustomProt(""); setOpen(false);
  };

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="w-full py-2.5 border border-dashed border-muted rounded-xl text-xs text-muted-foreground hover:text-foreground/70 hover:border-foreground/30 transition-colors flex items-center justify-center gap-1.5">
      <Plus size={14} /> Add food item
    </button>
  );

  const inputClass = "w-full bg-secondary/50 border border-muted rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/50";

  return (
    <div className="bg-secondary/40 rounded-2xl p-4 space-y-3">
      <div className="flex gap-2">
        {([["quick", "From database"], ["custom", "Custom entry"]] as const).map(([m, l]) => (
          <button key={m} onClick={() => { setMode(m); setSelected(null); setQty(""); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === m ? "bg-primary text-foreground" : "bg-muted/60 text-muted-foreground hover:text-foreground/70"}`}>
            {l}
          </button>
        ))}
      </div>

      {mode === "quick" && (
        <>
          <input value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }}
            placeholder="Search food (beef, chicken, rice...)" className={inputClass} />

          {!selected && (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {filtered.map(f => (
                <button key={f.name} onClick={() => { setSelected(f); setQty(String(f.defaultQty)); setSearch(f.name); }}
                  className="px-2.5 py-1 bg-muted/60 hover:bg-primary/30 hover:text-primary text-foreground/70 text-[11px] rounded-lg transition-colors">
                  {f.name}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-3 py-2.5">
                <span className="text-sm text-foreground font-medium flex-1">{selected.name}</span>
                <button onClick={() => { setSelected(null); setQty(""); setSearch(""); }} className="text-muted-foreground hover:text-foreground/70 text-xs">change</button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Amount ({selected.unit})</label>
                  <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder={String(selected.defaultQty)}
                    className="w-full bg-secondary/50 border border-muted rounded-xl px-3 py-2.5 text-base font-semibold text-foreground outline-none focus:border-primary/50" />
                </div>
                {preview && (
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Calculated</div>
                    <div className="text-sm font-bold text-primary">{preview.kcal} kcal</div>
                    <div className="text-xs text-foreground/60">{preview.protein}g protein</div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {(selected.unit === "g" ? [100, 150, 200, 300, 500] : selected.unit === "ml" ? [100, 200, 250, 300, 500] : [1, 2, 3, 4, 5]).map(v => (
                  <button key={v} onClick={() => setQty(String(v))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${qty === String(v) ? "bg-primary text-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground/70"}`}>
                    {selected.unit === "g" ? (v >= 1000 ? `${v / 1000}kg` : `${v}g`) : selected.unit === "ml" ? `${v}ml` : v}
                  </button>
                ))}
              </div>
              <button onClick={() => handleQuickAdd(selected, qty)}
                className="w-full py-2.5 bg-primary hover:opacity-90 text-foreground rounded-xl text-sm font-semibold transition-colors">
                Add {selected.name} {qty && `(${qty}${selected.unit})`}
              </button>
            </div>
          )}
        </>
      )}

      {mode === "custom" && (
        <div className="space-y-2">
          <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Food name" className={inputClass} />
          <div className="flex gap-2">
            <input type="number" value={customKcal} onChange={e => setCustomKcal(e.target.value)} placeholder="kcal" className={inputClass} />
            <input type="number" value={customProt} onChange={e => setCustomProt(e.target.value)} placeholder="protein g" className={inputClass} />
          </div>
          <button onClick={handleCustomAdd}
            className="w-full py-2.5 bg-primary hover:opacity-90 text-foreground rounded-xl text-sm font-semibold transition-colors">
            Add
          </button>
        </div>
      )}

      <button onClick={() => { setOpen(false); setSelected(null); setQty(""); setSearch(""); }}
        className="w-full text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors pt-1">Cancel</button>
    </div>
  );
};

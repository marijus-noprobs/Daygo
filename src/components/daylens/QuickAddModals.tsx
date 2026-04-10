import { useState } from "react";
import { X, Plus, Users } from "lucide-react";
import { MealLogSection } from "./MealLogSection";
import { ActivityCard, ActivityTypePicker } from "./ActivityComponents";
import type { NutritionData, Activity } from "@/lib/daylens-constants";
import { newActivityBlank } from "@/lib/daylens-utils";

const ModalOverlay = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center fade-in"
    onClick={onClose}
    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
    <div className="w-[92%] max-w-md max-h-[85vh] rounded-[22px] flex flex-col scale-in"
      onClick={e => e.stopPropagation()}
      style={{ background: '#1c1c1d', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="font-display text-lg font-extrabold text-foreground">{title}</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-colors">
          <X size={18} className="text-muted-foreground" />
        </button>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {children}
      </div>
    </div>
  </div>
);

// ─── Food Modal ──────────────────────────────────────────────
export const FoodModal = ({ nutrition, setNutrition, onClose, onSave }: {
  nutrition: NutritionData;
  setNutrition: (fn: (n: NutritionData) => NutritionData) => void;
  onClose: () => void;
  onSave: () => void;
}) => (
  <ModalOverlay title="Log Food" onClose={onClose}>
    <MealLogSection nutrition={nutrition} setNutrition={setNutrition} />
    <button onClick={onSave}
      className="w-full mt-4 py-[15px] rounded-[18px] bg-primary text-primary-foreground font-display text-[15px] font-extrabold active:scale-[0.98] transition-transform">
      Save
    </button>
  </ModalOverlay>
);

// ─── Activity Modal ──────────────────────────────────────────
export const ActivityModal = ({ activities, setActivities, onClose, onSave }: {
  activities: Activity[];
  setActivities: (fn: (a: Activity[]) => Activity[]) => void;
  onClose: () => void;
  onSave: () => void;
}) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <ModalOverlay title="Log Activity" onClose={onClose}>
      <div className="space-y-3">
        {activities.length === 0 && !showPicker && (
          <p className="text-[11px] text-muted-foreground/50">No activities logged yet.</p>
        )}
        {activities.map((a, i) => (
          <ActivityCard key={a.id} activity={a}
            onUpdate={updated => setActivities(acts => acts.map((x, j) => j === i ? updated : x))}
            onRemove={() => setActivities(acts => acts.filter((_, j) => j !== i))} />
        ))}

        {showPicker ? (
          <div className="card-dark rounded-[22px] p-[18px]">
            <div className="font-display text-[13px] font-extrabold text-foreground mb-3">Choose type</div>
            <ActivityTypePicker onSelect={type => {
              const blank = newActivityBlank();
              blank.type = type;
              setActivities(a => [...a, blank]);
              setShowPicker(false);
            }} />
            <button onClick={() => setShowPicker(false)}
              className="w-full text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setShowPicker(true)}
            className="w-full py-2.5 border border-dashed border-muted rounded-xl text-xs text-muted-foreground hover:text-foreground/70 hover:border-foreground/30 transition-colors flex items-center justify-center gap-1.5">
            <Plus size={14} /> Add activity
          </button>
        )}
      </div>
      <button onClick={onSave}
        className="w-full mt-4 py-[15px] rounded-[18px] bg-primary text-primary-foreground font-display text-[15px] font-extrabold active:scale-[0.98] transition-transform">
        Save
      </button>
    </ModalOverlay>
  );
};

// ─── Social Modal ────────────────────────────────────────────
export const SocialModal = ({ activities, setActivities, onClose, onSave }: {
  activities: Activity[];
  setActivities: (fn: (a: Activity[]) => Activity[]) => void;
  onClose: () => void;
  onSave: () => void;
}) => {
  const socialActivities = activities.filter(a => a.type === "social");

  const addSocial = (notes: string) => {
    const blank = newActivityBlank();
    blank.type = "social";
    blank.notes = notes;
    setActivities(a => [...a, blank]);
  };

  const presets = ["Dinner with friends", "Family time", "Date night", "Party", "Coffee catch-up", "Phone call", "Group hangout"];

  return (
    <ModalOverlay title="Log Social" onClose={onClose}>
      <div className="space-y-3">
        <div className="font-display text-[13px] font-extrabold text-foreground mb-1">Quick add</div>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button key={p} onClick={() => addSocial(p)}
              className="px-3 py-2 rounded-2xl text-[11px] font-medium transition-all hover:scale-105 active:scale-95 bg-primary/10 border border-primary/20 text-primary">
              {p}
            </button>
          ))}
        </div>

        {socialActivities.length > 0 && (
          <div className="mt-4">
            <div className="font-display text-[13px] font-extrabold text-foreground mb-2">Logged</div>
            {socialActivities.map((a, i) => {
              const realIndex = activities.findIndex(x => x.id === a.id);
              return (
                <ActivityCard key={a.id} activity={a}
                  onUpdate={updated => setActivities(acts => acts.map((x, j) => j === realIndex ? updated : x))}
                  onRemove={() => setActivities(acts => acts.filter((_, j) => j !== realIndex))} />
              );
            })}
          </div>
        )}
      </div>
      <button onClick={onSave}
        className="w-full mt-4 py-[15px] rounded-[18px] bg-primary text-primary-foreground font-display text-[15px] font-extrabold active:scale-[0.98] transition-transform">
        Save
      </button>
    </ModalOverlay>
  );
};

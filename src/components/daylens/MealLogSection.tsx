import { useState } from "react";
import { Camera, Plus, Trash2, Sparkles, Droplets } from "lucide-react";
import { AddFoodItem } from "./ActivityComponents";
import type { NutritionData, FoodItem } from "@/lib/daylens-constants";

const getAIFeedback = (items: FoodItem[]): string | null => {
  if (items.length === 0) return null;
  const totalCal = items.reduce((s, i) => s + i.kcal, 0);
  const totalProtein = items.reduce((s, i) => s + i.proteinG, 0);
  if (totalProtein < 30 && items.length >= 2) return "Consider adding a protein source — aim for 30g+ per day for sustained energy.";
  if (totalCal > 2200) return "High calorie intake today — be mindful of portion sizes this evening.";
  const hasProcessed = items.some(i => ["pizza", "burger", "fries"].some(f => i.name.toLowerCase().includes(f)));
  if (hasProcessed) return "Processed foods can cause energy crashes. Watch how you feel in 2-3 hours.";
  if (items.length >= 3 && totalProtein >= 30) return "Great balance so far. Keep it up.";
  return null;
};

interface MealLogSectionProps {
  nutrition: NutritionData;
  setNutrition: (fn: (n: NutritionData) => NutritionData) => void;
}

export const MealLogSection = ({ nutrition, setNutrition }: MealLogSectionProps) => {
  const allItems = nutrition.meals[0]?.items ?? [];
  const totalCal = nutrition.calories;
  const totalProtein = nutrition.proteinG;
  const feedback = getAIFeedback(allItems);

  const addItem = (item: { name: string; kcal: number; proteinG: number }) => {
    setNutrition(n => ({
      ...n,
      meals: n.meals.map((m, i) => i === 0 ? { ...m, items: [...m.items, item] } : m),
      calories: n.calories + item.kcal,
      proteinG: n.proteinG + item.proteinG,
    }));
  };

  const removeItem = (itemIndex: number) => {
    setNutrition(n => {
      const item = n.meals[0]?.items[itemIndex];
      return {
        ...n,
        meals: n.meals.map((m, i) => i === 0 ? { ...m, items: m.items.filter((_, j) => j !== itemIndex) } : m),
        calories: n.calories - (item?.kcal || 0),
        proteinG: n.proteinG - (item?.proteinG || 0),
      };
    });
  };

  return (
    <div className="space-y-3 slide-in">
      {/* Summary bar */}
      <div className="rounded-[22px] p-[18px]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="font-display text-[14px] font-extrabold text-foreground mb-3">Today's Totals</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="font-display text-[20px] font-extrabold text-foreground">{totalCal}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">kcal</div>
          </div>
          <div className="text-center">
            <div className="font-display text-[20px] font-extrabold text-foreground">{totalProtein}g</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">protein</div>
          </div>
          <div className="text-center">
            <div className="font-display text-[20px] font-extrabold text-foreground">{nutrition.waterLiters}L</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">water</div>
          </div>
        </div>
      </div>

      {/* Food items */}
      <div className="rounded-[22px] p-[18px]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="font-display text-[14px] font-extrabold text-foreground mb-3">What did you eat?</div>

        {allItems.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {allItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div>
                  <div className="text-[12px] font-semibold text-foreground">{item.name}</div>
                  <div className="text-[10px] text-muted-foreground">{item.kcal} kcal · {item.proteinG}g protein</div>
                </div>
                <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {allItems.length === 0 && (
          <p className="text-[11px] text-muted-foreground/50 mb-3">No food logged yet.</p>
        )}

        {/* AI Feedback */}
        {feedback && (
          <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 mb-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Sparkles size={14} className="text-foreground mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-foreground/80 leading-relaxed">{feedback}</p>
          </div>
        )}

        {/* Photo upload placeholder */}
        <button className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-foreground/20 rounded-xl text-[11px] text-muted-foreground hover:text-foreground/70 hover:border-foreground/30 transition-colors mb-3">
          <Camera size={14} />
          <span>Snap a photo for AI analysis</span>
        </button>

        {/* Add food item */}
        <AddFoodItem onAdd={addItem} />
      </div>

      {/* Water slider */}
      <div className="rounded-[22px] p-[18px]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Droplets size={14} className="text-foreground" />
          <span className="font-display text-[14px] font-extrabold text-foreground">Water</span>
        </div>
        <div className="flex items-center gap-2.5">
          <input type="range" min={0} max={5} step={0.25} value={nutrition.waterLiters}
            onChange={e => setNutrition(n => ({ ...n, waterLiters: parseFloat(e.target.value) }))}
            className="flex-1" />
          <span className="font-mono text-[11px] font-bold text-foreground w-[40px] text-right">{nutrition.waterLiters}L</span>
        </div>
      </div>
    </div>
  );
};

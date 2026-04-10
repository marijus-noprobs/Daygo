import { useState } from "react";
import { Camera, Plus, Trash2, ChevronDown, ChevronUp, Sparkles, Droplets } from "lucide-react";
import { AddFoodItem } from "./ActivityComponents";
import type { NutritionData, MealData, FoodItem } from "@/lib/daylens-constants";

const MOCK_AI_FEEDBACK: Record<string, (items: FoodItem[]) => string | null> = {
  Breakfast: (items) => {
    if (items.length === 0) return null;
    const totalProtein = items.reduce((s, i) => s + i.proteinG, 0);
    if (totalProtein < 15) return "Low protein — try adding eggs or Greek yogurt to sustain energy longer.";
    if (totalProtein >= 25) return "Great protein-rich start. This will keep you full and focused.";
    return "Solid breakfast. Good balance of nutrients.";
  },
  Lunch: (items) => {
    if (items.length === 0) return null;
    const totalCal = items.reduce((s, i) => s + i.kcal, 0);
    if (totalCal > 1000) return "Heavy lunch — you might feel sluggish this afternoon.";
    const hasProcessed = items.some(i => ["pizza", "burger"].some(f => i.name.toLowerCase().includes(f)));
    if (hasProcessed) return "Processed foods can cause energy crashes. Watch how you feel in 2-3 hours.";
    return "Well-balanced lunch.";
  },
  Dinner: (items) => {
    if (items.length === 0) return null;
    const totalCal = items.reduce((s, i) => s + i.kcal, 0);
    if (totalCal > 800) return "Large dinner may affect sleep quality. Try eating lighter in the evening.";
    return "Good dinner portion size.";
  },
  Snacks: (items) => {
    if (items.length === 0) return null;
    const totalCal = items.reduce((s, i) => s + i.kcal, 0);
    if (totalCal > 500) return "Snacks adding up — consider swapping for lower-cal options.";
    return "Reasonable snacking.";
  },
};

interface MealLogSectionProps {
  nutrition: NutritionData;
  setNutrition: (fn: (n: NutritionData) => NutritionData) => void;
}

const MealCard = ({ meal, mealIndex, onUpdate }: {
  meal: MealData;
  mealIndex: number;
  onUpdate: (fn: (n: NutritionData) => NutritionData) => void;
}) => {
  const [expanded, setExpanded] = useState(mealIndex === 0);
  const emoji = MEAL_EMOJIS[meal.name] || "🍽️";
  const totalCal = meal.items.reduce((s, i) => s + i.kcal, 0);
  const totalProtein = meal.items.reduce((s, i) => s + i.proteinG, 0);
  const feedback = MOCK_AI_FEEDBACK[meal.name]?.(meal.items);

  const addItem = (item: { name: string; kcal: number; proteinG: number }) => {
    onUpdate(n => ({
      ...n,
      meals: n.meals.map((m, i) => i === mealIndex ? { ...m, items: [...m.items, item] } : m),
      calories: n.calories + item.kcal,
      proteinG: n.proteinG + item.proteinG,
    }));
  };

  const removeItem = (itemIndex: number) => {
    onUpdate(n => {
      const item = n.meals[mealIndex].items[itemIndex];
      return {
        ...n,
        meals: n.meals.map((m, i) => i === mealIndex ? { ...m, items: m.items.filter((_, j) => j !== itemIndex) } : m),
        calories: n.calories - (item?.kcal || 0),
        proteinG: n.proteinG - (item?.proteinG || 0),
      };
    });
  };

  return (
    <div className="card-dark rounded-[22px] overflow-hidden">
      {/* Meal header */}
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-[18px] text-left">
        <div className="flex items-center gap-3">
          <span className="text-xl">{emoji}</span>
          <div>
            <div className="font-display text-[14px] font-extrabold text-foreground">{meal.name}</div>
            {meal.items.length > 0 && (
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {meal.items.length} item{meal.items.length !== 1 ? "s" : ""} · {totalCal} kcal · {totalProtein}g protein
              </div>
            )}
            {meal.items.length === 0 && (
              <div className="text-[11px] text-muted-foreground/50 mt-0.5">No items logged</div>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-[18px] pb-[18px] space-y-3">
          {/* Logged food items */}
          {meal.items.length > 0 && (
            <div className="space-y-1.5">
              {meal.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-secondary/30 rounded-xl px-3 py-2.5">
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

          {/* AI Feedback */}
          {feedback && (
            <div className="flex items-start gap-2.5 bg-primary/[0.06] border border-primary/[0.12] rounded-xl px-3 py-2.5">
              <Sparkles size={14} className="text-primary mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-foreground/80 leading-relaxed">{feedback}</p>
            </div>
          )}

          {/* Photo upload placeholder */}
          <button className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-muted rounded-xl text-[11px] text-muted-foreground hover:text-foreground/70 hover:border-foreground/30 transition-colors">
            <Camera size={14} />
            <span>Snap a photo for AI analysis</span>
          </button>

          {/* Add food item */}
          <AddFoodItem onAdd={addItem} />
        </div>
      )}
    </div>
  );
};

export const MealLogSection = ({ nutrition, setNutrition }: MealLogSectionProps) => {
  const totalCal = nutrition.calories;
  const totalProtein = nutrition.proteinG;

  return (
    <div className="space-y-3 slide-in">
      {/* Summary bar */}
      <div className="card-dark rounded-[22px] p-[18px]">
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

      {/* Meal cards */}
      {nutrition.meals.map((meal, i) => (
        <MealCard key={meal.name} meal={meal} mealIndex={i} onUpdate={setNutrition} />
      ))}

      {/* Water slider */}
      <div className="card-dark rounded-[22px] p-[18px]">
        <div className="flex items-center gap-2 mb-3">
          <Droplets size={14} className="text-primary" />
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

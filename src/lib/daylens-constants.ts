export interface ActivityType {
  key: string;
  label: string;
  emoji: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  subcategories?: { key: string; label: string }[];
}

export const EXERCISE_SUBCATEGORIES = [
  { key: "running",    label: "Running" },
  { key: "cycling",    label: "Cycling" },
  { key: "swimming",   label: "Swimming" },
  { key: "gym",        label: "Gym" },
  { key: "yoga",       label: "Yoga" },
  { key: "tennis",     label: "Tennis" },
  { key: "basketball", label: "Basketball" },
  { key: "football",   label: "Football" },
  { key: "hiking",     label: "Hiking" },
  { key: "dancing",    label: "Dancing" },
  { key: "martial_arts", label: "Martial Arts" },
  { key: "other_exercise", label: "Other" },
];

export const ACTIVITY_TYPES: ActivityType[] = [
  { key: "gaming",     label: "Gaming",       emoji: "", colorClass: "text-foreground/60",  bgClass: "bg-white/[0.04]",  borderClass: "border-white/[0.08]" },
  { key: "work",       label: "Work",         emoji: "", colorClass: "text-foreground/60",  bgClass: "bg-white/[0.04]",  borderClass: "border-white/[0.08]" },
  { key: "social",     label: "Social",       emoji: "", colorClass: "text-primary",        bgClass: "bg-primary/10",    borderClass: "border-primary/20" },
  { key: "exercise",   label: "Exercise",     emoji: "", colorClass: "text-primary",        bgClass: "bg-primary/10",    borderClass: "border-primary/20", subcategories: EXERCISE_SUBCATEGORIES },
  { key: "reading",    label: "Reading",      emoji: "", colorClass: "text-foreground/60",  bgClass: "bg-white/[0.04]",  borderClass: "border-white/[0.08]" },
  { key: "tv",         label: "TV/Streaming", emoji: "", colorClass: "text-destructive",    bgClass: "bg-destructive/10",borderClass: "border-destructive/20" },
  { key: "drinking",   label: "Drinking",     emoji: "", colorClass: "text-destructive",    bgClass: "bg-destructive/10",borderClass: "border-destructive/20" },
  { key: "meditation", label: "Meditation",   emoji: "", colorClass: "text-primary",        bgClass: "bg-primary/10",    borderClass: "border-primary/20" },
  { key: "outdoor",    label: "Outdoors",     emoji: "", colorClass: "text-primary",        bgClass: "bg-primary/10",    borderClass: "border-primary/20" },
  { key: "other",      label: "Other",        emoji: "", colorClass: "text-muted-foreground", bgClass: "bg-white/[0.04]", borderClass: "border-white/[0.08]" },
];
export interface PlanOption {
  id: string;
  label: string;
  price: string;
  period: string;
  gradientClass: string;
  borderClass: string;
  features: string[];
  highlight?: boolean;
}

export const PLAN_OPTIONS: PlanOption[] = [
  { id: "free",    label: "Free",    price: "$0",  period: "",    gradientClass: "from-secondary to-secondary", borderClass: "border-muted", features: ["30-day history", "Daily check-in", "Basic insights", "Activity tracking"] },
  { id: "pro",     label: "Pro",     price: "$9",  period: "/mo", gradientClass: "from-primary/20 to-primary/20", borderClass: "border-primary/40", features: ["Unlimited history", "AI analysis", "Activity impact analysis", "Goal tracking", "Anomaly alerts", "Perfect Day"], highlight: true },
  { id: "premium", label: "Premium", price: "$19", period: "/mo", gradientClass: "from-white/20 to-white/20", borderClass: "border-white/40", features: ["Everything in Pro", "Custom categories", "Coach sharing", "Priority support"] },
];

export interface Goal {
  id: number;
  metric: string;
  label: string;
  target: number;
  unit: string;
  op: "gte" | "lte";
  active: boolean;
}

export const DEFAULT_GOALS: Goal[] = [
  { id: 1, metric: "sleep_hrs", label: "Sleep ≥ 7.5 hrs",  target: 7.5,  unit: "hrs",   op: "gte", active: true },
  { id: 2, metric: "steps",     label: "Steps ≥ 8,000",    target: 8000, unit: "steps", op: "gte", active: true },
  { id: 3, metric: "hrv",       label: "HRV ≥ 50 ms",      target: 50,   unit: "ms",    op: "gte", active: true },
  { id: 4, metric: "bedtime",   label: "Bed before 11pm",  target: 23,   unit: "hr",    op: "lte", active: false },
];

export interface WearableData {
  sleep: { totalHours: number; deepHours: number; remHours: number; score: number; bedtime: string; wakeTime: string };
  activity: { steps: number; activeKcal: number; standHours: number; workouts: Workout[] };
  body: { hrv: number; restingHR: number; spo2: number; bodyBattery: number; stressLevel: number; bloodPressureSys: number; bloodPressureDia: number };
}

export interface Workout {
  type: string;
  durationMin: number;
  intensity: string;
  avgHR: number;
}

export interface MealData {
  name: string;
  quality: number;
  notes: string;
  items: FoodItem[];
}

export interface FoodItem {
  name: string;
  kcal: number;
  proteinG: number;
}

export interface NutritionData {
  meals: MealData[];
  waterLiters: number;
  calories: number;
  proteinG: number;
  alcoholUnits: number;
}

export interface MoodData {
  overallMood: number;
  anxiety: number;
  focus: number;
  energy: number;
  stressEvents: string;
  gratitude: string;
}

export interface Activity {
  id: number;
  type: string;
  startTime: string;
  endTime: string;
  notes: string;
}

export interface DayEntry {
  date: string;
  wearable?: WearableData;
  nutrition: NutritionData;
  mood: MoodData;
  activities: Activity[];
  note: string;
}

export type DietType = "standard" | "keto" | "paleo" | "vegan" | "vegetarian" | "mediterranean" | "carnivore" | "intermittent_fasting";

export interface UserProfile {
  name?: string;
  birthday?: string; // ISO date string e.g. "1995-02-18"
  heightCm: number;
  weightKg: number;
  age: number;
  sex: "male" | "female";
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "lose" | "maintain" | "gain";
  diet: DietType;
  wearableType?: string;
}

export const DEFAULT_PROFILE: UserProfile = {
  heightCm: 175,
  weightKg: 75,
  age: 30,
  sex: "male",
  activityLevel: "moderate",
  goal: "maintain",
  diet: "standard",
};

export const DIET_OPTIONS: { value: DietType; label: string; desc: string; emoji: string }[] = [
  { value: "standard", label: "Standard", desc: "Balanced macros, no restrictions", emoji: "🍽️" },
  { value: "keto", label: "Keto", desc: "High fat, very low carb", emoji: "🥑" },
  { value: "paleo", label: "Paleo", desc: "Whole foods, no processed", emoji: "🥩" },
  { value: "vegan", label: "Vegan", desc: "100% plant-based", emoji: "🌱" },
  { value: "vegetarian", label: "Vegetarian", desc: "No meat, dairy ok", emoji: "🥗" },
  { value: "mediterranean", label: "Mediterranean", desc: "Olive oil, fish, whole grains", emoji: "🫒" },
  { value: "carnivore", label: "Carnivore", desc: "Animal products only", emoji: "🥓" },
  { value: "intermittent_fasting", label: "IF", desc: "Time-restricted eating", emoji: "⏰" },
];

export const WEARABLE_OPTIONS: { value: string; label: string }[] = [
  { value: "apple_watch", label: "Apple Watch" },
  { value: "garmin", label: "Garmin" },
  { value: "fitbit", label: "Fitbit" },
  { value: "whoop", label: "WHOOP" },
  { value: "samsung", label: "Samsung Galaxy Watch" },
  { value: "oura", label: "Oura Ring" },
  { value: "polar", label: "Polar" },
  { value: "coros", label: "COROS" },
  { value: "none", label: "No wearable" },
];

export const ACTIVITY_LEVEL_LABELS: Record<string, string> = {
  sedentary: "Sedentary (desk job)",
  light: "Lightly active (1-2x/wk)",
  moderate: "Moderate (3-5x/wk)",
  active: "Active (6-7x/wk)",
  very_active: "Very active (2x/day)",
};

export const GOAL_LABELS: Record<string, string> = {
  lose: "Lose weight",
  maintain: "Maintain weight",
  gain: "Gain weight",
};

export interface FoodDBEntry {
  name: string;
  unit: string;
  kcalPer100: number;
  proteinPer100: number;
  defaultQty: number;
}

export const FOOD_DB: FoodDBEntry[] = [
  { name: "Beef",           unit: "g",   kcalPer100: 250, proteinPer100: 26,   defaultQty: 200 },
  { name: "Chicken breast", unit: "g",   kcalPer100: 165, proteinPer100: 31,   defaultQty: 200 },
  { name: "Salmon",         unit: "g",   kcalPer100: 208, proteinPer100: 20,   defaultQty: 150 },
  { name: "Tuna",           unit: "g",   kcalPer100: 132, proteinPer100: 28,   defaultQty: 150 },
  { name: "Pork",           unit: "g",   kcalPer100: 242, proteinPer100: 27,   defaultQty: 200 },
  { name: "Turkey",         unit: "g",   kcalPer100: 189, proteinPer100: 29,   defaultQty: 200 },
  { name: "Eggs",           unit: "pcs", kcalPer100: 68,  proteinPer100: 6,    defaultQty: 2 },
  { name: "Rice (cooked)",  unit: "g",   kcalPer100: 130, proteinPer100: 2.7,  defaultQty: 200 },
  { name: "Oats",           unit: "g",   kcalPer100: 389, proteinPer100: 17,   defaultQty: 80 },
  { name: "Pasta (cooked)", unit: "g",   kcalPer100: 131, proteinPer100: 5,    defaultQty: 200 },
  { name: "Bread",          unit: "g",   kcalPer100: 265, proteinPer100: 9,    defaultQty: 60 },
  { name: "Potato",         unit: "g",   kcalPer100: 77,  proteinPer100: 2,    defaultQty: 200 },
  { name: "Sweet potato",   unit: "g",   kcalPer100: 86,  proteinPer100: 1.6,  defaultQty: 200 },
  { name: "Greek yogurt",   unit: "g",   kcalPer100: 59,  proteinPer100: 10,   defaultQty: 200 },
  { name: "Cottage cheese", unit: "g",   kcalPer100: 98,  proteinPer100: 11,   defaultQty: 150 },
  { name: "Milk",           unit: "ml",  kcalPer100: 61,  proteinPer100: 3.2,  defaultQty: 300 },
  { name: "Cheese",         unit: "g",   kcalPer100: 402, proteinPer100: 25,   defaultQty: 40 },
  { name: "Protein shake",  unit: "g",   kcalPer100: 380, proteinPer100: 75,   defaultQty: 30 },
  { name: "Banana",         unit: "g",   kcalPer100: 89,  proteinPer100: 1.1,  defaultQty: 120 },
  { name: "Apple",          unit: "g",   kcalPer100: 52,  proteinPer100: 0.3,  defaultQty: 180 },
  { name: "Avocado",        unit: "g",   kcalPer100: 160, proteinPer100: 2,    defaultQty: 100 },
  { name: "Almonds",        unit: "g",   kcalPer100: 579, proteinPer100: 21,   defaultQty: 30 },
  { name: "Olive oil",      unit: "ml",  kcalPer100: 884, proteinPer100: 0,    defaultQty: 15 },
  { name: "Pizza",          unit: "g",   kcalPer100: 266, proteinPer100: 11,   defaultQty: 200 },
  { name: "Burger",         unit: "g",   kcalPer100: 295, proteinPer100: 17,   defaultQty: 200 },
  { name: "Coffee",         unit: "ml",  kcalPer100: 2,   proteinPer100: 0.3,  defaultQty: 240 },
  { name: "Salad",          unit: "g",   kcalPer100: 20,  proteinPer100: 1.5,  defaultQty: 150 },
];

export const SAMPLE_ACTIVITIES: Array<Array<Omit<Activity, "id">>> = [
  [{ type: "gaming",   startTime: "21:00", endTime: "01:00", notes: "Call of Duty" },
   { type: "work",     startTime: "09:00", endTime: "18:00", notes: "Deep work day" }],
  [{ type: "exercise", startTime: "07:00", endTime: "08:00", notes: "Morning run" },
   { type: "work",     startTime: "09:00", endTime: "17:30", notes: "" },
   { type: "social",   startTime: "19:00", endTime: "22:00", notes: "Dinner with friends" }],
  [{ type: "work",     startTime: "09:00", endTime: "19:00", notes: "Late deadline" },
   { type: "tv",       startTime: "20:00", endTime: "23:30", notes: "Netflix" }],
  [{ type: "reading",  startTime: "08:00", endTime: "09:00", notes: "" },
   { type: "exercise", startTime: "12:00", endTime: "13:00", notes: "Gym" },
   { type: "gaming",   startTime: "20:00", endTime: "22:30", notes: "" }],
  [{ type: "outdoor",  startTime: "10:00", endTime: "13:00", notes: "Hiking" },
   { type: "social",   startTime: "15:00", endTime: "18:00", notes: "" }],
  [{ type: "gaming",   startTime: "22:00", endTime: "02:00", notes: "Tournament night" }],
  [{ type: "meditation", startTime: "07:00", endTime: "07:30", notes: "" },
   { type: "work",      startTime: "09:00", endTime: "17:00", notes: "" },
   { type: "reading",   startTime: "21:00", endTime: "22:30", notes: "" }],
];

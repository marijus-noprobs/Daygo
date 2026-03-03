import { Crown, AlertCircle } from "lucide-react";
import { GlassCard } from "./DayLensUI";
import type { DayEntry } from "@/lib/daylens-constants";

interface AccountScreenProps {
  entries: DayEntry[];
  plan: string;
  onShowPricing: () => void;
  onReset: () => void;
}

export const AccountScreen = ({ entries, plan, onShowPricing, onReset }: AccountScreenProps) => (
  <div className="space-y-5 pb-28 fade-up">
    <div className="flex flex-col items-center pt-4 pb-2">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-dl-indigo to-dl-purple p-0.5 mb-3">
        <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-dl-indigo to-dl-purple">JD</span>
        </div>
      </div>
      <h2 className="text-lg font-semibold">John Doe</h2>
      <span className="text-[10px] px-3 py-1 rounded-full bg-secondary text-muted-foreground mt-1.5 uppercase tracking-widest">{plan} Member</span>
    </div>

    <GlassCard>
      {[
        { label: "Days logged", val: entries.length },
        { label: "Activities logged", val: entries.reduce((s, e) => s + (e.activities?.length || 0), 0) },
        { label: "Tracking since", val: entries.length ? new Date(entries[0].date + "T12:00").toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—" },
      ].map((r, i, arr) => (
        <div key={r.label} className={`flex justify-between py-3.5 ${i < arr.length - 1 ? "border-b border-secondary/60" : ""}`}>
          <span className="text-sm text-muted-foreground">{r.label}</span>
          <span className="text-sm font-semibold">{r.val}</span>
        </div>
      ))}
    </GlassCard>

    <div className="space-y-3">
      <GlassCard className="flex items-center justify-between" onClick={onShowPricing}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-dl-amber/10 flex items-center justify-center text-dl-amber">
            <Crown size={16} />
          </div>
          <span className="text-sm font-medium">{plan === "free" ? "Upgrade Plan" : "Manage Subscription"}</span>
        </div>
      </GlassCard>
      <GlassCard className="flex items-center justify-between" onClick={onReset}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-dl-red/10 flex items-center justify-center text-dl-red">
            <AlertCircle size={16} />
          </div>
          <span className="text-sm font-medium text-dl-red">Reset Data</span>
        </div>
      </GlassCard>
    </div>
  </div>
);

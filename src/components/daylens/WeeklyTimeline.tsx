import { useRef, useEffect, useMemo } from "react";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";
import { type DayEntry } from "@/lib/daylens-constants";
import { computeDayScore, scoreGradient } from "@/lib/daylens-utils";

interface WeeklyTimelineProps {
  entries: DayEntry[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

export const WeeklyTimeline = ({ entries, selectedDate, onSelectDate }: WeeklyTimelineProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const now = new Date();
    const entryMap: Record<string, DayEntry> = {};
    entries.forEach(e => { entryMap[e.date] = e; });

    return Array.from({ length: 14 }, (_, i) => {
      const date = subDays(now, 13 - i);
      const dateStr = format(date, "yyyy-MM-dd");
      const entry = entryMap[dateStr];
      const score = entry ? computeDayScore(entry) : null;
      const [color] = score ? scoreGradient(score) : ["transparent"];
      return { date, dateStr, dayInitial: DAY_INITIALS[date.getDay()], dayNum: date.getDate(), score, color, hasData: !!entry };
    });
  }, [entries]);

  const selectedStr = format(selectedDate, "yyyy-MM-dd");

  // Auto-scroll to selected day on mount
  useEffect(() => {
    if (scrollRef.current) {
      const idx = days.findIndex(d => d.dateStr === selectedStr);
      if (idx >= 0) {
        const el = scrollRef.current.children[idx] as HTMLElement;
        if (el) el.scrollIntoView({ inline: "center", behavior: "smooth" });
      }
    }
  }, []);

  return (
    <div
      className="mx-4 mb-3 rounded-2xl px-2 py-2.5"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto scrollbar-none items-center"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {days.map((day) => {
          const isSelected = day.dateStr === selectedStr;
          const isToday = day.dateStr === format(new Date(), "yyyy-MM-dd");

          return (
            <motion.button
              key={day.dateStr}
              onClick={() => onSelectDate(day.date)}
              whileTap={{ scale: 0.92 }}
              className="flex flex-col items-center gap-0.5 flex-shrink-0 rounded-xl py-1.5 px-1 transition-all relative"
              style={{
                scrollSnapAlign: "center",
                minWidth: 42,
                background: isSelected ? "rgba(255,255,255,0.1)" : "transparent",
                boxShadow: isSelected ? "0 0 16px rgba(200,232,120,0.15)" : "none",
              }}
            >
              <span
                className="text-[10px] font-bold uppercase"
                style={{ color: isSelected ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)" }}
              >
                {day.dayInitial}
              </span>

              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  border: day.hasData
                    ? `2px solid ${day.color}`
                    : "2px solid rgba(255,255,255,0.08)",
                  background: isSelected && day.hasData
                    ? `${day.color}20`
                    : "transparent",
                  color: isSelected ? "#fff" : "rgba(255,255,255,0.55)",
                }}
              >
                {day.dayNum}
              </div>

              {/* Selected indicator dot */}
              {isSelected && (
                <motion.div
                  layoutId="timeline-dot"
                  className="w-1 h-1 rounded-full bg-primary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}

              {/* Today label */}
              {isToday && !isSelected && (
                <span className="text-[8px] font-bold text-primary">NOW</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

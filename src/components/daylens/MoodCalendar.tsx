import { useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DayPicker, DayContentProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type DayEntry } from "@/lib/daylens-constants";
import { computeDayScore, scoreGradient } from "@/lib/daylens-utils";

const MOOD_EMOJI = ["", "😫", "😕", "😐", "😊", "🤩"];

interface MoodCalendarProps {
  entries: DayEntry[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const MoodCalendar = ({ entries, selectedDate, onSelectDate }: MoodCalendarProps) => {
  const entryMap = useMemo(() => {
    const map: Record<string, DayEntry> = {};
    entries.forEach(e => { map[e.date] = e; });
    return map;
  }, [entries]);

  const scoreMap = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach(e => { map[e.date] = computeDayScore(e); });
    return map;
  }, [entries]);

  const renderDayContent = (props: DayContentProps) => {
    const dateStr = format(props.date, "yyyy-MM-dd");
    const entry = entryMap[dateStr];
    const score = scoreMap[dateStr];
    const mood = entry?.mood?.overallMood;

    const [color] = score ? scoreGradient(score) : ["transparent"];
    const hasData = !!entry;

    return (
      <div className="flex flex-col items-center gap-0.5 relative">
        <span>{props.date.getDate()}</span>
        {hasData && (
          <div className="flex items-center gap-0.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {mood && (
              <span className="text-[8px] leading-none">{MOOD_EMOJI[mood]}</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors">
          <CalendarIcon className="w-4 h-4 text-primary-foreground" />
          <span className="text-xs font-bold text-primary-foreground">{format(selectedDate, "MMM d")}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
        <div className="p-1">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && onSelectDate(d)}
            showOutsideDays={false}
            className="p-3 pointer-events-auto"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                buttonVariants({ variant: "outline" }),
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-12 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(buttonVariants({ variant: "ghost" }), "h-12 w-10 p-0 font-normal aria-selected:opacity-100"),
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "day-outside text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
              IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
              DayContent: renderDayContent,
            }}
          />
          {/* Legend */}
          <div className="flex items-center justify-center gap-3 px-3 pb-3 pt-1 border-t border-border">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#30D158" }} />
              <span className="text-[10px] text-muted-foreground">Great</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FFD60A" }} />
              <span className="text-[10px] text-muted-foreground">OK</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FF453A" }} />
              <span className="text-[10px] text-muted-foreground">Low</span>
            </div>
            <span className="text-[10px] text-muted-foreground">😊 = mood</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

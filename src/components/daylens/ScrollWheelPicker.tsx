import { useRef, useEffect, useCallback, useState } from "react";

interface ScrollWheelPickerProps {
  items: (string | number)[];
  selectedIndex: number;
  onChange: (index: number) => void;
  itemHeight?: number;
  visibleItems?: number;
  className?: string;
}

export const ScrollWheelPicker = ({
  items,
  selectedIndex,
  onChange,
  itemHeight = 52,
  visibleItems = 3,
  className = "",
}: ScrollWheelPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const paddingItems = Math.floor(visibleItems / 2);
  const containerHeight = itemHeight * visibleItems;

  // Scroll to selected index on mount and when selectedIndex changes externally
  useEffect(() => {
    if (isUserScrolling) return;
    const el = containerRef.current;
    if (!el) return;
    const targetScroll = selectedIndex * itemHeight;
    el.scrollTop = targetScroll;
  }, [selectedIndex, itemHeight, isUserScrolling]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    setIsUserScrolling(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const scrollTop = el.scrollTop;
      const newIndex = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, newIndex));

      // Snap to position
      el.scrollTo({ top: clampedIndex * itemHeight, behavior: "smooth" });

      if (clampedIndex !== selectedIndex) {
        onChange(clampedIndex);
      }
      setTimeout(() => setIsUserScrolling(false), 100);
    }, 80);
  }, [itemHeight, items.length, selectedIndex, onChange]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ height: containerHeight }}
    >
      {/* Selection highlight */}
      <div
        className="absolute left-0 right-0 pointer-events-none z-10 rounded-xl bg-muted/40"
        style={{
          top: paddingItems * itemHeight,
          height: itemHeight,
        }}
      />

      {/* Fade edges */}
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-background to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll scrollbar-none"
        style={{
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          paddingTop: paddingItems * itemHeight,
          paddingBottom: paddingItems * itemHeight,
        }}
      >
        {items.map((item, i) => {
          const isSelected = i === selectedIndex;
          return (
            <div
              key={`${item}-${i}`}
              className={`flex items-center justify-center transition-all duration-150 select-none ${
                isSelected
                  ? "text-foreground font-extrabold scale-100 opacity-100"
                  : "text-muted-foreground/40 font-semibold scale-90 opacity-50"
              }`}
              style={{
                height: itemHeight,
                scrollSnapAlign: "start",
                fontSize: isSelected ? "28px" : "20px",
              }}
              onClick={() => {
                onChange(i);
                containerRef.current?.scrollTo({
                  top: i * itemHeight,
                  behavior: "smooth",
                });
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Convenience: Multi-column wheel picker (like birthday)
interface MultiWheelPickerProps {
  columns: {
    items: (string | number)[];
    selectedIndex: number;
    onChange: (index: number) => void;
    width?: string;
  }[];
  itemHeight?: number;
}

export const MultiWheelPicker = ({ columns, itemHeight = 52 }: MultiWheelPickerProps) => {
  return (
    <div className="flex items-center justify-center gap-1">
      {columns.map((col, i) => (
        <ScrollWheelPicker
          key={i}
          items={col.items}
          selectedIndex={col.selectedIndex}
          onChange={col.onChange}
          itemHeight={itemHeight}
          className={col.width || "w-24"}
        />
      ))}
    </div>
  );
};

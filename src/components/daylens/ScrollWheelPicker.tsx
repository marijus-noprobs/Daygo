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
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0); // always-current offset
  const dragRef = useRef({ active: false, startY: 0, startOffset: 0 });
  const momentumRef = useRef(0);
  const rafRef = useRef<number>();
  const lastTouchY = useRef(0);
  const lastTime = useRef(0);
  const selectedIndexRef = useRef(selectedIndex);

  const paddingItems = Math.floor(visibleItems / 2);
  const containerHeight = itemHeight * visibleItems;
  const maxIndex = items.length - 1;

  // Keep refs in sync
  useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);
  useEffect(() => { offsetRef.current = offset; }, [offset]);

  // Reset offset when selectedIndex changes externally
  useEffect(() => {
    if (!dragRef.current.active) {
      setOffset(0);
      offsetRef.current = 0;
    }
  }, [selectedIndex]);

  const updateOffset = (v: number) => {
    offsetRef.current = v;
    setOffset(v);
  };

  const clampAndSnap = useCallback((currentOffset: number) => {
    const si = selectedIndexRef.current;
    const rawIndex = si + currentOffset / itemHeight;
    const targetIndex = Math.round(Math.max(0, Math.min(maxIndex, rawIndex)));
    if (targetIndex !== si) {
      onChange(targetIndex);
    }
    updateOffset(0);
  }, [itemHeight, maxIndex, onChange]);

  const applyMomentum = useCallback((velocity: number, currentOffset: number) => {
    let vel = velocity;
    let off = currentOffset;

    const step = () => {
      vel *= 0.92;
      off += vel;

      const si = selectedIndexRef.current;
      const minOff = (0 - si) * itemHeight;
      const maxOff = (maxIndex - si) * itemHeight;
      off = Math.max(minOff, Math.min(maxOff, off));

      if (Math.abs(vel) < 0.5) {
        clampAndSnap(off);
        return;
      }

      updateOffset(off);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  }, [itemHeight, maxIndex, clampAndSnap]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const y = e.touches[0].clientY;
    dragRef.current = { active: true, startY: y, startOffset: offsetRef.current };
    lastTouchY.current = y;
    lastTime.current = Date.now();
    momentumRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current.active) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    const delta = dragRef.current.startY - y;
    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      momentumRef.current = (lastTouchY.current - y) / dt * 16;
    }
    lastTouchY.current = y;
    lastTime.current = now;

    let newOffset = dragRef.current.startOffset + delta;
    const si = selectedIndexRef.current;
    const minOff = (0 - si) * itemHeight;
    const maxOff = (maxIndex - si) * itemHeight;
    if (newOffset < minOff) newOffset = minOff + (newOffset - minOff) * 0.3;
    if (newOffset > maxOff) newOffset = maxOff + (newOffset - maxOff) * 0.3;

    updateOffset(newOffset);
  };

  const handleTouchEnd = () => {
    dragRef.current.active = false;
    const vel = momentumRef.current;
    const off = offsetRef.current;
    if (Math.abs(vel) > 2) {
      applyMomentum(vel, off);
    } else {
      clampAndSnap(off);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    dragRef.current = { active: true, startY: e.clientY, startOffset: offsetRef.current };
    lastTouchY.current = e.clientY;
    lastTime.current = Date.now();
    momentumRef.current = 0;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current.active) return;
      const delta = dragRef.current.startY - ev.clientY;
      const now = Date.now();
      const dt = now - lastTime.current;
      if (dt > 0) {
        momentumRef.current = (lastTouchY.current - ev.clientY) / dt * 16;
      }
      lastTouchY.current = ev.clientY;
      lastTime.current = now;

      let newOffset = dragRef.current.startOffset + delta;
      const si = selectedIndexRef.current;
      const minOff = (0 - si) * itemHeight;
      const maxOff = (maxIndex - si) * itemHeight;
      if (newOffset < minOff) newOffset = minOff + (newOffset - minOff) * 0.3;
      if (newOffset > maxOff) newOffset = maxOff + (newOffset - maxOff) * 0.3;
      updateOffset(newOffset);
    };

    const handleMouseUp = () => {
      dragRef.current.active = false;
      const vel = momentumRef.current;
      const off = offsetRef.current;
      if (Math.abs(vel) > 2) {
        applyMomentum(vel, off);
      } else {
        clampAndSnap(off);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const direction = e.deltaY > 0 ? 1 : -1;
    const newIndex = Math.max(0, Math.min(maxIndex, selectedIndex + direction));
    if (newIndex !== selectedIndex) {
      onChange(newIndex);
      updateOffset(0);
    }
  };

  const getItemStyle = (index: number) => {
    const distFromCenter = (index - selectedIndex) * itemHeight - offset;
    const normalizedDist = distFromCenter / itemHeight;
    const absNorm = Math.abs(normalizedDist);

    const scale = Math.max(0.75, 1 - absNorm * 0.12);
    const opacity = Math.max(0.2, 1 - absNorm * 0.4);
    const translateY = paddingItems * itemHeight + distFromCenter;

    return {
      transform: `translateY(${translateY}px) scale(${scale})`,
      opacity,
      fontSize: absNorm < 0.5 ? "28px" : "20px",
      fontWeight: absNorm < 0.5 ? 800 : 600,
      position: "absolute" as const,
      left: 0,
      right: 0,
      height: itemHeight,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      userSelect: "none" as const,
      willChange: "transform, opacity",
    };
  };

  const renderRange = visibleItems + 4;

  return (
    <div
      className={`relative overflow-hidden cursor-grab active:cursor-grabbing touch-none ${className}`}
      style={{ height: containerHeight }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
    >
      <div
        className="absolute left-0 right-0 pointer-events-none z-10 rounded-xl bg-muted/30"
        style={{ top: paddingItems * itemHeight, height: itemHeight }}
      />
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-background to-transparent z-20 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />

      <div ref={containerRef} className="relative h-full">
        {items.map((item, i) => {
          const rawDist = Math.abs(i - selectedIndex - offset / itemHeight);
          if (rawDist > renderRange) return null;
          return (
            <div key={`${item}-${i}`} className="text-foreground" style={getItemStyle(i)}>
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface MultiWheelPickerProps {
  columns: {
    items: (string | number)[];
    selectedIndex: number;
    onChange: (index: number) => void;
    width?: string;
  }[];
  itemHeight?: number;
}

export const MultiWheelPicker = ({ columns, itemHeight = 52 }: MultiWheelPickerProps) => (
  <div className="flex items-center justify-center gap-2">
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

import { useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { MoodData } from "@/lib/daylens-constants";
import moodGreatBg from "@/assets/mood-great-bg.png";

interface SentimentScreenProps {
  onSubmit: (mood: MoodData, note: string) => void;
  onClose: () => void;
}

const STEPS = [
  { key: "overallMood", question: "How's your overall mood?", options: ["Bad", "Okay", "Great"] },
  { key: "anxiety", question: "How's your anxiety level?", options: ["High", "Moderate", "Calm"] },
  { key: "energy", question: "How's your mental energy?", options: ["Drained", "Okay", "Energized"] },
] as const;

const getColors = (value: number) => {
  const baseBg = `linear-gradient(135deg, hsl(0,0%,14%) 0%, hsl(0,0%,18%) 50%, hsl(220,3%,16%) 100%)`;
  if (value <= 35) {
    return { bg: baseBg, bgImage: undefined, fg: "rgba(255,255,255,0.5)", fgLight: "rgba(255,255,255,0.3)", dotColor: "rgba(255,255,255,0.45)" };
  } else if (value <= 65) {
    return { bg: baseBg, bgImage: undefined, fg: "rgba(255,255,255,0.75)", fgLight: "rgba(255,255,255,0.5)", dotColor: "rgba(255,255,255,0.55)" };
  } else {
    return { bg: undefined, bgImage: moodGreatBg, fg: "rgba(255,255,255,0.95)", fgLight: "rgba(255,255,255,0.7)", dotColor: "hsla(84,100%,55%,0.8)" };
  }
};

// Dot-matrix face patterns on a 9x9 grid
// 1 = filled dot, 0 = empty
// 11x11 grid for clearer expressions
const FACE_PATTERNS = {
  sad: [
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,0,0,0,1,1,0,0],
    [0,0,1,1,0,0,0,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,0,1,0,0,0,0,0,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
  ],
  neutral: [
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,0,0,0,1,1,0,0],
    [0,0,1,1,0,0,0,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
  ],
  happy: [
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,0,0,0,0,0,1,0,0],
    [0,1,0,1,0,0,0,1,0,1,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,0,0,0,1,1,1,0,0,0,0],
  ],
};

const getFacePattern = (value: number) => {
  if (value <= 25) return FACE_PATTERNS.sad;
  if (value <= 50) return FACE_PATTERNS.neutral;
  return FACE_PATTERNS.happy;
};

const SentimentFace = ({ value, dotColor }: { value: number; dotColor: string }) => {
  const pattern = getFacePattern(value);
  const dotSize = 12;
  const gap = 4;
  const gridSize = 11;
  const totalSize = gridSize * dotSize + (gridSize - 1) * gap;

  return (
    <div className="transition-all duration-500" style={{ width: totalSize, height: totalSize }}>
      <div className="grid transition-all duration-500" style={{
        gridTemplateColumns: `repeat(${gridSize}, ${dotSize}px)`,
        gap: `${gap}px`,
      }}>
        {pattern.flat().map((filled, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-500"
            style={{
              width: dotSize,
              height: dotSize,
              backgroundColor: filled ? 'rgba(180,180,180,0.9)' : 'rgba(180,180,180,0.06)',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const SentimentScreen = ({ onSubmit, onClose }: SentimentScreenProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState([1, 1, 1]); // 0-2 index into options
  const [noteText, setNoteText] = useState("");
  const [showNote, setShowNote] = useState(false);

  const step = STEPS[stepIndex];
  const selectedIdx = values[stepIndex];
  // Map 0-2 to 0-100 for colors
  const value = selectedIdx * 50;
  const colors = getColors(value);
  const label = step.options[selectedIdx].toUpperCase();
  const isLast = stepIndex === STEPS.length - 1;

  const updateValue = (idx: number) => {
    setValues(prev => { const next = [...prev]; next[stepIndex] = idx; return next; });
  };

  const handleNext = () => {
    if (isLast) {
      // Map 0-2 index to 1,3,5 mood scale
      const toMood = (idx: number) => idx * 2 + 1;
      onSubmit({
        overallMood: toMood(values[0]),
        anxiety: 5 - values[1] * 2, // invert
        focus: 3, // default middle value
        energy: toMood(values[2]),
        stressEvents: "",
        gratitude: "",
      }, noteText);
    } else {
      setStepIndex(i => i + 1);
      setShowNote(false);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex(i => i - 1);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div
        className="relative w-full max-w-md h-full max-h-[900px] flex flex-col transition-all duration-500 rounded-none sm:rounded-[40px] overflow-hidden"
        style={{
          background: colors.bg || undefined,
          backgroundImage: colors.bgImage ? `url(${colors.bgImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Top bar */}
        <div className="flex justify-between items-center px-6 pt-12 pb-2">
          <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center" style={{ color: colors.fg }}>
            {stepIndex > 0 ? <ChevronLeft size={24} strokeWidth={2.5} /> : <X size={24} strokeWidth={2.5} />}
          </button>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === stepIndex ? 24 : 8,
                  background: i <= stepIndex ? colors.fg : `${colors.fg}30`,
                }}
              />
            ))}
          </div>
          <div className="w-10" />
        </div>

        {/* Question */}
        <div className="text-center px-8 mt-4">
          <h1 className="text-2xl font-bold transition-colors duration-500" style={{ color: colors.fg }}>
            {step.question}
          </h1>
        </div>

        {/* Face */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-8">
          <SentimentFace value={value} dotColor={colors.dotColor} />
          <h2 className="text-4xl font-black tracking-tight mt-4 transition-colors duration-500" style={{ color: colors.fgLight }}>
            {label}
          </h2>
        </div>

        {/* Slider + Discrete mood options */}
        <div className="px-6 pb-4">
          <div className="mb-4 px-1">
            <Slider
              value={[selectedIdx]}
              onValueChange={([v]) => updateValue(v)}
              min={0}
              max={2}
              step={1}
              className="w-full [&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:border-0"
              style={{
                '--slider-track': `${colors.fg}20`,
                '--slider-range': colors.fg,
                '--slider-thumb': colors.fg,
              } as React.CSSProperties}
            />
          </div>
          <div className="flex gap-2 mb-6">
            {step.options.map((opt, i) => {
              const isSelected = selectedIdx === i;
              return (
                <button
                  key={opt}
                  onClick={() => updateValue(i)}
                  className="flex-1 py-3 rounded-2xl text-[11px] font-bold transition-all active:scale-95"
                  style={{
                    background: isSelected ? colors.fg : `${colors.fg}12`,
                    color: isSelected ? (value > 50 ? '#111' : '#000') : `${colors.fg}80`,
                    border: isSelected ? 'none' : `1px solid ${colors.fg}20`,
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {showNote && (
            <textarea
              rows={2} placeholder="Any thoughts..." value={noteText}
              onChange={e => setNoteText(e.target.value)}
              className="w-full rounded-2xl p-4 text-sm resize-none outline-none mb-4 border-none transition-colors duration-500"
              style={{ background: `${colors.fg}15`, color: colors.fg }}
              autoFocus
            />
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowNote(!showNote)}
              className="flex-1 py-4 rounded-full text-sm font-semibold transition-all active:scale-95"
              style={{ color: colors.fg, border: `1.5px solid ${colors.fg}40` }}
            >
              {showNote ? "Hide note" : "Add note"}
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-4 rounded-full text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ background: colors.fg, color: colors.bg }}
            >
              {isLast ? "Submit" : "Next"} <span>{"→"}</span>
            </button>
          </div>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
};
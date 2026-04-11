import { useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import type { MoodData } from "@/lib/daylens-constants";

interface SentimentScreenProps {
  onSubmit: (mood: MoodData, note: string) => void;
  onClose: () => void;
}

const STEPS = [
  { key: "overallMood", question: "How's your overall mood?", lowLabel: "Bad", midLabel: "Not bad", highLabel: "Good" },
  { key: "anxiety", question: "How's your anxiety level?", lowLabel: "High", midLabel: "Moderate", highLabel: "Calm" },
  { key: "focus", question: "How's your focus & clarity?", lowLabel: "Foggy", midLabel: "Okay", highLabel: "Sharp" },
  { key: "energy", question: "How's your mental energy?", lowLabel: "Drained", midLabel: "Okay", highLabel: "Energized" },
] as const;

const getColors = (value: number) => {
  if (value <= 35) {
    // Bad — dark/black
    return {
      bg: `linear-gradient(135deg, hsl(0,0%,6%) 0%, hsl(0,0%,12%) 50%, hsl(240,4%,10%) 100%)`,
      fg: "rgba(255,255,255,0.5)",
      fgLight: "rgba(255,255,255,0.3)",
      dotColor: "rgba(255,255,255,0.45)",
    };
  } else if (value <= 65) {
    // Neutral — grey
    const t = (value - 35) / 30;
    return {
      bg: `linear-gradient(135deg, hsl(0,0%,${12 + t * 4}%) 0%, hsl(0,0%,${16 + t * 3}%) 50%, hsl(220,3%,${14 + t * 4}%) 100%)`,
      fg: "rgba(255,255,255,0.75)",
      fgLight: "rgba(255,255,255,0.5)",
      dotColor: "rgba(255,255,255,0.55)",
    };
  } else {
    // Good — lime green
    const t = (value - 65) / 35;
    return {
      bg: `linear-gradient(135deg, hsl(84,${30 + t * 40}%,${10 + t * 8}%) 0%, hsl(78,${35 + t * 45}%,${14 + t * 10}%) 50%, hsl(90,${25 + t * 35}%,${8 + t * 6}%) 100%)`,
      fg: `rgba(255,255,255,${0.8 + t * 0.15})`,
      fgLight: `rgba(255,255,255,${0.55 + t * 0.15})`,
      dotColor: `hsla(84,100%,${50 + t * 10}%,${0.6 + t * 0.35})`,
    };
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
    [0,0,1,0,0,0,0,1,0,0,0],
    [0,0,0,1,0,0,1,0,0,0,0],
    [0,0,1,0,0,0,0,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,1,0,0,0,0,0,0,0,1,0],
    [0,1,1,0,0,0,0,0,1,1,0],
    [0,0,1,1,0,0,0,1,1,0,0],
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
  ],
};

const getFacePattern = (value: number) => {
  if (value <= 25) return FACE_PATTERNS.sad;
  if (value <= 65) return FACE_PATTERNS.neutral;
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
  const [values, setValues] = useState([50, 50, 50, 50]);
  const [noteText, setNoteText] = useState("");
  const [showNote, setShowNote] = useState(false);

  const step = STEPS[stepIndex];
  const value = values[stepIndex];
  const colors = getColors(value);
  const label = value <= 25 ? step.lowLabel.toUpperCase() : value <= 65 ? step.midLabel.toUpperCase() : step.highLabel.toUpperCase();
  const isLast = stepIndex === STEPS.length - 1;

  const updateValue = (v: number) => {
    setValues(prev => { const next = [...prev]; next[stepIndex] = v; return next; });
  };

  const handleNext = () => {
    if (isLast) {
      const toMood = (v: number) => Math.round(1 + (v / 100) * 4);
      onSubmit({
        overallMood: toMood(values[0]),
        anxiety: 5 - toMood(values[1]) + 1,
        focus: toMood(values[2]),
        energy: toMood(values[3]),
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
        className="relative w-full max-w-md h-full max-h-[900px] flex flex-col transition-colors duration-500 rounded-none sm:rounded-[40px] overflow-hidden"
        style={{ background: colors.bg }}
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
          <h2 className="text-5xl font-black tracking-tight mt-4 transition-colors duration-500" style={{ color: colors.fgLight }}>
            {label}
          </h2>
        </div>

        {/* Slider section */}
        <div className="px-8 pb-4">
          <div className="relative mb-3">
            <input
              type="range" min="0" max="100" value={value}
              onChange={e => updateValue(Number(e.target.value))}
              className="w-full h-1 rounded-full appearance-none outline-none cursor-pointer"
              style={{ background: `${colors.fg}40`, accentColor: colors.fg }}
            />
          </div>

          <div className="flex justify-between text-xs font-semibold mb-6 transition-colors duration-500" style={{ color: colors.fg }}>
            <span style={{ opacity: value <= 25 ? 1 : 0.4 }}>{step.lowLabel}</span>
            <span style={{ opacity: value > 25 && value <= 65 ? 1 : 0.4 }}>{step.midLabel}</span>
            <span style={{ opacity: value > 65 ? 1 : 0.4 }}>{step.highLabel}</span>
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
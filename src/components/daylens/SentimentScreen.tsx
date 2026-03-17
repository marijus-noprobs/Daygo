import { useState } from "react";
import { X, Info } from "lucide-react";

interface SentimentScreenProps {
  onSubmit: (sentiment: number, note: string) => void;
  onClose: () => void;
}

const SENTIMENTS = [
  { label: "BAD", value: 0 },
  { label: "NOT BAD", value: 50 },
  { label: "GOOD", value: 100 },
];

// Interpolate between HSL colors based on value 0-100
const getColors = (value: number) => {
  // Bad (salmon): hsl(15, 85%, 75%)
  // Not bad (golden): hsl(45, 75%, 65%)
  // Good (lime): hsl(78, 80%, 65%)
  let h: number, s: number, l: number;
  let fgH: number, fgS: number, fgL: number;

  if (value <= 50) {
    const t = value / 50;
    h = 15 + t * (45 - 15);
    s = 85 + t * (75 - 85);
    l = 75 + t * (65 - 75);
    fgH = 15 + t * (35 - 15);
    fgS = 60 + t * (50 - 60);
    fgL = 30 + t * (25 - 30);
  } else {
    const t = (value - 50) / 50;
    h = 45 + t * (78 - 45);
    s = 75 + t * (80 - 75);
    l = 65 + t * (65 - 65);
    fgH = 35 + t * (78 - 35);
    fgS = 50 + t * (60 - 50);
    fgL = 25 + t * (20 - 25);
  }

  return {
    bg: `hsl(${h}, ${s}%, ${l}%)`,
    fg: `hsl(${fgH}, ${fgS}%, ${fgL}%)`,
    fgLight: `hsl(${fgH}, ${fgS}%, ${fgL + 15}%)`,
  };
};

const getLabel = (value: number) => {
  if (value <= 25) return "BAD";
  if (value <= 65) return "NOT BAD";
  return "GOOD";
};

// Face SVG that morphs based on sentiment
const SentimentFace = ({ value, fg }: { value: number; fg: string }) => {
  // Eye shape: sad = round, neutral = squished/sleepy, good = big round
  // Mouth: sad = frown, neutral = slight frown, good = neutral/slight smile

  const eyeRx = value <= 25 ? 28 : value <= 65 ? 35 : 30;
  const eyeRy = value <= 25 ? 28 : value <= 65 ? 18 : 30;
  const eyeY = value <= 25 ? 110 : value <= 65 ? 115 : 105;
  const eyeSpacing = value <= 25 ? 45 : value <= 65 ? 42 : 48;

  // Mouth curve
  const mouthY = 170;
  const mouthWidth = 30;
  const mouthCurve = value <= 25 ? -15 : value <= 65 ? -5 : 12;

  return (
    <svg width="200" height="220" viewBox="0 0 260 220" className="transition-all duration-500">
      {/* Left eye */}
      <ellipse
        cx={130 - eyeSpacing}
        cy={eyeY}
        rx={eyeRx}
        ry={eyeRy}
        fill={fg}
        className="transition-all duration-500"
      />
      {/* Right eye */}
      <ellipse
        cx={130 + eyeSpacing}
        cy={eyeY}
        rx={eyeRx}
        ry={eyeRy}
        fill={fg}
        className="transition-all duration-500"
      />
      {/* Mouth */}
      <path
        d={`M ${130 - mouthWidth} ${mouthY} Q 130 ${mouthY + mouthCurve * 2} ${130 + mouthWidth} ${mouthY}`}
        fill="none"
        stroke={fg}
        strokeWidth="5"
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
};

export const SentimentScreen = ({ onSubmit, onClose }: SentimentScreenProps) => {
  const [value, setValue] = useState(50);
  const [noteText, setNoteText] = useState("");
  const [showNote, setShowNote] = useState(false);

  const colors = getColors(value);
  const label = getLabel(value);

  const handleSubmit = () => {
    // Map 0-100 to mood 1-5
    const moodValue = Math.round(1 + (value / 100) * 4);
    onSubmit(moodValue, noteText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div
        className="relative w-full max-w-md h-full max-h-[900px] flex flex-col transition-colors duration-500 rounded-none sm:rounded-[40px] overflow-hidden"
        style={{ background: colors.bg }}
      >
      {/* Top bar */}
      <div className="flex justify-between items-center px-6 pt-12 pb-4">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full transition-colors" style={{ color: colors.fg }}>
          <X size={24} strokeWidth={2.5} />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full transition-colors" style={{ color: colors.fg }}>
          <Info size={22} strokeWidth={2} />
        </button>
      </div>

      {/* Question */}
      <div className="text-center px-8 mt-4">
        <h1 className="text-2xl font-bold transition-colors duration-500" style={{ color: colors.fg }}>
          How are you feeling today?
        </h1>
      </div>

      {/* Face */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-8">
        <SentimentFace value={value} fg={colors.fg} />

        {/* Label */}
        <h2
          className="text-5xl font-black tracking-tight mt-4 transition-colors duration-500"
          style={{ color: colors.fgLight }}
        >
          {label}
        </h2>
      </div>

      {/* Slider section */}
      <div className="px-8 pb-4">
        {/* Slider */}
        <div className="relative mb-3">
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={e => setValue(Number(e.target.value))}
            className="w-full h-1 rounded-full appearance-none outline-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${colors.fg}40, ${colors.fg}40)`,
              accentColor: colors.fg,
            }}
          />
          {/* Custom thumb styling is in index.css */}
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs font-semibold mb-6 transition-colors duration-500" style={{ color: colors.fg }}>
          <span style={{ opacity: value <= 25 ? 1 : 0.4 }}>Bad</span>
          <span style={{ opacity: value > 25 && value <= 65 ? 1 : 0.4 }}>Not bad</span>
          <span style={{ opacity: value > 65 ? 1 : 0.4 }}>Good</span>
        </div>

        {/* Note input */}
        {showNote && (
          <textarea
            rows={2}
            placeholder="How are you feeling..."
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            className="w-full rounded-2xl p-4 text-sm resize-none outline-none mb-4 border-none transition-colors duration-500"
            style={{
              background: `${colors.fg}15`,
              color: colors.fg,
            }}
            autoFocus
          />
        )}

        {/* Bottom buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowNote(!showNote)}
            className="flex-1 py-4 rounded-full text-sm font-semibold transition-all active:scale-95"
            style={{
              color: colors.fg,
              border: `1.5px solid ${colors.fg}40`,
            }}
          >
            {showNote ? "Hide note" : "Add note"}
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-4 rounded-full text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{
              background: colors.fg,
              color: colors.bg,
            }}
          >
            Submit <span>→</span>
          </button>
        </div>
      </div>

      {/* Bottom safe area */}
      <div className="h-8" />
    </div>
  );
};

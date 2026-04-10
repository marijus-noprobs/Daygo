import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Send, Sparkles, ChevronDown } from "lucide-react";
import { type DayEntry, type UserProfile } from "@/lib/daylens-constants";
import { avg, computeDayScore, getReadinessLevel, generateDailyPlan, generateHealthSuggestions } from "@/lib/daylens-utils";

interface Message {
  id: string;
  role: "coach" | "user";
  content: string;
  timestamp: Date;
}

const COACH_RESPONSES: Record<string, (ctx: CoachContext) => string> = {
  "plan": (ctx) => {
    const recs = ctx.dailyPlan;
    let msg = `Based on your wellness score of **${ctx.score.toFixed(1)}/10** and ${ctx.readiness.label.toLowerCase()} readiness, here's your personalized plan:\n\n`;
    recs.forEach((r, i) => {
      msg += `**${i + 1}. ${r.label}** — ${r.action}\n_${r.reason}_\n\n`;
    });
    if (ctx.readiness.level === "recovering") {
      msg += "💡 Since you're in recovery mode, prioritize rest over intensity today. Your body will thank you tomorrow.";
    } else if (ctx.readiness.level === "peak") {
      msg += "🔥 You're at peak readiness — this is a great day to push your limits and tackle challenging goals.";
    }
    return msg;
  },
  "sleep": (ctx) => {
    const sleepHrs = ctx.latestEntry?.wearable?.sleep?.totalHours || 0;
    const sleepScore = ctx.latestEntry?.wearable?.sleep?.score || 0;
    const avgSleep = avg(ctx.recent.map(e => e.wearable?.sleep?.totalHours || 7));
    let msg = `**Sleep Analysis:**\n\nLast night: **${sleepHrs.toFixed(1)} hours** (score: ${sleepScore}/100)\n7-day average: **${avgSleep.toFixed(1)} hours**\n\n`;
    if (sleepHrs < 7) {
      msg += "Your sleep was below the recommended 7-9 hours. This can impact your HRV, mood, and recovery capacity.\n\n**Recommendation:** Try going to bed 30 minutes earlier tonight. Avoid screens 1 hour before bed and keep your room cool (65-68°F).";
    } else if (sleepHrs >= 7.5) {
      msg += "Great sleep duration! You're giving your body adequate recovery time.\n\n**To optimize further:** Track your deep sleep percentage — aim for 15-20% of total sleep time for optimal physical recovery.";
    } else {
      msg += "Decent sleep, but there's room to improve.\n\n**Tip:** Consistency matters more than duration. Try to maintain the same bedtime ±30 minutes every day, even on weekends.";
    }
    return msg;
  },
  "activity": (ctx) => {
    const steps = ctx.latestEntry?.wearable?.activity?.steps || 0;
    const avgSteps = avg(ctx.recent.map(e => e.wearable?.activity?.steps || 5000));
    const workouts = ctx.recent.filter(e => e.wearable?.activity?.workouts?.length > 0).length;
    let msg = `**Activity Analysis:**\n\nToday's steps: **${steps.toLocaleString()}**\n7-day avg: **${Math.round(avgSteps).toLocaleString()} steps**\nWorkout days this week: **${workouts}/7**\n\n`;
    if (ctx.readiness.level === "recovering") {
      msg += "Given your current recovery state, I recommend **active recovery** today — light walking, stretching, or yoga. Intense exercise while recovering can delay your body's repair process.";
    } else if (avgSteps > 10000) {
      msg += "Your activity level is excellent! You're consistently active.\n\n**Next level tip:** Consider adding variety — if you mostly walk, try a strength session. If you lift weights, add a mobility day.";
    } else {
      msg += `**Recommendation:** Try to hit ${Math.max(8000, Math.round(avgSteps * 1.1)).toLocaleString()} steps today. Small increases (10% per week) build sustainable habits without burnout.`;
    }
    return msg;
  },
  "mood": (ctx) => {
    const mood = ctx.latestEntry?.mood?.overallMood || 3;
    const avgMood = avg(ctx.recent.map(e => e.mood?.overallMood || 3));
    const energy = ctx.latestEntry?.mood?.energy || 3;
    const anxiety = ctx.latestEntry?.mood?.anxiety || 2;
    let msg = `**Mood & Mental State:**\n\nCurrent mood: **${mood}/5**\n7-day avg: **${avgMood.toFixed(1)}/5**\nEnergy: **${energy}/5** | Anxiety: **${anxiety}/5**\n\n`;
    if (mood <= 2) {
      msg += "I notice your mood is low today. This is normal and temporary.\n\n**Evidence-based actions:**\n- 20-minute walk outdoors (proven to boost mood)\n- Connect with someone you trust\n- 5-minute gratitude journaling\n\nYour data shows mood tends to improve after exercise days — consider a light workout.";
    } else if (anxiety >= 4) {
      msg += "Your anxiety levels are elevated. Let's address this.\n\n**Immediate relief:** Try box breathing — inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 4 cycles.\n\n**Longer-term:** Your data suggests lower anxiety on days with exercise and social interaction.";
    } else {
      msg += "Your mental state looks stable. Keep maintaining your routines — consistency in sleep and exercise are the strongest predictors of sustained mood quality.";
    }
    return msg;
  },
  "recovery": (ctx) => {
    const hrv = ctx.latestEntry?.wearable?.body?.hrv || 50;
    const bodyBattery = ctx.latestEntry?.wearable?.body?.bodyBattery || 50;
    const stress = ctx.latestEntry?.wearable?.body?.stressLevel || 30;
    let msg = `**Recovery Status:**\n\nHRV: **${hrv} ms**\nBody Battery: **${bodyBattery}%**\nStress Level: **${stress}%**\n\n`;
    if (hrv < 40 || bodyBattery < 30) {
      msg += "⚠️ Your recovery metrics indicate significant strain.\n\n**Priority actions:**\n1. Skip intense exercise today\n2. Hydrate aggressively (3L+ water)\n3. Aim for 8+ hours sleep tonight\n4. Try a 10-minute meditation\n\nYour body needs restoration before your next push day.";
    } else if (bodyBattery > 70 && hrv > 55) {
      msg += "✅ Your recovery is strong! Your body is well-rested and ready for performance.\n\nThis is an ideal day for a challenging workout or important tasks requiring focus and endurance.";
    } else {
      msg += "Your recovery is moderate. You can train today but listen to your body — moderate intensity is recommended.\n\n**Tip:** Monitor how you feel 2 hours post-workout. If fatigue persists, scale back tomorrow.";
    }
    return msg;
  },
  "default": (ctx) => {
    const suggestions = ctx.suggestions;
    if (suggestions.length > 0) {
      const top = suggestions[0];
      return `Great question! Looking at your data, the most important thing right now is: **${top.title}**\n\n${top.description}\n\nWould you like me to dive deeper into any specific area? I can analyze your **sleep**, **activity**, **mood**, or **recovery** in detail.`;
    }
    return `Your overall wellness score is **${ctx.score.toFixed(1)}/10** with ${ctx.readiness.label.toLowerCase()} readiness.\n\nI can help you understand:\n- Your **daily plan** and recommendations\n- **Sleep** quality and optimization\n- **Activity** levels and trends\n- **Mood** patterns and mental wellness\n- **Recovery** status and body readiness\n\nWhat would you like to explore?`;
  },
};

interface CoachContext {
  score: number;
  readiness: { level: string; label: string };
  dailyPlan: any[];
  suggestions: any[];
  recent: DayEntry[];
  latestEntry: DayEntry | null;
  streak: number;
  profile: UserProfile;
}

function getCoachResponse(input: string, ctx: CoachContext): string {
  const lower = input.toLowerCase();
  if (lower.includes("plan") || lower.includes("today") || lower.includes("recommend")) return COACH_RESPONSES.plan(ctx);
  if (lower.includes("sleep") || lower.includes("bed") || lower.includes("rest")) return COACH_RESPONSES.sleep(ctx);
  if (lower.includes("activity") || lower.includes("exercise") || lower.includes("step") || lower.includes("workout")) return COACH_RESPONSES.activity(ctx);
  if (lower.includes("mood") || lower.includes("mental") || lower.includes("anxi") || lower.includes("stress") || lower.includes("feeling")) return COACH_RESPONSES.mood(ctx);
  if (lower.includes("recover") || lower.includes("hrv") || lower.includes("battery") || lower.includes("readiness")) return COACH_RESPONSES.recovery(ctx);
  return COACH_RESPONSES.default(ctx);
}

function generateOpeningMessage(ctx: CoachContext): string {
  const { score, readiness } = ctx;
  const sleepHrs = ctx.latestEntry?.wearable?.sleep?.totalHours || 7;
  const hrv = ctx.latestEntry?.wearable?.body?.hrv || 50;

  if (readiness.level === "recovering") {
    return `Based on your recovery score (${score.toFixed(1)}/10) and low HRV (${hrv}ms), today is better suited for lighter activity. Your sleep was ${sleepHrs.toFixed(1)} hours — would you like a detailed recovery plan?`;
  }
  if (readiness.level === "peak") {
    return `You're at **peak readiness** today — score ${score.toFixed(1)}/10 with strong HRV (${hrv}ms) and ${sleepHrs.toFixed(1)} hrs sleep. This is a great day to push your limits. Want me to suggest an optimized plan?`;
  }
  return `Good to see you! Your wellness score is **${score.toFixed(1)}/10** (${readiness.label}). Sleep was ${sleepHrs.toFixed(1)} hrs with HRV at ${hrv}ms. Would you like a breakdown of today's recommendations?`;
}

// Simple markdown-ish renderer
function renderContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Bold
    let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-bold">$1</strong>');
    // Italic
    processed = processed.replace(/_(.+?)_/g, '<em class="text-foreground/50 italic">$1</em>');

    if (line.startsWith("- ") || line.startsWith("• ")) {
      return <div key={i} className="flex gap-2 ml-1 mt-0.5"><span className="text-primary mt-0.5">•</span><span className="flex-1" dangerouslySetInnerHTML={{ __html: processed.slice(2) }} /></div>;
    }
    if (/^\d+\./.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1];
      return <div key={i} className="flex gap-2 ml-1 mt-0.5"><span className="text-primary font-bold">{num}.</span><span className="flex-1" dangerouslySetInnerHTML={{ __html: processed.replace(/^\d+\.\s*/, '') }} /></div>;
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return <div key={i} className="mt-0.5" dangerouslySetInnerHTML={{ __html: processed }} />;
  });
}

const QUICK_PROMPTS = [
  { label: "Today's Plan", query: "What should I do today?" },
  { label: "Sleep", query: "How was my sleep?" },
  { label: "Recovery", query: "What's my recovery status?" },
  { label: "Mood", query: "Analyze my mood" },
];

interface AICoachSheetProps {
  open: boolean;
  onClose: () => void;
  entries: DayEntry[];
  recent: DayEntry[];
  profile: UserProfile;
  score: number;
  streak: number;
  preloadedQuestion?: string | null;
}

export const AICoachSheet = ({ open, onClose, entries, recent, profile, score, streak, preloadedQuestion }: AICoachSheetProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ctx = useMemo<CoachContext>(() => ({
    score,
    readiness: getReadinessLevel(score),
    dailyPlan: generateDailyPlan(entries, profile),
    suggestions: generateHealthSuggestions(entries, profile),
    recent,
    latestEntry: recent[0] || null,
    streak,
    profile,
  }), [entries, recent, profile, score, streak]);

  // Reset and generate opening message when sheet opens
  useEffect(() => {
    if (open) {
      const opening: Message = {
        id: "opening",
        role: "coach",
        content: generateOpeningMessage(ctx),
        timestamp: new Date(),
      };
      setMessages([opening]);
      setInput("");

      // If preloaded question, auto-send it
      if (preloadedQuestion) {
        setTimeout(() => {
          const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: preloadedQuestion,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, userMsg]);
          setIsTyping(true);
          setTimeout(() => {
            const response = getCoachResponse(preloadedQuestion, ctx);
            setMessages(prev => [...prev, {
              id: `coach-${Date.now()}`,
              role: "coach",
              content: response,
              timestamp: new Date(),
            }]);
            setIsTyping(false);
          }, 800);
        }, 600);
      }
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getCoachResponse(text, ctx);
      setMessages(prev => [...prev, {
        id: `coach-${Date.now()}`,
        role: "coach",
        content: response,
        timestamp: new Date(),
      }]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center fade-in" onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <div
        className="w-full max-w-md flex flex-col scale-in"
        style={{
          maxHeight: "65vh",
          background: "#111112",
          borderRadius: "26px 26px 0 0",
          border: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "none",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex-shrink-0 pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3">
          <div>
            <div className="font-display text-[15px] font-extrabold text-foreground" style={{ letterSpacing: "-0.02em" }}>AI Coach</div>
            <div className="text-[10px] text-muted-foreground">Personalized guidance</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.05] transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="w-full h-px" style={{ background: "rgba(255,255,255,0.04)" }} />

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-[18px] px-4 py-3 text-[12px] leading-relaxed ${
                  msg.role === "user"
                    ? "text-primary-foreground"
                    : "text-foreground/80"
                }`}
                style={msg.role === "user"
                  ? { background: "hsl(var(--primary))" }
                  : { background: "rgba(255,255,255,0.04)" }
                }
              >
                {msg.role === "coach" ? renderContent(msg.content) : msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-[18px] px-4 py-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground shimmer" />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground shimmer" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground shimmer" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}

          {/* Quick prompts after opening */}
          {messages.length === 1 && !isTyping && !preloadedQuestion && (
            <div className="flex flex-wrap gap-2 mt-2">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.query)}
                  className="px-3.5 py-2 rounded-full text-[11px] font-semibold text-foreground/70 hover:text-foreground transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2">
          <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask your coach..."
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: input.trim() ? "hsl(var(--primary))" : "rgba(255,255,255,0.06)" }}
            >
              <Send className="w-3.5 h-3.5" style={{ color: input.trim() ? "hsl(var(--primary-foreground))" : "rgba(255,255,255,0.3)" }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

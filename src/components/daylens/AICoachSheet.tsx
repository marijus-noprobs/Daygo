import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { type DayEntry, type UserProfile } from "@/lib/daylens-constants";
import { avg, computeDayScore, getReadinessLevel, generateDailyPlan, generateHealthSuggestions } from "@/lib/daylens-utils";
import { streamChat, type ChatMessage } from "@/lib/ai-chat";

interface Message {
  id: string;
  role: "coach" | "user";
  content: string;
  timestamp: Date;
}

// Build system prompt with user context for the AI backend
function buildSystemPrompt(ctx: CoachContext): string {
  const latest = ctx.latestEntry;
  const sleepHrs = latest?.wearable?.sleep?.totalHours || 0;
  const sleepScore = latest?.wearable?.sleep?.score || 0;
  const hrv = latest?.wearable?.body?.hrv || 0;
  const bodyBattery = latest?.wearable?.body?.bodyBattery || 0;
  const stress = latest?.wearable?.body?.stressLevel || 0;
  const steps = latest?.wearable?.activity?.steps || 0;
  const mood = latest?.mood?.overallMood || 0;
  const energy = latest?.mood?.energy || 0;
  const anxiety = latest?.mood?.anxiety || 0;

  return `You are DayLens AI Coach — a concise, empathetic wellness coach inside a health tracking app.

USER PROFILE:
- Name: ${ctx.profile.name || "User"}
- Height: ${ctx.profile.height || "unknown"}
- Weight: ${ctx.profile.weight || "unknown"}
- Goal: ${ctx.profile.goal || "general wellness"}

TODAY'S DATA:
- Wellness Score: ${ctx.score.toFixed(1)}/10
- Readiness: ${ctx.readiness.label} (${ctx.readiness.level})
- Sleep: ${sleepHrs.toFixed(1)} hrs (score: ${sleepScore}/100)
- HRV: ${hrv} ms | Body Battery: ${bodyBattery}% | Stress: ${stress}%
- Steps: ${steps.toLocaleString()}
- Mood: ${mood}/5 | Energy: ${energy}/5 | Anxiety: ${anxiety}/5
- Check-in Streak: ${ctx.streak} days

GUIDELINES:
- Keep responses concise but warm (2-4 short paragraphs max)
- Use markdown formatting (bold for key metrics, bullet points for recommendations)
- Reference the user's actual data when giving advice
- If readiness is "recovering", prioritize rest recommendations
- If readiness is "peak", encourage pushing limits
- Be actionable — give specific, numbered recommendations when appropriate`;
}

// Fallback local responses when API is unavailable
function getLocalResponse(input: string, ctx: CoachContext): string {
  const lower = input.toLowerCase();
  if (lower.includes("plan") || lower.includes("today") || lower.includes("recommend")) {
    const recs = ctx.dailyPlan;
    let msg = `Based on your wellness score of **${ctx.score.toFixed(1)}/10** and ${ctx.readiness.label.toLowerCase()} readiness, here's your plan:\n\n`;
    recs.forEach((r, i) => { msg += `**${i + 1}. ${r.label}** — ${r.action}\n\n`; });
    return msg;
  }
  if (lower.includes("sleep")) {
    const hrs = ctx.latestEntry?.wearable?.sleep?.totalHours || 0;
    return `**Sleep Analysis:**\n\nLast night: **${hrs.toFixed(1)} hours**\n\n${hrs < 7 ? "Your sleep was below the recommended 7-9 hours. Try going to bed 30 minutes earlier tonight." : "Good sleep duration! Keep it up."}`;
  }
  if (lower.includes("mood") || lower.includes("feeling")) {
    const mood = ctx.latestEntry?.mood?.overallMood || 3;
    return `**Mood:** ${mood}/5\n\n${mood <= 2 ? "Your mood is low today. A 20-minute walk outdoors can help boost it." : "Your mental state looks stable. Keep up your routines!"}`;
  }
  return `Your wellness score is **${ctx.score.toFixed(1)}/10** (${ctx.readiness.label}). I can help with your **daily plan**, **sleep**, **activity**, **mood**, or **recovery**. What would you like to explore?`;
}

function generateOpeningMessage(ctx: CoachContext): string {
  const sleepHrs = ctx.latestEntry?.wearable?.sleep?.totalHours || 7;
  const hrv = ctx.latestEntry?.wearable?.body?.hrv || 50;

  if (ctx.readiness.level === "recovering") {
    return `Based on your recovery score (${ctx.score.toFixed(1)}/10) and low HRV (${hrv}ms), today is better suited for lighter activity. Your sleep was ${sleepHrs.toFixed(1)} hours — would you like a detailed recovery plan?`;
  }
  if (ctx.readiness.level === "peak") {
    return `You're at **peak readiness** today — score ${ctx.score.toFixed(1)}/10 with strong HRV (${hrv}ms) and ${sleepHrs.toFixed(1)} hrs sleep. This is a great day to push your limits. Want me to suggest an optimized plan?`;
  }
  return `Good to see you! Your wellness score is **${ctx.score.toFixed(1)}/10** (${ctx.readiness.label}). Sleep was ${sleepHrs.toFixed(1)} hrs with HRV at ${hrv}ms. Would you like a breakdown of today's recommendations?`;
}

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
  const abortRef = useRef<AbortController | null>(null);

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

  const systemPrompt = useMemo(() => buildSystemPrompt(ctx), [ctx]);

  // Convert messages to chat format for API
  const toChatMessages = useCallback((msgs: Message[]): ChatMessage[] => {
    return [
      { role: "system", content: systemPrompt },
      ...msgs.map(m => ({
        role: (m.role === "coach" ? "assistant" : "user") as "assistant" | "user",
        content: m.content,
      })),
    ];
  }, [systemPrompt]);

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

      if (preloadedQuestion) {
        setTimeout(() => sendMessage(preloadedQuestion, [opening]), 600);
      }
    } else {
      abortRef.current?.abort();
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = useCallback((text: string, existingMessages?: Message[]) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    const currentMessages = existingMessages || messages;
    const updatedMessages = [...currentMessages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    // Abort any ongoing stream
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const coachMsgId = `coach-${Date.now()}`;
    let accumulated = "";

    // Try streaming API first
    streamChat({
      messages: toChatMessages(updatedMessages),
      signal: controller.signal,
      onDelta: (chunk) => {
        accumulated += chunk;
        const content = accumulated;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.id === coachMsgId) {
            return prev.map(m => m.id === coachMsgId ? { ...m, content } : m);
          }
          return [...prev, { id: coachMsgId, role: "coach", content, timestamp: new Date() }];
        });
      },
      onDone: () => setIsTyping(false),
      onError: () => {
        // Fallback to local responses
        const fallback = getLocalResponse(text, ctx);
        setMessages(prev => {
          const hasCoach = prev.some(m => m.id === coachMsgId);
          if (hasCoach) {
            return prev.map(m => m.id === coachMsgId ? { ...m, content: fallback } : m);
          }
          return [...prev, { id: coachMsgId, role: "coach", content: fallback, timestamp: new Date() }];
        });
        setIsTyping(false);
      },
    });
  }, [messages, ctx, toChatMessages]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in" onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <div
        className="w-full max-w-md flex flex-col scale-in"
        style={{
          maxHeight: "65vh",
          background: "#111112",
          borderRadius: "26px",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="flex-shrink-0 flex justify-end px-4 pt-4 pb-1">
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/[0.05] transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

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
                {msg.role === "coach" ? (
                  <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-foreground [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-xs">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
            </div>
          ))}

          {isTyping && messages[messages.length - 1]?.role !== "coach" && (
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
    </div>,
    document.body
  );
};

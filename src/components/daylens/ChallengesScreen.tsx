import { useMemo, useState } from "react";
import { Trophy, Users, Clock, ChevronRight } from "lucide-react";
import { generateMockChallenges, type Challenge } from "@/lib/whoop-utils";
import type { DayEntry } from "@/lib/daylens-constants";

interface Props {
  entries: DayEntry[];
}

const metricIcon: Record<string, string> = {
  strain: "🔥", recovery: "💚", sleep: "🌙", steps: "👟",
};

export const ChallengesScreen = ({ entries }: Props) => {
  const challenges = useMemo(() => generateMockChallenges(entries), [entries]);
  const [expanded, setExpanded] = useState<string | null>(challenges[0]?.id || null);

  const active = challenges.filter(c => c.status === "active");
  const upcoming = challenges.filter(c => c.status === "upcoming");

  return (
    <div className="space-y-4 pb-28 fade-up">
      {/* Header */}
      <div className="fade-up d1 px-1">
        <div className="font-display text-[18px] font-extrabold text-foreground tracking-tight">Challenges</div>
        <p className="text-[11px] text-muted-foreground mt-0.5">Compete with friends. Stay accountable.</p>
      </div>

      {/* Active challenges */}
      {active.map((ch, idx) => (
        <ChallengeCard
          key={ch.id}
          challenge={ch}
          expanded={expanded === ch.id}
          onToggle={() => setExpanded(expanded === ch.id ? null : ch.id)}
          delay={idx + 1}
        />
      ))}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold px-1 mt-2 fade-up d3">Upcoming</div>
          {upcoming.map(ch => (
            <div key={ch.id} className="card-dark rounded-[18px] p-4 fade-up d3">
              <div className="flex items-center gap-3">
                <span className="text-[20px]">{metricIcon[ch.metric]}</span>
                <div className="flex-1">
                  <div className="text-[13px] font-bold text-foreground">{ch.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{ch.description}</div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Starts {ch.startDate}
                </div>
              </div>
              <button className="w-full mt-3 py-2.5 rounded-xl text-[12px] font-bold text-primary border border-primary/20 hover:bg-primary/5 transition-colors">
                Join Challenge
              </button>
            </div>
          ))}
        </>
      )}

      {/* Create your own */}
      <div className="card-dark rounded-[18px] p-4 fade-up d4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold text-foreground">Create a Challenge</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Invite friends and set your own goals</div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

const ChallengeCard = ({ challenge: ch, expanded, onToggle, delay }: {
  challenge: Challenge; expanded: boolean; onToggle: () => void; delay: number;
}) => {
  const userIdx = ch.participants.findIndex(p => p.name === "You");
  return (
    <div className={`card-dark rounded-[22px] overflow-hidden fade-up d${delay}`}>
      <button onClick={onToggle} className="w-full p-4 flex items-center gap-3 text-left">
        <span className="text-[22px]">{metricIcon[ch.metric]}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-foreground">{ch.name}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{ch.goal}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[16px] font-bold text-foreground">#{ userIdx + 1}</div>
          <div className="text-[9px] text-muted-foreground">of {ch.participants.length}</div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-1.5 fade-up">
          {ch.participants.map((p, i) => {
            const isUser = p.name === "You";
            return (
              <div key={p.name} className={`flex items-center gap-3 py-2 px-3 rounded-xl ${isUser ? 'bg-primary/[0.08]' : ''}`}>
                <div className="w-5 text-[11px] font-mono font-bold text-muted-foreground">{i + 1}</div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{
                  background: isUser ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.08)',
                  color: isUser ? 'hsl(var(--primary-foreground))' : 'rgba(255,255,255,0.6)',
                }}>
                  {p.avatar}
                </div>
                <div className="flex-1 text-[12px] font-bold text-foreground">{p.name}</div>
                <div className="font-mono text-[13px] font-bold" style={{
                  color: i === 0 ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.5)',
                }}>
                  {typeof p.score === 'number' ? p.score.toFixed(1) : p.score}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

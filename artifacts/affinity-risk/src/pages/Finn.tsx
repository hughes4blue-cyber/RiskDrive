import { useState, useRef, useEffect } from "react";
import { Bot, Send, ChevronRight, Shield, HardHat, BarChart3, FileText, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/Layout";
import { Link } from "wouter";

interface Message {
  role: "finn" | "user";
  text: string;
  timestamp: Date;
}

const FINN_RESPONSES: { keywords: string[]; reply: string; followUps?: string[] }[] = [
  {
    keywords: ["workers comp", "wc quote", "work comp", "workers compensation", "wc"],
    reply: "Workers Comp for tow operators is rated on actual payroll by class code — not on units or guesses. Your Affinity RiskDrive™ data (hours driven, incident rates, coaching completion) gives underwriters a much more accurate risk picture than traditional audits.\n\nOperators with clean telematics data typically see 8–22% savings vs. standard market rates. I can help pre-fill your WC quote application using data already in the platform.",
    followUps: ["Start WC Quote", "What class codes apply?", "How is mod factor calculated?"],
  },
  {
    keywords: ["riskdrive", "risk drive", "fleet score", "my score", "score"],
    reply: "Your RiskDrive™ Score is a composite built from four weighted factors:\n\n• Safety Events — 40% (telematics alerts: hard braking, speeding, phone use, fatigue)\n• Compliance — 30% (COI currency, driver license status, vehicle inspection)\n• Telematics Behavior — 20% (consistency and trend over 90 days)\n• Training Completion — 10% (assigned module completion rate)\n\nA score above 70 unlocks preferred carrier markets and lower premium tiers. Scores above 80 qualify for our best-available rates across all markets.",
    followUps: ["How do I improve my score?", "Which carriers can I access?", "What affects Safety Events most?"],
  },
  {
    keywords: ["1099", "contractor", "corporate veil", "independent contractor", "w2", "employee"],
    reply: "This is one of the most important compliance questions for AAA clubs. Affinity RiskDrive™ is built to protect the contractor relationship:\n\n✓ Each operator receives their own individual scorecard\n✓ Telematics data is used for insurance rating purposes only\n✓ We never use data to assign jobs, control schedules, or set hours\n✓ AAA clubs can monitor safety outcomes — not work behavior\n\nThis distinction is critical. Directing when, where, or how a 1099 contractor works can trigger reclassification. Monitoring safety results does not.",
    followUps: ["What monitoring is safe?", "How are individual scorecards structured?", "Can I share scores with operators?"],
  },
  {
    keywords: ["carrier", "market", "admitted", "specialty", "insurer"],
    reply: "Affinity Risk works with multiple admitted and specialty carriers for:\n\n• Commercial Auto Liability (primary placement)\n• General Liability\n• Workers Compensation\n• Excess / Umbrella\n\nYour RiskDrive™ Score determines which markets we can access. Higher scores = more carriers competing = better rates. The platform tracks carrier eligibility thresholds in real time so you always know where you stand.",
    followUps: ["How many markets can I access?", "What's the minimum score for preferred rates?", "What's my current placement?"],
  },
  {
    keywords: ["claim", "accident", "incident", "exonerat", "dashcam", "evidence"],
    reply: "When an incident occurs, Affinity RiskDrive™ immediately:\n\n1. Secures telematics data (speed, GPS, g-force at time of event)\n2. Flags available dashcam clips for preservation\n3. Creates a structured evidence packet for your TPA\n4. Logs the FNOL with pre-populated data\n\nThis evidence package is the difference between a $74K claim and a $0 exoneration. Our network exoneration rate is 25% — significantly above industry average — because we act within minutes, not days.",
    followUps: ["Walk me through the claims pipeline", "What's the exoneration process?", "How do I access my evidence?"],
  },
  {
    keywords: ["onboard", "new operator", "checklist", "application"],
    reply: "Onboarding a new tow operator through Affinity Risk involves 10 verified steps:\n\n1. Certificate of Insurance submitted & verified\n2. Master Service Agreement signed\n3. Tax status verified (IRS EIN confirmation)\n4. Articles of Incorporation / LLC documents\n5. Driver license requirements verified (CDL where required)\n6. Vehicle inspection completed\n7. RiskDrive™ telematics agreement signed\n8. Telematics device installed & tested\n9. Background checks passed\n10. Facility rep assigned\n\nI can show you exactly where each operator stands.",
    followUps: ["Show onboarding status", "Which steps are most commonly delayed?", "Can I send reminders to operators?"],
  },
  {
    keywords: ["training", "module", "safety training", "coach", "coaching"],
    reply: "Safety Training in Affinity RiskDrive™ is event-driven — modules are assigned based on each driver's actual telematics events:\n\n• Phone use events → Distracted Driving module\n• Speeding events → Speed Management & Geofencing\n• Hard braking pattern → Defensive Driving & Following Distance\n• Fatigue alerts → Hours of Service & Fatigue Management\n\nCompletion rates factor into the Training component (10%) of the RiskDrive™ Score. Operators who complete assigned modules within 72 hours show measurably lower repeat-event rates.",
    followUps: ["Which drivers need training now?", "How long are the modules?", "Can I track completion rates?"],
  },
  {
    keywords: ["help", "what can you do", "what do you do", "capabilities"],
    reply: "Here's what I can help you with:\n\n🛡️ Insurance — WC quotes, liability placement, carrier eligibility, premium savings\n📊 RiskDrive™ Score — understanding your score, improving it, carrier thresholds\n⚖️ 1099 Compliance — contractor independence, corporate veil protection, monitoring boundaries\n🚨 Claims — FNOL process, evidence preservation, exoneration outcomes\n✅ Onboarding — checklist status, operator requirements, common blockers\n📚 Training — event-driven modules, completion tracking, coaching outcomes\n\nJust ask — I'll point you in the right direction.",
    followUps: ["WC Quote", "My RiskDrive™ Score", "1099 Compliance Tips"],
  },
];

const DEFAULT_REPLY = "That's a great question — let me help you navigate it. Affinity RiskDrive™ is built to make insurance and compliance simpler for tow operators and AAA clubs. Could you tell me a bit more about what you're trying to accomplish? Or try one of the quick topics below.";

function getFinnReply(input: string): { reply: string; followUps?: string[] } {
  const lower = input.toLowerCase();
  for (const entry of FINN_RESPONSES) {
    if (entry.keywords.some(k => lower.includes(k))) {
      return { reply: entry.reply, followUps: entry.followUps };
    }
  }
  return { reply: DEFAULT_REPLY, followUps: ["Workers Comp Quote", "My RiskDrive™ Score", "1099 Compliance", "Claims Help"] };
}

const QUICK_ACTIONS = [
  { icon: HardHat, label: "Get a WC Quote", prompt: "How do I get a workers comp quote?", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { icon: BarChart3, label: "Understand My Score", prompt: "How does my RiskDrive™ score work?", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { icon: Users, label: "1099 Compliance", prompt: "How do I maintain the 1099 contractor relationship?", color: "text-purple-600 bg-purple-50 border-purple-200" },
  { icon: AlertTriangle, label: "Claims Guidance", prompt: "Walk me through what happens when there's a claim", color: "text-red-600 bg-red-50 border-red-200" },
  { icon: CheckCircle2, label: "Onboarding Help", prompt: "Help me understand the operator onboarding checklist", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { icon: Shield, label: "Carrier Access", prompt: "Which insurance carriers can I access?", color: "text-slate-600 bg-slate-50 border-slate-200" },
];

const PLATFORM_LINKS = [
  { label: "Workers Comp Quote", href: "/wc-quote", desc: "Start a new WC application" },
  { label: "RiskDrive™ Score", href: "/fleet-score", desc: "View your composite score" },
  { label: "Driver Coaching", href: "/driver-feedback", desc: "Review telematics alerts" },
  { label: "Claims TPA", href: "/claims", desc: "Track open claims" },
  { label: "Onboarding", href: "/onboarding", desc: "Operator checklist status" },
];

export default function FinnPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "finn",
      text: "Hi, I'm Finn — your dedicated Affinity Risk AI assistant. I'm here to help tow operators and AAA clubs navigate insurance, compliance, and your RiskDrive™ score.\n\nWhether you need a Workers Comp quote, want to understand your risk score, or have questions about maintaining 1099 contractor relationships — I've got you covered.\n\nWhat can I help you with today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lastFollowUps, setLastFollowUps] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setMessages(prev => [...prev, { role: "user", text: msg, timestamp: new Date() }]);
    setInput("");
    setIsTyping(true);
    setLastFollowUps([]);
    setTimeout(() => {
      const { reply, followUps } = getFinnReply(msg);
      setMessages(prev => [...prev, { role: "finn", text: reply, timestamp: new Date() }]);
      setLastFollowUps(followUps ?? []);
      setIsTyping(false);
    }, 700);
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Finn — AI Assistant"
        subtitle="Your guide to insurance, compliance, and RiskDrive™ — powered by Affinity Risk"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "finn" && (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                {m.role === "user" && (
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-sm font-bold shadow-sm">
                    U
                  </div>
                )}
                <div className={`max-w-[75%] space-y-1 ${m.role === "user" ? "items-end flex flex-col" : ""}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    m.role === "finn"
                      ? "bg-white border border-gray-200 text-gray-700 rounded-tl-sm shadow-sm"
                      : "bg-blue-600 text-white rounded-tr-sm shadow-sm"
                  }`}>
                    {m.text}
                  </div>
                  <div className="text-[10px] text-gray-400 px-1">{formatTime(m.timestamp)}</div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-amber-400"
                        style={{ animation: `bounce 1.2s infinite ${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {lastFollowUps.length > 0 && !isTyping && (
              <div className="flex gap-2 flex-wrap ml-12">
                {lastFollowUps.map(fu => (
                  <button key={fu} onClick={() => send(fu)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors shadow-sm">
                    {fu}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-200 px-5 py-4">
            <div className="flex gap-3">
              <input
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm bg-gray-50 focus:border-amber-400 focus:bg-white transition-colors"
                placeholder="Ask Finn about insurance, compliance, your RiskDrive™ score..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim()}
                className="px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 px-1">
              Finn provides guidance based on Affinity Risk platform data. For binding decisions, consult your Affinity Risk representative.
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
          {/* Quick actions */}
          <div className="p-4 border-b border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Topics</div>
            <div className="space-y-2">
              {QUICK_ACTIONS.map(({ icon: Icon, label, prompt, color }) => (
                <button
                  key={label}
                  onClick={() => send(prompt)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all hover:shadow-sm ${color}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-medium">{label}</span>
                  <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                </button>
              ))}
            </div>
          </div>

          {/* Platform links */}
          <div className="p-4 border-b border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Go to Platform</div>
            <div className="space-y-1">
              {PLATFORM_LINKS.map(({ label, href, desc }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-700 group-hover:text-blue-600">{label}</div>
                    <div className="text-[10px] text-gray-400">{desc}</div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-400" />
                </Link>
              ))}
            </div>
          </div>

          {/* About Finn */}
          <div className="p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">About Finn</div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-700">Finn</div>
                  <div className="text-[10px] text-amber-600">Affinity Risk AI</div>
                </div>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Finn is trained on Affinity Risk's insurance programs, compliance guidelines, and RiskDrive™ methodology. He guides tow operators and AAA clubs through the platform without replacing licensed broker advice.
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-[10px] text-gray-500">Available 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

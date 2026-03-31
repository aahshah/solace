import { useState, useEffect, useRef, useCallback } from "react";

const APP_NAME = "Solace";

// ─── Theme ───
const t = {
  bg: "#0D0B14",
  bgCard: "#16131F",
  bgCardHover: "#1E1A2B",
  bgInput: "#1A1726",
  purple: "#A78BFA",
  purpleLight: "#C4B5FD",
  purpleDim: "#7C5CBF",
  purpleDark: "#2E1F5E",
  purpleGlow: "rgba(167, 139, 250, 0.15)",
  accent: "#E879F9",
  accentDim: "#D946EF",
  green: "#6EE7B7",
  greenDark: "#065F46",
  amber: "#FCD34D",
  red: "#FCA5A5",
  redDark: "#991B1B",
  text: "#F0ECF7",
  textDim: "#9B8FBF",
  textMuted: "#6B5F85",
  border: "#2A2438",
};

// ─── Global Styles ───
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: ${t.bg}; color: ${t.text}; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
  @keyframes slideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
  @keyframes breathe { 0%,100% { transform:scale(1); opacity:0.6; } 50% { transform:scale(1.08); opacity:1; } }
  @keyframes speakPulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(167,139,250,0.4); }
    50% { transform: scale(1.08); box-shadow: 0 0 40px 10px rgba(167,139,250,0.25); }
  }
  @keyframes micPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(252,165,165,0.5); }
    50% { box-shadow: 0 0 0 14px rgba(252,165,165,0); }
  }
  .fadeUp { animation: fadeUp 0.6s ease both; }
  .fadeIn { animation: fadeIn 0.5s ease both; }
  .slideIn { animation: slideIn 0.4s ease both; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${t.purpleDark}; border-radius: 4px; }
  input, textarea, select { font-family: 'DM Sans', sans-serif; outline: none; }
  button { font-family: 'DM Sans', sans-serif; cursor: pointer; border: none; outline: none; }
`;

// ─── Storage ───
const S = {
  get: (k, fb) => { try { return JSON.parse(localStorage.getItem(`solace_${k}`)) ?? fb; } catch { return fb; } },
  set: (k, v) => localStorage.setItem(`solace_${k}`, JSON.stringify(v)),
};

// ─── Crisis Detection ───
const CRISIS_PATTERNS = [
  /\bkill\s*(my|me)self\b/i, /\bsuicid/i, /\bwant\s*to\s*die\b/i,
  /\bbetter\s*off\s*dead\b/i, /\bdon'?t\s*want\s*to\s*(be\s*)?alive\b/i,
  /\bself[- ]?harm/i, /\bcut\s*(my|me)self\b/i, /\bhurt\s*(my|me)self\b/i,
  /\bend\s*(it|my\s*life)\b/i, /\bno\s*(reason|point)\s*(to|in)\s*liv/i,
];
function detectCrisis(text) { return CRISIS_PATTERNS.some(p => p.test(text)); }

// ─── Data ───
const FOCUS_AREAS = [
  { id: "anxiety", label: "Anxiety & Worry", icon: "😰" },
  { id: "mood", label: "Low Mood", icon: "🌧" },
  { id: "relationships", label: "Relationships", icon: "💜" },
  { id: "stress", label: "Stress & Overwhelm", icon: "🔥" },
  { id: "selfworth", label: "Self-Worth", icon: "🪞" },
  { id: "transitions", label: "Life Transitions", icon: "🔄" },
  { id: "grief", label: "Grief & Loss", icon: "🕊" },
  { id: "family", label: "Family", icon: "🏠" },
];

const EMOTIONS = {
  positive: ["Calm", "Grateful", "Hopeful", "Content", "Energized", "Peaceful", "Proud", "Loved"],
  negative: ["Anxious", "Sad", "Angry", "Lonely", "Overwhelmed", "Frustrated", "Numb", "Scared"],
  neutral: ["Confused", "Tired", "Restless", "Bored", "Indifferent"],
};

const MOOD_LABELS = ["", "Struggling", "Low", "Okay", "Good", "Great"];
const MOOD_COLORS = ["", t.red, t.amber, t.textDim, t.green, t.purple];

const PHQ2 = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
];
const GAD2 = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
];
const SCORE_LABELS = ["Not at all", "Several days", "More than half the days", "Nearly every day"];

const JOURNAL_PROMPTS = [
  "What emotion showed up most today? What might it be telling you?",
  "What's one thing you did today that took courage — even a little?",
  "If your best friend described your day, what would they notice that you might miss?",
  "What's something you're carrying that isn't yours to carry?",
  "What would 'good enough' look like today?",
  "What's a boundary you wish you had set this week?",
  "Write a letter to the version of you from a year ago.",
];

const DARES = [
  "Call someone you've been meaning to reach out to.",
  "Tell someone specifically why you appreciate them.",
  "Ask someone 'how are you really doing?' — and listen.",
  "Send a voice note instead of a text.",
  "Have a meal with someone without looking at your phone.",
  "Tell someone about something you're struggling with.",
  "Compliment a stranger. Make it genuine.",
];

// ─── Personas ───
const PERSONAS = [
  {
    id: "genz",
    name: "The Bestie",
    vibe: "Gen Z Friend",
    icon: "💅",
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Bella
    desc: "Speaks your language. Validates without sugarcoating. Keeps it real.",
    prompt: `YOUR PERSONA — GEN Z BEST FRIEND:
- You talk like a supportive Gen Z friend — casual, warm, occasionally funny
- Use natural language: "that's so valid", "I hear you", "okay but like...", "lowkey", "ngl"
- Don't overdo the slang — keep it authentic, not performative
- You're the friend who texts back immediately and actually listens
- Use short, punchy sentences. Break things up.
- Reference relatable experiences (doom scrolling, burnout, situationships, comparison on social media)
- Never condescending. You're WITH them, not above them.`,
  },
  {
    id: "dad",
    name: "The Dad",
    vibe: "Wise Father Figure",
    icon: "🧔",
    voiceId: "pNInz6obpgDQGcFmaJgB", // Adam
    desc: "Patient, steady, warm. The dad energy you needed.",
    prompt: `YOUR PERSONA — WISE DAD:
- You speak like a warm, patient father figure — steady, grounded, occasionally uses gentle humor
- Use language like: "kiddo", "here's the thing", "let me tell you something", "I've been there"
- You tell small stories and analogies to make points land
- You're the dad who sits with you on the porch and says "talk to me" and actually means it
- Never preachy or lecturing. You share wisdom through experience, not authority.
- You believe in them fiercely but also don't let them off the hook when they're avoiding hard truths
- Steady, calm energy. You're the anchor.`,
  },
  {
    id: "elder_sis",
    name: "Big Sis",
    vibe: "Cool Older Sister",
    icon: "👩‍🦱",
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel
    desc: "Been through it all. Gives it to you straight with love.",
    prompt: `YOUR PERSONA — COOL OLDER SISTER / MILLENNIAL:
- You speak like a been-through-it older sister — warm, direct, a little sarcastic when it lands
- Use language like: "okay so here's the thing", "been there, done that", "I need you to hear this", "real talk"
- You've made the mistakes so they don't have to — but you also know they need to make their own
- Mix of casual and wise. You can go from "girl, no" to genuine depth in the same breath.
- You text in full sentences and have a therapist you talk about openly
- You normalize struggle without romanticizing it
- You're the person they'd call at 2am and you'd actually pick up.`,
  },
  {
    id: "therapist",
    name: "The Guide",
    vibe: "Calm Therapist",
    icon: "🧘",
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel
    desc: "Measured, reflective, evidence-based. Classic therapeutic presence.",
    prompt: `YOUR PERSONA — CALM THERAPIST:
- You speak with measured, warm professionalism — like a really good therapist who also happens to be a real person
- Reflective and deliberate. You choose your words carefully.
- You sit with silence. You don't rush to fill the gap.
- You use reflective listening and open-ended questions naturally
- Never robotic or clinical — warm, but with clear therapeutic structure
- You gently guide without leading. The insight has to come from them.
- Think: the therapist everyone wishes they had.`,
  },
  {
    id: "real_one",
    name: "The Real One",
    vibe: "Honest & Direct",
    icon: "🔥",
    voiceId: "ErXwobaYiN019PkySvjV", // Antoni
    desc: "No sugarcoating. Loves you enough to tell you the truth.",
    prompt: `YOUR PERSONA — THE REAL ONE:
- You speak with direct, no-nonsense honesty wrapped in genuine care
- Use language like: "look, I'm gonna be straight with you", "I say this with love", "you already know the answer"
- You call out avoidance and excuses — but always from a place of believing in them
- You don't do toxic positivity. You do real positivity — "this sucks AND you can handle it"
- Short, impactful sentences. You don't waste words.
- Think: the friend who loves you enough to say the uncomfortable thing
- You're tough love personified — emphasis on the LOVE part.`,
  },
];

// ─── Helpers ───
function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}
function dateStr(ts) { return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
function getStreak(moods) {
  if (!moods.length) return 0;
  let streak = 0;
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = 0; i <= 30; i++) {
    const day = new Date(today); day.setDate(day.getDate() - i);
    const dayStart = day.getTime();
    const dayEnd = dayStart + 86400000;
    if (moods.some(m => m.ts >= dayStart && m.ts < dayEnd)) streak++;
    else break;
  }
  return streak;
}

// ─── System Prompt ───
function buildSystemPrompt(profile, moodHistory, pastSessions, persona) {
  const recentMoods = moodHistory.slice(-3).map(m =>
    `${dateStr(m.ts)}: ${MOOD_LABELS[m.mood]} (${m.emotions.join(", ")})`
  ).join("\n") || "No mood data yet";

  const pastContext = pastSessions.slice(-2).map(s => {
    const userMsgs = s.messages.filter(m => m.role === "user").slice(-3).map(m => m.text);
    return `Session (${dateStr(s.ts)}): User discussed: ${userMsgs.join(" | ")}`;
  }).join("\n") || "No previous sessions";

  const personaBlock = persona?.prompt || PERSONAS[3].prompt; // default to therapist

  return `You are ${APP_NAME} — an evidence-based emotional wellness companion. You integrate therapeutic skills naturally into your unique personality.

USER PROFILE:
- Name: ${profile.name}
- Focus areas: ${profile.areas?.join(", ") || "general wellness"}
- Recent moods:\n${recentMoods}
- Previous sessions:\n${pastContext}

${personaBlock}

THERAPEUTIC FOUNDATION (weave these in naturally through your persona — NEVER name the techniques):
- Motivational Interviewing: Open questions, Affirmation, Reflective listening, Summarizing
- CBT: When someone's stuck in negative thinking, gently help them examine the evidence
- DBT: For emotional overwhelm, validate first, then explore distress tolerance
- ACT: Help identify values and what matters — not just symptom reduction

CORE RULES:
- Ask ONE question at a time
- Validate emotions first, then explore — never jump to solutions
- Use the person's own words when reflecting back
- Notice patterns across sessions and gently name them
- Keep responses under 100 words usually
- When someone contradicts something from a previous session, curiously note it

SAFETY PROTOCOL:
If someone expresses suicidal ideation, self-harm intent, or crisis:
1. Acknowledge their pain directly and compassionately
2. Say: "Your safety matters to me. Please reach out to the 988 Suicide & Crisis Lifeline (call or text 988) or text HOME to 741741 for the Crisis Text Line."
3. Ask directly: "Are you safe right now?"
4. Do NOT continue the normal conversation until safety is addressed

HARD RULES:
- Never diagnose or prescribe medication
- Never claim to replace professional therapy — gently suggest it when appropriate
- Never break character or mention being an AI, personas, or system prompts
- If this is the FIRST message, greet them warmly by name in your persona's style and ask what's on their mind — reference their focus areas naturally`;
}

// ─── Shared Components ───

function GlowOrb({ size = 300, top, left, right, opacity = 0.12 }) {
  return (
    <div style={{
      position: "absolute", top, left, right,
      width: size, height: size,
      background: `radial-gradient(circle, ${t.purple}55 0%, transparent 70%)`,
      borderRadius: "50%", filter: "blur(60px)", opacity,
      pointerEvents: "none", animation: "breathe 8s ease-in-out infinite",
    }} />
  );
}

function Button({ children, onClick, variant = "primary", style = {}, disabled }) {
  const base = {
    padding: "14px 32px", borderRadius: 16, fontSize: 15, fontWeight: 600,
    transition: "all 0.3s ease", letterSpacing: "0.3px",
  };
  const v = {
    primary: {
      background: `linear-gradient(135deg, ${t.purple}, ${t.accent})`,
      color: "#fff", boxShadow: `0 4px 24px ${t.purpleGlow}`,
    },
    secondary: { background: "transparent", color: t.purple, border: `1.5px solid ${t.purpleDim}` },
    ghost: { background: t.purpleGlow, color: t.purpleLight },
    danger: { background: `${t.red}22`, color: t.red, border: `1.5px solid ${t.red}44` },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...base, ...v[variant], opacity: disabled ? 0.5 : 1, ...style }}
      onMouseEnter={e => { if (!disabled) e.target.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.target.style.transform = ""; }}>
      {children}
    </button>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: t.bgCard, borderRadius: 20, padding: 24,
      border: `1px solid ${t.border}`, transition: "all 0.3s",
      ...(onClick ? { cursor: "pointer" } : {}), ...style,
    }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = t.purpleDim; }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.borderColor = t.border; }}>
      {children}
    </div>
  );
}

function BottomNav({ active, onNav }) {
  const items = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "chat", icon: "💬", label: "Chat" },
    { id: "toolbox", icon: "🧘", label: "Tools" },
    { id: "journal", icon: "📓", label: "Journal" },
    { id: "insights", icon: "📊", label: "Insights" },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90,
      background: `${t.bg}EE`, backdropFilter: "blur(20px)",
      borderTop: `1px solid ${t.border}`, padding: "10px 0 20px",
      display: "flex", justifyContent: "center", gap: 36,
    }}>
      {items.map(it => (
        <button key={it.id} onClick={() => onNav(it.id)} style={{
          background: "none", border: "none",
          color: active === it.id ? t.purple : t.textMuted,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontSize: 10,
          transition: "color 0.2s",
        }}>
          <span style={{ fontSize: 22 }}>{it.icon}</span>
          {it.label}
        </button>
      ))}
    </div>
  );
}

function SOSButton({ onClick }) {
  return (
    <button onClick={onClick} style={{
      position: "fixed", top: 16, right: 16, zIndex: 100,
      width: 40, height: 40, borderRadius: 12,
      background: `${t.red}22`, border: `1.5px solid ${t.red}44`,
      color: t.red, fontSize: 14, fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.3s",
    }}
      onMouseEnter={e => e.currentTarget.style.background = `${t.red}33`}
      onMouseLeave={e => e.currentTarget.style.background = `${t.red}22`}>
      SOS
    </button>
  );
}

// ─── Crisis Overlay ───
function CrisisOverlay({ onClose }) {
  return (
    <div className="fadeIn" style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: `${t.bg}F5`, backdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, margin: "0 auto 24px",
          background: `${t.red}22`, border: `2px solid ${t.red}44`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
        }}>❤️</div>

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 12 }}>
          You matter.
        </h2>
        <p style={{ color: t.textDim, fontSize: 15, lineHeight: 1.7, marginBottom: 36 }}>
          If you're in crisis or having thoughts of suicide, please reach out to someone who can help right now.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
          <a href="tel:988" style={{
            padding: "18px 24px", borderRadius: 16, textDecoration: "none",
            background: `${t.red}15`, border: `1.5px solid ${t.red}44`,
            color: t.text, display: "flex", alignItems: "center", gap: 16,
          }}>
            <span style={{ fontSize: 24 }}>📞</span>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 600 }}>988 Suicide & Crisis Lifeline</p>
              <p style={{ color: t.textDim, fontSize: 13 }}>Call or text 988 — free, 24/7</p>
            </div>
          </a>
          <a href="sms:741741?body=HOME" style={{
            padding: "18px 24px", borderRadius: 16, textDecoration: "none",
            background: `${t.purple}15`, border: `1.5px solid ${t.purpleDim}44`,
            color: t.text, display: "flex", alignItems: "center", gap: 16,
          }}>
            <span style={{ fontSize: 24 }}>💬</span>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 600 }}>Crisis Text Line</p>
              <p style={{ color: t.textDim, fontSize: 13 }}>Text HOME to 741741</p>
            </div>
          </a>
          <a href="https://findtreatment.gov" target="_blank" rel="noreferrer" style={{
            padding: "18px 24px", borderRadius: 16, textDecoration: "none",
            background: `${t.green}15`, border: `1.5px solid ${t.green}44`,
            color: t.text, display: "flex", alignItems: "center", gap: 16,
          }}>
            <span style={{ fontSize: 24 }}>🏥</span>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 600 }}>Find a Therapist</p>
              <p style={{ color: t.textDim, fontSize: 13 }}>SAMHSA treatment locator</p>
            </div>
          </a>
        </div>

        <Button variant="secondary" onClick={onClose} style={{ width: "100%" }}>
          I'm okay, go back
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Welcome
// ═══════════════════════════════════════
function WelcomeScreen({ onStart }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", position: "relative",
      overflow: "hidden", padding: 24,
    }}>
      <GlowOrb size={400} top="-10%" left="20%" opacity={0.15} />
      <GlowOrb size={300} top="60%" right="-5%" opacity={0.1} />
      <div className="fadeUp" style={{ textAlign: "center", maxWidth: 440, zIndex: 1 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24, margin: "0 auto 32px",
          background: `linear-gradient(135deg, ${t.purple}, ${t.accent})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, boxShadow: `0 8px 40px ${t.purpleGlow}`,
        }}>✦</div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 600, marginBottom: 16,
          background: `linear-gradient(135deg, ${t.purpleLight}, ${t.accent})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>{APP_NAME}</h1>
        <p style={{
          fontFamily: "'Playfair Display', serif", fontStyle: "italic",
          color: t.textDim, fontSize: 17, marginBottom: 12,
        }}>Not just another chatbot.</p>
        <p style={{
          fontFamily: "'Playfair Display', serif", fontStyle: "italic",
          color: t.purpleLight, fontSize: 19, marginBottom: 48,
        }}>Your evidence-based wellness companion.</p>
        <p style={{ color: t.textDim, fontSize: 15, lineHeight: 1.7, marginBottom: 48 }}>
          Real therapeutic tools. Mood tracking. A conversation that remembers you and helps you grow.
        </p>
        <Button onClick={onStart}>Get started</Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Setup
// ═══════════════════════════════════════
function SetupScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [areas, setAreas] = useState([]);

  const toggleArea = (id) => setAreas(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  if (step === 0) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 24, position: "relative",
      }}>
        <GlowOrb size={300} top="10%" left="-10%" />
        <div className="fadeUp" style={{ maxWidth: 400, width: "100%", zIndex: 1 }}>
          <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 8, letterSpacing: 1 }}>STEP 1 OF 2</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, marginBottom: 8 }}>
            What should we call you?
          </h2>
          <p style={{ color: t.textDim, fontSize: 15, marginBottom: 40 }}>
            Just a first name is perfect.
          </p>
          <div style={{ marginBottom: 40 }}>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Your name"
              style={{
                width: "100%", padding: "16px 20px", borderRadius: 14,
                background: t.bgInput, border: `1.5px solid ${t.border}`,
                color: t.text, fontSize: 16, transition: "border-color 0.3s",
              }}
              onFocus={e => e.target.style.borderColor = t.purpleDim}
              onBlur={e => e.target.style.borderColor = t.border}
              onKeyDown={e => { if (e.key === "Enter" && name.trim()) setStep(1); }}
            />
          </div>
          <Button onClick={() => setStep(1)} disabled={!name.trim()}>Continue →</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24, position: "relative",
    }}>
      <GlowOrb size={350} top="50%" left="-15%" />
      <div className="fadeUp" style={{ maxWidth: 480, width: "100%", zIndex: 1 }}>
        <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 8, letterSpacing: 1 }}>STEP 2 OF 2</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, marginBottom: 8 }}>
          What brings you here, {name}?
        </h2>
        <p style={{ color: t.textDim, fontSize: 15, marginBottom: 36 }}>
          Select what you'd like support with. This helps {APP_NAME} personalize your experience.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 40 }}>
          {FOCUS_AREAS.map(a => {
            const on = areas.includes(a.id);
            return (
              <button key={a.id} onClick={() => toggleArea(a.id)} style={{
                padding: "20px 16px", borderRadius: 18, textAlign: "center",
                background: on ? `${t.purple}18` : t.bgCard,
                border: `1.5px solid ${on ? t.purple : t.border}`,
                color: on ? t.purpleLight : t.textDim,
                transition: "all 0.3s", fontSize: 14,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
                {a.label}
              </button>
            );
          })}
        </div>
        <Button onClick={() => onComplete({ name: name.trim(), areas })} disabled={areas.length === 0}>
          I'm ready →
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Home
// ═══════════════════════════════════════
function HomeScreen({ profile, moods, assessments, persona, onNav, onMoodCheckin }) {
  const streak = getStreak(moods);
  const recent7 = moods.slice(-7);
  const todayDare = DARES[new Date().getDate() % DARES.length];
  const lastAssessment = assessments[assessments.length - 1];
  const daysSinceAssessment = lastAssessment ? Math.floor((Date.now() - lastAssessment.ts) / 86400000) : 999;
  const todayMood = moods.find(m => {
    const d = new Date(); d.setHours(0,0,0,0);
    return m.ts >= d.getTime();
  });

  return (
    <div style={{
      minHeight: "100vh", padding: "24px 20px 100px", position: "relative",
      maxWidth: 520, margin: "0 auto",
    }}>
      <GlowOrb size={250} top="-5%" right="-10%" opacity={0.08} />

      {/* Header */}
      <div className="fadeUp" style={{ marginBottom: 28, paddingTop: 16 }}>
        <p style={{ color: t.textDim, fontSize: 14 }}>{greeting()}, {profile.name}</p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginTop: 4 }}>
          How are you, really?
        </h1>
      </div>

      {/* Mood Check-in CTA */}
      {!todayMood && (
        <Card style={{
          marginBottom: 16, animationDelay: "0.05s",
          background: `linear-gradient(135deg, ${t.purpleDark}88, ${t.bgCard})`,
          border: `1px solid ${t.purpleDim}44`, cursor: "pointer",
        }} onClick={onMoodCheckin}>
          <div className="fadeUp" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `linear-gradient(135deg, ${t.purple}, ${t.accent})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              flexShrink: 0,
            }}>🌤</div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 2 }}>How are you feeling today?</p>
              <p style={{ color: t.textDim, fontSize: 13 }}>Take a quick mood check-in</p>
            </div>
          </div>
        </Card>
      )}

      {/* Mood Trend */}
      {recent7.length > 0 && (
        <Card style={{ marginBottom: 16 }} onClick={() => onNav("insights")}>
          <div className="fadeUp">
            <p style={{ color: t.textDim, fontSize: 13, marginBottom: 16 }}>Your mood this week</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
              {recent7.map((m, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: "100%", borderRadius: 8, transition: "height 0.5s ease",
                    height: `${m.mood * 14}px`,
                    background: `linear-gradient(to top, ${MOOD_COLORS[m.mood]}66, ${MOOD_COLORS[m.mood]})`,
                  }} />
                  <span style={{ fontSize: 10, color: t.textMuted }}>{dateStr(m.ts).split(" ")[1]}</span>
                </div>
              ))}
            </div>
            {streak > 1 && (
              <p style={{ color: t.amber, fontSize: 13, marginTop: 12 }}>
                🔥 {streak}-day check-in streak
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Weekly Assessment Reminder */}
      {daysSinceAssessment >= 7 && (
        <Card style={{
          marginBottom: 16,
          background: `${t.amber}08`, border: `1px solid ${t.amber}22`,
          cursor: "pointer",
        }} onClick={() => onNav("assessment")}>
          <div className="fadeUp" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 24 }}>📋</span>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 2 }}>Weekly wellness check</p>
              <p style={{ color: t.textDim, fontSize: 13 }}>Quick 4-question assessment to track your progress</p>
            </div>
          </div>
        </Card>
      )}

      {/* Today's Dare */}
      <Card style={{
        marginBottom: 16,
        background: `linear-gradient(135deg, ${t.purpleDark}88, ${t.bgCard})`,
        border: `1px solid ${t.purpleDim}44`,
      }}>
        <div className="fadeUp">
          <p style={{ color: t.accent, fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>
            TODAY'S CONNECTION DARE
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.6 }}>{todayDare}</p>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="fadeUp" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16,
      }}>
        <Card onClick={() => onNav("chat")} style={{ padding: 20 }}>
          <div style={{ fontSize: 26, marginBottom: 10 }}>💬</div>
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Talk to {APP_NAME}</p>
          <p style={{ color: t.textMuted, fontSize: 12 }}>What's on your mind?</p>
        </Card>
        <Card onClick={() => onNav("toolbox")} style={{ padding: 20 }}>
          <div style={{ fontSize: 26, marginBottom: 10 }}>🧘</div>
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Coping Tools</p>
          <p style={{ color: t.textMuted, fontSize: 12 }}>Breathing, grounding & more</p>
        </Card>
      </div>

      <div className="fadeUp" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16,
      }}>
        <Card onClick={() => onNav("journal")} style={{ padding: 20 }}>
          <div style={{ fontSize: 26, marginBottom: 10 }}>📓</div>
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Journal</p>
          <p style={{ color: t.textMuted, fontSize: 12 }}>Reflect & process</p>
        </Card>
        <Card onClick={() => onNav("insights")} style={{ padding: 20 }}>
          <div style={{ fontSize: 26, marginBottom: 10 }}>📊</div>
          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>Insights</p>
          <p style={{ color: t.textMuted, fontSize: 12 }}>Track your progress</p>
        </Card>
      </div>

      {/* Current Persona */}
      <Card onClick={() => onNav("persona")} style={{ marginBottom: 16, padding: 18 }}>
        <div className="fadeUp" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: `${t.purple}18`, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 22, flexShrink: 0,
          }}>{persona.icon}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: t.textMuted }}>Talking to</p>
            <p style={{ fontWeight: 600, fontSize: 15 }}>{persona.name} <span style={{ color: t.accent, fontSize: 12, fontWeight: 400 }}>· {persona.vibe}</span></p>
          </div>
          <span style={{ color: t.textMuted, fontSize: 14 }}>Change →</span>
        </div>
      </Card>

      {/* Disclaimer */}
      <p style={{
        color: t.textMuted, fontSize: 11, textAlign: "center", lineHeight: 1.6,
        marginTop: 8, padding: "0 16px",
      }}>
        {APP_NAME} is not a replacement for professional therapy. If you're in crisis, tap the SOS button.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Mood Check-In
// ═══════════════════════════════════════
function MoodCheckinScreen({ onSave, onBack }) {
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState(0);
  const [emotions, setEmotions] = useState([]);
  const [note, setNote] = useState("");

  const toggleEmotion = (e) => setEmotions(p => p.includes(e) ? p.filter(x => x !== e) : [...p, e]);

  if (step === 0) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <div className="fadeUp" style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 8 }}>
            How are you feeling?
          </h2>
          <p style={{ color: t.textDim, fontSize: 15, marginBottom: 48 }}>
            Tap the number that fits best right now.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 24 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setMood(n)} style={{
                width: 60, height: 60, borderRadius: 16,
                background: mood === n ? `linear-gradient(135deg, ${MOOD_COLORS[n]}88, ${MOOD_COLORS[n]})` : t.bgCard,
                border: `2px solid ${mood === n ? MOOD_COLORS[n] : t.border}`,
                color: t.text, fontSize: 22, fontWeight: 700,
                transition: "all 0.3s", transform: mood === n ? "scale(1.1)" : "scale(1)",
              }}>
                {n}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px", marginBottom: 48 }}>
            {MOOD_LABELS.slice(1).map(l => (
              <span key={l} style={{ fontSize: 11, color: t.textMuted, width: 60, textAlign: "center" }}>{l}</span>
            ))}
          </div>
          <Button onClick={() => setStep(1)} disabled={mood === 0}>Continue</Button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    const allEmotions = mood >= 4
      ? [...EMOTIONS.positive, ...EMOTIONS.neutral]
      : mood <= 2
        ? [...EMOTIONS.negative, ...EMOTIONS.neutral]
        : [...EMOTIONS.negative, ...EMOTIONS.positive, ...EMOTIONS.neutral];

    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <div className="fadeUp" style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 8 }}>
            What emotions are showing up?
          </h2>
          <p style={{ color: t.textDim, fontSize: 14, marginBottom: 32 }}>Select all that apply.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 40 }}>
            {allEmotions.map(e => {
              const on = emotions.includes(e);
              return (
                <button key={e} onClick={() => toggleEmotion(e)} style={{
                  padding: "10px 18px", borderRadius: 20,
                  background: on ? `${t.purple}25` : t.bgCard,
                  border: `1.5px solid ${on ? t.purple : t.border}`,
                  color: on ? t.purpleLight : t.textDim,
                  fontSize: 14, transition: "all 0.2s",
                }}>{e}</button>
              );
            })}
          </div>
          <Button onClick={() => setStep(2)} disabled={emotions.length === 0}>Continue</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div className="fadeUp" style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 8 }}>
          Anything else on your mind?
        </h2>
        <p style={{ color: t.textDim, fontSize: 14, marginBottom: 32 }}>Optional — just a sentence or two.</p>
        <textarea value={note} onChange={e => setNote(e.target.value)}
          placeholder="What's going on today..."
          rows={3}
          style={{
            width: "100%", padding: "16px 20px", borderRadius: 16,
            background: t.bgInput, border: `1.5px solid ${t.border}`,
            color: t.text, fontSize: 15, lineHeight: 1.6, resize: "none",
            marginBottom: 32,
          }}
          onFocus={e => e.target.style.borderColor = t.purpleDim}
          onBlur={e => e.target.style.borderColor = t.border}
        />
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Button onClick={() => {
            onSave({ mood, emotions, note: note.trim(), ts: Date.now() });
          }}>Save check-in</Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Persona Picker
// ═══════════════════════════════════════
function PersonaPickerScreen({ current, onSelect, onBack }) {
  return (
    <div style={{
      minHeight: "100vh", padding: "24px 20px 100px", maxWidth: 520, margin: "0 auto",
    }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: t.textDim, fontSize: 20, marginBottom: 16,
      }}>←</button>
      <div className="fadeUp" style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28 }}>
          Who do you want to talk to?
        </h1>
        <p style={{ color: t.textDim, fontSize: 14, marginTop: 6 }}>
          Same wisdom, different energy. Pick the vibe that fits right now.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PERSONAS.map(p => {
          const active = current === p.id;
          return (
            <button key={p.id} onClick={() => onSelect(p.id)}
              style={{
                padding: 20, borderRadius: 20, textAlign: "left",
                background: active ? `${t.purple}15` : t.bgCard,
                border: `1.5px solid ${active ? t.purple : t.border}`,
                color: t.text, transition: "all 0.3s",
                display: "flex", gap: 16, alignItems: "center",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = t.purpleDim; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = t.border; }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: active ? `${t.purple}25` : `${t.purple}10`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, flexShrink: 0,
              }}>{p.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <p style={{ fontWeight: 600, fontSize: 16 }}>{p.name}</p>
                  <span style={{
                    fontSize: 11, color: t.accent, fontWeight: 600,
                    background: `${t.accent}15`, padding: "2px 8px", borderRadius: 8,
                  }}>{p.vibe}</span>
                </div>
                <p style={{ color: t.textDim, fontSize: 13, lineHeight: 1.5 }}>{p.desc}</p>
              </div>
              {active && (
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${t.purple}, ${t.accent})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: "#fff", flexShrink: 0,
                }}>✓</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Chat (with voice support)
// ═══════════════════════════════════════
const SpeechRecognition = typeof window !== "undefined"
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

function ChatScreen({ profile, moods, sessions, persona, onSaveSession, onBack, onShowCrisis }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };
  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  const apiBase = import.meta.env.VITE_API_URL || "";

  const speakText = useCallback(async (text) => {
    setSpeaking(true);
    try {
      const res = await fetch(`${apiBase}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId: persona?.voiceId }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      setSpeaking(false);
    }
  }, [apiBase]);

  const callAI = useCallback(async (conversationMessages, autoSpeak = false) => {
    setLoading(true);
    try {
      const apiMessages = conversationMessages.map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));
      const response = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: buildSystemPrompt(profile, moods, sessions, persona),
          messages: apiMessages,
        }),
      });
      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "I'm here. Tell me more.";
      if (autoSpeak) speakText(text);
      return text;
    } catch (err) {
      console.error(err);
      return "I'm having trouble connecting right now. Can you try again in a moment?";
    } finally {
      setLoading(false);
    }
  }, [profile, moods, sessions, persona, apiBase, speakText]);

  useEffect(() => {
    if (!started) {
      setStarted(true);
      (async () => {
        const reply = await callAI([{ role: "user", text: "Hi, I just opened the app." }], voiceMode);
        setMessages([{ role: "assistant", text: reply, id: Date.now() }]);
      })();
    }
  }, [started, callAI, voiceMode]);

  useEffect(() => {
    return () => {
      if (messages.length > 1) {
        onSaveSession({ messages, ts: Date.now() });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (text, speak = false) => {
    if (!text.trim() || loading) return;

    if (detectCrisis(text)) onShowCrisis();

    const userMsg = { role: "user", text: text.trim(), id: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setTranscript("");

    const reply = await callAI(newMessages, speak);
    const updated = [...newMessages, { role: "assistant", text: reply, id: Date.now() + 1 }];
    setMessages(updated);
    onSaveSession({ messages: updated, ts: Date.now() });
  };

  const handleSend = () => sendMessage(input, voiceMode);

  const startListening = () => {
    if (!SpeechRecognition) return;
    if (audioRef.current) { audioRef.current.pause(); setSpeaking(false); }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (e) => {
      const result = Array.from(e.results).map(r => r[0].transcript).join("");
      setTranscript(result);
    };
    recognition.onend = () => {
      setListening(false);
      const final = recognitionRef.current?._finalTranscript;
      if (final?.trim()) sendMessage(final, true);
    };
    recognition.onerror = (e) => {
      console.error("Speech error:", e.error);
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current._finalTranscript = transcript;
      recognitionRef.current.stop();
    }
  };

  const handleBack = () => {
    if (audioRef.current) { audioRef.current.pause(); setSpeaking(false); }
    if (recognitionRef.current) recognitionRef.current.abort();
    if (messages.length > 1) onSaveSession({ messages, ts: Date.now() });
    onBack();
  };

  const hasMic = !!SpeechRecognition;

  // Voice mode full-screen view
  if (voiceMode) {
    return (
      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        maxWidth: 520, margin: "0 auto", position: "relative",
      }}>
        <GlowOrb size={400} top="20%" left="15%" opacity={0.12} />

        {/* Header */}
        <div style={{
          padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${t.border}`, background: `${t.bg}EE`, backdropFilter: "blur(20px)",
        }}>
          <button onClick={handleBack} style={{
            background: "none", border: "none", color: t.textDim, fontSize: 20,
          }}>←</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `linear-gradient(135deg, ${t.purple}, ${t.accent})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
            }}>✦</div>
            <p style={{ fontWeight: 600, fontSize: 15 }}>{APP_NAME}</p>
          </div>
          <button onClick={() => setVoiceMode(false)} style={{
            background: t.bgCard, border: `1px solid ${t.border}`,
            borderRadius: 10, padding: "6px 12px", color: t.textDim, fontSize: 12,
          }}>Text mode</button>
        </div>

        {/* Center orb + status */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: 24, zIndex: 1,
        }}>
          {/* Speaking / Listening orb */}
          <div style={{
            width: 160, height: 160, borderRadius: "50%",
            background: speaking
              ? `radial-gradient(circle, ${t.accent}44 0%, ${t.purple}22 60%, transparent 100%)`
              : listening
                ? `radial-gradient(circle, ${t.red}33 0%, ${t.red}11 60%, transparent 100%)`
                : `radial-gradient(circle, ${t.purple}33 0%, ${t.purpleDark}22 60%, transparent 100%)`,
            border: `2px solid ${speaking ? t.accent : listening ? t.red : t.purpleDim}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: speaking ? "speakPulse 2s ease-in-out infinite"
              : listening ? "micPulse 1.5s ease-in-out infinite" : "breathe 4s ease-in-out infinite",
            transition: "background 0.5s, border-color 0.5s",
            marginBottom: 32,
          }}>
            <span style={{ fontSize: 48 }}>
              {speaking ? "✦" : listening ? "🎙" : "✦"}
            </span>
          </div>

          <p style={{
            fontFamily: "'Playfair Display', serif", fontSize: 20,
            color: speaking ? t.accent : listening ? t.red : t.textDim,
            marginBottom: 8, transition: "color 0.3s",
          }}>
            {speaking ? "Speaking..." : listening ? "Listening..." : loading ? "Thinking..." : "Tap to speak"}
          </p>

          {/* Live transcript */}
          {(listening || transcript) && (
            <p style={{
              color: t.textDim, fontSize: 14, maxWidth: 300,
              textAlign: "center", fontStyle: "italic", marginBottom: 16,
              minHeight: 20,
            }}>
              {transcript || "..."}
            </p>
          )}

          {/* Last AI message */}
          {messages.length > 0 && !listening && (
            <div style={{
              maxWidth: 360, padding: "16px 20px", borderRadius: 20,
              background: t.bgCard, border: `1px solid ${t.border}`,
              marginTop: 16, maxHeight: 150, overflowY: "auto",
            }}>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: t.textDim }}>
                {messages[messages.length - 1].text}
              </p>
            </div>
          )}
        </div>

        {/* Bottom mic button */}
        <div style={{
          padding: "20px 16px 40px",
          display: "flex", justifyContent: "center", gap: 16, alignItems: "center",
        }}>
          {!listening ? (
            <button onClick={startListening}
              disabled={loading || speaking}
              style={{
                width: 72, height: 72, borderRadius: "50%",
                background: loading || speaking
                  ? t.bgCard
                  : `linear-gradient(135deg, ${t.purple}, ${t.accent})`,
                border: "none", color: "#fff", fontSize: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: loading || speaking ? "none" : `0 4px 24px ${t.purpleGlow}`,
                opacity: loading || speaking ? 0.5 : 1,
                transition: "all 0.3s",
              }}>
              🎙
            </button>
          ) : (
            <button onClick={stopListening} style={{
              width: 72, height: 72, borderRadius: "50%",
              background: `linear-gradient(135deg, ${t.red}CC, ${t.red})`,
              border: "none", color: "#fff", fontSize: 20, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "micPulse 1.5s ease-in-out infinite",
            }}>
              ■
            </button>
          )}
        </div>
      </div>
    );
  }

  // Text mode (original chat UI with voice toggle)
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      maxWidth: 520, margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px", borderBottom: `1px solid ${t.border}`,
        display: "flex", alignItems: "center", gap: 16,
        background: `${t.bg}EE`, backdropFilter: "blur(20px)",
      }}>
        <button onClick={handleBack} style={{
          background: "none", border: "none", color: t.textDim, fontSize: 20,
        }}>←</button>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: `linear-gradient(135deg, ${t.purple}, ${t.accent})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        }}>✦</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 15 }}>{APP_NAME}</p>
          <p style={{ color: t.green, fontSize: 11 }}>● Online</p>
        </div>
        {hasMic && (
          <button onClick={() => setVoiceMode(true)} style={{
            background: t.bgCard, border: `1px solid ${t.border}`,
            borderRadius: 10, padding: "6px 12px", color: t.textDim, fontSize: 18,
            display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = t.purpleDim}
            onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
            🎙
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto", padding: "20px 16px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {messages.map((msg, i) => (
          <div key={msg.id} className="slideIn" style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "80%", animationDelay: `${i * 0.05}s`,
          }}>
            <div style={{
              padding: "14px 18px", borderRadius: 20,
              borderBottomRightRadius: msg.role === "user" ? 6 : 20,
              borderBottomLeftRadius: msg.role === "user" ? 20 : 6,
              background: msg.role === "user"
                ? `linear-gradient(135deg, ${t.purpleDim}, ${t.purple})`
                : t.bgCard,
              border: msg.role === "user" ? "none" : `1px solid ${t.border}`,
              fontSize: 15, lineHeight: 1.65, color: t.text,
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="fadeIn" style={{
            alignSelf: "flex-start", padding: "14px 18px", borderRadius: 20,
            borderBottomLeftRadius: 6, background: t.bgCard, border: `1px solid ${t.border}`,
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", background: t.purpleDim,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px 24px", borderTop: `1px solid ${t.border}`,
        background: `${t.bg}EE`, backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Say something..."
            rows={1}
            style={{
              flex: 1, padding: "14px 18px", borderRadius: 18, resize: "none",
              background: t.bgInput, border: `1.5px solid ${t.border}`,
              color: t.text, fontSize: 15, lineHeight: 1.4, maxHeight: 120,
            }}
            onFocus={e => e.target.style.borderColor = t.purpleDim}
            onBlur={e => e.target.style.borderColor = t.border}
          />
          <button onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{
              width: 48, height: 48, borderRadius: 16,
              background: input.trim()
                ? `linear-gradient(135deg, ${t.purple}, ${t.accent})`
                : t.bgCard,
              border: `1px solid ${input.trim() ? "transparent" : t.border}`,
              color: "#fff", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.3s", opacity: input.trim() ? 1 : 0.5,
            }}>↑</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Toolbox
// ═══════════════════════════════════════
function ToolboxScreen({ onSelect, onBack }) {
  const tools = [
    { id: "breathing", icon: "🌬", title: "Box Breathing", desc: "Calm your nervous system in 4 minutes", tag: "Anxiety Relief" },
    { id: "grounding", icon: "🌿", title: "5-4-3-2-1 Grounding", desc: "Reconnect to the present moment", tag: "Panic & Dissociation" },
    { id: "thoughtRecord", icon: "📝", title: "Thought Record", desc: "Challenge unhelpful thinking patterns", tag: "CBT Technique" },
  ];
  return (
    <div style={{
      minHeight: "100vh", padding: "24px 20px 100px", maxWidth: 520, margin: "0 auto",
    }}>
      <div className="fadeUp" style={{ marginBottom: 28, paddingTop: 16 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28 }}>Coping Toolbox</h1>
        <p style={{ color: t.textDim, fontSize: 14, marginTop: 6 }}>
          Evidence-based exercises you can use right now.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tools.map(tool => (
          <Card key={tool.id} onClick={() => onSelect(tool.id)} style={{ padding: 20 }}>
            <div className="fadeUp" style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: `${t.purple}18`, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 26, flexShrink: 0,
              }}>{tool.icon}</div>
              <div>
                <span style={{
                  fontSize: 11, color: t.accent, fontWeight: 600, letterSpacing: 0.5,
                }}>{tool.tag}</span>
                <p style={{ fontWeight: 600, fontSize: 16, marginTop: 2 }}>{tool.title}</p>
                <p style={{ color: t.textDim, fontSize: 13, marginTop: 2 }}>{tool.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// TOOL: Box Breathing
// ═══════════════════════════════════════
function BreathingScreen({ onBack }) {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("ready");
  const [timeLeft, setTimeLeft] = useState(4);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef(null);

  const PHASES = ["inhale", "hold1", "exhale", "hold2"];
  const LABELS = { ready: "Tap to begin", inhale: "Breathe in", hold1: "Hold", exhale: "Breathe out", hold2: "Hold" };

  const start = () => {
    setRunning(true);
    setCycles(0);
    let pi = 0;
    let sec = 4;
    setPhase(PHASES[0]);
    setTimeLeft(4);

    intervalRef.current = setInterval(() => {
      sec--;
      setTimeLeft(sec);
      if (sec <= 0) {
        pi++;
        if (pi >= PHASES.length) {
          pi = 0;
          setCycles(c => c + 1);
        }
        setPhase(PHASES[pi]);
        sec = 4;
        setTimeLeft(4);
      }
    }, 1000);
  };

  const stop = () => {
    setRunning(false);
    setPhase("ready");
    setTimeLeft(4);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const circleSize = phase === "inhale" || phase === "hold1" ? 200 : phase === "exhale" || phase === "hold2" ? 120 : 160;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24, position: "relative",
    }}>
      <GlowOrb size={400} top="30%" left="20%" opacity={0.1} />

      <button onClick={onBack} style={{
        position: "absolute", top: 24, left: 24, background: "none",
        border: "none", color: t.textDim, fontSize: 20,
      }}>←</button>

      <div style={{ textAlign: "center", zIndex: 1 }}>
        <p style={{ color: t.accent, fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>
          BOX BREATHING
        </p>
        <p style={{ color: t.textDim, fontSize: 14, marginBottom: 48 }}>
          4 seconds in, hold, out, hold. Repeat.
        </p>

        {/* Breathing Circle */}
        <div style={{
          width: 220, height: 220, margin: "0 auto 40px",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <div style={{
            width: circleSize, height: circleSize, borderRadius: "50%",
            background: `radial-gradient(circle, ${t.purple}44 0%, ${t.purpleDark}22 100%)`,
            border: `2px solid ${t.purple}66`,
            transition: "all 4s ease-in-out",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column",
          }}>
            {running && (
              <span style={{ fontSize: 32, fontWeight: 700, color: t.purpleLight }}>{timeLeft}</span>
            )}
          </div>
        </div>

        <p style={{
          fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 8,
          color: running ? t.purpleLight : t.textDim,
        }}>
          {LABELS[phase]}
        </p>

        {running && (
          <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 32 }}>
            Cycle {cycles + 1}
          </p>
        )}

        <div style={{ marginTop: 24 }}>
          {!running ? (
            <Button onClick={start}>Start breathing</Button>
          ) : (
            <Button variant="secondary" onClick={stop}>Stop</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// TOOL: 5-4-3-2-1 Grounding
// ═══════════════════════════════════════
function GroundingScreen({ onBack }) {
  const [step, setStep] = useState(-1); // -1 = intro
  const [done, setDone] = useState(false);

  const steps = [
    { count: 5, sense: "SEE", prompt: "Look around and notice 5 things you can see.", detail: "A color on the wall, light through a window, texture of your desk..." },
    { count: 4, sense: "TOUCH", prompt: "Notice 4 things you can physically feel.", detail: "Your feet on the floor, fabric on your skin, the temperature of the air..." },
    { count: 3, sense: "HEAR", prompt: "Listen for 3 things you can hear.", detail: "A distant hum, your own breathing, birds outside..." },
    { count: 2, sense: "SMELL", prompt: "Notice 2 things you can smell.", detail: "Coffee, fresh air, your shampoo, anything at all..." },
    { count: 1, sense: "TASTE", prompt: "Notice 1 thing you can taste.", detail: "The inside of your mouth, a lingering flavor, or take a sip of water..." },
  ];

  const advance = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else setDone(true);
  };

  if (done) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <div className="fadeUp" style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: "0 auto 24px",
            background: `${t.green}22`, border: `2px solid ${t.green}44`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
          }}>🌿</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 12 }}>
            You're here. You're present.
          </h2>
          <p style={{ color: t.textDim, fontSize: 15, lineHeight: 1.7, marginBottom: 36 }}>
            Take a slow breath. Notice how your body feels right now compared to when you started.
          </p>
          <Button onClick={onBack}>Done</Button>
        </div>
      </div>
    );
  }

  if (step === -1) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <button onClick={onBack} style={{
          position: "absolute", top: 24, left: 24, background: "none",
          border: "none", color: t.textDim, fontSize: 20,
        }}>←</button>
        <div className="fadeUp" style={{ textAlign: "center", maxWidth: 400 }}>
          <p style={{ color: t.accent, fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>
            5-4-3-2-1 GROUNDING
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 12 }}>
            Reconnect to right now.
          </h2>
          <p style={{ color: t.textDim, fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
            This exercise uses your five senses to pull you out of anxious thoughts and back into the present moment. Take your time with each step.
          </p>
          <Button onClick={() => setStep(0)}>Begin</Button>
        </div>
      </div>
    );
  }

  const s = steps[step];
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24, position: "relative",
    }}>
      <GlowOrb size={300} top="20%" right="-10%" opacity={0.08} />

      {/* Progress */}
      <div style={{
        position: "absolute", top: 24, left: 24, right: 24,
        height: 4, background: t.border, borderRadius: 4, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${((step + 1) / steps.length) * 100}%`,
          background: `linear-gradient(90deg, ${t.purple}, ${t.accent})`,
          transition: "width 0.5s ease", borderRadius: 4,
        }} />
      </div>

      <div className="fadeUp" key={step} style={{ textAlign: "center", maxWidth: 400, zIndex: 1 }}>
        <div style={{
          fontSize: 64, fontWeight: 700, fontFamily: "'Playfair Display', serif",
          background: `linear-gradient(135deg, ${t.purpleLight}, ${t.accent})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 8,
        }}>{s.count}</div>
        <p style={{ color: t.accent, fontSize: 13, fontWeight: 600, letterSpacing: 1, marginBottom: 16 }}>
          {s.sense}
        </p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 12, lineHeight: 1.4 }}>
          {s.prompt}
        </h2>
        <p style={{ color: t.textDim, fontSize: 14, lineHeight: 1.6, marginBottom: 48 }}>
          {s.detail}
        </p>
        <Button onClick={advance}>
          {step < steps.length - 1 ? "Next →" : "Finish"}
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// TOOL: Thought Record (CBT)
// ═══════════════════════════════════════
function ThoughtRecordScreen({ onSave, onBack }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ situation: "", thought: "", emotion: "", intensity: 5, evidenceFor: "", evidenceAgainst: "", balanced: "" });

  const update = (k, v) => setData(p => ({ ...p, [k]: v }));

  const prompts = [
    { key: "situation", title: "What happened?", sub: "Describe the situation briefly — just the facts.", placeholder: "e.g. My friend didn't reply to my text for 3 hours" },
    { key: "thought", title: "What went through your mind?", sub: "The automatic thought that showed up.", placeholder: "e.g. They're ignoring me. I said something wrong." },
    { key: "emotion", title: "What did you feel?", sub: "Name the emotion and rate its intensity.", placeholder: "e.g. Anxious, rejected" },
    { key: "evidenceFor", title: "Evidence that supports this thought?", sub: "What facts support your automatic thought?", placeholder: "e.g. They usually reply within an hour" },
    { key: "evidenceAgainst", title: "Evidence against this thought?", sub: "What facts suggest it might not be completely true?", placeholder: "e.g. They mentioned being busy today. They've been a good friend for years." },
    { key: "balanced", title: "A more balanced thought?", sub: "Knowing all the evidence, what's a more realistic way to see this?", placeholder: "e.g. They're probably just busy. One late reply doesn't mean they're upset with me." },
  ];

  if (step >= prompts.length) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <div className="fadeUp" style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: "0 auto 24px",
            background: `${t.green}22`, border: `2px solid ${t.green}44`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
          }}>✓</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 12 }}>
            Well done.
          </h2>
          <p style={{ color: t.textDim, fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>
            You just challenged an unhelpful thought pattern. That takes real self-awareness.
          </p>

          <Card style={{ textAlign: "left", marginBottom: 32 }}>
            <p style={{ color: t.textMuted, fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>YOUR BALANCED THOUGHT</p>
            <p style={{ fontSize: 16, lineHeight: 1.6, fontStyle: "italic", color: t.purpleLight }}>
              "{data.balanced}"
            </p>
          </Card>

          <Button onClick={() => { onSave(data); onBack(); }}>Done</Button>
        </div>
      </div>
    );
  }

  const p = prompts[step];
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <button onClick={onBack} style={{
        position: "absolute", top: 24, left: 24, background: "none",
        border: "none", color: t.textDim, fontSize: 20,
      }}>←</button>

      {/* Progress */}
      <div style={{
        position: "absolute", top: 24, left: 64, right: 24,
        height: 4, background: t.border, borderRadius: 4, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${((step + 1) / prompts.length) * 100}%`,
          background: `linear-gradient(90deg, ${t.purple}, ${t.accent})`,
          transition: "width 0.5s ease", borderRadius: 4,
        }} />
      </div>

      <div className="fadeUp" key={step} style={{ maxWidth: 440, width: "100%", zIndex: 1 }}>
        <p style={{ color: t.accent, fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>
          THOUGHT RECORD — STEP {step + 1} OF {prompts.length}
        </p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 8 }}>
          {p.title}
        </h2>
        <p style={{ color: t.textDim, fontSize: 14, marginBottom: 28 }}>{p.sub}</p>

        <textarea
          value={data[p.key]}
          onChange={e => update(p.key, e.target.value)}
          placeholder={p.placeholder}
          rows={4}
          style={{
            width: "100%", padding: "16px 20px", borderRadius: 16,
            background: t.bgInput, border: `1.5px solid ${t.border}`,
            color: t.text, fontSize: 15, lineHeight: 1.6, resize: "none",
            marginBottom: 8,
          }}
          onFocus={e => e.target.style.borderColor = t.purpleDim}
          onBlur={e => e.target.style.borderColor = t.border}
        />

        {p.key === "emotion" && (
          <div style={{ marginBottom: 16, marginTop: 12 }}>
            <p style={{ color: t.textDim, fontSize: 13, marginBottom: 8 }}>
              Intensity: {data.intensity}/10
            </p>
            <input type="range" min={1} max={10} value={data.intensity}
              onChange={e => update("intensity", parseInt(e.target.value))}
              style={{ width: "100%", accentColor: t.purple }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>← Back</Button>
          )}
          <Button onClick={() => setStep(step + 1)} disabled={!data[p.key].trim()}>
            {step < prompts.length - 1 ? "Next →" : "See result"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Journal
// ═══════════════════════════════════════
function JournalScreen({ entries, onSave, onBack }) {
  const [mode, setMode] = useState(null); // null = picker, "gratitude" | "freewrite" | "history"
  const [text, setText] = useState("");
  const [g1, setG1] = useState(""); const [g2, setG2] = useState(""); const [g3, setG3] = useState("");
  const [saved, setSaved] = useState(false);

  const prompt = JOURNAL_PROMPTS[new Date().getDate() % JOURNAL_PROMPTS.length];

  if (mode === "history") {
    return (
      <div style={{ minHeight: "100vh", padding: "24px 20px 100px", maxWidth: 520, margin: "0 auto" }}>
        <button onClick={() => setMode(null)} style={{
          background: "none", border: "none", color: t.textDim, fontSize: 20, marginBottom: 24,
        }}>← Back</button>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 24 }}>
          Past Entries
        </h2>
        {entries.length === 0 ? (
          <p style={{ color: t.textDim, fontSize: 15 }}>No entries yet. Start writing!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...entries].reverse().map((entry, i) => (
              <Card key={i} style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{
                    fontSize: 11, color: t.accent, fontWeight: 600, letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}>{entry.type}</span>
                  <span style={{ fontSize: 12, color: t.textMuted }}>{dateStr(entry.ts)}</span>
                </div>
                <p style={{ color: t.textDim, fontSize: 14, lineHeight: 1.6 }}>
                  {entry.preview}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (mode === "gratitude") {
    if (saved) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div className="fadeUp" style={{ textAlign: "center", maxWidth: 380 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 12 }}>
              Saved.
            </h2>
            <p style={{ color: t.textDim, fontSize: 15, marginBottom: 32 }}>
              Gratitude rewires your brain to notice the good. Keep showing up.
            </p>
            <Button onClick={onBack}>Done</Button>
          </div>
        </div>
      );
    }
    return (
      <div style={{
        minHeight: "100vh", padding: "24px 20px", maxWidth: 520, margin: "0 auto",
      }}>
        <button onClick={() => setMode(null)} style={{
          background: "none", border: "none", color: t.textDim, fontSize: 20, marginBottom: 24,
        }}>← Back</button>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 8 }}>
          Three good things.
        </h2>
        <p style={{ color: t.textDim, fontSize: 14, marginBottom: 32 }}>
          They can be small. A good coffee. A kind word. Sunlight.
        </p>
        {[
          { val: g1, set: setG1, n: 1 },
          { val: g2, set: setG2, n: 2 },
          { val: g3, set: setG3, n: 3 },
        ].map(({ val, set, n }) => (
          <div key={n} style={{ marginBottom: 16 }}>
            <label style={{ color: t.textMuted, fontSize: 12, marginBottom: 6, display: "block" }}>{n}.</label>
            <input value={val} onChange={e => set(e.target.value)}
              placeholder="Something good..."
              style={{
                width: "100%", padding: "14px 18px", borderRadius: 14,
                background: t.bgInput, border: `1.5px solid ${t.border}`,
                color: t.text, fontSize: 15,
              }}
              onFocus={e => e.target.style.borderColor = t.purpleDim}
              onBlur={e => e.target.style.borderColor = t.border}
            />
          </div>
        ))}
        <div style={{ marginTop: 24 }}>
          <Button onClick={() => {
            onSave({
              type: "gratitude", ts: Date.now(),
              content: { items: [g1, g2, g3].filter(Boolean) },
              preview: [g1, g2, g3].filter(Boolean).join(". "),
            });
            setSaved(true);
          }} disabled={!g1.trim()}>Save</Button>
        </div>
      </div>
    );
  }

  if (mode === "freewrite") {
    if (saved) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div className="fadeUp" style={{ textAlign: "center", maxWidth: 380 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 12 }}>Saved.</h2>
            <p style={{ color: t.textDim, fontSize: 15, marginBottom: 32 }}>
              Writing is how the mind makes sense of chaos. Well done.
            </p>
            <Button onClick={onBack}>Done</Button>
          </div>
        </div>
      );
    }
    return (
      <div style={{ minHeight: "100vh", padding: "24px 20px", maxWidth: 520, margin: "0 auto" }}>
        <button onClick={() => setMode(null)} style={{
          background: "none", border: "none", color: t.textDim, fontSize: 20, marginBottom: 24,
        }}>← Back</button>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 8 }}>
          Free write.
        </h2>
        <p style={{ color: t.textDim, fontSize: 14, marginBottom: 8 }}>Today's prompt (optional):</p>
        <p style={{
          fontStyle: "italic", color: t.purpleLight, fontSize: 15,
          marginBottom: 32, lineHeight: 1.6,
        }}>"{prompt}"</p>
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="No filters. Just write."
          rows={12}
          style={{
            width: "100%", padding: "16px 20px", borderRadius: 16,
            background: t.bgInput, border: `1.5px solid ${t.border}`,
            color: t.text, fontSize: 15, lineHeight: 1.6, resize: "none",
            marginBottom: 24,
          }}
          onFocus={e => e.target.style.borderColor = t.purpleDim}
          onBlur={e => e.target.style.borderColor = t.border}
        />
        <Button onClick={() => {
          onSave({
            type: "freewrite", ts: Date.now(),
            content: { text },
            preview: text.slice(0, 120) + (text.length > 120 ? "..." : ""),
          });
          setSaved(true);
        }} disabled={!text.trim()}>Save entry</Button>
      </div>
    );
  }

  // Mode picker
  return (
    <div style={{ minHeight: "100vh", padding: "24px 20px 100px", maxWidth: 520, margin: "0 auto" }}>
      <div className="fadeUp" style={{ marginBottom: 28, paddingTop: 16 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28 }}>Journal</h1>
        <p style={{ color: t.textDim, fontSize: 14, marginTop: 6 }}>
          Writing is thinking on paper.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Card onClick={() => setMode("gratitude")} style={{ padding: 20 }}>
          <div className="fadeUp" style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `${t.green}18`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 24, flexShrink: 0,
            }}>🌱</div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 16 }}>Gratitude</p>
              <p style={{ color: t.textDim, fontSize: 13 }}>Three good things from today</p>
            </div>
          </div>
        </Card>
        <Card onClick={() => setMode("freewrite")} style={{ padding: 20 }}>
          <div className="fadeUp" style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `${t.purple}18`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 24, flexShrink: 0,
            }}>✍️</div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 16 }}>Free Write</p>
              <p style={{ color: t.textDim, fontSize: 13 }}>Whatever's on your mind, with a daily prompt</p>
            </div>
          </div>
        </Card>
        <Card onClick={() => setMode("history")} style={{ padding: 20 }}>
          <div className="fadeUp" style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `${t.amber}18`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 24, flexShrink: 0,
            }}>📚</div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 16 }}>Past Entries</p>
              <p style={{ color: t.textDim, fontSize: 13 }}>{entries.length} entries saved</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Weekly Assessment (PHQ-2 + GAD-2)
// ═══════════════════════════════════════
function AssessmentScreen({ onSave, onBack }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);

  const allQs = [
    ...PHQ2.map((q, i) => ({ q, type: "phq2", idx: i })),
    ...GAD2.map((q, i) => ({ q, type: "gad2", idx: i })),
  ];

  if (step >= allQs.length) {
    const phq2 = answers.filter(a => a.type === "phq2").reduce((s, a) => s + a.score, 0);
    const gad2 = answers.filter(a => a.type === "gad2").reduce((s, a) => s + a.score, 0);

    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <div className="fadeUp" style={{ textAlign: "center", maxWidth: 400 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 24 }}>
            Your results
          </h2>
          <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
            <Card style={{ flex: 1, textAlign: "center" }}>
              <p style={{ color: t.textMuted, fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>PHQ-2</p>
              <p style={{
                fontSize: 36, fontWeight: 700, fontFamily: "'Playfair Display', serif",
                color: phq2 >= 3 ? t.amber : t.green,
              }}>{phq2}</p>
              <p style={{ color: t.textDim, fontSize: 12, marginTop: 4 }}>of 6</p>
            </Card>
            <Card style={{ flex: 1, textAlign: "center" }}>
              <p style={{ color: t.textMuted, fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>GAD-2</p>
              <p style={{
                fontSize: 36, fontWeight: 700, fontFamily: "'Playfair Display', serif",
                color: gad2 >= 3 ? t.amber : t.green,
              }}>{gad2}</p>
              <p style={{ color: t.textDim, fontSize: 12, marginTop: 4 }}>of 6</p>
            </Card>
          </div>
          <p style={{ color: t.textDim, fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>
            {(phq2 >= 3 || gad2 >= 3)
              ? "Your scores suggest you may be experiencing some difficulty. This isn't a diagnosis — it's a signal to pay attention and be gentle with yourself."
              : "Your scores are in a healthy range. Keep tracking weekly to notice patterns over time."
            }
          </p>
          {(phq2 >= 3 || gad2 >= 3) && (
            <p style={{ color: t.purpleLight, fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
              Consider talking to a professional if these feelings persist. That's not weakness — that's wisdom.
            </p>
          )}
          <Button onClick={() => {
            onSave({ phq2, gad2, ts: Date.now() });
            onBack();
          }}>Done</Button>
        </div>
      </div>
    );
  }

  const current = allQs[step];
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <button onClick={onBack} style={{
        position: "absolute", top: 24, left: 24, background: "none",
        border: "none", color: t.textDim, fontSize: 20,
      }}>←</button>

      <div style={{
        position: "absolute", top: 24, left: 64, right: 24,
        height: 4, background: t.border, borderRadius: 4, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${((step + 1) / allQs.length) * 100}%`,
          background: `linear-gradient(90deg, ${t.purple}, ${t.accent})`,
          transition: "width 0.5s ease", borderRadius: 4,
        }} />
      </div>

      <div className="fadeUp" key={step} style={{ maxWidth: 440, width: "100%" }}>
        <p style={{ color: t.textMuted, fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>
          OVER THE PAST 2 WEEKS
        </p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 32, lineHeight: 1.4 }}>
          {current.q}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SCORE_LABELS.map((label, score) => (
            <button key={score} onClick={() => {
              setAnswers(p => [...p, { type: current.type, score }]);
              setStep(step + 1);
            }} style={{
              padding: "16px 20px", borderRadius: 16, fontSize: 15,
              background: t.bgCard, border: `1.5px solid ${t.border}`,
              color: t.text, textAlign: "left", transition: "all 0.2s",
            }}
              onMouseEnter={e => e.target.style.borderColor = t.purpleDim}
              onMouseLeave={e => e.target.style.borderColor = t.border}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Insights
// ═══════════════════════════════════════
function InsightsScreen({ moods, assessments, journalEntries, sessions }) {
  const streak = getStreak(moods);
  const recent14 = moods.slice(-14);

  const emotionCounts = {};
  moods.slice(-30).forEach(m => m.emotions.forEach(e => {
    emotionCounts[e] = (emotionCounts[e] || 0) + 1;
  }));
  const topEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const avgMood = recent14.length > 0
    ? (recent14.reduce((s, m) => s + m.mood, 0) / recent14.length).toFixed(1)
    : null;

  return (
    <div style={{
      minHeight: "100vh", padding: "24px 20px 100px", maxWidth: 520, margin: "0 auto",
    }}>
      <div className="fadeUp" style={{ marginBottom: 28, paddingTop: 16 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28 }}>Insights</h1>
        <p style={{ color: t.textDim, fontSize: 14, marginTop: 6 }}>
          Your patterns tell a story. Here's what we see.
        </p>
      </div>

      {/* Stats Row */}
      <div className="fadeUp" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Card style={{ padding: 16, textAlign: "center" }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: t.amber }}>{streak}</p>
          <p style={{ color: t.textMuted, fontSize: 11 }}>Day streak</p>
        </Card>
        <Card style={{ padding: 16, textAlign: "center" }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: t.purple }}>{sessions.length}</p>
          <p style={{ color: t.textMuted, fontSize: 11 }}>Sessions</p>
        </Card>
        <Card style={{ padding: 16, textAlign: "center" }}>
          <p style={{ fontSize: 28, fontWeight: 700, color: t.green }}>{journalEntries.length}</p>
          <p style={{ color: t.textMuted, fontSize: 11 }}>Journal entries</p>
        </Card>
      </div>

      {/* Avg Mood */}
      {avgMood && (
        <Card style={{ marginBottom: 16 }}>
          <div className="fadeUp">
            <p style={{ color: t.textMuted, fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>
              AVERAGE MOOD (2 WEEKS)
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{
                fontSize: 42, fontWeight: 700, fontFamily: "'Playfair Display', serif",
                background: `linear-gradient(135deg, ${t.purple}, ${t.accent})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>{avgMood}</span>
              <span style={{ color: t.textDim, fontSize: 14 }}>/ 5</span>
            </div>
          </div>
        </Card>
      )}

      {/* Mood Chart */}
      {recent14.length > 1 && (
        <Card style={{ marginBottom: 16 }}>
          <div className="fadeUp">
            <p style={{ color: t.textMuted, fontSize: 12, letterSpacing: 1, marginBottom: 16 }}>
              MOOD TREND
            </p>
            <svg width="100%" viewBox={`0 0 ${Math.max(recent14.length * 30, 100)} 100`}
              style={{ overflow: "visible" }}>
              {[1, 2, 3, 4, 5].map(level => (
                <line key={level}
                  x1={0} x2={recent14.length * 30}
                  y1={100 - level * 18} y2={100 - level * 18}
                  stroke={t.border} strokeWidth={1} />
              ))}
              <polyline
                points={recent14.map((m, i) => `${i * 30 + 10},${100 - m.mood * 18}`).join(" ")}
                fill="none" stroke={t.purple} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              />
              {recent14.map((m, i) => (
                <circle key={i}
                  cx={i * 30 + 10} cy={100 - m.mood * 18} r={4}
                  fill={MOOD_COLORS[m.mood]} stroke={t.bg} strokeWidth={2}
                />
              ))}
            </svg>
            <div style={{
              display: "flex", justifyContent: "space-between", marginTop: 8, padding: "0 4px",
            }}>
              {recent14.length > 0 && (
                <>
                  <span style={{ fontSize: 10, color: t.textMuted }}>{dateStr(recent14[0].ts)}</span>
                  <span style={{ fontSize: 10, color: t.textMuted }}>{dateStr(recent14[recent14.length - 1].ts)}</span>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Top Emotions */}
      {topEmotions.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div className="fadeUp">
            <p style={{ color: t.textMuted, fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>
              MOST FREQUENT EMOTIONS (30 DAYS)
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topEmotions.map(([emotion, count]) => (
                <div key={emotion} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 14, color: t.text, width: 100 }}>{emotion}</span>
                  <div style={{ flex: 1, height: 8, background: t.border, borderRadius: 4 }}>
                    <div style={{
                      height: "100%", borderRadius: 4,
                      width: `${(count / topEmotions[0][1]) * 100}%`,
                      background: `linear-gradient(90deg, ${t.purple}, ${t.accent})`,
                    }} />
                  </div>
                  <span style={{ fontSize: 12, color: t.textMuted, width: 24, textAlign: "right" }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Assessment History */}
      {assessments.length > 0 && (
        <Card>
          <div className="fadeUp">
            <p style={{ color: t.textMuted, fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>
              ASSESSMENT SCORES
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...assessments].reverse().slice(0, 5).map((a, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 0", borderBottom: i < 4 ? `1px solid ${t.border}` : "none",
                }}>
                  <span style={{ fontSize: 13, color: t.textDim }}>{dateStr(a.ts)}</span>
                  <div style={{ display: "flex", gap: 16 }}>
                    <span style={{ fontSize: 13, color: a.phq2 >= 3 ? t.amber : t.green }}>
                      PHQ-2: {a.phq2}
                    </span>
                    <span style={{ fontSize: 13, color: a.gad2 >= 3 ? t.amber : t.green }}>
                      GAD-2: {a.gad2}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {moods.length === 0 && assessments.length === 0 && (
        <Card>
          <p style={{ color: t.textDim, fontSize: 15, textAlign: "center", padding: 20 }}>
            Start tracking your mood and taking weekly assessments to see your patterns here.
          </p>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState(() => S.get("profile", null) ? "home" : "welcome");
  const [profile, setProfile] = useState(() => S.get("profile", null));
  const [moods, setMoods] = useState(() => S.get("moods", []));
  const [sessions, setSessions] = useState(() => S.get("sessions", []));
  const [journalEntries, setJournalEntries] = useState(() => S.get("journal", []));
  const [assessments, setAssessments] = useState(() => S.get("assessments", []));
  const [personaId, setPersonaId] = useState(() => S.get("persona", "therapist"));
  const [showCrisis, setShowCrisis] = useState(false);

  const activePersona = PERSONAS.find(p => p.id === personaId) || PERSONAS[3];

  const saveMood = (entry) => {
    const updated = [...moods, entry];
    setMoods(updated);
    S.set("moods", updated);
    setScreen("home");
  };

  const saveSession = (session) => {
    const updated = [...sessions.filter(s => s.ts !== session.ts), session];
    setSessions(updated);
    S.set("sessions", updated);
  };

  const saveJournal = (entry) => {
    const updated = [...journalEntries, entry];
    setJournalEntries(updated);
    S.set("journal", updated);
  };

  const saveAssessment = (result) => {
    const updated = [...assessments, result];
    setAssessments(updated);
    S.set("assessments", updated);
  };

  const saveThoughtRecord = (data) => {
    saveJournal({
      type: "thought-record", ts: Date.now(),
      content: data,
      preview: `"${data.thought}" → "${data.balanced}"`,
    });
  };

  const navigate = (s) => setScreen(s);

  const showNav = ["home", "chat", "toolbox", "journal", "insights", "persona"].includes(screen);

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ minHeight: "100vh", background: t.bg, color: t.text }}>

        {showCrisis && <CrisisOverlay onClose={() => setShowCrisis(false)} />}
        {profile && screen !== "welcome" && screen !== "setup" && (
          <SOSButton onClick={() => setShowCrisis(true)} />
        )}

        {screen === "welcome" && (
          <WelcomeScreen onStart={() => setScreen("setup")} />
        )}

        {screen === "setup" && (
          <SetupScreen onComplete={(p) => {
            setProfile(p);
            S.set("profile", p);
            setScreen("home");
          }} />
        )}

        {screen === "home" && profile && (
          <HomeScreen
            profile={profile}
            moods={moods}
            assessments={assessments}
            persona={activePersona}
            onNav={navigate}
            onMoodCheckin={() => setScreen("moodCheckin")}
          />
        )}

        {screen === "moodCheckin" && (
          <MoodCheckinScreen onSave={saveMood} onBack={() => setScreen("home")} />
        )}

        {screen === "persona" && (
          <PersonaPickerScreen
            current={personaId}
            onSelect={(id) => { setPersonaId(id); S.set("persona", id); setScreen("home"); }}
            onBack={() => setScreen("home")}
          />
        )}

        {screen === "chat" && profile && (
          <ChatScreen
            profile={profile}
            moods={moods}
            sessions={sessions}
            persona={activePersona}
            onSaveSession={saveSession}
            onBack={() => setScreen("home")}
            onShowCrisis={() => setShowCrisis(true)}
          />
        )}

        {screen === "toolbox" && (
          <ToolboxScreen onSelect={navigate} onBack={() => setScreen("home")} />
        )}

        {screen === "breathing" && (
          <BreathingScreen onBack={() => setScreen("toolbox")} />
        )}

        {screen === "grounding" && (
          <GroundingScreen onBack={() => setScreen("toolbox")} />
        )}

        {screen === "thoughtRecord" && (
          <ThoughtRecordScreen onSave={saveThoughtRecord} onBack={() => setScreen("toolbox")} />
        )}

        {screen === "journal" && (
          <JournalScreen entries={journalEntries} onSave={saveJournal} onBack={() => setScreen("home")} />
        )}

        {screen === "assessment" && (
          <AssessmentScreen onSave={saveAssessment} onBack={() => setScreen("home")} />
        )}

        {screen === "insights" && (
          <InsightsScreen
            moods={moods}
            assessments={assessments}
            journalEntries={journalEntries}
            sessions={sessions}
          />
        )}

        {showNav && screen !== "chat" && (
          <BottomNav active={screen} onNav={navigate} />
        )}
      </div>
    </>
  );
}

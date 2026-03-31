import { useState, useEffect, useRef, useCallback } from "react";

const APP_NAME = "Solace";

// ─── Theme ───
const theme = {
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
  amber: "#FCD34D",
  red: "#FCA5A5",
  text: "#F0ECF7",
  textDim: "#9B8FBF",
  textMuted: "#6B5F85",
  border: "#2A2438",
};

// ─── Styles ───
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: ${theme.bg}; color: ${theme.text}; font-family: 'DM Sans', sans-serif; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-12px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes breathe {
    0%, 100% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.08); opacity: 1; }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .fadeUp { animation: fadeUp 0.6s ease both; }
  .fadeIn { animation: fadeIn 0.5s ease both; }
  .slideIn { animation: slideIn 0.4s ease both; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${theme.purpleDark}; border-radius: 4px; }

  input, textarea, select {
    font-family: 'DM Sans', sans-serif;
    outline: none;
  }
  button {
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    border: none;
    outline: none;
  }
`;

// ─── MBTI Questions (shortened set) ───
const mbtiQuestions = [
  { q: "At a gathering, you tend to...", a: "Talk to many people, including strangers", b: "Talk mostly to people you already know", dim: "EI" },
  { q: "You're more drawn to...", a: "What's real and actual", b: "What's possible and imagined", dim: "SN" },
  { q: "When making decisions, you value...", a: "Logic and consistency", b: "Harmony and compassion", dim: "TF" },
  { q: "You prefer to...", a: "Have things decided and settled", b: "Keep your options open", dim: "JP" },
  { q: "You recharge by...", a: "Being around other people", b: "Having quiet alone time", dim: "EI" },
  { q: "You trust...", a: "Experience and concrete facts", b: "Gut feelings and hunches", dim: "SN" },
  { q: "In a disagreement, it's more important to...", a: "Be right", b: "Be kind", dim: "TF" },
  { q: "Your workspace is usually...", a: "Organized and tidy", b: "Flexible and spontaneous", dim: "JP" },
];

const attachmentQuestions = [
  { q: "When someone I'm close to pulls away, I...", a: "Feel anxious and try to get closer", b: "Give them space, it doesn't bother me much", c: "Feel hurt but pretend I don't care", dim: "attachment" },
  { q: "In relationships, I tend to...", a: "Worry they don't care as much as I do", b: "Feel comfortable with closeness and independence", c: "Keep people at arm's length", dim: "attachment" },
  { q: "When I'm upset, I prefer to...", a: "Talk to someone immediately", b: "Process it on my own first, then share", c: "Handle it alone — I don't like being vulnerable", dim: "attachment" },
];

function calcMBTI(answers) {
  const counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  answers.forEach(({ dim, choice }) => {
    if (dim === "EI") choice === "a" ? counts.E++ : counts.I++;
    else if (dim === "SN") choice === "a" ? counts.S++ : counts.N++;
    else if (dim === "TF") choice === "a" ? counts.T++ : counts.F++;
    else if (dim === "JP") choice === "a" ? counts.J++ : counts.P++;
  });
  return (counts.E >= counts.I ? "E" : "I") +
    (counts.S >= counts.N ? "S" : "N") +
    (counts.T >= counts.F ? "T" : "F") +
    (counts.J >= counts.P ? "J" : "P");
}

function calcAttachment(answers) {
  const styles = { anxious: 0, secure: 0, avoidant: 0 };
  answers.forEach(({ choice }) => {
    if (choice === "a") styles.anxious++;
    else if (choice === "b") styles.secure++;
    else styles.avoidant++;
  });
  const top = Object.entries(styles).sort((a, b) => b[1] - a[1])[0][0];
  return top.charAt(0).toUpperCase() + top.slice(1);
}

// ─── Problem categories ───
const problemCategories = [
  { id: "social", label: "Friends & Social", icon: "👥" },
  { id: "family", label: "Family & Parents", icon: "🏠" },
  { id: "romantic", label: "Romantic Relationships", icon: "💜" },
  { id: "mental", label: "Mental Health", icon: "🧠" },
  { id: "career", label: "Career & Purpose", icon: "🎯" },
  { id: "identity", label: "Identity & Self", icon: "🪞" },
];

// ─── System prompt for the AI (the 5-stage question flow) ───
function buildSystemPrompt(profile) {
  return `You are ${APP_NAME} — a wise, warm, honest companion. Not a therapist. Not a validator. A mirror that helps people understand themselves through the hardest things they need to say.

USER PROFILE:
- Name: ${profile.name}
- MBTI: ${profile.mbti}
- Attachment style: ${profile.attachment}
- Areas they want support with: ${profile.categories.join(", ")}

YOUR PERSONALITY:
- You speak like a wise best friend who also happens to have been in therapy
- You are warm but never fake. You never say "that sounds really hard" or "I hear you" — those are therapy-speak
- You use the user's own words and history to gently challenge their assumptions
- You are concise. You ask ONE question at a time. Never overwhelm.
- You adapt your communication style to their MBTI and attachment style
- You never diagnose, never project, never give toxic positivity
- When the user contradicts something they said earlier, you gently point it out — that's the most important moment

THE 5-STAGE CONVERSATION FRAMEWORK (follow this naturally, don't announce stages):

Stage 1 — The Surface: "Tell me what's going on." Just listen. Let them get it out. Reflect back briefly.

Stage 2 — The Underneath: Pick up on ONE emotional signal and reflect it as a question. "It sounds like part of you feels responsible for how they feel. Is that right?" or "What are you most afraid happens if you say this?"

Stage 3 — The Need: Help them figure out what they actually want. "Are you looking to be understood, to change something, or to decide if this still works for you?"

Stage 4 — The Fear: Name what's stopping them. "What's the worst realistic thing that could happen?" Naming the fear shrinks it.

Stage 5 — The Words: Only NOW offer language. Not a script — a starting point in their voice. Offer 2-3 tonal variations. Always say: these are just words, you can change them.

RULES:
- Never give advice until Stage 5
- Ask only ONE question per message
- Keep responses under 100 words unless reflecting back their full situation
- If this is the very first message, greet them warmly by name and ask what's on their mind today in a casual, friendly way
- Never break character or mention being an AI, stages, or frameworks`;
}

// ─── Components ───

function GlowOrb({ size = 300, top, left, right, opacity = 0.12 }) {
  return (
    <div style={{
      position: "absolute", top, left, right,
      width: size, height: size,
      background: `radial-gradient(circle, ${theme.purple}55 0%, transparent 70%)`,
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
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${theme.purple}, ${theme.accent})`,
      color: "#fff", boxShadow: `0 4px 24px ${theme.purpleGlow}`,
    },
    secondary: {
      background: "transparent", color: theme.purple,
      border: `1.5px solid ${theme.purpleDim}`,
    },
    ghost: {
      background: theme.purpleGlow, color: theme.purpleLight,
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], opacity: disabled ? 0.5 : 1, ...style }}
      onMouseEnter={e => { if (!disabled) e.target.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.target.style.transform = "translateY(0)"; }}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════
// SCREEN: Onboarding / Welcome
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
          background: `linear-gradient(135deg, ${theme.purple}, ${theme.accent})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, boxShadow: `0 8px 40px ${theme.purpleGlow}`,
        }}>✦</div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 600,
          marginBottom: 16,
          background: `linear-gradient(135deg, ${theme.purpleLight}, ${theme.accent})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>{APP_NAME}</h1>

        <p style={{
          fontFamily: "'Playfair Display', serif", fontStyle: "italic",
          color: theme.textDim, fontSize: 17, marginBottom: 12,
        }}>Not your therapist. Not your followers.</p>
        <p style={{
          fontFamily: "'Playfair Display', serif", fontStyle: "italic",
          color: theme.purpleLight, fontSize: 19, marginBottom: 48,
        }}>Your mirror.</p>

        <p style={{ color: theme.textDim, fontSize: 15, lineHeight: 1.7, marginBottom: 48 }}>
          A companion that helps you understand yourself through the hardest things you need to say.
        </p>

        <Button onClick={onStart}>Let's get to know you</Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Onboarding Name + Demographics
// ═══════════════════════════════════════
function NameScreen({ onNext }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24, position: "relative",
    }}>
      <GlowOrb size={300} top="10%" left="-10%" />

      <div className="fadeUp" style={{ maxWidth: 400, width: "100%", zIndex: 1 }}>
        <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 8, letterSpacing: 1 }}>STEP 1 OF 4</p>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 32, marginBottom: 8,
        }}>First, the basics.</h2>
        <p style={{ color: theme.textDim, fontSize: 15, marginBottom: 40 }}>
          What should we call you?
        </p>

        <div style={{ marginBottom: 24 }}>
          <label style={{ color: theme.textDim, fontSize: 13, marginBottom: 8, display: "block" }}>Your name</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Jordan"
            style={{
              width: "100%", padding: "16px 20px", borderRadius: 14,
              background: theme.bgInput, border: `1.5px solid ${theme.border}`,
              color: theme.text, fontSize: 16,
              transition: "border-color 0.3s",
            }}
            onFocus={e => e.target.style.borderColor = theme.purpleDim}
            onBlur={e => e.target.style.borderColor = theme.border}
          />
        </div>

        <div style={{ marginBottom: 40 }}>
          <label style={{ color: theme.textDim, fontSize: 13, marginBottom: 8, display: "block" }}>Age</label>
          <input
            value={age} onChange={e => setAge(e.target.value)}
            placeholder="e.g. 22" type="number"
            style={{
              width: "100%", padding: "16px 20px", borderRadius: 14,
              background: theme.bgInput, border: `1.5px solid ${theme.border}`,
              color: theme.text, fontSize: 16,
            }}
            onFocus={e => e.target.style.borderColor = theme.purpleDim}
            onBlur={e => e.target.style.borderColor = theme.border}
          />
        </div>

        <Button onClick={() => onNext({ name, age })} disabled={!name.trim()}>
          Continue →
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Personality Test (MBTI + Attachment)
// ═══════════════════════════════════════
function PersonalityTestScreen({ onComplete }) {
  const [phase, setPhase] = useState("mbti"); // mbti → attachment
  const [qIndex, setQIndex] = useState(0);
  const [mbtiAnswers, setMbtiAnswers] = useState([]);
  const [attachAnswers, setAttachAnswers] = useState([]);
  const [selected, setSelected] = useState(null);

  const questions = phase === "mbti" ? mbtiQuestions : attachmentQuestions;
  const current = questions[qIndex];
  const total = mbtiQuestions.length + attachmentQuestions.length;
  const progress = ((phase === "mbti" ? qIndex : mbtiQuestions.length + qIndex) / total) * 100;

  const handleSelect = (choice) => {
    setSelected(choice);
    setTimeout(() => {
      if (phase === "mbti") {
        const newAnswers = [...mbtiAnswers, { dim: current.dim, choice }];
        setMbtiAnswers(newAnswers);
        if (qIndex < mbtiQuestions.length - 1) {
          setQIndex(qIndex + 1);
        } else {
          setPhase("attachment");
          setQIndex(0);
        }
      } else {
        const newAnswers = [...attachAnswers, { dim: current.dim, choice }];
        setAttachAnswers(newAnswers);
        if (qIndex < attachmentQuestions.length - 1) {
          setQIndex(qIndex + 1);
        } else {
          const mbti = calcMBTI([...mbtiAnswers, { dim: current.dim, choice: choice }].filter(a => a.dim !== "attachment"));
          const attachment = calcAttachment(newAnswers);
          onComplete({ mbti, attachment });
        }
      }
      setSelected(null);
    }, 400);
  };

  const options = phase === "mbti"
    ? [{ key: "a", text: current.a }, { key: "b", text: current.b }]
    : [{ key: "a", text: current.a }, { key: "b", text: current.b }, { key: "c", text: current.c }];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24, position: "relative",
    }}>
      <GlowOrb size={250} top="5%" right="10%" />

      <div className="fadeUp" style={{ maxWidth: 480, width: "100%", zIndex: 1 }}>
        <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 8, letterSpacing: 1 }}>
          {phase === "mbti" ? "STEP 2 OF 4 — PERSONALITY" : "STEP 3 OF 4 — ATTACHMENT STYLE"}
        </p>

        {/* Progress bar */}
        <div style={{
          height: 4, background: theme.border, borderRadius: 4, marginBottom: 40, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", width: `${progress}%`, borderRadius: 4,
            background: `linear-gradient(90deg, ${theme.purple}, ${theme.accent})`,
            transition: "width 0.5s ease",
          }} />
        </div>

        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 40,
          lineHeight: 1.4,
        }}>{current.q}</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {options.map(opt => (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              style={{
                padding: "18px 24px", borderRadius: 16, fontSize: 15,
                background: selected === opt.key
                  ? `linear-gradient(135deg, ${theme.purpleDark}, ${theme.purple}33)`
                  : theme.bgCard,
                border: `1.5px solid ${selected === opt.key ? theme.purple : theme.border}`,
                color: theme.text, textAlign: "left", lineHeight: 1.5,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={e => {
                if (selected !== opt.key) e.target.style.borderColor = theme.purpleDim;
              }}
              onMouseLeave={e => {
                if (selected !== opt.key) e.target.style.borderColor = theme.border;
              }}
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Category Selection
// ═══════════════════════════════════════
function CategoryScreen({ onComplete }) {
  const [selected, setSelected] = useState([]);

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24, position: "relative",
    }}>
      <GlowOrb size={350} top="50%" left="-15%" />

      <div className="fadeUp" style={{ maxWidth: 480, width: "100%", zIndex: 1 }}>
        <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 8, letterSpacing: 1 }}>STEP 4 OF 4</p>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 30, marginBottom: 8,
        }}>What's on your mind?</h2>
        <p style={{ color: theme.textDim, fontSize: 15, marginBottom: 36 }}>
          Select the areas you'd like support with. Pick as many as you want.
        </p>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 40,
        }}>
          {problemCategories.map(cat => {
            const active = selected.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggle(cat.id)}
                style={{
                  padding: "20px 16px", borderRadius: 18, textAlign: "center",
                  background: active ? `${theme.purple}18` : theme.bgCard,
                  border: `1.5px solid ${active ? theme.purple : theme.border}`,
                  color: active ? theme.purpleLight : theme.textDim,
                  transition: "all 0.3s ease", fontSize: 14,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.icon}</div>
                {cat.label}
              </button>
            );
          })}
        </div>

        <Button onClick={() => onComplete(selected)} disabled={selected.length === 0}>
          I'm ready →
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Home
// ═══════════════════════════════════════
function HomeScreen({ profile, onOpenChat, onOpenJournal, streakDays, dares }) {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const connectionScore = 64 + streakDays * 2;
  const todayDare = dares[streakDays % dares.length];

  return (
    <div style={{
      minHeight: "100vh", padding: "24px 20px", position: "relative", maxWidth: 480,
      margin: "0 auto",
    }}>
      <GlowOrb size={250} top="-5%" right="-10%" opacity={0.08} />

      {/* Header */}
      <div className="fadeUp" style={{ marginBottom: 32, paddingTop: 16 }}>
        <p style={{ color: theme.textDim, fontSize: 14 }}>{greeting}, {profile.name}</p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 30, marginTop: 4,
        }}>How are you, really?</h1>
      </div>

      {/* Connection Score */}
      <div className="fadeUp" style={{
        background: theme.bgCard, borderRadius: 20, padding: "24px 24px 20px",
        border: `1px solid ${theme.border}`, marginBottom: 16, animationDelay: "0.1s",
      }}>
        <p style={{ color: theme.textDim, fontSize: 13, marginBottom: 12 }}>Your connection score</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{
            fontSize: 48, fontWeight: 700, fontFamily: "'Playfair Display', serif",
            background: `linear-gradient(135deg, ${theme.purple}, ${theme.accent})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>{connectionScore}</span>
          <span style={{ color: theme.green, fontSize: 14 }}>↑ {streakDays * 2} pts this week</span>
        </div>
        <div style={{
          height: 4, background: theme.border, borderRadius: 4, marginTop: 16,
        }}>
          <div style={{
            height: "100%", width: `${connectionScore}%`, borderRadius: 4,
            background: `linear-gradient(90deg, ${theme.purple}, ${theme.accent})`,
          }} />
        </div>
      </div>

      {/* Today's Dare */}
      <div className="fadeUp" style={{
        background: `linear-gradient(135deg, ${theme.purpleDark}88, ${theme.bgCard})`,
        borderRadius: 20, padding: 24, border: `1px solid ${theme.purpleDim}44`,
        marginBottom: 16, animationDelay: "0.2s",
      }}>
        <p style={{ color: theme.accent, fontSize: 12, fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>
          TODAY'S DARE
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>{todayDare}</p>
        <Button variant="ghost" style={{ padding: "10px 20px", fontSize: 13 }}>
          I did it ✦
        </Button>
      </div>

      {/* Streak */}
      <div className="fadeUp" style={{
        background: theme.bgCard, borderRadius: 20, padding: "20px 24px",
        border: `1px solid ${theme.border}`, marginBottom: 16, animationDelay: "0.3s",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ color: theme.textDim, fontSize: 13 }}>Current streak</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: theme.amber }}>{streakDays} days 🔥</p>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[...Array(7)].map((_, i) => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: "50%",
              background: i < streakDays % 7 ? theme.purple : theme.border,
            }} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="fadeUp" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
        marginBottom: 24, animationDelay: "0.4s",
      }}>
        <button onClick={onOpenChat} style={{
          padding: 24, borderRadius: 20, background: theme.bgCard,
          border: `1px solid ${theme.border}`, color: theme.text, textAlign: "left",
          transition: "all 0.3s",
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = theme.purpleDim}
          onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
        >
          <div style={{ fontSize: 28, marginBottom: 12 }}>💬</div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Talk to {APP_NAME}</p>
          <p style={{ color: theme.textMuted, fontSize: 12 }}>What's on your mind?</p>
        </button>
        <button onClick={onOpenJournal} style={{
          padding: 24, borderRadius: 20, background: theme.bgCard,
          border: `1px solid ${theme.border}`, color: theme.text, textAlign: "left",
          transition: "all 0.3s",
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = theme.purpleDim}
          onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}
        >
          <div style={{ fontSize: 28, marginBottom: 12 }}>📓</div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Journal</p>
          <p style={{ color: theme.textMuted, fontSize: 12 }}>Gratitude & reflection</p>
        </button>
      </div>

      {/* Kin noticed */}
      <div className="fadeUp" style={{
        background: theme.bgCard, borderRadius: 20, padding: "18px 24px",
        border: `1px solid ${theme.border}`, animationDelay: "0.5s",
      }}>
        <p style={{ color: theme.accent, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
          ✦ {APP_NAME} noticed
        </p>
        <p style={{ color: theme.textDim, fontSize: 14, lineHeight: 1.6 }}>
          You tend to open up more in the evenings. That's when your most honest conversations happen.
        </p>
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: `${theme.bg}EE`, backdropFilter: "blur(20px)",
        borderTop: `1px solid ${theme.border}`, padding: "12px 0 20px",
        display: "flex", justifyContent: "center", gap: 48,
      }}>
        {[
          { icon: "🏠", label: "Home", active: true },
          { icon: "💬", label: "Chat", onClick: onOpenChat },
          { icon: "📓", label: "Journal", onClick: onOpenJournal },
          { icon: "👤", label: "Profile" },
        ].map(item => (
          <button key={item.label} onClick={item.onClick} style={{
            background: "none", border: "none", color: item.active ? theme.purple : theme.textMuted,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontSize: 11,
          }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Chat (Live AI — 5-stage flow)
// ═══════════════════════════════════════
function ChatScreen({ profile, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  const callAI = useCallback(async (conversationMessages) => {
    setLoading(true);
    try {
      const apiMessages = conversationMessages.map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(profile),
          messages: apiMessages,
        }),
      });

      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "I'm here. Tell me more.";
      return text;
    } catch (err) {
      console.error(err);
      return "I'm having trouble connecting right now. Can you try again in a moment?";
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // Initial greeting
  useEffect(() => {
    if (!started) {
      setStarted(true);
      (async () => {
        const greeting = await callAI([{ role: "user", text: "Hi, I just opened the app." }]);
        setMessages([{ role: "assistant", text: greeting, id: Date.now() }]);
      })();
    }
  }, [started, callAI]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", text: input.trim(), id: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    const reply = await callAI(newMessages);
    setMessages(prev => [...prev, { role: "assistant", text: reply, id: Date.now() + 1 }]);
  };

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      maxWidth: 520, margin: "0 auto", position: "relative",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px", borderBottom: `1px solid ${theme.border}`,
        display: "flex", alignItems: "center", gap: 16,
        background: `${theme.bg}EE`, backdropFilter: "blur(20px)",
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", color: theme.textDim, fontSize: 20,
        }}>←</button>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: `linear-gradient(135deg, ${theme.purple}, ${theme.accent})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        }}>✦</div>
        <div>
          <p style={{ fontWeight: 600, fontSize: 15 }}>{APP_NAME}</p>
          <p style={{ color: theme.green, fontSize: 11 }}>● Online</p>
        </div>
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
                ? `linear-gradient(135deg, ${theme.purpleDim}, ${theme.purple})`
                : theme.bgCard,
              border: msg.role === "user" ? "none" : `1px solid ${theme.border}`,
              fontSize: 15, lineHeight: 1.65, color: theme.text,
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="fadeIn" style={{
            alignSelf: "flex-start", padding: "14px 18px", borderRadius: 20,
            borderBottomLeftRadius: 6, background: theme.bgCard,
            border: `1px solid ${theme.border}`,
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%", background: theme.purpleDim,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px 24px", borderTop: `1px solid ${theme.border}`,
        background: `${theme.bg}EE`, backdropFilter: "blur(20px)",
      }}>
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-end",
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Say something..."
            rows={1}
            style={{
              flex: 1, padding: "14px 18px", borderRadius: 18, resize: "none",
              background: theme.bgInput, border: `1.5px solid ${theme.border}`,
              color: theme.text, fontSize: 15, lineHeight: 1.4,
              maxHeight: 120,
            }}
            onFocus={e => e.target.style.borderColor = theme.purpleDim}
            onBlur={e => e.target.style.borderColor = theme.border}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{
              width: 48, height: 48, borderRadius: 16,
              background: input.trim()
                ? `linear-gradient(135deg, ${theme.purple}, ${theme.accent})`
                : theme.bgCard,
              border: `1px solid ${input.trim() ? "transparent" : theme.border}`,
              color: "#fff", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.3s", opacity: input.trim() ? 1 : 0.5,
            }}
          >↑</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Journal
// ═══════════════════════════════════════
function JournalScreen({ onBack }) {
  const [entry, setEntry] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <div style={{
      minHeight: "100vh", padding: "24px 20px", maxWidth: 520, margin: "0 auto",
    }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: theme.textDim, fontSize: 20,
        marginBottom: 24,
      }}>← Back</button>

      <h2 style={{
        fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 32,
      }}>Today's Reflection</h2>

      <div style={{ marginBottom: 28 }}>
        <label style={{ color: theme.textDim, fontSize: 13, marginBottom: 10, display: "block" }}>
          What's one thing you're grateful for today?
        </label>
        <textarea
          value={gratitude} onChange={e => setGratitude(e.target.value)}
          placeholder="It can be small..."
          rows={3}
          style={{
            width: "100%", padding: "16px 20px", borderRadius: 16,
            background: theme.bgInput, border: `1.5px solid ${theme.border}`,
            color: theme.text, fontSize: 15, lineHeight: 1.6, resize: "none",
          }}
          onFocus={e => e.target.style.borderColor = theme.purpleDim}
          onBlur={e => e.target.style.borderColor = theme.border}
        />
      </div>

      <div style={{ marginBottom: 36 }}>
        <label style={{ color: theme.textDim, fontSize: 13, marginBottom: 10, display: "block" }}>
          Free write — whatever's on your mind
        </label>
        <textarea
          value={entry} onChange={e => setEntry(e.target.value)}
          placeholder="No filters. Just write."
          rows={8}
          style={{
            width: "100%", padding: "16px 20px", borderRadius: 16,
            background: theme.bgInput, border: `1.5px solid ${theme.border}`,
            color: theme.text, fontSize: 15, lineHeight: 1.6, resize: "none",
          }}
          onFocus={e => e.target.style.borderColor = theme.purpleDim}
          onBlur={e => e.target.style.borderColor = theme.border}
        />
      </div>

      {saved ? (
        <div className="fadeIn" style={{
          padding: "16px 24px", borderRadius: 16,
          background: `${theme.green}15`, border: `1px solid ${theme.green}33`,
          color: theme.green, fontSize: 15, textAlign: "center",
        }}>
          Saved ✦ Keep showing up for yourself.
        </div>
      ) : (
        <Button onClick={() => setSaved(true)} disabled={!entry.trim() && !gratitude.trim()}>
          Save entry
        </Button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// SCREEN: Personality Results
// ═══════════════════════════════════════
function ResultsScreen({ profile, onContinue }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24, position: "relative",
    }}>
      <GlowOrb size={400} top="20%" left="30%" opacity={0.12} />

      <div className="fadeUp" style={{ maxWidth: 400, width: "100%", textAlign: "center", zIndex: 1 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: "0 auto 24px",
          background: `linear-gradient(135deg, ${theme.purple}, ${theme.accent})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, boxShadow: `0 8px 40px ${theme.purpleGlow}`,
        }}>✦</div>

        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 8,
        }}>Here's what we see, {profile.name}</h2>
        <p style={{ color: theme.textDim, fontSize: 14, marginBottom: 40 }}>
          This shapes how {APP_NAME} talks to you.
        </p>

        <div style={{
          background: theme.bgCard, borderRadius: 20, padding: 28,
          border: `1px solid ${theme.border}`, marginBottom: 16, textAlign: "left",
        }}>
          <p style={{ color: theme.textMuted, fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>PERSONALITY TYPE</p>
          <p style={{
            fontSize: 36, fontWeight: 700, fontFamily: "'Playfair Display', serif",
            background: `linear-gradient(135deg, ${theme.purple}, ${theme.accent})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: 8,
          }}>{profile.mbti}</p>
          <p style={{ color: theme.textDim, fontSize: 14, lineHeight: 1.6 }}>
            {APP_NAME} will tailor every conversation to how you process things.
          </p>
        </div>

        <div style={{
          background: theme.bgCard, borderRadius: 20, padding: 28,
          border: `1px solid ${theme.border}`, marginBottom: 40, textAlign: "left",
        }}>
          <p style={{ color: theme.textMuted, fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>ATTACHMENT STYLE</p>
          <p style={{
            fontSize: 28, fontWeight: 700, fontFamily: "'Playfair Display', serif",
            color: theme.purpleLight, marginBottom: 8,
          }}>{profile.attachment}</p>
          <p style={{ color: theme.textDim, fontSize: 14, lineHeight: 1.6 }}>
            This tells us how you connect — and where you might get stuck.
          </p>
        </div>

        <Button onClick={onContinue}>Take me home →</Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════
const DARES = [
  "Call someone you've been meaning to reach out to. Don't text first.",
  "Tell someone specifically why you appreciate them today.",
  "Ask someone 'how are you really doing?' and actually listen.",
  "Send a voice note instead of a text to someone you care about.",
  "Have a meal with someone without looking at your phone.",
  "Tell someone about something you're struggling with. Be honest.",
  "Compliment a stranger. Make it genuine.",
];

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [profile, setProfile] = useState({ name: "", age: "", mbti: "", attachment: "", categories: [] });
  const [streakDays, setStreakDays] = useState(3);

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text }}>
        {screen === "welcome" && (
          <WelcomeScreen onStart={() => setScreen("name")} />
        )}

        {screen === "name" && (
          <NameScreen onNext={({ name, age }) => {
            setProfile(p => ({ ...p, name, age }));
            setScreen("personality");
          }} />
        )}

        {screen === "personality" && (
          <PersonalityTestScreen onComplete={({ mbti, attachment }) => {
            setProfile(p => ({ ...p, mbti, attachment }));
            setScreen("categories");
          }} />
        )}

        {screen === "categories" && (
          <CategoryScreen onComplete={(cats) => {
            setProfile(p => ({ ...p, categories: cats }));
            setScreen("results");
          }} />
        )}

        {screen === "results" && (
          <ResultsScreen profile={profile} onContinue={() => setScreen("home")} />
        )}

        {screen === "home" && (
          <HomeScreen
            profile={profile}
            streakDays={streakDays}
            dares={DARES}
            onOpenChat={() => setScreen("chat")}
            onOpenJournal={() => setScreen("journal")}
          />
        )}

        {screen === "chat" && (
          <ChatScreen profile={profile} onBack={() => setScreen("home")} />
        )}

        {screen === "journal" && (
          <JournalScreen onBack={() => setScreen("home")} />
        )}
      </div>
    </>
  );
}

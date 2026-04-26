import { useState, useEffect, useRef } from "react";

const SAMPLE_CANDIDATES = [
  { id: 1, name: "Priya Sharma", title: "Senior Frontend Engineer", skills: ["React", "TypeScript", "Node.js", "GraphQL", "CSS"], experience: 5, location: "Bangalore, India", summary: "5 years building scalable SPAs at fintech startups. Led a team of 4 engineers." },
  { id: 2, name: "Arjun Mehta", title: "Full Stack Developer", skills: ["React", "Python", "Django", "PostgreSQL", "Docker"], experience: 4, location: "Mumbai, India", summary: "Full stack dev with strong backend skills. Built REST APIs serving 1M+ users." },
  { id: 3, name: "Sara Kim", title: "React Developer", skills: ["React", "Redux", "JavaScript", "CSS", "Jest"], experience: 3, location: "Remote", summary: "Frontend specialist, passionate about accessible UIs and clean code." },
  { id: 4, name: "Rohan Patel", title: "Software Engineer", skills: ["Vue.js", "JavaScript", "Node.js", "MongoDB"], experience: 4, location: "Ahmedabad, India", summary: "Vue/Node developer pivoting to React. Strong JS fundamentals." },
  { id: 5, name: "Ananya Rao", title: "UI Engineer", skills: ["React", "TypeScript", "Figma", "TailwindCSS", "GraphQL"], experience: 6, location: "Hyderabad, India", summary: "Design-engineer hybrid. Loves converting complex designs into pixel-perfect components." },
  { id: 6, name: "Dev Khanna", title: "Backend Engineer", skills: ["Python", "FastAPI", "PostgreSQL", "Redis", "AWS"], experience: 7, location: "Delhi, India", summary: "Backend specialist. Experience in high-throughput microservices and cloud infra." },
  { id: 7, name: "Meera Nair", title: "Junior Frontend Developer", skills: ["HTML", "CSS", "JavaScript", "React"], experience: 1, location: "Pune, India", summary: "Recent graduate, built 3 portfolio projects in React. Quick learner." },
  { id: 8, name: "Kiran Bose", title: "Tech Lead", skills: ["React", "Node.js", "TypeScript", "AWS", "System Design", "GraphQL"], experience: 8, location: "Bangalore, India", summary: "Led frontend architecture for a Series B startup. Mentored 6 junior devs." },
];

const CHAT_QUESTIONS = [
  "Hi {name}! We came across your profile and think you could be a great fit for a {role} role. Are you currently open to new opportunities?",
  "Great! The role involves {jd_summary}. Does that align with the kind of work you're looking for?",
  "The position is {remote_type} based. Is that something that works for you?",
  "On a scale of 1–10, how excited would you say you are about roles involving {top_skill}?",
  "Last question — what's your ideal timeline to start a new role, if the fit is right?",
];

const INTEREST_ANSWERS = [
  ["Yes, absolutely open!", "Actively looking", "Passively open"],
  ["Sounds exciting!", "Somewhat aligned", "Not really my focus"],
  ["Perfect for me", "Could work", "Prefer something else"],
  ["9 or 10 — love it!", "Around 7", "Maybe 5 or 6"],
  ["2–4 weeks", "1–2 months", "3+ months"],
];

function parseJD(jd) {
  const lower = jd.toLowerCase();
  const skills = [];
  const allSkills = ["react", "vue", "angular", "typescript", "javascript", "node.js", "python", "django", "fastapi", "postgresql", "mongodb", "graphql", "redux", "css", "tailwindcss", "docker", "aws", "redis", "figma", "jest"];
  allSkills.forEach(s => { if (lower.includes(s)) skills.push(s); });
  const expMatch = lower.match(/(\d+)\+?\s*years?/);
  const minExp = expMatch ? parseInt(expMatch[1]) : 2;
  const isRemote = lower.includes("remote");
  const roleMatch = jd.match(/(senior|lead|junior|mid)?\s*(frontend|backend|full.?stack|software|react|ui)\s*(engineer|developer|dev)?/i);
  const role = roleMatch ? roleMatch[0].trim() : "Software Engineer";
  return { skills, minExp, isRemote, role };
}

function computeMatchScore(candidate, parsed) {
  let score = 0;
  const reasons = [];
  const cSkills = candidate.skills.map(s => s.toLowerCase());
  const matched = parsed.skills.filter(s => cSkills.includes(s.toLowerCase()));
  const skillScore = parsed.skills.length > 0 ? (matched.length / parsed.skills.length) * 50 : 30;
  score += skillScore;
  if (matched.length > 0) reasons.push(`Matches ${matched.length}/${parsed.skills.length} required skills: ${matched.join(", ")}`);
  const expScore = candidate.experience >= parsed.minExp ? 30 : Math.max(0, 30 - (parsed.minExp - candidate.experience) * 8);
  score += expScore;
  if (candidate.experience >= parsed.minExp) reasons.push(`${candidate.experience} yrs experience meets requirement`);
  else reasons.push(`${candidate.experience} yrs experience (${parsed.minExp} required)`);
  if (parsed.isRemote && candidate.location.toLowerCase().includes("remote")) { score += 10; reasons.push("Remote preference aligns"); }
  else if (!parsed.isRemote) { score += 5; }
  const titleScore = parsed.role && candidate.title.toLowerCase().includes(parsed.role.split(" ")[0].toLowerCase()) ? 10 : 5;
  score += titleScore;
  if (titleScore === 10) reasons.push("Job title closely matches");
  return { score: Math.round(Math.min(score, 100)), reasons, matchedSkills: matched };
}

function computeInterestScore(answers) {
  if (!answers || answers.length === 0) return 0;
  const weights = [1, 0, 1, 2, 1, 0, 3, 0, 2];
  let total = 0, maxTotal = 0;
  answers.forEach((a, i) => {
    const weight = [3, 2, 1, 1, 1][i] || 1;
    const val = a === 0 ? 3 : a === 1 ? 2 : 1;
    total += val * weight;
    maxTotal += 3 * weight;
  });
  return Math.round((total / maxTotal) * 100);
}

const rainbowGrad = "linear-gradient(135deg, #0f0c29, #302b63, #24243e)";

export default function TalentScoutAgent() {
  const [step, setStep] = useState("landing");
  const [jd, setJd] = useState("");
  const [parsedJD, setParsedJD] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [chatIdx, setChatIdx] = useState(null);
  const [chatStep, setChatStep] = useState(0);
  const [chatAnswers, setChatAnswers] = useState({});
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [shortlist, setShortlist] = useState([]);
  const chatEndRef = useRef(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleAnalyze = async () => {
    if (!jd.trim()) return;
    setAnalyzing(true);
    setAnalyzeProgress(0);
    const interval = setInterval(() => setAnalyzeProgress(p => Math.min(p + 12, 90)), 200);
    await new Promise(r => setTimeout(r, 1800));
    clearInterval(interval);
    setAnalyzeProgress(100);
    const parsed = parseJD(jd);
    setParsedJD(parsed);
    const scored = SAMPLE_CANDIDATES.map(c => ({
      ...c,
      matchScore: computeMatchScore(c, parsed),
      interestScore: null,
      chatDone: false,
    })).sort((a, b) => b.matchScore.score - a.matchScore.score);
    setCandidates(scored);
    setAnalyzing(false);
    setStep("candidates");
  };

  const startChat = (idx) => {
    const c = candidates[idx];
    setChatIdx(idx);
    setChatStep(0);
    setMessages([]);
    setStep("chat");
    setTimeout(() => sendBotMessage(idx, 0, {}), 600);
  };

  const sendBotMessage = (idx, step, answers) => {
    const c = candidates[idx];
    const parsed = parsedJD;
    let q = CHAT_QUESTIONS[step]
      .replace("{name}", c.name.split(" ")[0])
      .replace("{role}", parsed.role || "Software Engineer")
      .replace("{jd_summary}", parsed.skills.slice(0, 3).join(", ") + " development")
      .replace("{remote_type}", parsed.isRemote ? "remote" : "on-site")
      .replace("{top_skill}", parsed.skills[0] || "engineering");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(m => [...m, { role: "bot", text: q }]);
    }, 900);
  };

  const handleChatAnswer = (ansIdx) => {
    const newAnswers = { ...chatAnswers, [chatStep]: ansIdx };
    setChatAnswers(newAnswers);
    const ans = INTEREST_ANSWERS[chatStep][ansIdx];
    setMessages(m => [...m, { role: "user", text: ans }]);
    const nextStep = chatStep + 1;
    if (nextStep < CHAT_QUESTIONS.length) {
      setChatStep(nextStep);
      sendBotMessage(chatIdx, nextStep, newAnswers);
    } else {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(m => [...m, { role: "bot", text: "Thanks so much! We'll be in touch soon if things align. 🎉" }]);
        const interest = computeInterestScore(Object.values(newAnswers));
        const updated = candidates.map((c, i) =>
          i === chatIdx ? { ...c, interestScore: interest, chatDone: true } : c
        );
        setCandidates(updated);
        setTimeout(() => setStep("candidates"), 1500);
      }, 900);
    }
  };

  const generateShortlist = () => {
    const done = candidates.filter(c => c.chatDone);
    if (done.length === 0) return;
    const ranked = done.map(c => ({
      ...c,
      combined: Math.round(c.matchScore.score * 0.6 + c.interestScore * 0.4),
    })).sort((a, b) => b.combined - a.combined);
    setShortlist(ranked);
    setStep("shortlist");
  };

  const ScoreBar = ({ score, color }) => (
    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 6, width: "100%", overflow: "hidden" }}>
      <div style={{ width: `${score}%`, background: color, height: "100%", borderRadius: 99, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );

  const Badge = ({ text, highlight }) => (
    <span style={{
      background: highlight ? "rgba(99,236,201,0.15)" : "rgba(255,255,255,0.07)",
      color: highlight ? "#63ecc9" : "#aaa",
      border: `1px solid ${highlight ? "rgba(99,236,201,0.3)" : "rgba(255,255,255,0.1)"}`,
      borderRadius: 6, padding: "2px 8px", fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
    }}>{text}</span>
  );

  // ——— LANDING ———
  if (step === "landing") return (
    <div style={{ minHeight: "100vh", background: rainbowGrad, fontFamily: "'Inter', sans-serif", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        textarea:focus { outline: none; border-color: #63ecc9 !important; }
        button:hover { opacity: 0.88; transform: translateY(-1px); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(99,236,201,0.3); border-radius: 99px; }
      `}</style>
      <div style={{ maxWidth: 680, width: "100%", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(99,236,201,0.1)", border: "1px solid rgba(99,236,201,0.25)", borderRadius: 99, padding: "6px 18px", fontSize: 12, color: "#63ecc9", fontFamily: "'JetBrains Mono', monospace", marginBottom: 24, letterSpacing: 1 }}>
          ◆ AI TALENT SCOUT AGENT
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(2rem, 6vw, 3.5rem)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 16px", background: "linear-gradient(135deg, #fff 30%, #63ecc9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Find & Engage<br />Top Talent, Instantly
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 16, lineHeight: 1.7, marginBottom: 40 }}>
          Paste a Job Description. Our agent discovers matching candidates, scores them on fit, and simulates conversational outreach to measure genuine interest.
        </p>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, textAlign: "left" }}>
          <label style={{ fontSize: 12, color: "#63ecc9", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, display: "block", marginBottom: 10 }}>JOB DESCRIPTION</label>
          <textarea
            rows={8}
            value={jd}
            onChange={e => setJd(e.target.value)}
            placeholder="Paste your job description here...&#10;&#10;Example: We are looking for a Senior React Developer with 4+ years of experience in TypeScript, GraphQL, and Node.js. The role is remote-friendly..."
            style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#fff", fontSize: 14, lineHeight: 1.7, padding: "14px 16px", resize: "vertical", fontFamily: "'Inter', sans-serif", transition: "border-color 0.2s" }}
          />
          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            {["Senior React Developer, 4+ years TypeScript, GraphQL, Node.js — remote", "Junior Frontend Dev, React, CSS, JavaScript", "Full Stack Engineer, Python, FastAPI, React, PostgreSQL"].map((s, i) => (
              <button key={i} onClick={() => setJd(s)} style={{ background: "rgba(99,236,201,0.08)", border: "1px solid rgba(99,236,201,0.2)", color: "#63ecc9", fontSize: 11, padding: "4px 12px", borderRadius: 99, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", transition: "all 0.2s" }}>
                Sample {i + 1}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={!jd.trim() || analyzing}
          style={{ marginTop: 20, width: "100%", background: analyzing ? "rgba(99,236,201,0.2)" : "linear-gradient(135deg, #63ecc9, #3a9e82)", border: "none", borderRadius: 12, color: analyzing ? "#63ecc9" : "#0f1a15", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, padding: "16px", cursor: "pointer", transition: "all 0.3s", letterSpacing: 0.5 }}
        >
          {analyzing ? `Analyzing candidates... ${analyzeProgress}%` : "→ Discover & Score Candidates"}
        </button>
        {analyzing && (
          <div style={{ marginTop: 12, background: "rgba(255,255,255,0.08)", borderRadius: 99, height: 4, overflow: "hidden" }}>
            <div style={{ width: `${analyzeProgress}%`, background: "linear-gradient(90deg, #63ecc9, #3a9e82)", height: "100%", transition: "width 0.3s" }} />
          </div>
        )}
      </div>
    </div>
  );

  // ——— CANDIDATES ———
  if (step === "candidates") return (
    <div style={{ minHeight: "100vh", background: rainbowGrad, fontFamily: "'Inter', sans-serif", color: "#fff", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');* { box-sizing: border-box; } button:hover { opacity: 0.85; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(99,236,201,0.3); border-radius: 99px; }`}</style>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <button onClick={() => setStep("landing")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", fontSize: 12, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", marginBottom: 10 }}>← Back</button>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, margin: 0 }}>Candidate Pipeline</h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "4px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>
              Role: {parsedJD?.role} · Skills detected: {parsedJD?.skills.join(", ") || "general"} · Min exp: {parsedJD?.minExp}y
            </p>
          </div>
          <button
            onClick={generateShortlist}
            disabled={!candidates.some(c => c.chatDone)}
            style={{ background: candidates.some(c => c.chatDone) ? "linear-gradient(135deg, #63ecc9, #3a9e82)" : "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, color: candidates.some(c => c.chatDone) ? "#0f1a15" : "rgba(255,255,255,0.3)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, padding: "12px 22px", cursor: candidates.some(c => c.chatDone) ? "pointer" : "not-allowed", transition: "all 0.3s" }}
          >
            Generate Shortlist →
          </button>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          {candidates.map((c, i) => (
            <div key={c.id} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${c.chatDone ? "rgba(99,236,201,0.25)" : "rgba(255,255,255,0.09)"}`, borderRadius: 14, padding: "18px 22px", transition: "border-color 0.3s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `hsl(${c.id * 47}, 60%, 50%)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14 }}>
                      {c.name[0]}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>{c.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{c.title} · {c.experience}y · {c.location}</div>
                    </div>
                    {c.chatDone && <span style={{ background: "rgba(99,236,201,0.15)", color: "#63ecc9", border: "1px solid rgba(99,236,201,0.3)", borderRadius: 99, fontSize: 10, padding: "2px 8px", fontFamily: "'JetBrains Mono', monospace" }}>✓ Engaged</span>}
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.6, margin: "8px 0 10px" }}>{c.summary}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {c.skills.map(s => <Badge key={s} text={s} highlight={parsedJD?.skills.includes(s.toLowerCase())} />)}
                  </div>
                </div>
                <div style={{ minWidth: 180 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.5)", marginBottom: 5 }}>
                      <span>Match Score</span><span style={{ color: "#fff", fontWeight: 600 }}>{c.matchScore.score}%</span>
                    </div>
                    <ScoreBar score={c.matchScore.score} color="linear-gradient(90deg, #3a9e82, #63ecc9)" />
                  </div>
                  {c.chatDone && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.5)", marginBottom: 5 }}>
                        <span>Interest Score</span><span style={{ color: "#fff", fontWeight: 600 }}>{c.interestScore}%</span>
                      </div>
                      <ScoreBar score={c.interestScore} color="linear-gradient(90deg, #a855f7, #ec4899)" />
                    </div>
                  )}
                  {!c.chatDone && (
                    <button
                      onClick={() => startChat(i)}
                      style={{ width: "100%", background: "rgba(99,236,201,0.1)", border: "1px solid rgba(99,236,201,0.3)", color: "#63ecc9", borderRadius: 8, padding: "8px", fontSize: 12, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", transition: "all 0.2s" }}
                    >
                      Start Outreach →
                    </button>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>WHY THIS MATCH</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {c.matchScore.reasons.map((r, ri) => (
                    <span key={ri} style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "2px 8px" }}>· {r}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ——— CHAT ———
  if (step === "chat" && chatIdx !== null) {
    const c = candidates[chatIdx];
    return (
      <div style={{ minHeight: "100vh", background: rainbowGrad, fontFamily: "'Inter', sans-serif", color: "#fff", display: "flex", flexDirection: "column" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');* { box-sizing: border-box; } button:hover { opacity: 0.85; transform: translateY(-1px); }`}</style>
        <div style={{ padding: "16px 24px", background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setStep("candidates")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", fontSize: 12, padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" }}>← Back</button>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `hsl(${c.id * 47}, 60%, 50%)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>{c.name[0]}</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{c.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>Simulated Outreach · Q{chatStep + 1}/{CHAT_QUESTIONS.length}</div>
          </div>
          <div style={{ marginLeft: "auto", background: "rgba(99,236,201,0.1)", border: "1px solid rgba(99,236,201,0.25)", borderRadius: 99, padding: "4px 14px", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#63ecc9" }}>
            Match: {c.matchScore.score}%
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 640, width: "100%", margin: "0 auto" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "bot" ? "flex-start" : "flex-end" }}>
              <div style={{ maxWidth: "80%", background: m.role === "bot" ? "rgba(255,255,255,0.07)" : "rgba(99,236,201,0.15)", border: `1px solid ${m.role === "bot" ? "rgba(255,255,255,0.1)" : "rgba(99,236,201,0.3)"}`, borderRadius: m.role === "bot" ? "4px 16px 16px 16px" : "16px 4px 16px 16px", padding: "12px 16px", fontSize: 14, lineHeight: 1.6, color: m.role === "bot" ? "#ddd" : "#fff" }}>
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ display: "flex", gap: 5, padding: "12px 16px", background: "rgba(255,255,255,0.07)", borderRadius: "4px 16px 16px 16px", width: "fit-content" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#63ecc9", animation: `bounce 1.2s ease infinite ${i * 0.2}s` }} />
              ))}
              <style>{`@keyframes bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }`}</style>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        {!isTyping && chatStep < CHAT_QUESTIONS.length && messages.length > 0 && messages[messages.length - 1].role === "bot" && (
          <div style={{ padding: "16px 24px", background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.08)", maxWidth: 640, width: "100%", margin: "0 auto" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>SELECT RESPONSE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {INTEREST_ANSWERS[chatStep]?.map((ans, ai) => (
                <button key={ai} onClick={() => handleChatAnswer(ai)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", borderRadius: 10, padding: "12px 16px", textAlign: "left", cursor: "pointer", fontSize: 14, transition: "all 0.2s", fontFamily: "'Inter', sans-serif" }}>
                  {ans}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ——— SHORTLIST ———
  if (step === "shortlist") return (
    <div style={{ minHeight: "100vh", background: rainbowGrad, fontFamily: "'Inter', sans-serif", color: "#fff", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');* { box-sizing: border-box; } button:hover { opacity: 0.85; }`}</style>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <button onClick={() => setStep("candidates")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", fontSize: 12, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", marginBottom: 12 }}>← Back</button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, background: "linear-gradient(135deg, #63ecc9, #3a9e82)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏆</div>
            <div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, margin: 0 }}>Ranked Shortlist</h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "2px 0 0", fontFamily: "'JetBrains Mono', monospace" }}>Combined score = 60% Match + 40% Interest</p>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          {shortlist.map((c, i) => (
            <div key={c.id} style={{ background: i === 0 ? "rgba(99,236,201,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${i === 0 ? "rgba(99,236,201,0.3)" : "rgba(255,255,255,0.09)"}`, borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: i === 0 ? "#63ecc9" : "rgba(255,255,255,0.3)", minWidth: 40 }}>#{i + 1}</div>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: `hsl(${c.id * 47}, 60%, 50%)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>{c.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17 }}>{c.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{c.title} · {c.experience}y exp</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, background: "linear-gradient(135deg, #63ecc9, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>{c.combined}%</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>COMBINED</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
                <div style={{ background: "rgba(99,236,201,0.07)", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#63ecc9", marginBottom: 6 }}>MATCH SCORE</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800 }}>{c.matchScore.score}%</div>
                  <ScoreBar score={c.matchScore.score} color="linear-gradient(90deg, #3a9e82, #63ecc9)" />
                  <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                    {c.matchScore.reasons.slice(0, 2).map((r, ri) => <div key={ri}>· {r}</div>)}
                  </div>
                </div>
                <div style={{ background: "rgba(168,85,247,0.07)", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#a855f7", marginBottom: 6 }}>INTEREST SCORE</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800 }}>{c.interestScore}%</div>
                  <ScoreBar score={c.interestScore} color="linear-gradient(90deg, #a855f7, #ec4899)" />
                  <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                    Based on 5-question conversational assessment
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>SCORING METHODOLOGY</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            <div><strong style={{ color: "#63ecc9" }}>Match Score (60%)</strong><br />Skill overlap (50pts), Experience fit (30pts), Location (10pts), Title alignment (10pts)</div>
            <div><strong style={{ color: "#a855f7" }}>Interest Score (40%)</strong><br />Openness to role (3x), Alignment (2x), Excitement level (3x), Remote fit (1x), Timeline (2x)</div>
          </div>
        </div>
      </div>
    </div>
  );

  return null;
}

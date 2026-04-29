import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are LUMINX, a premium AI patient intake specialist for Luminx Systems. You work across all clinical settings — private clinics, dental offices, hospitals, camps, and schools.

Your style:
- Calm, confident, and warm — never robotic or clinical-sounding
- Ask ONE focused question at a time
- Follow up naturally when something needs clarification
- Use plain language, not medical jargon, when talking to patients
- Be especially gentle with youth patients or those who seem anxious

Your job:
- Understand why the patient is here today
- Gather relevant symptoms, history, and concerns they choose to share
- When the provider requests it, produce a clean structured intake summary

Privacy commitment: Only record what patients voluntarily share. Never ask for SSN, financial data, or anything beyond their health concerns today.`;

const SETTINGS = [
  { id: "clinic", label: "PRIVATE CLINIC" },
  { id: "dental", label: "DENTAL OFFICE" },
  { id: "hospital", label: "HOSPITAL" },
  { id: "camp", label: "CAMP / SCHOOL" },
  { id: "pediatric", label: "PEDIATRICS" },
  { id: "specialist", label: "SPECIALIST" },
];

const PRICING = [
  {
    name: "SOLO",
    setup: "$299",
    monthly: "$49",
    desc: "One provider. One location.",
    features: ["Unlimited sessions", "AI intake notes", "Email export", "1 clinic profile"],
  },
  {
    name: "PRACTICE",
    setup: "$599",
    monthly: "$99",
    desc: "Small team. Multiple providers.",
    features: ["Everything in Solo", "Up to 5 providers", "Custom intake flows", "Priority support"],
    featured: true,
  },
  {
    name: "NETWORK",
    setup: "$1,200",
    monthly: "$199",
    desc: "Multi-location organizations.",
    features: ["Everything in Practice", "Unlimited locations", "Custom branding", "Dedicated onboarding"],
  },
];

// Luminx-inspired palette — same DNA, way better contrast
const G = {
  bg: "#050505",
  surface: "#0a0a0a",
  surface2: "#111",
  border: "#1f1f1f",
  borderBright: "#2e2e2e",
  // accent: cool surgical cyan instead of gold — feels more medical-tech
  accent: "#00d4ff",
  accentDim: "rgba(0,212,255,0.1)",
  accentBorder: "rgba(0,212,255,0.25)",
  // warm white for large type — matches Luminx's off-white headings
  white: "#e8e8e6",
  textBright: "#c8c8c4",
  textMid: "#666660",
  textDim: "#2e2e2c",
  // alert red for live indicators
  live: "#ff3b3b",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #050505 !important; }
  ::selection { background: rgba(0,212,255,0.2); color: #e8e8e6; }
  ::-webkit-scrollbar { width: 2px; }
  ::-webkit-scrollbar-track { background: #050505; }
  ::-webkit-scrollbar-thumb { background: #1f1f1f; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
  @keyframes msgIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes dot { 0%,100%{opacity:0.2;transform:scale(0.7);}50%{opacity:1;transform:scale(1);} }
  @keyframes blink { 0%,100%{opacity:1;}50%{opacity:0;} }
  @keyframes scanline { from{transform:translateY(-100%);}to{transform:translateY(100vh);} }
  @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,212,255,0.3);}50%{box-shadow:0 0 0 8px rgba(0,212,255,0);} }
  .f1{animation:fadeUp 0.7s ease both;}
  .f2{animation:fadeUp 0.7s 0.08s ease both;}
  .f3{animation:fadeUp 0.7s 0.16s ease both;}
  .f4{animation:fadeUp 0.7s 0.24s ease both;}
  .f5{animation:fadeUp 0.7s 0.32s ease both;}
  .msg{animation:msgIn 0.2s ease forwards;}
  .cursor{animation:blink 1s step-end infinite;}
  .abtn{transition:all 0.18s;}
  .abtn:hover{background:rgba(0,212,255,0.12) !important; border-color:rgba(0,212,255,0.5) !important; color:#00d4ff !important;}
  .abtn:disabled{opacity:0.25 !important; cursor:default !important;}
  .gbtn{transition:all 0.18s; background:#00d4ff !important;}
  .gbtn:hover{background:#33ddff !important; box-shadow:0 0 32px rgba(0,212,255,0.25) !important; transform:translateY(-1px);}
  .gbtn:disabled{opacity:0.25 !important; cursor:default !important; transform:none !important;}
  .scard{transition:all 0.15s; cursor:pointer;}
  .scard:hover{border-color:rgba(0,212,255,0.35) !important; background:rgba(0,212,255,0.04) !important;}
  .scard.on{border-color:rgba(0,212,255,0.6) !important; background:rgba(0,212,255,0.08) !important; color:#00d4ff !important;}
  .pcard{transition:border-color 0.2s;}
  .pcard:hover{border-color:#2e2e2e !important;}
  input:focus,textarea:focus{outline:none !important; border-color:rgba(0,212,255,0.4) !important;}
  .send:hover:not(:disabled){background:rgba(0,212,255,0.1) !important; border-color:rgba(0,212,255,0.4) !important;}
  .send:disabled{opacity:0.2 !important; cursor:default !important;}
  .navlink{transition:color 0.15s; cursor:pointer;}
  .navlink:hover{color:#00d4ff !important;}
`;

const mono = { fontFamily: "'Space Mono', monospace" };
const sans = { fontFamily: "'Space Grotesk', sans-serif" };

function LiveDot() {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:G.live, display:"inline-block", animation:"pulse 2s ease-in-out infinite" }} />
    </span>
  );
}

function Readout({ label, value }) {
  return (
    <div style={{ textAlign:"right" }}>
      <div style={{ fontSize:8, letterSpacing:"0.2em", color:G.textMid, marginBottom:2, ...mono }}>{label}</div>
      <div style={{ fontSize:11, color:G.textBright, ...mono }}>{value}</div>
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return <Readout label="TIME (EST)" value={time.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"})} />;
}

export default function LuminxSystems() {
  const [screen, setScreen] = useState("landing");
  const [setting, setSetting] = useState(null);
  const [practiceName, setPracticeName] = useState("");
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  const startSession = async () => {
    setScreen("session");
    setMessages([]);
    setHistory([]);
    setLoading(true);
    const sys = `${SYSTEM_PROMPT}\n\nSetting: ${setting}. Practice: ${practiceName||"this practice"}. Begin with a warm 1-2 sentence greeting and ask what brings the patient in today.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:sys, messages:[{role:"user",content:"Start."}] }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Welcome. What brings you in today?";
      setHistory([{role:"user",content:"Start."},{role:"assistant",content:reply}]);
      setMessages([{from:"luminx",text:reply}]);
    } catch {
      const fb = "Welcome. I'm here to help get you checked in. What brings you in today?";
      setHistory([{role:"user",content:"Start."},{role:"assistant",content:fb}]);
      setMessages([{from:"luminx",text:fb}]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim();
    setInput("");
    const nm = [...messages, {from:"patient",text:txt}];
    setMessages(nm);
    setLoading(true);
    const nh = [...history, {role:"user",content:txt}];
    const sys = `${SYSTEM_PROMPT}\n\nSetting: ${setting}. Practice: ${practiceName||"this practice"}.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:sys, messages:nh }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Tell me more.";
      setHistory([...nh,{role:"assistant",content:reply}]);
      setMessages([...nm,{from:"luminx",text:reply}]);
    } catch {
      setMessages([...nm,{from:"luminx",text:"Connection issue — please try again."}]);
    }
    setLoading(false);
  };

  const generateNote = async () => {
    setNoteLoading(true);
    setNote("");
    setScreen("note");
    const sys = `${SYSTEM_PROMPT}\n\nSetting: ${setting}. Practice: ${practiceName||"this practice"}.`;
    const req = [...history, {
      role:"user",
      content:`Generate a structured clinical intake note.\n\nCHIEF COMPLAINT\n[1-2 sentences]\n\nHISTORY OF PRESENT ILLNESS\n[Narrative]\n\nREPORTED SYMPTOMS\n[Bullet list]\n\nPATIENT-REPORTED HISTORY\n[Any history volunteered]\n\nPATIENT CONCERNS\n[What they want addressed]\n\nSUGGESTED FOLLOW-UP FOR PROVIDER\n[3-5 items]\n\nOnly use voluntarily shared info. Be concise and clinically useful.`,
    }];
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:sys, messages:req }),
      });
      const data = await res.json();
      setNote(data.content?.[0]?.text || "Unable to generate note.");
    } catch { setNote("Connection error. Return to session and try again."); }
    setNoteLoading(false);
  };

  const copyNote = () => {
    navigator.clipboard?.writeText(note);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setScreen("landing");
    setMessages([]); setHistory([]); setNote("");
    setSetting(null); setPracticeName(""); setInput("");
  };

  const base = { minHeight:"100vh", background:G.bg, color:G.textBright, ...sans, WebkitFontSmoothing:"antialiased" };

  // ── NAV ────────────────────────────────────────────────────────────────────
  const Nav = ({ right }) => (
    <nav style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 40px", borderBottom:`1px solid ${G.border}` }}>
      <div onClick={() => setScreen("landing")} style={{ fontSize:13, letterSpacing:"0.18em", color:G.textBright, cursor:"pointer", fontWeight:600, ...mono }}>
        LUMINX SYSTEMS
      </div>
      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
        {right}
      </div>
    </nav>
  );

  const SmallBtn = ({ onClick, children }) => (
    <button className="abtn" onClick={onClick} style={{ background:"transparent", border:`1px solid ${G.border}`, color:G.textMid, padding:"8px 18px", fontSize:10, letterSpacing:"0.18em", cursor:"pointer", ...mono }}>
      {children}
    </button>
  );

  const PrimaryBtn = ({ onClick, disabled, children, full }) => (
    <button className="gbtn" onClick={onClick} disabled={disabled} style={{ background:G.accent, color:"#050505", border:"none", padding: full?"16px":"10px 22px", width:full?"100%":"auto", fontSize:11, letterSpacing:"0.18em", cursor:"pointer", fontWeight:700, ...mono }}>
      {children}
    </button>
  );

  // ── LANDING ────────────────────────────────────────────────────────────────
  if (screen === "landing") return (
    <div style={base}>
      <style>{CSS}</style>
      <Nav right={<>
        <span className="navlink" onClick={() => setScreen("pricing")} style={{ fontSize:10, letterSpacing:"0.2em", color:G.textMid, ...mono }}>PRICING</span>
        <PrimaryBtn onClick={() => setScreen("setup")}>ACCESS SYSTEM →</PrimaryBtn>
      </>} />

      {/* Hero — Luminx-style: massive left-aligned text */}
      <div style={{ padding:"80px 40px 0", position:"relative", overflow:"hidden" }}>
        {/* Scanline atmosphere */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.012) 2px, rgba(0,212,255,0.012) 4px)", pointerEvents:"none" }} />

        <div className="f1" style={{ display:"flex", alignItems:"center", gap:10, marginBottom:32 }}>
          <LiveDot />
          <span style={{ fontSize:9, letterSpacing:"0.28em", color:G.textMid, ...mono }}>SECURE INTERFACE · AI PATIENT INTAKE</span>
        </div>

        <h1 className="f2" style={{
          fontSize:"clamp(56px,9vw,120px)", fontWeight:700, lineHeight:0.95,
          color:G.white, letterSpacing:"-0.02em", marginBottom:0,
          textTransform:"uppercase",
        }}>
          PATIENT<br />
          <span style={{ color:G.accent, textShadow:`0 0 60px rgba(0,212,255,0.3)` }}>INTAKE</span><br />
          SYSTEM
        </h1>

        {/* Bottom info bar — Luminx style */}
        <div className="f3" style={{ display:"flex", justifyContent:"flex-end", gap:40, padding:"40px 0 0", borderTop:`1px solid ${G.border}`, marginTop:40 }}>
          <Readout label="LOCATION" value="43.0481° N  76.1474° W" />
          <Clock />
          <Readout label="STATUS" value="SYSTEM ONLINE" />
        </div>
      </div>

      {/* Description row */}
      <div className="f4" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:0, borderTop:`1px solid ${G.border}`, borderBottom:`1px solid ${G.border}` }}>
        <div style={{ padding:"36px 40px", borderRight:`1px solid ${G.border}` }}>
          <div style={{ fontSize:9, letterSpacing:"0.22em", color:G.accent, marginBottom:12, ...mono }}>WHAT IS LUMINX</div>
          <p style={{ fontSize:14, color:G.textMid, lineHeight:1.8, fontWeight:300 }}>
            A structured environment for conducting and documenting AI-powered patient intake conversations across every clinical setting.
          </p>
        </div>
        <div style={{ padding:"36px 40px", borderRight:`1px solid ${G.border}` }}>
          <div style={{ fontSize:9, letterSpacing:"0.22em", color:G.accent, marginBottom:12, ...mono }}>BUILT FOR</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {["CLINICS","DENTAL","HOSPITALS","CAMPS","PEDIATRICS","SPECIALISTS"].map(s => (
              <span key={s} style={{ fontSize:9, letterSpacing:"0.15em", color:G.textMid, border:`1px solid ${G.border}`, padding:"5px 10px", ...mono }}>{s}</span>
            ))}
          </div>
        </div>
        <div style={{ padding:"36px 40px" }}>
          <div style={{ fontSize:9, letterSpacing:"0.22em", color:G.accent, marginBottom:12, ...mono }}>PRIVACY</div>
          <p style={{ fontSize:14, color:G.textMid, lineHeight:1.8, fontWeight:300 }}>
            Only what patients volunteer is recorded. Zero data sold. Zero data harvested. Session ends, data stays local.
          </p>
        </div>
      </div>

      {/* Feature blocks */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
        {[
          { n:"01", t:"AI-DRIVEN CONVERSATION", d:"LUMINX conducts the intake interview — calm, focused, one question at a time. Adapts to setting, age, and patient tone." },
          { n:"02", t:"INSTANT CLINICAL NOTES", d:"When you're done, generate a structured SOAP-style intake note in seconds. Copy it. Paste it. Done." },
          { n:"03", t:"EVERY CLINICAL SETTING", d:"Private clinic. Dental. Hospital. Summer camp. School. Specialist. One system, configured per session." },
          { n:"04", t:"ONE-TIME SETUP + LOW MONTHLY", d:"No per-session charges. No bloated subscriptions. Pay once to set up, pay low monthly to run." },
        ].map((f, i) => (
          <div key={i} className="f4" style={{ padding:"48px 40px", border:`1px solid ${G.border}`, borderTop:"none", borderLeft: i%2===1?`1px solid ${G.border}`:"none" }}>
            <div style={{ fontSize:9, color:G.textDim, letterSpacing:"0.2em", marginBottom:20, ...mono }}>{f.n}</div>
            <div style={{ fontSize:13, fontWeight:600, letterSpacing:"0.08em", color:G.white, marginBottom:14 }}>{f.t}</div>
            <p style={{ fontSize:13, color:G.textMid, lineHeight:1.8, fontWeight:300 }}>{f.d}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding:"80px 40px", display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:`1px solid ${G.border}` }}>
        <div>
          <div style={{ fontSize:9, letterSpacing:"0.22em", color:G.accent, marginBottom:12, ...mono }}>READY TO START</div>
          <h2 style={{ fontSize:"clamp(28px,4vw,52px)", fontWeight:700, color:G.white, letterSpacing:"-0.01em", textTransform:"uppercase" }}>
            Run your first<br />intake tonight.
          </h2>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <SmallBtn onClick={() => setScreen("pricing")}>VIEW PRICING</SmallBtn>
          <PrimaryBtn onClick={() => setScreen("setup")}>START FREE DEMO →</PrimaryBtn>
        </div>
      </div>

      <div style={{ borderTop:`1px solid ${G.border}`, padding:"20px 40px", display:"flex", justifyContent:"space-between" }}>
        <span style={{ fontSize:9, color:G.textDim, letterSpacing:"0.15em", ...mono }}>LUMINX SYSTEMS © 2026</span>
        <span style={{ fontSize:9, color:G.textDim, letterSpacing:"0.15em", ...mono }}>PRIVACY FIRST · ZERO DATA SOLD</span>
      </div>
    </div>
  );

  // ── PRICING ────────────────────────────────────────────────────────────────
  if (screen === "pricing") return (
    <div style={base}>
      <style>{CSS}</style>
      <Nav right={<PrimaryBtn onClick={() => setScreen("setup")}>START FREE DEMO →</PrimaryBtn>} />

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"80px 40px" }}>
        <div className="f1" style={{ marginBottom:70 }}>
          <div style={{ fontSize:9, letterSpacing:"0.25em", color:G.accent, marginBottom:16, ...mono }}>PRICING STRUCTURE</div>
          <h1 style={{ fontSize:"clamp(40px,6vw,80px)", fontWeight:700, color:G.white, letterSpacing:"-0.02em", textTransform:"uppercase", lineHeight:0.95 }}>
            ONE-TIME SETUP.<br /><span style={{ color:G.accent }}>LOW MONTHLY.</span>
          </h1>
        </div>

        <div className="f2" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:0, border:`1px solid ${G.border}` }}>
          {PRICING.map((p, i) => (
            <div key={p.name} className="pcard" style={{ padding:"48px 36px", borderRight: i<2?`1px solid ${G.border}`:"none", borderTop: p.featured?`2px solid ${G.accent}`:"2px solid transparent", background: p.featured?"rgba(0,212,255,0.03)":G.surface, position:"relative" }}>
              {p.featured && (
                <div style={{ position:"absolute", top:0, right:24, transform:"translateY(-100%)", background:G.accent, color:"#050505", fontSize:8, letterSpacing:"0.2em", padding:"4px 14px", fontWeight:700, ...mono }}>RECOMMENDED</div>
              )}
              <div style={{ fontSize:9, letterSpacing:"0.28em", color: p.featured?G.accent:G.textMid, marginBottom:28, ...mono }}>{p.name}</div>
              <div style={{ fontSize:52, fontWeight:700, color:G.white, lineHeight:1, letterSpacing:"-0.02em" }}>{p.setup}</div>
              <div style={{ fontSize:9, color:G.textDim, marginBottom:14, marginTop:4, letterSpacing:"0.12em", ...mono }}>ONE-TIME SETUP</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:6 }}>
                <span style={{ fontSize:28, fontWeight:600, color: p.featured?G.accent:G.textBright }}>{p.monthly}</span>
                <span style={{ fontSize:10, color:G.textMid, ...mono }}>/MONTH</span>
              </div>
              <div style={{ fontSize:12, color:G.textMid, marginBottom:36 }}>{p.desc}</div>
              <div style={{ height:1, background:G.border, marginBottom:28 }} />
              {p.features.map(f => (
                <div key={f} style={{ display:"flex", gap:10, marginBottom:12, alignItems:"flex-start" }}>
                  <span style={{ color:G.accent, fontSize:10, marginTop:2, flexShrink:0 }}>+</span>
                  <span style={{ fontSize:12, color:G.textMid, lineHeight:1.5 }}>{f}</span>
                </div>
              ))}
              <PrimaryBtn onClick={() => setScreen("setup")} full={true}>
                {p.featured ? "GET STARTED →" : "SELECT PLAN"}
              </PrimaryBtn>
            </div>
          ))}
        </div>
        <div className="f3" style={{ marginTop:20, fontSize:10, color:G.textDim, letterSpacing:"0.1em", textAlign:"center", ...mono }}>
          ALL PLANS · UNLIMITED AI SESSIONS · NO CONTRACTS · CANCEL ANYTIME
        </div>
      </div>
    </div>
  );

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (screen === "setup") return (
    <div style={{ ...base, display:"flex", flexDirection:"column", minHeight:"100vh" }}>
      <style>{CSS}</style>
      <Nav right={<SmallBtn onClick={() => setScreen("landing")}>← BACK</SmallBtn>} />

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 40px" }}>
        <div style={{ width:"100%", maxWidth:560 }}>
          <div style={{ fontSize:9, letterSpacing:"0.25em", color:G.accent, marginBottom:16, ...mono }}>NEW SESSION</div>
          <h2 style={{ fontSize:40, fontWeight:700, color:G.white, marginBottom:48, letterSpacing:"-0.01em", textTransform:"uppercase", lineHeight:1 }}>
            CONFIGURE<br />YOUR INTAKE
          </h2>

          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:9, letterSpacing:"0.22em", color:G.textMid, marginBottom:14, ...mono }}>SETTING TYPE</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
              {SETTINGS.map(s => (
                <button key={s.id} className={`scard ${setting===s.id?"on":""}`} onClick={() => setSetting(s.id)} style={{
                  padding:"14px 18px", background:"transparent",
                  border:`1px solid ${G.border}`,
                  color: setting===s.id?G.accent:G.textMid,
                  fontSize:10, letterSpacing:"0.18em", textAlign:"left", ...mono,
                }}>{s.label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:40 }}>
            <div style={{ fontSize:9, letterSpacing:"0.22em", color:G.textMid, marginBottom:14, ...mono }}>
              PRACTICE NAME <span style={{ opacity:0.4 }}>(OPTIONAL)</span>
            </div>
            <input
              value={practiceName}
              onChange={e => setPracticeName(e.target.value)}
              onKeyDown={e => e.key==="Enter" && setting && startSession()}
              placeholder="e.g. Lakeside Dental Studio"
              style={{ width:"100%", background:G.surface, border:`1px solid ${G.border}`, padding:"14px 18px", color:G.textBright, fontSize:13, transition:"border-color 0.2s", ...mono }}
            />
          </div>

          <button
            className="gbtn"
            onClick={startSession}
            disabled={!setting}
            style={{ width:"100%", background:setting?G.accent:G.border, color:setting?"#050505":G.textDim, border:"none", padding:"16px", fontSize:11, letterSpacing:"0.22em", cursor:setting?"pointer":"default", fontWeight:700, ...mono }}
          >
            BEGIN INTAKE SESSION →
          </button>
        </div>
      </div>
    </div>
  );

  // ── SESSION ────────────────────────────────────────────────────────────────
  if (screen === "session") return (
    <div style={{ height:"100vh", background:G.bg, color:G.textBright, ...sans, display:"flex", flexDirection:"column", WebkitFontSmoothing:"antialiased" }}>
      <style>{CSS}</style>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 32px", borderBottom:`1px solid ${G.border}`, background:G.surface, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <LiveDot />
          <div>
            <div style={{ fontSize:12, fontWeight:600, letterSpacing:"0.15em", color:G.white, ...mono }}>LUMINX SYSTEMS</div>
            <div style={{ fontSize:8, letterSpacing:"0.22em", color:G.textMid, ...mono }}>LIVE SESSION · {setting?.toUpperCase()} · {practiceName||"—"}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <PrimaryBtn onClick={generateNote}>GENERATE NOTE →</PrimaryBtn>
          <SmallBtn onClick={reset}>END SESSION</SmallBtn>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"32px 28px" }}>
        <div style={{ maxWidth:680, margin:"0 auto", display:"flex", flexDirection:"column", gap:18 }}>
          {messages.map((msg, i) => (
            <div key={i} className="msg" style={{ display:"flex", flexDirection:"column", alignItems: msg.from==="patient"?"flex-end":"flex-start" }}>
              <div style={{ fontSize:8, letterSpacing:"0.2em", color: msg.from==="luminx"?G.accent:G.textDim, marginBottom:6, ...mono }}>
                {msg.from==="luminx" ? "LUMINX" : "PATIENT"}
              </div>
              <div style={{
                maxWidth:"80%", padding:"14px 18px",
                background: msg.from==="patient"?"rgba(0,212,255,0.07)":G.surface,
                border:`1px solid ${msg.from==="patient"?"rgba(0,212,255,0.2)":G.border}`,
                color: msg.from==="patient"?G.textBright:G.textMid,
                fontSize:14, lineHeight:1.75, fontWeight:300,
              }}>
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg" style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
              <div style={{ fontSize:8, letterSpacing:"0.2em", color:G.accent, marginBottom:6, ...mono }}>LUMINX</div>
              <div style={{ background:G.surface, border:`1px solid ${G.border}`, padding:"14px 20px", display:"flex", gap:5, alignItems:"center" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:G.accent, animation:"dot 1.1s ease-in-out infinite", animationDelay:`${i*0.16}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div style={{ borderTop:`1px solid ${G.border}`, background:G.surface, padding:"16px 28px", flexShrink:0 }}>
        <div style={{ maxWidth:680, margin:"0 auto", display:"flex", gap:10 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==="Enter" && send()}
            placeholder="Patient response..."
            style={{ flex:1, background:G.bg, border:`1px solid ${G.border}`, padding:"13px 18px", color:G.textBright, fontSize:13, fontWeight:300, transition:"border-color 0.2s", ...mono }}
          />
          <button className="send" onClick={send} disabled={loading||!input.trim()} style={{ background:"transparent", border:`1px solid ${G.border}`, color:G.accent, padding:"13px 22px", fontSize:14, cursor:"pointer", transition:"all 0.15s", flexShrink:0, ...mono }}>→</button>
        </div>
        <div style={{ maxWidth:680, margin:"7px auto 0", fontSize:8, color:G.textDim, letterSpacing:"0.14em", textAlign:"center", ...mono }}>
          ONLY VOLUNTARILY SHARED INFORMATION IS RECORDED · PRIVACY GUARANTEED
        </div>
      </div>
    </div>
  );

  // ── NOTE ───────────────────────────────────────────────────────────────────
  if (screen === "note") return (
    <div style={base}>
      <style>{CSS}</style>
      <Nav right={<>
        <SmallBtn onClick={() => setScreen("session")}>← BACK TO SESSION</SmallBtn>
        <button className="abtn" onClick={copyNote} disabled={noteLoading} style={{
          background: copied?"rgba(0,212,255,0.1)":"transparent",
          border:`1px solid ${copied?G.accent:G.border}`,
          color: copied?G.accent:G.textMid,
          padding:"8px 18px", fontSize:10, letterSpacing:"0.18em", cursor:"pointer", ...mono, transition:"all 0.2s",
        }}>{copied ? "COPIED ✓" : "COPY NOTE"}</button>
        <SmallBtn onClick={reset}>NEW SESSION</SmallBtn>
      </>} />

      <div style={{ maxWidth:760, margin:"0 auto", padding:"56px 40px" }}>
        <div style={{ marginBottom:36 }}>
          <div style={{ fontSize:9, letterSpacing:"0.25em", color:G.accent, marginBottom:10, ...mono }}>GENERATED INTAKE NOTE</div>
          <div style={{ fontSize:10, color:G.textDim, letterSpacing:"0.12em", ...mono }}>
            {practiceName||"CLINIC"} · {new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}).toUpperCase()} · {new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}
          </div>
        </div>

        <div style={{ background:G.surface, border:`1px solid ${G.border}`, padding:"40px 44px", minHeight:420, position:"relative" }}>
          {/* corner accent */}
          <div style={{ position:"absolute", top:0, left:0, width:40, height:40, borderRight:`1px solid ${G.accent}`, borderBottom:`1px solid ${G.accent}`, opacity:0.3 }} />
          <div style={{ position:"absolute", bottom:0, right:0, width:40, height:40, borderLeft:`1px solid ${G.accent}`, borderTop:`1px solid ${G.accent}`, opacity:0.3 }} />

          {noteLoading ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:300, gap:16 }}>
              <div style={{ display:"flex", gap:6 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:G.accent, animation:"dot 1.2s ease-in-out infinite", animationDelay:`${i*0.18}s` }} />
                ))}
              </div>
              <div style={{ fontSize:9, letterSpacing:"0.28em", color:G.textDim, ...mono }}>GENERATING CLINICAL NOTE</div>
            </div>
          ) : (
            <pre style={{ whiteSpace:"pre-wrap", wordBreak:"break-word", color:G.textMid, fontSize:13, lineHeight:1.9, fontFamily:"'Space Mono',monospace", fontWeight:400 }}>{note}</pre>
          )}
        </div>

        <div style={{ marginTop:14, padding:"12px 18px", border:`1px solid rgba(0,212,255,0.12)`, background:"rgba(0,212,255,0.03)", display:"flex", alignItems:"center", gap:10 }}>
          <LiveDot />
          <div style={{ fontSize:9, color:G.textDim, letterSpacing:"0.12em", ...mono }}>
            NOTE CONTAINS ONLY VOLUNTARILY SHARED INFORMATION · ZERO DATA STORED OR SHARED EXTERNALLY
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from "react";
import { useStreak } from "./hooks/useStreak";

// ── Per-tab blank project factory ─────────────────────────────────────────────
const blankProject = () => ({
  nodes: [], activeNode: 0, xp: 0, completedNodes: [],
  title: "", desc: "", category: "", hasRoadmap: false,
});

// ── Countdown Timer Hook ──────────────────────────────────────────────────────
function useCountdownTimer() {
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("work");
  const intervalRef = useRef(null);

  const playAlarm = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const beep = (freq, t, dur) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = "sine";
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.start(t); osc.stop(t + dur);
      };
      const t = ctx.currentTime;
      beep(880,t,0.3); beep(1100,t+0.35,0.3); beep(880,t+0.7,0.3); beep(1320,t+1.05,0.5);
    } catch(e) {}
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) { clearInterval(intervalRef.current); setIsRunning(false); playAlarm(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else { clearInterval(intervalRef.current); }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const start = () => { if (remaining > 0) setIsRunning(true); };
  const pause = () => setIsRunning(false);
  const reset = () => { setIsRunning(false); setRemaining(totalSeconds); };
  const setDuration = (secs) => { setIsRunning(false); setTotalSeconds(secs); setRemaining(secs); };
  const formatTime = (s) => {
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
    if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };
  const pct = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;
  return { remaining, isRunning, mode, setMode, start, pause, reset, setDuration, formatTime, pct, totalSeconds };
}

// ── Themes ────────────────────────────────────────────────────────────────────
const darkTheme = {
  bg: "#0E131C", panelBg: "#1e2235", cardBg: "#2d3450",
  border: "#3a3f5a", text: "#fff", subText: "#aab", dimText: "#778",
  mutedText: "#556", inputBg: "#1a1f35", trackBg: "#2a2f45",
  completedLine: "#ffffff", isDark: true,
  scrollbar: "scrollbar-dark",
};
const lightTheme = {
  bg: "#e8eaf0", panelBg: "#f0f2f7", cardBg: "#ffffff",
  border: "#d0d4e4", text: "#1a1f35", subText: "#556", dimText: "#667",
  mutedText: "#99a", inputBg: "#e0e3ef", trackBg: "#d4d8eb",
  completedLine: "#4caf7d", isDark: false,
  scrollbar: "scrollbar-light",
};

const ROW_H = 44;

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({ projectLabel, onConfirm, onCancel, T }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,backgroundColor:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ backgroundColor:T.panelBg,borderRadius:"16px",padding:"28px 32px",maxWidth:"360px",width:"90%",boxShadow:"0 8px 40px rgba(0,0,0,0.5)",border:`1px solid ${T.border}`,fontFamily:"inherit" }}>
        <div style={{ fontSize:"22px",marginBottom:"10px" }}>🗑️</div>
        <div style={{ fontSize:"16px",fontWeight:"700",color:T.text,marginBottom:"8px" }}>Delete project?</div>
        <div style={{ fontSize:"13px",color:T.subText,marginBottom:"24px",lineHeight:1.6 }}>
          Are you sure you want to delete <strong style={{ color:"#ffbf6e" }}>"{projectLabel}"</strong>? This cannot be undone.
        </div>
        <div style={{ display:"flex",gap:"10px",justifyContent:"flex-end" }}>
          <button onClick={onCancel} style={{ padding:"8px 18px",borderRadius:"8px",border:`1px solid ${T.border}`,background:"transparent",color:T.subText,fontFamily:"inherit",fontSize:"13px",cursor:"pointer",fontWeight:"600" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding:"8px 18px",borderRadius:"8px",border:"none",background:"#ff4444",color:"#fff",fontFamily:"inherit",fontSize:"13px",cursor:"pointer",fontWeight:"700" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Notification Bell Menu ────────────────────────────────────────────────────
function BellMenu({ notifications, onClear, T }) {
  return (
    <div style={{ position:"absolute",top:"calc(100% + 8px)",right:0,zIndex:500,backgroundColor:T.panelBg,border:`1px solid ${T.border}`,borderRadius:"14px",padding:"12px",minWidth:"280px",boxShadow:"0 8px 32px rgba(0,0,0,0.35)" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px" }}>
        <span style={{ fontSize:"12px",fontWeight:"700",color:T.subText,letterSpacing:"1px",textTransform:"uppercase" }}>Notifications</span>
        {notifications.length > 0 && <button onClick={onClear} style={{ background:"none",border:"none",color:"#ffbf6e",fontSize:"11px",cursor:"pointer",fontFamily:"inherit",fontWeight:"600" }}>Clear all</button>}
      </div>
      {notifications.length === 0 ? (
        <div style={{ fontSize:"13px",color:T.mutedText,padding:"12px 0" }}>No notifications yet</div>
      ) : notifications.map((n,i) => (
        <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:"10px",padding:"8px 0",borderTop:i>0?`1px solid ${T.border}`:"none" }}>
          <span style={{ fontSize:"18px",flexShrink:0 }}>{n.icon}</span>
          <div>
            <div style={{ fontSize:"13px",fontWeight:"600",color:T.text,marginBottom:"2px" }}>{n.title}</div>
            <div style={{ fontSize:"11px",color:T.subText }}>{n.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function SidebarIcon({ onClick, title, children, active, T }) {
  const [h, setH] = useState(false);
  return (
    <button style={{ background:"none",border:"none",cursor:"pointer",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",width:"38px",height:"38px",transition:"color 0.2s, background 0.2s",color:active||h?T.text:T.dimText,backgroundColor:active||h?T.cardBg:"transparent" }}
      onClick={onClick} title={title} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}>
      {children}
    </button>
  );
}

function Sidebar({ onTimerToggle, isRunning, darkMode, onToggleDark, T }) {
  return (
    <div style={{ backgroundColor:T.panelBg,width:"56px",minWidth:"56px",padding:"16px 8px",borderRadius:"30px",display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",flexShrink:0 }}>
      <SidebarIcon onClick={onTimerToggle} title="Timer" active={isRunning} T={T}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </SidebarIcon>
      <SidebarIcon title="Camera" T={T}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      </SidebarIcon>
      <SidebarIcon onClick={onToggleDark} title={darkMode ? "Light Mode" : "Dark Mode"} T={T}>
        {darkMode ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        )}
      </SidebarIcon>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ tabs, activeTab, onTabClick, onAddTab, onDeleteTab, streak, notifications, onClearNotifs, T }) {
  const [pendingDelete, setPendingDelete] = useState(null);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    if (!bellOpen) return;
    const h = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [bellOpen]);

  return (
    <>
      {pendingDelete !== null && <DeleteConfirmModal projectLabel={tabs[pendingDelete]?.label} onConfirm={() => { onDeleteTab(pendingDelete); setPendingDelete(null); }} onCancel={() => setPendingDelete(null)} T={T} />}
      <div style={{ display:"flex",alignItems:"flex-end",backgroundColor:T.bg,flexShrink:0 }}>
        {tabs.map((tab,i) => (
          <div key={tab.id} style={{ position:"relative",display:"inline-flex",marginRight:"4px" }}>
            <button style={{ backgroundColor:activeTab===i?T.cardBg:T.panelBg,padding:"10px 36px 10px 16px",borderRadius:"12px 12px 0 0",color:activeTab===i?T.text:T.dimText,cursor:"pointer",fontSize:"14px",fontWeight:activeTab===i?"600":"400",userSelect:"none",border:"none",fontFamily:"inherit",lineHeight:1.4 }}
              onClick={() => onTabClick(i)}>{tab.label}</button>
            {tabs.length > 1 && (
              <button onClick={e=>{e.stopPropagation();setPendingDelete(i);}} title="Delete project"
                style={{ position:"absolute",top:"5px",right:"5px",background:"none",border:"none",color:activeTab===i?"#ff7c7c":T.mutedText,cursor:"pointer",fontSize:"11px",lineHeight:1,padding:"0 2px",fontFamily:"inherit",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",width:"14px",height:"14px" }}
                onMouseEnter={e=>e.currentTarget.style.color="#ff4444"}
                onMouseLeave={e=>e.currentTarget.style.color=activeTab===i?"#ff7c7c":T.mutedText}
              >×</button>
            )}
          </div>
        ))}
        <button style={{ backgroundColor:"#ffbf6e",border:"none",borderRadius:"50%",width:"28px",height:"28px",color:"#0E131C",fontSize:"18px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginLeft:"8px",marginBottom:"6px",fontWeight:"bold",fontFamily:"inherit",flexShrink:0 }} onClick={onAddTab}>+</button>
        <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:"10px",paddingBottom:"6px",paddingRight:"4px",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:"6px",backgroundColor:T.panelBg,borderRadius:"10px",padding:"6px 12px 6px 10px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffbf6e" stroke="none"><path d="M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0c0-2.5-1.5-5-2-6.5C14.5 8 14 10 12 11c0 0 1-4-0-9z"/></svg>
            <span style={{ fontSize:"18px",fontWeight:"bold",color:T.text,lineHeight:1 }}>{streak}</span>
          </div>
          <div ref={bellRef} style={{ position:"relative" }}>
            <button onClick={()=>setBellOpen(o=>!o)}
              style={{ background:"none",border:"none",color:bellOpen?T.text:T.dimText,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",width:"32px",height:"32px",borderRadius:"8px",transition:"color 0.2s",padding:0,position:"relative" }}
              onMouseEnter={e=>e.currentTarget.style.color=T.text}
              onMouseLeave={e=>{ if(!bellOpen) e.currentTarget.style.color=T.dimText; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {notifications.length > 0 && <span style={{ position:"absolute",top:"2px",right:"2px",width:"8px",height:"8px",borderRadius:"50%",backgroundColor:"#ff4444",display:"block" }} />}
            </button>
            {bellOpen && <BellMenu notifications={notifications} onClear={()=>{ onClearNotifs(); setBellOpen(false); }} T={T} />}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Title Area ────────────────────────────────────────────────────────────────
function TitleArea({ onAtomize, title, setTitle, desc, setDesc, category, setCategory, T }) {
  const [atomizing, setAtomizing] = useState(false);

  const handleAtomize = async () => {
    if (!title.trim() || atomizing) return;
    setAtomizing(true);
    try { await onAtomize(title, category); }
    finally { setAtomizing(false); }
  };

  return (
    <div style={{ padding:"20px 28px 14px",flexShrink:0,borderBottom:`1px solid ${T.border}` }}>
      <div style={{ display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px" }}>
        <span style={{ backgroundColor:T.panelBg,padding:"3px 14px",borderRadius:"20px",color:T.subText,fontSize:"12px",whiteSpace:"nowrap",flexShrink:0 }}>{category||"tag"}</span>
        <input style={{ fontSize:"22px",fontWeight:"bold",color:"#ffbf6e",border:"none",outline:"none",background:"transparent",fontFamily:"inherit",flex:1,minWidth:0 }}
          placeholder="Project title..." value={title} onChange={e=>setTitle(e.target.value)} maxLength={60} />
      </div>
      <input style={{ fontSize:"13px",color:T.subText,border:"none",outline:"none",background:"transparent",fontFamily:"inherit",width:"100%",marginBottom:"10px",display:"block" }}
        placeholder="Project description..." value={desc} onChange={e=>setDesc(e.target.value)} maxLength={200} />
      <div style={{ display:"flex",gap:"8px",marginTop:"4px" }}>
        <input style={{ flex:1,padding:"7px 12px",borderRadius:"8px",border:"none",background:T.inputBg,color:T.text,fontFamily:"inherit",fontSize:"13px" }}
          placeholder="Category (e.g. Art, Coding...)" value={category} onChange={e=>setCategory(e.target.value)} />
        {/* Atomize button stays pressed/dark while running */}
        <button
          onClick={handleAtomize}
          disabled={atomizing || !title.trim()}
          style={{
            padding:"7px 18px",borderRadius:"8px",border:"none",fontWeight:"bold",cursor:atomizing||!title.trim()?"not-allowed":"pointer",fontFamily:"inherit",fontSize:"13px",
            background: atomizing ? "#c48a30" : "#ffbf6e",
            color: atomizing ? "#7a5010" : "#0E131C",
            opacity: atomizing ? 0.85 : 1,
            transition:"all 0.2s",
            display:"flex",alignItems:"center",gap:"6px",
          }}
        >
          {atomizing ? (
            <>
              <span style={{ display:"inline-block",animation:"spin 0.8s linear infinite" }}>⟳</span>
              Atomizing…
            </>
          ) : "✨ Atomize!"}
        </button>
      </div>
    </div>
  );
}

// ── File Upload Zone ──────────────────────────────────────────────────────────
function FileUploadZone({ onAtomizeFile, T }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const processFile = async (file) => {
    if (!file) return;
    setLoading(true); setError(""); setProgress(10);
    setStatus(`Reading "${file.name}"…`);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });
      setProgress(35);

      const isPdf = file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");

      const aiPrompt = `You are an expert academic content analyzer and ADHD productivity coach.

Analyze this file thoroughly. Identify ALL topics, chapters, lessons, and any assessments (quizzes, assignments, activities, labs, exams).

Return ONLY valid JSON, no markdown fences, no explanation:
{
  "project_name": "short descriptive title from the content",
  "nodes": [
    {
      "node_id": 1,
      "title": "Category or Chapter Name",
      "is_completed": false,
      "subtasks": [
        { "subtask_id": "1-1", "title": "Review: specific topic or concept", "is_completed": false },
        { "subtask_id": "1-2", "title": "Quiz: topic name", "is_completed": false }
      ]
    }
  ]
}

RULES:
- Each node = one major topic/chapter/category
- Each subtask = one specific review item, concept, or assessment
- Prefix assessments clearly: "Quiz:", "Assignment:", "Activity:", "Lab:", "Exam:"
- Keep subtask titles concise and actionable (start with a verb)
- Spread content across meaningful categories — do NOT lump everything into one node`;

      let messageContent;
      if (isPdf) {
        messageContent = [
          { type:"document", source:{ type:"base64", media_type:"application/pdf", data:base64 } },
          { type:"text", text:aiPrompt }
        ];
      } else if (isImage) {
        messageContent = [
          { type:"image", source:{ type:"base64", media_type:file.type, data:base64 } },
          { type:"text", text:aiPrompt }
        ];
      } else {
        const text = await file.text();
        messageContent = [{ type:"text", text:`${aiPrompt}\n\nFile content:\n${text.slice(0,8000)}` }];
      }

      setProgress(55); setStatus("AI is reading your file…");

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{ role:"user", content:messageContent }],
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

      setProgress(80); setStatus("Building your roadmap…");
      const data = await res.json();
      const raw = data.content?.map(b=>b.text||"").join("").trim();
      const clean = raw.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      if (!parsed?.nodes) throw new Error("No nodes in response");

      setProgress(100); setStatus("Done! ✨");
      onAtomizeFile(parsed);
    } catch(err) {
      console.error(err);
      setError("Failed to analyze file. " + (err.message || "Try again."));
      setLoading(false); setProgress(0);
    }
  };

  return (
    <div style={{ marginBottom:"16px" }}>
      <div
        className="upload-zone"
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);processFile(e.dataTransfer.files[0]);}}
        style={{ border:`2px dashed ${dragging?"#ffbf6e":T.border}`,borderRadius:"14px",padding:"20px 16px",textAlign:"center",cursor:loading?"wait":"pointer",background:dragging?T.inputBg:"transparent",transition:"all 0.2s" }}
        onClick={()=>!loading&&fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.doc,.docx,image/*" style={{display:"none"}} onChange={e=>processFile(e.target.files[0])} />
        {loading ? (
          <div style={{ color:"#ffbf6e",fontSize:"13px",fontWeight:"600" }}>
            <div style={{ width:"100%",backgroundColor:T.trackBg,borderRadius:"20px",height:"6px",overflow:"hidden",marginBottom:"8px" }}>
              <div style={{ width:`${progress}%`,height:"100%",backgroundColor:"#ffbf6e",borderRadius:"20px",transition:"width 0.5s ease" }}/>
            </div>
            <div style={{ fontSize:"11px",color:T.subText,marginBottom:"4px" }}>{progress}%</div>
            <div>{status}</div>
          </div>
        ) : (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.subText} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"block",margin:"0 auto 8px"}}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div style={{ fontSize:"13px",fontWeight:"600",color:T.subText,marginBottom:"3px" }}>Upload a module or file</div>
            <div style={{ fontSize:"11px",color:T.mutedText }}>PDF, TXT, MD, Images — AI will auto-create your roadmap</div>
            {error && <div style={{ fontSize:"11px",color:"#ff7c7c",marginTop:"6px" }}>{error}</div>}
          </>
        )}
      </div>
    </div>
  );
}

// ── Countdown Timer ───────────────────────────────────────────────────────────
function CountdownTimer({ timer, T }) {
  const { remaining, isRunning, mode, setMode, start, pause, reset, setDuration, formatTime, pct, totalSeconds } = timer;
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("");
  const inputRef = useRef(null);

  const openEdit = () => { if (isRunning) return; setEditVal(formatTime(totalSeconds)); setEditing(true); };
  useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editing]);
  const applyEdit = () => {
    const parts = editVal.trim().split(":").map(p=>parseInt(p)||0);
    let secs = 0;
    if (parts.length===3) secs=parts[0]*3600+parts[1]*60+parts[2];
    else if (parts.length===2) secs=parts[0]*60+parts[1];
    else secs=parts[0]*60;
    if (secs>0) setDuration(secs);
    setEditing(false);
  };

  const r=44, circ=2*Math.PI*r, dash=circ*(1-pct/100);
  const isBreak=mode==="break";

  return (
    <div style={{ width:"100%",display:"flex",flexDirection:"column",alignItems:"center" }}>
      <div style={{ width:"100%",height:"1px",backgroundColor:T.border,marginBottom:"14px" }} />
      <div style={{ display:"flex",gap:"6px",marginBottom:"14px" }}>
        {["work","break"].map(m=>(
          <button key={m} onClick={()=>{setMode(m);reset();}}
            style={{ padding:"3px 14px",borderRadius:"20px",border:"none",background:mode===m?"#ffbf6e":T.trackBg,color:mode===m?"#0E131C":T.dimText,fontWeight:mode===m?"700":"400",fontFamily:"inherit",fontSize:"11px",cursor:"pointer",textTransform:"uppercase",letterSpacing:"1px" }}>
            {m==="work"?"Focus":"Break"}
          </button>
        ))}
      </div>
      <div style={{ fontSize:"10px",color:T.dimText,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"10px" }}>{isBreak?"Break Timer":"Flowtime Timer"}</div>
      <div style={{ position:"relative",width:"110px",height:"110px",marginBottom:"14px" }}>
        <svg width="110" height="110" style={{ position:"absolute",top:0,left:0 }}>
          <circle cx="55" cy="55" r={r} fill="none" stroke={T.trackBg} strokeWidth="6" />
          <circle cx="55" cy="55" r={r} fill="none" stroke={isBreak?"#4caf7d":"#ffbf6e"} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round" transform="rotate(-90 55 55)" style={{ transition:"stroke-dashoffset 0.8s ease" }} />
        </svg>
        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
          {editing ? (
            <input ref={inputRef} value={editVal} onChange={e=>setEditVal(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")applyEdit();if(e.key==="Escape")setEditing(false);}}
              style={{ width:"80px",background:"transparent",border:"none",borderBottom:`2px solid ${isBreak?"#4caf7d":"#ffbf6e"}`,color:isBreak?"#4caf7d":"#ffbf6e",fontSize:"17px",fontWeight:"bold",textAlign:"center",fontFamily:"inherit",outline:"none",letterSpacing:"2px" }}
              placeholder="25:00" />
          ) : (
            <div onClick={openEdit} title={isRunning?"":"Click to edit"} style={{ fontSize:"22px",fontWeight:"bold",color:isBreak?"#4caf7d":"#ffbf6e",letterSpacing:"2px",cursor:isRunning?"default":"pointer",userSelect:"none" }}>
              {formatTime(remaining)}
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize:"11px",color:T.mutedText,marginBottom:"10px",minHeight:"16px" }}>
        {editing?"enter to save · esc to cancel":!isRunning?"click time to edit":""}
      </div>
      <div style={{ display:"flex",gap:"6px" }}>
        <button onClick={start} disabled={isRunning||remaining===0} style={{ padding:"6px 14px",borderRadius:"8px",border:"none",background:isRunning||remaining===0?T.trackBg:"#7effd4",color:isRunning||remaining===0?T.mutedText:"#0E131C",fontWeight:"bold",cursor:isRunning||remaining===0?"not-allowed":"pointer",fontFamily:"inherit",fontSize:"12px" }}>▶ Start</button>
        <button onClick={pause} disabled={!isRunning} style={{ padding:"6px 14px",borderRadius:"8px",border:"none",background:!isRunning?T.trackBg:"#ffbf6e",color:!isRunning?T.mutedText:"#0E131C",fontWeight:"bold",cursor:!isRunning?"not-allowed":"pointer",fontFamily:"inherit",fontSize:"12px" }}>⏸ Pause</button>
        <button onClick={reset} style={{ padding:"6px 14px",borderRadius:"8px",border:"none",background:T.panelBg,color:T.text,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",fontSize:"12px" }}>↺ Reset</button>
      </div>
      {remaining===0&&<div style={{ marginTop:"10px",fontSize:"13px",fontWeight:"600",color:isBreak?"#4caf7d":"#ffbf6e",animation:"pulse 1s ease-in-out infinite alternate" }}>{isBreak?"Break over! 💪":"Done! 🎉"}</div>}
    </div>
  );
}

// ── Scoreboard ────────────────────────────────────────────────────────────────
function Scoreboard({ xp, streak, timer, totalNodes, T }) {
  const maxXp=(totalNodes||5)*150, pct=(xp/maxXp)*100;
  const msg=streak>0?`You are on a ${streak}-day streak!`:"No streak yet!";
  const sub=streak>=7?"Unstoppable! 🔥":streak>=3?"Keep it up!":streak>=1?"Good start!":"Complete a task to start!";
  return (
    <div className={T.scrollbar} style={{ flex:1,backgroundColor:T.panelBg,borderRadius:"20px",padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center",overflowY:"auto" }}>
      <div style={{ fontSize:"64px",marginBottom:"6px",lineHeight:1 }}>🍪</div>
      <div style={{ fontSize:"15px",fontWeight:"bold",color:T.text,textAlign:"center",marginBottom:"2px" }}>{msg}</div>
      <div style={{ fontSize:"12px",color:T.subText,textAlign:"center",marginBottom:"14px" }}>{sub}</div>
      <div style={{ width:"100%" }}>
        <div style={{ width:"100%",backgroundColor:T.trackBg,borderRadius:"20px",height:"10px",overflow:"hidden",marginBottom:"4px" }}>
          <div style={{ width:`${Math.min(pct,100)}%`,height:"100%",backgroundColor:"#4caf7d",borderRadius:"20px",transition:"width 0.4s ease" }}/>
        </div>
      </div>
      <div style={{ fontSize:"12px",color:"#7effd4",alignSelf:"flex-end",marginBottom:"14px" }}>Points: {xp}</div>
      <CountdownTimer timer={timer} T={T} />
    </div>
  );
}

// ── Subtask Row ───────────────────────────────────────────────────────────────
function SubtaskRow({ sub, isNextUp, isLocked, onComplete, T }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file||!file.type.startsWith("image/")) return;
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    setTimeout(()=>{ setUploading(false); onComplete(); }, 500);
  };

  const trigger = () => { if (!isNextUp||sub.is_completed) return; fileInputRef.current?.click(); };

  return (
    <div style={{ height:`${ROW_H}px`,display:"flex",alignItems:"center",gap:"8px",opacity:isLocked?0.35:1,transition:"opacity 0.3s" }}
      title={isLocked?"Complete previous task first":isNextUp?"Upload proof to complete":""}>
      <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFileChange} />
      <div onClick={trigger}
        style={{ width:"26px",height:"26px",borderRadius:"50%",flexShrink:0,transition:"all 0.3s",cursor:isNextUp&&!sub.is_completed?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",
          border:`2px solid ${sub.is_completed?"#4caf7d":isNextUp?"#ffbf6e":"#3a4060"}`,
          backgroundColor:sub.is_completed?"#4caf7d":"transparent",
          boxShadow:isNextUp&&!sub.is_completed?"0 0 8px #ffbf6e88":"none" }}>
        {sub.is_completed&&<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="2,6 5,9 10,3"/></svg>}
        {!sub.is_completed&&isNextUp&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffbf6e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
        {uploading&&<div style={{ width:"8px",height:"8px",borderRadius:"50%",background:"#ffbf6e",animation:"pulse 0.5s ease infinite alternate" }}/>}
      </div>
      <span style={{ fontSize:"13px",color:sub.is_completed?"#4caf7d":isNextUp?T.text:T.dimText,transition:"color 0.3s",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1 }}>
        {sub.title}
      </span>
      {isNextUp&&!sub.is_completed&&(
        <button onClick={trigger} title="Attach proof screenshot" style={{ marginLeft:"auto",background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center",flexShrink:0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffbf6e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
      )}
      {sub.is_completed&&preview&&<img src={preview} alt="proof" style={{ width:"20px",height:"20px",borderRadius:"4px",objectFit:"cover",border:"1px solid #4caf7d",flexShrink:0,marginLeft:"auto" }}/>}
    </div>
  );
}

// ── Phase Block ───────────────────────────────────────────────────────────────
function PhaseBlock({ node, isPhaseActive, onCompleteSubtask, T }) {
  const subtasks = node.subtasks||[];
  const svgH = subtasks.length * ROW_H;
  const doneSubs = subtasks.filter(s=>s.is_completed).length;
  const lineColor = T.completedLine;
  const trackColor = T.isDark ? "#2a2f45" : T.border;

  return (
    <div style={{ marginBottom:"24px" }}>
      <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"4px" }}>
        <div style={{ width:"30px",height:"30px",borderRadius:"50%",flexShrink:0,transition:"all 0.3s",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",
          border:`2px solid ${node.is_completed?"#4caf7d":isPhaseActive?"#ffbf6e":"#445"}`,
          backgroundColor:node.is_completed?"#4caf7d":"transparent",color:"#fff" }}>
          {node.is_completed?"✓":""}
        </div>
        <div style={{ fontSize:"15px",fontWeight:"600",transition:"color 0.3s",color:node.is_completed?"#4caf7d":isPhaseActive?"#ffbf6e":T.text }}>
          {node.title}
        </div>
      </div>
      {subtasks.length>0&&(
        <div style={{ display:"flex",alignItems:"flex-start",marginLeft:"14px" }}>
          {/*
            FIX: Replace glitchy snake animation with a clean pop-fade.
            Completed lines render instantly with full opacity.
            The newest completed one gets a pop-fade keyframe (scale + opacity).
            No strokeDashoffset at all — that was causing the glitch.
          */}
          <svg key={`svg-${node.node_id}-${doneSubs}`} width="32" height={svgH} style={{ flexShrink:0 }}>
            {/* Track lines */}
            <line x1="2" y1="0" x2="2" y2={svgH} stroke={trackColor} strokeWidth="3"/>
            {subtasks.map((sub,i)=>{
              const cy=i*ROW_H+ROW_H/2;
              return <line key={`trk-${sub.subtask_id}`} x1="2" y1={cy} x2="28" y2={cy} stroke={trackColor} strokeWidth="3"/>;
            })}
            {/* Completed lines — newest gets pop-fade, rest are instant */}
            {subtasks.map((sub,i)=>{
              if(!sub.is_completed) return null;
              const prevCy = i===0 ? 0 : (i-1)*ROW_H+ROW_H/2;
              const cy = i*ROW_H+ROW_H/2;
              const isNewest = i===doneSubs-1;
              const animStyle = isNewest
                ? { animation:"popFade 0.3s ease-out forwards" }
                : {};
              return (
                <g key={`done-${sub.subtask_id}`} style={animStyle}>
                  <line x1="2" y1={prevCy} x2="2" y2={cy} stroke={lineColor} strokeWidth="3"/>
                  <line x1="2" y1={cy} x2="28" y2={cy} stroke={lineColor} strokeWidth="3"/>
                </g>
              );
            })}
          </svg>
          <div style={{ display:"flex",flexDirection:"column",flex:1 }}>
            {subtasks.map((sub,i)=>{
              const prevDone=i===0||subtasks[i-1].is_completed;
              const isNextUp=!sub.is_completed&&prevDone&&isPhaseActive;
              return <SubtaskRow key={sub.subtask_id} sub={sub} isNextUp={isNextUp} isLocked={!sub.is_completed&&!isNextUp} onComplete={()=>onCompleteSubtask(node.node_id,sub.subtask_id)} T={T}/>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Roadmap ───────────────────────────────────────────────────────────────────
function Roadmap({ nodes, activeNode, onCompleteSubtask, onAtomizeFile, hasRoadmap, T }) {
  return (
    <div className={T.scrollbar} style={{ flex:"0 0 58%",backgroundColor:T.panelBg,borderRadius:"20px",padding:"20px",overflowY:"auto",display:"flex",flexDirection:"column" }}>
      <div style={{ fontSize:"12px",color:T.subText,marginBottom:"16px",fontWeight:"600",letterSpacing:"1px",textTransform:"uppercase" }}>Roadmap</div>
      {/* Hide upload zone once a roadmap exists */}
      {!hasRoadmap && <FileUploadZone onAtomizeFile={onAtomizeFile} T={T}/>}
      {nodes.length===0?(
        <p style={{ color:T.mutedText,fontSize:"13px",margin:0 }}>Enter a project above and hit ✨ Atomize!, or upload a file to generate your roadmap.</p>
      ):(
        nodes.map(node=>(
          <PhaseBlock key={node.node_id} node={node} isPhaseActive={node.node_id===activeNode&&!node.is_completed} onCompleteSubtask={onCompleteSubtask} T={T}/>
        ))
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function Breadcrumber() {
  const tabCounter = useRef(3);
  const [tabs, setTabs] = useState([
    { id:1, label:"Project 1" },
    { id:2, label:"Project 2" },
    { id:3, label:"Project 3" },
  ]);
  const [activeTab, setActiveTab] = useState(0);
  const [tabData, setTabData] = useState({ 1:blankProject(), 2:blankProject(), 3:blankProject() });
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const { streak, updateStreak } = useStreak();
  const timer = useCountdownTimer();
  const T = darkMode ? darkTheme : lightTheme;
  const currentTabId = tabs[activeTab]?.id;
  const project = tabData[currentTabId] || blankProject();

  const updateProject = useCallback((id, updater) => {
    setTabData(prev => ({ ...prev, [id]: updater(prev[id] || blankProject()) }));
  }, []);

  const setTitle    = v => updateProject(currentTabId, p=>({...p, title:v}));
  const setDesc     = v => updateProject(currentTabId, p=>({...p, desc:v}));
  const setCategory = v => updateProject(currentTabId, p=>({...p, category:v}));

  const handleCompleteSubtask = (nodeId, subtaskId) => {
    const tabId = currentTabId;
    updateProject(tabId, proj => {
      const updatedNodes = proj.nodes.map(node => {
        if (node.node_id !== nodeId) return node;
        const updatedSubtasks = node.subtasks.map(s => s.subtask_id===subtaskId ? {...s,is_completed:true} : s);
        const allDone = updatedSubtasks.every(s=>s.is_completed);
        if (allDone && !node.is_completed) {
          setNotifications(prev => [{ icon:"🏆", title:`Phase complete: ${node.title}`, body:`You finished all subtasks in "${node.title}"!` }, ...prev]);
        }
        return { ...node, subtasks:updatedSubtasks, is_completed:allDone };
      });
      const cNode = updatedNodes.find(n=>n.node_id===nodeId);
      const parentDone = cNode?.is_completed;
      return {
        ...proj, nodes:updatedNodes,
        activeNode: parentDone ? proj.activeNode+1 : proj.activeNode,
        xp: proj.xp + 50 + (parentDone ? 100 : 0),
        completedNodes: parentDone ? [...proj.completedNodes, nodeId] : proj.completedNodes,
      };
    });
    updateStreak();
  };

  // Atomize via backend (Gemini-powered BreadCrumbAlgo)
  const handleAtomize = async (projectName, cat) => {
    const res = await fetch("http://localhost:8000/projects", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ project_name:projectName, category:cat }),
    });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    const data = await res.json();
    // Backend returns ProjectRoadmap with .nodes (RoadmapNode[])
    // Each node has .title, .subtasks[] with .subtask_id and .title
    updateProject(currentTabId, p=>({...p, nodes:data.nodes, activeNode:0, xp:0, completedNodes:[], hasRoadmap:true}));
  };

  // Atomize via file upload (Claude API direct)
  const handleAtomizeFile = (parsed) => {
    if (!parsed?.nodes) return;
    updateProject(currentTabId, p=>({
      ...p, nodes:parsed.nodes, activeNode:0, xp:0, completedNodes:[],
      title: parsed.project_name || p.title,
      hasRoadmap:true,
    }));
  };

  const handleAddTab = () => {
    tabCounter.current += 1;
    const newId = tabCounter.current;
    setTabs(prev=>[...prev,{id:newId,label:`Project ${newId}`}]);
    setTabData(prev=>({...prev,[newId]:blankProject()}));
    setActiveTab(tabs.length);
  };

  const handleDeleteTab = (i) => {
    if (tabs.length<=1) return;
    const dId = tabs[i].id;
    setTabs(prev=>prev.filter((_,idx)=>idx!==i));
    setTabData(prev=>{ const n={...prev}; delete n[dId]; return n; });
    setActiveTab(prev=>{ if(prev===i) return Math.max(0,i-1); if(prev>i) return prev-1; return prev; });
  };

  return (
    <div style={{ backgroundColor:T.bg,padding:"10px",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",height:"100vh",margin:0,boxSizing:"border-box",overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin    { from{transform:rotate(0deg)}  to{transform:rotate(360deg)} }
        @keyframes pulse   { from{opacity:0.6}             to{opacity:1} }
        @keyframes popFade { 0%{opacity:0;transform:scale(0.85)} 60%{opacity:1;transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }
        ::placeholder { color: #889; }
        * { box-sizing: border-box; }
        .upload-zone:hover { border-color: #ffbf6e !important; }

        /* Light mode scrollbars */
        .scrollbar-light::-webkit-scrollbar        { width:6px; }
        .scrollbar-light::-webkit-scrollbar-track  { background:#e0e3ef; border-radius:10px; }
        .scrollbar-light::-webkit-scrollbar-thumb  { background:#b0b8d4; border-radius:10px; }
        .scrollbar-light::-webkit-scrollbar-thumb:hover { background:#8891b8; }

        /* Dark mode scrollbars */
        .scrollbar-dark::-webkit-scrollbar        { width:6px; }
        .scrollbar-dark::-webkit-scrollbar-track  { background:#1a1f35; border-radius:10px; }
        .scrollbar-dark::-webkit-scrollbar-thumb  { background:#3a4060; border-radius:10px; }
        .scrollbar-dark::-webkit-scrollbar-thumb:hover { background:#556080; }
      `}</style>
      <div style={{ display:"flex",gap:"16px",padding:"16px",height:"100%",boxSizing:"border-box" }}>
        <Sidebar onTimerToggle={()=>timer.isRunning?timer.pause():timer.start()} isRunning={timer.isRunning} darkMode={darkMode} onToggleDark={()=>setDarkMode(d=>!d)} T={T}/>
        <div style={{ flex:1,display:"flex",flexDirection:"column",minWidth:0 }}>
          <Nav tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} onAddTab={handleAddTab} onDeleteTab={handleDeleteTab} streak={streak} notifications={notifications} onClearNotifs={()=>setNotifications([])} T={T}/>
          <div style={{ backgroundColor:T.cardBg,flex:1,borderRadius:"0 12px 12px 12px",overflow:"hidden",display:"flex",flexDirection:"column",minHeight:0 }}>
            <TitleArea onAtomize={handleAtomize} title={project.title} setTitle={setTitle} desc={project.desc} setDesc={setDesc} category={project.category} setCategory={setCategory} T={T}/>
            <div style={{ display:"flex",gap:"12px",flex:1,padding:"12px 16px 16px",minHeight:0 }}>
              <Roadmap nodes={project.nodes} activeNode={project.activeNode} onCompleteSubtask={handleCompleteSubtask} onAtomizeFile={handleAtomizeFile} hasRoadmap={project.hasRoadmap} T={T}/>
              <Scoreboard xp={project.xp} streak={streak} timer={timer} totalNodes={project.nodes.length} T={T}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

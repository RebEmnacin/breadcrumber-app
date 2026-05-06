import { useState, useRef, useEffect, useCallback } from "react";
import { useStreak } from "./hooks/useStreak";

// ── Per-tab project state ─────────────────────────────────────────────────────

const blankProject = () => ({
  nodes: [], activeNode: 0, xp: 0, completedNodes: [],
  title: "", desc: "", category: "",   // FIX 5: per-tab title/desc/category
  fileUploaded: false,                  // FIX 3: track if file uploaded per tab
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

// ── Theme ─────────────────────────────────────────────────────────────────────

const darkTheme = {
  bg: "#0E131C", panelBg: "#1e2235", cardBg: "#2d3450",
  border: "#3a3f5a", text: "#fff", subText: "#aab", dimText: "#778",
  mutedText: "#556", inputBg: "#1a1f35", trackBg: "#2a2f45",
  isDark: true,
};
const lightTheme = {
  bg: "#e8eaf0", panelBg: "#f0f2f7", cardBg: "#ffffff",
  border: "#d0d4e4", text: "#1a1f35", subText: "#556", dimText: "#667",
  mutedText: "#99a", inputBg: "#e0e3ef", trackBg: "#d4d8eb",
  isDark: false,
};

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

// ── FIX 7: Notification Bell Menu — left-aligned text ────────────────────────

function BellMenu({ notifications, onClear, T }) {
  return (
    <div style={{
      position:"absolute",top:"calc(100% + 8px)",right:0,zIndex:500,
      backgroundColor:T.panelBg,border:`1px solid ${T.border}`,
      borderRadius:"14px",padding:"12px",minWidth:"280px",
      boxShadow:"0 8px 32px rgba(0,0,0,0.35)",
    }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px" }}>
        {/* FIX 7: left-aligned, uppercase label */}
        <span style={{ fontSize:"12px",fontWeight:"700",color:T.subText,letterSpacing:"1px",textTransform:"uppercase" }}>Notifications</span>
        {notifications.length > 0 && (
          <button onClick={onClear} style={{ background:"none",border:"none",color:"#ffbf6e",fontSize:"11px",cursor:"pointer",fontFamily:"inherit",fontWeight:"600" }}>Clear all</button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div style={{ fontSize:"13px",color:T.mutedText,textAlign:"left",padding:"12px 0" }}>No notifications yet</div>
      ) : (
        notifications.map((n,i) => (
          <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:"10px",padding:"8px 0",borderTop:i>0?`1px solid ${T.border}`:"none" }}>
            <span style={{ fontSize:"18px",flexShrink:0 }}>{n.icon}</span>
            {/* FIX 7: text left-aligned */}
            <div style={{ textAlign:"left" }}>
              <div style={{ fontSize:"13px",fontWeight:"600",color:T.text,marginBottom:"2px" }}>{n.title}</div>
              <div style={{ fontSize:"11px",color:T.subText }}>{n.body}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function SidebarIcon({ onClick, title, children, active, T }) {
  const [h, setH] = useState(false);
  return (
    <button style={{
      background:"none",border:"none",cursor:"pointer",borderRadius:"10px",
      display:"flex",alignItems:"center",justifyContent:"center",
      width:"38px",height:"38px",transition:"color 0.2s, background 0.2s",
      // FIX 6: use T.text for color so it works in both light and dark mode
      color: active||h ? T.text : T.dimText,
      backgroundColor: active||h ? T.cardBg : "transparent",
    }}
      onClick={onClick} title={title}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}>
      {children}
    </button>
  );
}

function Sidebar({ onTimerToggle, isRunning, darkMode, onToggleDark, T }) {
  return (
    // FIX 6: use T.panelBg so sidebar background works in light mode
    <div style={{ backgroundColor:T.panelBg,width:"56px",minWidth:"56px",padding:"16px 8px",borderRadius:"30px",display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",flexShrink:0 }}>
      <SidebarIcon onClick={onTimerToggle} title="Timer" active={isRunning} T={T}>
        {/* FIX 6: stroke uses currentColor, inherits from button color */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </SidebarIcon>
      <SidebarIcon title="Camera" T={T}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </SidebarIcon>
      <SidebarIcon onClick={onToggleDark} title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} T={T}>
        {/* FIX 6: always visible SVG icons using currentColor */}
        {darkMode ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
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
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

  const handleDeleteClick = (e, i) => { e.stopPropagation(); setPendingDelete(i); };
  const confirmDelete = () => { onDeleteTab(pendingDelete); setPendingDelete(null); };
  const unread = notifications.length;

  return (
    <>
      {pendingDelete !== null && (
        <DeleteConfirmModal projectLabel={tabs[pendingDelete]?.label} onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)} T={T} />
      )}
      <div style={{ display:"flex",alignItems:"flex-end",backgroundColor:T.bg,flexShrink:0 }}>
        {tabs.map((tab,i) => (
          <div key={tab.id} style={{ position:"relative",display:"inline-flex",marginRight:"4px" }}>
            <button style={{ backgroundColor:activeTab===i?T.cardBg:T.panelBg,padding:"10px 36px 10px 16px",borderRadius:"12px 12px 0 0",color:activeTab===i?T.text:T.dimText,cursor:"pointer",fontSize:"14px",fontWeight:activeTab===i?"600":"400",userSelect:"none",border:"none",fontFamily:"inherit",lineHeight:1.4 }}
              onClick={() => onTabClick(i)}>{tab.label}</button>
            {tabs.length > 1 && (
              <button onClick={(e) => handleDeleteClick(e,i)} title="Delete project"
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
            <button
              onClick={() => setBellOpen(o => !o)}
              style={{ background:"none",border:"none",color:bellOpen?T.text:T.dimText,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",width:"32px",height:"32px",borderRadius:"8px",transition:"color 0.2s",padding:0,position:"relative" }}
              onMouseEnter={e=>e.currentTarget.style.color=T.text}
              onMouseLeave={e=>{ if(!bellOpen) e.currentTarget.style.color=T.dimText; }}
            >
              {/* FIX 6: stroke uses currentColor */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unread > 0 && (
                <span style={{ position:"absolute",top:"2px",right:"2px",width:"8px",height:"8px",borderRadius:"50%",backgroundColor:"#ff4444",display:"block" }} />
              )}
            </button>
            {bellOpen && <BellMenu notifications={notifications} onClear={() => { onClearNotifs(); setBellOpen(false); }} T={T} />}
          </div>
        </div>
      </div>
    </>
  );
}

// ── FIX 5: Title Area — now uses per-tab state passed as props ────────────────

function TitleArea({ onAtomize, title, setTitle, desc, setDesc, category, setCategory, T }) {
  return (
    <div style={{ padding:"20px 28px 14px",flexShrink:0,borderBottom:`1px solid ${T.border}` }}>
      <div style={{ display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px" }}>
        <span style={{ backgroundColor:T.panelBg,padding:"3px 14px",borderRadius:"20px",color:T.subText,fontSize:"12px",whiteSpace:"nowrap",flexShrink:0 }}>{category||"tag"}</span>
        {/* FIX 5: title is per-tab */}
        <input style={{ fontSize:"22px",fontWeight:"bold",color:"#ffbf6e",border:"none",outline:"none",background:"transparent",fontFamily:"inherit",flex:1,minWidth:0 }}
          placeholder="Project title..." value={title} onChange={e=>setTitle(e.target.value)} maxLength={60} />
      </div>
      {/* FIX 5: desc is per-tab */}
      <input style={{ fontSize:"13px",color:T.subText,border:"none",outline:"none",background:"transparent",fontFamily:"inherit",width:"100%",marginBottom:"10px",display:"block" }}
        placeholder="Project description..." value={desc} onChange={e=>setDesc(e.target.value)} maxLength={200} />
      <div style={{ display:"flex",gap:"8px",marginTop:"4px" }}>
        {/* FIX 5: category is per-tab */}
        <input style={{ flex:1,padding:"7px 12px",borderRadius:"8px",border:"none",background:T.inputBg,color:T.text,fontFamily:"inherit",fontSize:"13px" }}
          placeholder="Category (e.g. Art, Coding...)" value={category} onChange={e=>setCategory(e.target.value)} />
        <button style={{ padding:"7px 18px",borderRadius:"8px",border:"none",background:"#ffbf6e",color:"#0E131C",fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",fontSize:"13px" }}
          onClick={()=>title.trim()&&onAtomize(title,category)}>✨ Atomize!</button>
      </div>
    </div>
  );
}

// ── FIX 1 + 3 + 4 + 8: File Upload Zone ──────────────────────────────────────

function FileUploadZone({ onAtomizeFile, fileUploaded, T }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  // FIX 8: upload progress state
  const [progress, setProgress] = useState(0);

  // FIX 3: hide upload zone if file already uploaded
  if (fileUploaded) return null;

  const processFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setProgress(10);
    setStatus(`Reading "${file.name}"…`);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });
      setProgress(40);

      const isPdf = file.type === "application/pdf";
      const isImage = file.type.startsWith("image/");

      let messageContent;
      // FIX 4: improved prompt that creates categories + subtasks + quiz/assignment nodes
      const aiPrompt = `You are an expert academic content analyzer and ADHD productivity coach.

Analyze this file thoroughly. Identify ALL topics, chapters, lessons, and any assessments (quizzes, assignments, activities, labs, exams).

Return ONLY valid JSON in this exact format, no markdown, no explanation:
{
  "project_name": "short descriptive title from the content",
  "nodes": [
    {
      "node_id": 1,
      "title": "Category or Chapter Name",
      "is_completed": false,
      "subtasks": [
        { "subtask_id": "1-1", "title": "Review: specific topic or concept", "is_completed": false },
        { "subtask_id": "1-2", "title": "Quiz: topic name", "is_completed": false },
        { "subtask_id": "1-3", "title": "Assignment: task description", "is_completed": false }
      ]
    }
  ]
}

RULES:
- Each node = one major topic/chapter/category
- Each subtask = one specific review item, concept, or assessment
- Prefix assessments clearly: "Quiz:", "Assignment:", "Activity:", "Lab:", "Exam:"
- Keep subtask titles concise and actionable
- Do NOT group everything into one node — spread across meaningful categories`;

      if (isPdf) {
        messageContent = [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
          { type: "text", text: aiPrompt }
        ];
      } else if (isImage) {
        messageContent = [
          { type: "image", source: { type: "base64", media_type: file.type, data: base64 } },
          { type: "text", text: aiPrompt }
        ];
      } else {
        const text = await file.text();
        messageContent = [
          { type: "text", text: `${aiPrompt}\n\nFile content:\n${text.slice(0, 8000)}` }
        ];
      }

      setProgress(60);
      setStatus("AI is reading your file…");

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{ role: "user", content: messageContent }],
        }),
      });

      setProgress(85);
      setStatus("Building your roadmap…");

      const data = await res.json();
      const raw = data.content?.map(b => b.text||"").join("").trim();
      const clean = raw.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);

      setProgress(100);
      setStatus("Done! Roadmap created ✨");
      onAtomizeFile(parsed);
    } catch(err) {
      console.error(err);
      setProgress(0);
      setStatus("Failed to analyze file. Try again.");
      setLoading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  return (
    <div style={{ marginBottom:"16px" }}>
      <div
        className="upload-zone"
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)}
        onDrop={onDrop}
        style={{
          border:`2px dashed ${dragging?"#ffbf6e":T.border}`,
          borderRadius:"14px",
          padding:"20px 16px",
          textAlign:"center",
          cursor:loading?"wait":"pointer",
          background:dragging?T.inputBg:"transparent",
          transition:"all 0.2s",
        }}
        onClick={()=>!loading&&fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.doc,.docx,image/*" style={{display:"none"}} onChange={e=>processFile(e.target.files[0])} />
        {loading ? (
          <div style={{ color:"#ffbf6e",fontSize:"13px",fontWeight:"600" }}>
            {/* FIX 8: progress bar */}
            <div style={{ width:"100%",backgroundColor:T.trackBg,borderRadius:"20px",height:"6px",overflow:"hidden",marginBottom:"10px" }}>
              <div style={{ width:`${progress}%`,height:"100%",backgroundColor:"#ffbf6e",borderRadius:"20px",transition:"width 0.4s ease" }}/>
            </div>
            <div style={{ fontSize:"11px",color:T.subText,marginBottom:"4px" }}>{progress}%</div>
            <div>{status}</div>
          </div>
        ) : (
          <>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={T.subText} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:"8px",display:"block",margin:"0 auto 8px"}}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <div style={{ fontSize:"13px",fontWeight:"600",color:T.subText,marginBottom:"4px" }}>Upload a module or file</div>
            <div style={{ fontSize:"11px",color:T.mutedText }}>PDF, TXT, MD, Images — AI will auto-create your roadmap</div>
            {status && <div style={{ fontSize:"11px",color:"#ffbf6e",marginTop:"6px" }}>{status}</div>}
          </>
        )}
      </div>
    </div>
  );
}

// ── Countdown Timer Component ─────────────────────────────────────────────────

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
      <div style={{ fontSize:"10px",color:T.dimText,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"10px" }}>
        {isBreak?"Break Timer":"Flowtime Timer"}
      </div>
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
    <div style={{ flex:1,backgroundColor:T.panelBg,borderRadius:"20px",padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center",overflowY:"auto" }}>
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

// ── FIX 1: Subtask Row — text right beside circle ─────────────────────────────

function SubtaskRow({ sub, isNextUp, isLocked, onComplete, T }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file||!file.type.startsWith("image/")) return;
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    setTimeout(()=>{ setUploading(false); onComplete(); }, 600);
  };

  const triggerUpload = () => { if (!isNextUp||sub.is_completed) return; fileInputRef.current?.click(); };

  return (
    // FIX 1: removed flex:1 from text span, text sits right beside circle
    <div style={{ height:"44px",display:"flex",alignItems:"center",gap:"8px",opacity:isLocked?0.35:1,transition:"opacity 0.3s" }}
      title={isLocked?"Complete the previous task first!":isNextUp?"Upload a screenshot to complete!":""}>
      <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFileChange} />

      {/* Circle */}
      <div onClick={triggerUpload} style={{ width:"26px",height:"26px",borderRadius:"50%",border:`2px solid ${sub.is_completed?"#4caf7d":isNextUp?"#ffbf6e":"#3a4060"}`,backgroundColor:sub.is_completed?"#4caf7d":"transparent",flexShrink:0,transition:"all 0.3s",cursor:isNextUp&&!sub.is_completed?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:isNextUp&&!sub.is_completed?"0 0 8px #ffbf6e88":"none" }}>
        {sub.is_completed&&<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="2,6 5,9 10,3"/></svg>}
        {!sub.is_completed&&isNextUp&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffbf6e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
        {uploading&&<div style={{ width:"8px",height:"8px",borderRadius:"50%",background:"#ffbf6e",animation:"pulse 0.5s ease infinite alternate" }}/>}
      </div>

      {/* FIX 1: text right beside circle, no centering */}
      <span style={{ fontSize:"13px",color:sub.is_completed?"#4caf7d":isNextUp?T.text:T.dimText,transition:"color 0.3s",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>
        {sub.title}
      </span>

      {/* FIX 2: paperclip SVG button instead of "proof" text badge */}
      {isNextUp&&!sub.is_completed&&(
        <button onClick={triggerUpload} title="Attach proof" style={{ marginLeft:"auto",background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center",flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffbf6e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
      )}

      {sub.is_completed&&preview&&(
        <img src={preview} alt="proof" style={{ width:"20px",height:"20px",borderRadius:"4px",objectFit:"cover",border:"1px solid #4caf7d",flexShrink:0,marginLeft:"auto" }}/>
      )}
    </div>
  );
}

// ── Phase Block ───────────────────────────────────────────────────────────────

const ROW_H = 44;

function PhaseBlock({ node, isPhaseActive, onCompleteSubtask, T }) {
  const isPhaseCompleted = node.is_completed;
  const subtasks = node.subtasks||[];
  const svgH = subtasks.length * ROW_H;
  const doneSubs = subtasks.filter(s=>s.is_completed).length;
  const SW=3, ANIM=0.25;

  return (
    <div style={{ marginBottom:"24px" }}>
      <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"4px" }}>
        <div style={{ width:"30px",height:"30px",borderRadius:"50%",border:`2px solid ${isPhaseCompleted?"#4caf7d":isPhaseActive?"#ffbf6e":"#445"}`,backgroundColor:isPhaseCompleted?"#4caf7d":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",color:"#fff",flexShrink:0,transition:"all 0.3s" }}>
          {isPhaseCompleted?"✓":""}
        </div>
        <div style={{ fontSize:"15px",fontWeight:"600",color:isPhaseCompleted?"#4caf7d":isPhaseActive?"#ffbf6e":T.text,transition:"color 0.3s" }}>
          {node.title}
        </div>
      </div>
      {subtasks.length>0&&(
        <div style={{ display:"flex",alignItems:"flex-start",marginLeft:"14px" }}>
          <svg key={`svg-${node.node_id}-${doneSubs}`} width="32" height={svgH} style={{ flexShrink:0 }}>
            <line x1="2" y1="0" x2="2" y2={svgH} stroke={T.isDark?"#2a2f45":T.border} strokeWidth={SW}/>
            {subtasks.map((sub,i)=>{
              const cy=i*ROW_H+ROW_H/2;
              return <line key={`bgh-${sub.subtask_id}`} x1="2" y1={cy} x2="28" y2={cy} stroke={T.isDark?"#2a2f45":T.border} strokeWidth={SW}/>;
            })}
            {subtasks.map((sub,i)=>{
              if(!sub.is_completed) return null;
              const prevCy=i===0?0:(i-1)*ROW_H+ROW_H/2;
              const cy=i*ROW_H+ROW_H/2;
              const isNewest=i===doneSubs-1;
              const vertLen=Math.max(1,cy-prevCy);
              if(!isNewest) return(
                <g key={`static-${sub.subtask_id}`}>
                  <line x1="2" y1={prevCy} x2="2" y2={cy} stroke="#ffffff" strokeWidth={SW}/>
                  <line x1="2" y1={cy} x2="28" y2={cy} stroke="#ffffff" strokeWidth={SW}/>
                </g>
              );
              return(
                <g key={`anim-${sub.subtask_id}`}>
                  <line x1="2" y1={prevCy} x2="2" y2={cy} stroke="#ffffff" strokeWidth={SW} strokeDasharray={vertLen} strokeDashoffset={vertLen} style={{ animation:`snakeDraw ${ANIM}s linear 0s forwards` }}/>
                  <line x1="2" y1={cy} x2="28" y2={cy} stroke="#ffffff" strokeWidth={SW} strokeDasharray={26} strokeDashoffset={26} style={{ animation:`snakeDraw ${ANIM}s linear ${ANIM}s forwards` }}/>
                </g>
              );
            })}
          </svg>
          <div style={{ display:"flex",flexDirection:"column",flex:1 }}>
            {subtasks.map((sub,i)=>{
              const prevDone=i===0||subtasks[i-1].is_completed;
              const isNextUp=!sub.is_completed&&prevDone&&isPhaseActive;
              const isLocked=!sub.is_completed&&!isNextUp;
              return <SubtaskRow key={sub.subtask_id} sub={sub} isNextUp={isNextUp} isLocked={isLocked} onComplete={()=>onCompleteSubtask(node.node_id,sub.subtask_id)} T={T}/>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Roadmap ───────────────────────────────────────────────────────────────────

function Roadmap({ nodes, activeNode, onCompleteSubtask, onAtomizeFile, fileUploaded, T }) {
  return (
    <div style={{ flex:"0 0 58%",backgroundColor:T.panelBg,borderRadius:"20px",padding:"20px",overflowY:"auto",display:"flex",flexDirection:"column" }}>
      <div style={{ fontSize:"12px",color:T.subText,marginBottom:"16px",fontWeight:"600",letterSpacing:"1px",textTransform:"uppercase" }}>Roadmap</div>
      {/* FIX 3: pass fileUploaded so zone hides after upload */}
      <FileUploadZone onAtomizeFile={onAtomizeFile} fileUploaded={fileUploaded} T={T}/>
      {nodes.length===0?(
        <p style={{ color:T.mutedText,fontSize:"13px" }}>Enter a project above or upload a file to generate your roadmap!</p>
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

  // FIX 5: per-tab setters for title, desc, category
  const setTitle = (val) => updateProject(currentTabId, p => ({ ...p, title: val }));
  const setDesc = (val) => updateProject(currentTabId, p => ({ ...p, desc: val }));
  const setCategory = (val) => updateProject(currentTabId, p => ({ ...p, category: val }));

  const handleCompleteSubtask = (nodeId, subtaskId) => {
    const tabId = currentTabId;
    updateProject(tabId, (proj) => {
      const updatedNodes = proj.nodes.map(node => {
        if (node.node_id !== nodeId) return node;
        const updatedSubtasks = node.subtasks.map(sub =>
          sub.subtask_id === subtaskId ? { ...sub, is_completed: true } : sub
        );
        const allDone = updatedSubtasks.every(s => s.is_completed);
        if (allDone && !node.is_completed) {
          setNotifications(prev => [{
            icon: "🏆",
            title: `Phase complete: ${node.title}`,
            body: `You finished all subtasks in "${node.title}"!`,
          }, ...prev]);
        }
        return { ...node, subtasks: updatedSubtasks, is_completed: allDone };
      });
      const completedNode = updatedNodes.find(n => n.node_id === nodeId);
      const parentJustCompleted = completedNode?.is_completed;
      return {
        ...proj,
        nodes: updatedNodes,
        activeNode: parentJustCompleted ? proj.activeNode + 1 : proj.activeNode,
        xp: proj.xp + 50 + (parentJustCompleted ? 100 : 0),
        completedNodes: parentJustCompleted ? [...proj.completedNodes, nodeId] : proj.completedNodes,
      };
    });
    updateStreak();
  };

  const handleAtomize = async (projectName, cat) => {
    try {
      const res = await fetch("http://localhost:8000/atomize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_name: projectName, category: cat }),
      });
      const data = await res.json();
      updateProject(currentTabId, (p) => ({ ...p, nodes: data.nodes, activeNode: 0, xp: 0, completedNodes: [] }));
    } catch(err) { console.error("Atomize failed:", err); }
  };

  const handleAtomizeFile = (parsed) => {
    if (!parsed?.nodes) return;
    // FIX 3 + 5: mark file uploaded, set project name from file
    updateProject(currentTabId, (p) => ({
      ...p,
      nodes: parsed.nodes,
      activeNode: 0, xp: 0, completedNodes: [],
      title: parsed.project_name || p.title,
      fileUploaded: true,
    }));
  };

  const handleAddTab = () => {
    tabCounter.current += 1;
    const newId = tabCounter.current;
    setTabs(prev => [...prev, { id: newId, label: `Project ${newId}` }]);
    setTabData(prev => ({ ...prev, [newId]: blankProject() }));
    setActiveTab(tabs.length);
  };

  const handleDeleteTab = (i) => {
    if (tabs.length <= 1) return;
    const deletedId = tabs[i].id;
    setTabs(prev => prev.filter((_,idx) => idx !== i));
    setTabData(prev => { const next = {...prev}; delete next[deletedId]; return next; });
    setActiveTab(prev => { if (prev === i) return Math.max(0, i-1); if (prev > i) return prev-1; return prev; });
  };

  return (
    <div style={{ backgroundColor:T.bg,padding:"10px",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",height:"100vh",margin:0,boxSizing:"border-box",overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes snakeDraw { from { stroke-dashoffset: 999; } to { stroke-dashoffset: 0; } }
        @keyframes pulse { from { opacity:0.6; } to { opacity:1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::placeholder { color: #889; }
        * { box-sizing: border-box; }
        .upload-zone:hover { border-color: #ffbf6e !important; }
      `}</style>
      <div style={{ display:"flex",gap:"16px",padding:"16px",height:"100%",boxSizing:"border-box" }}>
        <Sidebar onTimerToggle={()=>timer.isRunning?timer.pause():timer.start()} isRunning={timer.isRunning} darkMode={darkMode} onToggleDark={()=>setDarkMode(d=>!d)} T={T}/>
        <div style={{ flex:1,display:"flex",flexDirection:"column",minWidth:0 }}>
          <Nav tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} onAddTab={handleAddTab} onDeleteTab={handleDeleteTab} streak={streak} notifications={notifications} onClearNotifs={()=>setNotifications([])} T={T}/>
          <div style={{ backgroundColor:T.cardBg,flex:1,borderRadius:"0 12px 12px 12px",overflow:"hidden",display:"flex",flexDirection:"column",minHeight:0 }}>
            {/* FIX 5: pass per-tab title/desc/category */}
            <TitleArea
              onAtomize={handleAtomize}
              title={project.title} setTitle={setTitle}
              desc={project.desc} setDesc={setDesc}
              category={project.category} setCategory={setCategory}
              T={T}
            />
            <div style={{ display:"flex",gap:"12px",flex:1,padding:"12px 16px 16px",minHeight:0 }}>
              <Roadmap
                nodes={project.nodes}
                activeNode={project.activeNode}
                onCompleteSubtask={handleCompleteSubtask}
                onAtomizeFile={handleAtomizeFile}
                fileUploaded={project.fileUploaded}  // FIX 3
                T={T}
              />
              <Scoreboard xp={project.xp} streak={streak} timer={timer} totalNodes={project.nodes.length} T={T}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
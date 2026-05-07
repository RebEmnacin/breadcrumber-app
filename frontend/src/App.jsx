import { useState, useRef, useEffect, useCallback } from "react";
import { useStreak } from "./hooks/useStreak";
import { atomizeProject, analyzeFile } from "./hooks/useApi";
import frame1 from "./assets/gif1-frame1.png";
import frame2 from "./assets/gif1-frame2.png";
import icon from "./assets/favicon.png";
import bufferload from "./assets/buffer-loading.png"

const blankProject = () => ({
  nodes: [], activeNode: 0, xp: 0, completedNodes: [],
  title: "", desc: "", category: "", hasRoadmap: false, proofAlbum: {},
});

// ── Timer hook ────────────────────────────────────────────────────────────────
function useCountdownTimer() {
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remaining, setRemaining]       = useState(25 * 60);
  const [isRunning, setIsRunning]       = useState(false);
  const [mode, setMode]                 = useState("work");
  const [isDone, setIsDone]             = useState(false);
  const intervalRef = useRef(null);

  const playAlarm = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const beep = (f, t, d) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = f; o.type = "sine";
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + d);
        o.start(t); o.stop(t + d);
      };
      const t = ctx.currentTime;
      beep(880,t,0.3); beep(1100,t+.35,0.3); beep(880,t+.7,0.3); beep(1320,t+1.05,0.5);
    } catch(e) {}
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemaining(p => {
          if (p <= 1) { clearInterval(intervalRef.current); setIsRunning(false); playAlarm(); setIsDone(true); return 0; }
          return p - 1;
        });
      }, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const start       = () => { if (remaining > 0) setIsRunning(true); };
  const pause       = () => setIsRunning(false);
  const reset       = () => { setIsRunning(false); setRemaining(totalSeconds); setIsDone(false); };
  const dismissDone = () => setIsDone(false);
  const setDuration = (s) => { setIsRunning(false); setTotalSeconds(s); setRemaining(s); setIsDone(false); };
  const formatTime  = (s) => {
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
    if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };
  const pct = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;
  return { remaining, isRunning, mode, setMode, start, pause, reset, setDuration, formatTime, pct, totalSeconds, isDone, dismissDone };
}

// ── Themes ────────────────────────────────────────────────────────────────────
const darkTheme = {
  bg:"#0E131C", panelBg:"#1e2235", cardBg:"#2d3450",
  border:"#3a3f5a", text:"#fff", subText:"#aab", dimText:"#778",
  mutedText:"#556", inputBg:"#1a1f35", trackBg:"#2a2f45",
  completedLine:"#ffffff", isDark:true, scrollbar:"scrollbar-dark",
};
// ── Light theme: coffee/bread/khaki palette ───────────────────────────────────
const lightTheme = {
  bg:"#e8d9c4", panelBg:"#f2e8d9", cardBg:"#fdf6ec",
  border:"#d4b896", text:"#3b2a1a", subText:"#7a5c3e", dimText:"#9e7a56",
  mutedText:"#b89470", inputBg:"#e8d4bb", trackBg:"#d4b896",
  completedLine:"#7a5c3e", isDark:false, scrollbar:"scrollbar-light",
};
const ROW_H = 44;

// ── Animated GIF streaks icon ──────────────────────────────────────
import streakFrame1 from "./assets/gif1-frame1.png";
import streakFrame2 from "./assets/gif1-frame2.png";
function StreakIcon({ size = 32 }) {
  const [frame, setFrame] = useState(0);
  const frames = StreakIcon._frames || null;

  useEffect(() => {
    if (!frames) return;
    const id = setInterval(() => setFrame(f => (f + 1) % 2), 500); // ~8fps
    return () => clearInterval(id);
  }, [frames]);

  if (frames) {
    return (
      <img
        src={frames[frame]}
        alt="streak"
        style={{ width: size, height: size, objectFit: "contain", imageRendering: "pixelated" }}
      />
    );
  }

  return (
 StreakIcon._frames = [f1, f2]);
  
}

// ── Timer-done popup ──────────────────────────────────────────────────────────
function TimerBreakPopup({ mode, onOkay, T }) {
  const isWork = mode === "work";
  return (
    <div style={{ position:"fixed",inset:0,zIndex:9000,backgroundColor:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeInOverlay 0.3s ease" }}>
      <div style={{ backgroundColor:T.panelBg,border:`2px solid ${isWork?"#ffbf6e":"#4caf7d"}`,borderRadius:"24px",padding:"40px 48px",maxWidth:"400px",width:"90%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.6)",animation:"popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ fontSize:"56px",marginBottom:"16px",lineHeight:1 }}>{isWork?"☕":"💪"}</div>
        <div style={{ fontSize:"22px",fontWeight:"800",color:T.text,marginBottom:"10px" }}>{isWork?"Time for a break!":"Break's over!"}</div>
        <div style={{ fontSize:"14px",color:T.subText,lineHeight:1.7,marginBottom:"28px",whiteSpace:"pre-line" }}>
          {isWork?"Step away from the screen.\nStretch, grab water, rest your eyes.\nYou've earned it. 🌿":"Feeling refreshed? Let's get back to it.\nYou're on a roll! 🔥"}
        </div>
        <button onClick={onOkay} style={{ padding:"12px 40px",borderRadius:"50px",border:"none",background:isWork?"#ffbf6e":"#4caf7d",color:"#0E131C",fontWeight:"800",fontSize:"16px",cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 20px ${isWork?"#ffbf6e66":"#4caf7d66"}`,transition:"transform 0.15s" }}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
          Okay!
        </button>
      </div>
    </div>
  );
}

// ── Delete modal ──────────────────────────────────────────────────────────────
function DeleteConfirmModal({ projectLabel, onConfirm, onCancel, T }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,backgroundColor:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ backgroundColor:T.panelBg,borderRadius:"16px",padding:"28px 32px",maxWidth:"360px",width:"90%",boxShadow:"0 8px 40px rgba(0,0,0,0.5)",border:`1px solid ${T.border}`,fontFamily:"inherit" }}>
        <div style={{ fontSize:"22px",marginBottom:"10px",textAlign:"center" }}>🗑️</div>
        <div style={{ fontSize:"16px",fontWeight:"700",color:T.text,marginBottom:"8px",textAlign:"center" }}>Delete project?</div>
        <div style={{ fontSize:"13px",color:T.subText,marginBottom:"24px",lineHeight:1.6,textAlign:"center" }}>
          Are you sure you want to delete <strong style={{ color:"#ffbf6e" }}>"{projectLabel}"</strong>?<br/>This cannot be undone.
        </div>
        <div style={{ display:"flex",gap:"10px",justifyContent:"center" }}>
          <button onClick={onCancel} style={{ padding:"8px 24px",borderRadius:"8px",border:`1px solid ${T.border}`,background:"transparent",color:T.subText,fontFamily:"inherit",fontSize:"13px",cursor:"pointer",fontWeight:"600" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding:"8px 24px",borderRadius:"8px",border:"none",background:"#ff4444",color:"#fff",fontFamily:"inherit",fontSize:"13px",cursor:"pointer",fontWeight:"700" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Bell menu ─────────────────────────────────────────────────────────────────
function BellMenu({ notifications, onClear, T }) {
  return (
    <div style={{ position:"absolute",top:"calc(100% + 8px)",right:0,zIndex:500,backgroundColor:T.panelBg,border:`1px solid ${T.border}`,borderRadius:"14px",padding:"12px",minWidth:"280px",boxShadow:"0 8px 32px rgba(0,0,0,0.35)" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px" }}>
        <span style={{ fontSize:"12px",fontWeight:"700",color:T.subText,letterSpacing:"1px",textTransform:"uppercase" }}>Notifications</span>
        {notifications.length > 0 && <button onClick={onClear} style={{ background:"none",border:"none",color:"#ffbf6e",fontSize:"11px",cursor:"pointer",fontFamily:"inherit",fontWeight:"600" }}>Clear all</button>}
      </div>
      {notifications.length === 0
        ? <div style={{ fontSize:"13px",color:T.mutedText,padding:"12px 0",textAlign:"left" }}>No notifications yet</div>
        : notifications.map((n,i) => (
          <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:"10px",padding:"8px 0",borderTop:i>0?`1px solid ${T.border}`:"none" }}>
            <span style={{ fontSize:"18px",flexShrink:0 }}>{n.icon}</span>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontSize:"13px",fontWeight:"600",color:T.text,marginBottom:"2px" }}>{n.title}</div>
              <div style={{ fontSize:"11px",color:T.subText }}>{n.body}</div>
            </div>
          </div>
        ))}
    </div>
  );
}

// ── Album View — Google Drive-style folder gallery ────────────────────────────
function AlbumView({ proofAlbum, nodes, T }) {
  const [selected, setSelected] = useState(null);
  const [openFolders, setOpenFolders] = useState({});

  const toggleFolder = (id) => setOpenFolders(prev => ({ ...prev, [id]: !prev[id] }));


  const folders = (nodes || []).map(node => {
    const subtaskProofs = (node.subtasks || []).flatMap(sub => {
      const proofs = proofAlbum[sub.subtask_id] || [];
      return proofs.map(p => ({ ...p, subtaskTitle: sub.title }));
    });
    return { nodeId: node.node_id, title: node.title, proofs: subtaskProofs };
  }).filter(f => f.proofs.length > 0);

  const matchedSubtaskIds = new Set(
    (nodes || []).flatMap(n => (n.subtasks || []).map(s => s.subtask_id))
  );
  const unmatchedEntries = Object.entries(proofAlbum).filter(([id]) => !matchedSubtaskIds.has(id));
  if (unmatchedEntries.length > 0) {
    const unmatchedProofs = unmatchedEntries.flatMap(([, proofs]) => proofs);
    if (unmatchedProofs.length > 0) folders.push({ nodeId: "__other__", title: "Other", proofs: unmatchedProofs });
  }

  const totalPhotos = Object.values(proofAlbum).flat().length;

  return (
    <div style={{ height:"100%",display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"18px 20px 12px",borderBottom:`1px solid ${T.border}`,flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
          <div style={{ width:"32px",height:"32px",borderRadius:"8px",background:"linear-gradient(135deg,#ffbf6e,#ff8c42)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0E131C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </div>
          <div>
            <div style={{ fontSize:"15px",fontWeight:"700",color:T.text,lineHeight:1 }}>Proof Album</div>
            <div style={{ fontSize:"11px",color:T.mutedText,marginTop:"2px" }}>{totalPhotos} screenshot{totalPhotos!==1?"s":""} · {folders.length} folder{folders.length!==1?"s":""}</div>
          </div>
        </div>
      </div>

      {/* Folder grid body */}
      <div className={T.scrollbar} style={{ flex:1,overflowY:"auto",padding:"16px 20px" }}>
        {totalPhotos === 0 ? (
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:"12px",paddingTop:"40px" }}>
            <div style={{ width:"64px",height:"64px",borderRadius:"16px",background:T.inputBg,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.dimText} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div style={{ fontSize:"14px",fontWeight:"600",color:T.subText }}>No screenshots yet</div>
            <div style={{ fontSize:"12px",color:T.mutedText,textAlign:"center",maxWidth:"200px",lineHeight:1.5 }}>Complete subtasks and attach proof images to build your album.</div>
          </div>
        ) : (
          <>
            {/* 4-per-row folder grid */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",marginBottom:"20px" }}>
              {folders.map(folder => (
                <button key={folder.nodeId} onClick={() => toggleFolder(folder.nodeId)}
                  style={{ background:openFolders[folder.nodeId]?"linear-gradient(135deg,#ffbf6e22,#ff8c4211)":T.inputBg,border:`1.5px solid ${openFolders[folder.nodeId]?"#ffbf6e":T.border}`,borderRadius:"14px",padding:"12px 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",transition:"all 0.2s",fontFamily:"inherit" }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor="#ffbf6e"; e.currentTarget.style.transform="translateY(-2px)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor=openFolders[folder.nodeId]?"#ffbf6e":T.border; e.currentTarget.style.transform="translateY(0)"; }}>
                  {/* Folder icon */}
                  <div style={{ position:"relative" }}>
                    <svg width="38" height="32" viewBox="0 0 38 32" fill="none">
                      <path d="M2 8 Q2 6 4 6 L14 6 L16 4 L34 4 Q36 4 36 6 L36 28 Q36 30 34 30 L4 30 Q2 30 2 28 Z" fill={openFolders[folder.nodeId]?"#ffbf6e":"#c8a060"} opacity="0.85"/>
                      <path d="M2 10 L36 10 L36 28 Q36 30 34 30 L4 30 Q2 30 2 28 Z" fill={openFolders[folder.nodeId]?"#ffd090":"#dbb070"}/>
                    </svg>
                    <span style={{ position:"absolute",bottom:"2px",right:"-2px",fontSize:"9px",fontWeight:"800",background:"#ffbf6e",color:"#3b2000",borderRadius:"8px",padding:"1px 5px",lineHeight:1.4 }}>{folder.proofs.length}</span>
                  </div>
                  <span style={{ fontSize:"10px",fontWeight:"600",color:T.text,textAlign:"center",lineHeight:1.3,width:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{folder.title}</span>
                  <span style={{ fontSize:"9px",color:T.mutedText }}>{openFolders[folder.nodeId]?"▲ close":"▼ open"}</span>
                </button>
              ))}
            </div>

            {/* Expanded folder contents */}
            {folders.filter(f => openFolders[f.nodeId]).map(folder => (
              <div key={`open-${folder.nodeId}`} style={{ marginBottom:"20px",background:T.inputBg,borderRadius:"16px",padding:"14px 16px",border:`1px solid ${T.border}` }}>
                <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px" }}>
                  <svg width="18" height="16" viewBox="0 0 18 16" fill="none">
                    <path d="M1 4 Q1 3 2 3 L7 3 L8 2 L16 2 Q17 2 17 3 L17 13 Q17 14 16 14 L2 14 Q1 14 1 13 Z" fill="#ffbf6e" opacity="0.9"/>
                    <path d="M1 5 L17 5 L17 13 Q17 14 16 14 L2 14 Q1 14 1 13 Z" fill="#ffd090"/>
                  </svg>
                  <span style={{ fontSize:"12px",fontWeight:"700",color:T.text }}>{folder.title}</span>
                  <span style={{ fontSize:"10px",color:T.mutedText,marginLeft:"auto" }}>{folder.proofs.length} file{folder.proofs.length!==1?"s":""}</span>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:"8px" }}>
                  {folder.proofs.map((p,i) => (
                    <div key={i} onClick={() => setSelected(p)}
                      style={{ borderRadius:"10px",overflow:"hidden",cursor:"pointer",border:`2px solid ${T.border}`,transition:"transform 0.15s, border-color 0.15s",position:"relative",aspectRatio:"4/3",background:T.inputBg }}
                      onMouseEnter={e=>{ e.currentTarget.style.transform="scale(1.03)"; e.currentTarget.style.borderColor="#ffbf6e"; }}
                      onMouseLeave={e=>{ e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.borderColor=T.border; }}>
                      <img src={p.dataUrl} alt="proof" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }}/>
                      <div style={{ position:"absolute",bottom:0,left:0,right:0,padding:"4px 6px",background:"linear-gradient(transparent,rgba(0,0,0,0.65))",fontSize:"9px",color:"#fff" }}>
                        {p.subtaskTitle || p.subtaskId}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Lightbox */}
      {selected && (
        <div onClick={()=>setSelected(null)} style={{ position:"fixed",inset:0,zIndex:2000,backgroundColor:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"14px",cursor:"zoom-out" }}>
          <img src={selected.dataUrl} alt="proof" style={{ maxWidth:"90vw",maxHeight:"75vh",objectFit:"contain",borderRadius:"12px",boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}/>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"14px",fontWeight:"600",color:"#fff" }}>{selected.taskTitle} › {selected.subtaskTitle}</div>
            <div style={{ fontSize:"11px",color:"#aab",marginTop:"4px" }}>{selected.uploadedAt}</div>
          </div>
          <div style={{ fontSize:"11px",color:"#556",marginTop:"4px" }}>Click anywhere to close</div>
        </div>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function SidebarIcon({ onClick, title, children, active, T }) {
  const [h, setH] = useState(false);
  return (
    <button style={{ background:"none",border:"none",cursor:"pointer",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",width:"38px",height:"38px",transition:"color 0.2s,background 0.2s",color:active||h?T.text:T.dimText,backgroundColor:active||h?T.cardBg:"transparent" }}
      onClick={onClick} title={title} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}>
      {children}
    </button>
  );
}

function Sidebar({ onTimerToggle, isRunning, darkMode, onToggleDark, view, onSetView, T }) {
  return (
    <div style={{ backgroundColor:T.panelBg,width:"56px",minWidth:"56px",padding:"16px 8px",borderRadius:"30px",display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",flexShrink:0 }}>
      {/* Top: functional icons */}
      <SidebarIcon onClick={onTimerToggle} title="Timer" active={isRunning} T={T}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </SidebarIcon>
      <SidebarIcon onClick={()=>onSetView(view==="album"?"roadmap":"album")} title="Proof Album" active={view==="album"} T={T}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      </SidebarIcon>

      {/* Spacer pushes theme toggle to bottom */}
      <div style={{ flex:1 }} />

      {/* Bottom: light/dark mode toggle */}
      <SidebarIcon onClick={onToggleDark} title={darkMode?"Light Mode":"Dark Mode"} T={T}>
        {darkMode
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
      </SidebarIcon>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ tabs, activeTab, onTabClick, onAddTab, onDeleteTab, streak, notifications, onClearNotifs, T }) {
  const [pendingDelete, setPendingDelete] = useState(null);
  const [bellOpen, setBellOpen]           = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    if (!bellOpen) return;
    const h = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [bellOpen]);

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", width: "100%" }}>
      {pendingDelete !== null && (
        <DeleteConfirmModal 
          projectLabel={tabs[pendingDelete]?.label} 
          onConfirm={() => { onDeleteTab(pendingDelete); setPendingDelete(null); }} 
          onCancel={() => setPendingDelete(null)} 
          T={T} 
        />
      )}

      {/* 1. TOP UTILITY GROUP (Right Edge) */}
      <div style={{ 
        position: "absolute",
        top: "4px", 
        right: "0px",
        display: "flex", 
        alignItems: "center", 
        gap: "10px",
        zIndex: 10
      }}>
        {/* Streak */}
        <div style={{ display:"flex", alignItems:"center", gap:"6px", backgroundColor:T.panelBg, borderRadius:"8px", padding:"3px 10px" }}>
          <img src={icon} alt="streak" style={{ width: "18px", height: "18px", objectFit: "contain" }} />
          <span style={{ fontSize:"16px", fontWeight:"bold", color:T.text, lineHeight:1 }}>{streak}</span>
        </div>

        {/* Notifications */}
        <div ref={bellRef} style={{ position:"relative" }}>
          <button onClick={() => setBellOpen(o => !o)} style={{ background:"none", border:"none", color:bellOpen?T.text:T.dimText, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", width:"28px", height:"28px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {notifications.length > 0 && (
              <span style={{ position:"absolute", top:"4px", right:"4px", width:"7px", height:"7px", borderRadius:"50%", backgroundColor:"#ff4444", border:`1.5px solid ${T.bg}` }} />
            )}
          </button>
          {bellOpen && <BellMenu notifications={notifications} onClear={() => { onClearNotifs(); setBellOpen(false); }} T={T} />}
        </div>
      </div>

      {/* 2. TABS ROW + PLUS BUTTON */}
      <div style={{ display: "flex", alignItems: "flex-end", overflowX: "auto", scrollbarWidth: "none", marginTop: "8px" }}>
        {tabs.map((tab, i) => (
          <div key={tab.id} style={{ position: "relative", display: "inline-flex", marginRight: "2px" }}>
            <button 
              style={{ 
                backgroundColor: activeTab === i ? T.cardBg : T.panelBg, 
                padding: "8px 32px 8px 14px", 
                borderRadius: "10px 10px 0 0", 
                color: activeTab === i ? T.text : T.dimText, 
                cursor: "pointer", 
                fontSize: "13px", 
                fontWeight: activeTab === i ? "600" : "400", 
                border: "none", 
                fontFamily: "inherit", 
                maxWidth: "140px"
              }} 
              onClick={() => onTabClick(i)}
            >
              {tab.label}
            </button>
            {tabs.length > 1 && (
              <button 
                onClick={e => { e.stopPropagation(); setPendingDelete(i); }} 
                style={{ position: "absolute", top: "4px", right: "6px", background: "none", border: "none", color: T.mutedText, cursor: "pointer", fontSize: "12px" }}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* PLUS BUTTON: Back next to the tabs */}
        <button 
          onClick={onAddTab} 
          style={{ 
            backgroundColor: "#ffbf6e", 
            border: "none", 
            borderRadius: "50%", 
            width: "24px", 
            height: "24px", 
            color: "#0E131C", 
            fontSize: "16px", 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            fontWeight: "bold",
            marginLeft: "8px",
            marginBottom: "6px", 
            flexShrink: 0
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function StreakAnimatedBadge({ frame, size = 28 }) {
  const frames = [frame1, frame2];

  return (
    <img 
      src={frames[frame]} 
      alt="streak" 
      style={{ 
        width: size, 
        height: size, 
        objectFit: "contain", 
        imageRendering: "pixelated", 
        flexShrink: 0 
      }} 
    />
  );
}

// ── Title Area ────────────────────────────────────────────────────────────────
function TitleArea({ onAtomize, title, setTitle, desc, setDesc, category, setCategory, T }) {
  const [atomizing, setAtomizing] = useState(false);
  const handleAtomize = async () => {
    if (!title.trim() || atomizing) return;
    setAtomizing(true);
    try { await onAtomize(title, category); } finally { setAtomizing(false); }
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
        <button onClick={handleAtomize} disabled={atomizing||!title.trim()}
          style={{ padding:"7px 18px",borderRadius:"8px",border:"none",fontWeight:"bold",cursor:atomizing||!title.trim()?"not-allowed":"pointer",fontFamily:"inherit",fontSize:"13px",background:atomizing?"#c48a30":"#ffbf6e",color:atomizing?"#7a5010":"#0E131C",opacity:atomizing?0.85:1,transition:"all 0.2s",display:"flex",alignItems:"center",gap:"6px" }}>
          {atomizing?<><span style={{display:"inline-block",animation:"spin 0.8s linear infinite"}}>⟳</span>Crumbling…</>:"🍪 Crumble"}
        </button>
      </div>
    </div>
  );
}

// ── File Upload Zone ──────────────────────────────────────────────────────────
function FileUploadZone({ onAtomizeFile, T }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState("");

  const processFile = async (file) => {
    if (!file) return;
    setLoading(true); setError(""); setProgress(0);
    try {
      const result = await analyzeFile(file, (pct, msg) => { setProgress(pct); setStatus(msg); });
      onAtomizeFile(result);
    } catch (err) {
      console.error("File analyze error:", err);
      setError("Failed to analyze file: " + (err.message || "Try again."));
      setLoading(false); setProgress(0);
    }
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <div className="upload-zone"
        onDragOver={e => { e.preventDefault(); setDragging(true); }} 
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
        style={{ 
          border: `2px dashed ${dragging ? "#ffbf6e" : T.border}`, 
          borderRadius: "14px", 
          padding: "20px 16px", 
          textAlign: "center", 
          cursor: "pointer", 
          background: dragging ? `${T.panelBg}88` : "transparent", 
          transition: "all 0.2s" 
        }}
        onClick={() => fileRef.current?.click()}
      >
        <input type="file" ref={fileRef} hidden onChange={e => processFile(e.target.files[0])} accept=".pdf,.txt,.docx,.png,.jpg,.jpeg" />
        
        {/* REPLACED SVG WITH YOUR IMPORTED IMAGE */}
        <div style={{ marginBottom: "10px", display: "flex", justifyContent: "center" }}>
          <img 
            src={bufferload} 
            alt="Upload Icon" 
            style={{ 
              width: "100px", 
              height: "100px", 
              objectFit: "contain",
              opacity: dragging ? 1 : 0.7,
              animation: dragging ? "spin 2s linear infinite" : "none"
            }} 
          />
        </div>

        <div style={{ fontSize: "14px", fontWeight: "600", color: T.text }}>
          {loading ? "Analyzing..." : "Drop a file or click to upload"}
        </div>
        <div style={{ fontSize: "11px", color: T.mutedText, marginTop: "4px" }}>
          PDF, TXT, Images or Docs supported
        </div>
        
        {loading && (
          <div style={{ marginTop: "12px" }}>
            <div style={{ height: "4px", background: T.trackBg, borderRadius: "2px", overflow: "hidden", marginBottom: "6px" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "#ffbf6e", transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: "10px", color: "#ffbf6e", fontWeight: "bold" }}>{status}</div>
          </div>
        )}
        {error && <div style={{ fontSize: "11px", color: "#ff4444", marginTop: "8px", fontWeight: "600" }}>{error}</div>}
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

  const openEdit = () => {
    if (isRunning) return;
    const h = Math.floor(totalSeconds/3600);
    const m = Math.floor((totalSeconds%3600)/60);
    const s = totalSeconds%60;
    const str = h > 0
      ? `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
      : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    setEditVal(str);
    setEditing(true);
  };

  useEffect(() => {
    if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editing]);

  const applyEdit = () => {
    const parts = editVal.trim().split(":").map(p => parseInt(p) || 0);
    let secs = 0;
    if (parts.length === 3) secs = parts[0]*3600 + parts[1]*60 + parts[2];
    else if (parts.length === 2) secs = parts[0]*60 + parts[1];
    else secs = parts[0]*60;
    if (secs > 0) setDuration(secs);
    setEditing(false);
  };

  const r=44, circ=2*Math.PI*r, dash=circ*(1-pct/100);
  const isBreak = mode === "break";
  const accent  = isBreak ? "#4caf7d" : "#ffbf6e";

  return (
    <div style={{ width:"100%",display:"flex",flexDirection:"column",alignItems:"center" }}>
      <div style={{ width:"100%",height:"1px",backgroundColor:T.border,marginBottom:"14px" }} />
      <div style={{ display:"flex",gap:"6px",marginBottom:"14px" }}>
        {["work","break"].map(m => (
          <button key={m} onClick={()=>{setMode(m);reset();}}
            style={{ padding:"3px 14px",borderRadius:"20px",border:"none",background:mode===m?"#ffbf6e":T.trackBg,color:mode===m?"#0E131C":T.dimText,fontWeight:mode===m?"700":"400",fontFamily:"inherit",fontSize:"11px",cursor:"pointer",textTransform:"uppercase",letterSpacing:"1px" }}>
            {m==="work"?"Focus":"Break"}
          </button>
        ))}
      </div>
      <div style={{ fontSize:"10px",color:T.dimText,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"10px" }}>{isBreak?"Break Timer":"Flowtime Timer"}</div>

      <div style={{ position:"relative",width:"110px",height:"110px",marginBottom:"6px" }}>
        <svg width="110" height="110" style={{ position:"absolute",top:0,left:0 }}>
          <circle cx="55" cy="55" r={r} fill="none" stroke={T.trackBg} strokeWidth="6" />
          {!editing && <circle cx="55" cy="55" r={r} fill="none" stroke={accent} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round" transform="rotate(-90 55 55)" style={{ transition:"stroke-dashoffset 0.8s ease" }} />}
        </svg>
        <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
          {editing ? (
            <input
              ref={inputRef}
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") applyEdit();
                if (e.key === "Escape") setEditing(false);
              }}
              style={{ width:"84px",background:"transparent",border:"none",borderBottom:`2px solid ${accent}`,color:accent,fontSize:"18px",fontWeight:"bold",textAlign:"center",fontFamily:"inherit",outline:"none",letterSpacing:"2px" }}
              placeholder="25:00"
            />
          ) : (
            <div onClick={openEdit} title={isRunning?"":"Click to edit"} style={{ fontSize:"22px",fontWeight:"bold",color:accent,letterSpacing:"2px",cursor:isRunning?"default":"pointer",userSelect:"none" }}>
              {formatTime(remaining)}
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize:"11px",color:T.mutedText,marginBottom:"12px",minHeight:"16px",textAlign:"center" }}>
        {editing ? "type MM:SS or HH:MM:SS · Enter to save · Esc to cancel" : !isRunning ? "click time to edit" : ""}
      </div>

      <div style={{ display:"flex",gap:"6px" }}>
        <button onClick={start} disabled={isRunning||remaining===0} style={{ padding:"6px 14px",borderRadius:"8px",border:"none",background:isRunning||remaining===0?T.trackBg:"#7effd4",color:isRunning||remaining===0?T.mutedText:"#0E131C",fontWeight:"bold",cursor:isRunning||remaining===0?"not-allowed":"pointer",fontFamily:"inherit",fontSize:"12px" }}>▶ Start</button>
        <button onClick={pause} disabled={!isRunning} style={{ padding:"6px 14px",borderRadius:"8px",border:"none",background:!isRunning?T.trackBg:"#ffbf6e",color:!isRunning?T.mutedText:"#0E131C",fontWeight:"bold",cursor:!isRunning?"not-allowed":"pointer",fontFamily:"inherit",fontSize:"12px" }}>⏸ Pause</button>
        <button onClick={reset} style={{ padding:"6px 14px",borderRadius:"8px",border:"none",background:T.panelBg,color:T.text,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",fontSize:"12px" }}>↺ Reset</button>
      </div>
    </div>
  );
}

// ── Scoreboard ────────────────────────────────────────────────────────────────
function Scoreboard({ xp, streak, timer, totalNodes, T }) {
  const maxXp=(totalNodes||5)*150, pct=(xp/maxXp)*100;
  const msg=streak>0?`You are on a ${streak}-day streak!`:"No streak yet!";
  const sub=streak>=7?"Unstoppable! 🔥":streak>=3?"Keep it up!":streak>=1?"Good start!":"Complete a task to start!";

  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % 2), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={T.scrollbar} style={{ flex:1,backgroundColor:T.panelBg,borderRadius:"20px",padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center",overflowY:"auto" }}>
      {/* Animated 2-frame streak icon */}
      <div style={{ marginBottom:"6px",lineHeight:1 }}>
        <StreakAnimatedBadge frame={frame} size={200} />
      </div>
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
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file||!file.type.startsWith("image/")) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setTimeout(()=>{ setUploading(false); onComplete(dataUrl); }, 400);
    };
    reader.readAsDataURL(file);
  };

  const trigger = () => { if (!isNextUp||sub.is_completed) return; fileInputRef.current?.click(); };

  return (
    <div style={{ height:`${ROW_H}px`,display:"flex",alignItems:"center",gap:"8px",opacity:isLocked?0.35:1,transition:"opacity 0.3s" }}
      title={isLocked?"Complete previous task first":isNextUp?"Upload proof to complete":""}>
      <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFileChange} />
      <div onClick={trigger} style={{ width:"26px",height:"26px",borderRadius:"50%",flexShrink:0,transition:"all 0.3s",cursor:isNextUp&&!sub.is_completed?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${sub.is_completed?"#4caf7d":isNextUp?"#ffbf6e":"#3a4060"}`,backgroundColor:sub.is_completed?"#4caf7d":"transparent",boxShadow:isNextUp&&!sub.is_completed?"0 0 8px #ffbf6e88":"none" }}>
        {sub.is_completed&&<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="2,6 5,9 10,3"/></svg>}
        {!sub.is_completed&&isNextUp&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffbf6e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
        {uploading&&<div style={{ width:"8px",height:"8px",borderRadius:"50%",background:"#ffbf6e",animation:"pulse 0.5s ease infinite alternate" }}/>}
      </div>
      <span style={{ fontSize:"13px",color:sub.is_completed?"#4caf7d":isNextUp?T.text:T.dimText,transition:"color 0.3s",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1,textAlign:"left" }}>
        {sub.title}
      </span>
      {isNextUp&&!sub.is_completed&&(
        <button onClick={trigger} title="Attach proof screenshot" style={{ marginLeft:"auto",background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center",flexShrink:0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffbf6e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        </button>
      )}
      {sub.is_completed&&sub.proofUrl&&<img src={sub.proofUrl} alt="proof" style={{ width:"20px",height:"20px",borderRadius:"4px",objectFit:"cover",border:"1px solid #4caf7d",flexShrink:0,marginLeft:"auto" }}/>}
    </div>
  );
}

// ── Phase Block ───────────────────────────────────────────────────────────────
function PhaseBlock({ node, isPhaseActive, onCompleteSubtask, T }) {
  const subtasks   = node.subtasks||[];
  const svgH       = subtasks.length * ROW_H;
  const doneSubs   = subtasks.filter(s=>s.is_completed).length;
  const lineColor  = T.completedLine;
  const trackColor = T.isDark ? "#2a2f45" : T.border;

  return (
    <div style={{ marginBottom:"24px" }}>
      <div style={{ display:"flex",alignItems:"center",gap:"12px",marginBottom:"4px" }}>
        <div style={{ width:"30px",height:"30px",borderRadius:"50%",flexShrink:0,transition:"all 0.3s",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",border:`2px solid ${node.is_completed?"#4caf7d":isPhaseActive?"#ffbf6e":"#445"}`,backgroundColor:node.is_completed?"#4caf7d":"transparent",color:"#fff" }}>
          {node.is_completed?"✓":""}
        </div>
        <div style={{ fontSize:"15px",fontWeight:"600",transition:"color 0.3s",color:node.is_completed?"#4caf7d":isPhaseActive?"#ffbf6e":T.text }}>
          {node.title}
        </div>
      </div>
      {subtasks.length>0&&(
        <div style={{ display:"flex",alignItems:"flex-start",marginLeft:"14px" }}>
          <svg key={`svg-${node.node_id}-${doneSubs}`} width="32" height={svgH} style={{ flexShrink:0 }}>
            <line x1="2" y1="0" x2="2" y2={svgH} stroke={trackColor} strokeWidth="3"/>
            {subtasks.map((sub,i)=>{ const cy=i*ROW_H+ROW_H/2; return <line key={`trk-${sub.subtask_id}`} x1="2" y1={cy} x2="28" y2={cy} stroke={trackColor} strokeWidth="3"/>; })}
            {subtasks.map((sub,i)=>{
              if(!sub.is_completed) return null;
              const prevCy=i===0?0:(i-1)*ROW_H+ROW_H/2, cy=i*ROW_H+ROW_H/2;
              const isNewest=i===doneSubs-1;
              return (
                <g key={`done-${sub.subtask_id}`} style={isNewest?{opacity:0,animation:"fadeInLine 0.5s ease-out forwards"}:{opacity:1}}>
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
              return <SubtaskRow key={sub.subtask_id} sub={sub} isNextUp={isNextUp} isLocked={!sub.is_completed&&!isNextUp} onComplete={(dataUrl)=>onCompleteSubtask(node.node_id,sub.subtask_id,dataUrl)} T={T}/>;
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
      {!hasRoadmap && <FileUploadZone onAtomizeFile={onAtomizeFile} T={T}/>}
      {nodes.length===0
        ? <p style={{ color:T.mutedText,fontSize:"13px",margin:0,textAlign:"left" }}>Enter a project above and hit ✨ Atomize!, or upload a file to generate your roadmap.</p>
        : nodes.map(node=><PhaseBlock key={node.node_id} node={node} isPhaseActive={node.node_id===activeNode&&!node.is_completed} onCompleteSubtask={onCompleteSubtask} T={T}/>)
      }
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function Breadcrumber() {
  const tabCounter = useRef(3);
  const [tabs, setTabs]   = useState([{id:1,label:"Project 1"},{id:2,label:"Project 2"},{id:3,label:"Project 3"}]);
  const [activeTab, setActiveTab] = useState(0);
  const [tabData, setTabData]     = useState({1:blankProject(),2:blankProject(),3:blankProject()});
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved !== null ? saved === "true" : true;
  });
  const [notifications, setNotifications] = useState([]);
  const [view, setView]           = useState("roadmap");

  const { streak, updateStreak } = useStreak();
  const timer        = useCountdownTimer();
  const T            = darkMode ? darkTheme : lightTheme;
  const currentTabId = tabs[activeTab]?.id;
  const project      = tabData[currentTabId] || blankProject();

  const updateProject = useCallback((id, updater) => {
    setTabData(prev => ({ ...prev, [id]: updater(prev[id] || blankProject()) }));
  }, []);

  const setTitle = (v) => {
    updateProject(currentTabId, p => ({ ...p, title: v }));
    setTabs(prev => prev.map(t => t.id === currentTabId
      ? { ...t, label: v.trim() || `Project ${currentTabId}` }
      : t
    ));
  };
  const setDesc     = v => updateProject(currentTabId, p=>({...p,desc:v}));
  const setCategory = v => updateProject(currentTabId, p=>({...p,category:v}));

  const handleCompleteSubtask = (nodeId, subtaskId, proofDataUrl) => {
    const tabId = currentTabId;
    updateProject(tabId, proj => {
      const updatedNodes = proj.nodes.map(node => {
        if (node.node_id !== nodeId) return node;
        const updatedSubtasks = node.subtasks.map(s =>
          s.subtask_id===subtaskId ? {...s,is_completed:true,proofUrl:proofDataUrl} : s
        );
        const allDone = updatedSubtasks.every(s=>s.is_completed);
        if (allDone && !node.is_completed)
          setNotifications(prev => [{icon:"🏆",title:`Phase complete: ${node.title}`,body:`You finished all subtasks in "${node.title}"!`},...prev]);
        return {...node,subtasks:updatedSubtasks,is_completed:allDone};
      });
      const cNode = updatedNodes.find(n=>n.node_id===nodeId);
      const parentDone = cNode?.is_completed;
      const phaseName  = proj.nodes.find(n=>n.node_id===nodeId)?.title || "Phase";
      const sub        = proj.nodes.find(n=>n.node_id===nodeId)?.subtasks.find(s=>s.subtask_id===subtaskId);
      const newAlbum   = {...proj.proofAlbum};
      if (proofDataUrl) {
        if (!newAlbum[subtaskId]) newAlbum[subtaskId] = [];
        newAlbum[subtaskId] = [...newAlbum[subtaskId], { dataUrl:proofDataUrl, subtaskTitle:sub?.title||subtaskId, taskTitle:phaseName, uploadedAt:new Date().toLocaleString() }];
      }
      return { ...proj, nodes:updatedNodes, activeNode:parentDone?proj.activeNode+1:proj.activeNode, xp:proj.xp+50+(parentDone?100:0), completedNodes:parentDone?[...proj.completedNodes,nodeId]:proj.completedNodes, proofAlbum:newAlbum };
    });
    updateStreak();
  };

  const handleAtomize = async (projectName, cat) => {
    try {
      const data = await atomizeProject(projectName, cat);
      updateProject(currentTabId, p => ({
        ...p, nodes: data.nodes, activeNode: 0,
        xp: 0, completedNodes: [], hasRoadmap: true, proofAlbum: {}
      }));
    } catch (err) {
      console.error("Atomize failed:", err);
      alert(`Atomize failed: ${err.message}`);
    }
  };

  const handleAtomizeFile = (parsed) => {
    if (!parsed?.nodes?.length) return;
    const newTitle = parsed.project_name || "";
    if (newTitle) {
      setTabs(prev => prev.map(t => t.id === currentTabId ? {...t, label: newTitle} : t));
    }
    updateProject(currentTabId, p => ({
      ...p,
      nodes:        parsed.nodes,
      activeNode:   0,
      xp:           0,
      completedNodes: [],
      hasRoadmap:   true,
      proofAlbum:   {},
      title:        newTitle || p.title,
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
    const dId=tabs[i].id;
    setTabs(prev=>prev.filter((_,idx)=>idx!==i));
    setTabData(prev=>{ const n={...prev}; delete n[dId]; return n; });
    setActiveTab(prev=>{ if(prev===i) return Math.max(0,i-1); if(prev>i) return prev-1; return prev; });
  };

  return (
    <div style={{ backgroundColor:T.bg,padding:"10px",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",height:"100vh",margin:0,boxSizing:"border-box",overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin          { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse         { from{opacity:0.6} to{opacity:1} }
        @keyframes fadeInLine    { from{opacity:0} to{opacity:1} }
        @keyframes fadeInOverlay { from{opacity:0} to{opacity:1} }
        @keyframes popIn         { 0%{opacity:0;transform:scale(0.7)} 60%{transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }
        ::placeholder { color: #889; }
        * { box-sizing: border-box; }
        .upload-zone:hover { border-color: #ffbf6e !important; }
        .scrollbar-light::-webkit-scrollbar{width:6px}
        .scrollbar-light::-webkit-scrollbar-track{background:#d4b896;border-radius:10px}
        .scrollbar-light::-webkit-scrollbar-thumb{background:#b89470;border-radius:10px}
        .scrollbar-dark::-webkit-scrollbar{width:6px}
        .scrollbar-dark::-webkit-scrollbar-track{background:#1a1f35;border-radius:10px}
        .scrollbar-dark::-webkit-scrollbar-thumb{background:#3a4060;border-radius:10px}
        .scrollbar-dark::-webkit-scrollbar-thumb:hover{background:#556080}
      `}</style>

      {timer.isDone && <TimerBreakPopup mode={timer.mode} onOkay={timer.dismissDone} T={T} />}

      <div style={{ display:"flex",gap:"16px",padding:"16px",height:"100%",boxSizing:"border-box" }}>
        <Sidebar onTimerToggle={()=>timer.isRunning?timer.pause():timer.start()} isRunning={timer.isRunning} darkMode={darkMode} onToggleDark={() => {
          setDarkMode(d => {
            localStorage.setItem("darkMode", String(!d));
            return !d;
          });
        }} view={view} onSetView={setView} T={T}/>
        <div style={{ flex:1,display:"flex",flexDirection:"column",minWidth:0 }}>
          <Nav tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} onAddTab={handleAddTab} onDeleteTab={handleDeleteTab} streak={streak} notifications={notifications} onClearNotifs={()=>setNotifications([])} T={T}/>
          <div style={{ backgroundColor:T.cardBg,flex:1,borderRadius:"0 12px 12px 12px",overflow:"hidden",display:"flex",flexDirection:"column",minHeight:0 }}>
            <TitleArea onAtomize={handleAtomize} title={project.title} setTitle={setTitle} desc={project.desc} setDesc={setDesc} category={project.category} setCategory={setCategory} T={T}/>
            <div style={{ display:"flex",gap:"12px",flex:1,padding:"12px 16px 16px",minHeight:0 }}>
              {view==="album"
                ? <div className={T.scrollbar} style={{ flex:"0 0 58%",backgroundColor:T.panelBg,borderRadius:"20px",overflow:"hidden",display:"flex",flexDirection:"column" }}>
                    <AlbumView proofAlbum={project.proofAlbum||{}} nodes={project.nodes||[]} T={T}/>
                  </div>
                : <Roadmap nodes={project.nodes} activeNode={project.activeNode} onCompleteSubtask={handleCompleteSubtask} onAtomizeFile={handleAtomizeFile} hasRoadmap={project.hasRoadmap} T={T}/>
              }
              <Scoreboard xp={project.xp} streak={streak} timer={timer} totalNodes={project.nodes.length} T={T}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
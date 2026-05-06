import { useState, useRef, useEffect } from "react";
import { useApp } from "./context/AppContext";
import { useStreak } from "./hooks/useStreak";
import { atomizeProject } from "./hooks/useApi";

// ── Countdown Timer Hook ──────────────────────────────────────────────────────

function useCountdownTimer() {
  const [totalSeconds, setTotalSeconds] = useState(25 * 60); // default 25 min
  const [remaining, setRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("work"); // "work" | "break"
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const start = () => { if (remaining > 0) setIsRunning(true); };
  const pause = () => setIsRunning(false);
  const reset = () => { setIsRunning(false); setRemaining(totalSeconds); };
  const setDuration = (secs) => {
    setIsRunning(false);
    setTotalSeconds(secs);
    setRemaining(secs);
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  const pct = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  return { remaining, isRunning, mode, setMode, start, pause, reset, setDuration, formatTime, pct, totalSeconds };
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  body: {
    backgroundColor: "#0E131C",
    padding: "10px",
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    height: "100vh",
    margin: 0,
    boxSizing: "border-box",
    overflow: "hidden",
  },
  containerGrid: {
    display: "flex",
    gap: "16px",
    padding: "16px",
    height: "100%",
    boxSizing: "border-box",
  },
  sidebar: {
    backgroundColor: "#1e2235",
    width: "56px",
    minWidth: "56px",
    padding: "16px 8px",
    borderRadius: "30px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
  sidebarBtn: {
    background: "none",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    borderRadius: "10px",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
    transition: "color 0.2s, background 0.2s",
  },
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  nav: {
    display: "flex",
    alignItems: "flex-end",
    backgroundColor: "#0E131C",
    flexShrink: 0,
  },
  tab: (active) => ({
    backgroundColor: active ? "#2d3450" : "#1a1f35",
    padding: "10px 36px 10px 16px",
    borderRadius: "12px 12px 0 0",
    color: active ? "#fff" : "#778",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: active ? "600" : "400",
    userSelect: "none",
    border: "none",
    fontFamily: "inherit",
    lineHeight: 1.4,
  }),
  addTabBtn: {
    backgroundColor: "#ffbf6e",
    border: "none",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    color: "#0E131C",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "8px",
    marginBottom: "6px",
    fontWeight: "bold",
    fontFamily: "inherit",
    flexShrink: 0,
  },
  navRight: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    paddingBottom: "6px",
    paddingRight: "4px",
    flexShrink: 0,
  },
  streakBadge: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "#1a1f35",
    borderRadius: "10px",
    padding: "5px 12px 5px 10px",
  },
  streakLabel: { fontSize: "9px", color: "#aab", letterSpacing: "1px", textTransform: "uppercase" },
  streakNum: { fontSize: "18px", fontWeight: "bold", color: "#fff", lineHeight: 1 },
  bellBtn: {
    background: "none",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    transition: "color 0.2s",
    padding: 0,
  },
  home: {
    backgroundColor: "#2d3450",
    flex: 1,
    borderRadius: "0 12px 12px 12px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  titleArea: {
    padding: "20px 28px 14px",
    flexShrink: 0,
    borderBottom: "1px solid #3a3f5a",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "6px",
  },
  tagPill: {
    backgroundColor: "#3a4060",
    padding: "3px 14px",
    borderRadius: "20px",
    color: "#aab",
    fontSize: "12px",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  projectTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#ffbf6e",
    border: "none",
    outline: "none",
    background: "transparent",
    fontFamily: "inherit",
    flex: 1,
    minWidth: 0,
  },
  projectDesc: {
    fontSize: "13px",
    color: "#aab",
    border: "none",
    outline: "none",
    background: "transparent",
    fontFamily: "inherit",
    width: "100%",
    marginBottom: "10px",
    display: "block",
  },
  atomizeRow: { display: "flex", gap: "8px", marginTop: "4px" },
  atomizeInput: { flex: 1, padding: "7px 12px", borderRadius: "8px", border: "none", background: "#1a1f35", color: "#fff", fontFamily: "inherit", fontSize: "13px" },
  atomizeBtn: { padding: "7px 18px", borderRadius: "8px", border: "none", background: "#ffbf6e", color: "#0E131C", fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", fontSize: "13px" },
  panels: { display: "flex", gap: "12px", flex: 1, padding: "12px 16px 16px", minHeight: 0 },
  roadmapPanel: { flex: "0 0 58%", backgroundColor: "#1e2235", borderRadius: "20px", padding: "20px", overflowY: "auto" },
  roadmapTitle: { fontSize: "12px", color: "#aab", marginBottom: "20px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" },
  scorePanel: { flex: 1, backgroundColor: "#1e2235", borderRadius: "20px", padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", overflowY: "auto" },
  mascotWrap: { fontSize: "64px", marginBottom: "6px", lineHeight: 1 },
  streakMsg: { fontSize: "15px", fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: "2px" },
  streakSub: { fontSize: "12px", color: "#aab", textAlign: "center", marginBottom: "14px" },
  xpBarWrap: { width: "100%", backgroundColor: "#2d3450", borderRadius: "20px", height: "10px", overflow: "hidden", marginBottom: "4px" },
  xpBarFill: (pct) => ({ width: `${Math.min(pct, 100)}%`, height: "100%", backgroundColor: "#4caf7d", borderRadius: "20px", transition: "width 0.4s ease" }),
  xpPts: { fontSize: "12px", color: "#7effd4", alignSelf: "flex-end", marginBottom: "14px" },
  divider: { width: "100%", height: "1px", backgroundColor: "#3a4060", marginBottom: "14px" },
};

const ROW_H = 36;

// ── Sidebar ───────────────────────────────────────────────────────────────────

function SidebarIcon({ onClick, title, children, active }) {
  const [h, setH] = useState(false);
  return (
    <button
      style={{
        ...styles.sidebarBtn,
        color: active || h ? "#fff" : "#6b7280",
        backgroundColor: active || h ? "#2d3450" : "transparent",
      }}
      onClick={onClick}
      title={title}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
    >
      {children}
    </button>
  );
}

function Sidebar({ onTimerToggle, isRunning }) {
  return (
    <div style={styles.sidebar}>
      <SidebarIcon onClick={onTimerToggle} title="Timer" active={isRunning}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </SidebarIcon>
      <SidebarIcon title="Camera">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
        </svg>
      </SidebarIcon>
      <SidebarIcon title="Dark Mode">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </SidebarIcon>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav({ tabs, activeTab, onTabClick, onAddTab, onDeleteTab, streak }) {
  return (
    <div style={styles.nav}>
      {tabs.map((tab, i) => (
        <div key={tab.id} style={{ position: "relative", display: "inline-flex", marginRight: "4px" }}>
          <button style={styles.tab(activeTab === i)} onClick={() => onTabClick(i)}>
            {tab.label}
          </button>
          {tabs.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteTab(i); }}
              title="Delete project"
              style={{
                position: "absolute", top: "5px", right: "5px",
                background: "none", border: "none",
                color: activeTab === i ? "#ff7c7c" : "#556",
                cursor: "pointer", fontSize: "11px", lineHeight: 1,
                padding: "0 2px", fontFamily: "inherit", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "14px", height: "14px",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#ff4444"}
              onMouseLeave={e => e.currentTarget.style.color = activeTab === i ? "#ff7c7c" : "#556"}
            >×</button>
          )}
        </div>
      ))}

      <button style={styles.addTabBtn} onClick={onAddTab}>+</button>

      <div style={styles.navRight}>
        {/* Streak: flame icon + STREAK label + number */}
        <div style={styles.streakBadge}>
          {/* Flame SVG */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffbf6e" stroke="none">
            <path d="M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0c0-2.5-1.5-5-2-6.5C14.5 8 14 10 12 11c0 0 1-4-0-9z"/>
          </svg>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={styles.streakLabel}>STREAK</span>
            <span style={styles.streakNum}>{streak}</span>
          </div>
        </div>

        {/* Bell */}
        <button
          style={styles.bellBtn}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Title Area ────────────────────────────────────────────────────────────────

function TitleArea({ onAtomize, category, setCategory }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  return (
    <div style={styles.titleArea}>
      <style>{`
        ::placeholder { color: #445; }
        @keyframes snakeDraw {
          from { stroke-dashoffset: 999; }
          to   { stroke-dashoffset: 0; }
        }
        .upload-zone { transition: background 0.2s, border-color 0.2s; }
        .upload-zone:hover { background: #2a3050 !important; border-color: #ffbf6e !important; }
      `}</style>

      {/* Tag pill inline before title */}
      <div style={styles.titleRow}>
        <span style={styles.tagPill}>{category || "tag"}</span>
        <input
          style={styles.projectTitle}
          placeholder="Project title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
        />
      </div>

      <input
        style={styles.projectDesc}
        placeholder="Project description..."
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        maxLength={200}
      />

      <div style={styles.atomizeRow}>
        <input
          style={styles.atomizeInput}
          placeholder="Category (e.g. Art, Coding...)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <button style={styles.atomizeBtn} onClick={() => title.trim() && onAtomize(title, category)}>
          ✨ Atomize!
        </button>
      </div>
    </div>
  );
}

// ── Countdown Timer Component ─────────────────────────────────────────────────

function CountdownTimer({ timer }) {
  const { remaining, isRunning, mode, setMode, start, pause, reset, setDuration, formatTime, pct, totalSeconds } = timer;
  const [editing, setEditing] = useState(false);
  const [editH, setEditH] = useState("00");
  const [editM, setEditM] = useState("25");
  const [editS, setEditS] = useState("00");

  const openEdit = () => {
    if (isRunning) return;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    setEditH(String(h).padStart(2, "0"));
    setEditM(String(m).padStart(2, "0"));
    setEditS(String(s).padStart(2, "0"));
    setEditing(true);
  };

  const applyEdit = () => {
    const secs = (parseInt(editH) || 0) * 3600 + (parseInt(editM) || 0) * 60 + (parseInt(editS) || 0);
    if (secs > 0) setDuration(secs);
    setEditing(false);
  };

  const inputStyle = {
    width: "44px", background: "transparent", border: "none",
    borderBottom: "2px solid #ffbf6e", color: "#ffbf6e",
    fontSize: "28px", fontWeight: "bold", textAlign: "center",
    fontFamily: "inherit", outline: "none", letterSpacing: "2px",
  };

  // Arc progress
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct / 100);

  const isBreak = mode === "break";

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={styles.divider} />

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
        {["work", "break"].map(m => (
          <button key={m} onClick={() => { setMode(m); reset(); }}
            style={{
              padding: "3px 14px", borderRadius: "20px", border: "none",
              background: mode === m ? "#ffbf6e" : "#2d3450",
              color: mode === m ? "#0E131C" : "#778",
              fontWeight: mode === m ? "700" : "400",
              fontFamily: "inherit", fontSize: "11px", cursor: "pointer",
              textTransform: "uppercase", letterSpacing: "1px",
            }}>
            {m === "work" ? "Focus" : "Break"}
          </button>
        ))}
      </div>

      {/* Label */}
      <div style={{ fontSize: "10px", color: "#778", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" }}>
        {isBreak ? "Break Timer" : "Flowtime Timer"}
      </div>

      {/* Arc ring + time display */}
      <div style={{ position: "relative", width: "110px", height: "110px", marginBottom: "14px" }}>
        <svg width="110" height="110" style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx="55" cy="55" r={r} fill="none" stroke="#2d3450" strokeWidth="6" />
          <circle
            cx="55" cy="55" r={r} fill="none"
            stroke={isBreak ? "#4caf7d" : "#ffbf6e"}
            strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={dash}
            strokeLinecap="round"
            transform="rotate(-90 55 55)"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {editing ? (
            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <input style={inputStyle} value={editH} maxLength={2}
                onChange={e => setEditH(e.target.value.replace(/\D/g, "").slice(0,2))}
                onBlur={applyEdit} onKeyDown={e => e.key === "Enter" && applyEdit()} />
              <span style={{ color: "#ffbf6e", fontSize: "22px", fontWeight: "bold" }}>:</span>
              <input style={inputStyle} value={editM} maxLength={2}
                onChange={e => setEditM(e.target.value.replace(/\D/g, "").slice(0,2))}
                onBlur={applyEdit} onKeyDown={e => e.key === "Enter" && applyEdit()} />
              <span style={{ color: "#ffbf6e", fontSize: "22px", fontWeight: "bold" }}>:</span>
              <input style={inputStyle} value={editS} maxLength={2}
                onChange={e => setEditS(e.target.value.replace(/\D/g, "").slice(0,2))}
                onBlur={applyEdit} onKeyDown={e => e.key === "Enter" && applyEdit()} />
            </div>
          ) : (
            <div
              onClick={openEdit}
              title={isRunning ? "" : "Click to edit time"}
              style={{
                fontSize: "22px", fontWeight: "bold", color: isBreak ? "#4caf7d" : "#ffbf6e",
                letterSpacing: "2px", cursor: isRunning ? "default" : "pointer",
                userSelect: "none",
              }}
            >
              {formatTime(remaining)}
            </div>
          )}
        </div>
      </div>

      {!editing && (
        <div style={{ fontSize: "11px", color: "#556", marginBottom: "10px" }}>
          {!isRunning && "click time to edit"}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: "6px" }}>
        <button
          onClick={start} disabled={isRunning || remaining === 0}
          style={{
            padding: "6px 14px", borderRadius: "8px", border: "none",
            background: isRunning || remaining === 0 ? "#2a2f45" : "#7effd4",
            color: isRunning || remaining === 0 ? "#556" : "#0E131C",
            fontWeight: "bold", cursor: isRunning || remaining === 0 ? "not-allowed" : "pointer",
            fontFamily: "inherit", fontSize: "12px",
          }}>▶ Start</button>
        <button
          onClick={pause} disabled={!isRunning}
          style={{
            padding: "6px 14px", borderRadius: "8px", border: "none",
            background: !isRunning ? "#2a2f45" : "#ffbf6e",
            color: !isRunning ? "#556" : "#0E131C",
            fontWeight: "bold", cursor: !isRunning ? "not-allowed" : "pointer",
            fontFamily: "inherit", fontSize: "12px",
          }}>⏸ Pause</button>
        <button
          onClick={reset}
          style={{
            padding: "6px 14px", borderRadius: "8px", border: "none",
            background: "#3a4060", color: "#fff",
            fontWeight: "bold", cursor: "pointer",
            fontFamily: "inherit", fontSize: "12px",
          }}>↺ Reset</button>
      </div>

      {remaining === 0 && (
        <div style={{
          marginTop: "10px", fontSize: "13px", fontWeight: "bold",
          color: isBreak ? "#4caf7d" : "#ffbf6e",
          animation: "pulse 1s ease-in-out infinite alternate",
        }}>
          {isBreak ? "Break over! Get back to work 💪" : "Time's up! Take a break 🎉"}
        </div>
      )}

      <style>{`
        @keyframes pulse { from { opacity: 0.6; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

// ── Scoreboard ────────────────────────────────────────────────────────────────

function Scoreboard({ xp, streak, timer, totalNodes }) {
  const maxXp = (totalNodes || 5) * 150;
  const pct = (xp / maxXp) * 100;
  const mascot = "🍪";
  const msg = streak > 0 ? `You are on a ${streak}-day streak!` : "No streak yet!";
  const sub = streak >= 7 ? "Unstoppable! 🔥" : streak >= 3 ? "Keep it up!" : streak >= 1 ? "Good start!" : "Complete a task to start!";

  return (
    <div style={styles.scorePanel}>
      <div style={styles.mascotWrap}>{mascot}</div>
      <div style={styles.streakMsg}>{msg}</div>
      <div style={styles.streakSub}>{sub}</div>
      <div style={{ width: "100%" }}>
        <div style={styles.xpBarWrap}><div style={styles.xpBarFill(pct)} /></div>
      </div>
      <div style={styles.xpPts}>Points: {xp}</div>
      <CountdownTimer timer={timer} />
    </div>
  );
}

// ── Phase Block ───────────────────────────────────────────────────────────────

function PhaseBlock({ node, isPhaseActive, onCompleteSubtask }) {
  const isPhaseCompleted = node.is_completed;
  const subtasks = node.subtasks || [];
  const svgH = subtasks.length * ROW_H;
  const VERT_LEN = ROW_H;
  const HORIZ_LEN = 21;
  const ANIM_DURATION = 0.15;
  const doneSubs = subtasks.filter(s => s.is_completed).length;

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
        <div style={{
          width: "24px", height: "24px", borderRadius: "50%",
          border: `2px solid ${isPhaseCompleted ? "#4caf7d" : isPhaseActive ? "#ffbf6e" : "#445"}`,
          backgroundColor: isPhaseCompleted ? "#4caf7d" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "11px", color: "#fff", flexShrink: 0, transition: "all 0.3s",
        }}>
          {isPhaseCompleted ? "✓" : ""}
        </div>
        <div style={{
          fontSize: "15px", fontWeight: "600",
          color: isPhaseCompleted ? "#4caf7d" : isPhaseActive ? "#ffbf6e" : "#ccd",
          transition: "color 0.3s",
        }}>
          {node.title}
        </div>
      </div>

      {subtasks.length > 0 && (
        <div style={{ display: "flex", alignItems: "flex-start", marginLeft: "11px" }}>
          <svg
            key={`svg-${node.node_id}-${doneSubs}`}
            width="28" height={svgH} style={{ flexShrink: 0 }}
          >
            <line x1="1" y1="0" x2="1" y2={svgH} stroke="#2a2f45" strokeWidth="2" />
            {subtasks.map((sub, i) => {
              const cy = i * ROW_H + ROW_H / 2;
              return <line key={`bg-${sub.subtask_id}`} x1="1" y1={cy} x2="22" y2={cy} stroke="#2a2f45" strokeWidth="2" />;
            })}
            {subtasks.map((sub, i) => {
              if (!sub.is_completed) return null;
              const prevCy = i === 0 ? 0 : (i - 1) * ROW_H + ROW_H / 2;
              const cy = i * ROW_H + ROW_H / 2;
              const isNewest = i === doneSubs - 1;
              if (!isNewest) return (
                <g key={`snake-${sub.subtask_id}`}>
                  <line x1="1" y1={prevCy} x2="1" y2={cy} stroke="#ffffff" strokeWidth="2" />
                  <line x1="1" y1={cy} x2="22" y2={cy} stroke="#ffffff" strokeWidth="2" />
                </g>
              );
              return (
                <g key={`snake-${sub.subtask_id}`}>
                  <line x1="1" y1={prevCy} x2="1" y2={cy} stroke="#ffffff" strokeWidth="2"
                    strokeDasharray={VERT_LEN} strokeDashoffset={VERT_LEN}
                    style={{ animation: `snakeDraw ${ANIM_DURATION}s ease-out 0s forwards` }} />
                  <line x1="1" y1={cy} x2="22" y2={cy} stroke="#ffffff" strokeWidth="2"
                    strokeDasharray={HORIZ_LEN} strokeDashoffset={HORIZ_LEN}
                    style={{ animation: `snakeDraw ${ANIM_DURATION}s ease-out ${ANIM_DURATION}s forwards` }} />
                </g>
              );
            })}
            {subtasks.map((sub, i) => {
              const cy = i * ROW_H + ROW_H / 2;
              const prevDone = i === 0 || subtasks[i - 1].is_completed;
              const isNextUp = !sub.is_completed && prevDone && isPhaseActive;
              if (!isNextUp) return null;
              return <line key={`nextup-${sub.subtask_id}`} x1="1" y1={cy} x2="22" y2={cy} stroke="#ffffff44" strokeWidth="2" />;
            })}
          </svg>

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {subtasks.map((sub, i) => {
              const prevDone = i === 0 || subtasks[i - 1].is_completed;
              const isNextUp = !sub.is_completed && prevDone && isPhaseActive;
              const isLocked = !sub.is_completed && !isNextUp;
              return (
                <SubtaskRow
                  key={sub.subtask_id}
                  sub={sub}
                  isNextUp={isNextUp}
                  isLocked={isLocked}
                  onComplete={() => onCompleteSubtask(node.node_id, sub.subtask_id)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subtask Row (with screenshot upload) ─────────────────────────────────────

function SubtaskRow({ sub, isNextUp, isLocked, onComplete }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    const url = URL.createObjectURL(file);
    setPreview(url);
    // Small delay so user sees the preview flash, then mark complete
    setTimeout(() => {
      setUploading(false);
      onComplete();
    }, 600);
  };

  const triggerUpload = () => {
    if (!isNextUp || sub.is_completed) return;
    fileInputRef.current?.click();
  };

  return (
    <div
      style={{
        height: `${ROW_H}px`,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        opacity: isLocked ? 0.35 : 1,
        transition: "opacity 0.3s",
        paddingLeft: "4px",
      }}
      title={isLocked ? "Complete the previous task first!" : isNextUp ? "Upload a screenshot to complete!" : ""}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Circle — click triggers upload */}
      <div
        onClick={triggerUpload}
        style={{
          width: "20px", height: "20px", borderRadius: "50%",
          border: `2px solid ${sub.is_completed ? "#4caf7d" : isNextUp ? "#ffbf6e" : "#3a4060"}`,
          backgroundColor: sub.is_completed ? "#4caf7d" : "transparent",
          flexShrink: 0,
          transition: "all 0.3s",
          cursor: isNextUp && !sub.is_completed ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: isNextUp && !sub.is_completed ? "0 0 8px #ffbf6e88" : "none",
        }}
      >
        {sub.is_completed && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="2,6 5,9 10,3"/>
          </svg>
        )}
        {!sub.is_completed && isNextUp && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffbf6e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        )}
        {uploading && (
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffbf6e", animation: "pulse 0.5s ease infinite alternate" }} />
        )}
      </div>

      {/* Task text */}
      <span style={{
        fontSize: "13px",
        color: sub.is_completed ? "#4caf7d" : isNextUp ? "#fff" : "#778",
        textDecoration: sub.is_completed ? "line-through" : "none",
        transition: "color 0.3s",
        whiteSpace: "nowrap",
        flex: 1,
      }}>
        {sub.title}
      </span>

      {/* Upload prompt badge */}
      {isNextUp && !sub.is_completed && (
        <span
          onClick={triggerUpload}
          style={{
            fontSize: "10px", color: "#0E131C",
            backgroundColor: "#ffbf6e",
            padding: "2px 8px", borderRadius: "10px",
            whiteSpace: "nowrap", cursor: "pointer", fontWeight: "bold",
          }}
        >
          📎 proof
        </span>
      )}

      {/* Tiny screenshot thumbnail on completion */}
      {sub.is_completed && preview && (
        <img src={preview} alt="proof" style={{ width: "20px", height: "20px", borderRadius: "4px", objectFit: "cover", border: "1px solid #4caf7d" }} />
      )}
    </div>
  );
}

// ── Roadmap ───────────────────────────────────────────────────────────────────

function Roadmap({ nodes, activeNode, onCompleteSubtask }) {
  return (
    <div style={styles.roadmapPanel}>
      <div style={styles.roadmapTitle}>Roadmap</div>
      {nodes.length === 0 ? (
        <p style={{ color: "#556", fontSize: "13px" }}>Enter a project above and hit ✨ Atomize!</p>
      ) : (
        nodes.map((node) => (
          <PhaseBlock
            key={node.node_id}
            node={node}
            isPhaseActive={node.node_id === activeNode && !node.is_completed}
            onCompleteSubtask={onCompleteSubtask}
          />
        ))
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Breadcrumber() {
  const tabCounter = useRef(3);
  const [tabs, setTabs] = useState([
    { id: 1, label: "Project 1" },
    { id: 2, label: "Project 2" },
    { id: 3, label: "Project 3" },
  ]);
  const [activeTab, setActiveTab] = useState(0);
  const [category, setCategory] = useState("");
  const { state, dispatch } = useApp();
  const { streak, updateStreak } = useStreak();
  const timer = useCountdownTimer();

  const handleCompleteSubtask = (nodeId, subtaskId) => {
    dispatch({ type: "COMPLETE_SUBTASK", payload: { nodeId, subtaskId } });
    updateStreak();
  };

  const handleAtomize = async (projectName, cat) => {
    try {
      const data = await atomizeProject(projectName, cat);
      dispatch({ type: "SET_NODES", payload: data.nodes });
    } catch (err) {
      console.error("Atomize failed — is the backend running?", err);
    }
  };

  const handleAddTab = () => {
    tabCounter.current += 1;
    const newId = tabCounter.current;
    setTabs(prev => [...prev, { id: newId, label: `Project ${newId}` }]);
    setActiveTab(tabs.length);
  };

  const handleDeleteTab = (i) => {
    if (tabs.length <= 1) return;
    setTabs(prev => prev.filter((_, idx) => idx !== i));
    setActiveTab(prev => {
      if (prev === i) return Math.max(0, i - 1);
      if (prev > i) return prev - 1;
      return prev;
    });
  };

  return (
    <div style={styles.body}>
      <style>{`
        @keyframes snakeDraw { from { stroke-dashoffset: 999; } to { stroke-dashoffset: 0; } }
        @keyframes pulse { from { opacity: 0.6; } to { opacity: 1; } }
        ::placeholder { color: #445; }
        * { box-sizing: border-box; }
      `}</style>
      <div style={styles.containerGrid}>
        <Sidebar onTimerToggle={() => (timer.isRunning ? timer.pause() : timer.start())} isRunning={timer.isRunning} />
        <div style={styles.main}>
          <Nav
            tabs={tabs}
            activeTab={activeTab}
            onTabClick={setActiveTab}
            onAddTab={handleAddTab}
            onDeleteTab={handleDeleteTab}
            streak={streak}
          />
          <div style={styles.home}>
            <TitleArea onAtomize={handleAtomize} category={category} setCategory={setCategory} />
            <div style={styles.panels}>
              <Roadmap nodes={state.nodes} activeNode={state.activeNode} onCompleteSubtask={handleCompleteSubtask} />
              <Scoreboard xp={state.xp} streak={streak} timer={timer} totalNodes={state.nodes.length} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
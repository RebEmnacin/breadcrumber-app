import { useState } from "react";
import { useApp } from "./context/AppContext";
import { useTimer } from "./hooks/useTimer";
import { useStreak } from "./hooks/useStreak";
import { atomizeProject } from "./hooks/useApi";

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
    color: "#aab",
    cursor: "pointer",
    borderRadius: "10px",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
  },
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  nav: { display: "flex", alignItems: "center", backgroundColor: "#0E131C", flexShrink: 0 },
  tab: (active) => ({
    backgroundColor: active ? "#2d3450" : "#1a1f35",
    padding: "10px 32px",
    borderRadius: "12px 12px 0 0",
    color: active ? "#fff" : "#778",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: active ? "600" : "400",
    userSelect: "none",
    border: "none",
    marginRight: "4px",
    fontFamily: "inherit",
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
    fontWeight: "bold",
    fontFamily: "inherit",
  },
  streakNavBadge: { marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px", paddingRight: "8px", paddingBottom: "4px" },
  streakBox: { display: "flex", flexDirection: "column", alignItems: "center", backgroundColor: "#1a1f35", borderRadius: "10px", padding: "4px 10px", minWidth: "48px" },
  streakLabel: { fontSize: "9px", color: "#aab", letterSpacing: "1px", textTransform: "uppercase" },
  streakNum: { fontSize: "18px", fontWeight: "bold", color: "#fff" },
  bellBtn: { background: "none", border: "none", color: "#aab", fontSize: "18px", cursor: "pointer" },
  home: {
    backgroundColor: "#2d3450",
    flex: 1,
    borderRadius: "0 12px 12px 12px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  titleArea: { padding: "20px 28px 12px", flexShrink: 0, borderBottom: "1px solid #3a3f5a" },
  projectTitle: { fontSize: "22px", fontWeight: "bold", color: "#ffbf6e", border: "none", outline: "none", background: "transparent", fontFamily: "inherit", width: "100%", marginBottom: "4px" },
  projectDesc: { fontSize: "13px", color: "#aab", border: "none", outline: "none", background: "transparent", fontFamily: "inherit", width: "100%", marginBottom: "10px" },
  tag: { backgroundColor: "#3a4060", padding: "2px 14px", borderRadius: "20px", color: "#aab", fontSize: "12px", display: "inline-block", marginBottom: "8px" },
  atomizeRow: { display: "flex", gap: "8px", marginTop: "8px" },
  atomizeInput: { flex: 1, padding: "7px 12px", borderRadius: "8px", border: "none", background: "#1a1f35", color: "#fff", fontFamily: "inherit", fontSize: "13px" },
  atomizeBtn: { padding: "7px 18px", borderRadius: "8px", border: "none", background: "#ffbf6e", color: "#0E131C", fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", fontSize: "13px" },
  panels: { display: "flex", gap: "12px", flex: 1, padding: "12px 16px 16px", minHeight: 0 },
  roadmapPanel: { flex: "0 0 58%", backgroundColor: "#1e2235", borderRadius: "20px", padding: "20px 20px", overflowY: "auto" },
  roadmapTitle: { fontSize: "12px", color: "#aab", marginBottom: "20px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" },
  scorePanel: { flex: 1, backgroundColor: "#1e2235", borderRadius: "20px", padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", overflowY: "auto" },
  mascotWrap: { fontSize: "72px", marginBottom: "8px", lineHeight: 1 },
  streakMsg: { fontSize: "15px", fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: "2px" },
  streakSub: { fontSize: "12px", color: "#aab", textAlign: "center", marginBottom: "14px" },
  xpBarWrap: { width: "100%", backgroundColor: "#2d3450", borderRadius: "20px", height: "10px", overflow: "hidden", marginBottom: "4px" },
  xpBarFill: (pct) => ({ width: `${Math.min(pct, 100)}%`, height: "100%", backgroundColor: "#4caf7d", borderRadius: "20px", transition: "width 0.4s ease" }),
  xpPts: { fontSize: "12px", color: "#7effd4", alignSelf: "flex-end", marginBottom: "14px" },
  divider: { width: "100%", height: "1px", backgroundColor: "#3a4060", marginBottom: "12px" },
  timerLabel: { fontSize: "10px", color: "#778", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "2px" },
  timerDisplay: { fontSize: "28px", fontWeight: "bold", color: "#ffbf6e", letterSpacing: "3px", marginBottom: "10px" },
  timerBtns: { display: "flex", gap: "6px" },
  timerBtn: (bg, fg, disabled) => ({
    padding: "5px 12px", borderRadius: "8px", border: "none",
    background: disabled ? "#2a2f45" : bg, color: disabled ? "#556" : fg,
    fontWeight: "bold", cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit", fontSize: "12px",
  }),
};

// ── row height must match rendered subtask row ────────────────────────────────
const ROW_H = 36;

function HoverBtn({ style, onClick, children, title }) {
  const [h, setH] = useState(false);
  return (
    <button style={{ ...style, opacity: h ? 1 : 0.75 }} onClick={onClick} title={title}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      {children}
    </button>
  );
}

// ── Phase Block ───────────────────────────────────────────────────────────────

function PhaseBlock({ node, isPhaseActive, onCompleteSubtask }) {
  const isPhaseCompleted = node.is_completed;
  const subtasks = node.subtasks || [];
  const doneSubs = subtasks.filter((s) => s.is_completed).length;
  const totalSubs = subtasks.length;

  // Total SVG height
  const svgH = totalSubs * ROW_H;

  // Smooth progress: line grows from top to the CENTER of each completed circle
  // Each subtask circle center is at i * ROW_H + ROW_H/2
  // Progress stops at the center of the last completed subtask
  const progressY = doneSubs === 0
    ? 0
    : (doneSubs - 1) * ROW_H + ROW_H / 2;

  return (
    <div style={{ marginBottom: "24px" }}>
      {/* Parent row */}
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

      {/* Tree: SVG lines + subtask rows side by side */}
      {subtasks.length > 0 && (
        <div style={{ display: "flex", alignItems: "flex-start", marginLeft: "11px" }}>

          {/* SVG for the animated tree lines */}
          <svg width="28" height={svgH} style={{ flexShrink: 0 }}>
            {/* Grey background vertical line */}
            <line x1="1" y1="0" x2="1" y2={svgH} stroke="#2a2f45" strokeWidth="2" />

            {/* White animated progress line — grows smoothly from top */}
            <line
              x1="1" y1="0"
              x2="1" y2={progressY}
              stroke="#ffffff"
              strokeWidth="2"
              style={{ transition: "y2 0.6s cubic-bezier(0.4,0,0.2,1)" }}
            />

            {/* Horizontal branch lines for each subtask */}
            {subtasks.map((sub, i) => {
              const cy = i * ROW_H + ROW_H / 2;
              const isDone = sub.is_completed;
              const prevDone = i === 0 || subtasks[i - 1].is_completed;
              const isNextUp = !isDone && prevDone && isPhaseActive;
              return (
                <line
                  key={sub.subtask_id}
                  x1="1" y1={cy} x2="22" y2={cy}
                  stroke={isDone ? "#ffffff" : isNextUp ? "#ffffff66" : "#2a2f45"}
                  strokeWidth="2"
                  style={{ transition: "stroke 0.4s" }}
                />
              );
            })}
          </svg>

          {/* Subtask rows — text RIGHT beside the circles */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {subtasks.map((sub, i) => {
              const prevDone = i === 0 || subtasks[i - 1].is_completed;
              const isNextUp = !sub.is_completed && prevDone && isPhaseActive;
              const isLocked = !sub.is_completed && !isNextUp;

              return (
                <div
                  key={sub.subtask_id}
                  style={{
                    height: `${ROW_H}px`,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: isNextUp ? "pointer" : "default",
                    opacity: isLocked ? 0.35 : 1,
                    transition: "opacity 0.3s",
                    paddingLeft: "4px",
                  }}
                  onClick={() => isNextUp && onCompleteSubtask(node.node_id, sub.subtask_id)}
                  title={isLocked ? "Complete the previous task first!" : isNextUp ? "Click to complete!" : ""}
                >
                  {/* Subtask circle */}
                  <div style={{
                    width: "14px", height: "14px", borderRadius: "50%",
                    border: `2px solid ${sub.is_completed ? "#4caf7d" : isNextUp ? "#fff" : "#3a4060"}`,
                    backgroundColor: sub.is_completed ? "#4caf7d" : "transparent",
                    flexShrink: 0,
                    transition: "all 0.3s",
                    boxShadow: isNextUp ? "0 0 6px #ffffff99" : "none",
                  }} />

                  {/* Text RIGHT beside the circle */}
                  <span style={{
                    fontSize: "13px",
                    color: sub.is_completed ? "#4caf7d" : isNextUp ? "#fff" : "#778",
                    textDecoration: sub.is_completed ? "line-through" : "none",
                    transition: "color 0.3s",
                    whiteSpace: "nowrap",
                  }}>
                    {sub.title}
                  </span>

                  {/* Next up badge */}
                  {isNextUp && (
                    <span style={{
                      fontSize: "10px", color: "#ffbf6e",
                      backgroundColor: "#2a2f45",
                      padding: "2px 8px", borderRadius: "10px",
                      marginLeft: "6px", whiteSpace: "nowrap",
                    }}>
                      next up ▶
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
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

// ── Scoreboard ────────────────────────────────────────────────────────────────

function Scoreboard({ xp, streak, seconds, isRunning, start, pause, reset, formatTime, totalNodes }) {
  const maxXp = (totalNodes || 5) * 150;
  const pct = (xp / maxXp) * 100;
  const mascot = streak >= 7 ? "🦁" : streak >= 3 ? "🐯" : streak >= 1 ? "🐱" : "🐣";
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
      <div style={styles.divider} />
      <div style={styles.timerLabel}>Flowtime Timer</div>
      <div style={styles.timerDisplay}>{formatTime(seconds)}</div>
      <div style={styles.timerBtns}>
        <button style={styles.timerBtn("#7effd4", "#0E131C", isRunning)} onClick={start} disabled={isRunning}>▶ Start</button>
        <button style={styles.timerBtn("#ffbf6e", "#0E131C", !isRunning)} onClick={pause} disabled={!isRunning}>⏸ Pause</button>
        <button style={styles.timerBtn("#3a4060", "#fff", false)} onClick={reset}>↺ Reset</button>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ onTimerToggle }) {
  return (
    <div style={styles.sidebar}>
      <HoverBtn style={styles.sidebarBtn} onClick={onTimerToggle} title="Timer">⏱</HoverBtn>
      <HoverBtn style={styles.sidebarBtn} title="Camera">📷</HoverBtn>
      <HoverBtn style={styles.sidebarBtn} title="Dark Mode">🌙</HoverBtn>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav({ tabs, activeTab, onTabClick, onAddTab, streak }) {
  return (
    <div style={styles.nav}>
      {tabs.map((tab, i) => (
        <button key={i} style={styles.tab(activeTab === i)} onClick={() => onTabClick(i)}>{tab}</button>
      ))}
      <button style={styles.addTabBtn} onClick={onAddTab}>+</button>
      <div style={styles.streakNavBadge}>
        <div style={styles.streakBox}>
          <span style={styles.streakLabel}>STREAK</span>
          <span style={styles.streakNum}>{streak}</span>
        </div>
        <button style={styles.bellBtn}>🔔</button>
      </div>
    </div>
  );
}

// ── Title Area ────────────────────────────────────────────────────────────────

function TitleArea({ onAtomize }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");

  return (
    <div style={styles.titleArea}>
      <style>{`::placeholder{color:#445;}`}</style>
      <input style={styles.projectTitle} placeholder="Project title..." value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
      <input style={styles.projectDesc} placeholder="Project description..." value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={200} />
      <span style={styles.tag}>{category || "tag"}</span>
      <div style={styles.atomizeRow}>
        <input style={styles.atomizeInput} placeholder="Category (e.g. Art, Coding...)" value={category} onChange={(e) => setCategory(e.target.value)} />
        <button style={styles.atomizeBtn} onClick={() => title.trim() && onAtomize(title, category)}>✨ Atomize!</button>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function Breadcrumber() {
  const [tabs, setTabs] = useState(["Project 1", "Project 2", "Project 3"]);
  const [activeTab, setActiveTab] = useState(0);
  const { state, dispatch } = useApp();
  const { seconds, isRunning, start, pause, reset, formatTime } = useTimer();
  const { streak, updateStreak } = useStreak();

  const handleCompleteSubtask = (nodeId, subtaskId) => {
    dispatch({ type: "COMPLETE_SUBTASK", payload: { nodeId, subtaskId } });
    updateStreak();
  };

  const handleAtomize = async (projectName, category) => {
    try {
      const data = await atomizeProject(projectName, category);
      dispatch({ type: "SET_NODES", payload: data.nodes });
    } catch (err) {
      console.error("Atomize failed — is John's backend running?", err);
    }
  };

  const handleAddTab = () => {
    const newTab = `Project ${tabs.length + 1}`;
    setTabs([...tabs, newTab]);
    setActiveTab(tabs.length);
  };

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      <div style={styles.body}>
        <div style={styles.containerGrid}>
          <Sidebar onTimerToggle={() => (isRunning ? pause() : start())} />
          <div style={styles.main}>
            <Nav tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} onAddTab={handleAddTab} streak={streak} />
            <div style={styles.home}>
              <TitleArea onAtomize={handleAtomize} />
              <div style={styles.panels}>
                <Roadmap nodes={state.nodes} activeNode={state.activeNode} onCompleteSubtask={handleCompleteSubtask} />
                <Scoreboard xp={state.xp} streak={streak} seconds={seconds} isRunning={isRunning} start={start} pause={pause} reset={reset} formatTime={formatTime} totalNodes={state.nodes.length} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
import { useState } from "react";
import { useApp } from "./context/AppContext";
import { useTimer } from "./hooks/useTimer";
import { useStreak } from "./hooks/useStreak";
import { atomizeProject } from "./hooks/useApi";

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  body: {
    padding: "10px",
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    height: "100vh",
    width: "100%",
    margin: 0,
    boxSizing: "border-box",
    overflow: "hidden",
  },
  containerGrid: {
    display: "flex",
    gap: "20px",
    padding: "20px",
    height: "100%",
    boxSizing: "border-box",
  },
  sidebar: {
    backgroundColor: "#242940",
    width: "60px",
    minWidth: "60px",
    padding: "16px 10px",
    borderRadius: "40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    flexShrink: 0,
  },
  sidebarButton: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    borderRadius: "8px",
    fontSize: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    transition: "background 0.15s",
  },
  home: {
    backgroundColor: "#47536D",
    flex: 1,
    borderRadius: "10px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  navtab: {
    backgroundColor: "#0E131C",
    display: "flex",
    gap: "10px",
    padding: "0",
    alignItems: "flex-end",
    flexShrink: 0,
  },
  tab: (active) => ({
    backgroundColor: active ? "#47536D" : "#66748B",
    display: "flex",
    padding: "10px 50px",
    borderRadius: "10px 10px 0 0",
    color: "#fff",
    cursor: "pointer",
    textDecoration: "none",
    transition: "background 0.15s",
    userSelect: "none",
  }),
  navButtons: {
    marginLeft: "auto",
    display: "flex",
    gap: "4px",
    alignItems: "center",
    paddingRight: "12px",
    paddingBottom: "6px",
  },
  navBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontSize: "20px",
    borderRadius: "8px",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },
  content: {
    padding: "40px 50px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
  },
  titlecard: {
    paddingBottom: "20px",
    flexShrink: 0,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },
  tagsRow: {
    display: "flex",
    gap: "4px",
    flexShrink: 0,
  },
  tag: {
    backgroundColor: "#66748B",
    padding: "2px 20px",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "14px",
    display: "inline-block",
    whiteSpace: "nowrap",
  },
  titleInput: {
    border: "none",
    outline: "none",
    padding: "8px 4px",
    fontSize: "24px",
    background: "transparent",
    fontWeight: "bold",
    color: "#ffbf6e",
    fontFamily: "inherit",
    flex: 1,
    minWidth: 0,
  },
  descriptionInput: {
    border: "none",
    outline: "none",
    padding: "8px 4px",
    fontSize: "16px",
    background: "transparent",
    color: "#ececec",
    width: "100%",
    fontFamily: "inherit",
    display: "block",
    marginTop: "4px",
    boxSizing: "border-box",
  },
  tasks: {
    display: "flex",
    gap: "10px",
    flex: 1,
    minHeight: 0,
  },
  steps: {
    width: "60%",
    backgroundColor: "#242940",
    borderRadius: "30px",
    padding: "20px",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  scoreboard: {
    width: "40%",
    backgroundColor: "#242940",
    borderRadius: "30px",
    padding: "20px",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  p: {
    margin: "5px 0",
    color: "#fff",
  },
  atomizeRow: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
    flexWrap: "wrap",
  },
  atomizeInput: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    background: "#1a1f2e",
    color: "#fff",
    fontFamily: "inherit",
    fontSize: "14px",
    minWidth: "100px",
  },
  atomizeBtn: {
    padding: "8px 18px",
    borderRadius: "8px",
    border: "none",
    background: "#ffbf6e",
    color: "#0E131C",
    fontWeight: "bold",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "14px",
  },
  nodeItem: (isActive, isCompleted) => ({
    padding: "10px 14px",
    borderRadius: "12px",
    marginBottom: "8px",
    backgroundColor: isCompleted ? "#3a5a45" : isActive ? "#47536D" : "#1a1f2e",
    color: isCompleted ? "#7effd4" : isActive ? "#fff" : "#66748B",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: isActive ? "pointer" : "default",
    border: isActive ? "1px solid #ffbf6e" : "1px solid transparent",
    transition: "all 0.2s",
  }),
  timerDisplay: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#ffbf6e",
    margin: "8px 0",
  },
  timerRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
  },
  timerBtn: {
    padding: "6px 14px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: "bold",
    fontSize: "13px",
  },
  streakRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#ffbf6e",
    fontWeight: "bold",
    fontSize: "15px",
    marginBottom: "8px",
  },
  xpRow: {
    color: "#7effd4",
    fontSize: "14px",
    marginBottom: "12px",
  },
};

// ── Reusable hover button ─────────────────────────────────────────────────────

function HoverButton({ style, title, icon, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      style={{ ...style, background: hovered ? "#3a4060" : "none" }}
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <i className={icon} />
    </button>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Sidebar({ onDarkMode, onTimerToggle }) {
  return (
    <div style={styles.sidebar}>
      {/* fa-stopwatch avoids the alarm-clock rendering issue with fa-clock */}
      <HoverButton style={styles.sidebarButton} title="Timer" icon="fa-regular fa-clock" />
      <HoverButton style={styles.sidebarButton} title="Camera" icon="fa-solid fa-camera" />
      <HoverButton style={styles.sidebarButton} title="Dark Mode" icon="fa-solid fa-moon" onClick={onDarkMode} />
    </div>
  );
}

function NavTab({ tabs, activeTab, onTabClick, streak }) {
  return (
    <div style={styles.navtab}>
      {tabs.map((tab, i) => (
        <a key={i} style={styles.tab(activeTab === i)} onClick={() => onTabClick(i)}>
          {tab}
        </a>
      ))}
      <div style={styles.navButtons}>
        <HoverButton style={styles.navBtn} title={`🔥 Streak: ${streak} days`} icon="fa-solid fa-fire" />
        <HoverButton style={styles.navBtn} title="Notifications" icon="fa-solid fa-bell" />
      </div>
    </div>
  );
}

function TitleCard({ onAtomize }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");

  return (
    <div style={styles.titlecard}>
      <div style={styles.titleRow}>
        <div style={styles.tagsRow}>
          <span style={styles.tag}>{category || "tag"}</span>
        </div>
        <input
          type="text"
          style={styles.titleInput}
          maxLength={60}
          placeholder="Enter title here..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <style>{`::placeholder { color: #717887; }`}</style>
      </div>
      <input
        type="text"
        style={styles.descriptionInput}
        maxLength={250}
        placeholder="Enter description here..."
      />
      <div style={styles.atomizeRow}>
        <input
          type="text"
          style={styles.atomizeInput}
          placeholder="Category (e.g. Art, Coding...)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <button
          style={styles.atomizeBtn}
          onClick={() => title.trim() && onAtomize(title, category)}
        >
          ✨ Atomize!
        </button>
      </div>
    </div>
  );
}

function Steps({ nodes, activeNode, onCompleteNode }) {
  return (
    <div style={styles.steps}>
      <p style={{ ...styles.p, fontWeight: "bold", marginBottom: "12px" }}>🗺️ Roadmap</p>
      {nodes.length === 0 ? (
        <p style={{ ...styles.p, color: "#66748B" }}>
          Enter a project above and hit ✨ Atomize!
        </p>
      ) : (
        nodes.map((node) => {
          const isCompleted = node.is_completed;
          const isActive = node.node_id === activeNode && !isCompleted;
          return (
            <div
              key={node.node_id}
              style={styles.nodeItem(isActive, isCompleted)}
              onClick={() => isActive && onCompleteNode(node.node_id)}
            >
              <span>{isCompleted ? "✅" : isActive ? "▶️" : "🔒"}</span>
              <span>{node.title}</span>
              {isActive && (
                <span style={{ marginLeft: "auto", fontSize: "11px", color: "#ffbf6e" }}>
                  tap to complete
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function Scoreboard({ xp, streak, seconds, isRunning, start, pause, reset, formatTime }) {
  return (
    <div style={styles.scoreboard}>
      <p style={{ ...styles.p, fontWeight: "bold", marginBottom: "12px" }}>🏆 Scoreboard</p>
      <div style={styles.streakRow}>🔥 {streak} day streak</div>
      <div style={styles.xpRow}>⭐ {xp} XP earned</div>
      <p style={{ ...styles.p, color: "#aaa", fontSize: "13px" }}>Flowtime Timer</p>
      <div style={styles.timerDisplay}>{formatTime(seconds)}</div>
      <div style={styles.timerRow}>
        <button
          style={{ ...styles.timerBtn, background: "#7effd4", color: "#0E131C" }}
          onClick={start}
          disabled={isRunning}
        >
          ▶ Start
        </button>
        <button
          style={{ ...styles.timerBtn, background: "#ffbf6e", color: "#0E131C" }}
          onClick={pause}
          disabled={!isRunning}
        >
          ⏸ Pause
        </button>
        <button
          style={{ ...styles.timerBtn, background: "#66748B", color: "#fff" }}
          onClick={reset}
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}

function Tasks({ state, dispatch, seconds, isRunning, start, pause, reset, formatTime, streak }) {
  const handleCompleteNode = (nodeId) => {
    dispatch({ type: "COMPLETE_NODE", payload: nodeId });
    reset();
  };

  return (
    <div style={styles.tasks}>
      <Steps nodes={state.nodes} activeNode={state.activeNode} onCompleteNode={handleCompleteNode} />
      <Scoreboard
        xp={state.xp}
        streak={streak}
        seconds={seconds}
        isRunning={isRunning}
        start={start}
        pause={pause}
        reset={reset}
        formatTime={formatTime}
      />
    </div>
  );
}

function Content({ state, dispatch, seconds, isRunning, start, pause, reset, formatTime, streak, onAtomize }) {
  return (
    <div style={styles.content}>
      <TitleCard onAtomize={onAtomize} />
      <Tasks
        state={state}
        dispatch={dispatch}
        seconds={seconds}
        isRunning={isRunning}
        start={start}
        pause={pause}
        reset={reset}
        formatTime={formatTime}
        streak={streak}
      />
    </div>
  );
}

// ── Root Component ────────────────────────────────────────────────────────────

export default function Breadcrumber() {
  const tabs = ["Project 1", "Project 2", "Project 3"];
  const [activeTab, setActiveTab] = useState(0);

  // ── M3 Hooks ──
  const { state, dispatch } = useApp();
  const { seconds, isRunning, start, pause, reset, formatTime } = useTimer();
  const { streak, updateStreak } = useStreak();

  const handleAtomize = async (projectName, category) => {
    try {
      const data = await atomizeProject(projectName, category);
      dispatch({ type: "SET_NODES", payload: data.nodes });
    } catch (err) {
      console.error("Atomize failed — is John's backend running?", err);
    }
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
      />
      <div style={styles.body}>
        <div style={styles.containerGrid}>
          <Sidebar
            onDarkMode={() => console.log("dark mode toggled")}
            onTimerToggle={() => (isRunning ? pause() : start())}
          />
          <div style={styles.home}>
            <NavTab
              tabs={tabs}
              activeTab={activeTab}
              onTabClick={setActiveTab}
              streak={streak}
            />
            <Content
              state={state}
              dispatch={dispatch}
              seconds={seconds}
              isRunning={isRunning}
              start={start}
              pause={pause}
              reset={reset}
              formatTime={formatTime}
              streak={streak}
              onAtomize={handleAtomize}
            />
          </div>
        </div>
      </div>
    </>
  );
}
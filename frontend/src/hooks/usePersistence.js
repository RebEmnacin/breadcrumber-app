import { useEffect } from "react";

export function usePersistence(state, dispatch) {
  // Load saved data on first render
  useEffect(() => {
    const saved = localStorage.getItem("appState");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.nodes) dispatch({ type: "SET_NODES", payload: parsed.nodes });
        if (parsed.activeNode !== undefined) dispatch({ type: "SET_ACTIVE_NODE", payload: parsed.activeNode });
        if (parsed.xp !== undefined) dispatch({ type: "SET_XP", payload: parsed.xp });
        if (parsed.completedNodes) dispatch({ type: "SET_COMPLETED_NODES", payload: parsed.completedNodes });
      } catch (e) {
        console.error("Failed to load saved state:", e);
      }
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("appState", JSON.stringify(state));
  }, [state]);
}
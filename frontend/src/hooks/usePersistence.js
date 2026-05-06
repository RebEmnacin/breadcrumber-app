import { useEffect } from "react";

export function usePersistence(state, dispatch) {
  // Load saved data on first render
  useEffect(() => {
    const savedNodes = localStorage.getItem("nodes");
    const savedActiveNode = localStorage.getItem("activeNode");
    const savedXP = localStorage.getItem("xp");
    const savedCompletedNodes = localStorage.getItem("completedNodes");

    if (savedNodes) {
      dispatch({ type: "SET_NODES", payload: JSON.parse(savedNodes) });
    }
    if (savedActiveNode) {
      dispatch({ type: "SET_ACTIVE_NODE", payload: Number(savedActiveNode) });
    }
    if (savedXP) {
      dispatch({ type: "SET_XP", payload: Number(savedXP) });
    }
    if (savedCompletedNodes) {
      dispatch({
        type: "SET_COMPLETED_NODES",
        payload: JSON.parse(savedCompletedNodes),
      });
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("nodes", JSON.stringify(state.nodes));
    localStorage.setItem("activeNode", state.activeNode);
    localStorage.setItem("xp", state.xp);
    localStorage.setItem(
      "completedNodes",
      JSON.stringify(state.completedNodes)
    );
  }, [state]);
}
import { createContext, useContext, useReducer } from "react";
import { usePersistence } from "../hooks/usePersistence";

const initialState = {
  nodes: [],
  activeNode: 0,
  completedNodes: [],
  streak: 0,
  xp: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_NODES":
      return {
        ...state,
        nodes: action.payload,
        activeNode: 0,
        completedNodes: [],
        xp: 0,
      };

    case "SET_ACTIVE_NODE":
      return { ...state, activeNode: action.payload };

    case "SET_XP":
      return { ...state, xp: action.payload };

    case "SET_COMPLETED_NODES":
      return { ...state, completedNodes: action.payload };

    case "SET_STREAK":
      return { ...state, streak: action.payload };

    case "COMPLETE_NODE":
      return {
        ...state,
        completedNodes: [...state.completedNodes, action.payload],
        activeNode: action.payload + 1,
        xp: state.xp + 150,
        nodes: state.nodes.map((n) =>
          n.node_id === action.payload ? { ...n, is_completed: true } : n
        ),
      };

    // ── New: complete a single subtask ──
    case "COMPLETE_SUBTASK": {
      const { nodeId, subtaskId } = action.payload;
      const updatedNodes = state.nodes.map((node) => {
        if (node.node_id !== nodeId) return node;
        const updatedSubtasks = node.subtasks.map((sub) =>
          sub.subtask_id === subtaskId ? { ...sub, is_completed: true } : sub
        );
        // If all subtasks done, complete the parent node too
        const allDone = updatedSubtasks.every((s) => s.is_completed);
        return {
          ...node,
          subtasks: updatedSubtasks,
          is_completed: allDone,
        };
      });

      // Check if parent node is now complete — if so, unlock next node
      const completedNode = updatedNodes.find((n) => n.node_id === nodeId);
      const parentJustCompleted = completedNode?.is_completed;
      const newActiveNode = parentJustCompleted ? state.activeNode + 1 : state.activeNode;
      const newXp = state.xp + 50 + (parentJustCompleted ? 100 : 0); // 50 per subtask + 100 bonus for completing phase

      return {
        ...state,
        nodes: updatedNodes,
        activeNode: newActiveNode,
        xp: newXp,
        completedNodes: parentJustCompleted
          ? [...state.completedNodes, nodeId]
          : state.completedNodes,
      };
    }

    default:
      return state;
  }
}

const AppContext = createContext();

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  usePersistence(state, dispatch);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
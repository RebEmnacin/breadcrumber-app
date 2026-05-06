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
      return { ...state, nodes: action.payload };
    case "SET_ACTIVE_NODE":
      return { ...state, activeNode: action.payload };
    case "SET_XP":
      return { ...state, xp: action.payload };
    case "SET_COMPLETED_NODES":
      return { ...state, completedNodes: action.payload };
    case "COMPLETE_NODE":
      return {
        ...state,
        completedNodes: [...state.completedNodes, action.payload],
        activeNode: action.payload + 1,
        xp: state.xp + 150,
      };
    case "SET_STREAK":
      return { ...state, streak: action.payload };
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
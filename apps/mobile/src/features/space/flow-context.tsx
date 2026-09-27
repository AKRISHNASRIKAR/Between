import { createContext, useContext } from "react";
import type { FlowState } from "./flow";

export const FlowContext = createContext<FlowState>("loading");
export const useFlowState = () => useContext(FlowContext);

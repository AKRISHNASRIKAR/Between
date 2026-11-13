import { AppState } from "react-native";
import { sessionCookie } from "./auth";
import { API_URL } from "./config";
import { RealtimeClient } from "./realtime-client";

export const realtime = new RealtimeClient({
  initialState: AppState.currentState,
  onStateChange: (listener) => {
    AppState.addEventListener("change", listener);
  },
  cookie: sessionCookie,
  socket: () => new WebSocket(`${API_URL.replace(/^http/, "ws")}/v1/realtime`),
});

import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * API base URL. In development, native devices reach the API on the Metro host's LAN IP;
 * web uses localhost. Override with EXPO_PUBLIC_API_URL.
 */
function devApiUrl() {
  if (Platform.OS === "web") return "http://localhost:3000";
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return `http://${host ?? "localhost"}:3000`;
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? devApiUrl();
export const APP_SCHEME = "lovenotes";

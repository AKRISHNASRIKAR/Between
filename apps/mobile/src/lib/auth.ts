import { expoClient } from "@better-auth/expo/client";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { Platform } from "react-native";
import { API_URL, APP_SCHEME } from "./config";
import { secureStorage } from "./secure-storage";

export const authClient = createAuthClient({
  baseURL: API_URL,
  basePath: "/v1/auth",
  fetchOptions: Platform.OS === "web" ? { credentials: "include" } : undefined,
  plugins: [expoClient({ scheme: APP_SCHEME, storagePrefix: "lovenotes", storage: secureStorage }), emailOTPClient()],
});

/** Session cookie header for our own API and the realtime socket (native). */
export async function sessionCookie(): Promise<string> {
  return Platform.OS === "web" ? "" : ((await authClient.getCookie()) ?? "");
}

/** Mock connections are a local-development tool, never a fallback against an arbitrary backend. */
export function allowsMockConnections(development: boolean, apiUrl: string) {
  if (!development) return false;
  try {
    const url = new URL(apiUrl);
    return (
      url.protocol === "http:" &&
      !url.username &&
      !url.password &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}
export const isMockEmail = (email: string | undefined) =>
  !!email && /^between-ui-[a-z]+-[a-f0-9-]+@dev\.local$/.test(email);
export type MockScenario = "empty" | "active" | "returning";

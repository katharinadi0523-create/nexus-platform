export const SESSION_COOKIE_NAME = "nexus_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const PUBLIC_PATH_PREFIXES = ["/login", "/api/auth"];

export function getSessionSecret(): string {
  return process.env.AUTH_SESSION_SECRET ?? "nexus-demo-session-secret";
}

export const SESSION_COOKIE_NAME = "nexus_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const PUBLIC_PATH_PREFIXES = ["/login", "/api/auth"];

/**
 * Login gate switch. Off by default: every page is open and the demo admin
 * account is used. Set AUTH_ENABLED=true to bring back the login page.
 */
export const AUTH_ENABLED = process.env.AUTH_ENABLED === "true";

/** Account used when the login gate is off. */
export const DEFAULT_USERNAME = "admin";

export function getSessionSecret(): string {
  return process.env.AUTH_SESSION_SECRET ?? "nexus-demo-session-secret";
}

const DEFAULT_POST_LOGIN_PATH = "/claw-hub-next";

/**
 * Only allow same-origin relative paths for post-login redirects.
 * Blocks open redirects like //evil.com or https://evil.com.
 */
export function getSafeRedirectPath(
  candidate: string | null | undefined,
  fallback: string = DEFAULT_POST_LOGIN_PATH
): string {
  if (!candidate) return fallback;

  const trimmed = candidate.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\")) return fallback;
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(trimmed)) return fallback;

  return trimmed;
}

export { DEFAULT_POST_LOGIN_PATH };

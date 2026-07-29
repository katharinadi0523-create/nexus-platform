import { createHmac, timingSafeEqual } from "crypto";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  getSessionSecret,
} from "@/lib/auth/constants";
import { findAuthUserByUsername } from "@/lib/auth/users";

export interface SessionUser {
  username: string;
  displayName: string;
  role?: string;
}

interface SessionPayload extends SessionUser {
  exp: number;
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

function encodeSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(body);
  return `${body}.${signature}`;
}

function decodeSession(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expectedSignature = signPayload(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as SessionPayload;

    if (!payload.username || !payload.displayName || !payload.exp) {
      return null;
    }

    if (payload.exp < Date.now()) {
      return null;
    }

    if (!findAuthUserByUsername(payload.username)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function createSessionToken(user: SessionUser): string {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };

  return encodeSession(payload);
}

export function parseSessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;

  const payload = decodeSession(token);
  if (!payload) return null;

  return {
    username: payload.username,
    displayName: payload.displayName,
    role: payload.role,
  };
}

export function isSecureRequest(request?: Request): boolean {
  if (process.env.AUTH_COOKIE_SECURE === "true") return true;
  if (process.env.AUTH_COOKIE_SECURE === "false") return false;
  if (!request) {
    return process.env.NODE_ENV === "production";
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim().toLowerCase() === "https";
  }

  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export function getSessionCookieOptions(request?: Request) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    // HTTP IP 访问时不能带 Secure，否则浏览器不存 cookie，登录后无法跳转
    secure: isSecureRequest(request),
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export { SESSION_COOKIE_NAME };

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

export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export { SESSION_COOKIE_NAME };

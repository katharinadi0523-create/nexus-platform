import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  AUTH_ENABLED,
  DEFAULT_USERNAME,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/constants";
import { parseSessionToken } from "@/lib/auth/session";
import { findAuthUserByUsername } from "@/lib/auth/users";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionToken(sessionToken);

  if (!session && !AUTH_ENABLED) {
    const user = findAuthUserByUsername(DEFAULT_USERNAME);
    if (user) {
      return NextResponse.json({
        user: { username: user.username, displayName: user.displayName, role: user.role },
      });
    }
  }

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: session });
}

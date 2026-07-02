import { NextResponse } from "next/server";
import { findAuthUser } from "@/lib/auth/users";
import {
  createSessionToken,
  getSessionCookieOptions,
} from "@/lib/auth/session";

interface LoginRequestBody {
  username?: string;
  password?: string;
}

export async function POST(request: Request) {
  let body: LoginRequestBody;

  try {
    body = (await request.json()) as LoginRequestBody;
  } catch {
    return NextResponse.json(
      { error: "请求格式无效" },
      { status: 400 }
    );
  }

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "请输入账号和密码" },
      { status: 400 }
    );
  }

  const user = findAuthUser(username, password);

  if (!user) {
    return NextResponse.json(
      { error: "账号或密码错误" },
      { status: 401 }
    );
  }

  const token = createSessionToken({
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  });

  const response = NextResponse.json({
    user: {
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    },
  });

  const cookieOptions = getSessionCookieOptions();
  response.cookies.set(cookieOptions.name, token, cookieOptions);

  return response;
}

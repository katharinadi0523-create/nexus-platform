"use client";

import { Suspense, useEffect, useState } from "react";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface AuthUserInfo {
  username: string;
  displayName: string;
  role?: string;
}

function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUserInfo | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) return;
        const data = (await response.json()) as { user: AuthUserInfo };
        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        // Ignore fetch errors in header.
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          title={user?.displayName ?? "用户"}
        >
          <User className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium text-gray-900">
            {user?.displayName ?? "当前用户"}
          </div>
          {user?.username ? (
            <div className="text-xs text-gray-500">{user.username}</div>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "退出中..." : "退出登录"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function GlobalHeaderUserMenu() {
  return (
    <Suspense
      fallback={
        <button
          className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 text-gray-700"
          title="用户"
        >
          <User className="h-4 w-4" />
        </button>
      }
    >
      <UserMenu />
    </Suspense>
  );
}

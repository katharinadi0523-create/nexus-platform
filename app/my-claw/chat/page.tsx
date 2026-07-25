"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ChatWorkspace } from "@/components/my-claw/chat/chat-workspace";

function MyClawChatPageInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  return <ChatWorkspace sessionId={sessionId} />;
}

export default function MyClawChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-sm text-[#5a6779]">
          加载会话…
        </div>
      }
    >
      <MyClawChatPageInner />
    </Suspense>
  );
}

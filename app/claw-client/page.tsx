"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ClawClientWorkbench } from "@/components/claw-client/claw-client-workbench";

function ClawClientPageInner() {
  const searchParams = useSearchParams();
  return (
    <ClawClientWorkbench
      tab={searchParams.get("tab")}
      sessionId={searchParams.get("sessionId")}
      messageId={searchParams.get("message")}
    />
  );
}

export default function ClawClientPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#f7f8fa] text-sm text-slate-500">
          加载 Clawflow…
        </div>
      }
    >
      <ClawClientPageInner />
    </Suspense>
  );
}

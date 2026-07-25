"use client";

import { Suspense } from "react";
import { MyClawAutomationWorkbench } from "@/components/my-claw/automation/automation-workbench";

export default function MyClawAutomationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-sm text-[#5a6779]">
          加载自动化任务…
        </div>
      }
    >
      <MyClawAutomationWorkbench />
    </Suspense>
  );
}

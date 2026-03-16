"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import CECClawPage from "../cec-claw/page";
import { ClawHubShell } from "@/components/claw-hub/claw-hub-shell";
import { CloudClawListView } from "@/components/claw-hub/cloud-claw-list-view";

export default function ClawHubPage() {
  const searchParams = useSearchParams();

  const activeTab = useMemo(() => {
    const current = searchParams.get("tab");
    return current === "mine" ? "mine" : "cloud";
  }, [searchParams]);

  return (
    <ClawHubShell activeTab={activeTab}>
      {activeTab === "mine" ? <CECClawPage /> : <CloudClawListView />}
    </ClawHubShell>
  );
}

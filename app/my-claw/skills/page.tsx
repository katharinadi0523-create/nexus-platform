import { Suspense } from "react";
import { MyClawSkillsHub } from "@/components/my-claw/skills/skills-hub";

export default function MyClawSkillsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-400">加载中…</div>}>
      <MyClawSkillsHub />
    </Suspense>
  );
}

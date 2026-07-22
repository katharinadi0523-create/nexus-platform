"use client";

import { useState } from "react";
import { GroupTreeSidebar } from "@/components/knowledge-base/GroupTreeSidebar";
import { KnowledgeBaseTable } from "@/components/knowledge-base/KnowledgeBaseTable";
import type { KnowledgeBaseGroup } from "@/components/knowledge-base/GroupTreeSidebar";

export default function KnowledgeBasePage() {
  const [selectedGroup, setSelectedGroup] = useState<KnowledgeBaseGroup | null>({
    id: "all",
    name: "全部群组",
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 bg-white">
      <div className="w-[260px] shrink-0 border-r border-slate-200">
        <GroupTreeSidebar
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
        />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <KnowledgeBaseTable selectedGroup={selectedGroup} />
      </div>
    </div>
  );
}

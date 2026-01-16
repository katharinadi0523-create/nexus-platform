"use client";

import { useState } from "react";
import { GroupTreeSidebar } from "@/components/knowledge-base/GroupTreeSidebar";
import { KnowledgeBaseTable } from "@/components/knowledge-base/KnowledgeBaseTable";
import type { KnowledgeBaseGroup } from "@/components/knowledge-base/GroupTreeSidebar";
import type { KnowledgeBase } from "@/components/knowledge-base/KnowledgeBaseTable";

export default function KnowledgeBasePage() {
  const [selectedGroup, setSelectedGroup] = useState<KnowledgeBaseGroup | null>(null);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left Sidebar */}
      <div className="w-[280px] bg-white rounded-lg border border-slate-200 flex-shrink-0">
        <GroupTreeSidebar
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
        />
      </div>

      {/* Right Main Content */}
      <div className="flex-1 bg-white rounded-lg border border-slate-200 overflow-hidden">
        <KnowledgeBaseTable selectedGroup={selectedGroup} />
      </div>
    </div>
  );
}

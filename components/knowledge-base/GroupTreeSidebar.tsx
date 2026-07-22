"use client";

import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  knowledgeBaseGroupsV2,
  type KnowledgeBaseGroupNode,
} from "@/lib/mock-knowledge-base-v2";

export type KnowledgeBaseGroup = KnowledgeBaseGroupNode;

interface GroupTreeSidebarProps {
  selectedGroup: KnowledgeBaseGroup | null;
  onSelectGroup: (group: KnowledgeBaseGroup) => void;
}

function GroupNode({
  group,
  level,
  selectedId,
  onSelect,
}: {
  group: KnowledgeBaseGroup;
  level: number;
  selectedId: string | null;
  onSelect: (group: KnowledgeBaseGroup) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = Boolean(group.children?.length);
  const isSelected = selectedId === group.id;

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(group)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded px-2 text-left text-sm text-slate-700 hover:bg-slate-50",
          isSelected && "bg-blue-50 font-medium text-blue-600"
        )}
        style={{ paddingLeft: 10 + level * 24 }}
      >
        {hasChildren ? (
          <span
            onClick={(event) => {
              event.stopPropagation();
              setExpanded((value) => !value);
            }}
            className="flex h-4 w-4 items-center justify-center text-slate-500"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
        ) : (
          <span className="h-4 w-4" />
        )}
        <Folder className="h-4 w-4 fill-amber-300 text-amber-500" />
        <span className="truncate">{group.name}</span>
      </button>
      {expanded &&
        group.children?.map((child) => (
          <GroupNode
            key={child.id}
            group={child}
            level={level + 1}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

export function GroupTreeSidebar({
  selectedGroup,
  onSelectGroup,
}: GroupTreeSidebarProps) {
  return (
    <div className="h-full bg-white">
      <div className="px-6 py-7">
        <h2 className="text-lg font-semibold text-slate-950">知识库群组</h2>
      </div>
      <div className="px-4">
        {knowledgeBaseGroupsV2.map((group) => (
          <GroupNode
            key={group.id}
            group={group}
            level={0}
            selectedId={selectedGroup?.id ?? "all"}
            onSelect={onSelectGroup}
          />
        ))}
      </div>
    </div>
  );
}

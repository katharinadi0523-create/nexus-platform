"use client";

import { useState } from "react";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KnowledgeBaseGroup } from "./GroupTreeSidebar";

interface TreeItemProps {
  group: KnowledgeBaseGroup;
  level: number;
  selectedGroupId: string | null;
  onSelect: (group: KnowledgeBaseGroup) => void;
}

export function TreeItem({ group, level, selectedGroupId, onSelect }: TreeItemProps) {
  const isSelected = selectedGroupId === group.id;
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = group.children && group.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    onSelect(group);
  };

  return (
    <div>
      <div
        onClick={handleSelect}
        className={cn(
          "flex items-center gap-2 py-2 pr-3 cursor-pointer hover:bg-slate-50 transition-colors rounded-md mx-2 my-0.5",
          isSelected && "bg-blue-50 text-blue-600"
        )}
        style={{ paddingLeft: `${12 + level * 20}px` }}
      >
        {/* Expand/Collapse Icon */}
        <button
          onClick={handleToggle}
          className={cn(
            "w-4 h-4 flex items-center justify-center flex-shrink-0",
            !hasChildren && "invisible"
          )}
        >
          <ChevronRight
            className={cn(
              "w-3 h-3 text-slate-400 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </button>

        {/* Folder Icon */}
        {isExpanded ? (
          <FolderOpen className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        )}

        {/* Group Name */}
        <span className="flex-1 text-sm font-medium truncate">{group.name}</span>

        {/* Count */}
        <span className="text-xs text-slate-400 flex-shrink-0">
          {group.count}
        </span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {group.children!.map((child) => (
            <TreeItem
              key={child.id}
              group={child}
              level={level + 1}
              selectedGroupId={selectedGroupId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

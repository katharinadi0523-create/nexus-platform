"use client";

import { TreeItem } from "./TreeItem";

export interface KnowledgeBaseGroup {
  id: string;
  name: string;
  count: number;
  children?: KnowledgeBaseGroup[];
}

interface GroupTreeSidebarProps {
  selectedGroup: KnowledgeBaseGroup | null;
  onSelectGroup: (group: KnowledgeBaseGroup) => void;
}

// Mock data with 3-4 levels of nesting
const mockGroups: KnowledgeBaseGroup[] = [
  {
    id: "all",
    name: "全部群组",
    count: 69,
    children: [
      {
        id: "test1",
        name: "测试群组1",
        count: 8,
        children: [
          {
            id: "test2",
            name: "测试群组2",
            count: 0,
            children: [
              {
                id: "test3",
                name: "测试群组3",
                count: 0,
                children: [
                  {
                    id: "anti-fl",
                    name: "反FL知识库",
                    count: 21,
                  },
                ],
              },
            ],
          },
          {
            id: "test2-2",
            name: "测试群组2",
            count: 8,
            children: [
              {
                id: "test2-1",
                name: "测试群组2-1",
                count: 3,
              },
            ],
          },
        ],
      },
      {
        id: "migration",
        name: "迁移知识库",
        count: 13,
      },
      {
        id: "tianjin",
        name: "天津纪委知识库",
        count: 10,
      },
      {
        id: "gf",
        name: "GF/工业-设备检修场景",
        count: 2,
      },
      {
        id: "intel",
        name: "开源情报写作",
        count: 5,
      },
      {
        id: "zhengzhou",
        name: "郑州服务大厅",
        count: 5,
      },
    ],
  },
];

export function GroupTreeSidebar({
  selectedGroup,
  onSelectGroup,
}: GroupTreeSidebarProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900">知识库群组</h2>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {mockGroups.map((group) => (
          <TreeItem
            key={group.id}
            group={group}
            level={0}
            selectedGroupId={selectedGroup?.id || null}
            onSelect={onSelectGroup}
          />
        ))}
      </div>
    </div>
  );
}

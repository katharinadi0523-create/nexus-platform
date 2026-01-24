"use client";

import {
  Sparkles,
  BookOpen,
  Bot,
  StopCircle,
  Table,
  Filter,
  Database,
  BarChart3,
  GitBranch,
  Eye,
  Code,
  Building2,
  Plug,
  MessageSquare,
  Network,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeItem {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

interface NodeCategory {
  id: string;
  label: string;
  items: NodeItem[];
}

const nodeCategories: NodeCategory[] = [
  {
    id: "foundation",
    label: "基础",
    items: [
      { id: "llm", label: "大模型", icon: Sparkles, color: "text-blue-600" },
      { id: "knowledge", label: "知识检索", icon: BookOpen, color: "text-purple-600" },
      { id: "agent", label: "智能体", icon: Bot, color: "text-blue-600" },
      { id: "end", label: "结束", icon: StopCircle, color: "text-red-600" },
    ],
  },
  {
    id: "ontology",
    label: "本体",
    items: [
      { id: "object-query", label: "对象查询", icon: Network, color: "text-slate-600" },
    ],
  },
  {
    id: "data",
    label: "数据",
    items: [
      { id: "table-select", label: "选表", icon: Table, color: "text-slate-600" },
      { id: "data-clarify", label: "数据澄清", icon: Filter, color: "text-slate-600" },
      { id: "data-query", label: "数据查询", icon: Database, color: "text-slate-600" },
      { id: "data-visualize", label: "数据可视化", icon: BarChart3, color: "text-slate-600" },
    ],
  },
  {
    id: "logic",
    label: "逻辑",
    items: [
      { id: "branch", label: "分支器", icon: GitBranch, color: "text-orange-600" },
      { id: "intent-recognize", label: "意图识别", icon: Eye, color: "text-blue-600" },
    ],
  },
  {
    id: "tools",
    label: "工具",
    items: [
      { id: "code", label: "代码", icon: Code, color: "text-orange-600" },
      { id: "mcp", label: "MCP", icon: Building2, color: "text-orange-600" },
      { id: "api", label: "API", icon: Plug, color: "text-green-600" },
    ],
  },
  {
    id: "message",
    label: "消息",
    items: [
      { id: "message", label: "消息", icon: MessageSquare, color: "text-yellow-600" },
    ],
  },
];

interface NodeLibraryMenuProps {
  onSelectNode: (nodeType: string, label: string) => void;
}

export function NodeLibraryMenu({ onSelectNode }: NodeLibraryMenuProps) {
  return (
    <div className="w-64 bg-white rounded-lg border border-slate-200 shadow-lg p-2 max-h-[600px] overflow-y-auto">
      {nodeCategories.map((category) => (
        <div key={category.id} className="mb-4 last:mb-0">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 py-1.5 mb-1">
            {category.label}
          </h3>
          <div className="space-y-0.5">
            {category.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectNode(item.id, item.label)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 transition-colors text-left group"
                >
                  <Icon className={cn("w-4 h-4", item.color)} />
                  <span className="text-sm text-slate-700 group-hover:text-slate-900">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

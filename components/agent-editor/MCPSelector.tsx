"use client";

import { useState } from "react";
import {
  Search,
  Globe,
  FileText,
  BarChart3,
  Languages,
  Building,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface MCP {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface MCPSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mcps: MCP[]) => void;
  selectedMCPs?: MCP[];
}

const presetMCPs: MCP[] = [
  {
    id: "mcp-1",
    name: "百度AI搜索",
    description: "通过百度AI搜索获取实时信息",
    icon: <Search className="w-5 h-5" />,
  },
  {
    id: "mcp-2",
    name: "智能写作",
    description: "提供智能写作辅助功能",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: "mcp-3",
    name: "图表可视化",
    description: "生成各种类型的图表和数据可视化",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    id: "mcp-4",
    name: "语言检测",
    description: "检测文本的语言类型",
    icon: <Languages className="w-5 h-5" />,
  },
  {
    id: "mcp-5",
    name: "企业基本信息查询",
    description: "查询企业的基本信息",
    icon: <Building className="w-5 h-5" />,
  },
  {
    id: "mcp-6",
    name: "企业风险查询",
    description: "查询企业的风险信息",
    icon: <AlertTriangle className="w-5 h-5" />,
  },
];

const myMCPs: MCP[] = [
  {
    id: "my-mcp-1",
    name: "自定义MCP",
    description: "用户自定义的MCP服务",
    icon: <Globe className="w-5 h-5" />,
  },
];

export function MCPSelector({
  open,
  onOpenChange,
  onSelect,
  selectedMCPs = [],
}: MCPSelectorProps) {
  const [activeTab, setActiveTab] = useState<"preset" | "my">("preset");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    selectedMCPs.map((m) => m.id)
  );

  const currentMCPs = activeTab === "preset" ? presetMCPs : myMCPs;

  const filteredMCPs = currentMCPs.filter((mcp) =>
    mcp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (mcpId: string) => {
    setSelectedIds((prev) =>
      prev.includes(mcpId)
        ? prev.filter((id) => id !== mcpId)
        : [...prev, mcpId]
    );
  };

  const handleConfirm = () => {
    const allMCPs = [...presetMCPs, ...myMCPs];
    const selected = allMCPs.filter((m) => selectedIds.includes(m.id));
    onSelect(selected);
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-left">选择MCP</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="搜索MCP名称"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as "preset" | "my");
              setSearchQuery("");
            }}
            className="w-full flex-1 flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preset">预置 MCP</TabsTrigger>
              <TabsTrigger value="my">我的 MCP</TabsTrigger>
            </TabsList>

            {/* MCP List */}
            <TabsContent
              value={activeTab}
              className="mt-4 flex-1 overflow-y-auto"
            >
              <div className="space-y-2">
                {filteredMCPs.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    暂无MCP
                  </div>
                ) : (
                  filteredMCPs.map((mcp) => {
                    const isSelected = selectedIds.includes(mcp.id);
                    return (
                      <button
                        key={mcp.id}
                        onClick={() => toggleSelection(mcp.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left",
                          isSelected
                            ? "border-blue-600 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 text-orange-600">
                          {mcp.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900">
                            {mcp.name}
                          </div>
                          <div className="text-sm text-slate-500 mt-0.5">
                            {mcp.description}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-slate-200">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              添加 ({selectedIds.length})
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

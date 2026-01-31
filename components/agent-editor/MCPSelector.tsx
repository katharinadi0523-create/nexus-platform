"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Globe,
  FileText,
  BarChart3,
  Languages,
  Building,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ontologyActionsData, type OntologyAction } from "@/lib/mock/mock-mcp-actions";

export interface MCP {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

// 扩展 MCP 接口以支持本体行动
export interface MCPWithAction extends MCP {
  actionId?: string; // 如果是本体行动，记录 actionId
  objectType?: string; // 所属对象类型
}

interface MCPSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mcps: MCP[]) => void;
  selectedMCPs?: MCP[];
}

// 本体行动选择状态
interface ActionSelectionState {
  [actionId: string]: boolean;
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
  const [activeTab, setActiveTab] = useState<"preset" | "my" | "ontology">("ontology");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    selectedMCPs.map((m) => m.id)
  );
  // 本体行动选择状态
  const [selectedActions, setSelectedActions] = useState<ActionSelectionState>({});
  // 展开的对象类型
  const [expandedObjectTypes, setExpandedObjectTypes] = useState<Set<string>>(
    new Set(["TransitEvent"]) // 默认展开第一个
  );

  const currentMCPs = activeTab === "preset" ? presetMCPs : myMCPs;

  const filteredMCPs = currentMCPs.filter((mcp) =>
    mcp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 过滤本体行动数据
  const filteredOntologyActions = useMemo(() => {
    if (!searchQuery) return ontologyActionsData;
    const query = searchQuery.toLowerCase();
    return ontologyActionsData
      .map((group) => ({
        ...group,
        actions: group.actions.filter(
          (action) =>
            action.name.toLowerCase().includes(query) ||
            action.description.toLowerCase().includes(query) ||
            group.objectTypeName.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.actions.length > 0);
  }, [searchQuery]);

  const toggleSelection = (mcpId: string) => {
    setSelectedIds((prev) =>
      prev.includes(mcpId)
        ? prev.filter((id) => id !== mcpId)
        : [...prev, mcpId]
    );
  };

  // 切换本体行动选择
  const toggleActionSelection = (actionId: string) => {
    setSelectedActions((prev) => ({
      ...prev,
      [actionId]: !prev[actionId],
    }));
  };

  // 切换对象类型展开/折叠
  const toggleObjectTypeExpanded = (objectType: string) => {
    setExpandedObjectTypes((prev) => {
      const next = new Set(prev);
      if (next.has(objectType)) {
        next.delete(objectType);
      } else {
        next.add(objectType);
      }
      return next;
    });
  };

  // 批量选择/取消选择对象类型下的所有行动
  const toggleObjectTypeActions = (objectType: string, actions: OntologyAction[]) => {
    const allSelected = actions.every((action) => selectedActions[action.id]);
    setSelectedActions((prev) => {
      const next = { ...prev };
      actions.forEach((action) => {
        next[action.id] = !allSelected;
      });
      return next;
    });
  };

  // 检查对象类型下的所有行动是否都被选中
  const isObjectTypeAllSelected = (actions: OntologyAction[]): boolean => {
    if (actions.length === 0) return false;
    return actions.every((action) => selectedActions[action.id]);
  };

  // 检查对象类型下的部分行动是否被选中
  const isObjectTypePartiallySelected = (actions: OntologyAction[]): boolean => {
    const selectedCount = actions.filter((action) => selectedActions[action.id]).length;
    return selectedCount > 0 && selectedCount < actions.length;
  };

  const handleConfirm = () => {
    if (activeTab === "ontology") {
      // 将选中的本体行动转换为 MCP 格式
      const selectedActionIds = Object.keys(selectedActions).filter(
        (id) => selectedActions[id]
      );
      const allActions = ontologyActionsData.flatMap((group) => group.actions);
      const selectedActionMCPs: MCP[] = allActions
        .filter((action) => selectedActionIds.includes(action.id))
        .map((action) => ({
          id: action.id,
          name: action.name,
          description: action.description,
          icon: <Package className="w-5 h-5 text-green-600" />,
        }));
      onSelect(selectedActionMCPs);
    } else {
      const allMCPs = [...presetMCPs, ...myMCPs];
      const selected = allMCPs.filter((m) => selectedIds.includes(m.id));
      onSelect(selected);
    }
    onOpenChange(false);
    setSearchQuery("");
  };

  // 计算总选中数量
  const totalSelectedCount = useMemo(() => {
    if (activeTab === "ontology") {
      return Object.values(selectedActions).filter(Boolean).length;
    }
    return selectedIds.length;
  }, [activeTab, selectedActions, selectedIds]);

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
              placeholder={
                activeTab === "ontology"
                  ? "搜索对象类型或行动名称"
                  : "搜索MCP名称"
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as "preset" | "my" | "ontology");
              setSearchQuery("");
            }}
            className="w-full flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid w-full grid-cols-3 shrink-0">
              <TabsTrigger value="preset">预置组件</TabsTrigger>
              <TabsTrigger value="my">我的组件</TabsTrigger>
              <TabsTrigger value="ontology">本体·行动</TabsTrigger>
            </TabsList>

            {/* MCP List - Preset & Custom */}
            <TabsContent
              value={activeTab}
              className="mt-4 flex-1 overflow-y-auto min-h-0"
            >
              {activeTab !== "ontology" && (
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
                          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0 text-green-600">
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
              )}

              {/* Ontology Actions Tab Content */}
              {activeTab === "ontology" && (
                <div className="space-y-2">
                  {filteredOntologyActions.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      暂无本体行动
                    </div>
                  ) : (
                    filteredOntologyActions.map((group) => {
                      const isExpanded = expandedObjectTypes.has(group.objectType);
                      const isAllSelected = isObjectTypeAllSelected(group.actions);
                      const isPartiallySelected = isObjectTypePartiallySelected(group.actions);

                      return (
                        <div
                          key={group.objectType}
                          className="border border-slate-200 rounded-lg overflow-hidden"
                        >
                          {/* Header - Collapsible */}
                          <div className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                            <div className="relative">
                              <Checkbox
                                checked={isAllSelected}
                                onCheckedChange={() =>
                                  toggleObjectTypeActions(group.objectType, group.actions)
                                }
                              />
                              {/* 部分选中状态的视觉指示器 */}
                              {isPartiallySelected && !isAllSelected && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-2 h-0.5 bg-blue-600 rounded" />
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleObjectTypeExpanded(group.objectType)}
                              className="flex-1 flex items-center gap-3 text-left"
                            >
                              <Package className="w-5 h-5 text-green-600 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-900">
                                  {group.objectTypeName}
                                </div>
                                <div className="text-sm text-slate-500 mt-0.5">
                                  {group.description}
                                </div>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                              )}
                            </button>
                          </div>

                          {/* Content - Actions List */}
                          {isExpanded && (
                            <div className="border-t border-slate-200 bg-slate-50">
                              <div className="p-3 space-y-2">
                                {group.actions.map((action) => {
                                  const isActionSelected = selectedActions[action.id] || false;
                                  return (
                                    <div
                                      key={action.id}
                                      className="flex items-start gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors"
                                    >
                                      <Checkbox
                                        id={action.id}
                                        checked={isActionSelected}
                                        onCheckedChange={() =>
                                          toggleActionSelection(action.id)
                                        }
                                        className="mt-0.5"
                                      />
                                      <Label
                                        htmlFor={action.id}
                                        className="flex-1 cursor-pointer"
                                      >
                                        <div className="font-medium text-slate-900">
                                          {action.name}
                                        </div>
                                        <div className="text-sm text-slate-500 mt-0.5">
                                          {action.description}
                                        </div>
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
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
              添加 ({totalSelectedCount})
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

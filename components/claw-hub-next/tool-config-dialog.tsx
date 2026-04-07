"use client";

import { useMemo, useState } from "react";
import { GitBranch, Package, Puzzle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type ToolConfigKind = "workflow" | "mcp" | "plugin";

export interface ToolConfigSelection {
  id: string;
  name: string;
  description: string;
  kind: ToolConfigKind;
}

interface ToolConfigOption extends ToolConfigSelection {
  badge: string;
  hint: string;
}

interface ToolConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selections: ToolConfigSelection[]) => void;
}

const TOOL_KIND_META: Record<
  ToolConfigKind,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    panelClassName: string;
    iconClassName: string;
  }
> = {
  workflow: {
    label: "工作流",
    icon: GitBranch,
    panelClassName: "border-emerald-200 bg-emerald-50/80",
    iconClassName: "border-emerald-200 bg-white text-emerald-700",
  },
  mcp: {
    label: "MCP",
    icon: Package,
    panelClassName: "border-cyan-200 bg-cyan-50/80",
    iconClassName: "border-cyan-200 bg-white text-cyan-700",
  },
  plugin: {
    label: "插件",
    icon: Puzzle,
    panelClassName: "border-amber-200 bg-amber-50/80",
    iconClassName: "border-amber-200 bg-white text-amber-700",
  },
};

const TOOL_CONFIG_OPTIONS: Record<ToolConfigKind, ToolConfigOption[]> = {
  workflow: [
    {
      id: "workflow-invoice-validation",
      name: "验票工作流",
      description: "完成 OCR 识别发票、票据信息结构化提取、系统核查与合规校验。",
      kind: "workflow",
      badge: "办公场景",
      hint: "适合差旅报销、票据审核等标准化办公流程。",
    },
    {
      id: "workflow-expense-submit",
      name: "差旅表单填写与提交工作流",
      description: "完成出行信息提取、字段映射、自动填充表单、ERP 写入与审批提交。",
      kind: "workflow",
      badge: "办公场景",
      hint: "适合固定字段映射和 ERP 回写类任务。",
    },
    {
      id: "workflow-intelligence-process-chain",
      name: "情报处理链路",
      description: "完成多源采集、去重过滤、敏感校验和结构化拆解。",
      kind: "workflow",
      badge: "情报场景",
      hint: "适合多源情报归集和结构化处理场景。",
    },
    {
      id: "workflow-graph-trace",
      name: "扩散检索 / 图谱溯源",
      description: "围绕重点动态做关联扩散、本体检索和图谱关系溯源。",
      kind: "workflow",
      badge: "情报场景",
      hint: "适合需要依据下钻和图谱追踪的分析任务。",
    },
    {
      id: "workflow-intelligence-briefing",
      name: "情报简报生成流程",
      description: "聚合多源线索，自动生成结构化情报简报并推送结果。",
      kind: "workflow",
      badge: "已发布",
      hint: "适合研判结论沉淀与固定产出。",
    },
    {
      id: "workflow-incident-escalation",
      name: "故障升级处置流程",
      description: "根据告警等级自动关联工单、通知值守人并拉起处置分支。",
      kind: "workflow",
      badge: "运维场景",
      hint: "适合需要联动多个执行节点的任务。",
    },
    {
      id: "workflow-contract-review",
      name: "合同审阅流程",
      description: "串联条款识别、风险判定和审批建议输出。",
      kind: "workflow",
      badge: "法务模版",
      hint: "适合高规则约束的业务审批场景。",
    },
  ],
  mcp: [
    {
      id: "mcp-policy-center",
      name: "制度中心 MCP",
      description: "按标准协议查询制度条款、版本记录和生效范围。",
      kind: "mcp",
      badge: "协议接入",
      hint: "适合需要标准化工具调用与结果透传的场景。",
    },
    {
      id: "mcp-mail-gateway",
      name: "邮件网关 MCP",
      description: "统一发送、抄送和归档业务邮件，支持会话上下文回填。",
      kind: "mcp",
      badge: "消息能力",
      hint: "适合外部系统能力已封装为 MCP Server 的情况。",
    },
    {
      id: "mcp-security-validation",
      name: "安全校验服务 MCP",
      description: "对敏感词、越权调用和高风险参数进行预校验。",
      kind: "mcp",
      badge: "风控",
      hint: "适合在执行前增加统一的安全防线。",
    },
  ],
  plugin: [
    {
      id: "plugin-document-parser",
      name: "文档解析插件",
      description: "解析 PDF、Word、图片文档并提取结构化字段。",
      kind: "plugin",
      badge: "OpenAPI",
      hint: "适合通过插件暴露成熟业务接口。",
    },
    {
      id: "plugin-map-navigation",
      name: "地图导航插件",
      description: "支持路径规划、位置检索和地理围栏判断。",
      kind: "plugin",
      badge: "外部服务",
      hint: "适合给 Claw 补充垂直领域能力。",
    },
    {
      id: "plugin-code-interpreter",
      name: "代码解释器插件",
      description: "执行受控脚本、处理表格数据并产出可下载结果。",
      kind: "plugin",
      badge: "执行工具",
      hint: "适合在对话中补充计算与文件处理能力。",
    },
  ],
};

export function ToolConfigDialog({ open, onOpenChange, onConfirm }: ToolConfigDialogProps) {
  const [activeTab, setActiveTab] = useState<ToolConfigKind>("workflow");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredOptions = useMemo(() => {
    const options = TOOL_CONFIG_OPTIONS[activeTab];
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((item) =>
      [item.name, item.description, item.badge, item.hint, TOOL_KIND_META[item.kind].label]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [activeTab, searchQuery]);

  const totalSelectedCount = selectedIds.length;

  function handleToggleSelection(id: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id];
      }

      return current.filter((item) => item !== id);
    });
  }

  function handleSubmit() {
    const allSelections = Object.values(TOOL_CONFIG_OPTIONS).flat();
    const selections = allSelections.filter((item) => selectedIds.includes(item.id));
    resetDialogState();
    onConfirm(selections);
  }

  function resetDialogState() {
    setActiveTab("workflow");
    setSearchQuery("");
    setSelectedIds([]);
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetDialogState();
    }

    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-[min(1240px,calc(100vw-32px))] max-w-none gap-0 overflow-hidden rounded-[32px] border-slate-200 p-0 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.35)]">
        <DialogHeader className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(240,249,255,0.94),rgba(255,255,255,0.98))] px-6 py-5">
          <DialogTitle className="text-left text-xl text-slate-950">配置工具</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value as ToolConfigKind);
                setSearchQuery("");
              }}
              className="w-full lg:w-auto"
            >
              <TabsList className="grid h-auto w-full grid-cols-3 rounded-[18px] bg-slate-100/90 p-1 lg:w-[360px]">
                {(Object.keys(TOOL_KIND_META) as ToolConfigKind[]).map((kind) => (
                  <TabsTrigger
                    key={kind}
                    value={kind}
                    className="rounded-[14px] px-3 py-2 text-sm font-medium data-[state=active]:shadow-sm"
                  >
                    {TOOL_KIND_META[kind].label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={`搜索${TOOL_KIND_META[activeTab].label}名称或说明`}
                className="h-11 rounded-[16px] border-slate-200 bg-white pl-9 shadow-none"
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white">
            <ScrollArea className="h-[460px]">
              <div className="space-y-3 p-4">
                {filteredOptions.length ? (
                  filteredOptions.map((item) => {
                    const meta = TOOL_KIND_META[item.kind];
                    const Icon = meta.icon;
                    const checked = selectedIds.includes(item.id);

                    return (
                      <label
                        key={item.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-4 rounded-[22px] border px-4 py-4 transition-all",
                          checked
                            ? meta.panelClassName
                            : "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.9))] hover:border-slate-300"
                        )}
                      >
                        <Checkbox checked={checked} onCheckedChange={(value) => handleToggleSelection(item.id, value === true)} />

                        <div
                          className={cn(
                            "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border",
                            meta.iconClassName
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-base font-semibold text-slate-950">{item.name}</div>
                            <Badge className="border-slate-200 bg-white text-slate-600">{item.badge}</Badge>
                            <Badge className="border-slate-200 bg-slate-100 text-slate-500">{meta.label}</Badge>
                          </div>
                          <div className="mt-2 text-sm leading-6 text-slate-600">{item.description}</div>
                          <div className="mt-3 text-xs text-slate-400">{item.hint}</div>
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-16 text-center">
                    <div className="text-sm font-medium text-slate-500">没有找到匹配的{TOOL_KIND_META[activeTab].label}</div>
                    <div className="mt-2 text-xs text-slate-400">可以换个关键词，或切换到其他 Tab 继续选择。</div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 bg-white px-6 py-4 sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">已选择 {totalSelectedCount} 项，确认后会追加到当前 Claw 的工具清单。</div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>
              取消
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={totalSelectedCount === 0}>
              确认添加 ({totalSelectedCount})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Layers,
  Package,
  Plus,
  Puzzle,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ToolConfigKind = "workflow" | "mcp" | "plugin" | "ontology_action";

export interface ToolConfigSelection {
  id: string;
  name: string;
  description: string;
  kind: ToolConfigKind;
}

interface ToolConfigOption extends ToolConfigSelection {
  badge: string;
  hint: string;
  updatedAtLabel: string;
}

type ToolConfigSeed = Omit<ToolConfigOption, "updatedAtLabel">;

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
    iconBoxClass: string;
    iconClass: string;
  }
> = {
  workflow: {
    label: "工作流",
    icon: GitBranch,
    iconBoxClass: "bg-emerald-100",
    iconClass: "text-emerald-700",
  },
  mcp: {
    label: "MCP",
    icon: Package,
    iconBoxClass: "bg-cyan-100",
    iconClass: "text-cyan-700",
  },
  plugin: {
    label: "OpenAPI",
    icon: Puzzle,
    iconBoxClass: "bg-amber-100",
    iconClass: "text-amber-700",
  },
  ontology_action: {
    label: "本体动作",
    icon: Layers,
    iconBoxClass: "bg-violet-100",
    iconClass: "text-violet-700",
  },
};

const TOOL_TAB_ORDER: ToolConfigKind[] = ["mcp", "plugin", "workflow", "ontology_action"];

const TOOL_TAB_LABELS: Record<ToolConfigKind, string> = {
  mcp: "MCP",
  plugin: "OpenAPI",
  workflow: "工作流",
  ontology_action: "本体动作",
};

const CREATE_TOOL_BUTTON_LABELS: Record<ToolConfigKind, string> = {
  mcp: "创建MCP服务",
  plugin: "创建 OpenAPI",
  workflow: "创建工作流",
  ontology_action: "创建本体动作",
};

const TOOL_CONFIG_OPTIONS_BY_KIND: Record<ToolConfigKind, ToolConfigSeed[]> = {
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
      hint: "适合需要标准化协议调用与结果透传的场景。",
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
      name: "文档解析 OpenAPI",
      description: "解析 PDF、Word、图片文档并提取结构化字段。",
      kind: "plugin",
      badge: "文档",
      hint: "适合通过 OpenAPI 暴露成熟业务接口。",
    },
    {
      id: "plugin-map-navigation",
      name: "地图导航 OpenAPI",
      description: "支持路径规划、位置检索和地理围栏判断。",
      kind: "plugin",
      badge: "外部服务",
      hint: "适合给 Claw 补充垂直领域能力。",
    },
    {
      id: "plugin-code-interpreter",
      name: "代码解释器 OpenAPI",
      description: "执行受控脚本、处理表格数据并产出可下载结果。",
      kind: "plugin",
      badge: "执行",
      hint: "适合在对话中补充计算与文件处理能力。",
    },
  ],
  ontology_action: [
    {
      id: "ontology-entity-upsert",
      name: "本体实体写入",
      description: "向企业本体写入或更新实体及其属性、关系边与来源依据。",
      kind: "ontology_action",
      badge: "本体",
      hint: "适合结构化业务对象落库与图谱对齐。",
    },
    {
      id: "ontology-relation-bind",
      name: "关系绑定动作",
      description: "在本体中建立、调整或解除实体间的业务关系与约束。",
      kind: "ontology_action",
      badge: "图谱",
      hint: "适合多对象协同与依赖建模场景。",
    },
    {
      id: "ontology-query-expand",
      name: "本体扩散查询",
      description: "基于种子实体按策略做关联扩散、过滤与结果裁剪。",
      kind: "ontology_action",
      badge: "检索",
      hint: "适合依据下钻与关联发现。",
    },
  ],
};

function formatToolUpdatedAtLabel(index: number): string {
  const d = 1 + (index % 28);
  const h = 9 + (index % 10);
  const m = (index * 7) % 60;
  return `更新时间: 2026-04-${String(d).padStart(2, "0")} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

const ALL_TOOL_OPTIONS: ToolConfigOption[] = Object.values(TOOL_CONFIG_OPTIONS_BY_KIND)
  .flat()
  .map((item, index) => ({
    ...item,
    updatedAtLabel: formatToolUpdatedAtLabel(index),
  }));

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 条/页" },
  { value: "20", label: "20 条/页" },
  { value: "50", label: "50 条/页" },
];

function getVisiblePageIndices(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const s = new Set<number>([1, total]);
  for (let p = current - 2; p <= current + 2; p++) {
    if (p >= 1 && p <= total) s.add(p);
  }
  return [...s].sort((a, b) => a - b);
}

function shouldEllipsisBefore(page: number, prev: number | undefined): boolean {
  return prev !== undefined && page - prev > 1;
}

export function ToolConfigDialog({ open, onOpenChange, onConfirm }: ToolConfigDialogProps) {
  const [activeKind, setActiveKind] = useState<ToolConfigKind>("mcp");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpInput, setJumpInput] = useState("");

  const filteredOptions = useMemo(() => {
    const inTab = ALL_TOOL_OPTIONS.filter((item) => item.kind === activeKind);
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return inTab;
    }
    return inTab.filter((item) => item.name.toLowerCase().includes(q));
  }, [searchQuery, activeKind]);

  const total = filteredOptions.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredOptions.slice(start, start + pageSize);
  }, [filteredOptions, safePage, pageSize]);

  const visiblePages = useMemo(() => getVisiblePageIndices(safePage, totalPages), [safePage, totalPages]);

  function handleToggleSelection(id: string, add: boolean) {
    setSelectedIds((current) => {
      if (add) {
        return current.includes(id) ? current : [...current, id];
      }
      return current.filter((item) => item !== id);
    });
  }

  function resetDialogState() {
    setActiveKind("mcp");
    setSearchQuery("");
    setSelectedIds([]);
    setCurrentPage(1);
    setPageSize(10);
    setJumpInput("");
  }

  function handleSubmit() {
    const selections = ALL_TOOL_OPTIONS.filter((item) => selectedIds.includes(item.id));
    resetDialogState();
    onConfirm(selections);
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetDialogState();
    }
    onOpenChange(nextOpen);
  }

  function applyJumpPage() {
    const n = Number.parseInt(jumpInput.trim(), 10);
    if (Number.isNaN(n) || n < 1) {
      toast.error("请输入有效页码。");
      return;
    }
    const target = Math.min(n, totalPages);
    setCurrentPage(target);
    setJumpInput(String(target));
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-[880px] gap-0 overflow-hidden rounded-lg border-[#eeeeee] p-0 shadow-lg sm:max-w-[880px]"
      >
        <DialogHeader className="border-b border-[#eeeeee] px-6 py-4 text-left">
          <DialogTitle className="text-base font-semibold text-slate-950">添加工具</DialogTitle>
        </DialogHeader>

        <div className="flex border-b border-[#eeeeee] px-6">
          {TOOL_TAB_ORDER.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => {
                setActiveKind(kind);
                setCurrentPage(1);
              }}
              className={cn(
                "flex-1 border-b-2 py-3 text-sm font-medium transition-colors",
                activeKind === kind
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {TOOL_TAB_LABELS[kind]}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-0">
          <div className="flex flex-col gap-3 border-b border-[#eeeeee] px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative min-w-0 flex-1 sm:max-w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="输入名称检索"
                className="h-9 border-slate-200 bg-white pl-9 shadow-none"
                aria-label="按名称检索"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 border-slate-200 shadow-none"
                aria-label="刷新列表"
                onClick={() => toast.success("列表已刷新。")}
              >
                <RefreshCw className="h-4 w-4 text-slate-600" />
              </Button>
              <Button
                type="button"
                className="h-9 gap-1 border-0 bg-blue-600 px-4 text-white shadow-none hover:bg-blue-700"
                onClick={() => toast.info(`${CREATE_TOOL_BUTTON_LABELS[activeKind]}入口即将接入。`)}
              >
                <Plus className="h-4 w-4" />
                {CREATE_TOOL_BUTTON_LABELS[activeKind]}
              </Button>
            </div>
          </div>

          <div className="max-h-[min(420px,50vh)] overflow-y-auto">
            {pageItems.length ? (
              <ul className="divide-y divide-[#eeeeee]">
                {pageItems.map((item) => {
                  const meta = TOOL_KIND_META[item.kind];
                  const Icon = meta.icon;
                  const selected = selectedIds.includes(item.id);
                  return (
                    <li key={item.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-1 gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded",
                            meta.iconBoxClass
                          )}
                        >
                          <Icon className={cn("h-5 w-5", meta.iconClass)} aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[15px] font-medium text-slate-900">{item.name}</span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{meta.label}</span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{item.badge}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{item.updatedAtLabel}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pl-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-slate-300 bg-white px-3 text-slate-800 shadow-none hover:bg-slate-50"
                          onClick={() =>
                            toast.message(item.name, { description: item.description || item.hint })
                          }
                        >
                          查看
                        </Button>
                        {selected ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 border-slate-300 bg-white px-3 text-slate-800 shadow-none hover:bg-slate-50"
                            onClick={() => handleToggleSelection(item.id, false)}
                          >
                            移除
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 border border-blue-600 px-3 text-blue-600 shadow-none hover:bg-blue-50"
                            onClick={() => handleToggleSelection(item.id, true)}
                          >
                            添加
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-6 py-16 text-center text-sm text-slate-400">暂无匹配项，请调整搜索条件。</div>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-[#eeeeee] px-6 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>共 {total} 条</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-slate-200 shadow-none"
                    disabled={safePage <= 1}
                    aria-label="上一页"
                    onClick={() => setCurrentPage((p) => Math.max(1, Math.min(p, totalPages) - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {visiblePages.map((page, idx) => (
                    <span key={page} className="flex items-center">
                      {shouldEllipsisBefore(page, visiblePages[idx - 1]) ? (
                        <span className="px-1 text-slate-400">…</span>
                      ) : null}
                      <button
                        type="button"
                        className={cn(
                          "min-w-8 rounded px-2.5 py-1 text-sm transition-colors",
                          safePage === page
                            ? "bg-blue-600 font-medium text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </span>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-slate-200 shadow-none"
                    disabled={safePage >= totalPages}
                    aria-label="下一页"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, Math.min(p, totalPages) + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setPageSize(Number(v))}
                  options={PAGE_SIZE_OPTIONS}
                  className="h-8 w-[108px] border-slate-200 text-sm"
                />
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap text-slate-600">前往</span>
                  <Input
                    value={jumpInput}
                    onChange={(e) => setJumpInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyJumpPage()}
                    className="h-8 w-14 border-slate-200 px-2 text-center text-sm shadow-none"
                    inputMode="numeric"
                  />
                  <span className="whitespace-nowrap text-slate-600">页</span>
                  <Button type="button" variant="outline" size="sm" className="h-8 border-slate-200 shadow-none" onClick={applyJumpPage}>
                    确定
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button type="button" variant="ghost" className="text-slate-600" onClick={() => handleDialogOpenChange(false)}>
                  取消
                </Button>
                <Button
                  type="button"
                  className="bg-blue-600 text-white shadow-none hover:bg-blue-700 disabled:opacity-40"
                  disabled={!selectedIds.length}
                  onClick={handleSubmit}
                >
                  添加到 Claw配置
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

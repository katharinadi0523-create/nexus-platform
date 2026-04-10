"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Eye, Folder, Info, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
  SecurityManagementConfig,
  ToolProtectionRuleItem,
  ToolProtectionSeverity,
} from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";
import { AUTONOMY_BOUNDARY_LEVELS, type SecurityPanelKey } from "./constants";

const TOOL_RULE_FORM_DEFAULT = {
  ruleId: "TOOL_CMD_CUSTOM_RULE",
  targetTool: "",
  targetParam: "",
  severity: "HIGH" as ToolProtectionSeverity,
  category: "command_injection",
  regexPattern: String.raw`\brm\b|\bmv\b`,
  exclusionPattern: "^#",
  description: "",
  remediation: "",
};

type ToolRuleFormState = typeof TOOL_RULE_FORM_DEFAULT;

/** 仅用于选中项文字着色；选择框本身使用中性灰边框与白底 */
function autonomyLevelTextClass(level: string) {
  switch (level) {
    case "L1 直接执行":
      return "text-emerald-700";
    case "L2 通知":
      return "text-amber-800";
    case "L3 审批":
      return "text-rose-700";
    default:
      return "text-slate-700";
  }
}

type SecuritySectionProps = {
  activePanel: SecurityPanelKey;
  securityManagement: SecurityManagementConfig;
  onAutonomyBoundaryLevelChange: (
    boundaryId: string,
    level: SecurityManagementConfig["autonomyBoundaries"][number]["level"]
  ) => void;
  onToolProtectionEnabledChange: (enabled: boolean) => void;
  onToolProtectionRuleToggle: (ruleId: string, enabled: boolean) => void;
  onAddToolProtectionRule: (rule: ToolProtectionRuleItem) => void;
  onAddProtectedTool: (name: string) => void;
  onRemoveProtectedTool: (name: string) => void;
  onAddProhibitedTool: (name: string) => void;
  onRemoveProhibitedTool: (name: string) => void;
  onFileProtectionEnabledChange: (enabled: boolean) => void;
  onAddFilePath: (path: string) => void;
  onRemoveFilePath: (pathId: string) => void;
  onResolveApproval: (approvalId: string, resolution: "approved" | "rejected") => void;
};

function InfoHint({ label }: { label: string }) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center text-slate-400" title={label} aria-label={label}>
      <Info className="h-3.5 w-3.5" />
    </span>
  );
}

function RuleFormRow({
  label,
  required,
  labelHint,
  children,
}: {
  label: string;
  required?: boolean;
  labelHint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[128px_1fr] sm:gap-3">
      <div className="flex flex-wrap items-center justify-start gap-1 sm:justify-end sm:pt-2 sm:pr-1">
        {required ? <span className="text-sm font-medium text-red-500">*</span> : null}
        <span className="text-right text-sm text-slate-700">{label}</span>
        {labelHint}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const inputClass =
  "h-9 w-full rounded-sm border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-1 focus:ring-sky-200";

const textareaClass =
  "min-h-[72px] w-full rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-1 focus:ring-sky-200";

function ToolChipList({
  items,
  onRemove,
  muted,
}: {
  items: string[];
  onRemove: (name: string) => void;
  muted?: boolean;
}) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onRemove(name)}
          className={cn(
            "inline-flex items-center gap-1 rounded-sm border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700 transition hover:border-slate-300 hover:bg-slate-100",
            muted && "opacity-70"
          )}
        >
          {name}
          <span className="text-slate-400">×</span>
        </button>
      ))}
    </div>
  );
}

export function ClawSecuritySection({
  activePanel,
  securityManagement,
  onAutonomyBoundaryLevelChange,
  onToolProtectionEnabledChange,
  onToolProtectionRuleToggle,
  onAddToolProtectionRule,
  onAddProtectedTool,
  onRemoveProtectedTool,
  onAddProhibitedTool,
  onRemoveProhibitedTool,
  onFileProtectionEnabledChange,
  onAddFilePath,
  onRemoveFilePath,
  onResolveApproval,
}: SecuritySectionProps) {
  const [protectedDraft, setProtectedDraft] = useState("");
  const [prohibitedDraft, setProhibitedDraft] = useState("");
  const [pathDraft, setPathDraft] = useState("");
  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState<ToolRuleFormState>(() => ({ ...TOOL_RULE_FORM_DEFAULT }));

  const { autonomyBoundaries, toolProtection, fileProtection, securityApprovals } = securityManagement;

  if (activePanel === "autonomy-boundaries") {
    return (
      <div className="w-full min-w-0 space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">自主性动作边界配置</h2>
          <p className="mt-1 text-sm text-slate-500">配置赋予工具执行各项操作时的自主性级别</p>
        </div>

        <div className="w-full min-w-0 space-y-0 border border-slate-200/90 bg-white">
          {autonomyBoundaries.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[#303133]">{item.name}</div>
                <div className="mt-0.5 text-sm text-[#909399]">{item.description}</div>
              </div>
              <div className="w-full shrink-0 sm:max-w-xs sm:w-56 md:w-64">
                <div className="relative">
                  <select
                    value={item.level}
                    onChange={(event) =>
                      onAutonomyBoundaryLevelChange(
                        item.id,
                        event.target.value as SecurityManagementConfig["autonomyBoundaries"][number]["level"]
                      )
                    }
                    className={cn(
                      "h-9 w-full appearance-none rounded-sm border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-sm font-semibold outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-200",
                      autonomyLevelTextClass(item.level)
                    )}
                  >
                    {AUTONOMY_BOUNDARY_LEVELS.map((level) => (
                      <option key={level} value={level} className="text-slate-800">
                        {level}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activePanel === "tool-protection") {
    return (
      <div className="w-full min-w-0 space-y-5">
        <div>
          <p className="text-sm leading-6 text-slate-600">
            配置工具调用的安全扫描。危险操作将在执行前需要你的明确批准。
          </p>
        </div>

        <div className="border border-slate-200/90 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              启用工具防护
              <InfoHint label="开启后按规则扫描工具调用，命中风险项可拦截或进入审批。" />
            </div>
            <Switch
              checked={toolProtection.enabled}
              onCheckedChange={onToolProtectionEnabledChange}
              className="data-[state=checked]:bg-sky-600"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">
                受保护的工具
                <InfoHint label="命中后将触发额外校验或审批流程。" />
              </div>
              <div className="relative">
                <input
                  value={protectedDraft}
                  onChange={(event) => setProtectedDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      const v = protectedDraft.trim();
                      if (v) {
                        onAddProtectedTool(v);
                        setProtectedDraft("");
                      }
                    }
                  }}
                  placeholder="选择工具或输入自定义工具名"
                  className="h-9 w-full rounded-sm border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-1 focus:ring-sky-200"
                />
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              <ToolChipList items={toolProtection.protectedTools} onRemove={onRemoveProtectedTool} />
            </div>

            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">
                禁止的工具
                <InfoHint label="列表中的工具将被直接禁止调用。" />
              </div>
              <div className="relative">
                <input
                  value={prohibitedDraft}
                  onChange={(event) => setProhibitedDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      const v = prohibitedDraft.trim();
                      if (v) {
                        onAddProhibitedTool(v);
                        setProhibitedDraft("");
                      }
                    }
                  }}
                  placeholder="选择要始终禁止的工具"
                  className="h-9 w-full rounded-sm border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-1 focus:ring-sky-200"
                />
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              <ToolChipList items={toolProtection.prohibitedTools} onRemove={onRemoveProhibitedTool} />
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">检测规则</h3>
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-sm bg-sky-600 px-3 text-xs font-medium text-white shadow-none hover:bg-sky-700"
              onClick={() => toast.info("添加自定义规则将接入策略引擎后开放。")}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              添加规则
            </Button>
          </div>

          <div className="overflow-x-auto border border-slate-200/90 bg-white">
            <div className="min-w-[640px]">
            <div className="grid grid-cols-[minmax(0,1.1fr)_100px_minmax(0,1.4fr)_72px_100px] gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
              <div>规则 ID</div>
              <div>严重程度</div>
              <div>描述</div>
              <div>来源</div>
              <div className="text-right">操作</div>
            </div>
            {toolProtection.rules.map((rule) => (
              <div
                key={rule.id}
                className="grid grid-cols-[minmax(0,1.1fr)_100px_minmax(0,1.4fr)_72px_100px] items-center gap-2 border-b border-slate-100 px-3 py-2.5 text-sm last:border-b-0"
              >
                <div className="font-mono text-xs text-slate-800">{rule.id}</div>
                <div>
                  <span
                    className={cn(
                      "inline-flex rounded-sm px-2 py-0.5 text-xs font-medium",
                      rule.severity === "CRITICAL"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-sky-50 text-sky-800"
                    )}
                  >
                    {rule.severity}
                  </span>
                </div>
                <div className="text-slate-600 leading-snug">{rule.description}</div>
                <div>
                  <span className="inline-flex rounded-sm border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                    {rule.source}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(checked) => onToolProtectionRuleToggle(rule.id, checked)}
                    className="scale-90 data-[state=checked]:bg-sky-600"
                  />
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label="查看规则"
                    onClick={() => toast.message(rule.id, { description: rule.description })}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activePanel === "file-protection") {
    return (
      <div className="w-full min-w-0 space-y-4">
        <p className="text-sm leading-6 text-slate-600">
          保护敏感文件和目录，防止被 Agent 工具访问。添加的路径将在所有工具调用中被拦截。
        </p>

        <div className="w-full border border-slate-200/90 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <span className="text-sm font-medium text-slate-900">启用文件防护</span>
            <Switch
              checked={fileProtection.enabled}
              onCheckedChange={onFileProtectionEnabledChange}
              className="data-[state=checked]:bg-sky-600"
            />
          </div>

          <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={pathDraft}
              onChange={(event) => setPathDraft(event.target.value)}
              placeholder="输入文件或目录路径 (如 ~/.ssh/ 或 /etc/passwd)"
              className="h-9 min-w-0 w-full flex-1 rounded-sm border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-300 focus:ring-1 focus:ring-sky-200"
            />
            <Button
              type="button"
              size="sm"
              className="h-9 w-full shrink-0 rounded-sm border border-sky-200 bg-sky-50 px-3 text-sm font-medium text-sky-800 shadow-none hover:bg-sky-100 sm:w-auto"
              onClick={() => {
                const raw = pathDraft.trim();
                if (!raw) {
                  return;
                }
                onAddFilePath(raw);
                setPathDraft("");
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              添加
            </Button>
          </div>
        </div>

        <div className="w-full min-w-0 overflow-hidden border border-slate-200/90 bg-white">
          <div className="grid grid-cols-[1fr_80px] gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
            <div>路径</div>
            <div className="text-right">操作</div>
          </div>
          {fileProtection.paths.length === 0 ? (
            <div className="px-3 py-12 text-center text-sm text-slate-400">暂无受保护路径</div>
          ) : (
            fileProtection.paths.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_80px] items-center gap-2 border-b border-slate-100 px-3 py-2.5 text-sm last:border-b-0"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2 text-slate-800">
                  {row.kind === "directory" ? (
                    <Folder className="h-4 w-4 shrink-0 text-sky-600" />
                  ) : (
                    <Folder className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                  <span className="break-all font-mono text-xs">{row.path}</span>
                  <span className="inline-flex shrink-0 rounded-sm border border-sky-100 bg-sky-50 px-1.5 py-0.5 text-xs text-sky-800">
                    {row.kind === "directory" ? "目录" : "文件"}
                  </span>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-rose-500 transition hover:bg-rose-50"
                    aria-label="删除"
                    onClick={() => onRemoveFilePath(row.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  /* security-approval */
  const pending = securityApprovals.pending;
  const history = securityApprovals.history;

  return (
    <div className="w-full min-w-0">
      <div className="grid w-full min-w-0 gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:gap-10">
        <section className="min-w-0">
          <h2 className="text-sm font-semibold text-amber-800">{pending.length} 个待审批</h2>
          <div className="mt-3 space-y-3">
            {pending.length === 0 ? (
              <div className="rounded-sm border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
                当前没有待审批项
              </div>
            ) : (
              pending.map((item) => (
                <div key={item.id} className="border border-slate-200/90 bg-slate-50/90 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-sm bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                        pending
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{item.actionName}</span>
                    </div>
                    <span className="text-xs text-slate-400">{item.requestedAt}</span>
                  </div>
                  <pre className="mt-3 overflow-x-auto rounded-sm border border-slate-200/80 bg-white p-3 font-mono text-xs leading-relaxed text-slate-700">
                    {item.payload}
                  </pre>
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 rounded-md border-0 bg-blue-600 px-5 text-xs font-semibold text-white shadow-none hover:bg-blue-700"
                      onClick={() => onResolveApproval(item.id, "approved")}
                    >
                      批准
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 rounded-md border-red-500 bg-white px-5 text-xs font-semibold text-red-600 shadow-none hover:bg-red-50 hover:text-red-700"
                      onClick={() => onResolveApproval(item.id, "rejected")}
                    >
                      拒绝
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="min-w-0 border-t border-slate-200 pt-6 xl:border-l xl:border-t-0 xl:pl-10 xl:pt-0">
          <h3 className="text-sm font-semibold text-slate-800">审批历史</h3>
          {history.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">暂无记录</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {history.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-start justify-between gap-2 border border-slate-100 bg-white px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-slate-900">{row.actionName}</span>
                    <span
                      className={cn(
                        "ml-2 inline-flex rounded-sm px-1.5 py-0.5 text-xs font-medium",
                        row.resolution === "approved" ? "bg-sky-50 text-sky-800" : "bg-rose-50 text-rose-800"
                      )}
                    >
                      {row.resolution === "approved" ? "已批准" : "已拒绝"}
                    </span>
                    <p className="mt-1 break-all font-mono text-xs leading-relaxed text-slate-500">{row.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{row.resolvedAt}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

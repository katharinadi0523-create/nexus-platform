"use client";

import { CircleAlert, FileStack, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { SecurityManagementConfig } from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";
import { AUTONOMY_BOUNDARY_LEVELS, SECURITY_RULE_LEVELS } from "./constants";
import { SectionCard } from "./section-card";
import {
  getBoundaryLevelClassName,
  getGovernanceActionClassName,
  getSecurityRuleLevelClassName,
} from "./utils";

type SecuritySectionProps = {
  securityManagement: SecurityManagementConfig;
  lexiconDrafts: Record<string, string>;
  enabledSecurityPolicies: number;
  approvalBoundaryCount: number;
  activeLexiconBindingCount: number;
  onAutonomyBoundaryLevelChange: (
    boundaryId: string,
    level: SecurityManagementConfig["autonomyBoundaries"][number]["level"]
  ) => void;
  onToggleSecurityPolicy: (policyId: string, enabled: boolean) => void;
  onSecurityPolicyModeChange: (
    policyId: string,
    mode: SecurityManagementConfig["strategyPolicies"][number]["mode"]
  ) => void;
  onSecurityPolicyActionChange: (
    policyId: string,
    action: SecurityManagementConfig["strategyPolicies"][number]["availableActions"][number]
  ) => void;
  onSecurityPolicyRuleLevelChange: (
    policyId: string,
    ruleId: string,
    level: SecurityManagementConfig["strategyPolicies"][number]["rules"][number]["level"]
  ) => void;
  onToggleLexiconPolicy: (policyId: string, enabled: boolean) => void;
  onLexiconPolicyModeChange: (
    policyId: string,
    mode: SecurityManagementConfig["lexiconPolicies"][number]["mode"]
  ) => void;
  onLexiconPolicyActionChange: (
    policyId: string,
    action: SecurityManagementConfig["lexiconPolicies"][number]["availableActions"][number]
  ) => void;
  onLexiconDraftChange: (policyId: string, value: string) => void;
  onAddLexiconLibrary: (policyId: string) => void;
  onRemoveLexiconLibrary: (policyId: string, libraryName: string) => void;
};

export function ClawSecuritySection({
  securityManagement,
  lexiconDrafts,
  enabledSecurityPolicies,
  approvalBoundaryCount,
  activeLexiconBindingCount,
  onAutonomyBoundaryLevelChange,
  onToggleSecurityPolicy,
  onSecurityPolicyModeChange,
  onSecurityPolicyActionChange,
  onSecurityPolicyRuleLevelChange,
  onToggleLexiconPolicy,
  onLexiconPolicyModeChange,
  onLexiconPolicyActionChange,
  onLexiconDraftChange,
  onAddLexiconLibrary,
  onRemoveLexiconLibrary,
}: SecuritySectionProps) {
  const getSelectedActions = <Action extends string>(availableActions: Action[], currentAction: Action | Action[]) => {
    const actionSet = new Set(Array.isArray(currentAction) ? currentAction : [currentAction]);
    return availableActions.filter((action) => actionSet.has(action));
  };

  const getActionSummary = (actions: string[]) => actions.join(" + ");

  const getActionTone = (actions: string[]) => actions.find((action) => action !== "记录") ?? actions[0] ?? "记录";

  return (
    <SectionCard
      title="安全管理"
      description="围绕自主性动作边界、安全策略和内容安全词库，为当前 Claw 建立更适合行动型智能体的治理与防护配置。"
    >
      <div className="grid gap-2.5 md:grid-cols-3">
        <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">动作边界</div>
          <div className="mt-2 text-[22px] font-semibold text-slate-950">{securityManagement.autonomyBoundaries.length}</div>
          <div className="mt-1.5 text-[13px] leading-5 text-slate-500">已配置可执行动作与边界等级</div>
        </div>
        <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">已启用策略</div>
          <div className="mt-2 text-[22px] font-semibold text-slate-950">{enabledSecurityPolicies}</div>
          <div className="mt-1.5 text-[13px] leading-5 text-slate-500">覆盖内容、提示词、工具、CLI 与外发行为</div>
        </div>
        <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">重点管控</div>
          <div className="mt-2 flex items-center gap-2.5">
            <div className="text-[22px] font-semibold text-slate-950">{approvalBoundaryCount}</div>
            <Badge className="border-sky-100 bg-sky-50 text-[12px] text-sky-700">词库绑定 {activeLexiconBindingCount}</Badge>
          </div>
          <div className="mt-1.5 text-[13px] leading-5 text-slate-500">需要审批的动作与当前生效词库总数</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.88),rgba(255,255,255,0.98))] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-base font-semibold text-slate-950">自主性动作边界配置</div>
                <div className="mt-1.5 max-w-3xl text-[13px] leading-6 text-slate-600">
                  配置智能体在不同动作上的自主等级，便于把高风险行为收敛到通知或审批链路。
                </div>
              </div>
            </div>

            <Badge className="border-emerald-200 bg-emerald-50 text-[12px] text-emerald-700">
              {securityManagement.autonomyBoundaries.filter((item) => item.level === "L1 自动执行").length} 项可自动执行
            </Badge>
          </div>

          <div className="mt-4 space-y-2.5">
            {securityManagement.autonomyBoundaries.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-[18px] border border-slate-200 bg-white/90 px-3.5 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                  <div className="mt-1 text-[13px] leading-5 text-slate-500">{item.description}</div>
                </div>

                <div className="md:w-[208px]">
                  <select
                    value={item.level}
                    onChange={(event) =>
                      onAutonomyBoundaryLevelChange(
                        item.id,
                        event.target.value as (typeof AUTONOMY_BOUNDARY_LEVELS)[number]
                      )
                    }
                    className={cn(
                      "h-10 w-full rounded-[14px] border px-3 text-[13px] font-semibold outline-none transition-colors",
                      getBoundaryLevelClassName(item.level)
                    )}
                  >
                    {AUTONOMY_BOUNDARY_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.88),rgba(255,255,255,0.98))] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-sky-50 text-sky-700">
                <CircleAlert className="h-4 w-4" />
              </div>
              <div>
                <div className="text-base font-semibold text-slate-950">安全策略配置</div>
                <div className="mt-1.5 max-w-3xl text-[13px] leading-6 text-slate-600">
                  在内容安全基础上补齐行动型智能体常见的工具调用、CLI 执行、外发访问和文件写删保护策略。
                </div>
              </div>
            </div>

            <Badge className="border-slate-200 bg-white text-[12px] text-slate-700">
              {securityManagement.strategyPolicies.length} 组策略
            </Badge>
          </div>

          <div className="mt-4 space-y-3">
            {securityManagement.strategyPolicies.map((policy) => {
              const selectedActions = getSelectedActions(policy.availableActions, policy.action);

              return (
                <div key={policy.id} className="rounded-[18px] border border-slate-200 bg-white/90 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-slate-950">{policy.title}</div>
                        <Badge className="border-slate-200 bg-slate-100 text-[12px] text-slate-700">{policy.rules.length} 条规则</Badge>
                        <Badge className={cn("border text-[12px]", getGovernanceActionClassName(getActionTone(selectedActions)))}>
                          默认动作 · {getActionSummary(selectedActions)}
                        </Badge>
                      </div>
                      <div className="mt-1.5 text-[13px] leading-6 text-slate-600">{policy.description}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-[13px] text-slate-500">{policy.enabled ? "已开启" : "已关闭"}</div>
                      <Switch checked={policy.enabled} onCheckedChange={(checked) => onToggleSecurityPolicy(policy.id, checked)} />
                    </div>
                  </div>

                  {policy.enabled ? (
                    <div className="mt-4 space-y-3">
                      {policy.mode ? (
                        <div className="rounded-[16px] border border-slate-200 bg-slate-50/70 px-3.5 py-3">
                          <div className="text-[13px] font-semibold text-slate-900">配置方式</div>
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {(["单独配置", "统一配置"] as const).map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => onSecurityPolicyModeChange(policy.id, mode)}
                                className={cn(
                                  "rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                                  policy.mode === mode
                                    ? "border-sky-200 bg-sky-50 text-sky-700"
                                    : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                                )}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="overflow-hidden rounded-[16px] border border-slate-200">
                        <div className="hidden bg-slate-50/90 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid md:grid-cols-[132px_160px_minmax(0,1fr)_138px] md:gap-3">
                          <div>生效阶段</div>
                          <div>检测子类</div>
                          <div>规则说明</div>
                          <div>防护等级</div>
                        </div>

                        {policy.rules.map((rule, index) => (
                          <div
                            key={rule.id}
                            className={cn(
                              "grid gap-2.5 px-3 py-3 md:grid-cols-[132px_160px_minmax(0,1fr)_138px] md:items-center md:gap-3",
                              index > 0 ? "border-t border-slate-200" : ""
                            )}
                          >
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 md:hidden">生效阶段</div>
                              <div className="mt-1 text-[13px] font-medium text-slate-900 md:mt-0">{rule.stage}</div>
                            </div>

                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 md:hidden">检测子类</div>
                              <div className="mt-1 text-[13px] font-medium text-slate-900 md:mt-0">{rule.subtype}</div>
                            </div>

                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 md:hidden">规则说明</div>
                              <div className="mt-1 text-[13px] leading-5 text-slate-600 md:mt-0">{rule.description}</div>
                            </div>

                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 md:hidden">防护等级</div>
                              <select
                                value={rule.level}
                                onChange={(event) =>
                                  onSecurityPolicyRuleLevelChange(
                                    policy.id,
                                    rule.id,
                                    event.target.value as (typeof SECURITY_RULE_LEVELS)[number]
                                  )
                                }
                                className={cn(
                                  "mt-1.5 h-10 w-full rounded-[14px] border px-3 text-[13px] font-semibold outline-none transition-colors md:mt-0",
                                  getSecurityRuleLevelClassName(rule.level)
                                )}
                              >
                                {SECURITY_RULE_LEVELS.map((level) => (
                                  <option key={level} value={level}>
                                    {level}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-[16px] border border-slate-200 bg-slate-50/70 px-3.5 py-3">
                        <div className="text-[13px] font-semibold text-slate-900">执行动作</div>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {policy.availableActions.map((action) => (
                            <button
                              key={action}
                              type="button"
                              onClick={() => onSecurityPolicyActionChange(policy.id, action)}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                                selectedActions.includes(action)
                                  ? cn("shadow-sm", getGovernanceActionClassName(action))
                                  : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                              )}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-[16px] border border-dashed border-slate-200 bg-slate-50/70 px-3.5 py-4 text-[13px] leading-5 text-slate-500">
                      当前策略已关闭，相关风险仅依赖其他模块记录，不会触发主动拦截或审批。
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.88),rgba(255,255,255,0.98))] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-violet-50 text-violet-700">
                <FileStack className="h-4 w-4" />
              </div>
              <div>
                <div className="text-base font-semibold text-slate-950">内容安全词库配置</div>
                <div className="mt-1.5 max-w-3xl text-[13px] leading-6 text-slate-600">
                  管理黑名单、白名单和高风险动作词库，让内容风险和动作风险都能挂接到同一套留痕链路里。
                </div>
              </div>
            </div>

            <Badge className="border-slate-200 bg-white text-[12px] text-slate-700">
              {securityManagement.lexiconPolicies.length} 组词库策略
            </Badge>
          </div>

          <div className="mt-4 space-y-3">
            {securityManagement.lexiconPolicies.map((policy) => {
              const selectedActions = getSelectedActions(policy.availableActions, policy.action);
              const selectableLibraries = policy.availableLibraries.filter(
                (library) => !policy.selectedLibraries.includes(library) || library === (lexiconDrafts[policy.id] ?? "")
              );

              return (
                <div key={policy.id} className="rounded-[18px] border border-slate-200 bg-white/90 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-slate-950">{policy.title}</div>
                        <Badge className={cn("border text-[12px]", getGovernanceActionClassName(getActionTone(selectedActions)))}>
                          {getActionSummary(selectedActions)}
                        </Badge>
                        <Badge className="border-slate-200 bg-slate-100 text-[12px] text-slate-700">{policy.stage}</Badge>
                      </div>
                      <div className="mt-1.5 text-[13px] leading-6 text-slate-600">{policy.description}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-[13px] text-slate-500">{policy.enabled ? "已开启" : "已关闭"}</div>
                      <Switch checked={policy.enabled} onCheckedChange={(checked) => onToggleLexiconPolicy(policy.id, checked)} />
                    </div>
                  </div>

                  {policy.enabled ? (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-[16px] border border-slate-200 bg-slate-50/70 px-3.5 py-3">
                        <div className="text-[13px] font-semibold text-slate-900">配置方式</div>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {(["单独配置", "统一配置"] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => onLexiconPolicyModeChange(policy.id, mode)}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                                policy.mode === mode
                                  ? "border-sky-200 bg-sky-50 text-sky-700"
                                  : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                              )}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-2.5 md:grid-cols-[190px_minmax(0,1fr)]">
                        <div className="rounded-[16px] border border-slate-200 bg-slate-50/70 px-3.5 py-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">生效阶段</div>
                          <div className="mt-1.5 text-[13px] font-medium text-slate-900">{policy.stage}</div>
                        </div>

                        <div className="rounded-[16px] border border-slate-200 bg-slate-50/70 px-3.5 py-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">已绑定词库</div>
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {policy.selectedLibraries.length > 0 ? (
                              policy.selectedLibraries.map((library) => (
                                <button
                                  key={library}
                                  type="button"
                                  onClick={() => onRemoveLexiconLibrary(policy.id, library)}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                                >
                                  {library} ×
                                </button>
                              ))
                            ) : (
                              <div className="text-[13px] text-slate-500">当前未绑定词库</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[16px] border border-slate-200 bg-slate-50/70 px-3.5 py-3">
                        <div className="text-[13px] font-semibold text-slate-900">新增词库绑定</div>
                        <div className="mt-2.5 flex flex-col gap-2.5 md:flex-row">
                          <select
                            value={lexiconDrafts[policy.id] ?? ""}
                            onChange={(event) => onLexiconDraftChange(policy.id, event.target.value)}
                            className="h-10 flex-1 rounded-[14px] border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition-colors focus:border-sky-300"
                            disabled={selectableLibraries.length === 0}
                          >
                            {selectableLibraries.length > 0 ? (
                              selectableLibraries.map((library) => (
                                <option key={library} value={library}>
                                  {library}
                                </option>
                              ))
                            ) : (
                              <option value="">没有可新增的词库</option>
                            )}
                          </select>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onAddLexiconLibrary(policy.id)}
                            disabled={!lexiconDrafts[policy.id] || selectableLibraries.length === 0}
                          >
                            绑定词库
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-[16px] border border-slate-200 bg-slate-50/70 px-3.5 py-3">
                        <div className="text-[13px] font-semibold text-slate-900">执行动作</div>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {policy.availableActions.map((action) => (
                            <button
                              key={action}
                              type="button"
                              onClick={() => onLexiconPolicyActionChange(policy.id, action)}
                              className={cn(
                                "rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                                selectedActions.includes(action)
                                  ? cn("shadow-sm", getGovernanceActionClassName(action))
                                  : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                              )}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-[16px] border border-dashed border-slate-200 bg-slate-50/70 px-3.5 py-4 text-[13px] leading-5 text-slate-500">
                      当前词库策略已关闭，不会在对话、工具入参或输出阶段参与安全判定。
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import {
  ClawAgentAction,
  ClawAgentOutput,
  ClawAgentThinking,
  ClawSubAgentSummonedEvent,
  ClawUserMessage,
} from "@/components/claw-hub-next/conversation-timeline";
import { getPersonalClawDetail } from "@/lib/mock/my-claw/personal-claw";
import {
  ENTERPRISE_FLOW_MAX_PHASE,
  buildEnterpriseConversationView,
  type EnterpriseRenderNode,
  type EnterpriseConversationView,
} from "@/lib/mock/my-claw/enterprise-flows";
import type { MyClawSessionListItem } from "@/lib/mock/my-claw/types";
import { cn } from "@/lib/utils";
import { ComposerWithAgents } from "./composer-with-agents";

function EnterpriseInspector({ view }: { view: EnterpriseConversationView }) {
  return (
    <aside className="hidden min-h-0 w-[320px] shrink-0 border-l border-slate-200 bg-white lg:block">
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex h-12 shrink-0 items-center border-b border-slate-200 px-4">
          <span className="text-sm font-semibold text-slate-800">任务详情</span>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <section className="border-b border-slate-200 pb-5">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">任务进程</h3>
              <span className="text-xs text-slate-400">
                {view.inspector.completedTaskCount}/{view.inspector.tasks.length}
              </span>
            </header>
            <div className="space-y-1">
              {view.inspector.tasks.map((task) => (
                <div key={task.id} className="rounded-md px-2 py-2">
                  <div className="flex items-start gap-2.5">
                    {task.status === "running" ? (
                      <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-slate-500" />
                    ) : task.status === "done" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-slate-700">
                        {task.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{task.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border-b border-slate-200 py-5">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">会话文件</h3>
              <span className="text-xs text-slate-400">
                {view.inspector.files.length} 个
              </span>
            </header>
            {view.inspector.files.length > 0 ? (
              <div className="space-y-1">
                {view.inspector.files.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-start gap-2.5 rounded-md px-2 py-2 hover:bg-slate-50"
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-slate-700">
                        {file.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {file.size} · {file.path}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-2 text-xs text-slate-400">暂无会话文件</p>
            )}
          </section>

          <section className="pt-5">
            <header className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">工具调用</h3>
              <span className="text-xs text-slate-400">
                {view.inspector.tools.length} 次
              </span>
            </header>
            <div className="space-y-1">
              {view.inspector.tools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-start gap-2.5 rounded-md px-2 py-2"
                >
                  <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-slate-700">
                      {tool.headline}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{tool.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </aside>
  );
}

function EnterpriseNodeView({
  node,
  expanded,
  onToggle,
}: {
  node: EnterpriseRenderNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (node.type === "user") {
    return <ClawUserMessage item={node.timeline} />;
  }

  if (node.type === "thinking") {
    return <ClawAgentThinking item={node.timeline} />;
  }

  if (node.type === "output") {
    return <ClawAgentOutput item={node.timeline} />;
  }

  if (node.type === "plan") {
    return (
      <ClawAgentAction
        item={{
          key: node.key,
          type: "action",
          title: `执行计划 · ${node.status}`,
          kind: "tool",
          status: node.statusTone,
          logs: node.items.map(
            (item) => `${item.title}（${item.tool} · ${item.eta}）`
          ),
          source: "audit",
        }}
        expanded={expanded}
        onToggle={onToggle}
      />
    );
  }

  if (node.type === "artifacts") {
    return (
      <ClawAgentOutput
        item={{
          key: node.key,
          type: "output",
          message: {
            id: node.key,
            role: "assistant",
            sender: "企业智能体",
            time: "",
            content: node.note ?? "会话文件已就绪",
            attachments: node.artifacts.map((artifact) => artifact.name),
            auditRecords: [],
          },
        }}
      />
    );
  }

  if (node.type === "stage") {
    return (
      <ClawAgentAction
        item={{
          key: node.key,
          type: "action",
          title: node.title,
          kind: "skill",
          status: node.status,
          logs: node.logs,
          source: "audit",
        }}
        expanded={expanded}
        onToggle={onToggle}
      >
        <div className="space-y-3">
          {node.logs.map((log) => (
            <p key={log} className="text-sm leading-6 text-slate-600">
              {log}
            </p>
          ))}

          {node.identity ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
              <div className="mb-2 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-medium text-slate-800">
                  X.509 Agent 根身份
                </p>
              </div>
              <dl className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                <div>
                  <dt className="text-slate-400">Agent</dt>
                  <dd className="mt-0.5 font-medium text-slate-700">
                    {node.identity.agentName}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Agent ID</dt>
                  <dd className="mt-0.5 font-mono text-slate-700">
                    {node.identity.agentId}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-400">Fingerprint</dt>
                  <dd className="mt-0.5 break-all font-mono text-slate-700">
                    {node.identity.fingerprint}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-400">Proof</dt>
                  <dd className="mt-0.5 text-slate-700">{node.identity.proof}</dd>
                </div>
              </dl>
            </div>
          ) : null}

          {node.subagents?.map((group) => (
            <div key={group.id} className="space-y-2">
              <p className="text-sm leading-6 text-slate-600">
                {group.principalAction}
              </p>
              <ClawSubAgentSummonedEvent
                agentName={group.principalAgent}
                running={group.tasks.some((task) => task.status === "running")}
              />
              <div className="space-y-2 pl-1">
                {group.tasks.map((task) => (
                  <div
                    key={task.title}
                    className="flex items-start gap-2 text-sm leading-6 text-slate-600"
                  >
                    {task.status === "running" ? (
                      <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-slate-500" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    )}
                    <div>
                      <p className="font-medium text-slate-800">
                        {task.title}
                        {task.elapsed ? (
                          <span className="ml-2 text-xs font-normal text-slate-400">
                            {task.elapsed}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-slate-500">{task.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              {group.delegation ? (
                <p className="text-xs leading-5 text-slate-400">
                  {group.delegation.inheritedPermissions} ·{" "}
                  {group.delegation.audit}
                </p>
              ) : null}
            </div>
          ))}

          {node.alerts?.map((alert) => (
            <div
              key={alert.title}
              className={cn(
                "rounded-xl border px-3 py-3",
                alert.level === "critical"
                  ? "border-red-200 bg-red-50/70"
                  : "border-amber-200 bg-amber-50/70"
              )}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">{alert.riskType}</p>
                  <p className="text-sm font-medium text-slate-800">
                    {alert.title}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-600">{alert.summary}</p>
              {alert.detections.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {alert.detections.map((item) => (
                    <span
                      key={`${item.layer}-${item.result}`}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
                    >
                      <span className="font-medium">{item.layer}</span> ·{" "}
                      {item.result}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {alert.action}
              </p>
            </div>
          ))}
        </div>
      </ClawAgentAction>
    );
  }

  return null;
}

/**
 * Enterprise session host: Nexus timeline mock from `enterpriseFlowPresets`
 * + ComposerWithAgents (DebugChatComposer + AgentSelector).
 */
export function EnterpriseSessionPanel({
  session,
}: {
  session: MyClawSessionListItem;
}) {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const [phase, setPhase] = useState(() =>
    buildEnterpriseConversationView({ session }).phase
  );
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setPhase(buildEnterpriseConversationView({ session }).phase);
    setDraft("");
  }, [session.id]);

  const view = useMemo(
    () => buildEnterpriseConversationView({ session, phase }),
    [session, phase]
  );

  useEffect(() => {
    const actionKeys = view.nodes
      .filter((node) => node.type === "plan" || node.type === "stage")
      .map((node) => node.key);
    const lastKey = actionKeys[actionKeys.length - 1];
    if (!lastKey) return;
    setExpanded({ [lastKey]: true });
  }, [view.nodes, session.id]);

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-4xl space-y-4">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <Circle className="h-3 w-3" />
              <span>
                {session.title} · 预设 {view.flowKey} · phase {view.phase}/
                {ENTERPRISE_FLOW_MAX_PHASE}
              </span>
            </div>
            {view.nodes.map((node) => (
              <EnterpriseNodeView
                key={node.key}
                node={node}
                expanded={Boolean(expanded[node.key])}
                onToggle={() =>
                  setExpanded((current) => ({
                    ...current,
                    [node.key]: !current[node.key],
                  }))
                }
              />
            ))}
          </div>
        </div>
        <div className="shrink-0 px-4 py-4 lg:px-8 lg:py-5">
          <div className="mx-auto w-full max-w-4xl">
            <ComposerWithAgents
              detail={detail}
              value={draft}
              onChange={setDraft}
              onSend={() => {
                setDraft("");
                setPhase((current) =>
                  Math.min(current + 1, ENTERPRISE_FLOW_MAX_PHASE)
                );
              }}
            />
          </div>
        </div>
      </div>
      <EnterpriseInspector view={view} />
    </div>
  );
}

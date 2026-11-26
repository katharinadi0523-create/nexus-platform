"use client";

import { useMemo, useRef, useState } from "react";
import { ClawSubAgentSummonedEvent, ClawUserMessage } from "@/components/claw-hub-next/conversation-timeline";
import { ExecutionTurn } from "@/components/claw-client/execution-process/execution-turn";
import type { RawItem } from "@/components/claw-client/execution-process/model";
import {
  PersonalConversationSidePanel,
  type ConversationPanelTask,
  type PersonalPanelView,
} from "@/components/claw-client/personal-conversation-side-panel";
import { getPersonalClawDetail } from "@/lib/mock/my-claw/personal-claw";
import type { MyClawSessionListItem } from "@/lib/mock/my-claw/types";
import { ComposerWithAgents } from "./composer-with-agents";

/**
 * 本体调用演示：主智能体依据场景描述召唤“本体助手”子智能体。
 * 两轮提问调用的是同一个子会话，第二轮直接沿用上一轮查到的商机，不再重复检索。
 */

const ONTOLOGY_AGENT_TASK_ID = "ontology-assistant";

const ONTOLOGY_AGENT: ConversationPanelTask = {
  id: ONTOLOGY_AGENT_TASK_ID,
  title: "子智能体：本体助手",
  agentName: "本体助手",
  agentRole: "本体 · 客户与商机",
  kind: "subagent",
  status: "done",
  durationLabel: "21s",
  updatedAt: "2026-11-19T10:06:00.000Z",
  rounds: [
    {
      id: "round-1",
      label: "第 1 次调用",
      prompt: "查询华东区本季度（2026-10-01 起）仍在跟进的商机，按金额从高到低列出客户、商机、金额和负责人。",
      traceEvents: [
        { id: "r1-t1", kind: "thought", title: "读取场景目录", duration: "1.6 秒", status: "done", content: "问题落在“商机”对象，区域和负责人要沿“商机 → 客户”“商机 → 负责人”两条链接取。" },
        { id: "r1-q1", kind: "tool", title: "对象检索 · 商机", status: "done", content: "条件：区域 = 华东，阶段 = 跟进中，创建时间 ≥ 2026-10-01\n命中 4 条" },
        { id: "r1-q2", kind: "tool", title: "链接查询 · 商机 → 客户", status: "done", content: "4 条商机关联 4 个客户" },
        { id: "r1-t2", kind: "thought", title: "整理结果", duration: "0.8 秒", status: "done", content: "按金额降序，交回主智能体。", expandedByDefault: true },
      ],
    },
    {
      id: "round-2",
      label: "第 2 次调用 · 延续同一会话",
      prompt: "上一轮第 1 条商机（华东智造 · 产线数字化二期）关联了哪些报价单？对最新一张执行“提交报价审批”。",
      traceEvents: [
        { id: "r2-t1", kind: "thought", title: "沿用上一轮结果", duration: "0.9 秒", status: "done", content: "上一轮已拿到这条商机的 ID（OPP-2611），直接从它出发，不再重新检索商机。" },
        { id: "r2-q1", kind: "tool", title: "链接查询 · 商机 → 报价单", status: "done", content: "关联报价单 3 张，最新一张 Q-2026-1187（11-17）" },
        { id: "r2-a1", kind: "tool", title: "执行行为 · 提交报价审批", status: "done", content: "Q-2026-1187 已提交，状态变为“审批中”" },
        { id: "r2-t2", kind: "thought", title: "整理结果", duration: "0.6 秒", status: "done", content: "报价单列表和行为执行结果交回主智能体。", expandedByDefault: true },
      ],
    },
  ],
};

type Turn = { user: string; items: RawItem[]; elapsed: number };

export function OntologyChatPanel({
  session,
  workspacePanelOpen = false,
  workspaceView = "summary",
  workspacePanelWidth = 400,
  onWorkspaceViewChange,
  onWorkspacePanelWidthChange,
  onOpenWorkspace,
  onCloseWorkspace,
}: {
  session: MyClawSessionListItem;
  workspacePanelOpen?: boolean;
  workspaceView?: PersonalPanelView;
  workspacePanelWidth?: number;
  onWorkspaceViewChange?: (view: PersonalPanelView) => void;
  onWorkspacePanelWidthChange?: (width: number) => void;
  onOpenWorkspace?: () => void;
  onCloseWorkspace?: () => void;
}) {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const [draft, setDraft] = useState("");
  const [agentDetailRequest, setAgentDetailRequest] = useState<{ taskId: string; requestId: number } | null>(null);
  const requestId = useRef(0);

  const openAgent = () => {
    requestId.current += 1;
    setAgentDetailRequest({ taskId: ONTOLOGY_AGENT_TASK_ID, requestId: requestId.current });
    onWorkspaceViewChange?.("collaboration");
    onOpenWorkspace?.();
  };

  const summon = (idValue: string): RawItem => ({
    kind: "card",
    id: idValue,
    tool: "CallSubAgent",
    render: () => <ClawSubAgentSummonedEvent agentName="本体助手" openLabel="在右侧查看本体助手的调用过程" onOpen={openAgent} />,
  });

  const turns: Turn[] = [
    {
      user: "华东区本季度还有哪些在跟进的商机？按金额排一下。",
      elapsed: 14,
      items: [
        { kind: "thinking", id: "o1-think", seconds: 3, text: "问题涉及客户和商机，在已绑定本体「客户与商机」的范围内，交给本体助手查询。" },
        summon("o1-summon"),
        {
          kind: "answer",
          id: "o1-answer",
          text: "华东区本季度在跟进的商机共 4 个，按金额排序：\n1. 华东智造 · 产线数字化二期 — 386 万，负责人 周宁\n2. 申港物流 · 仓储调度平台 — 215 万，负责人 陆遥\n3. 杭城医药 · 冷链追溯 — 128 万，负责人 周宁\n4. 苏南新材 · 设备联网 — 64 万，负责人 何畅",
        },
      ],
    },
    {
      user: "第一个商机关联了哪些报价单？最新那张帮我提交审批。",
      elapsed: 11,
      items: [
        { kind: "thinking", id: "o2-think", seconds: 2, text: "接着上一轮的商机问，继续交给本体助手；它还记得这条商机，不用重新检索。" },
        summon("o2-summon"),
        {
          kind: "answer",
          id: "o2-answer",
          text: "「华东智造 · 产线数字化二期」关联 3 张报价单：\n· Q-2026-1187（11-17）386 万\n· Q-2026-1102（11-03）402 万\n· Q-2026-0975（10-21）420 万\n最新的 Q-2026-1187 已提交审批，当前状态：审批中。",
        },
      ],
    },
  ];

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-4xl space-y-6">
            {turns.map((turn, index) => (
              <div key={index} className="space-y-4">
                <ClawUserMessage
                  item={{
                    key: `${session.id}-user-${index}`,
                    type: "user",
                    message: { id: `${session.id}-user-${index}`, role: "user", sender: "我", time: "", content: turn.user, auditRecords: [] },
                  }}
                />
                <ExecutionTurn items={turn.items} runningId={null} state="done" elapsed={turn.elapsed} />
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 px-4 py-4 lg:px-8 lg:py-5">
          <div className="mx-auto w-full max-w-4xl">
            <ComposerWithAgents
              detail={detail}
              modelScopeKey={session.id}
              personalMode
              onOpenWorkspace={onOpenWorkspace}
              value={draft}
              onChange={setDraft}
              onSend={() => setDraft("")}
            />
          </div>
        </div>
      </div>
      <PersonalConversationSidePanel
        open={workspacePanelOpen}
        personalMode
        view={workspaceView}
        panelWidth={workspacePanelWidth}
        onPanelWidthChange={(width) => onWorkspacePanelWidthChange?.(width)}
        onViewChange={(nextView) => onWorkspaceViewChange?.(nextView)}
        onClose={() => onCloseWorkspace?.()}
        outputs={[]}
        tasks={[]}
        agents={[ONTOLOGY_AGENT]}
        agentDetailRequest={agentDetailRequest}
        leadAgentName={detail.overview.name}
        leadAgentStatus="等待下一轮任务"
        conversationTitle={session.title}
      />
    </div>
  );
}

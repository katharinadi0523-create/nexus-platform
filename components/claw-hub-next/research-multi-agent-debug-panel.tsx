"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  CircleX,
  FileCheck2,
  Loader2,
  Plug,
  Sparkles,
  Users,
} from "lucide-react";
import {
  ClawAgentAction,
  ClawAgentOutput,
  ClawAgentThinking,
  ClawSubAgentSummonedEvent,
} from "@/components/claw-hub-next/conversation-timeline";
import { DebugChatComposer } from "@/components/claw-hub-next/debug-chat-composer";
import type { ClawDetailData } from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";

type TaskStatus = "waiting" | "running" | "done" | "failed";
type ResearchTask = { id: string; title: string; agent: string; status: TaskStatus; available: boolean };
type Artifact = { id: string; name: string };
type AgentConfig = {
  task: string;
  progress: string;
  result: string;
  skill: string;
  tool: string;
  artifact: string;
};

const MAX_STAGE = 11;
const AGENT_CONFIG: Record<string, AgentConfig> = {
  假设生成智能体: {
    task: "请基于用户确认的研究边界，提出三个可验证假设，并说明关键变量与验证方法。",
    progress: "正在拆分研究变量，检查假设的可证伪性与实验可行性。",
    result: "已形成 3 个候选假设，其中 H2 的证据可得性和验证成本最优。",
    skill: "科研假设验证 skill",
    tool: "Python 统计分析工具",
    artifact: "可验证假设报告.md",
  },
  文献检索智能体: {
    task: "请检索近五年相关高质量论文，整理研究脉络、主要争议和证据缺口。",
    progress: "正在检索与去重文献，并按研究方法、证据强度建立文献矩阵。",
    result: "已筛选 28 篇核心文献，识别出 2 个仍缺少直接证据的研究空白。",
    skill: "系统文献综述 skill",
    tool: "学术文献检索工具",
    artifact: "核心文献证据矩阵.xlsx",
  },
  科研绘图智能体: {
    task: "请根据实验数据与假设关系设计论文核心图表，确保统计口径清晰。",
    progress: "正在生成变量关系图和实验结果对比图。",
    result: "已生成研究框架图、效应对比图和置信区间图。",
    skill: "科研绘图 skill",
    tool: "Python 绘图环境",
    artifact: "科研图表包.zip",
  },
  论文生成智能体: {
    task: "请整合假设、文献证据和图表，生成论文初稿。",
    progress: "正在组织方法、结果与讨论章节，核对引用和图表编号。",
    result: "已交付论文初稿，但讨论章节对反例与局限性的覆盖不足。",
    skill: "学术写作 skill",
    tool: "引用校验工具",
    artifact: "研究论文初稿.docx",
  },
  论文审核智能体: {
    task: "请按同行评审标准审核论文的证据、方法、逻辑和引用规范。",
    progress: "正在逐节核查论证链与证据引用。",
    result: "审核完成：主要问题已关闭，建议补充一项数据可用性声明。",
    skill: "同行评审 skill",
    tool: "论文规范检查工具",
    artifact: "论文审核报告.md",
  },
};

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
  if (status === "failed") return <CircleX className="h-4 w-4 text-red-500" />;
  return <Circle className="h-4 w-4 text-slate-300" />;
}

function statusText(status: TaskStatus) {
  return { waiting: "未开始", running: "进行中", done: "已完成", failed: "失败" }[status];
}

function taskStatus(stage: number, start: number, done: number): TaskStatus {
  if (stage < start) return "waiting";
  if (stage < done) return "running";
  return "done";
}

function AssistantText({ children }: { children: string }) {
  return (
    <ClawAgentOutput
      item={{
        key: children,
        type: "output",
        message: { id: children, role: "assistant", sender: "科研 Claw", time: "", content: children, auditRecords: [] },
      }}
    />
  );
}

function AgentToolAction({ title, kind, done }: { title: string; kind: "skill" | "tool"; done: boolean }) {
  return (
    <ClawAgentAction
      item={{ key: title, type: "action", title, kind, status: done ? "done" : "running", logs: [], source: "audit" }}
      expanded={false}
      onToggle={() => undefined}
    />
  );
}

function SubAgentSession({ agent, stage, onBack }: { agent: string; stage: number; onBack: () => void }) {
  const item = AGENT_CONFIG[agent] ?? AGENT_CONFIG.假设生成智能体;
  const isPaper = agent === "论文生成智能体";
  const complete =
    agent === "假设生成智能体" || agent === "文献检索智能体"
      ? stage >= 7
      : agent === "科研绘图智能体"
        ? stage >= 9
        : agent === "论文生成智能体"
          ? stage >= 10
          : stage >= 11;
  const hasDraftDelivery = isPaper && stage >= 9;

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50" onClick={(event) => event.stopPropagation()}>
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
        <button type="button" onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Users className="h-4 w-4 text-blue-600" />
        <span className="min-w-0 truncate text-sm font-semibold text-slate-900">{agent}</span>
        <span className={cn("rounded px-2 py-0.5 text-xs", complete ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600")}>
          {complete ? "已交付" : "运行中"}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="flex justify-end">
            <div className="max-w-[82%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">{item.task}</div>
          </div>
          <ClawAgentThinking
            item={{ key: "sub-progress", type: "thinking", active: !complete, message: { id: "sub-progress", role: "assistant", sender: agent, time: "", content: item.progress, auditRecords: [] } }}
          />
          <AgentToolAction title={item.skill} kind="skill" done={complete || hasDraftDelivery} />
          <AgentToolAction title={item.tool} kind="tool" done={complete || hasDraftDelivery} />
          {complete || hasDraftDelivery ? <AssistantText>{item.result}</AssistantText> : null}
          {complete || hasDraftDelivery ? (
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
              <FileCheck2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">{complete && isPaper ? "研究论文修订稿.docx" : item.artifact}</span>
            </div>
          ) : null}
          {hasDraftDelivery ? (
            <>
              <div className="flex justify-end">
                <div className="max-w-[82%] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-slate-700">
                  初稿暂不通过。请补充反例分析、研究局限和可能的替代解释，再交付修订版。
                </div>
              </div>
              <ClawAgentThinking
                item={{ key: "paper-rework", type: "thinking", active: stage < 10, message: { id: "paper-rework", role: "assistant", sender: agent, time: "", content: stage < 10 ? "收到反馈，正在原会话中补充讨论章节并核对引用。" : "已完成补充，修订版已同步给主智能体。", auditRecords: [] } }}
              />
            </>
          ) : null}
        </div>
      </div>
      <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-3 text-center text-xs text-slate-400">子智能体会话只读 · 消息由主智能体发送</div>
    </div>
  );
}

function ToolLayer({ name, items }: { name: string; items: Array<{ label: string; kind: "skill" | "tool" }> }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[13px] font-medium text-slate-700"><Users className="h-3.5 w-3.5 text-slate-400" />{name}</div>
      <div className="ml-[7px] mt-1.5 space-y-1 border-l border-slate-200 pl-4">
        {items.map((item) => <div key={item.label} className="flex items-center gap-2 py-1 text-xs text-slate-500">{item.kind === "skill" ? <Sparkles className="h-3.5 w-3.5 text-blue-500" /> : <Plug className="h-3.5 w-3.5 text-blue-500" />}{item.label}</div>)}
      </div>
    </div>
  );
}

export function ResearchMultiAgentDebugPanel({ detail, inspectorMode = "auto" }: { detail: ClawDetailData; inspectorMode?: "auto" | "open" | "closed" }) {
  const [stage, setStage] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const showInspector = inspectorMode !== "closed";
  const tasks = useMemo<ResearchTask[]>(() => [
    { id: "hypothesis", title: "生成可验证研究假设", agent: "假设生成智能体", status: taskStatus(stage, 5, 7), available: stage >= 5 },
    { id: "literature", title: "检索文献并建立证据矩阵", agent: "文献检索智能体", status: taskStatus(stage, 5, 7), available: stage >= 5 },
    { id: "chart", title: "生成科研图表", agent: "科研绘图智能体", status: taskStatus(stage, 8, 9), available: stage >= 8 },
    { id: "paper", title: "生成并修订论文初稿", agent: "论文生成智能体", status: taskStatus(stage, 8, 10), available: stage >= 8 },
    { id: "review", title: "审核论文质量", agent: "论文审核智能体", status: taskStatus(stage, 10, 11), available: stage >= 10 },
  ], [stage]);
  const artifacts = useMemo<Artifact[]>(() => {
    const items: Artifact[] = [];
    if (stage >= 7) items.push({ id: "hypothesis-report", name: "可验证假设报告.md" }, { id: "evidence-matrix", name: "核心文献证据矩阵.xlsx" });
    if (stage >= 9) items.push({ id: "chart-package", name: "科研图表包.zip" }, { id: "paper-draft", name: stage >= 10 ? "研究论文修订稿.docx" : "研究论文初稿（待修订）.docx" });
    if (stage >= 11) items.push({ id: "review-report", name: "论文审核报告.md" });
    return items;
  }, [stage]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      if (event.key === "ArrowRight") setStage((current) => Math.min(current + 1, MAX_STAGE));
      if (event.key === "ArrowLeft") setStage((current) => Math.max(current - 1, 0));
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (selectedAgent) return <SubAgentSession agent={selectedAgent} stage={stage} onBack={() => setSelectedAgent(null)} />;

  return (
    <div className="grid h-full min-h-0 cursor-pointer" style={{ gridTemplateColumns: showInspector ? "minmax(0,1fr) 320px" : "minmax(0,1fr)" }} onClick={() => setStage((current) => Math.min(current + 1, MAX_STAGE))}>
      <div className="flex min-h-0 flex-col bg-slate-50">
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-4xl space-y-5">
            <div className="flex justify-end"><div className="max-w-2xl rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm leading-6 text-slate-700">请帮我研究生成式 AI 对科研协作效率的影响，并形成一篇带图表的研究论文。</div></div>
            {stage >= 1 ? <ClawAgentAction item={{ key: "insight-skill", type: "action", title: "调用需求洞察 skill", kind: "skill", status: "done", logs: ["识别研究对象、成果形态、证据要求与时间范围。"], source: "audit" }} expanded={false} onToggle={() => undefined} /> : null}
            {stage >= 2 ? <ClawAgentAction item={{ key: "clarify", type: "action", title: "澄清研究范围", kind: "user", status: stage === 2 ? "running" : "done", logs: [], source: "audit" }} expanded onToggle={() => undefined}><div className="space-y-3 text-sm text-slate-600"><p>为了让研究可验证，请确认：聚焦高校科研团队，并以近五年公开研究和模拟实验数据为依据，可以吗？</p><div className="flex gap-2"><span className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-700">确认，按此范围继续</span><span className="rounded-md border border-slate-200 px-3 py-1.5">调整范围</span></div></div></ClawAgentAction> : null}
            {stage >= 3 ? <div className="flex justify-end"><div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">确认，按高校科研团队、近五年公开研究继续。</div></div> : null}
            {stage >= 4 ? <AssistantText>已完成任务规划，将按照以下步骤推进研究。</AssistantText> : null}
            {stage >= 5 ? <><ClawSubAgentSummonedEvent agentName="假设生成智能体" running={stage < 7} /><ClawSubAgentSummonedEvent agentName="文献检索智能体" running={stage < 7} /></> : null}
            {stage >= 7 ? <AssistantText>已收到假设报告和文献证据矩阵。H2 假设具备更好的验证条件，证据矩阵也确认了研究空白，我将据此继续下一轮分析。</AssistantText> : null}
            {stage >= 8 ? <><ClawSubAgentSummonedEvent agentName="科研绘图智能体" running={stage < 9} /><ClawSubAgentSummonedEvent agentName="论文生成智能体" running={stage < 10} /></> : null}
            {stage >= 9 ? <AssistantText>论文初稿的讨论章节缺少反例与局限性。我已向论文生成智能体追加修改要求，科研图表结果已验收通过。</AssistantText> : null}
            {stage >= 10 ? <><AssistantText>论文修订版已通过阶段验收，现进入最终质量检查。</AssistantText><ClawSubAgentSummonedEvent agentName="论文审核智能体" running={stage < 11} /></> : null}
            {stage >= 11 ? <><AssistantText>所有子任务均已完成。论文、研究图表和审核意见已汇总，最终成果已生成。</AssistantText><div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3"><FileCheck2 className="h-5 w-5 text-blue-600" /><span className="text-sm font-medium text-slate-800">科研协作效率影响研究报告.docx</span></div></> : null}
            <p className="pt-2 text-center text-xs text-slate-400">← 上一步 · 点击页面或按 → 进入下一步</p>
          </div>
        </main>
        <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-5 py-4" onClick={(event) => event.stopPropagation()}>
          <div className="mx-auto max-w-4xl">
            <DebugChatComposer detail={detail} value={composerText} onChange={setComposerText} onSend={() => { setComposerText(""); setStage((current) => Math.min(current + 1, MAX_STAGE)); }} />
          </div>
        </div>
      </div>

      <aside className={cn("min-h-0 border-l border-slate-200 bg-white", showInspector ? "block" : "hidden")} onClick={(event) => event.stopPropagation()}>
        <div className="h-full overflow-y-auto p-4">
          {stage >= 4 ? <section className="border-b border-slate-200 pb-5"><header className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800">任务规划</h3><span className="text-xs text-slate-400">{tasks.filter((task) => task.status === "done").length}/{tasks.length}</span></header><div className="space-y-1">{tasks.map((task) => <button key={task.id} type="button" disabled={!task.available} onClick={() => task.available && setSelectedAgent(task.agent)} className={cn("w-full rounded-md px-2 py-2 text-left", task.available ? "hover:bg-slate-50" : "cursor-default")}><div className="flex items-start gap-2.5"><span className="mt-0.5"><StatusIcon status={task.status} /></span><div className="min-w-0 flex-1"><p className="truncate text-[13px] text-slate-700">{task.title}</p><div className="mt-1 flex items-center justify-between gap-2"><span className={cn("truncate text-xs", task.available ? "text-blue-600" : "text-slate-400")}>{task.agent}</span><span className="shrink-0 text-[11px] text-slate-400">{statusText(task.status)}</span></div></div></div></button>)}</div></section> : null}
          <section className={cn("border-b border-slate-200 pb-5", stage >= 4 && "pt-5")}><header className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800">产出物</h3><span className="text-xs text-slate-400">{artifacts.length} 个</span></header><div className="space-y-2 text-sm text-slate-600">{artifacts.length ? artifacts.map((artifact) => <div key={artifact.id} className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-blue-500" />{artifact.name}</div>) : <p className="text-xs text-slate-400">任务交付后展示产出物</p>}</div></section>
          <section className="pt-5"><header className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800">工具</h3><span className="text-xs text-slate-400">按智能体分层</span></header><div className="space-y-4"><ToolLayer name="主智能体" items={[{ label: "需求洞察 skill", kind: "skill" }, ...(stage >= 5 ? [{ label: "子智能体调度器", kind: "tool" as const }] : [])]} />{stage >= 5 ? <><ToolLayer name="假设生成智能体" items={[{ label: AGENT_CONFIG.假设生成智能体.skill, kind: "skill" }, { label: AGENT_CONFIG.假设生成智能体.tool, kind: "tool" }]} /><ToolLayer name="文献检索智能体" items={[{ label: AGENT_CONFIG.文献检索智能体.tool, kind: "tool" }, { label: AGENT_CONFIG.文献检索智能体.skill, kind: "skill" }]} /></> : null}{stage >= 8 ? <><ToolLayer name="科研绘图智能体" items={[{ label: AGENT_CONFIG.科研绘图智能体.skill, kind: "skill" }, { label: AGENT_CONFIG.科研绘图智能体.tool, kind: "tool" }]} /><ToolLayer name="论文生成智能体" items={[{ label: AGENT_CONFIG.论文生成智能体.skill, kind: "skill" }, { label: AGENT_CONFIG.论文生成智能体.tool, kind: "tool" }]} /></> : null}{stage >= 10 ? <ToolLayer name="论文审核智能体" items={[{ label: AGENT_CONFIG.论文审核智能体.skill, kind: "skill" }, { label: AGENT_CONFIG.论文审核智能体.tool, kind: "tool" }]} /> : null}</div></section>
        </div>
      </aside>
    </div>
  );
}

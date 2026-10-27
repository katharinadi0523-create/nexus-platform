"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, Wrench } from "lucide-react";
import {
  ClarifyPager,
  type ClarifyAnswers,
} from "@/components/claw-hub-next/clarify-pager";
import {
  buildClarifySummaryEntries,
  splitExpenseNodesForClarifyFlow,
  type ExpenseConversationView,
  type ExpenseRenderNode,
} from "@/lib/mock/my-claw/expense-adapter";
import { getPersonalClawDetail } from "@/lib/mock/my-claw/personal-claw";
import { cn } from "@/lib/utils";
import { ComposerWithAgents } from "./composer-with-agents";
import { ExpenseNodeView } from "./expense-node-view";
import { PersonalConversationSidePanel, type ConversationPanelFile, type ConversationPanelTask, type PersonalPanelView } from "@/components/claw-client/personal-conversation-side-panel";

function ExpenseInspector({ view }: { view: Pick<ExpenseConversationView, "inspector"> }) {
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
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-slate-700">{task.title}</p>
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
                      <p className="truncate text-[13px] text-slate-700">{file.name}</p>
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
                    <p className="truncate text-[13px] text-slate-700">{tool.headline}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {tool.name}
                      {tool.category ? ` · ${tool.category}` : ""}
                    </p>
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

export function ExpenseChatPanel({
  highlightedMessageId,
  sessionId = "expense-demo",
  personalMode = false,
  workspacePanelOpen = false,
  workspaceView = "summary",
  workspacePanelWidth = 280,
  conversationTitle,
  onWorkspaceViewChange,
  onWorkspacePanelWidthChange,
  onOpenWorkspace,
  onCloseWorkspace,
}: {
  highlightedMessageId?: string | null;
  sessionId?: string;
  personalMode?: boolean;
  workspacePanelOpen?: boolean;
  workspaceView?: PersonalPanelView;
  workspacePanelWidth?: number;
  conversationTitle?: string;
  onWorkspaceViewChange?: (view: PersonalPanelView) => void;
  onWorkspacePanelWidthChange?: (width: number) => void;
  onOpenWorkspace?: () => void;
  onCloseWorkspace?: () => void;
}) {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const flow = useMemo(() => splitExpenseNodesForClarifyFlow(), []);
  const summaryStressMode = sessionId === "summary-stress-demo";
  const summaryTasks = useMemo(() => {
    const baseTasks = flow.inspector.tasks.map((task): ConversationPanelTask => ({ id: task.id, title: task.title, status: task.status }));
    if (!summaryStressMode) return baseTasks;
    const taskTitles = [
      "汇总差旅申请人与出行信息",
      "识别机票行程单关键字段",
      "核对酒店入住日期与发票金额",
      "校验打车发票时间和城市",
      "匹配公司差旅标准及报销上限",
      "补齐费用归属部门与成本中心",
      "生成报销明细与费用分类",
      "检查重复票据和异常金额",
      "整理缺失材料与补充说明",
      "生成 ERP 报销单草稿",
      "复核审批人和组织信息",
      "汇总审批附件并检查格式",
      "生成报销核对报告",
      "整理本次会话交付文件",
      "检查最终材料完整性",
      "归档本次报销处理结果",
    ];
    const tasks = taskTitles.map((title, index): ConversationPanelTask => ({
      id: `summary-demo-task-${index + 1}`,
      title,
      status: index < 8 ? "done" : index === 8 ? "running" : "pending",
    }));
    const subagents = [
      {
        id: "summary-demo-agent-invoice",
        title: "子智能体：票据字段抽取",
        updatedAt: "2026-10-27T10:01:00.000Z",
        durationLabel: "15s",
        prompt: "请读取机票、酒店和打车票据，抽取日期、金额、抬头及城市字段，并标出无法确认的内容。",
        traceEvents: [
          { id: "thought-1", kind: "thought", title: "字段识别与校验", duration: "3.4 秒", status: "done", content: "我会逐份读取票据，统一日期和金额格式，并交叉核对行程日期与消费城市。", expandedByDefault: true },
          { id: "skill-1", kind: "skill", title: "invoiceFieldExtract", status: "done", content: "已抽取 8 项票据字段，2 项待人工确认。" },
          { id: "plugin-1", kind: "plugin", title: "票据解析", status: "done", content: "已解析 3 份附件。" },
        ],
        recordContent: "# 票据字段抽取\n\n状态：已完成\n\n- 读取机票、酒店和打车票据\n- 抽取日期、金额、抬头及城市字段\n- 将结构化结果交给报销核对任务\n",
      },
      {
        id: "summary-demo-agent-policy",
        title: "子智能体：差旅制度核验",
        updatedAt: "2026-10-27T10:03:00.000Z",
        prompt: "请核对本次出差的住宿与交通费用是否符合公司差旅标准，并指出需要人工确认的例外项。",
        traceEvents: [
          { id: "thought-1", kind: "thought", title: "核对适用规则", duration: "3.4 秒", status: "done", content: "我会先确认出差城市、职级和行程日期，再匹配对应的住宿与交通限额。", expandedByDefault: true },
          { id: "thought-2", kind: "thought", title: "整理例外情况", duration: "1.2 秒", status: "done", content: "发现酒店费用需要结合入住日期和城市等级进一步核验。" },
          { id: "skill-1", kind: "skill", title: "travelPolicyLookup", status: "running", content: "正在检索适用的差旅标准…", expandedByDefault: true },
          { id: "plugin-1", kind: "plugin", title: "差旅制度查询", status: "running", content: "正在读取组织差旅政策…", expandedByDefault: true },
        ],
        recordContent: "# 差旅制度核验\n\n状态：进行中\n\n- 查询适用的差旅标准\n- 对照住宿与交通费用上限\n- 标记需要人工确认的例外项\n",
      },
      {
        id: "summary-demo-agent-quality",
        title: "子智能体：材料完整性检查",
        updatedAt: "2026-10-27T09:58:00.000Z",
        durationLabel: "15s",
        prompt: "请检查报销申请信息和附件是否齐全，整理缺失材料与格式异常。",
        traceEvents: [
          { id: "thought-1", kind: "thought", title: "检查材料完整性", duration: "2.8 秒", status: "done", content: "我会根据报销清单检查申请字段、附件可读性和文件类型，并汇总缺失项。", expandedByDefault: true },
          { id: "skill-1", kind: "skill", title: "expenseMaterialCheck", status: "done", content: "材料检查完成，缺少一项费用归属说明。" },
          { id: "plugin-1", kind: "plugin", title: "附件读取", status: "done", content: "已检查 6 份附件。" },
        ],
        recordContent: "# 材料完整性检查\n\n状态：已完成\n\n- 检查报销申请字段\n- 检查附件可读性和文件类型\n- 输出缺失材料清单\n",
      },
    ].map((agent, index): ConversationPanelTask => ({ ...agent, kind: "subagent", status: index === 1 ? "running" : "done" }));
    return [...tasks, ...subagents];
  }, [flow.inspector.tasks, summaryStressMode]);
  const summaryOutputs = useMemo(() => {
    const baseOutputs: ConversationPanelFile[] = flow.inspector.files.map((file, index) => ({
      id: `expense-output-${index}`,
      name: file.name,
      path: `对话产出 / ${conversationTitle ?? "当前会话"} / ${file.name}`,
      size: file.size,
      source: "本次对话",
      status: "new",
      ...(summaryStressMode ? { updatedAt: Date.parse("2026-10-26T00:00:00.000Z") - index * 60_000 } : {}),
    }));
    if (!summaryStressMode) return baseOutputs;
    const demoFiles = [
      ["差旅费用汇总.xlsx", "32 KB"],
      ["报销明细核对表.xlsx", "48 KB"],
      ["票据识别结果.csv", "12 KB"],
      ["差旅政策匹配说明.docx", "96 KB"],
      ["报销申请草稿-v2.pdf", "286 KB"],
      ["异常费用复核记录.md", "8 KB"],
      ["酒店住宿对账单.xlsx", "24 KB"],
      ["交通费用分类结果.csv", "16 KB"],
      ["审批附件目录.docx", "42 KB"],
      ["报销材料完整性检查.pdf", "154 KB"],
      ["成本中心匹配结果.xlsx", "28 KB"],
      ["待补充材料清单.md", "6 KB"],
      ["本次报销处理摘要.docx", "38 KB"],
      ["归档文件索引.csv", "10 KB"],
    ];
    return [...baseOutputs, ...demoFiles.map(([name, size], index) => ({
      id: `summary-demo-output-${index + 1}`,
      name,
      path: `对话产出 / ${conversationTitle ?? "长清单摘要样例（演示）"} / ${name}`,
      size,
      source: "本次对话",
      status: "new" as const,
      updatedAt: Date.parse("2026-10-27T10:00:00.000Z") - index * 60_000,
    }))];
  }, [conversationTitle, flow.inspector.files, summaryStressMode]);
  const summaryMaterials = useMemo(() => {
    const baseMaterials = [...flow.prefix, ...flow.suffix].flatMap((node) => node.type === "user" ? (node.timeline.message.attachments ?? []).map((name, index) => ({ id: `history:${sessionId}:${node.key}:${index}`, name, source: "upload" as const })) : []);
    if (!summaryStressMode) return baseMaterials;
    const demoNames = [
      "差旅申请单-补充页.pdf",
      "住宿发票-第二晚.jpg",
      "出租车电子发票-返程.pdf",
      "会议日程截图.png",
      "出差审批记录.docx",
      "费用归属说明.md",
      "银行卡支付凭证.jpg",
      "酒店订单确认单.pdf",
      "交通行程补充说明.txt",
      "报销人信息确认表.xlsx",
      "成本中心编码清单.csv",
      "发票查验结果.pdf",
    ];
    const workspaceReferences = [
      { id: "personal-reference-travel-policy", name: "差旅报销标准-2026.pdf", path: "常用资料 / 差旅报销标准-2026.pdf", sizeLabel: "480 KB" },
      { id: "personal-reference-travel-expense-template", name: "上海差旅费用明细样表.xlsx", path: "常用资料 / 上海差旅费用明细样表.xlsx", sizeLabel: "72 KB" },
      { id: "personal-reference-hotel-checklist", name: "酒店发票核对清单.md", path: "常用资料 / 酒店发票核对清单.md", sizeLabel: "9 KB" },
    ];
    return [
      ...baseMaterials,
      ...demoNames.map((name, index) => ({ id: `summary-demo-material-${index + 1}`, name, source: "upload" as const })),
      ...workspaceReferences.map((file) => ({ id: `history:workspace:${file.id}`, name: file.name, source: "workspace" as const, path: file.path, sizeLabel: file.sizeLabel })),
    ];
  }, [flow.prefix, flow.suffix, sessionId, summaryStressMode]);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [phase, setPhase] = useState<"clarify" | "running">("clarify");
  const [answers, setAnswers] = useState<ClarifyAnswers | null>(null);
  /** How many post-clarify timeline nodes are revealed (summary + suffix). */
  const [runCursor, setRunCursor] = useState(0);

  const summaryNode: ExpenseRenderNode | null = useMemo(() => {
    if (!answers) return null;
    return {
      key: "clarify-summary-live",
      type: "clarify_summary",
      entries: buildClarifySummaryEntries(answers),
    };
  }, [answers]);

  const runNodes = useMemo(() => {
    if (!summaryNode) return [];
    return [summaryNode, ...flow.suffix];
  }, [summaryNode, flow.suffix]);

  const visibleNodes = useMemo(() => {
    if (phase === "clarify") return flow.prefix;
    return [...flow.prefix, ...runNodes.slice(0, Math.max(runCursor, 0))];
  }, [flow.prefix, phase, runNodes, runCursor]);

  useEffect(() => {
    if (phase !== "running") return;
    const revealed = runNodes.slice(0, Math.max(runCursor, 0));
    const actionKeys = revealed
      .filter(
        (node) =>
          node.type === "action" ||
          node.type === "plan" ||
          node.type === "todo" ||
          node.type === "destructive"
      )
      .map((node) => node.key);
    const lastKey = actionKeys[actionKeys.length - 1];
    if (!lastKey) return;
    setExpanded({ [lastKey]: true });
  }, [phase, runCursor, runNodes]);

  useEffect(() => {
    if (phase !== "running") return;

    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (event.key === "ArrowRight") {
        setRunCursor((current) => Math.min(current + 1, runNodes.length));
      }
      if (event.key === "ArrowLeft") {
        setRunCursor((current) => Math.max(current - 1, 1));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, runNodes.length]);

  function handleClarifyComplete(nextAnswers: ClarifyAnswers) {
    setAnswers(nextAnswers);
    setPhase("running");
    // Reveal summary first; further nodes advance by click / →
    setRunCursor(1);
  }

  function advanceRun() {
    if (phase !== "running") return;
    setRunCursor((current) => Math.min(current + 1, runNodes.length));
  }

  return (
    <div className="flex h-full min-h-0">
      <div
        className="flex min-w-0 flex-1 cursor-pointer flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]"
        onClick={() => advanceRun()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-4xl space-y-4">
            {visibleNodes.map((node) => {
              const messageId =
                node.type === "user" || node.type === "output"
                  ? node.timeline.message.id
                  : undefined;
              return (
                <div
                  key={node.key}
                  id={messageId ? `personal-message-${messageId}` : undefined}
                  className={cn(
                    "rounded-xl transition-shadow duration-300",
                    messageId === highlightedMessageId &&
                      "ring-2 ring-[#8fb5f6] ring-offset-4 ring-offset-[#f8f9fb]",
                  )}
                >
                  <ExpenseNodeView
                    node={node}
                    expanded={Boolean(expanded[node.key])}
                    onToggle={() =>
                      setExpanded((current) => ({
                        ...current,
                        [node.key]: !current[node.key],
                      }))
                    }
                  />
                </div>
              );
            })}

            {phase === "clarify" ? (
              <div onClick={(event) => event.stopPropagation()}>
                <ClarifyPager
                  questions={flow.clarifyQuestions}
                  onComplete={handleClarifyComplete}
                />
              </div>
            ) : null}
          </div>
        </div>
        <div
          className="shrink-0 px-4 py-4 lg:px-8 lg:py-5"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto w-full max-w-4xl">
            <ComposerWithAgents
              detail={detail}
              modelScopeKey={sessionId}
              personalMode={personalMode}
              onOpenWorkspace={onOpenWorkspace}
              value={draft}
              onChange={setDraft}
              onSend={() => {
                setDraft("");
                advanceRun();
              }}
            />
          </div>
        </div>
      </div>
      {personalMode ? (
        <PersonalConversationSidePanel
          open={workspacePanelOpen}
          personalMode
          view={workspaceView}
          panelWidth={workspacePanelWidth}
          onPanelWidthChange={(width) => onWorkspacePanelWidthChange?.(width)}
          onViewChange={(nextView) => onWorkspaceViewChange?.(nextView)}
          onClose={() => onCloseWorkspace?.()}
          outputs={summaryOutputs}
          tasks={summaryTasks}
          conversationTitle={conversationTitle}
          historicalMaterials={summaryMaterials}
        />
      ) : <ExpenseInspector view={{ inspector: flow.inspector }} />}
    </div>
  );
}

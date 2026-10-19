import type {
  ClarifyAnswers,
  ClarifyQuestion,
} from "@/components/claw-hub-next/clarify-pager";
import { formatClarifyAnswer } from "@/lib/claw-clarify";
import type { MyClawSessionListItem } from "./types";

/**
 * 基础使用端的澄清交互示例：
 * - 高影响信息（复盘读者、侧重点）：未回答时结合执行进展按合理方式推进，并说明假设；
 * - 红线操作参数（以用户名义对外发送的对象、渠道）：未回答时不执行发送，说明受阻。
 */
export type ClarifyDemoRisk = "low" | "redline";

export interface ClarifyDemoScenario {
  sessionId: string;
  risk: ClarifyDemoRisk;
  userMessage: string;
  /** Claw 发起澄清前的思考说明。 */
  thinking: string;
  questions: ClarifyQuestion[];
}

/**
 * 澄清收口后的执行过程：普通文字消息与执行步骤按顺序展示。
 * 做假设时以普通文字说明后继续执行；受阻时执行到受阻前一步，再以普通文字说明。
 */
export type ClarifyDemoStep =
  | { kind: "text"; content: string; attachments?: string[] }
  | { kind: "action"; title: string; logs: string[] };

export const CLAW_CLIENT_CLARIFY_SESSIONS: MyClawSessionListItem[] = [
  {
    id: "task-clarify-001",
    title: "Q3 项目复盘文档整理",
    kind: "clarify_demo",
    pinned: true,
    updatedAt: "2026-10-17T09:30:00.000Z",
    preview: "等待确认：复盘读者与侧重点。",
  },
  {
    id: "task-clarify-002",
    title: "复盘结论发送项目组",
    kind: "clarify_demo",
    pinned: true,
    updatedAt: "2026-10-17T09:20:00.000Z",
    preview: "等待确认：发送对象与发送渠道。",
  },
];

const SCENARIOS: Record<string, ClarifyDemoScenario> = {
  "task-clarify-001": {
    sessionId: "task-clarify-001",
    risk: "low",
    userMessage: "帮我把 Q3 项目复盘整理成一份文档，素材都在「Q3 复盘」文件夹里。",
    thinking:
      "已读取「Q3 复盘」文件夹中的 6 份材料。复盘的读者和侧重点决定整份文档的方向，材料中无法确定，先向你确认 2 个问题。",
    questions: [
      {
        id: "q-audience",
        questionKey: "audience",
        question: "这份复盘主要给谁看？",
        options: [
          { label: "项目组内部", value: "team" },
          { label: "管理层汇报", value: "management" },
          { label: "客户", value: "client" },
        ],
        freeInputLabel: "自定义回答",
      },
      {
        id: "q-focus",
        questionKey: "focus",
        question: "复盘重点放在哪方面？",
        options: [
          { label: "质量与问题", value: "quality" },
          { label: "进度与交付", value: "delivery" },
          { label: "成本与资源", value: "cost" },
        ],
        freeInputLabel: "自定义回答",
      },
    ],
  },
  "task-clarify-002": {
    sessionId: "task-clarify-002",
    risk: "redline",
    userMessage: "把复盘结论发给项目组吧。",
    thinking:
      "这一步会以你的名义对外发送消息，发出后无法撤回。发送对象和渠道是这次发送的参数，无法从上下文唯一确定，需要先向你确认。",
    questions: [
      {
        id: "q-recipient",
        questionKey: "recipient",
        question: "复盘结论发给谁？",
        options: [
          { label: "Q3 项目组群（23 人）", value: "group" },
          { label: "仅项目负责人", value: "owner" },
          { label: "先发给我预览，暂不对外发送", value: "preview" },
        ],
        freeInputLabel: "自定义回答",
      },
      {
        id: "q-channel",
        questionKey: "channel",
        question: "通过什么渠道发送？",
        options: [
          { label: "飞书消息", value: "feishu" },
          { label: "邮件", value: "email" },
        ],
        freeInputLabel: "自定义回答",
      },
    ],
  },
};

export function getClarifyDemoScenario(sessionId: string): ClarifyDemoScenario | undefined {
  return SCENARIOS[sessionId];
}

function answerLabel(
  scenario: ClarifyDemoScenario,
  key: string,
  answers: ClarifyAnswers,
): string | null {
  const question = scenario.questions.find((item) => item.questionKey === key);
  if (!question) return null;
  return formatClarifyAnswer(question, answers[key]);
}

function assumptionText(lines: string[]): string {
  return lines.map((line, index) => `${index + 1}. ${line}`).join("\n");
}

/**
 * 示例执行过程：
 * - 已回答的按回答执行；
 * - 未回答的高影响信息（读者、侧重点）：结合已执行的进展按合理方式推进，先用普通文字说明假设再执行；
 * - 未回答的红线操作参数（发送对象、发送渠道）：不执行发送，完成不依赖它的部分后用普通文字说明受阻。
 */
export function buildClarifyDemoSteps(
  scenario: ClarifyDemoScenario,
  answers: ClarifyAnswers,
): ClarifyDemoStep[] {
  if (scenario.risk === "low") {
    const audience = answerLabel(scenario, "audience", answers);
    const focus = answerLabel(scenario, "focus", answers);
    // 未回答时不直接套用推荐项，而是结合已读取的材料判断合理的推进方式。
    const finalAudience = audience ?? "项目组内部";
    const finalFocus = focus ?? "质量与问题";
    const assumptions: string[] = [];
    if (!audience) {
      assumptions.push("读者：材料以周报和问题清单为主，更适合项目组内部复盘，我按「项目组内部」组织。");
    }
    if (!focus) {
      assumptions.push("侧重点：问题清单和客户反馈占了材料的大部分，我把重点放在「质量与问题」上。");
    }
    const steps: ClarifyDemoStep[] = [];
    if (assumptions.length > 0) {
      const missing = [!audience && "读者", !focus && "侧重点"].filter(Boolean).join("和");
      steps.push({
        kind: "text",
        content: `${missing}你没有回答，我根据已读取的材料按以下方式推进：\n${assumptionText(assumptions)}\n如果需要改成管理层汇报或其他侧重点，告诉我即可。`,
      });
    }
    steps.push(
      {
        kind: "action",
        title: "整理「Q3 复盘」素材",
        logs: ["按读者与侧重点筛选目标拆解、周报、问题清单和客户反馈中的内容"],
      },
      {
        kind: "action",
        title: "生成复盘文档",
        logs: ["目标达成", "关键问题", "原因分析", "Q4 改进项"],
      },
      {
        kind: "text",
        content: `复盘初稿已生成（读者：${finalAudience}；侧重点：${finalFocus}），包括目标达成、关键问题、原因分析和 Q4 改进项四部分。${
          assumptions.length > 0 ? "读者和侧重点都可以再调整，告诉我即可。" : ""
        }`,
        attachments: ["Q3 项目复盘_初稿"],
      },
    );
    return steps;
  }

  const recipient = answerLabel(scenario, "recipient", answers);
  const channel = answerLabel(scenario, "channel", answers);
  const prepare: ClarifyDemoStep = {
    kind: "action",
    title: "整理复盘结论",
    logs: ["从《Q3 项目复盘》提取 4 条结论和 3 项改进", "生成待发送消息草稿"],
  };
  if (answers.recipient === "preview") {
    return [
      prepare,
      { kind: "text", content: "草稿已发给你预览，没有对外发送。确认无误后告诉我发送对象，我再发送。" },
    ];
  }
  // 发送对象与发送渠道都是红线操作（以你的名义对外发送）的参数，任一未回答都不发送。
  const missing = [!recipient && "发送对象", !channel && "发送渠道"].filter(Boolean) as string[];
  if (missing.length > 0) {
    const asks = [
      !recipient && "发给谁（Q3 项目组群、仅项目负责人，或先发给你预览）",
      !channel && "用什么渠道发（飞书消息或邮件）",
    ].filter(Boolean);
    return [
      prepare,
      {
        kind: "text",
        content: `复盘结论还没有发送。\n${missing.join("和")}你还没有确认。以你的名义发消息，发出后无法撤回，我不会替你决定。\n待发送的草稿已经准备好，告诉我${asks.join("，以及")}，我就发送。`,
      },
    ];
  }
  return [
    prepare,
    { kind: "action", title: `发送${channel}`, logs: [`发送给「${recipient}」`] },
    { kind: "text", content: `复盘结论已通过${channel}发送给「${recipient}」。` },
  ];
}

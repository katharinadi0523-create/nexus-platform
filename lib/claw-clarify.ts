import type {
  ClarifyAnswerValue,
  ClarifyAnswers,
  ClarifyQuestion,
} from "@/components/claw-hub-next/clarify-pager";

/**
 * Claw 澄清超时规则：提问 5 分钟内没有有效操作时自动继续（参考智谱 ZCode，不提供关闭选项）。
 *
 * - 0–60s：静默等待，只显示静态「等待确认」；
 * - 60–300s：可见进度条线性收缩；最后 60s 在问答面板显示秒数；
 * - 300s：以空答案收口，Claw 收到「用户未回答」并按规则继续；
 * - 用户首次有效操作后永久暂停本次计时（snoozed）。
 *
 * 生产常量固定；演示环境可传入 clockScale 缩短等待，不改变产品值。
 */
export const CLARIFY_GRACE_MS = 60_000;
export const CLARIFY_DEADLINE_MS = 300_000;
export const CLARIFY_FINAL_COUNTDOWN_MS = 60_000;

export type ClarifyAutoResolution =
  | {
      state: "timed";
      startedAt: number;
      visibleAt: number;
      deadlineAt: number;
      clockScale: number;
    }
  | {
      state: "snoozed";
      startedAt: number;
      snoozedAt: number;
    };

export type ClarifyAutoResolutionPhase =
  | "hidden_grace"
  | "visible_countdown"
  | "expired"
  | "snoozed";

export interface ClarifyAutoResolutionProjection {
  phase: ClarifyAutoResolutionPhase;
  /** 可见进度条填充比例，1 → 0；非计时阶段为 1。 */
  fillRatio: number;
  /** 最后一分钟显示的秒数（59..1），其他阶段为 null。 */
  secondsLeft: number | null;
}

export function createClarifyAutoResolution(
  startedAt: number,
  clockScale = 1,
): ClarifyAutoResolution {
  const scale = clockScale > 0 ? clockScale : 1;
  return {
    state: "timed",
    startedAt,
    visibleAt: startedAt + CLARIFY_GRACE_MS / scale,
    deadlineAt: startedAt + CLARIFY_DEADLINE_MS / scale,
    clockScale: scale,
  };
}

export function snoozeClarifyAutoResolution(
  autoResolution: ClarifyAutoResolution,
  now: number,
): ClarifyAutoResolution {
  // 幂等：已暂停的提问保持原状。
  if (autoResolution.state !== "timed") return autoResolution;
  if (now >= autoResolution.deadlineAt) return autoResolution;
  return {
    state: "snoozed",
    startedAt: autoResolution.startedAt,
    snoozedAt: now,
  };
}

export function projectClarifyAutoResolution(
  autoResolution: ClarifyAutoResolution,
  now: number,
): ClarifyAutoResolutionProjection {
  if (autoResolution.state === "snoozed") {
    return { phase: "snoozed", fillRatio: 1, secondsLeft: null };
  }
  const { visibleAt, deadlineAt, clockScale } = autoResolution;
  if (now >= deadlineAt) {
    return { phase: "expired", fillRatio: 0, secondsLeft: null };
  }
  if (now < visibleAt) {
    return { phase: "hidden_grace", fillRatio: 1, secondsLeft: null };
  }
  const remaining = deadlineAt - now;
  const fillRatio = Math.max(0, Math.min(1, remaining / (deadlineAt - visibleAt)));
  const finalWindow = CLARIFY_FINAL_COUNTDOWN_MS / clockScale;
  // 显示「真实产品时间」的秒数，演示加速时按比例换算，范围 59..1。
  const displaySeconds = Math.ceil((remaining * clockScale) / 1000);
  const secondsLeft =
    remaining < finalWindow ? Math.min(59, Math.max(1, displaySeconds)) : null;
  return { phase: "visible_countdown", fillRatio, secondsLeft };
}

/**
 * 一次澄清的两种结束方式。每题都必须作答才能提交，没有「部分回答」，也没有「暂不回答」。
 */
export type ClarifyResolutionMode =
  /** 用户回答了全部问题（选项或自定义回答）。 */
  | "answered"
  /** 5 分钟内无有效操作，自动以空答案继续。 */
  | "auto_continued";

export function formatClarifyAnswer(
  question: ClarifyQuestion,
  answer: ClarifyAnswerValue | undefined,
): string | null {
  if (answer === undefined) return null;
  if (typeof answer === "object") return answer.text;
  return question.options.find((option) => option.value === answer)?.label ?? answer;
}

const UNANSWERED_RULES =
  "不要把未回答当作拒绝，也不要当作选择了推荐项或获得了授权，不要编造用户偏好。" +
  "若未回答的问题是红线操作（以用户名义对外发送或发布、删除覆盖等不可逆操作、交易支付）的参数，" +
  "不要执行该操作，先完成不依赖它的部分，再在回复中说明受阻原因和需要用户补充的信息；" +
  "其余未回答的问题，结合已执行的进展按合理方式推进：先用普通文字说明所作假设并告知用户可随时修改，再继续执行。";

/**
 * Claw 在澄清工具返回中收到的模型可见文本。
 */
export function buildClarifyToolResult(
  questions: ClarifyQuestion[],
  answers: ClarifyAnswers,
  mode: ClarifyResolutionMode,
): string {
  const answeredLines = questions
    .map((question) => {
      const text = formatClarifyAnswer(question, answers[question.questionKey]);
      return text === null ? null : `「${question.question}」=「${text}」`;
    })
    .filter((line): line is string => line !== null);

  if (mode === "answered") {
    return `用户已回答全部问题：${answeredLines.join("；")}。请基于这些回答继续执行。`;
  }
  return `用户在 5 分钟内没有回答这些问题，已自动继续。${UNANSWERED_RULES}`;
}

import {
  type ClawDetailData,
  createClawAgentMdFile,
  getClawDetail,
} from "@/lib/mock/claw-hub-next";

export const PERSONAL_CLAW_ID = "my-claw-personal";

const OFFICE_CLAW_SEED_ID = "claw-office-shrimp";

const PERSONAL_AGENT_MD = `# 我的Claw

## 身份
- 个人办公助手 Claw，承载日常会话、智能体召唤与自动化任务

## 目标
- 协助完成差旅报销、经营整理、科研协作等个人工作流
- 在边界内推进任务并沉淀可复用上下文

## 服务对象
- 当前登录用户及其协作场景

## 工作方式
- 稳定、克制、清晰；先理解意图，再给出可执行结果
- 支持召唤企业智能体与科研多智能体协作
- 对高风险操作保持审慎，未确认信息显式标注

## 行为边界
- 不直接执行不可逆的外部写入，除非用户确认
- 对外输出需说明依据与建议动作
- 不越权代替人工审批或最终决策
`;

/**
 * Personal Claw detail fixture for `/my-claw` chat, settings, and files.
 * Seeded from 办公虾 (差旅报销), then remapped to「我的Claw」with Agent.md only.
 */
export function getPersonalClawDetail(): ClawDetailData {
  const base = getClawDetail(OFFICE_CLAW_SEED_ID);
  if (!base) {
    throw new Error(
      `Failed to resolve Claw detail for seed "${OFFICE_CLAW_SEED_ID}"`
    );
  }

  return {
    ...base,
    overview: {
      ...base.overview,
      id: PERSONAL_CLAW_ID,
      name: "我的Claw",
      type: "办公型",
      scene: "个人办公",
      owner: "个人",
      status: "运行中",
      publishStatus: "已发布",
      model: "Qwen3-32B",
      summary: "个人 Claw 工作台：会话、智能体召唤、技能/插件与自动化任务。",
      updatedAt: "2026-07-26 09:00",
      updatedBy: "我",
      version: "v1.0.0",
      createdAt: "2026-04-01 10:00",
    },
    coreFiles: [createClawAgentMdFile(PERSONAL_AGENT_MD)],
  };
}

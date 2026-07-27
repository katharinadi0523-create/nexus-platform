import type { AgentActor } from "./types";
import { CURRENT_USER_ID } from "./workspaces";

export const PROJECT_CONVERSATION_ACTORS: AgentActor[] = [
  {
    id: "actor-ruonan-claw",
    type: "personal_claw",
    name: "邸若楠的 Claw",
    description: "邸若楠的个人助手",
    ownerUserId: CURRENT_USER_ID,
    runtimeStatus: "online",
    capabilitySummary: ["日常问答", "资料整理"],
    lastHeartbeatAt: "2026-07-27T09:58:00+08:00",
  },
  {
    id: "actor-linxiao-claw",
    type: "personal_claw",
    name: "林晓的 Claw",
    description: "林晓的个人设计助手",
    ownerUserId: "user-linxiao",
    runtimeStatus: "offline",
    capabilitySummary: ["界面设计", "原型标注"],
    lastHeartbeatAt: "2026-07-26T18:20:00+08:00",
  },
  {
    id: "actor-litao-claw",
    type: "personal_claw",
    name: "李涛的 Claw",
    description: "李涛的个人研发助手",
    ownerUserId: "user-litao",
    runtimeStatus: "online",
    capabilitySummary: ["后端实现", "接口联调"],
    lastHeartbeatAt: "2026-07-27T09:40:00+08:00",
  },
  {
    id: "actor-zhouning-claw",
    type: "personal_claw",
    name: "周宁的 Claw",
    description: "周宁的个人测试助手",
    ownerUserId: "user-zhouning",
    runtimeStatus: "busy",
    capabilitySummary: ["用例生成", "回归验证"],
    lastHeartbeatAt: "2026-07-27T09:55:00+08:00",
  },
  {
    id: "actor-req-analysis",
    workspaceId: "ws-agentfoundry",
    type: "platform_claw",
    name: "需求分析 Claw",
    description: "拆解业务需求、识别范围与风险",
    runtimeStatus: "online",
    capabilitySummary: ["需求拆解", "范围确认", "风险识别"],
    lastHeartbeatAt: "2026-07-27T10:00:00+08:00",
  },
  {
    id: "actor-product-design",
    workspaceId: "ws-agentfoundry",
    type: "platform_claw",
    name: "产品设计 Claw",
    description: "产出 PRD、信息架构与交互说明",
    runtimeStatus: "online",
    capabilitySummary: ["PRD 撰写", "信息架构", "交互说明"],
    lastHeartbeatAt: "2026-07-27T09:59:00+08:00",
  },
  {
    id: "actor-coding",
    workspaceId: "ws-agentfoundry",
    type: "platform_claw",
    name: "Coding Claw",
    description: "实现功能、提交代码并产出 Preview",
    runtimeStatus: "online",
    capabilitySummary: ["代码实现", "Git 提交", "Preview 部署"],
    lastHeartbeatAt: "2026-07-27T10:05:00+08:00",
  },
  {
    id: "actor-auto-test",
    workspaceId: "ws-agentfoundry",
    type: "platform_claw",
    name: "自动化测试 Claw",
    description: "冒烟与回归测试执行助手",
    runtimeStatus: "online",
    capabilitySummary: ["冒烟测试", "回归报告"],
    lastHeartbeatAt: "2026-07-27T09:50:00+08:00",
  },
  {
    id: "actor-research-group",
    workspaceId: "ws-research",
    type: "multi_agent_group",
    name: "科研多智能体",
    description: "科研文献与实验编排组",
    runtimeStatus: "online",
    capabilitySummary: ["文献综述", "实验设计"],
    lastHeartbeatAt: "2026-07-27T09:30:00+08:00",
  },
];

export function getActorById(id: string) {
  return PROJECT_CONVERSATION_ACTORS.find((item) => item.id === id);
}

export function actorTypeLabel(type: AgentActor["type"]) {
  switch (type) {
    case "personal_claw":
      return "个人 Claw";
    case "platform_claw":
      return "平台 Claw";
    case "multi_agent_group":
      return "多智能体组";
  }
}

export function runtimeStatusLabel(status: AgentActor["runtimeStatus"]) {
  switch (status) {
    case "online":
      return "Online";
    case "busy":
      return "Busy";
    case "offline":
      return "Offline";
    case "degraded":
      return "Degraded";
  }
}

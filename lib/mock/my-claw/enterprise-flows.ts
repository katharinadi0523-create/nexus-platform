/**
 * Enterprise session flow presets ported from 会话交互 `data.js` → `enterpriseFlowPresets`.
 * Used by the my-claw enterprise session host to render Nexus timeline mocks.
 */

import type {
  ConversationTimelineActionStatus,
  ConversationTimelineItem,
} from "@/components/claw-hub-next/detail/utils";
import type { MyClawSessionListItem } from "./types";

export type EnterpriseFlowKey =
  | "default"
  | "cloudFactoryOps"
  | "prdWriter"
  | "marketInsight"
  | "vibeCoder"
  | "contentCreator"
  | "seniorDev"
  | "seniorProjectManager";

/** Mirrors prototype `session.phase` (0–6) in `app.js` `startEnterpriseRun`. */
export const ENTERPRISE_FLOW_MAX_PHASE = 6;

export interface EnterprisePlanItem {
  title: string;
  tool: string;
  eta: string;
}

export interface EnterpriseArtifact {
  name: string;
  path: string;
  size: string;
}

export interface EnterpriseStageIdentity {
  agentName: string;
  agentId: string;
  subject: string;
  issuer: string;
  fingerprint: string;
  validUntil: string;
  proof: string;
}

export interface EnterpriseSubagentTask {
  title: string;
  detail: string;
  status: "success" | "running" | "pending" | "failed";
  elapsed?: string;
  toolWhitelist?: string[];
  contextPackage?: string[];
  permissions?: string[];
}

export interface EnterpriseSubagentGroup {
  kind: "subagent_group";
  id: string;
  principalAgent: string;
  principalAction: string;
  tasks: EnterpriseSubagentTask[];
  delegation?: {
    token: string;
    inheritedPermissions: string;
    audit: string;
  };
}

export interface EnterpriseSecurityDetection {
  layer: string;
  result: string;
}

export interface EnterpriseSecuritySpotlight {
  source: string;
  text: string;
}

export interface EnterpriseSecurityAlert {
  level: "critical" | "high" | "medium" | "low";
  riskType: string;
  title: string;
  summary: string;
  detections: EnterpriseSecurityDetection[];
  spotlight: EnterpriseSecuritySpotlight[];
  action: string;
}

export interface EnterpriseFlowStage {
  title: string;
  logs: string[];
  identity?: EnterpriseStageIdentity;
  items?: EnterpriseSubagentGroup[];
  alerts?: EnterpriseSecurityAlert[];
}

export interface EnterpriseFlowPreset {
  defaultQuery: string;
  recentTaskTitle: string;
  planningText: string;
  planItems: EnterprisePlanItem[];
  stages: EnterpriseFlowStage[];
  artifacts: EnterpriseArtifact[];
  finalMessage: string;
}

/** Seed session id → preset (title-aligned where the demo list has a clear match). */
export const ENTERPRISE_SESSION_PRESET_BY_ID: Record<string, EnterpriseFlowKey> =
  {
    "task-002": "vibeCoder",
    "task-003": "marketInsight",
    "task-004": "contentCreator",
    "task-005": "default",
    "task-006": "contentCreator",
    "task-007": "seniorDev",
    "task-008": "default",
  };

export const ENTERPRISE_FLOW_PRESETS: Record<
  EnterpriseFlowKey,
  EnterpriseFlowPreset
> = {
  default: {
    defaultQuery:
      "请围绕当前任务目标，给我一版结构清楚、可直接落地的执行方案与结果草稿。",
    recentTaskTitle: "生成企业智能体处理结果",
    planningText:
      "收到，我会先理解目标和约束，再组织资料、整理方案，最后输出一版可复用的结果草稿。",
    planItems: [
      { title: "理解任务目标与约束", tool: "任务理解", eta: "约 10 秒" },
      { title: "检索相关资料并提炼重点", tool: "资料整理", eta: "约 15 秒" },
      { title: "生成结果草稿与交付建议", tool: "内容生成", eta: "约 20 秒" },
    ],
    stages: [
      {
        title: "任务理解与拆解",
        logs: [
          "已识别任务目标、输入上下文与预期输出。",
          "已拆成可执行步骤并准备进入资料处理阶段。",
        ],
      },
      {
        title: "资料整合与方案生成",
        logs: [
          "已整理关键信息并形成结构化提纲。",
          "正在生成可直接交付的结果草稿。",
        ],
      },
    ],
    artifacts: [
      {
        name: "企业智能体结果草稿.docx",
        path: "/ClawAgent/企业智能体/企业智能体结果草稿.docx",
        size: "146 KB",
      },
    ],
    finalMessage: "已生成结果草稿与下一步建议，可直接继续补充或导出。",
  },
  cloudFactoryOps: {
    defaultQuery:
      "请帮我梳理当前迭代中阻塞交付的故事、任务和缺陷，输出优先级、负责人和建议动作。",
    recentTaskTitle: "生成云码工厂维护清单",
    planningText:
      "收到，我会先聚合当前迭代的故事、任务和缺陷，再识别阻塞关系与责任人，最后生成一版可确认的维护清单。",
    planItems: [
      {
        title: "聚合当前迭代的故事、任务、缺陷",
        tool: "云码工厂维护 Skill",
        eta: "约 12 秒",
      },
      { title: "识别阻塞关系与责任人", tool: "迭代查询", eta: "约 16 秒" },
      { title: "生成维护清单与风险摘要", tool: "清单生成", eta: "约 18 秒" },
    ],
    stages: [
      {
        title: "云码工厂维护 Skill",
        logs: [
          "已识别目标项目：CCCloud 企业智能体接入。",
          "已连接迭代、任务、缺陷与成员信息。",
        ],
      },
      {
        title: "维护清单生成",
        logs: [
          "共识别阻塞事项 11 个，其中高优先级 5 个。",
          "已输出《云码工厂阻塞事项清单》与沟通摘要。",
        ],
      },
    ],
    artifacts: [
      {
        name: "云码工厂阻塞事项清单.xlsx",
        path: "/ClawAgent/企业智能体/云码工厂阻塞事项清单.xlsx",
        size: "96 KB",
      },
      {
        name: "迭代风险沟通摘要.md",
        path: "/ClawAgent/企业智能体/迭代风险沟通摘要.md",
        size: "18 KB",
      },
    ],
    finalMessage:
      "已生成当前迭代维护清单和风险沟通摘要，可直接用于后续跟进。",
  },
  prdWriter: {
    defaultQuery:
      "请根据“企业级智能体广场点击智能体后回到 Chat 页面，自动回显推荐问并可一键发送；默认态仅在点击办公助手时展示差旅报销推荐问和三张附件”这个需求，整理一版可评审 PRD。",
    recentTaskTitle: "生成企业智能体联动 PRD",
    planningText:
      "收到，我会先把需求背景、范围和交互变化拆清楚，再整理关键流程与验收口径，最后输出一版可评审 PRD。",
    planItems: [
      {
        title: "结构化需求背景与范围",
        tool: "需求结构化 Skill",
        eta: "约 12 秒",
      },
      { title: "梳理页面联动与状态回填", tool: "交互流程", eta: "约 18 秒" },
      { title: "生成 PRD 与流程说明", tool: "文档草拟", eta: "约 20 秒" },
    ],
    stages: [
      {
        title: "需求结构化 Skill",
        logs: [
          "已提炼需求背景、目标用户与关键变化点。",
          "已识别涉及企业级智能体广场、Chat 空态与推荐问机制。",
        ],
      },
      {
        title: "PRD 文档草拟",
        logs: [
          "已生成需求概述、交互流程、状态逻辑和验收标准章节。",
          "已补充《企业级智能体对话联动 PRD》初稿。",
        ],
      },
    ],
    artifacts: [
      {
        name: "企业级智能体对话联动PRD.docx",
        path: "/ClawAgent/企业智能体/企业级智能体对话联动PRD.docx",
        size: "208 KB",
      },
      {
        name: "交互流程说明.md",
        path: "/ClawAgent/企业智能体/交互流程说明.md",
        size: "24 KB",
      },
    ],
    finalMessage: "已生成可评审 PRD 初稿与交互流程说明，可直接进入评审。",
  },
  marketInsight: {
    defaultQuery:
      "请帮我分析企业级智能体产品近期的市场机会与竞品动作，整理成一个可执行的洞察摘要。",
    recentTaskTitle: "生成企业级智能体市场洞察",
    planningText:
      "收到，我会先归集市场信号和竞品动作，再抽取机会点与竞争压力，最后整理成一份可确认的洞察摘要。",
    planItems: [
      {
        title: "归集市场信号与竞品动态",
        tool: "市场信号聚合 Skill",
        eta: "约 12 秒",
      },
      { title: "归类竞争动作与机会点", tool: "竞品动作归类", eta: "约 15 秒" },
      { title: "生成洞察摘要与清单", tool: "摘要生成", eta: "约 18 秒" },
    ],
    stages: [
      {
        title: "市场信号聚合 Skill",
        logs: [
          "已归集企业智能体领域近两周的产品发布、行业活动与客户线索。",
          "识别出效率提升、企业知识助手和多智能体协同是高频关注点。",
        ],
      },
      {
        title: "机会点摘要生成",
        logs: [
          "已整理 3 个可重点跟进的市场机会。",
          "已输出《企业级智能体市场洞察摘要》初稿。",
        ],
      },
    ],
    artifacts: [
      {
        name: "企业级智能体市场洞察摘要.docx",
        path: "/ClawAgent/企业智能体/企业级智能体市场洞察摘要.docx",
        size: "192 KB",
      },
      {
        name: "竞品动作清单.xlsx",
        path: "/ClawAgent/企业智能体/竞品动作清单.xlsx",
        size: "88 KB",
      },
    ],
    finalMessage: "已生成市场洞察摘要、竞品动作清单与下一步建议。",
  },
  vibeCoder: {
    defaultQuery:
      "请基于企业级智能体广场跳转 Chat 的需求，快速给出一个可演示的前端原型实现方案。",
    recentTaskTitle: "生成前端原型实现方案",
    planningText:
      "收到，我会先明确交互目标与页面状态，再快速拼出一个可演示的前端原型方案，最后整理成可确认的实现说明。",
    planItems: [
      {
        title: "识别关键交互与原型范围",
        tool: "快速原型 Skill",
        eta: "约 10 秒",
      },
      { title: "编排页面状态与组件职责", tool: "页面状态编排", eta: "约 16 秒" },
      { title: "输出原型方案与状态映射", tool: "原型脚本", eta: "约 20 秒" },
    ],
    stages: [
      {
        title: "快速原型 Skill",
        logs: [
          "已识别关键交互：广场点击、Chat 回显、推荐问发送、办公助手默认态。",
          "已确认原型范围聚焦在页面联动与对话态切换。",
        ],
      },
      {
        title: "交互原型脚本",
        logs: [
          "已生成状态切换说明与组件职责草稿。",
          "已输出原型方案说明，可用于演示和联调。",
        ],
      },
    ],
    artifacts: [
      {
        name: "企业智能体联动原型方案.md",
        path: "/ClawAgent/企业智能体/企业智能体联动原型方案.md",
        size: "26 KB",
      },
      {
        name: "前端状态映射表.xlsx",
        path: "/ClawAgent/企业智能体/前端状态映射表.xlsx",
        size: "74 KB",
      },
    ],
    finalMessage: "已生成可演示的前端原型方案与状态映射说明。",
  },
  contentCreator: {
    defaultQuery:
      "请围绕企业级智能体广场新能力，产出一版面向内部宣发的功能介绍文案和发布话术。",
    recentTaskTitle: "生成功能宣发文案",
    planningText:
      "收到，我会先提炼这次功能变更的卖点和场景价值，再整理发布文案与渠道话术，最后输出一版可确认的内容包。",
    planItems: [
      {
        title: "提炼功能变化与目标受众",
        tool: "内容策划 Skill",
        eta: "约 10 秒",
      },
      { title: "沉淀卖点与表达主线", tool: "卖点提炼", eta: "约 14 秒" },
      { title: "生成发布文案与渠道话术", tool: "文案生成", eta: "约 18 秒" },
    ],
    stages: [
      {
        title: "内容策划 Skill",
        logs: [
          "已提炼功能变化：广场智能体可直接带推荐问进入 Chat，办公助手默认态更明确。",
          "已确认目标受众为产品、设计、研发和内部运营团队。",
        ],
      },
      {
        title: "宣发文案生成",
        logs: [
          "已生成《功能发布文案》和《渠道话术清单》。",
          "已形成一版适合内部传播的内容包。",
        ],
      },
    ],
    artifacts: [
      {
        name: "企业智能体功能发布文案.docx",
        path: "/ClawAgent/企业智能体/企业智能体功能发布文案.docx",
        size: "154 KB",
      },
      {
        name: "渠道话术清单.xlsx",
        path: "/ClawAgent/企业智能体/渠道话术清单.xlsx",
        size: "61 KB",
      },
    ],
    finalMessage: "已生成内部宣发文案、发布话术与使用场景摘要。",
  },
  seniorDev: {
    defaultQuery:
      "请把企业级智能体广场智能体跳转 Chat 的需求拆成开发任务，给出接口、前端状态、联调和测试重点。",
    recentTaskTitle: "生成研发执行清单",
    planningText:
      "收到，我会先拆解需求涉及的状态和入口，再细化成开发、联调和测试任务，最后输出一版可确认的研发执行清单。",
    planItems: [
      {
        title: "拆解页面入口与状态点",
        tool: "开发任务拆解 Skill",
        eta: "约 12 秒",
      },
      {
        title: "梳理接口、联调与回归重点",
        tool: "接口与状态梳理",
        eta: "约 16 秒",
      },
      { title: "生成研发清单与检查单", tool: "执行清单生成", eta: "约 18 秒" },
    ],
    stages: [
      {
        title: "开发任务拆解 Skill",
        logs: [
          "已识别需求涉及广场列表、Chat 输入态、flow 配置与默认态逻辑。",
          "将任务拆为数据配置、路由回填、页面状态同步和验证四类。",
        ],
      },
      {
        title: "研发执行清单生成",
        logs: [
          "已整理开发任务、联调关注点和回归测试点。",
          "已输出《开发任务拆解表》和《联调检查单》。",
        ],
      },
    ],
    artifacts: [
      {
        name: "开发任务拆解表.xlsx",
        path: "/ClawAgent/企业智能体/开发任务拆解表.xlsx",
        size: "82 KB",
      },
      {
        name: "联调检查单.md",
        path: "/ClawAgent/企业智能体/联调检查单.md",
        size: "22 KB",
      },
    ],
    finalMessage: "已输出开发任务拆解、联调重点与测试检查单。",
  },
  seniorProjectManager: {
    defaultQuery:
      "请帮我把当前跨团队需求拆成两周节奏：里程碑、依赖、风险登记与干系人沟通要点。",
    recentTaskTitle: "生成两周项目推进方案",
    planningText:
      "收到。我会先完成 Agent 证书化身份校验，再以最小权限调用项目管理服务，并在需要子智能体协同时只委托必要工具、上下文和权限。",
    planItems: [
      {
        title: "验证高级项目经理 Agent 的 X.509 根身份",
        tool: "Agent Identity CA",
        eta: "约 6 秒",
      },
      {
        title: "读取项目现状并生成两周交付计划",
        tool: "Project MCP",
        eta: "约 14 秒",
      },
      {
        title: "有限委托子智能体完成风险、依赖和沟通分析",
        tool: "agent.delegate",
        eta: "约 16 秒",
      },
      {
        title: "检测高风险动作并执行权限降级",
        tool: "安全策略编排器",
        eta: "约 8 秒",
      },
      {
        title: "输出推进方案与安全治理审计摘要",
        tool: "文档生成",
        eta: "约 12 秒",
      },
    ],
    stages: [
      {
        title: "证书化身份校验",
        logs: [
          "已加载高级项目经理 Agent 的 X.509 密码学根身份，并完成证书链、吊销状态和租户绑定校验。",
          "后续调用项目系统时会使用 agent 证书完成双向 TLS 与请求签名，不只依赖 agent_id 字段。",
        ],
        identity: {
          agentName: "高级项目经理",
          agentId: "pm-senior",
          subject: "CN=SeniorProjectManager, OU=ProjectOps, O=Nova Agent Foundry",
          issuer: "CN=Nova Agent Root CA, O=Nova Agent Foundry",
          fingerprint: "SHA256: 9F:42:18:AC:71:2E:44:90:BD:36:11:7A:04:CB:8E:21",
          validUntil: "2026-12-31",
          proof: "mTLS 握手 + agent.signRequest(project.plan.read)",
        },
      },
      {
        title: "项目计划生成",
        logs: [
          "已读取迭代目标、需求池、当前阻塞项和干系人列表，生成两周推进节奏。",
          "已把任务拆为范围确认、研发联调、测试验收和上线准备四类，并标记 5 个依赖风险。",
        ],
      },
      {
        title: "多智能体有限委托",
        logs: [
          "主 Agent 准备调用三个子智能体并行分析，但不会让子智能体继承主 Agent 的完整项目权限。",
          "已为每个子智能体签发短期委托令牌，限定工具白名单、上下文包、有效期和禁止动作。",
        ],
        items: [
          {
            kind: "subagent_group",
            id: "pm-subagents-limited-delegation",
            principalAgent: "高级项目经理",
            principalAction: "以最小必要权限并行委托项目分析",
            tasks: [
              {
                title: "RiskScout 风险分析子智能体",
                detail: "仅分析阻塞事项、延期概率和升级建议。",
                status: "success",
                elapsed: "4.2s",
                toolWhitelist: [
                  "project.risk.read",
                  "issue.search",
                  "risk.register.suggest",
                ],
                contextPackage: ["需求摘要", "阻塞事项清单", "最近 7 天变更记录"],
                permissions: ["只读项目数据", "可生成风险建议", "不可修改里程碑"],
              },
              {
                title: "DependencyMapper 依赖梳理子智能体",
                detail: "只梳理跨团队依赖和交付先后关系。",
                status: "success",
                elapsed: "5.1s",
                toolWhitelist: ["project.dependency.read", "team.calendar.read"],
                contextPackage: ["里程碑草案", "团队日历摘要", "接口联调计划"],
                permissions: ["只读依赖数据", "不可发送通知", "不可创建外部会议"],
              },
              {
                title: "StakeholderBrief 沟通摘要子智能体",
                detail: "生成内部干系人沟通材料，不接触客户联系方式原文。",
                status: "running",
                elapsed: "00:03",
                toolWhitelist: ["doc.draft.create", "stakeholder.role.read"],
                contextPackage: ["角色列表", "脱敏沟通偏好", "风险摘要"],
                permissions: ["可生成内部草稿", "客户邮箱脱敏", "外发动作禁用"],
              },
            ],
            delegation: {
              token: "delegation-token: scoped / 15min / non-transferable",
              inheritedPermissions: "未继承主 Agent 写入、审批、外发权限",
              audit: "每次子 Agent 工具调用都会写入 delegation_scope 和 cert_fingerprint",
            },
          },
        ],
      },
      {
        title: "高风险动作检测与权限降级",
        logs: [
          "系统检测到沟通摘要子智能体尝试调用 customer.mail.bulk_send，动作涉及外部客户群发，风险等级升高。",
          "安全策略编排器已临时回收外发类高风险权限，并将当前委托降级为只读与内部草稿生成。",
        ],
        alerts: [
          {
            level: "critical",
            riskType: "权限降级 / 高危工具阻断",
            title: "已阻断外部客户批量通知工具调用",
            summary:
              "子智能体的原始委托范围不包含外发权限，且目标工具会触达外部客户。系统已自动回收高风险权限，阻断本次调用并要求人工审批后才能恢复。",
            detections: [
              {
                layer: "委托范围",
                result: "工具不在白名单 customer.mail.bulk_send",
              },
              { layer: "动作风险", result: "外部群发 + 影响不可完全回滚" },
              { layer: "身份校验", result: "证书有效但权限声明不足" },
            ],
            spotlight: [
              { source: "被阻断工具", text: "customer.mail.bulk_send" },
              {
                source: "原始权限",
                text: "doc.draft.create, stakeholder.role.read",
              },
              { source: "降级后权限", text: "read_only + internal_draft_only" },
            ],
            action:
              "处置：临时回收外发、写入和审批权限；保留内部草稿生成；记录审计事件 PM-GOV-20260603-001。",
          },
        ],
      },
      {
        title: "安全治理审计汇总",
        logs: [
          "已完成两周推进方案、风险登记、依赖矩阵和干系人沟通草稿。",
          "审计摘要显示：主 Agent 通过 X.509 证书证明身份，子智能体仅获得有限委托，高危工具调用已被权限降级策略阻断。",
        ],
      },
    ],
    artifacts: [
      {
        name: "两周项目推进方案.docx",
        path: "/ClawAgent/项目管理/两周项目推进方案.docx",
        size: "186 KB",
      },
      {
        name: "项目风险登记表.xlsx",
        path: "/ClawAgent/项目管理/项目风险登记表.xlsx",
        size: "92 KB",
      },
      {
        name: "Agent安全治理审计摘要.md",
        path: "/ClawAgent/项目管理/Agent安全治理审计摘要.md",
        size: "24 KB",
      },
    ],
    finalMessage:
      "已生成项目推进方案，并完成安全治理演示：证书化身份已校验、子智能体有限委托已审计、高风险外发工具调用已被权限降级策略阻断。",
  },
};

export function getEnterpriseFlowPreset(
  key?: string | null
): EnterpriseFlowPreset {
  if (key && key in ENTERPRISE_FLOW_PRESETS) {
    return ENTERPRISE_FLOW_PRESETS[key as EnterpriseFlowKey];
  }
  return ENTERPRISE_FLOW_PRESETS.default;
}

/**
 * Resolve preset for a session: explicit id map → title keywords → default.
 * Also accepts agent `chatFlowKey` when provided (plaza summon path).
 */
export function resolveEnterpriseFlowKey(input: {
  sessionId?: string;
  title?: string;
  chatFlowKey?: string | null;
}): EnterpriseFlowKey {
  if (input.chatFlowKey && input.chatFlowKey in ENTERPRISE_FLOW_PRESETS) {
    return input.chatFlowKey as EnterpriseFlowKey;
  }

  if (input.sessionId && ENTERPRISE_SESSION_PRESET_BY_ID[input.sessionId]) {
    return ENTERPRISE_SESSION_PRESET_BY_ID[input.sessionId];
  }

  const title = input.title ?? "";
  if (/云码|迭代阻塞|缺陷/.test(title)) return "cloudFactoryOps";
  if (/PRD|需求文档|需求评审/.test(title)) return "prdWriter";
  if (/市场|竞品|周报|洞察/.test(title)) return "marketInsight";
  if (/前端|原型|界面设计|桌面助手/.test(title)) return "vibeCoder";
  if (/文案|宣发|JD|招聘|复盘报告|销售复盘/.test(title)) return "contentCreator";
  if (/开发任务|联调|接口|制度对比|研发/.test(title)) return "seniorDev";
  if (/项目经理|里程碑|干系人|风险登记|两周/.test(title)) {
    return "seniorProjectManager";
  }

  return "default";
}

/** Seed opening phase so the canvas is never empty (aligned with list preview tone). */
export function getEnterpriseSeedPhase(session: MyClawSessionListItem): number {
  const preview = session.preview ?? "";
  if (/已完成|已输出|已生成|已导入/.test(preview) && !/待/.test(preview)) {
    return ENTERPRISE_FLOW_MAX_PHASE;
  }
  if (/失败|无法识别|错误/.test(preview)) return 3;
  if (/正在|进行中/.test(preview)) return 4;
  if (/等待|待确认|待发起|可一键/.test(preview)) return 5;
  return 5;
}

export type EnterpriseRenderNode =
  | {
      key: string;
      type: "user";
      timeline: Extract<ConversationTimelineItem, { type: "user" }>;
    }
  | {
      key: string;
      type: "thinking";
      timeline: Extract<ConversationTimelineItem, { type: "thinking" }>;
    }
  | {
      key: string;
      type: "plan";
      status: string;
      statusTone: ConversationTimelineActionStatus;
      items: EnterprisePlanItem[];
    }
  | {
      key: string;
      type: "stage";
      title: string;
      status: ConversationTimelineActionStatus;
      logs: string[];
      identity?: EnterpriseStageIdentity;
      subagents?: EnterpriseSubagentGroup[];
      alerts?: EnterpriseSecurityAlert[];
    }
  | {
      key: string;
      type: "artifacts";
      artifacts: EnterpriseArtifact[];
      note?: string;
    }
  | {
      key: string;
      type: "output";
      timeline: Extract<ConversationTimelineItem, { type: "output" }>;
    };

export interface EnterpriseInspectorModel {
  tasks: Array<{
    id: string;
    title: string;
    detail: string;
    status: "done" | "running" | "pending";
  }>;
  files: EnterpriseArtifact[];
  tools: Array<{ id: string; name: string; headline: string }>;
  completedTaskCount: number;
}

export interface EnterpriseConversationView {
  flowKey: EnterpriseFlowKey;
  preset: EnterpriseFlowPreset;
  query: string;
  phase: number;
  agentLabel: string;
  nodes: EnterpriseRenderNode[];
  inspector: EnterpriseInspectorModel;
}

function assistantMessage(
  id: string,
  content: string,
  sender: string,
  attachments?: string[]
): ConversationMessageWithAuditLike {
  return {
    id,
    role: "assistant",
    sender,
    time: "",
    content,
    attachments,
    auditRecords: [],
  };
}

type ConversationMessageWithAuditLike = Extract<
  ConversationTimelineItem,
  { type: "user" }
>["message"];

function userMessage(
  id: string,
  content: string
): ConversationMessageWithAuditLike {
  return {
    id,
    role: "user",
    sender: "我",
    time: "",
    content,
    auditRecords: [],
  };
}

function stageUnlockPhase(index: number): number {
  // Prototype: first stage at phase 3, remaining stages unlock together at phase 4.
  return index === 0 ? 3 : 4;
}

function buildInspector(
  preset: EnterpriseFlowPreset,
  phase: number
): EnterpriseInspectorModel {
  const planDone = phase >= 5;
  const planRunning = phase >= 2 && phase < 5;
  const tasks = preset.planItems.map((item, index) => {
    let status: "done" | "running" | "pending" = "pending";
    if (planDone) status = "done";
    else if (planRunning) {
      status = index === 0 ? "done" : index === 1 ? "running" : "pending";
    }
    return {
      id: `plan-${index}`,
      title: item.title,
      detail: `${item.tool} · ${item.eta}`,
      status,
    };
  });

  const files = phase >= 5 ? preset.artifacts : [];
  const tools = preset.planItems.map((item, index) => ({
    id: `tool-${index}`,
    name: item.tool,
    headline: item.title,
  }));

  return {
    tasks,
    files,
    tools: phase >= 2 ? tools : [],
    completedTaskCount: tasks.filter((task) => task.status === "done").length,
  };
}

/**
 * Build a Nexus-renderable conversation view from a preset + phase
 * (same reveal order as `renderEnterpriseSession` in 会话交互 `app.js`).
 */
export function buildEnterpriseConversationView(options: {
  session: MyClawSessionListItem;
  phase?: number;
  chatFlowKey?: string | null;
  query?: string;
  agentLabel?: string;
}): EnterpriseConversationView {
  const flowKey = resolveEnterpriseFlowKey({
    sessionId: options.session.id,
    title: options.session.title,
    chatFlowKey: options.chatFlowKey,
  });
  const preset = getEnterpriseFlowPreset(flowKey);
  const phase = Math.max(
    0,
    Math.min(
      options.phase ?? getEnterpriseSeedPhase(options.session),
      ENTERPRISE_FLOW_MAX_PHASE
    )
  );
  const query =
    options.query?.trim() ||
    (flowKey === "default"
      ? `请围绕「${options.session.title}」给出结构清楚、可直接落地的执行方案与结果草稿。`
      : preset.defaultQuery);
  const agentLabel = options.agentLabel ?? preset.recentTaskTitle;
  const nodes: EnterpriseRenderNode[] = [];

  nodes.push({
    key: `${options.session.id}-user`,
    type: "user",
    timeline: {
      key: `${options.session.id}-user`,
      type: "user",
      message: userMessage(`${options.session.id}-user`, query),
    },
  });

  if (phase >= 1) {
    nodes.push({
      key: `${options.session.id}-planning`,
      type: "thinking",
      timeline: {
        key: `${options.session.id}-planning`,
        type: "thinking",
        active: phase < 2,
        message: assistantMessage(
          `${options.session.id}-planning`,
          preset.planningText,
          agentLabel
        ),
      },
    });
  }

  if (phase >= 2) {
    nodes.push({
      key: `${options.session.id}-plan`,
      type: "plan",
      status: phase >= 5 ? "已完成" : "执行中",
      statusTone: phase >= 5 ? "done" : "running",
      items: preset.planItems,
    });
  }

  preset.stages.forEach((stage, index) => {
    const unlockAt = stageUnlockPhase(index);
    if (phase < unlockAt) return;
    const status: ConversationTimelineActionStatus =
      phase === unlockAt && phase < 5 ? "running" : "done";
    nodes.push({
      key: `${options.session.id}-stage-${index}`,
      type: "stage",
      title: stage.title,
      status,
      logs: stage.logs,
      identity: stage.identity,
      subagents: stage.items,
      alerts: stage.alerts,
    });
  });

  if (phase >= 5) {
    nodes.push({
      key: `${options.session.id}-artifacts`,
      type: "artifacts",
      artifacts: preset.artifacts,
      note: "会话文件已就绪",
    });
  }

  if (phase >= 6) {
    nodes.push({
      key: `${options.session.id}-final`,
      type: "output",
      timeline: {
        key: `${options.session.id}-final`,
        type: "output",
        message: assistantMessage(
          `${options.session.id}-final`,
          preset.finalMessage,
          agentLabel,
          preset.artifacts.map((artifact) => artifact.name)
        ),
      },
    });
  }

  return {
    flowKey,
    preset,
    query,
    phase,
    agentLabel,
    nodes,
    inspector: buildInspector(preset, phase),
  };
}

/**
 * Travel-expense demo script ported from 会话交互 `data.js` → `steps`.
 * Preserves all 34 steps and item semantics for the My Claw chat host.
 */

export interface ExpensePlanItem {
  title: string;
  tool: string;
  eta: string;
}

export interface ExpenseTodoItem {
  title: string;
  detail: string;
}

export interface ExpenseArtifact {
  name: string;
  path: string;
  size: string;
}

export interface ExpenseClarifyOption {
  label: string;
  value: string;
  summary: string;
}

export type ExpenseItemKind =
  | "user_message"
  | "clarify"
  | "clarify_summary"
  | "narration"
  | "thinking"
  | "skill_chip"
  | "plan_card"
  | "todo_list"
  | "tool_call"
  | "subagent_group"
  | "artifact_list"
  | "context_compression";

export type ExpenseStepKind =
  | "USER_MESSAGE"
  | "HITL_CLARIFY"
  | "CLARIFY_SUMMARY"
  | "NARRATION"
  | "THINKING"
  | "SKILL_CHIP"
  | "PLAN_CARD"
  | "TODO_LIST"
  | "TOOL_CALL"
  | "SUBAGENT_GROUP"
  | "DESTRUCTIVE_CONFIRMATION"
  | "ARTIFACT_CARD"
  | "CONTEXT_COMPRESSION";

export interface ExpenseAnnotation {
  label: string;
  type: string;
  subtype?: string;
  schema?: Record<string, unknown>;
  hitl_policy?: string;
}

export interface ExpenseDemoItemBase {
  kind: ExpenseItemKind;
  id: string;
  annotation?: ExpenseAnnotation;
}

export interface ExpenseUserMessageItem extends ExpenseDemoItemBase {
  kind: "user_message";
  text: string;
  attachments?: string[];
}

export interface ExpenseClarifyItem extends ExpenseDemoItemBase {
  kind: "clarify";
  questionKey: string;
  question: string;
  options: ExpenseClarifyOption[];
  freeInputLabel?: string;
}

export interface ExpenseClarifySummaryEntry {
  question: string;
  answerKey: string;
  fallbackValue: string;
  customLabel: string;
  options: ExpenseClarifyOption[];
}

export interface ExpenseClarifySummaryItem extends ExpenseDemoItemBase {
  kind: "clarify_summary";
  entries: ExpenseClarifySummaryEntry[];
}

export interface ExpenseNarrationItem extends ExpenseDemoItemBase {
  kind: "narration";
  text: string;
}

export interface ExpenseThinkingItem extends ExpenseDemoItemBase {
  kind: "thinking";
  duration?: number;
  content: string;
}

export interface ExpenseSkillChipItem extends ExpenseDemoItemBase {
  kind: "skill_chip";
  skill: string;
  request?: Record<string, unknown>;
  response?: string;
  description?: string;
}

export interface ExpensePlanCardItem extends ExpenseDemoItemBase {
  kind: "plan_card";
  status: string;
  items: ExpensePlanItem[];
}

export interface ExpenseTodoListItem extends ExpenseDemoItemBase {
  kind: "todo_list";
  items: ExpenseTodoItem[];
}

export interface ExpenseToolCallItem extends ExpenseDemoItemBase {
  kind: "tool_call";
  toolName: string;
  category?: string;
  connector?: string;
  status: string;
  headline?: string;
  action?: string;
  target?: string;
  elapsed?: string;
  summary?: string;
  successSummary?: string;
  deniedSummary?: string;
  advanceTo?: number;
  args?: Record<string, unknown>;
  output?: unknown;
  deniedOutput?: unknown;
  stream?: string[];
  autoRetry?: boolean;
  retryMessage?: string;
  feedbackMessages?: Record<string, string>;
  impact?: string[];
  risks?: string[];
  paths?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  showEdit?: boolean;
  confirmAdvanceSteps?: number;
}

export interface ExpenseSubagentTask {
  title: string;
  detail: string;
  status: string;
  elapsed?: string;
}

export interface ExpenseSubagentGroupItem extends ExpenseDemoItemBase {
  kind: "subagent_group";
  principalAgent: string;
  principalAction: string;
  tasks: ExpenseSubagentTask[];
}

export interface ExpenseArtifactListItem extends ExpenseDemoItemBase {
  kind: "artifact_list";
  title?: string;
  artifacts: ExpenseArtifact[];
  note?: string;
}

export interface ExpenseContextCompressionItem extends ExpenseDemoItemBase {
  kind: "context_compression";
  title?: string;
  summary?: string;
  completedTitle?: string;
  completedSummary?: string;
  retained?: string[];
  discarded?: string[];
  beforeTokens?: number;
  afterTokens?: number;
}

export type ExpenseDemoItem =
  | ExpenseUserMessageItem
  | ExpenseClarifyItem
  | ExpenseClarifySummaryItem
  | ExpenseNarrationItem
  | ExpenseThinkingItem
  | ExpenseSkillChipItem
  | ExpensePlanCardItem
  | ExpenseTodoListItem
  | ExpenseToolCallItem
  | ExpenseSubagentGroupItem
  | ExpenseArtifactListItem
  | ExpenseContextCompressionItem;

export interface ExpenseDemoStep {
  id: number;
  title: string;
  kind: ExpenseStepKind;
  hitl?: string;
  autoSuccess?: boolean;
  items: ExpenseDemoItem[];
}


export const EXPENSE_PLAN_ITEMS: ExpensePlanItem[] = [
  {
    title: "读取三份附件票据",
    tool: "文档解析 / 图像理解",
    eta: "约 20 秒",
  },
  {
    title: "核验行程、住宿与交通金额",
    tool: "Code Execution",
    eta: "约 15 秒",
  },
  {
    title: "对齐住宿晚数与可报销发票",
    tool: "Policy Engine",
    eta: "约 8 秒",
  },
  {
    title: "连接 ERP 创建报销草稿",
    tool: "ERP Connector",
    eta: "约 30 秒",
  },
  {
    title: "提交至 OA 审批并生成申请文档",
    tool: "OA Connector / Document Gen",
    eta: "约 45 秒",
  },
];

export const EXPENSE_TODO_ITEMS: ExpenseTodoItem[] = [
  {
    title: "解析机票、酒店、打车票据",
    detail: "提取金额、日期、税号与行程信息",
  },
  {
    title: "住宿与发票自动核对",
    detail: "已按行程与票据自动对齐",
  },
  {
    title: "创建 ERP 报销单草稿",
    detail: "需要访问财务 ERP 连接器",
  },
  {
    title: "补全组织信息与差旅标准",
    detail: "并行拉取 OA 与知识库",
  },
  {
    title: "提交 OA 审批并生成文件",
    detail: "提交后不可撤销,随后生成申请文档",
  },
];

export const EXPENSE_DRAFT_DOCUMENT_ARTIFACT: ExpenseArtifact = {
  name: "差旅申请草稿.docx",
  path: "/ClawAgent/差旅报销/BX20260423001/差旅申请草稿.docx",
  size: "126 KB",
};

export const EXPENSE_ARTIFACTS: ExpenseArtifact[] = [
  {
    name: "差旅申请草稿.docx",
    path: "/ClawAgent/差旅报销/BX20260423001/差旅申请草稿.docx",
    size: "126 KB",
  },
  {
    name: "报销申请表.pdf",
    path: "/ClawAgent/差旅报销/BX20260423001/报销申请表.pdf",
    size: "428 KB",
  },
  {
    name: "附件清单.xlsx",
    path: "/ClawAgent/差旅报销/BX20260423001/附件清单.xlsx",
    size: "84 KB",
  },
];

export const EXPENSE_ARTIFACTS_AFTER_DELETION: ExpenseArtifact[] = [
  {
    name: "报销申请表.pdf",
    path: "/ClawAgent/差旅报销/BX20260423001/报销申请表.pdf",
    size: "428 KB",
  },
  {
    name: "附件清单.xlsx",
    path: "/ClawAgent/差旅报销/BX20260423001/附件清单.xlsx",
    size: "84 KB",
  },
];

export const EXPENSE_DEMO_STEPS: ExpenseDemoStep[] = [
  {
    id: 1,
    title: "用户提交模糊的报销请求",
    kind: "USER_MESSAGE",
    items: [
      {
        kind: "user_message",
        id: "msg-user-001",
        text: "帮我把上海出差这次报销处理一下,附件里有票据,按公司要求帮我提一下。",
        attachments: ["上海机票行程单.pdf", "酒店发票.jpg", "打车发票-03-18.png"],
        annotation: {
          label: "USER_MESSAGE",
          type: "user_message",
          schema: {
            message_id: "msg-user-001",
            role: "user",
            attachments: [
              {
                file_id: "file-flight-001",
                name: "上海机票行程单.pdf",
                mime_type: "application/pdf",
              },
              {
                file_id: "file-hotel-001",
                name: "酒店发票.jpg",
                mime_type: "image/jpeg",
              },
              {
                file_id: "file-taxi-001",
                name: "打车发票-03-18.png",
                mime_type: "image/png",
              },
            ],
            intent_hint: "travel_expense_submission",
          },
        },
      },
    ],
  },
  {
    id: 2,
    title: "澄清提交方式",
    kind: "HITL_CLARIFY",
    hitl: "intake_submit_mode",
    items: [
      {
        kind: "clarify",
        id: "clarify-intake-001",
        questionKey: "submit_mode",
        question: "本次需要我直接提交审批，还是先整理成草稿给您确认？",
        options: [
          {
            label: "直接提交审批",
            value: "direct_submit",
            summary: "直接提交审批",
          },
          {
            label: "先生成草稿给我确认",
            value: "draft_first",
            summary: "先生成草稿给我确认",
          },
          {
            label: "只整理材料不提交",
            value: "materials_only",
            summary: "只整理材料不提交",
          },
        ],
        freeInputLabel: "自己输入",
      },
    ],
  },
  {
    id: 3,
    title: "澄清报销范围",
    kind: "HITL_CLARIFY",
    hitl: "intake_scope",
    items: [
      {
        kind: "clarify",
        id: "clarify-intake-002",
        questionKey: "expense_scope",
        question: "这次报销范围按哪一类处理？",
        options: [
          {
            label: "只报机票 / 酒店 / 打车",
            value: "travel_basic",
            summary: "仅机票、酒店和打车",
          },
          {
            label: "含餐补和市内交通",
            value: "travel_plus_allowance",
            summary: "含餐补和市内交通",
          },
          {
            label: "按全部附件和标准一起判断",
            value: "all_by_policy",
            summary: "按全部附件和公司标准判断",
          },
        ],
        freeInputLabel: "自己输入",
      },
    ],
  },
  {
    id: 4,
    title: "澄清归属项目",
    kind: "HITL_CLARIFY",
    hitl: "intake_project",
    items: [
      {
        kind: "clarify",
        id: "clarify-intake-003",
        questionKey: "project_code",
        question: "报销归属项目或成本中心要怎么填写？",
        options: [
          {
            label: "沿用默认差旅项目",
            value: "default_travel_project",
            summary: "沿用默认差旅项目",
          },
          {
            label: "归属上海客户拜访项目",
            value: "shanghai_client_visit",
            summary: "归属上海客户拜访项目",
          },
          {
            label: "先留空，后续再补",
            value: "leave_blank",
            summary: "先留空，后续再补",
          },
        ],
        freeInputLabel: "自己输入",
      },
    ],
  },
  {
    id: 5,
    title: "汇总已明确需求",
    kind: "CLARIFY_SUMMARY",
    items: [
      {
        kind: "clarify_summary",
        id: "clarify-summary-001",
        entries: [
          {
            question: "本次需要我怎么提交？",
            answerKey: "submit_mode",
            fallbackValue: "draft_first",
            customLabel: "用户自定义提交方式",
            options: [
              {
                label: "直接提交审批",
                value: "direct_submit",
                summary: "直接提交审批",
              },
              {
                label: "先生成草稿给我确认",
                value: "draft_first",
                summary: "先生成草稿给我确认",
              },
              {
                label: "只整理材料不提交",
                value: "materials_only",
                summary: "只整理材料不提交",
              },
            ],
          },
          {
            question: "这次报销范围按什么规则处理？",
            answerKey: "expense_scope",
            fallbackValue: "travel_basic",
            customLabel: "用户自定义报销范围",
            options: [
              {
                label: "只报机票 / 酒店 / 打车",
                value: "travel_basic",
                summary: "仅机票、酒店和打车",
              },
              {
                label: "含餐补和市内交通",
                value: "travel_plus_allowance",
                summary: "含餐补和市内交通",
              },
              {
                label: "按全部附件和标准一起判断",
                value: "all_by_policy",
                summary: "按全部附件和公司标准判断",
              },
            ],
          },
          {
            question: "报销归属项目或成本中心怎么填写？",
            answerKey: "project_code",
            fallbackValue: "default_travel_project",
            customLabel: "用户自定义归属项目",
            options: [
              {
                label: "沿用默认差旅项目",
                value: "default_travel_project",
                summary: "沿用默认差旅项目",
              },
              {
                label: "归属上海客户拜访项目",
                value: "shanghai_client_visit",
                summary: "归属上海客户拜访项目",
              },
              {
                label: "先留空，后续再补",
                value: "leave_blank",
                summary: "先留空，后续再补",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 6,
    title: "Agent 明确需求并开始规划",
    kind: "NARRATION",
    items: [
      {
        kind: "narration",
        id: "msg-narration-001",
        text: "已收到并明确您的报销需求,正在规划任务。",
        annotation: {
          label: "NARRATION",
          type: "agent_narration",
          schema: {
            message_id: "msg-narration-001",
            role: "assistant",
            display: "inline_text",
          },
        },
      },
    ],
  },
  {
    id: 7,
    title: "模型思考任务路径",
    kind: "THINKING",
    items: [
      {
        kind: "thinking",
        id: "thinking-001",
        duration: 3,
        content: "用户已确认提交方式、报销范围和归属项目。接下来需要先识别三份附件并核验票据字段,再确认酒店晚数是否完整。ERP 写入和 OA 提交属于外部系统操作,需要在创建草稿和最终提交前请求授权。",
        annotation: {
          label: "THINKING",
          type: "model_thinking",
          schema: {
            duration_sec: 3,
            collapsed_by_default: true,
            retention_policy: "ephemeral",
          },
        },
      },
    ],
  },
  {
    id: 8,
    title: "载入差旅报销技能",
    kind: "SKILL_CHIP",
    items: [
      {
        kind: "skill_chip",
        id: "skill-001",
        skill: "差旅报销",
        request: {
          skill: "enterprise-skills:travel-expense",
        },
        response: "Launching skill: enterprise-skills:travel-expense",
        description: "按公司制度识别票据、核验标准、生成报销单并提交审批。",
        annotation: {
          label: "SKILL_CHIP",
          type: "skill",
          schema: {
            skill_id: "skill-travel-expense",
            name: "差旅报销",
            trigger: "用户请求提交差旅报销且含票据附件",
            required_connectors: ["ERP", "OA", "企业知识库"],
          },
        },
      },
    ],
  },
  {
    id: 9,
    title: "生成执行计划",
    kind: "PLAN_CARD",
    items: [
      {
        kind: "plan_card",
        id: "plan-001",
        status: "已建立",
        items: [
          {
            title: "读取三份附件票据",
            tool: "文档解析 / 图像理解",
            eta: "约 20 秒",
          },
          {
            title: "核验行程、住宿与交通金额",
            tool: "Code Execution",
            eta: "约 15 秒",
          },
          {
            title: "对齐住宿晚数与可报销发票",
            tool: "Policy Engine",
            eta: "约 8 秒",
          },
          {
            title: "连接 ERP 创建报销草稿",
            tool: "ERP Connector",
            eta: "约 30 秒",
          },
          {
            title: "提交至 OA 审批并生成申请文档",
            tool: "OA Connector / Document Gen",
            eta: "约 45 秒",
          },
        ],
        annotation: {
          label: "PLAN_CARD",
          type: "plan",
          schema: {
            plan_id: "plan-expense-001",
            status: "ready",
            approval_required: false,
            items: [
              {
                order: 1,
                title: "读取三份附件票据",
                tool: "文档解析 / 图像理解",
                eta: "约 20 秒",
              },
              {
                order: 2,
                title: "核验行程、住宿与交通金额",
                tool: "Code Execution",
                eta: "约 15 秒",
              },
              {
                order: 3,
                title: "对齐住宿晚数与可报销发票",
                tool: "Policy Engine",
                eta: "约 8 秒",
              },
              {
                order: 4,
                title: "连接 ERP 创建报销草稿",
                tool: "ERP Connector",
                eta: "约 30 秒",
              },
              {
                order: 5,
                title: "提交至 OA 审批并生成申请文档",
                tool: "OA Connector / Document Gen",
                eta: "约 45 秒",
              },
            ],
          },
        },
      },
    ],
  },
  {
    id: 10,
    title: "计划转为任务推进清单",
    kind: "TODO_LIST",
    items: [
      {
        kind: "todo_list",
        id: "todo-001",
        items: [
          {
            title: "解析机票、酒店、打车票据",
            detail: "提取金额、日期、税号与行程信息",
          },
          {
            title: "住宿与发票自动核对",
            detail: "已按行程与票据自动对齐",
          },
          {
            title: "创建 ERP 报销单草稿",
            detail: "需要访问财务 ERP 连接器",
          },
          {
            title: "补全组织信息与差旅标准",
            detail: "并行拉取 OA 与知识库",
          },
          {
            title: "提交 OA 审批并生成文件",
            detail: "提交后不可撤销,随后生成申请文档",
          },
        ],
        annotation: {
          label: "TODO_ITEM",
          type: "todo_list",
          schema: {
            plan_id: "plan-expense-001",
            source: "generated_plan",
            statuses: [
              "done",
              "in_progress",
              "pending",
              "blocked",
            ],
          },
        },
      },
      {
        kind: "narration",
        id: "msg-narration-read-attachments",
        text: "下面我会先调用工具读取用户上传的附件",
        annotation: {
          label: "NARRATION",
          type: "agent_narration",
          schema: {
            message_id: "msg-narration-read-attachments",
            role: "assistant",
            before_tools: ["tool-read-flight", "tool-ocr-hotel", "tool-ocr-taxi"],
          },
        },
      },
    ],
  },
  {
    id: 11,
    title: "读取上海机票行程单",
    kind: "TOOL_CALL",
    items: [
      {
        kind: "tool_call",
        id: "tool-read-flight",
        toolName: "文档解析",
        category: "doc",
        status: "success_expanded",
        headline: "文档解析",
        action: "解析",
        target: "上海机票行程单.pdf",
        elapsed: "1.8s",
        args: {
          file_name: "上海机票行程单.pdf",
          file_path: "/workspace/attachments/上海机票行程单.pdf",
        },
        output: {
          status: "200 success",
          response: "中国东方航空电子客票行程单\n旅客姓名：张三\n航程：北京大兴 - 上海虹桥\n航班号：MU5108\n日期：2026-03-18\n票价：1280.00 元\n发票代码：144032026041",
        },
        annotation: {
          label: "TOOL_CALL[success]",
          type: "tool_call",
          subtype: "document_parse",
          schema: {
            tool_name: "文档解析",
            args: {
              file_name: "上海机票行程单.pdf",
              file_path: "/workspace/attachments/上海机票行程单.pdf",
            },
            output: {
              status: "200 success",
              response_type: "plain_text",
            },
            latency_ms: 1842,
          },
        },
      },
    ],
  },
  {
    id: 12,
    title: "解析酒店发票图片",
    kind: "TOOL_CALL",
    items: [
      {
        kind: "tool_call",
        id: "tool-ocr-hotel-running",
        toolName: "图像理解",
        category: "doc",
        status: "running",
        headline: "图像理解",
        action: "解析",
        target: "酒店发票.jpg",
        args: {
          file_name: "酒店发票.jpg",
          file_path: "/workspace/attachments/酒店发票.jpg",
        },
        annotation: {
          label: "TOOL_CALL[running]",
          type: "tool_call",
          subtype: "image_understanding",
          schema: {
            tool_name: "图像理解",
            args: {
              file_name: "酒店发票.jpg",
              file_path: "/workspace/attachments/酒店发票.jpg",
            },
            output: null,
          },
        },
      },
      {
        kind: "tool_call",
        id: "tool-ocr-hotel",
        toolName: "图像理解",
        category: "doc",
        status: "success_expanded",
        headline: "图像理解",
        action: "解析",
        target: "酒店发票.jpg",
        elapsed: "2.4s",
        args: {
          file_name: "酒店发票.jpg",
          file_path: "/workspace/attachments/酒店发票.jpg",
        },
        output: {
          status: "200 success",
          response: "增值税普通发票\n销售方名称：上海虹桥商务酒店有限公司\n购买方名称：中国电信集团有限公司\n住宿日期：2026-03-18 至 2026-03-19\n项目名称：住宿服务\n金额：1080.00 元\n税率：6%",
        },
        annotation: {
          label: "TOOL_CALL[success]",
          type: "tool_call",
          subtype: "image_understanding",
          schema: {
            tool_name: "图像理解",
            args: {
              file_name: "酒店发票.jpg",
              file_path: "/workspace/attachments/酒店发票.jpg",
            },
            output: {
              status: "200 success",
              response_type: "plain_text",
            },
            latency_ms: 2410,
          },
        },
      },
    ],
  },
  {
    id: 13,
    title: "解析打车发票图片",
    kind: "TOOL_CALL",
    items: [
      {
        kind: "tool_call",
        id: "tool-ocr-taxi",
        toolName: "图像理解",
        category: "doc",
        status: "success_expanded",
        headline: "图像理解",
        action: "解析",
        target: "打车发票-03-18.png",
        elapsed: "1.1s",
        args: {
          file_name: "打车发票-03-18.png",
          file_path: "/workspace/attachments/打车发票-03-18.png",
        },
        output: {
          status: "200 success",
          response: "网约车行程发票截图\n行程 1：上海虹桥站 - 上海虹桥商务酒店，金额 68.00 元\n行程 2：上海虹桥商务酒店 - 客户园区，金额 52.00 元\n行程 3：客户园区 - 上海虹桥站，金额 67.00 元\n合计金额：187.00 元",
        },
        annotation: {
          label: "TOOL_CALL[success]",
          type: "tool_call",
          subtype: "image_understanding",
          schema: {
            tool_name: "图像理解",
            args: {
              file_name: "打车发票-03-18.png",
              file_path: "/workspace/attachments/打车发票-03-18.png",
            },
            output: {
              status: "200 success",
              response_type: "plain_text",
            },
            latency_ms: 1130,
          },
        },
      },
    ],
  },
  {
    id: 14,
    title: "完成票据查验叙述",
    kind: "NARRATION",
    items: [
      {
        kind: "narration",
        id: "msg-narration-002",
        text: "已完成三份附件解析，后续会基于解析文本核验差旅报销信息。",
        annotation: {
          label: "NARRATION",
          type: "agent_narration",
          schema: {
            message_id: "msg-narration-002",
            role: "assistant",
            derived_from_tools: ["tool-read-flight", "tool-ocr-hotel", "tool-ocr-taxi"],
          },
        },
      },
    ],
  },
  {
    id: 15,
    title: "创建报销草稿文件",
    kind: "TOOL_CALL",
    autoSuccess: true,
    items: [
      {
        kind: "tool_call",
        id: "tool-erp-draft-run",
        toolName: "local.file.create",
        category: "file",
        status: "running_to_success",
        headline: "创建：BX-DRAFT-7781.md",
        action: "创建",
        target: "BX-DRAFT-7781.md",
        elapsed: "3.2s",
        summary: "创建 BX-DRAFT-7781.md",
        args: {
          path: "/ClawAgent/差旅报销/BX20260423001/BX-DRAFT-7781.md",
          source: "ERP 报销草稿",
        },
        output: {
          file_name: "BX-DRAFT-7781.md",
          path: "/ClawAgent/差旅报销/BX20260423001/BX-DRAFT-7781.md",
          draft_id: "BX-DRAFT-7781",
        },
        stream: ["整理 ERP 草稿字段...", "写入费用明细与附件索引...", "生成草稿文件 BX-DRAFT-7781.md..."],
        annotation: {
          label: "TOOL_CALL[running]",
          type: "tool_call",
          subtype: "local_file_system",
          schema: {
            tool_name: "local.file.create",
            status_flow: ["running", "success"],
            output: {
              file_name: "BX-DRAFT-7781.md",
              draft_id: "BX-DRAFT-7781",
            },
            latency_ms: 3200,
          },
        },
      },
    ],
  },
  {
    id: 16,
    title: "并行子代理调度",
    kind: "SUBAGENT_GROUP",
    items: [
      {
        kind: "subagent_group",
        id: "subagents-001",
        principalAgent: "ExpenseContext-α",
        principalAction: "为 ERP 草稿写入并行准备组织、政策与界面上下文",
        tasks: [
          {
            title: "组织信息查询",
            detail: "从 OA 拉取张三的部门与上级信息",
            status: "success",
            elapsed: "4.8s",
          },
          {
            title: "制度核验",
            detail: "查询公司差旅标准(2024 版)",
            status: "success",
            elapsed: "5.3s",
          },
        ],
        annotation: {
          label: "SUBAGENT_GROUP",
          type: "subagent_group",
          schema: {
            group_id: "parallel-001",
            fanout: 2,
            join_strategy: "wait_all",
            results: ["department_manager", "travel_policy_2024"],
          },
        },
      },
    ],
  },
  {
    id: 17,
    title: "请求 ERP 写入授权",
    kind: "TOOL_CALL",
    hitl: "permission",
    items: [
      {
        kind: "narration",
        id: "msg-narration-before-erp-write",
        text: "下一步我会先填写差旅报销表单草稿，并让用户确认提交至ERP系统",
        annotation: {
          label: "NARRATION",
          type: "agent_narration",
          schema: {
            message_id: "msg-narration-before-erp-write",
            role: "assistant",
            before_tool: "erp.expense.write",
          },
        },
      },
      {
        kind: "tool_call",
        id: "tool-erp-write-approval",
        toolName: "erp.expense.write",
        category: "connector",
        connector: "ERP",
        status: "needs_approval",
        headline: "erp.expense.write",
        action: "连接器 ERP",
        target: "写入报销单草稿",
        elapsed: "等待授权",
        successSummary: "写入成功 · code 200 · BX-DRAFT-7781",
        deniedSummary: "用户拒绝授权 · code 403 · 未写入 ERP 草稿",
        advanceTo: 21,
        args: {
          draft_id: "BX-DRAFT-7781",
          lines: 6,
          attachments: 3,
          include_policy_fields: true,
        },
        output: {
          code: 200,
          message: "ERP 草稿写入成功",
          draft_id: "BX-DRAFT-7781",
          amount: "¥3,847",
          lines: 6,
          attachments: 3,
          validation: "passed",
        },
        deniedOutput: {
          code: 403,
          message: "用户拒绝授权,ERP 写入请求未执行。",
          draft_id: "BX-DRAFT-7781",
          status: "denied",
        },
        feedbackMessages: {
          "deny-permission": "已拒绝 ERP 写入授权,当前流程停留在草稿阶段。",
        },
        annotation: {
          label: "HITL[permission]",
          type: "tool_call",
          subtype: "mcp_connector",
          schema: {
            tool_name: "erp.expense.write",
            connector: "ERP",
            args: {
              draft_id: "BX-DRAFT-7781",
              lines: 6,
              attachments: 3,
            },
            output: {
              code: 200,
              draft_id: "BX-DRAFT-7781",
            },
          },
          hitl_policy: "allow_once_or_always",
        },
      },
    ],
  },
  {
    id: 18,
    title: "写入 ERP 报销单",
    kind: "TOOL_CALL",
    items: [
      {
        kind: "tool_call",
        id: "tool-erp-write-running",
        toolName: "erp.expense.write",
        category: "connector",
        connector: "ERP",
        status: "running",
        headline: "erp.expense.write",
        action: "写入",
        target: "ERP 报销单",
        elapsed: "00:08",
        summary: "正在写入 ERP 报销单字段与附件。",
        stream: [
          "校验员工成本中心...",
          "写入机票 ¥1,280...",
          "写入酒店 ¥1,080...",
          "写入交通 ¥187...",
          "关联差旅补贴与项目编码...",
        ],
        args: {
          draft_id: "BX-DRAFT-7781",
          mode: "streaming_update",
        },
        annotation: {
          label: "TOOL_CALL[running]",
          type: "tool_call",
          subtype: "mcp_connector",
          schema: {
            tool_name: "erp.expense.write",
            args: {
              draft_id: "BX-DRAFT-7781",
            },
            stream: true,
            output: "partial",
          },
        },
      },
    ],
  },
  {
    id: 19,
    title: "ERP 接口超时",
    kind: "TOOL_CALL",
    items: [
      {
        kind: "tool_call",
        id: "tool-erp-error",
        toolName: "erp.expense.write",
        category: "connector",
        connector: "ERP",
        status: "error",
        headline: "erp.expense.write",
        action: "调用",
        target: "ERP 接口失败",
        elapsed: "10.0s",
        summary: "超时: ERP 网关 10 秒内未返回。",
        autoRetry: true,
        retryMessage: "系统已自动发起重试,正在重新提交 ERP 写入请求。",
        args: {
          draft_id: "BX-DRAFT-7781",
          retryable: true,
        },
        output: {
          code: "ERP_GATEWAY_TIMEOUT",
          retry_after_ms: 2000,
        },
        annotation: {
          label: "TOOL_CALL[error]",
          type: "tool_call",
          subtype: "mcp_connector",
          schema: {
            tool_name: "erp.expense.write",
            args: {
              draft_id: "BX-DRAFT-7781",
            },
            error: {
              code: "ERP_GATEWAY_TIMEOUT",
              retryable: true,
            },
            latency_ms: 10000,
          },
          hitl_policy: "retry_or_skip",
        },
      },
    ],
  },
  {
    id: 20,
    title: "重试后 ERP 写入成功",
    kind: "TOOL_CALL",
    items: [
      {
        kind: "tool_call",
        id: "tool-erp-write-success",
        toolName: "erp.expense.write",
        category: "connector",
        connector: "ERP",
        status: "success_expanded",
        headline: "erp.expense.write",
        action: "重试写入",
        target: "ERP 报销单",
        elapsed: "2.9s",
        summary: "写入成功 · BX-DRAFT-7781 · 2.9s",
        args: {
          draft_id: "BX-DRAFT-7781",
          retry: 1,
        },
        output: {
          amount: "¥3,847",
          lines: 6,
          attachments: 3,
          validation: "passed",
        },
        annotation: {
          label: "TOOL_CALL[success]",
          type: "tool_call",
          subtype: "mcp_connector",
          schema: {
            tool_name: "erp.expense.write",
            args: {
              draft_id: "BX-DRAFT-7781",
              retry: 1,
            },
            output: {
              validation: "passed",
              lines: 6,
            },
            latency_ms: 2930,
          },
        },
      },
    ],
  },
  {
    id: 21,
    title: "最终提交前破坏性确认",
    kind: "DESTRUCTIVE_CONFIRMATION",
    hitl: "destructive",
    items: [
      {
        kind: "tool_call",
        id: "tool-oa-destructive",
        toolName: "oa.approval.submit",
        category: "connector",
        connector: "OA",
        status: "destructive",
        headline: "oa.approval.submit",
        action: "即将提交至 OA 审批流",
        target: "提交后不可撤销",
        elapsed: "等待确认",
        summary: "提交后将进入上级审批,草稿不可继续编辑。",
        impact: ["将提交报销单 BX-DRAFT-7781 至 OA 审批流", "将锁定 6 条费用明细与 3 份票据附件", "将通知直属上级 李经理 和财务共享中心"],
        paths: ["/ERP/expense/BX-DRAFT-7781", "/OA/approval/travel/BX-DRAFT-7781", "/ClawAgent/差旅报销/BX20260423001"],
        args: {
          draft_id: "BX-DRAFT-7781",
          submit: true,
          irreversible: true,
        },
        annotation: {
          label: "HITL[destructive]",
          type: "tool_call",
          subtype: "mcp_connector",
          schema: {
            tool_name: "oa.approval.submit",
            args: {
              draft_id: "BX-DRAFT-7781",
              irreversible: true,
            },
            output: null,
            impact_count: 3,
          },
          hitl_policy: "confirm_only_no_always",
        },
      },
    ],
  },
  {
    id: 22,
    title: "OA 审批提交成功",
    kind: "TOOL_CALL",
    items: [
      {
        kind: "tool_call",
        id: "tool-oa-submit-success",
        toolName: "oa.approval.submit",
        category: "connector",
        connector: "OA",
        status: "success_collapsed",
        headline: "oa.approval.submit",
        action: "提交",
        target: "OA 审批流",
        elapsed: "1.6s",
        summary: "提交成功 · 审批单 BX20260423001 · 1.6s",
        args: {
          draft_id: "BX-DRAFT-7781",
        },
        output: {
          approval_no: "BX20260423001",
          assignee: "李经理",
          sla: "2 工作日",
        },
        annotation: {
          label: "TOOL_CALL[success]",
          type: "tool_call",
          subtype: "mcp_connector",
          schema: {
            tool_name: "oa.approval.submit",
            args: {
              draft_id: "BX-DRAFT-7781",
            },
            output: {
              approval_no: "BX20260423001",
              status: "submitted",
            },
            latency_ms: 1610,
          },
        },
      },
    ],
  },
  {
    id: 23,
    title: "提交完成说明",
    kind: "NARRATION",
    items: [
      {
        kind: "narration",
        id: "msg-narration-004",
        text: "报销申请已提交至 OA 审批流,ERP 草稿已锁定并完成附件归档。直属上级将收到审批提醒,财务共享中心会在审批完成后复核发票。",
        annotation: {
          label: "NARRATION",
          type: "agent_narration",
          schema: {
            message_id: "msg-narration-004",
            role: "assistant",
            derived_from_tools: ["tool-oa-submit-success"],
          },
        },
      },
    ],
  },
  {
    id: 24,
    title: "创建申请文档",
    kind: "TOOL_CALL",
    items: [
      {
        kind: "tool_call",
        id: "tool-docx-generate-running",
        toolName: "document.generate_docx",
        category: "doc",
        presentation: "local_file_create",
        status: "running",
        headline: "创建：差旅申请草稿.docx",
        action: "创建",
        target: "差旅申请草稿.docx",
        elapsed: "00:06",
        summary: "正在整理报销摘要、审批单号与附件索引。",
        stream: [
          "加载报销草稿 BX-DRAFT-7781...",
          "写入审批单号 BX20260423001...",
          "编排费用明细与附件目录...",
          "生成 Word 文档版式...",
        ],
        annotation: {
          label: "TOOL_CALL[running]",
          type: "tool_call",
          subtype: "document_generation",
          schema: {
            tool_name: "document.generate_docx",
            args: {
              draft_id: "BX-DRAFT-7781",
              format: "docx",
            },
            stream: true,
            output: "partial",
          },
        },
      },
    ],
  },
  {
    id: 25,
    title: "申请文档生成",
    kind: "TOOL_CALL",
    items: [
      {
        kind: "tool_call",
        id: "tool-docx-generate-success",
        toolName: "document.generate_docx",
        category: "doc",
        presentation: "local_file_create",
        status: "success_collapsed",
        headline: "创建：差旅申请草稿.docx",
        action: "创建",
        target: "差旅申请草稿.docx",
        elapsed: "6.4s",
        summary: "创建 差旅申请草稿.docx · 126 KB · 6.4s",
        output: {
          file_name: "差旅申请草稿.docx",
          path: "/ClawAgent/差旅报销/BX20260423001/差旅申请草稿.docx",
          size: "126 KB",
        },
        annotation: {
          label: "TOOL_CALL[success]",
          type: "tool_call",
          subtype: "document_generation",
          schema: {
            tool_name: "document.generate_docx",
            args: {
              draft_id: "BX-DRAFT-7781",
              format: "docx",
            },
            output: {
              file_name: "差旅申请草稿.docx",
              size_kb: 126,
            },
            latency_ms: 6400,
          },
        },
      },
    ],
  },
  {
    id: 26,
    title: "上下文压缩",
    kind: "CONTEXT_COMPRESSION",
    autoSuccess: true,
    blockAdvanceUntilComplete: true,
    items: [
      {
        kind: "context_compression",
        id: "context-compression-001",
        title: "上下文正在压缩",
        summary: "正在整理已完成的票据识别、ERP 草稿、审批状态与文件产物上下文。",
        completedTitle: "上下文压缩完成",
        completedSummary: "已保留关键决策、工具结果与待交付产物信息,后续步骤将基于压缩后的上下文继续执行。",
        annotation: {
          label: "CONTEXT_COMPRESSION",
          type: "context_compression",
          schema: {
            strategy: "summarize_completed_context",
            block_next_step_until_done: true,
            retained: [
              "票据字段",
              "ERP 草稿",
              "OA 审批状态",
              "交付产物",
            ],
          },
        },
      },
    ],
  },
  {
    id: 27,
    title: "生成并展示交付产物",
    kind: "ARTIFACT_CARD",
    items: [
      {
        kind: "artifact_list",
        id: "artifacts-001",
        artifacts: [
          {
            name: "差旅申请草稿.docx",
            path: "/ClawAgent/差旅报销/BX20260423001/差旅申请草稿.docx",
            size: "126 KB",
          },
          {
            name: "报销申请表.pdf",
            path: "/ClawAgent/差旅报销/BX20260423001/报销申请表.pdf",
            size: "428 KB",
          },
          {
            name: "附件清单.xlsx",
            path: "/ClawAgent/差旅报销/BX20260423001/附件清单.xlsx",
            size: "84 KB",
          },
        ],
        annotation: {
          label: "ARTIFACT_CARD",
          type: "artifact_list",
          schema: {
            session_id: "sess-expense-20260423",
            artifacts: [
              {
                artifact_id: "artifact-1",
                name: "差旅申请草稿.docx",
                path: "/ClawAgent/差旅报销/BX20260423001/差旅申请草稿.docx",
                size: "126 KB",
              },
              {
                artifact_id: "artifact-2",
                name: "报销申请表.pdf",
                path: "/ClawAgent/差旅报销/BX20260423001/报销申请表.pdf",
                size: "428 KB",
              },
              {
                artifact_id: "artifact-3",
                name: "附件清单.xlsx",
                path: "/ClawAgent/差旅报销/BX20260423001/附件清单.xlsx",
                size: "84 KB",
              },
            ],
            actions: [
              "preview",
              "download",
              "push_to_drive",
              "share",
            ],
          },
        },
      },
    ],
  },
  {
    id: 28,
    title: "用户要求删除本地草稿文件",
    kind: "USER_MESSAGE",
    items: [
      {
        kind: "user_message",
        id: "msg-user-002",
        text: "差旅申请草稿.docx 不需要保留了，帮我删除掉。",
        attachments: [],
        annotation: {
          label: "USER_MESSAGE",
          type: "user_message",
          schema: {
            message_id: "msg-user-002",
            role: "user",
            intent_hint: "delete_generated_local_file",
          },
        },
      },
    ],
  },
  {
    id: 29,
    title: "删除本地文件前的破坏性确认",
    kind: "DESTRUCTIVE_CONFIRMATION",
    hitl: "destructive",
    items: [
      {
        kind: "tool_call",
        id: "tool-local-delete-destructive",
        toolName: "shell.exec",
        category: "shell",
        status: "destructive",
        headline: "rm \"/ClawAgent/差旅报销/BX20260423001/差旅申请草稿.docx\"",
        action: "运行",
        target: "rm \"/ClawAgent/差旅报销/BX20260423001/差旅申请草稿.docx\"",
        elapsed: "等待确认",
        summary: "rm \"/ClawAgent/差旅报销/BX20260423001/差旅申请草稿.docx\"",
        impact: ["将删除差旅申请草稿.docx", "将从当前任务产物中移除该文件", "不会影响已提交的 OA 审批单与 ERP 草稿"],
        paths: ["/ClawAgent/差旅报销/BX20260423001/差旅申请草稿.docx"],
        confirmLabel: "确认删除",
        cancelLabel: "保留文件",
        showEdit: false,
        confirmAdvanceSteps: 1,
        args: {
          command: "rm \"/ClawAgent/差旅报销/BX20260423001/差旅申请草稿.docx\"",
          cwd: "/ClawAgent/差旅报销/BX20260423001",
        },
        feedbackMessages: {
          "cancel-destructive": "已取消删除,本地草稿文件会继续保留。",
        },
        annotation: {
          label: "HITL[destructive]",
          type: "tool_call",
          subtype: "shell",
          schema: {
            tool_name: "shell.exec",
            args: {
              command: "rm \"/ClawAgent/差旅报销/BX20260423001/差旅申请草稿.docx\"",
              cwd: "/ClawAgent/差旅报销/BX20260423001",
            },
            output: null,
            impact_count: 3,
          },
          hitl_policy: "confirm_only_no_always",
        },
      },
    ],
  },
  {
    id: 30,
    title: "本地文件删除",
    kind: "TOOL_CALL",
    items: [
      {
        kind: "tool_call",
        id: "tool-local-delete-success",
        toolName: "local.file.delete",
        category: "file",
        presentation: "local_file_delete",
        status: "success_collapsed",
        headline: "删除：差旅申请草稿.docx",
        action: "删除",
        target: "差旅申请草稿.docx",
        elapsed: "0.4s",
        summary: "删除 差旅申请草稿.docx · 0.4s",
        output: {
          file_name: "差旅申请草稿.docx",
          path: "/ClawAgent/差旅报销/BX20260423001/差旅申请草稿.docx",
          removed: true,
        },
        annotation: {
          label: "TOOL_CALL[success]",
          type: "tool_call",
          subtype: "local_file_system",
          schema: {
            tool_name: "local.file.delete",
            args: {
              path: "/ClawAgent/差旅报销/BX20260423001/差旅申请草稿.docx",
            },
            output: {
              removed: true,
            },
            latency_ms: 420,
          },
        },
      },
    ],
  },
  {
    id: 31,
    title: "删除完成说明",
    kind: "NARRATION",
    items: [
      {
        kind: "narration",
        id: "msg-narration-006",
        text: "本地草稿文件已删除，当前任务产物已同步更新为仅保留正式交付件。",
        annotation: {
          label: "NARRATION",
          type: "agent_narration",
          schema: {
            message_id: "msg-narration-006",
            role: "assistant",
            derived_from_tools: ["tool-local-delete-success"],
          },
        },
      },
    ],
  },
  {
    id: 32,
    title: "更新任务产物列表",
    kind: "ARTIFACT_CARD",
    items: [
      {
        kind: "artifact_list",
        id: "artifacts-after-delete",
        artifacts: [
          {
            name: "报销申请表.pdf",
            path: "/ClawAgent/差旅报销/BX20260423001/报销申请表.pdf",
            size: "428 KB",
          },
          {
            name: "附件清单.xlsx",
            path: "/ClawAgent/差旅报销/BX20260423001/附件清单.xlsx",
            size: "84 KB",
          },
        ],
        annotation: {
          label: "ARTIFACT_CARD",
          type: "artifact_list",
          schema: {
            session_id: "sess-expense-20260423",
            artifacts: [
              {
                artifact_id: "artifact-keep-1",
                name: "报销申请表.pdf",
                path: "/ClawAgent/差旅报销/BX20260423001/报销申请表.pdf",
                size: "428 KB",
              },
              {
                artifact_id: "artifact-keep-2",
                name: "附件清单.xlsx",
                path: "/ClawAgent/差旅报销/BX20260423001/附件清单.xlsx",
                size: "84 KB",
              },
            ],
            actions: [
              "preview",
              "download",
              "push_to_drive",
              "share",
            ],
          },
        },
      },
    ],
  },
  {
    id: 33,
    title: "最终审计与归档检查",
    kind: "TOOL_CALL",
    items: [
      {
        kind: "tool_call",
        id: "tool-browser-approval-check",
        toolName: "browser.inspect",
        category: "web",
        status: "success_expanded",
        headline: "browser.inspect OA 审批页",
        action: "检查",
        target: "OA 审批详情页",
        elapsed: "1.2s",
        summary: "已打开 OA 审批详情页,确认审批单状态与附件数量。",
        args: {
          url: "https://oa.example.com/approval/BX20260423001",
          wait_until: "networkidle",
        },
        output: {
          title: "OA 审批详情 - BX20260423001",
          url: "https://oa.example.com/approval/BX20260423001",
          findings: [
            "审批单状态: 已提交",
            "当前处理人: 李经理",
            "附件数量: 2",
            "SLA: 2 个工作日",
          ],
        },
        annotation: {
          label: "TOOL_CALL[browser]",
          type: "tool_call",
          subtype: "browser",
          schema: {
            tool_name: "browser.inspect",
            args: {
              url: "https://oa.example.com/approval/BX20260423001",
            },
            output: {
              status: "submitted",
              assignee: "李经理",
            },
            latency_ms: 1210,
          },
        },
      },
      {
        kind: "tool_call",
        id: "tool-shell-artifact-list",
        toolName: "shell.exec",
        category: "shell",
        status: "success_expanded",
        headline: "shell.exec ls artifacts",
        action: "列出",
        target: "归档目录",
        elapsed: "0.3s",
        summary: "已检查归档目录,确认本地草稿已删除且正式交付件仍保留。",
        args: {
          command: "ls -lh /ClawAgent/差旅报销/BX20260423001",
          cwd: "/ClawAgent/差旅报销/BX20260423001",
        },
        output: {
          exit_code: 0,
          stdout: "-rw-r--r--  报销申请表.pdf 428K\n-rw-r--r--  附件清单.xlsx 84K",
          stderr: "",
        },
        annotation: {
          label: "TOOL_CALL[shell]",
          type: "tool_call",
          subtype: "shell",
          schema: {
            tool_name: "shell.exec",
            args: {
              command: "ls -lh",
              cwd: "/ClawAgent/差旅报销/BX20260423001",
            },
            output: {
              exit_code: 0,
              files: 2,
            },
            latency_ms: 320,
          },
        },
      },
      {
        kind: "tool_call",
        id: "tool-code-reconcile",
        toolName: "code.execute",
        category: "code",
        status: "success_expanded",
        headline: "code.execute reimbursement reconciliation",
        action: "复核",
        target: "金额与附件一致性",
        elapsed: "0.9s",
        summary: "已用代码复核金额、附件数量与删除后的产物清单。",
        args: {
          language: "JavaScript",
          code: "const total = 1280 + 1080 + 187 + 1300;\nassert(total === 3847);\nassert(artifacts.length === 2);",
        },
        output: {
          result: "通过",
          total_amount: "¥3,847",
          diff: "¥0",
          checks: ["费用合计与 ERP 草稿一致", "OA 审批附件数量为 2", "本地草稿已从产物列表移除"],
        },
        annotation: {
          label: "TOOL_CALL[code]",
          type: "tool_call",
          subtype: "code_execution",
          schema: {
            tool_name: "code.execute",
            args: {
              language: "JavaScript",
            },
            output: {
              result: "passed",
              checks: 3,
            },
            latency_ms: 930,
          },
        },
      },
      {
        kind: "tool_call",
        id: "tool-subagent-audit",
        toolName: "agent.delegate",
        category: "subagent",
        status: "success_expanded",
        headline: "agent.delegate AuditTrail",
        action: "委派",
        target: "审计子代理",
        elapsed: "3.6s",
        summary: "审计子代理已完成审批、附件与归档一致性复核。",
        args: {
          agent: "AuditTrail",
          scope: "expense-session-final-check",
        },
        output: {
          agent: "AuditTrail",
          status: "完成",
          summary: "最终归档状态一致,无遗留本地草稿。",
          tasks: [
            {
              title: "审批状态复核",
              detail: "OA 单据 BX20260423001 已提交",
              status: "done",
            },
            {
              title: "附件清单复核",
              detail: "正式交付件 2 个,草稿文件已移除",
              status: "done",
            },
            {
              title: "审计备注生成",
              detail: "已写入会话总结",
              status: "done",
            },
          ],
        },
        annotation: {
          label: "TOOL_CALL[subagent]",
          type: "tool_call",
          subtype: "subagent",
          schema: {
            tool_name: "agent.delegate",
            args: {
              agent: "AuditTrail",
            },
            output: {
              status: "done",
              tasks: 3,
            },
            latency_ms: 3600,
          },
        },
      },
    ],
  },
  {
    id: 34,
    title: "全流程完成",
    kind: "NARRATION",
    items: [
      {
        kind: "narration",
        id: "msg-narration-007",
        text: "差旅报销流程已完成：审批已提交、正式文件已保留、本地草稿已删除，最终审计检查也已通过。",
        annotation: {
          label: "NARRATION",
          type: "agent_narration",
          schema: {
            message_id: "msg-narration-007",
            role: "assistant",
            derived_from_tools: ["tool-subagent-audit"],
          },
        },
      },
    ],
  },
] as ExpenseDemoStep[];


export const EXPENSE_DEMO_SESSION_ID = "task-001";

export function getExpenseDemoStepCount(): number {
  return EXPENSE_DEMO_STEPS.length;
}

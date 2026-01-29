// ==========================================
// 核心类型定义
// ==========================================

export type Role = 'system' | 'user' | 'assistant';

export interface Message {
  role: Role;
  content: string;
  imageUrl?: string; // <--- 新增：用于存储用户上传的图片路径
}

export interface LogEntry {
  id: string;
  messages: Message[];
  createdAt: string;
  tokens: number;
  latency: number; // ms
}

export type AgentType = 'autonomous' | 'workflow';

export interface AgentProfile {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  avatar?: string;
  updatedAt: string;
}

// ==========================================
// 反馈详情接口
// ==========================================

export interface FeedbackDetail {
  status: 'like' | 'dislike' | null;
  tags?: string[];   // e.g. ["事实错误", "逻辑问题"]
  content?: string;  // e.g. "回答重复，答案还不准确。"
}

// ==========================================
// 场景 1: 自主规划智能体 (OSINT 情报分析)
// 特征: 包含 system 角色，侧重人设和推理
// 数据逻辑: 模拟 SFT 训练数据构建，将一次多轮对话切片为多条记录
// ==========================================

const SYSTEM_PROMPT = '你是一名资深开源情报(OSINT)分析师。你的任务是根据用户提供的零散信息，结合知识库，输出逻辑严密的分析报告。请保持客观、中立，并注明信息可信度。';

const MOCK_LOGS_OSINT: LogEntry[] = [
  // lib/mock/agent-data.ts -> MOCK_LOGS_OSINT 数组

  {
    id: 'log-osint-multimodal-01',
    createdAt: '2026-01-25 16:45:00', // 最近的时间
    tokens: 3400,
    latency: 4200,
    messages: [
      {
        role: 'system',
        content: '你是一名资深开源情报(OSINT)分析师。你的任务是根据用户提供的零散信息，结合知识库，输出逻辑严密的分析报告。请保持客观、中立，并注明信息可信度。'
      },
      {
        role: 'user',
        content: '这是刚刚通过商业卫星获取的 T-72 区域高分辨率图像。请分析画面中的异常活动，并识别潜在的军事设施部署。',
        // 用户发图：模拟上传了一张卫星图
        imageUrl: '/mock/satellite-input.png'
      },
      {
        role: 'assistant',
        content: '收到图像。正在通过 Computer Vision 模型进行特征比对...\n\n根据图像的光谱特征和几何形状分析，我发现了以下关键情报：\n\n1. **伪装网覆盖**：在坐标 (34.5, 69.2) 处发现大面积伪装网，覆盖面积约 400 平方米。\n2. **热源异常**：红外波段显示该区域有未冷却的发动机热源。\n\n以下是目标的自动标注与识别结果：\n<appforgeimg src="/mock/analysis-result.png" />\n\n**结论**：该区域极有可能是处于战备状态的前线补给站，建议调用 SAR 雷达进行二次确认。'
      }
    ]
  },
  // ... 原有的其他数据保持在后面
  // ------------------------------------------------------
  // 记录 1 (最新): 第三轮对话
  // 上下文包含: System + 第一轮 + 第二轮
  // Input: ... + "这对 C4ISR 项目有何参考意义？"
  // ------------------------------------------------------
  {
    id: 'log-osint-003',
    createdAt: '2026-01-24 12:30:00', // 时间最晚
    tokens: 2850, // token 数最多（累积了历史）
    latency: 3500,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      // --- Round 1 ---
      { role: 'user', content: '请分析一下 Anduril Industries 最近在 Lattice 系统上的更新动向。' },
      { role: 'assistant', content: '根据最新的开源情报，Anduril Industries 对 Lattice 进行了以下更新：\n1. **传感器融合**：支持水下无人潜航器(UUV)和高空无人机。\n2. **AI识别**：复杂地形识别率提升 40%。\n3. **集成**：新增 Palantir Gotham 双向同步。' },
      // --- Round 2 ---
      { role: 'user', content: '具体支持哪些第三方传感器型号？' },
      { role: 'assistant', content: '目前已确认支持的第三方型号包括：\n- Echodyne 的 EchoGuard 雷达\n- Wisk Aero 的自动驾驶模块\n- 通用原子的 MQ-9 Reaper 数据链路接口。这是通过其开放式 API "Menace" 实现的。' },
      // --- Round 3 (当前轮次) ---
      { role: 'user', content: 'Lattice 的这些更新对我们的 C4ISR 项目有什么参考意义？' },
      { role: 'assistant', content: '参考意义主要体现在架构层面：\n\n1. **边缘计算前置**：Lattice 将大量推理任务放在无人机终端处理，减少了对带宽的依赖。这对于我们在弱网环境下的 C4ISR 设计极具参考价值。\n2. **人机协作模式**：其“监视-告警-决策”的闭环流程，极大地降低了操作员的认知负荷，我们可以借鉴其 UI/UX 设计逻辑。' }
    ]
  },

  // ------------------------------------------------------
  // 记录 2 (中间): 第二轮对话
  // 上下文包含: System + 第一轮
  // Input: ... + "支持哪些第三方传感器？"
  // ------------------------------------------------------
  {
    id: 'log-osint-002',
    createdAt: '2026-01-24 12:15:00',
    tokens: 1500,
    latency: 2100,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      // --- Round 1 ---
      { role: 'user', content: '请分析一下 Anduril Industries 最近在 Lattice 系统上的更新动向。' },
      { role: 'assistant', content: '根据最新的开源情报，Anduril Industries 对 Lattice 进行了以下更新：\n1. **传感器融合**：支持水下无人潜航器(UUV)和高空无人机。\n2. **AI识别**：复杂地形识别率提升 40%。\n3. **集成**：新增 Palantir Gotham 双向同步。' },
      // --- Round 2 (当前轮次) ---
      { role: 'user', content: '具体支持哪些第三方传感器型号？' },
      { role: 'assistant', content: '目前已确认支持的第三方型号包括：\n- Echodyne 的 EchoGuard 雷达\n- Wisk Aero 的自动驾驶模块\n- 通用原子的 MQ-9 Reaper 数据链路接口。这是通过其开放式 API "Menace" 实现的。' }
    ]
  },

  // ------------------------------------------------------
  // 记录 3 (最早): 第一轮对话
  // 上下文包含: System
  // Input: "分析 Lattice 动向"
  // ------------------------------------------------------
  {
    id: 'log-osint-001',
    createdAt: '2026-01-24 12:00:00', // 时间最早
    tokens: 800,
    latency: 1800,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      // --- Round 1 (当前轮次) ---
      { role: 'user', content: '请分析一下 Anduril Industries 最近在 Lattice 系统上的更新动向。' },
      { role: 'assistant', content: '根据最新的开源情报，Anduril Industries 对 Lattice 进行了以下更新：\n1. **传感器融合**：支持水下无人潜航器(UUV)和高空无人机。\n2. **AI识别**：复杂地形识别率提升 40%。\n3. **集成**：新增 Palantir Gotham 双向同步。' }
    ]
  }
];

// ==========================================
// 场景 2: 工作流智能体 (数据清洗)
// 特征: 无 system 角色，侧重纯任务指令
// 数据逻辑: 模拟迭代式数据处理（ETL），体现 Input 对历史指令的记忆
// ==========================================

const MOCK_LOGS_CLEANER: LogEntry[] = [
  // ------------------------------------------------------
  // 记录 1 (最新): 第三轮修正
  // 上下文: 解析JSON -> 手机号脱敏 -> (当前) 过滤无效数据
  // 特点: Input 包含了前两步的所有操作指令
  // ------------------------------------------------------
  {
    id: 'log-clean-multi-003',
    createdAt: '2026-01-24 09:30:00', // 最晚
    tokens: 1200,
    latency: 850,
    messages: [
      // --- Round 1: 初步解析 ---
      {
        role: 'user',
        content: '这是原始日志数据：\nUser: John Doe, Tel: 13800138000, Status: Active\nUser: Jane Smith, Tel: 13912345678, Status: Inactive\nUser: Bob, Tel: null, Status: Active\n\n请将其转换为 JSON 数组格式，字段包含 name, phone, status。'
      },
      {
        role: 'assistant',
        content: '[{"name": "John Doe", "phone": "13800138000", "status": "Active"}, {"name": "Jane Smith", "phone": "13912345678", "status": "Inactive"}, {"name": "Bob", "phone": null, "status": "Active"}]'
      },
      // --- Round 2: 隐私脱敏 ---
      {
        role: 'user',
        content: '对 phone 字段进行脱敏处理，中间四位用 * 号代替。'
      },
      {
        role: 'assistant',
        content: '[{"name": "John Doe", "phone": "138****8000", "status": "Active"}, {"name": "Jane Smith", "phone": "139****5678", "status": "Inactive"}, {"name": "Bob", "phone": null, "status": "Active"}]'
      },
      // --- Round 3: 过滤逻辑 (当前 Input) ---
      {
        role: 'user',
        content: '过滤掉 phone 为 null 或者 status 为 Inactive 的数据，只保留有效用户。'
      },
      {
        role: 'assistant',
        content: '[{"name": "John Doe", "phone": "138****8000", "status": "Active"}]'
      }
    ]
  },

  // ------------------------------------------------------
  // 记录 2 (中间): 第二轮修正
  // 上下文: 解析JSON -> (当前) 手机号脱敏
  // ------------------------------------------------------
  {
    id: 'log-clean-multi-002',
    createdAt: '2026-01-24 09:15:00',
    tokens: 800,
    latency: 600,
    messages: [
      // --- Round 1 ---
      {
        role: 'user',
        content: '这是原始日志数据：\nUser: John Doe, Tel: 13800138000, Status: Active\nUser: Jane Smith, Tel: 13912345678, Status: Inactive\nUser: Bob, Tel: null, Status: Active\n\n请将其转换为 JSON 数组格式，字段包含 name, phone, status。'
      },
      {
        role: 'assistant',
        content: '[{"name": "John Doe", "phone": "13800138000", "status": "Active"}, {"name": "Jane Smith", "phone": "13912345678", "status": "Inactive"}, {"name": "Bob", "phone": null, "status": "Active"}]'
      },
      // --- Round 2 (当前 Input) ---
      {
        role: 'user',
        content: '对 phone 字段进行脱敏处理，中间四位用 * 号代替。'
      },
      {
        role: 'assistant',
        content: '[{"name": "John Doe", "phone": "138****8000", "status": "Active"}, {"name": "Jane Smith", "phone": "139****5678", "status": "Inactive"}, {"name": "Bob", "phone": null, "status": "Active"}]'
      }
    ]
  },

  // ------------------------------------------------------
  // 记录 3 (最早): 第一轮任务
  // 上下文: (当前) 解析JSON
  // 特点: 无 System，直接开始任务
  // ------------------------------------------------------
  {
    id: 'log-clean-multi-001',
    createdAt: '2026-01-24 09:00:00', // 最早
    tokens: 400,
    latency: 500,
    messages: [
      // --- Round 1 (当前 Input) ---
      {
        role: 'user',
        content: '这是原始日志数据：\nUser: John Doe, Tel: 13800138000, Status: Active\nUser: Jane Smith, Tel: 13912345678, Status: Inactive\nUser: Bob, Tel: null, Status: Active\n\n请将其转换为 JSON 数组格式，字段包含 name, phone, status。'
      },
      {
        role: 'assistant',
        content: '[{"name": "John Doe", "phone": "13800138000", "status": "Active"}, {"name": "Jane Smith", "phone": "13912345678", "status": "Inactive"}, {"name": "Bob", "phone": null, "status": "Active"}]'
      }
    ]
  }
];

// ==========================================
// 场景 3: 工作流智能体 (多智能体写作)
// 特征: 无 system 角色，侧重生成与扩写
// ==========================================

const MOCK_LOGS_WRITER: LogEntry[] = [
  {
    id: 'log-write-001',
    createdAt: '2026-01-23 15:30:00',
    tokens: 2000,
    latency: 4000,
    messages: [
      {
        role: 'user',
        content: '请根据主题“人工智能的未来”写一个开头段落，风格要宏大。'
      },
      {
        role: 'assistant',
        content: '在星辰大海的征途上，人工智能不仅是工具的进化，更是人类智慧的延伸。站在21世纪的十字路口，我们看到的不再是冰冷的代码，而是即将被重塑的文明图景。从微观的神经元模拟到宏观的星际探索，AI 正以前所未有的速度，编织着属于未来的金色丝线。'
      }
    ]
  }
];

// ==========================================
// 数据仓库与查询方法
// ==========================================

const MOCK_AGENTS: Record<string, AgentProfile> = {
  // ==========================================
  // Group A: Autonomous Agents (Type: 'autonomous')
  // ==========================================
  'agent-osint': {
    id: 'agent-osint',
    name: 'OSINT开源情报整编',
    type: 'autonomous',
    description: '基于全网开源数据的深度情报挖掘与关联分析。',
    updatedAt: '2026-01-05 09:15:00'
  },
  'osint-01': {
    id: 'osint-01',
    name: 'OSINT开源情报整编',
    type: 'autonomous',
    description: '基于全网开源数据的深度情报挖掘与关联分析。',
    updatedAt: '2026-01-05 09:15:00'
  },
  'code-02': {
    id: 'code-02',
    name: 'CodeMaster 架构师',
    type: 'autonomous',
    description: '专注于代码审查、重构建议和技术方案设计。',
    updatedAt: '2026-01-07 10:30:00'
  },
  'device-03': {
    id: 'device-03',
    name: '设备维修判断与预测',
    type: 'autonomous',
    description: '基于传感器数据和历史维修记录，智能判断设备故障并预测维护需求。',
    updatedAt: '2026-01-03 11:00:00'
  },
  'knowledge-07': {
    id: 'knowledge-07',
    name: '知识库问答',
    type: 'autonomous',
    description: '基于知识库的智能问答系统，支持多轮对话和上下文理解。',
    updatedAt: '2025-12-31 15:45:00'
  },
  'kb-qa-09': {
    id: 'kb-qa-09',
    name: '知识库问答',
    type: 'autonomous',
    description: '基于知识库的智能问答系统，支持多轮对话和上下文理解。',
    updatedAt: '2025-12-31 15:45:00'
  },

  // ==========================================
  // Group B: Workflow Agents (Type: 'workflow')
  // ==========================================
  'agent-cleaner': {
    id: 'agent-cleaner',
    name: '数据清洗工作流',
    type: 'workflow',
    description: '自动化数据清洗和预处理工作流，支持多数据源输入和标准化输出。',
    updatedAt: '2026-01-08 14:20:00'
  },
  'flow-01': {
    id: 'flow-01',
    name: '数据清洗工作流',
    type: 'workflow',
    description: '自动化数据清洗和预处理工作流，支持多数据源输入和标准化输出。',
    updatedAt: '2026-01-08 14:20:00'
  },
  'agent-writer': {
    id: 'agent-writer',
    name: '多智能体写作',
    type: 'workflow',
    description: '智能协同写作助手，支持大纲生成、扩写和润色。',
    updatedAt: '2026-01-07 10:30:00'
  },
  'writing-04': {
    id: 'writing-04',
    name: '多智能体写作',
    type: 'workflow',
    description: '智能协同写作助手，支持大纲生成、扩写和润色。',
    updatedAt: '2026-01-07 10:30:00'
  },
  'extract-05': {
    id: 'extract-05',
    name: '文件内容提取',
    type: 'workflow',
    description: '智能提取各类文件中的结构化信息，支持 PDF、Word、Excel 等多种格式。',
    updatedAt: '2026-01-06 14:20:00'
  },
  'hyper-06': {
    id: 'hyper-06',
    name: '高血压病大模型',
    type: 'workflow',
    description: '基于医疗知识库的高血压疾病诊断与治疗方案生成系统。',
    updatedAt: '2026-01-04 16:45:00'
  },
  'hypertension-06': {
    id: 'hypertension-06',
    name: '高血压病大模型',
    type: 'workflow',
    description: '基于医疗知识库的高血压疾病诊断与治疗方案生成系统。',
    updatedAt: '2026-01-04 16:45:00'
  },
  'anti-fl-07': {
    id: 'anti-fl-07',
    name: '反FL分析智能体',
    type: 'workflow',
    description: '智能分析金融交易数据，识别异常模式和潜在风险。',
    updatedAt: '2026-01-02 13:30:00'
  },
  'analysis-01': {
    id: 'analysis-01',
    name: '数据分析工作流',
    type: 'workflow',
    description: '自动化数据分析流程，支持数据清洗、统计分析和可视化报告生成。',
    updatedAt: '2026-01-01 10:20:00'
  },
  'data-analysis-08': {
    id: 'data-analysis-08',
    name: '数据分析工作流',
    type: 'workflow',
    description: '自动化数据分析流程，支持多数据源整合',
    updatedAt: '2026-01-01 10:20:00'
  },
  'process-09': {
    id: 'process-09',
    name: '审批流程智能体',
    type: 'workflow',
    description: '企业审批流程自动化处理，支持多级审批和智能路由。',
    updatedAt: '2025-12-30 09:30:00'
  },
  'approval-10': {
    id: 'approval-10',
    name: '审批流程智能体',
    type: 'workflow',
    description: '企业审批流程自动化处理',
    updatedAt: '2025-12-30 09:30:00'
  },
  'report-08': {
    id: 'report-08',
    name: '报表生成工作流',
    type: 'workflow',
    description: '自动生成各类业务报表，支持自定义模板和数据源配置。',
    updatedAt: '2025-12-30 08:15:00'
  },
  'report-11': {
    id: 'report-11',
    name: '报表生成工作流',
    type: 'workflow',
    description: '自动生成各类业务报表',
    updatedAt: '2025-12-30 08:15:00'
  }
};

const MOCK_LOGS_MAP: Record<string, LogEntry[]> = {
  // ==========================================
  // Map all Autonomous Agents to OSINT logs
  // ==========================================
  'agent-osint': MOCK_LOGS_OSINT,
  'osint-01': MOCK_LOGS_OSINT,
  'code-02': MOCK_LOGS_OSINT,
  'device-03': MOCK_LOGS_OSINT,
  'knowledge-07': MOCK_LOGS_OSINT,
  'kb-qa-09': MOCK_LOGS_OSINT,

  // ==========================================
  // Map Workflow Agents to Cleaner/Writer logs
  // Data/Analysis Workflows -> Cleaner Logs
  // ==========================================
  'agent-cleaner': MOCK_LOGS_CLEANER,
  'flow-01': MOCK_LOGS_CLEANER,
  'extract-05': MOCK_LOGS_CLEANER,
  'analysis-01': MOCK_LOGS_CLEANER,
  'data-analysis-08': MOCK_LOGS_CLEANER,
  'process-09': MOCK_LOGS_CLEANER,
  'approval-10': MOCK_LOGS_CLEANER,
  'anti-fl-07': MOCK_LOGS_CLEANER,

  // ==========================================
  // Creative/Generation Workflows -> Writer Logs
  // ==========================================
  'agent-writer': MOCK_LOGS_WRITER,
  'writing-04': MOCK_LOGS_WRITER,
  'hyper-06': MOCK_LOGS_WRITER,
  'hypertension-06': MOCK_LOGS_WRITER,
  'report-08': MOCK_LOGS_WRITER,
  'report-11': MOCK_LOGS_WRITER
};

// 获取智能体详情
export function getAgentById(id: string): AgentProfile | undefined {
  return MOCK_AGENTS[id];
}

// 获取智能体日志
export function getLogsByAgentId(id: string): LogEntry[] {
  return MOCK_LOGS_MAP[id] || [];
}

// 获取所有智能体列表
export function getAllAgents(): AgentProfile[] {
  return Object.values(MOCK_AGENTS);
}

// ==========================================
// 数据转换函数：将 SFT 格式转换为 LogsTable 需要的格式
// ==========================================

import type { LogEntry as TableLogEntry } from "@/components/agent/logs-table";

/**
 * 将 SFT 格式的 LogEntry 转换为 LogsTable 需要的格式
 */
export function convertToTableLogEntry(
  log: LogEntry,
  agentType?: AgentType
): TableLogEntry {
  // 提取最后一个 user 消息作为 input
  const userMessages = log.messages.filter((msg) => msg.role === "user");
  const lastUserMessage = userMessages[userMessages.length - 1];
  const input = lastUserMessage?.content || "";

  // 提取最后一个 assistant 消息作为 output
  const assistantMessages = log.messages.filter(
    (msg) => msg.role === "assistant"
  );
  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
  const output = lastAssistantMessage?.content || "";

  // 随机分配 source（可以根据实际需求调整）
  const sources: TableLogEntry["source"][] = [
    "应用广场",
    "API调用",
    "网页端体验",
    "预览与调试",
  ];
  const source =
    sources[Math.floor(Math.random() * sources.length)] || "应用广场";

  return {
    id: log.id,
    input,
    output,
    timestamp: log.createdAt,
    source,
    userFeedback: { status: null },
    adminFeedback: { status: null },
    status: "pending",
  };
}

/**
 * 批量转换日志格式（带数据膨胀和随机化）
 */
export function convertLogsToTableFormat(
  logs: LogEntry[],
  agentType?: AgentType
): TableLogEntry[] {
  const inflatedLogs: TableLogEntry[] = [];
  const sources: TableLogEntry["source"][] = [
    "应用广场",
    "API调用",
    "网页端体验",
    "预览与调试",
  ];

  // 循环 5 次以填充表格
  for (let i = 0; i < 5; i++) {
    logs.forEach((log) => {
      // 1. Random Source
      const randomSource =
        sources[Math.floor(Math.random() * sources.length)];

      // 2. Random Feedback (10% like, 5% dislike, 85% null)
      const rand = Math.random();
      const feedbackStatus: "like" | "dislike" | null =
        rand > 0.9 ? "like" : rand > 0.85 ? "dislike" : null;
      
      // 生成用户反馈详情
      let userFeedback: FeedbackDetail = { status: feedbackStatus };
      if (feedbackStatus === "dislike") {
        // Tags 池
        const tagsPool = ['事实错误', '逻辑问题', '安全合规', '其他'];
        // Content 池
        const contentPool = ['回答重复，答案还不准确。', '数据过时，需要更新。', '理解错误，没有正确理解问题。', '答案不完整，缺少关键信息。'];
        
        // 随机生成 1-2 个 Tags
        const numTags = Math.floor(Math.random() * 2) + 1; // 1 或 2
        const selectedTags = [];
        const availableTags = [...tagsPool];
        for (let j = 0; j < numTags && availableTags.length > 0; j++) {
          const tagIndex = Math.floor(Math.random() * availableTags.length);
          selectedTags.push(availableTags[tagIndex]);
          availableTags.splice(tagIndex, 1);
        }
        
        // 随机选择一个 Content
        const selectedContent = contentPool[Math.floor(Math.random() * contentPool.length)];
        
        userFeedback = {
          status: "dislike",
          tags: selectedTags,
          content: selectedContent,
        };
      }
      
      // 生成管理员反馈（随机生成少量数据以便测试）
      let adminFeedback: FeedbackDetail = { status: null };
      const adminRand = Math.random();
      if (adminRand > 0.95) {
        // 5% 概率生成管理员反馈
        adminFeedback = {
          status: adminRand > 0.975 ? "like" : "dislike",
          tags: adminRand > 0.975 ? undefined : ['事实错误'],
          content: adminRand > 0.975 ? undefined : '需要人工审核。',
        };
      }

      // 3. Time Shift (faking history - 随机减去 0-48 小时)
      const originalDate = new Date(log.createdAt);
      // 每次循环从原始时间随机减去 0-48 小时，让时间错落有致
      const hoursToSubtract = Math.floor(Math.random() * 48);
      originalDate.setHours(originalDate.getHours() - hoursToSubtract);
      
      // 格式化为 YYYY-MM-DD HH:mm:ss
      const year = originalDate.getFullYear();
      const month = String(originalDate.getMonth() + 1).padStart(2, "0");
      const day = String(originalDate.getDate()).padStart(2, "0");
      const hours = String(originalDate.getHours()).padStart(2, "0");
      const minutes = String(originalDate.getMinutes()).padStart(2, "0");
      const seconds = String(originalDate.getSeconds()).padStart(2, "0");
      const timeStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      // 4. Construct Table Entry
      const baseEntry = convertToTableLogEntry(log, agentType);
      // 生成唯一ID：原始ID + 循环索引 + 随机字符串（确保唯一性）
      const uniqueId = `${log.id}-copy-${i}-${Math.random().toString(36).substring(2, 7)}`;
      inflatedLogs.push({
        ...baseEntry,
        id: uniqueId, // Unique ID
        source: randomSource, // Overwrite source
        userFeedback: userFeedback, // Overwrite feedback with detailed structure
        adminFeedback: adminFeedback, // Overwrite admin feedback
        timestamp: timeStr, // Overwrite time
        fullMessages: log.messages, // Pass the full conversation history
      });
    });
  }

  // 按时间倒序排列（最新的在前）
  return inflatedLogs.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
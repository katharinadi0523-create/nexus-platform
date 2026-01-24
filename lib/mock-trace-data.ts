export interface Trace {
  traceId: string;
  status: "success" | "failed";
  input: string;
  output: string;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  latency: number; // milliseconds
  latencyFirstResp: number | null; // milliseconds
  startTime: string;
  spanId?: string;
  spanType?: string;
  spanName?: string;
  autonomousAgent?: string;
  workflowAgent?: string;
  workflow?: string;
  dataExpiryTime?: string;
  promptKey?: string;
  projectId?: string;
  organizationId?: string;
}

// 基于智能体列表生成Trace数据
const AGENT_NAMES = [
  "OSINT开源情报整编",
  "CodeMaster 架构师",
  "设备维修判断与预测",
  "数据清洗工作流",
  "多智能体写作",
  "文件内容提取",
  "高血压病大模型",
  "反FL分析智能体",
  "数据分析工作流",
  "知识库问答",
  "审批流程智能体",
  "报表生成工作流",
];

const AGENT_TYPES = [
  "自主规划智能体",
  "工作流智能体",
];

const WORKFLOW_NAMES = [
  "数据清洗工作流",
  "数据分析工作流",
  "审批流程工作流",
  "报表生成工作流",
];

const SAMPLE_INPUTS = [
  "劳动合同解除的法律责任是什么?",
  "婚姻登记的法律程序是什么?",
  "财产继承的法律责任是什么?",
  "这张风景图中有哪些自然景观?",
  '{"days_num":"3","destination":"武汉","people":"2"}',
  "房屋租赁合同的主要条款有哪些?",
  "交通违法行为的处罚标准是什么?",
  "交通事故责任如何认定?",
  "劳动合同续签需要注意什么?",
  "这张图片显示的是什么季节?",
  "如何优化数据库查询性能?",
  "微服务架构的设计原则是什么?",
  "如何进行代码重构?",
  "API设计的最佳实践有哪些?",
  "如何实现分布式系统的容错机制?",
];

const SAMPLE_OUTPUTS = [
  "劳动合同解除需遵循法定程序,如提前通知、支付经济补偿等。根据《劳动合同法》规定,用人单位解除劳动合同应当提前三十日书面通知劳动者,或者额外支付劳动者一个月工资后可以解除劳动合同。",
  "婚姻登记需提交身份证明和婚姻状况证明。根据《婚姻登记条例》,当事人应当共同到一方常住户口所在地的婚姻登记机关办理结婚登记,并提交相关证明材料。",
  "参考内容中仅提及在婚姻法指南里,离婚时财产分割的相关规定。财产继承需要按照《继承法》的相关规定执行,包括法定继承和遗嘱继承两种方式。",
  "####基本信息- 图片解析内容: 画面中展示了山川、河流、森林等自然景观,构成了一幅优美的风景画面。",
  "请提供出发地、人数、主题以及预算等具体信息,以便为您制定详细的旅行计划。",
  "房屋租赁合同应当包括租赁物的名称、数量、用途、租赁期限、租金及其支付期限和方式、租赁物维修等条款。",
  "交通违法行为根据情节轻重,可能面临警告、罚款、暂扣或吊销驾驶证、拘留等处罚。具体处罚标准依据《道路交通安全法》及相关法规执行。",
  "交通事故责任认定应当根据当事人的行为对发生道路交通事故所起的作用以及过错的严重程度确定。",
  "劳动合同续签时,双方应当协商一致,明确续签期限、工作内容、劳动报酬等事项,并签订书面续签协议。",
  "根据图片中的植被、天气和光线特征,可以判断这是春季的景象。",
  "优化数据库查询性能可以从索引设计、查询语句优化、分页查询、缓存策略等多个方面入手。",
  "微服务架构的设计原则包括单一职责、服务自治、去中心化治理、容错设计、可观测性等。",
  "代码重构需要遵循小步快跑、保持功能不变、充分测试等原则,逐步改善代码质量。",
  "API设计应当遵循RESTful规范,注重版本管理、错误处理、安全性、文档完整性等方面。",
  "分布式系统的容错机制包括超时重试、熔断降级、限流控制、服务隔离、数据备份等多种策略。",
];

function generateTraceId(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

function generateSpanId(): string {
  return Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(daysAgo: number = 3): string {
  const now = new Date();
  const daysBack = Math.floor(Math.random() * daysAgo);
  const hoursBack = Math.floor(Math.random() * 24);
  const minutesBack = Math.floor(Math.random() * 60);
  const secondsBack = Math.floor(Math.random() * 60);
  
  const date = new Date(now);
  date.setDate(date.getDate() - daysBack);
  date.setHours(date.getHours() - hoursBack);
  date.setMinutes(date.getMinutes() - minutesBack);
  date.setSeconds(date.getSeconds() - secondsBack);
  
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  
  return `${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function generateExpiryTime(startTime: string): string {
  // 假设数据保留30天
  const [datePart, timePart] = startTime.split(" ");
  const [month, day] = datePart.split("-").map(Number);
  const currentYear = new Date().getFullYear();
  const date = new Date(currentYear, month - 1, day);
  date.setDate(date.getDate() + 30);
  
  const newMonth = String(date.getMonth() + 1).padStart(2, "0");
  const newDay = String(date.getDate()).padStart(2, "0");
  
  return `${newMonth}-${newDay} ${timePart}`;
}

export function generateTraceData(count: number = 50): Trace[] {
  const traces: Trace[] = [];
  
  for (let i = 0; i < count; i++) {
    const agentType = getRandomElement(AGENT_TYPES);
    const agentName = getRandomElement(AGENT_NAMES);
    const input = getRandomElement(SAMPLE_INPUTS);
    const output = getRandomElement(SAMPLE_OUTPUTS);
    const startTime = getRandomDate(3);
    const status: "success" | "failed" = Math.random() > 0.1 ? "success" : "failed";
    
    // 生成token数量
    const inputTokens = Math.floor(Math.random() * 500) + 200;
    const outputTokens = Math.floor(Math.random() * 800) + 300;
    const tokens = inputTokens + outputTokens;
    
    // 生成延迟时间（毫秒）
    const latency = Math.floor(Math.random() * 15000) + 500; // 500ms - 15s
    const latencyFirstResp = Math.random() > 0.3 
      ? Math.floor(Math.random() * latency * 0.8) + 100 
      : null;
    
    const trace: Trace = {
      traceId: generateTraceId(),
      status,
      input,
      output,
      tokens,
      inputTokens,
      outputTokens,
      latency,
      latencyFirstResp,
      startTime,
      spanId: generateSpanId(),
      spanType: getRandomElement(["数据库查询", "API调用", "模型推理", "知识库检索"]),
      spanName: getRandomElement(["查询用户信息", "调用外部API", "生成回答", "检索文档"]),
      dataExpiryTime: generateExpiryTime(startTime),
      promptKey: `prompt_${Math.floor(Math.random() * 10) + 1}`,
      projectId: `project_${Math.floor(Math.random() * 5) + 1}`,
      organizationId: `org_${Math.floor(Math.random() * 3) + 1}`,
    };
    
    // 根据智能体类型设置相应字段
    if (agentType === "自主规划智能体") {
      trace.autonomousAgent = agentName;
    } else {
      trace.workflowAgent = agentName;
      trace.workflow = getRandomElement(WORKFLOW_NAMES);
    }
    
    traces.push(trace);
  }
  
  // 按时间倒序排列
  return traces.sort((a, b) => {
    const timeA = new Date(`2024-${a.startTime.replace(" ", "T")}`).getTime();
    const timeB = new Date(`2024-${b.startTime.replace(" ", "T")}`).getTime();
    return timeB - timeA;
  });
}

export const TRACE_MOCK_DATA: Trace[] = generateTraceData(100);

import type {
  ConversationMessageWithAudit,
  ConversationTimelineActionKind,
  ConversationTimelineItem,
} from "@/components/claw-hub-next/detail/utils";

function message(
  id: string,
  role: "user" | "assistant",
  content: string,
  attachments?: string[]
): ConversationMessageWithAudit {
  return {
    id,
    role,
    sender: role === "user" ? "邸若楠" : "Claw",
    time: "刚刚",
    content,
    attachments,
    auditRecords: [],
  };
}

function user(
  id: string,
  content: string,
  attachments?: string[]
): ConversationTimelineItem {
  return {
    key: id,
    type: "user",
    message: message(id, "user", content, attachments),
  };
}

function thinking(id: string, content: string): ConversationTimelineItem {
  return {
    key: id,
    type: "thinking",
    active: false,
    message: message(id, "assistant", content),
  };
}

function action(
  id: string,
  title: string,
  kind: ConversationTimelineActionKind,
  logs: string[]
): ConversationTimelineItem {
  return {
    key: id,
    type: "action",
    title,
    kind,
    status: "done",
    logs,
    source: "audit",
  };
}

function output(
  id: string,
  content: string,
  attachments?: string[]
): ConversationTimelineItem {
  return {
    key: id,
    type: "output",
    message: message(id, "assistant", content, attachments),
  };
}

export const CREATE_TIMELINE_ITEMS: ConversationTimelineItem[] = [
  user("create-user", "帮我建一个能分析水稻 RNA 表达数据的 Skill。"),
  action("create-skill", "Skill · create skill", "skill", [
    "已接管 Skill 创建任务并保留原始对话。",
    "解析目标：水稻 RNA 表达数据；产物：确定性解析 Skill。",
  ]),
  thinking(
    "create-intent",
    "create skill 正在确认数据类型、输入输出目标和运行环境，并检查是否已有同类能力。"
  ),
  action("create-existing", "查询已有 Skill 与 AI-SKILL 工单池", "tool", [
    "中心端未发现可复用的水稻 RNA 表达解析 Skill。",
    "AI-SKILL 工单池无相同数据类型的待创建订单。",
  ]),
  action("create-ontology", "检索默认本体文件", "tool", [
    "命中格式规则：RNA expression matrix。",
    "结构规则：首列 gene_id，其余列为样本表达量。",
    "元数据字段：物种、样本、实验条件、表达值。",
    "解析规则：字段校验 → 矩阵标准化 → QC → 差异摘要。",
    "对应预装工具：pandas、scipy；运行时不得直接访问外网。",
  ]),
  action("create-parser-method", "按本体规则确定解析方法", "tool", [
    "依据本体的结构规则生成表头与数值类型校验。",
    "依据本体的解析规则装配矩阵读取、缺失值检查和样本分组校验。",
    "解析方法来源已记录为 default-ontology/rna-expression。",
  ]),
  action("create-package", "create skill · 生成标准 Skill 包", "skill", [
    "生成 skill.json / metadata.yaml。",
    "生成 SKILL.md、src/main.py、src/parser.py。",
    "生成 runtime/dependencies.txt 与 tests/evaluation_config.yaml。",
  ]),
  action("create-tests", "运行基础生成校验", "tool", [
    "标准用例 2 / 异常用例 1 / 边界用例 1。",
    "结构校验通过；4/4 基础用例通过。",
  ]),
  output(
    "create-output",
    "已由 create skill 完成首版草稿。本次解析方法不是从样本猜测，而是来自默认本体文件中的格式定义、结构规则、元数据字段、解析规则和对应工具。",
    ["AI-SKILL-1048", "default-ontology/rna-expression"]
  ),
];

export const OPTIMIZE_TIMELINE_ITEMS: ConversationTimelineItem[] = [
  user(
    "opt-user",
    "这个 Skill 对缺表头的文件会报错，帮我优化健壮性，缺表头时按位置推断列。",
    ["失败运行 TASK-2087", "样本 no_header.csv"]
  ),
  thinking(
    "opt-thinking",
    "已锁定当前版本并读取失败运行与样本，正在定位真实失败分支。"
  ),
  action("opt-log", "读取失败运行 TASK-2087", "tool", [
    "异常：KeyError: gene_id。",
    "定位：src/parser.py:18；解析器强制把首行当表头。",
  ]),
  action("opt-sample", "检查异常样本 no_header.csv", "tool", [
    "记录数 1,284；列数 3；未检测到表头。",
    "按本体字段顺序推断：gene_id / sample_a / sample_b。",
  ]),
  action("opt-skill", "Skill · research-table-hardening", "skill", [
    "修改 src/parser.py：增加表头检测与位置映射。",
    "新增 tests/test_headerless.py；更新 CHANGELOG.md。",
  ]),
  action("opt-regression", "执行回归测试", "tool", [
    "标准表头、无表头、空文件三类用例全部通过。",
  ]),
  output(
    "opt-output",
    "已基于失败运行和样本生成新版本改动。解析规则与本体字段顺序保持一致，可另存为新版本。"
  ),
];

export const RESEARCH_OPTIMIZE_TIMELINE_ITEMS: ConversationTimelineItem[] = [
  user(
    "research-opt-user",
    "这个技能处理一篇包含多个实验的论文时，结论和证据位置会错配。请按实验章节拆分，并给每条结论补页码和原文依据。",
    ["失败运行 TASK-RESEARCH-1042", "论文 rice_drought_study.pdf"]
  ),
  thinking(
    "research-opt-thinking",
    "已锁定 v1.0，并把失败运行与论文原文作为同一轮优化依据。"
  ),
  action("research-opt-log", "读取抽取失败记录", "tool", [
    "问题：3 条结论共用了同一证据片段。",
    "影响文件：rice_drought_study.pdf。",
  ]),
  action("research-opt-pdf", "解析论文版面与实验章节", "tool", [
    "识别 Materials and Methods、Experiment 1、Experiment 2、Results。",
    "建立章节、页码与段落坐标索引。",
  ]),
  action("research-opt-skill", "Skill · scientific-evidence-tracer", "skill", [
    "修改 src/evidence.py。",
    "新增 src/citations.py 与 tests/test_multi_experiment_trace.py。",
  ]),
  action("research-opt-test", "执行证据一致性回归", "tool", [
    "claim 对应实验、页码有效、原文片段非空：9/9 通过。",
    "证据可追溯率：100%。",
  ]),
  output(
    "research-opt-output",
    "已将结论按实验章节拆分，并为每条结论补充页码、段落与原文证据。右侧已生成文件级改动。"
  ),
];

export const TRIAL_RUN_TIMELINE_ITEMS: ConversationTimelineItem[] = [
  user(
    "trial-user",
    "对当前锁定版本做一次 AI 试运行，自动识别、安装并锁定依赖。",
    ["samples/rice_expression.csv"]
  ),
  thinking(
    "trial-thinking",
    "先锁定当前 Skill 版本，再进行静态扫描；随后在隔离沙箱中安装候选依赖并运行 tests/。"
  ),
  action("trial-scan", "扫描依赖声明与 imports", "tool", [
    "候选依赖：pandas>=2.2、scipy>=1.13。",
    "平台引用：无。",
  ]),
  action("trial-fixture", "选择试运行样例", "tool", [
    "选择 samples/rice_expression.csv，覆盖主执行路径。",
  ]),
  action("trial-sandbox", "创建隔离沙箱并安装依赖", "tool", [
    "Python 3.11。",
    "已安装 pandas==2.2.2、scipy==1.13.1。",
  ]),
  action("trial-skill", "Skill · 执行当前锁定版本", "skill", [
    "退出码 0；基础用例 4/4 通过。",
    "产物：artifacts/qc-summary.json。",
  ]),
  action("trial-snapshot", "冻结运行时快照", "tool", [
    "已写入 lockfile、wheel cache 与快照元数据。",
    "快照可复现。",
  ]),
  output(
    "trial-output",
    "当前版本已在沙箱中成功运行，依赖已锁定并冻结为运行时快照。后续使用与导出都复用该快照。"
  ),
];

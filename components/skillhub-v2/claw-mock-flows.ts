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
  user(
    "create-user",
    "上传了一个 genes.gff，本地好像还没有能解析这种格式的技能。帮我创建一个 GFF 解析 Skill。",
    ["samples/genes.gff"]
  ),
  action("create-skill", "Skill · create skill", "skill", [
    "已接管 Skill 创建任务，并挂载上传样本 samples/genes.gff。",
    "目标：确定性 GFF 解析 Skill（不调用大模型、运行时不联网）。",
  ]),
  thinking(
    "create-intent",
    "先确认这是本地尚无的新格式，再按解析流水线检索本地能力与本体对象类型；命中 Object Type 就按其属性与规则装配解析器，未命中才走样本推断 + 补写本体对象。"
  ),
  action("create-local-skills", "检索本地 Skill 库", "tool", [
    "已扫描租户技能管理：未找到 format=gff / gff3 的解析 Skill。",
    "相近能力：FASTQ解析（测序读段）、RNA 表达分析（表达矩阵）——格式不匹配，不可复用。",
  ]),
  action("create-work-order-pool", "检索 AI-SKILL 工单池", "tool", [
    "工单池无进行中的 GFF / 基因注释解析创建单。",
    "历史失败单 WO-2071 为 AB1 峰图，与本次格式无关。",
  ]),
  action("create-ontology", "检索本体对象类型", "tool", [
    "查询范围：本体 Object Type（非本体文件）。",
    "命中对象类型：GeneAnnotation（基因注释）。",
    "对象属性：seqid、source、type、start、end、strand、feature_count、species（可选）。",
    "结构约束：对应 GFF3 九列制表符模型；缺 type / 坐标非法即 QC 失败。",
    "解析规则与预装工具：gffutils、Bio.SeqIO；运行时禁止外网。",
  ]),
  action("create-parser-method", "按本体对象规则装配解析方法", "tool", [
    "判定：本地无 Skill，但本体已有 Object Type「GeneAnnotation」→ 按其属性与约束装配解析器（非从字节流猜测）。",
    "解析方法来源已记录为 ontology://object-type/GeneAnnotation。",
    "输出契约对齐：decode / feature_count / metadata / qc / lineage / ingested。",
  ]),
  action("create-package", "create skill · 生成标准 Skill 包", "skill", [
    "生成 skill.json / SKILL.md。",
    "生成 src/main.py、src/ontology.py、src/parse.py、src/metadata.py、src/lineage.py。",
    "生成 runtime/dependencies.txt、tests/test_gff_pipeline.py、samples/genes.gff。",
  ]),
  action("create-tests", "运行基础生成校验", "tool", [
    "标准用例 1 / 边界用例 1 / 异常用例 1（缺 type 列应报错且不入库）。",
    "确定性校验：同一输入两次输出一致；结构校验通过。",
  ]),
  output(
    "create-output",
    "已完成 GFF 解析 Skill 首版草稿。链路是：本地无现成 Skill → 本体命中 Object Type「GeneAnnotation」→ 按该对象类型的属性与预装工具装配解析器。可保存为 v1.0 草稿后进入试运行装配。",
    ["samples/genes.gff", "ontology://object-type/GeneAnnotation"]
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

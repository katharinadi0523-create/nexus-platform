/** Mock seed: 华南地方水稻种质重测序与耐盐关键基因 GWAS 挖掘. */
import type {
  AgentInvocation,
  ProjectArtifact,
  ProjectFileNode,
  ProjectMessage,
  Transformation,
} from "./types";
import type { ProjectIssue } from "@/lib/mock/my-claw/project-issues/types";
import {
  CONV_RICE_GWAS,
  CONV_RICE_PHENOTYPE,
  CONV_RICE_POPGEN,
  CONV_RICE_RESEQ,
  CONV_RICE_VALIDATION,
  PROJECT_RICE_SALT_GWAS_ID,
} from "./projects";
import { CURRENT_USER_ID } from "./workspaces";

const WS = "ws-research";
const PROJECT = PROJECT_RICE_SALT_GWAS_ID;
const human = (id: string) => ({ kind: "human" as const, id });
const agent = (id: string) => ({ kind: "agent" as const, id });

const CASES = [
  {
    conversationId: CONV_RICE_PHENOTYPE,
    key: "101",
    title: "田间表型数据收集",
    actorId: "actor-rice-phenotype",
    agentName: "表型采集 Claw",
    request:
      "@表型采集 Claw，请汇总 192 份华南地方水稻在 150 mM NaCl、14 天处理下的存活率、盐害评分、株高抑制率和 Na+/K+ 比值。材料清单与温室事件一并核对。",
    reply:
      "已发现 12 份材料 ID 与种子库标签不一致，且 6 号温室第 9 天存在灌溉中断。不会自行合并材料或删除重复；请确认材料身份与异常处理口径。林稻确认后，已保留事件标记、不插补，并提交表型 v2 与 QC 报告。",
    discovery:
      "首轮核对完成：12 份材料 ID 与种子库标签不一致；6 号温室在第 9 天 10:30–14:10 灌溉中断。当前将相关观测标为异常候选，不合并同名材料，也不对缺失值插补。请确认身份映射和事件处理口径。",
    decision:
      "林稻已复核：8 份为同名异写，4 份为标签错误，已给出映射表。孙岚确认灌溉中断期间保留原始记录并增加 event flag，不插补；后续 BLUP 需把温室批次写入模型。",
    inputFile: "salt_phenotype_raw.xlsx",
    outputFile: "salt_tolerance_phenotype_v2.parquet",
    reportFile: "phenotype_qc_report_v2.md",
    operation: "表型质控、重复汇总与 BLUP",
  },
  {
    conversationId: CONV_RICE_RESEQ,
    key: "102",
    title: "全基因组重测序与变异挖掘",
    actorId: "actor-rice-variant",
    agentName: "基因组变异 Claw",
    request:
      "@基因组变异 Claw，请使用 192 份材料的 FastQ、Nipponbare 参考基因组和文库批次表完成质控、比对、联合变异检测与过滤。",
    reply:
      "初筛发现 7 个样本的材料指纹与 sample sheet 不一致，一个 lane 的 reads 质量偏低。它们已标为 needs_identity_confirmation，而非自动剔除。Human 修正 sample sheet 后，5 个样本进入主分析，2 个低深度材料保留但不进入主 GWAS；过滤 VCF 与 QC 报告已验收发布。",
    discovery:
      "FastQ 质控结束：7 个样本的材料指纹与 sample sheet 不一致，lane L03 的 Q30 明显偏低。已暂停这 7 个样本的主分析入口，并保留原始 FASTQ 与诊断日志；不会因质量问题自动删除材料。",
    decision:
      "林稻确认 5 个 sample sheet 标签写反并提交修订版；其余 2 个低深度材料保留在项目中，但不进入主 GWAS。孙岚同意使用缺失率 ≤ 10%、MAF ≥ 0.05 的主分析过滤口径。",
    inputFile: "rice_landrace_fastq_manifest.csv",
    outputFile: "rice_landrace_filtered.vcf.gz",
    reportFile: "variant_qc_report.md",
    operation: "FastQ 质控、比对、联合变异检测与过滤",
  },
  {
    conversationId: CONV_RICE_POPGEN,
    key: "103",
    title: "群体遗传结构分析",
    actorId: "actor-rice-popgen",
    agentName: "群体遗传 Claw",
    request:
      "@群体遗传 Claw，请基于已验收 VCF 计算 PCA、ADMIXTURE、亲缘关系与 LD 衰减，并提出 GWAS 的结构校正建议。",
    reply:
      "PCA 显示籼粳分化显著，部分地方香稻形成独立簇。建议把前 3 个 PC 与 kinship 矩阵用于校正；K=3 仅作为结构描述，不作为材料剔除规则。孙岚确认后，协变量与亲缘矩阵已发布到 Project。",
    discovery:
      "PCA 前两轴已分开籼稻、粳稻和部分地方香稻；ADMIXTURE 的 K=3 有较低交叉验证误差。该结构可能造成假阳性，但目前没有证据支持按簇剔除材料。建议讨论 PC 数量和 kinship 的使用方式。",
    decision:
      "孙岚确认：K=3 只用于描述与结果解释，不用于剔除材料；GWAS 主模型使用前 3 个 PC 和 kinship 矩阵，并额外保留 PC2–PC5 的敏感性分析。",
    inputFile: "rice_landrace_filtered.vcf.gz",
    outputFile: "population_structure_covariates.csv",
    reportFile: "kinship_matrix.tsv",
    operation: "PCA、ADMIXTURE、kinship 与 LD 分析",
  },
  {
    conversationId: CONV_RICE_GWAS,
    key: "104",
    title: "耐盐性状 GWAS 关联分析",
    actorId: "actor-rice-gwas",
    agentName: "GWAS 分析 Claw",
    request:
      "@GWAS 分析 Claw，请绑定表型 v2、过滤 VCF、PC 与 kinship，使用 MLM 和 FarmCPU 分析耐盐性状，并给出模型诊断和 lead loci。",
    reply:
      "chr1 峰在 MLM 与 FarmCPU 中均出现，但仅支持当前苗期实验和当前群体。孙岚要求加入批次协变量敏感性分析，并采用有效标记数阈值；重跑后的 lead loci、QQ/Manhattan 图和诊断已由 Human 验收。",
    discovery:
      "第一轮结果中 chr1:25.8 Mb 峰在 MLM 与 FarmCPU 都出现，但加入温室批次前后效应有所变化；固定 Bonferroni 阈值可能过于保守。当前结果仅作为候选信号，尚未输出为稳定 lead loci。",
    decision:
      "孙岚要求把温室批次加入敏感性分析，并改用有效标记数计算阈值；若 lead SNP 只在单一模型出现，则降为探索性结果。若楠同意将 QQ 图、Manhattan 图和两套模型诊断一并作为验收材料。",
    inputFile: "population_structure_covariates.csv",
    outputFile: "salt_gwas_lead_loci.csv",
    reportFile: "gwas_model_diagnostics.md",
    operation: "MLM / FarmCPU 关联分析与敏感性诊断",
  },
  {
    conversationId: CONV_RICE_VALIDATION,
    key: "105",
    title: "候选基因筛选与验证",
    actorId: "actor-rice-candidate",
    agentName: "候选基因 Claw",
    request:
      "@候选基因 Claw，请围绕 GWAS lead loci 的 LD 区间整合注释、非同义变异、单倍型、盐胁迫表达和已有 QTL，形成候选基因优先级与验证计划。",
    reply:
      "候选按关联强度、功能影响、表达与既有盐胁迫证据分级，不以距离最近的基因直接定因果。Human 决定优先验证 OsHKT1;5 区域两个单倍型，同时保留一个证据较弱的新颖转录因子；独立群体、KASP、复现实验与 CRISPR 可行性计划已验收。",
    discovery:
      "lead loci 的 LD 区间内共有 18 个注释基因。距离最近的基因并不总有功能证据；OsHKT1;5 区域存在两个与盐害评分一致的单倍型，另一个转录因子候选较新颖但表达证据较弱。请确认优先级与验证资源投入。",
    decision:
      "若楠与孙岚确认：优先验证 OsHKT1;5 区域两个单倍型；保留该新颖转录因子为二级候选，不宣称其为因果基因。验证计划需要覆盖独立群体、KASP、盐胁迫复现及 CRISPR/过表达可行性。",
    inputFile: "salt_gwas_lead_loci.csv",
    outputFile: "salt_tolerance_candidate_genes.md",
    reportFile: "candidate_validation_plan.md",
    operation: "LD 区间注释、单倍型与证据分级",
  },
] as const;

export const RICE_GWAS_MESSAGES: ProjectMessage[] = CASES.flatMap(
  (item, index) => {
    const day = 1 + index * 2;
    const inputId = `file-rice-${item.key}-input`;
    const outputId = `file-rice-${item.key}-output`;
    const reportId = `file-rice-${item.key}-report`;
    const invocationId = `inv-rice-${item.key}`;
    return [
      {
        id: `msg-rice-${item.key}-request`,
        workspaceId: WS,
        projectId: PROJECT,
        threadId: item.conversationId,
        kind: "human" as const,
        author: human(index === 0 ? "user-lindao" : CURRENT_USER_ID),
        content: item.request,
        mentionedHumanIds: ["user-sunlan"],
        mentionedActorIds: [item.actorId],
        quotedMessageIds: [],
        fileIds: [inputId],
        artifactIds:
          index === 0 ? [] : [`art-rice-${CASES[index - 1].key}-output`],
        invocationIds: [invocationId],
        createdAt: `2026-08-${String(day).padStart(2, "0")}T09:10:00+08:00`,
      },
      {
        id: `msg-rice-${item.key}-discovery`,
        workspaceId: WS,
        projectId: PROJECT,
        threadId: item.conversationId,
        kind: "agent_reply" as const,
        author: agent(item.actorId),
        replyToMessageId: `msg-rice-${item.key}-request`,
        content: item.discovery,
        mentionedHumanIds: [CURRENT_USER_ID, "user-lindao", "user-sunlan"],
        mentionedActorIds: [],
        quotedMessageIds: [`msg-rice-${item.key}-request`],
        fileIds: [],
        artifactIds:
          index === 0 ? [] : [`art-rice-${CASES[index - 1].key}-output`],
        invocationIds: [],
        createdAt: `2026-08-${String(day).padStart(2, "0")}T10:20:00+08:00`,
      },
      {
        id: `msg-rice-${item.key}-decision`,
        workspaceId: WS,
        projectId: PROJECT,
        threadId: item.conversationId,
        kind: "human" as const,
        author: human(
          index === 0 || index === 1 ? "user-lindao" : "user-sunlan",
        ),
        content: item.decision,
        mentionedHumanIds: [CURRENT_USER_ID],
        mentionedActorIds: [item.actorId],
        quotedMessageIds: [`msg-rice-${item.key}-discovery`],
        fileIds: [],
        artifactIds: [],
        invocationIds: [invocationId],
        createdAt: `2026-08-${String(day).padStart(2, "0")}T11:05:00+08:00`,
      },
      {
        id: `msg-rice-${item.key}-reply`,
        workspaceId: WS,
        projectId: PROJECT,
        threadId: item.conversationId,
        kind: "agent_reply" as const,
        author: agent(item.actorId),
        replyToMessageId: `msg-rice-${item.key}-request`,
        content: item.reply,
        mentionedHumanIds: [CURRENT_USER_ID, "user-sunlan"],
        mentionedActorIds: [],
        quotedMessageIds: [],
        fileIds: [outputId, reportId],
        artifactIds: [
          `art-rice-${item.key}-output`,
          `art-rice-${item.key}-report`,
        ],
        invocationIds: [invocationId],
        agentReview: {
          status: "accepted",
          reviewedByUserId: CURRENT_USER_ID,
          reviewedAt: `2026-08-${String(day + 1).padStart(2, "0")}T16:00:00+08:00`,
        },
        createdAt: `2026-08-${String(day + 1).padStart(2, "0")}T15:40:00+08:00`,
      },
      {
        id: `msg-rice-${item.key}-accept`,
        workspaceId: WS,
        projectId: PROJECT,
        threadId: item.conversationId,
        kind: "human" as const,
        author: human(CURRENT_USER_ID),
        content: `我已验收 RSG-${item.key}：输入、处理口径和限制已记录。请将 ${item.outputFile} 与 ${item.reportFile} 发布到 Project，供下一阶段引用。`,
        mentionedHumanIds: [],
        mentionedActorIds: [item.actorId],
        quotedMessageIds: [`msg-rice-${item.key}-reply`],
        fileIds: [],
        artifactIds: [
          `art-rice-${item.key}-output`,
          `art-rice-${item.key}-report`,
        ],
        invocationIds: [],
        createdAt: `2026-08-${String(day + 1).padStart(2, "0")}T16:00:00+08:00`,
      },
    ];
  },
);

const makeFile = (
  id: string,
  name: string,
  conversationId: string,
  source: "human_upload" | "agent_artifact",
  creator: ReturnType<typeof human> | ReturnType<typeof agent>,
  issueId: string,
  createdAt: string,
): ProjectFileNode => ({
  id,
  workspaceId: WS,
  projectId: PROJECT,
  nodeType: "file",
  name,
  path: `rice-salt-gwas/${name}`,
  mimeType: name.endsWith(".vcf.gz")
    ? "application/gzip"
    : name.endsWith(".parquet")
      ? "application/x-parquet"
      : "text/plain",
  sizeBytes: 256000,
  source,
  createdBy: creator,
  scope: source === "human_upload" ? "conversation" : "project",
  sourceConversationId: conversationId,
  issueIds: [issueId],
  createdAt,
  updatedAt: createdAt,
});

export const RICE_GWAS_FILES: ProjectFileNode[] = CASES.flatMap(
  (item, index) => {
    const day = 1 + index * 2;
    const issueId = `issue-rice-${item.key}`;
    return [
      makeFile(
        `file-rice-${item.key}-input`,
        item.inputFile,
        item.conversationId,
        "human_upload",
        human(index === 0 ? "user-lindao" : CURRENT_USER_ID),
        issueId,
        `2026-08-${String(day).padStart(2, "0")}T09:00:00+08:00`,
      ),
      makeFile(
        `file-rice-${item.key}-output`,
        item.outputFile,
        item.conversationId,
        "agent_artifact",
        agent(item.actorId),
        issueId,
        `2026-08-${String(day + 1).padStart(2, "0")}T15:40:00+08:00`,
      ),
      makeFile(
        `file-rice-${item.key}-report`,
        item.reportFile,
        item.conversationId,
        "agent_artifact",
        agent(item.actorId),
        issueId,
        `2026-08-${String(day + 1).padStart(2, "0")}T15:40:00+08:00`,
      ),
    ];
  },
);

export const RICE_GWAS_ARTIFACTS: ProjectArtifact[] = CASES.flatMap(
  (item, index) => {
    const issueId = `issue-rice-${item.key}`;
    const createdAt = `2026-08-${String(2 + index * 2).padStart(2, "0")}T15:40:00+08:00`;
    const upstream =
      index === 0 ? [] : [`art-rice-${CASES[index - 1].key}-output`];
    return [
      {
        id: `art-rice-${item.key}-output`,
        workspaceId: WS,
        projectId: PROJECT,
        fileNodeId: `file-rice-${item.key}-output`,
        name: item.outputFile,
        kind: item.outputFile.endsWith(".md") ? "report" : "data",
        createdBy: agent(item.actorId),
        scope: "project" as const,
        sourceConversationId: item.conversationId,
        sourceArtifactIds: upstream,
        issueIds: [issueId],
        producedByTransformationId: `xform-rice-${item.key}`,
        createdAt,
      },
      {
        id: `art-rice-${item.key}-report`,
        workspaceId: WS,
        projectId: PROJECT,
        fileNodeId: `file-rice-${item.key}-report`,
        name: item.reportFile,
        kind: "report" as const,
        createdBy: agent(item.actorId),
        scope: "project" as const,
        sourceConversationId: item.conversationId,
        sourceArtifactIds: [`art-rice-${item.key}-output`],
        issueIds: [issueId],
        producedByTransformationId: `xform-rice-${item.key}`,
        createdAt,
      },
    ];
  },
);

export const RICE_GWAS_TRANSFORMATIONS: Transformation[] = CASES.map(
  (item, index) => ({
    id: `xform-rice-${item.key}`,
    projectId: PROJECT,
    conversationId: item.conversationId,
    issueIds: [`issue-rice-${item.key}`],
    executorType: "agent" as const,
    executorId: item.actorId,
    operationLabel: item.operation,
    inputArtifactIds:
      index === 0 ? [] : [`art-rice-${CASES[index - 1].key}-output`],
    outputArtifactIds: [
      `art-rice-${item.key}-output`,
      `art-rice-${item.key}-report`,
    ],
    createdAt: `2026-08-${String(2 + index * 2).padStart(2, "0")}T15:40:00+08:00`,
    runId: `inv-rice-${item.key}`,
  }),
);

export const RICE_GWAS_INVOCATIONS: AgentInvocation[] = CASES.map(
  (item, index) => ({
    id: `inv-rice-${item.key}`,
    workspaceId: WS,
    projectId: PROJECT,
    threadId: item.conversationId,
    sourceMessageId: `msg-rice-${item.key}-request`,
    responseMessageId: `msg-rice-${item.key}-reply`,
    sessionId: `session-rice-${item.key}`,
    actorId: item.actorId,
    status: "completed" as const,
    inputRefs: [`file-rice-${item.key}-input`],
    delegationIds: [],
    artifactIds: [`art-rice-${item.key}-output`, `art-rice-${item.key}-report`],
    eventIds: [],
    summary: item.operation,
    startedAt: `2026-08-${String(1 + index * 2).padStart(2, "0")}T09:12:00+08:00`,
    completedAt: `2026-08-${String(2 + index * 2).padStart(2, "0")}T15:40:00+08:00`,
    attemptNumber: 1,
  }),
);

export const RICE_GWAS_ISSUES: ProjectIssue[] = CASES.map((item, index) => ({
  id: `issue-rice-${item.key}`,
  projectId: PROJECT,
  key: `RSG-${item.key}`,
  title: item.title,
  summary: `该阶段的${item.operation}已完成，并由 Human 明确验收发布。`,
  status: "done" as const,
  conversationId: item.conversationId,
  sourceMessageId: `msg-rice-${item.key}-request`,
  relatedMessageIds: [
    `msg-rice-${item.key}-request`,
    `msg-rice-${item.key}-reply`,
  ],
  referenceIds: [],
  humanAssigneeIds: [CURRENT_USER_ID, "user-sunlan"],
  agentAssigneeIds: [item.actorId],
  invocationIds: [`inv-rice-${item.key}`],
  artifactIds: [`art-rice-${item.key}-output`, `art-rice-${item.key}-report`],
  acceptanceCriteria: [
    "明确输入数据与分析边界",
    "Human 明确接受后发布 Artifact",
  ],
  latestProgress: "Human 已明确验收",
  createdBy: { kind: "issue_steward" as const, id: "steward" },
  createdAt: `2026-08-${String(1 + index * 2).padStart(2, "0")}T09:10:00+08:00`,
  updatedAt: `2026-08-${String(2 + index * 2).padStart(2, "0")}T16:00:00+08:00`,
  completedAt: `2026-08-${String(2 + index * 2).padStart(2, "0")}T16:00:00+08:00`,
  revision: index === 3 ? 3 : 2,
}));

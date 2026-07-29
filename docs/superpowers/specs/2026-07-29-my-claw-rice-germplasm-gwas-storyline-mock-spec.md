# My Claw 农业科研协作原型故事线：华南地方水稻种质重测序与耐盐关键基因 GWAS 挖掘

> 文档类型：农业遗传育种场景故事线 / Mock 数据与演示规格  
> 日期：2026-07-29  
> 适用原型：My Claw Project 多 Conversation、全局 Issue 看板、多 Agent 接力、可复核数据血缘

## 1. 目标与边界

本案例 Mock 一个从田间耐盐表型，到重测序变异、群体结构、GWAS、候选基因与验证计划的完整协作过程。

必须体现：

1. 田间原始表型、测序原始数据与分析结果是不同层级的 Artifact；
2. 每个分析结论都有明确的输入、执行者、Transformation 和输出；
3. 五个专业 Conversation 使用前序已验收的 Project Artifact 接力，而不是默认读取其他 Conversation 的私有文件；
4. Agent 可提出阈值或模型选择，但不能擅自决定异常材料剔除、群体标签、显著阈值或候选基因定论；
5. Agent 回复或运行成功不会自动完成 Issue，只有 Human 明确验收后才发布稳定 Project Artifact。

## 2. Project 定义

```text
Project ID：proj-rice-salt-gwas
Project：华南地方水稻种质重测序与耐盐关键基因 GWAS 挖掘

研究问题：
针对 192 份华南地方水稻种质，在苗期盐胁迫下测定存活率、盐害评分、株高抑制率和 Na+/K+ 比值；
结合全基因组重测序变异，校正群体结构与亲缘关系，定位耐盐关联位点，筛选并制定候选基因验证计划。
```

研究设计：籼稻、粳稻与地方香稻材料混合群体；三次田间/温室重复；150 mM NaCl 胁迫 14 天；目标交付为可复核关联结果与候选基因优先级清单，而不是直接声明“耐盐基因已被证明”。

## 3. 参与者与能力边界

| 参与者 | 身份 | 责任 |
|---|---|---|
| 若楠 | Project Lead / 验收人 | 处理 Inbox、确认发布与阶段结论 |
| 林稻 | 田间育种技术员 | 确认材料身份、田间/温室事件与表型异常 |
| 孙岚 | 植物数量遗传研究员 | 确认表型处理、结构校正、模型与统计解释 |
| 表型采集 Claw | 平台 Agent | 整理表型、重复与质控报告 |
| 基因组变异 Claw | 平台 Agent | FastQ 质控、比对、变异过滤与 VCF 报告 |
| 群体遗传 Claw | 平台 Agent | PCA、ADMIXTURE、亲缘关系与 LD 评估 |
| GWAS 分析 Claw | 平台 Agent | MLM/FarmCPU 模型、关联结果与诊断 |
| 候选基因 Claw | 平台 Agent | 区域注释、单倍型、表达与证据分级 |
| 事项管家 | 隐形系统 Agent | 维护 Issue Brief，不替代 Human 验收 |

`FastQ → BAM → VCF` 的确定性执行由基因组变异 Claw 的默认能力完成；Project 只共享分析环境、研究仓库、参考基因组目录和报告生成工具，不会把该能力自动赋给所有 Agent。

## 4. 五个 Conversation 与主 Issue

| Conversation | 默认文件归属 | 主 Issue | 已验收交付给下游的 Artifact |
|---|---|---|---|
| 田间表型数据收集 | conversation | RSG-101 | `salt_tolerance_phenotype_v2.parquet`、`phenotype_qc_report_v2.md` |
| 全基因组重测序与变异挖掘 | conversation | RSG-102 | `rice_landrace_filtered.vcf.gz`、`variant_qc_report.md` |
| 群体遗传结构分析 | project | RSG-103 | `population_structure_covariates.csv`、`kinship_matrix.tsv` |
| 耐盐性状 GWAS 关联分析 | project | RSG-104 | `salt_gwas_lead_loci.csv`、`gwas_model_diagnostics.md` |
| 候选基因筛选与验证 | project | RSG-105 | `salt_tolerance_candidate_genes.md`、`candidate_validation_plan.md` |

一个 Issue 只拥有一个主 Conversation。下游 Conversation 只引用已发布 Artifact；例如 RSG-104 不读取 RSG-102 的 FastQ 或 RSG-101 的私有巡田照片。

## 5. 完整 Storyline

### Day 0–14：田间表型数据收集（RSG-101）

林稻上传 `accession_manifest_v1.xlsx`、三次重复的盐胁迫评分表、温室环境记录和巡田照片。表型采集 Claw 发现 12 份材料的 ID 与种子库标签不一致，且 6 号温室在第 9 天有灌溉中断。它生成初步 QC，但不自行合并材料或删除异常重复。

林稻确认其中 8 份是同名异写，4 份为标签错误并重新核对；孙岚要求灌溉中断期间的观测保留标记、不插补。表型 Claw 重新汇总 BLUP 与性状相关性，提交 v2；若楠明确接受并将稳定表型与 QC 报告发布到 Project。

### Day 8–16：全基因组重测序与变异挖掘（RSG-102）

基因组变异 Claw 接收 192 份材料的 FastQ 清单、Nipponbare 参考基因组与文库批次表。它依次执行原始 reads 质控、比对、重复标记、联合变异检测、深度/缺失率/MAF 过滤。

首轮发现 7 个样本的测序性别/材料指纹与田间清单不一致，且一个 lane 的 reads 质量偏低。Claw 将样本列为 `needs_identity_confirmation`，不会直接剔除。林稻确认其中 5 个需要改正 sample sheet，2 个留作低深度材料但不进入主 GWAS。重跑后，Human 接受过滤 VCF 与变异 QC 报告并发布。

### Day 16–18：群体遗传结构分析（RSG-103）

群体遗传 Claw 使用已验收 VCF 计算 PCA、ADMIXTURE 候选 K 值、IBS/kinship 和 LD 衰减。它发现籼粳分化显著，且部分地方香稻形成独立簇，建议把前 3 个 PC 和 kinship 矩阵写入 GWAS 协变量。

孙岚确认 K=3 只作为结构描述，不作为材料剔除规则；若楠接受结构协变量和亲缘矩阵，发布给 GWAS Conversation。

### Day 18–20：耐盐性状 GWAS 关联分析（RSG-104）

GWAS 分析 Claw 绑定表型 v2、过滤 VCF、PC 和 kinship，分别用 MLM 与 FarmCPU 对存活率、盐害评分、Na+/K+ 比值运行关联。它输出 QQ 图、Manhattan 图、lead SNP 和模型诊断，并提示 chr1 的峰在两种模型均出现，但仅在苗期实验与当前群体中成立。

孙岚要求对批次协变量做敏感性分析，并采用基于有效标记数的阈值。重跑后，若楠接受 lead loci 和诊断；RSG-104 完成。

### Day 20–23：候选基因筛选与验证（RSG-105）

候选基因 Claw 围绕 lead SNP 的 LD 区间整合水稻参考注释、非同义变异、单倍型差异、根/叶盐胁迫表达和已发表 QTL。它以“关联强度、功能影响、表达证据、已知盐胁迫证据”分级，而不是将距离最近的基因直接称作因果基因。

若楠与孙岚要求优先验证 `OsHKT1;5` 区域的两个单倍型，同时保留一个新颖但证据较弱的转录因子候选。最终发布候选基因清单与验证方案：独立群体验证、KASP 标记、盐胁迫复现实验和 CRISPR/过表达可行性评估。RSG-105 在 Human 接受后完成。

## 6. 数据血缘

```text
温室盐胁迫原始评分 + 材料清单 + 环境事件
   → 表型质控与 BLUP
   → salt_tolerance_phenotype_v2.parquet

FastQ + 参考基因组 + sample sheet
   → 质控、比对、联合变异检测、过滤
   → rice_landrace_filtered.vcf.gz

过滤 VCF
   → PCA / ADMIXTURE / kinship / LD
   → population_structure_covariates.csv + kinship_matrix.tsv

表型 v2 + VCF + PC + kinship
   → MLM / FarmCPU + 敏感性分析
   → salt_gwas_lead_loci.csv + gwas_model_diagnostics.md

lead loci + LD 区间 + 基因注释 + 表达/文献证据
   → 候选基因证据分级
   → salt_tolerance_candidate_genes.md + candidate_validation_plan.md
```

每条 Transformation 记录输入 Artifact ID、执行 Agent/Skill、输出 Artifact ID 和关联 Issue。失败的 sample sheet、低质量 lane 和返工结果都保留在相应 Conversation，不会被后续稳定 Artifact 覆盖。

## 7. 事项状态与演示验收

```text
RSG-101  Clarifying → Waiting for Human → In Review → Done
RSG-102  In Progress → Waiting for Human → In Progress → In Review → Done
RSG-103  In Progress → In Review → Done
RSG-104  In Progress → Changes Requested → In Review → Done
RSG-105  In Progress → In Review → Done
```

验收脚本：

1. 打开 Project，确认五个 Conversation 全部存在；
2. 逐一打开五个 Conversation，每个至少显示 Human 请求、Agent 回复和对应 Artifact；
3. 从 RSG-105 的候选基因文件打开“数据血缘”，能回溯到 GWAS、结构、VCF 和表型 Artifact；
4. 打开 Project 事项看板，确认 RSG-101 至 RSG-105 均为已完成，而不是仅因 Agent 回复变为完成；
5. 打开田间表型或重测序 Conversation 文件面板，确认原始/返工输入仍留在其原 Conversation，未被错误提升为 Project 文件。

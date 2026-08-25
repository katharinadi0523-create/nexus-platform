# My Claw 故事线：华南地方水稻种质重测序与耐盐 GWAS 挖掘

> 文档类型：当前原型演示故事线
>
> 适用范围：`proj-rice-salt-gwas` 的 Project、Conversation、Issue、Artifact 与消息 Mock

## 一句话故事

若楠牵头研究 192 份华南地方水稻的苗期耐盐性。她没有把所有工作塞进一个聊天，而是把表型、重测序、群体结构、GWAS 和候选基因验证拆成五个长期 Conversation。每一段都由 Human 提出工作、Agent 暴露不确定性、Human 作出不可替代的研究决策、Agent 交付可复核产物、Human 验收并发布到 Project；下一段只能使用这些已验收的 Project Artifact。

这不是“Agent 自动得出耐盐基因”的故事，而是一个研究团队如何把异常、口径、证据边界和可交付结果留在同一条协作链里的故事。

## 项目设定

```text
Project：华南地方水稻种质耐盐 GWAS 挖掘
Project ID：proj-rice-salt-gwas

材料：192 份华南地方水稻种质（籼稻、粳稻与地方香稻）
处理：150 mM NaCl，苗期胁迫 14 天，三次重复
性状：存活率、盐害评分、株高抑制率、Na+/K+ 比值
目标：定位当前群体和当前苗期条件下的耐盐关联位点，形成候选基因优先级与验证计划
```

参与者：

- 若楠：Project Lead，验收每一阶段是否可发布。
- 林稻：田间育种技术员，确认材料身份、温室事件和表型处理。
- 孙岚：植物数量遗传研究员，确认结构校正、统计口径和结论边界。
- 五个专业 Claw：分别负责表型、变异、群体遗传、GWAS 和候选基因；它们能分析和提出建议，但不能自行替团队决定剔除样本、设定解释边界或宣布因果。

## 当前原型的协作规则

每个 Conversation 固定呈现五步交互：

```text
Human 发起工作
  → Agent 汇报发现的问题和不确定性
  → Human 明确决策处理口径
  → Agent 按口径完成交付
  → Human 验收，并把稳定结果发布到 Project
```

Agent 回复完成并不等于 Issue 完成；只有最后一步 Human 验收，Artifact 才成为下游可引用的 Project 事实。原始文件、异常输入和返工记录仍归属于产生它们的 Conversation，不会因为结果发布而被覆盖或自动公开。

## 故事线

### 1. 田间表型数据收集：先把材料与异常说清楚

林稻在“田间表型数据收集”发起 RSG-101：上传 192 份材料的盐胁迫评分、温室记录与材料清单，请表型采集 Claw 汇总存活率、盐害评分、株高抑制率和 Na+/K+ 比值。

表型采集 Claw 没有直接给出一张漂亮的性状表。它先回复：12 份材料 ID 与种子库标签不一致；6 号温室在第 9 天发生灌溉中断。它把这些观测标为异常候选，不自行合并同名材料，也不插补缺失值，等待研究人员决定。

林稻复核后说明：8 份是同名异写，4 份确为标签错误；孙岚要求保留灌溉中断记录、增加事件标记，并在 BLUP 中纳入温室批次。于是 Claw 按这个口径完成表型质控、重复汇总和 BLUP，交付：

- `salt_tolerance_phenotype_v2.parquet`
- `phenotype_qc_report_v2.md`

若楠验收，确认输入、异常处理和限制已经记录，将两个 Artifact 发布到 Project。RSG-101 完成。

### 2. 全基因组重测序与变异挖掘：质量问题不能被静默删除

若楠在“全基因组重测序与变异挖掘”发起 RSG-102：以 FastQ 清单、Nipponbare 参考基因组和文库批次表完成质控、比对、联合变异检测和过滤。

基因组变异 Claw 在首轮 FastQ 质控后回复：7 个样本的材料指纹与 sample sheet 不一致，lane L03 的 Q30 明显偏低。它暂停这些样本进入主分析，保留原始 FASTQ 与诊断日志，而不是把低质量样本悄悄删掉。

林稻确认其中 5 个是 sample sheet 标签写反，提交修订版；其余 2 个低深度材料仍保留在项目里，但不进入主 GWAS。孙岚确认主分析过滤口径为缺失率不高于 10%、MAF 不低于 0.05。Claw 重跑后交付：

- `rice_landrace_filtered.vcf.gz`
- `variant_qc_report.md`

若楠验收并发布。后续 Conversation 看得到的是这个已验收 VCF，而不是重测序 Conversation 里的原始 FastQ 或失败日志。

### 3. 群体遗传结构分析：结构用于校正，不是自动剔除材料的理由

孙岚在“群体遗传结构分析”发起 RSG-103，并引用已发布的 `rice_landrace_filtered.vcf.gz`。她要求计算 PCA、ADMIXTURE、亲缘关系和 LD 衰减，给出 GWAS 的结构校正建议。

群体遗传 Claw 发现 PCA 前两轴已分开籼稻、粳稻和部分地方香稻；ADMIXTURE 的 K=3 交叉验证误差较低。它明确指出：这种结构可能引发假阳性，但尚无理由按簇剔除材料，因此请求确定 PC 和 kinship 的使用方式。

孙岚决定：K=3 只做群体描述与结果解释，不做材料筛除；主模型使用前 3 个 PC 和 kinship，并额外保留 PC2–PC5 的敏感性分析。Claw 随后交付：

- `population_structure_covariates.csv`
- `kinship_matrix.tsv`

若楠验收并发布。至此，GWAS 所需的结构校正输入有了可追溯来源。

### 4. 耐盐性状 GWAS：关联峰先是候选信号，不是结论

若楠在“耐盐性状 GWAS 关联分析”发起 RSG-104，绑定已验收的表型 v2、过滤 VCF、PC 和 kinship，要求用 MLM 与 FarmCPU 分析耐盐性状并交付模型诊断。

GWAS 分析 Claw 在第一轮中发现 chr1:25.8 Mb 的峰同时出现在 MLM 与 FarmCPU，但加入温室批次前后效应有所变化；固定 Bonferroni 阈值可能偏保守。因此它只把结果称为候选信号，不先行发布 lead loci。

孙岚要求加入温室批次敏感性分析，使用有效标记数计算阈值；只在单一模型出现的 lead SNP 要降为探索性结果。若楠要求 QQ 图、Manhattan 图和两种模型的诊断一起作为验收材料。Claw 重跑后交付：

- `salt_gwas_lead_loci.csv`
- `gwas_model_diagnostics.md`

若楠验收并发布，同时保留结论边界：这些位点只支持当前苗期、当前胁迫条件和当前群体中的关联，不能被直接称作致因基因。

### 5. 候选基因筛选与验证：把“关联”翻译成可验证的优先级

若楠在“候选基因筛选与验证”发起 RSG-105，引用已发布的 lead loci，要求整合 LD 区间注释、非同义变异、单倍型、盐胁迫表达和已有 QTL，形成候选基因优先级及实验计划。

候选基因 Claw 汇报：lead loci 的 LD 区间内共有 18 个注释基因；最近的基因不必然最可信。`OsHKT1;5` 区域的两个单倍型与盐害评分一致，另有一个转录因子候选较新颖，但表达证据偏弱。它请团队确认验证资源如何分配。

若楠与孙岚决定：优先验证 `OsHKT1;5` 区域的两个单倍型；保留新颖转录因子为二级候选，但不宣称它是因果基因。Claw 据此交付：

- `salt_tolerance_candidate_genes.md`
- `candidate_validation_plan.md`

验证计划包括独立群体、KASP 标记、盐胁迫复现实验，以及 CRISPR/过表达的可行性评估。若楠完成验收，RSG-105 结束；这个 Project 的阶段成果是“有边界、可复查、可继续验证的候选清单”，而不是一个被过度解释的发现。

## 结果如何在 Project 中接力

```text
私有原始表型 + Human 对异常处理的决定
  → 已验收表型 v2

私有 FastQ / 样本异常日志 + Human 对过滤口径的决定
  → 已验收过滤 VCF

已验收 VCF + Human 对结构校正的决定
  → 已验收 PC 协变量与 kinship

已验收表型 / VCF / PC / kinship + Human 对模型阈值的决定
  → 已验收 lead loci 与模型诊断

已验收 lead loci + Human 对候选优先级的决定
  → 已验收候选基因清单与验证计划
```

因此，Project 不是一个把所有文件堆在一起的文件夹，而是稳定事实的共享层；Conversation 则保留每个阶段真实发生过的讨论、问题、决策和返工。

## 用户应看到什么

下面不是抽象验收项，而是一条可以照着操作的演示路径。先按时间顺序讲清这个项目怎么推进，再按功能讲清 My Claw 的哪些机制被验证。

### A. 按时间顺序演示

#### 0. 先从左侧定位项目

1. 在左侧栏向下滚动到 `Project` 区域；这里应独立滚动，个人 Chat 不会挤占 Project 列表的可用高度。
2. 找到并展开“华南地方水稻种质耐盐 GWAS 挖掘”。
3. 应看见五个会话，顺序为：

   ```text
   田间表型数据收集
   → 全基因组重测序与变异挖掘
   → 群体遗传结构分析
   → 耐盐性状 GWAS 关联分析
   → 候选基因筛选与验证
   ```

这一步验证 Project 是长期协作容器，Conversation 是按研究阶段拆开的工作现场，而不是五个没有关系的聊天。

#### 1. 打开“田间表型数据收集”

进入该会话后，按从上到下的消息顺序应看到五次往返：

1. 林稻发起任务，上传表型原始数据；
2. 表型采集 Claw 报告“12 份材料 ID 不一致”和“6 号温室灌溉中断”；
3. 林稻、孙岚决定如何修正材料映射、如何保留事件标记；
4. Claw 交付 `salt_tolerance_phenotype_v2.parquet` 与 `phenotype_qc_report_v2.md`；
5. 若楠明确验收，要求把产物发布到 Project。

重点不是看见一份表型结果，而是看见 Agent 在遇到研究口径不确定时停下来请求 Human 决策。

#### 2. 打开“全基因组重测序与变异挖掘”

这里重复同一协作节奏，但问题换成测序质量：

1. Human 请求处理 FastQ、参考基因组和文库批次表；
2. 基因组变异 Claw 发现 7 个样本身份异常、lane L03 的 Q30 偏低；
3. 林稻确认 5 个标签修正，孙岚决定两个低深度材料不进入主 GWAS，并确认过滤阈值；
4. Claw 交付 `rice_landrace_filtered.vcf.gz` 与 `variant_qc_report.md`；
5. 若楠验收并发布。

这一步应能说明“低质量”不会自动等于“删除”。原始 FastQ 和诊断日志属于该会话的工作上下文；下游拿到的是 Human 验收后的 VCF。

#### 3. 依次进入群体结构、GWAS 和候选基因会话

后面三个会话分别应出现如下 Human 决策点：

| 会话 | Agent 先暴露的关键不确定性 | Human 决定 | 交付 |
|---|---|---|---|
| 群体遗传结构分析 | PCA 分开不同亚群，K=3 较优，但不应据此直接剔除材料 | K=3 只用于描述；主模型使用前 3 个 PC 和 kinship | `population_structure_covariates.csv`、`kinship_matrix.tsv` |
| 耐盐性状 GWAS 关联分析 | chr1 峰跨模型出现，但批次协变量会改变效应 | 加入批次敏感性分析；单模型峰只作为探索性结果 | `salt_gwas_lead_loci.csv`、`gwas_model_diagnostics.md` |
| 候选基因筛选与验证 | LD 区间中有 18 个基因，最近基因不必然最可信 | 优先验证 `OsHKT1;5` 两个单倍型；转录因子保留为二级候选 | `salt_tolerance_candidate_genes.md`、`candidate_validation_plan.md` |

每进入一个会话，都应看到“请求 → 发现 → 决策 → 交付 → 验收”的五条消息结构。这样演示的是长期协作中的责任分工，而非 Agent 单次生成答案。

### B. 按功能演示

#### 1. 看一条完整的数据血缘：点哪个文件、会看到什么

最适合演示的入口是最终交付文件 **`salt_tolerance_candidate_genes.md`**，因为它位于整条链的末端。

操作路径：

1. 点击左侧的项目名称“华南地方水稻种质耐盐 GWAS 挖掘”，进入 Project 概览；
2. 在概览页下方找到 `Project 文件`；
3. 保持“全局”视图，进入 `rice-salt-gwas` 分组；
4. 找到 `salt_tolerance_candidate_genes.md`；
5. 点击该文件的 `⋯` 菜单，选择“详情”；
6. 右侧打开“文件详情”抽屉，向下查看“数据血缘”。

在“数据血缘”中，当前 mock 会从最早产物到当前文件显示一条可读链，并在每两个 Artifact 之间展示产生它的操作：

```text
salt_tolerance_phenotype_v2.parquet
  ↓ FastQ 质控、比对、联合变异检测与过滤
rice_landrace_filtered.vcf.gz
  ↓ PCA、ADMIXTURE、kinship 与 LD 分析
population_structure_covariates.csv
  ↓ MLM / FarmCPU 关联分析与敏感性诊断
salt_gwas_lead_loci.csv
  ↓ LD 区间注释、单倍型与证据分级
salt_tolerance_candidate_genes.md  ← 当前文件
```

文件详情顶部还应显示：该文件是 `Project 文件`、来源是候选基因筛选与验证 Conversation、创建者是候选基因 Claw。这个抽屉回答的是三个问题：**当前文件是什么、谁在什么会话里产生它、它依赖了哪些已记录的分析产物。**

说明：当前原型以一条主上游链演示血缘，因此从最终候选基因文件回溯时会依次展示上述 Artifact；真实科研中 GWAS 同时依赖表型、VCF、PC 和 kinship 等多个输入，完整的多分支 DAG 是后续可扩展的血缘视图。

#### 2. 看文件边界：哪些能给下游用，哪些只留在当前会话

分别打开“田间表型数据收集”和“全基因组重测序与变异挖掘”，点击会话头部的“会话产物”。抽屉按来源会话分成两组：`已发布产物` 与 `当前会话文件`。前者可以直接通过 `⋯ → 详情` 打开文件详情和数据血缘；后者保留原始输入与返工上下文。

- 在候选基因会话的“会话产物”中，打开 `salt_tolerance_candidate_genes.md` 的详情，即可直接查看完整主上游血缘；
- 原始表型表和 FastQ 清单标为“仅当前会话可见”，表达的是工作过程中的私有输入或返工上下文；
- 已验收的表型 v2、过滤 VCF、协变量、lead loci 和候选基因文件标为“已发布到 Project”，同时也会出现在 Project 概览的 `Project 文件` 中；
- 下游会话引用的是已发布产物，不会默认读取私有输入。

这证明“消息参与者可见性”“文件归属”“Artifact 是否已发布”是三个不同的机制，而不是一个模糊的公开/私有开关。

#### 3. 看 Issue 为什么完成

在 Project 概览顶部点击“事项”，找到 RSG-101 到 RSG-105。每个事项应关联其唯一主 Conversation、执行 Agent、输入/输出 Artifact 和完成状态。

演示时应回到对应会话最后一条 Human 消息：例如“我已验收 RSG-104……发布到 Project”。再回看事项状态，才能解释它为何为 Done：**不是 Agent 执行结束，而是 Human 已经接受该阶段的输入、处理口径、限制和交付。**

#### 4. 看消息与产物如何互相定位

在每个阶段的 Agent 交付消息中，应出现两个 Artifact 标签：一个数据/结果文件和一个报告文件。它们把聊天中的结论和 Project 文件中的稳定结果连起来。

例如在 GWAS 会话中定位 Claw 的交付消息，可以看到 `salt_gwas_lead_loci.csv` 与 `gwas_model_diagnostics.md`；在候选基因会话中看到 `salt_tolerance_candidate_genes.md` 与 `candidate_validation_plan.md`。这样用户不需要猜“这个文件从哪里来”，也不需要从文件列表反向翻找整段讨论。

#### 5. 看左侧列表与会话内容的配合

Project 列表只显示项目名和会话名，避免摘要文本占用纵向空间；当项目和会话变多时，在 Project 区域内滚动即可。个人 Chat 与 Project 之间的分隔条可上下拖动：

- 向上拖动：给 Project 更多高度，连续演示五个会话；
- 向下拖动：给个人 Chat 更多高度；
- 两个区域各自滚动，不会把另一类列表推到不可达的位置。

这部分不改变研究数据，但保证上述完整故事线在真实侧栏密度下仍然可被连续演示。

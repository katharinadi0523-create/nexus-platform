# My Claw 科研协作原型故事线：单细胞免疫治疗标志物探索

> 文档类型：科研场景故事线 / Mock 数据与演示规格  
> 日期：2026-07-29  
> 适用原型：My Claw Project 多会话、Project 全局事项看板、两级工具与文件归属方案  
> 关联需求：`2026-07-29-my-claw-project-multi-conversation-prototype-change-spec.md`

---

## 1. 文档目的

本故事线用于指导 Coding Agent 后续将一个相对完整的科研协作过程写入 My Claw Mock。

它需要同时验证：

1. 一个 Project 包含多个 Conversation；
2. 每个 Conversation 可以产生多个 Issue；
3. 一个 Issue 最多归属一个主 Conversation；
4. Project 只有一个全局事项看板，汇总所有 Conversation 的 Issue；
5. 事项由隐形事项管家识别、更新和组织，但 Human 可以确认、纠正和手动操作；
6. Issue 状态不因 Agent 回复或 Human 已读自动完成；
7. Agent 执行 Session 按 `Conversation × Agent` 隔离；
8. Project 工具向 Conversation 继承，Conversation 可以增加本会话工具；
9. 文件只落在 Project 或 Conversation 两种产品作用域，不按 Human 聚合；
10. 科研数据血缘通过输入、Transformation 和输出 Artifact 展示；
11. Inbox、“我的工作与项目”和 Project 事项看板承担不同职责。

故事不是为了演示单次问答，而是为了演示一个跨两天、多角色、多 Agent、多轮返工和 Human 验收的科研工作过程。

---

## 2. 科研项目背景

### 2.1 Project

```text
Project ID：proj-lung-immunotherapy
Project 名称：肺癌免疫治疗标志物探索
项目目标：
基于 48 例匿名化单细胞转录组样本，
探索治疗响应组与非响应组之间的免疫细胞亚群差异，
形成可复核的阶段研究报告。
```

这是一个科研协作 Mock，不对真实患者、真实诊疗或真实研究结论负责。

### 2.2 Project Brief

```text
研究问题
哪些免疫细胞亚群和基因表达特征与治疗响应相关？

样本
48 例匿名化 PBMC 单细胞转录组样本
响应组 24 例，非响应组 24 例

阶段交付
1. 样本纳排与分组说明
2. 质控与批次校正结果
3. 差异细胞亚群与通路富集结果
4. 阶段研究报告

关键约束
- 所有结论必须可追溯到输入数据和分析步骤
- 原始数据与中间调试文件留在工作会话
- 通过验收的清洗数据、结果表和报告公开到 Project
- Agent 结论必须由 Human 验收
```

---

## 3. 成员、Agent 与工具

### 3.1 Human

| ID | 姓名 | 场景角色 | 主要职责 |
|---|---|---|---|
| `user-ruonan` | 若楠 | 项目协调与验收人 | 明确目标、处理 Inbox、验收阶段结果 |
| `user-zhouning` | 周宁 | 实验负责人 | 确认样本、实验条件和异常样本 |
| `user-linxiao` | 林晓 | 数据分析协作者 | 复核分析方法、图表和统计口径 |

### 3.2 Agent

| ID | Agent | 类型 | 主要职责 |
|---|---|---|---|
| `actor-ruonan-claw` | 若楠的 Claw | 个人 Agent | 整理会议结论、补充验收清单 |
| `actor-qc` | 单细胞质控 Claw | 平台 Agent | 样本质控、Doublet 检测、批次校正 |
| `actor-cell-analysis` | 单细胞分析 Claw | 平台 Agent | 细胞注释、差异丰度和统计检验 |
| `actor-literature` | 文献检索 Claw | 平台 Agent | 检索细胞亚群与候选通路证据 |
| `actor-research-writer` | 科研写作 Claw | 平台 Agent | 汇总方法、结果、证据与研究限制 |
| `issue-steward` | 事项管家 | 隐形系统 Agent | 识别 Issue、提出状态与 Brief 更新建议 |

事项管家不出现在 Project Agent 数量、成员列表和会话列表中。

四个专业 Agent 不封装成统一的 Agent 组。它们都作为独立 Agent 出现在：

- Project Agent 列表；
- Conversation 参与者区域；
- `@Agent` 选择器；
- Issue 责任人；
- Invocation 和 Session 记录。

这样用户可以看清是谁完成了哪一步、哪个 Agent 正在等待另一个 Agent 的稳定交付。

### 3.3 Project 工具

所有 Conversation 继承：

| 工具 | 类型 | 用途 |
|---|---|---|
| Python 分析环境 | Workflow | 数据清洗、统计分析、绘图 |
| GitHub Research Repo | MCP | 读取分析脚本、记录方法变更 |
| PubMed 检索 | Plugin | 检索候选细胞亚群与通路证据 |
| 项目文档生成 | Workflow | 汇总 Markdown、图表和报告 |

### 3.4 Conversation 增量工具

| Conversation | 增量工具 |
|---|---|
| 数据准备与质量控制 | 单细胞 QC Workflow、Doublet 检测工具 |
| 差异分析与阶段报告 | 通路富集 Workflow、科研绘图 Workflow |

有效工具始终是：

```text
Agent 默认能力
+ Project 工具
+ 当前 Conversation 工具
- 不兼容或不可用工具
```

### 3.5 多 Agent 协作机制

本故事不设置一个用户可见的总控 Agent。协作通过以下对象发生：

```text
Human / Agent 消息中的明确 @
→ 独立 Agent Invocation
→ Conversation 中回复结果
→ 生成有血缘的 Artifact
→ 更新对应 Issue
→ 稳定产物发布到 Project
→ 下一个 Agent 以该 Project 产物作为输入
```

具体交接关系：

```text
单细胞质控 Claw
→ 发布 cleaned_pbmc_v2.h5ad
→ 单细胞分析 Claw
→ 发布差异结果和正式图表
→ 文献检索 Claw
→ 发布候选通路证据摘要
→ 科研写作 Claw
→ 形成阶段研究报告
```

Agent 之间可以在同一 Conversation 中相互 `@`，但后一个 Agent 不会直接读取前一个 Agent 的私有运行上下文；交接内容必须落在可见消息、Issue Brief 或有明确血缘的 Artifact 中。

---

## 4. Project 下的两个 Conversation

### 4.1 Conversation A：数据准备与质量控制

```text
Conversation ID：conv-research-qc
名称：数据准备与质量控制
Human：若楠、周宁、林晓
Agent：单细胞质控 Claw、若楠的 Claw
默认文件归属：conversation
```

为什么文件默认留在 Conversation：

- 原始数据文件体积大；
- QC 日志和调试图数量多；
- 中间文件仍可能反复修改；
- Project 文件区只需要通过验收的稳定输入和摘要。

该会话产生：

- `SCI-101 确认样本纳排与分组`
- `SCI-102 完成原始数据质控与批次校正`
- `SCI-105 评估 Harmony 批次校正路线`

### 4.2 Conversation B：差异分析与阶段报告

```text
Conversation ID：conv-research-analysis
名称：差异分析与阶段报告
Human：若楠、林晓
Agent：单细胞分析 Claw、文献检索 Claw、科研写作 Claw、若楠的 Claw
默认文件归属：project
```

为什么文件默认公开到 Project：

- 该会话主要产出阶段性结果；
- 差异结果表、图表和报告需要被 Project 其他工作引用；
- 这些文件应成为 Project 长期事实。

该会话产生：

- `SCI-103 识别响应相关免疫细胞亚群`
- `SCI-104 形成阶段研究报告`

### 4.3 会话与 Issue 的关系

```text
Conversation A
├── SCI-101
├── SCI-102
└── SCI-105

Conversation B
├── SCI-103
└── SCI-104

Project Issue Board
├── SCI-101
├── SCI-102
├── SCI-103
├── SCI-104
└── SCI-105
```

每个 Issue 只有一个主 Conversation。

Conversation B 可以在消息中引用 `SCI-102` 的 Project 级 Brief 或 Project 文件，但不会成为 `SCI-102` 的第二个主 Conversation。

---

## 5. 故事总览

故事发生在连续两个工作日。

```text
Day 1 上午
确认研究问题与样本纳排
→ 建立 SCI-101、SCI-102

Day 1 下午
执行质控，发现元数据缺失
→ SCI-102 Waiting for Human

Day 1 晚上
补齐元数据，批次校正运行失败
→ Invocation Failed
→ SCI-102 Blocked

Day 2 上午
调整参数并重新执行
→ SCI-102 In Progress
→ 提交候选质控结果
→ SCI-102 In Review

Day 2 中午
Human 要求修改双细胞阈值
→ SCI-102 Changes Requested
→ 新 Invocation 启动
→ SCI-102 In Progress

Day 2 下午
重新提交并通过验收
→ SCI-102 Done
→ 清洗数据发布到 Project

Day 2 下午
Conversation B 使用 Project 清洗数据
→ SCI-103 完成差异分析
→ SCI-104 形成报告
→ Human 返工一次后接受
```

---

## 6. 旗舰事项 SCI-102 的完整状态流转

`SCI-102` 用于覆盖完整 Issue 生命周期。

### 6.1 创建：Clarifying

Human 消息：

```text
若楠：
@单细胞质控 Claw，请基于附件中的 48 例原始表达矩阵完成质控和批次校正，
后续要用于响应组与非响应组差异分析。
```

事项管家输出：

```json
{
  "action": "create",
  "title": "完成原始数据质控与批次校正",
  "proposedStatus": "clarifying",
  "reason": "已识别明确数据对象和阶段目标，但 QC 阈值与验收标准尚未确认",
  "requiresConfirmation": false
}
```

创建结果：

```text
SCI-102
Status：Clarifying
Primary Conversation：数据准备与质量控制
Assignee：周宁、单细胞质控 Claw
```

### 6.2 Human 补齐标准：In Progress

周宁回复：

```text
纳入标准按以下口径：
- 每细胞基因数 300—6,000
- 线粒体比例 < 15%
- Doublet score < 0.25
- 响应分组以 sample_metadata.csv 中 response 字段为准
```

动作：

```text
Human 补齐验收标准
→ 事项管家建议开始执行
→ 新 Invocation 创建
→ SCI-102: Clarifying → In Progress
```

### 6.3 Agent 请求补充信息：Waiting for Human

Agent 检查数据后回复：

```text
发现 3 个样本缺少 batch_id，无法执行批次校正。
请补充 S17、S22、S41 的批次信息。
```

动作：

```text
Agent 明确请求 Human 输入
→ SCI-102: In Progress → Waiting for Human
→ Inbox 产生“等待你补充样本批次”
```

仅仅阅读该消息不会改变 Issue 状态。

### 6.4 Human 补充后恢复：In Progress

周宁上传：

```text
sample_metadata_v2.csv
```

并回复：

```text
已补齐三个样本的 batch_id，请继续。
```

动作：

```text
Human 提供阻塞信息
→ 新 Invocation 开始
→ SCI-102: Waiting for Human → In Progress
```

### 6.5 Invocation 失败：Blocked + 执行失败

运行事件：

```text
scVI batch correction
→ Runtime OOM
→ Invocation Failed
```

产品表现：

- 触发消息下显示轻量“执行失败”状态；
- 点击后展开 Execution Detail；
- Project Issue Board 的 `SCI-102` 进入“执行失败”展示；
- Issue 业务状态进入 `Blocked`；
- Inbox 产生“单细胞质控 Claw 执行失败”。

注意：

```text
Invocation Failed ≠ Issue Done
Invocation Failed 也不删除前面的 Issue 上下文
```

### 6.6 Human 决定重试方案：In Progress

林晓回复：

```text
先将高变基因降到 2,000，并启用分层小批量训练。
如果仍失败，再改用 Harmony。
```

动作：

```text
Human 给出恢复决策
→ Retry Invocation
→ SCI-102: Blocked → In Progress
```

### 6.7 Agent 提交候选交付：In Review

Agent 回复：

```text
已完成 QC 和 scVI 批次校正。
候选交付：
- qc_summary_v1.md
- qc_metrics_v1.csv
- cleaned_pbmc_v1.h5ad
- qc_overview_v1.png
```

动作：

```text
Agent 提交可验收结果
→ SCI-102: In Progress → In Review
→ Inbox 产生“SCI-102 待验收”
```

Agent 回复本身不会把 Issue 变为 Done。

### 6.8 Human 要求返工：Changes Requested

周宁检查后回复：

```text
Doublet 过滤后 S09 的细胞数下降过多。
请把 S09 阈值调整到 0.30，并补充阈值调整前后的对比图。
```

Human 点击“要求返工”。

动作：

```text
SCI-102: In Review → Changes Requested
→ 保存返工意见
→ Inbox 产生“SCI-102 已要求返工”
```

### 6.9 新一轮执行：In Progress

Agent 开始修改：

```text
New Invocation
→ SCI-102: Changes Requested → In Progress
```

原型必须保留：

- 第一轮候选交付；
- Human 返工意见；
- 第二轮 Invocation；
- 新旧文件血缘。

### 6.10 重新提交：In Review

Agent 回复：

```text
已调整 S09 Doublet 阈值并补充前后对比。
更新交付：
- qc_summary_v2.md
- qc_metrics_v2.csv
- cleaned_pbmc_v2.h5ad
- s09_doublet_comparison.png
```

动作：

```text
SCI-102: In Progress → In Review
```

### 6.11 Human 接受：Done

若楠点击“接受”：

```text
验收通过。
请把 cleaned_pbmc_v2.h5ad 和 qc_summary_v2.md 发布到 Project，
其余日志和中间图继续留在当前会话。
```

动作：

```text
Human Explicit Accept
→ SCI-102: In Review → Done
```

文件落点：

| 文件 | Scope | 展示位置 |
|---|---|---|
| `cleaned_pbmc_v2.h5ad` | `project` | Project Files |
| `qc_summary_v2.md` | `project` | Project Files |
| `qc_metrics_v2.csv` | `conversation` | Conversation A Files |
| `s09_doublet_comparison.png` | `conversation` | Conversation A Files |
| Runtime 日志 | Conversation Runtime | Execution Detail |

---

## 7. 其他 Issue 的状态与作用

### 7.1 SCI-101：确认样本纳排与分组

```text
Clarifying
→ Waiting for Human
→ In Progress
→ In Review
→ Done
```

作用：

- 展示科研工作开始前的协议确认；
- 输出 Project 文件 `sample_inclusion_protocol.md`；
- 为 SCI-102 提供验收标准。

### 7.2 SCI-103：识别响应相关免疫细胞亚群

主 Conversation：差异分析与阶段报告。

输入：

- Project 文件 `cleaned_pbmc_v2.h5ad`；
- Project 文件 `sample_inclusion_protocol.md`。

多 Agent 过程：

```text
若楠 @单细胞分析 Claw
→ 读取 Project 中的 cleaned_pbmc_v2.h5ad
→ 完成细胞注释与差异丰度分析
→ 发现 NK/T 细胞注释口径不明确
→ SCI-103 Waiting for Human

林晓确认 NK/T 合并规则
→ SCI-103 In Progress
→ 单细胞分析 Claw 生成差异表和图表

单细胞分析 Claw @文献检索 Claw
→ 引用 cell_population_diff.csv 中的候选细胞亚群
→ 检索相关研究和候选通路证据
→ 返回 literature_evidence_summary.md

单细胞分析 Claw 汇总统计结果与文献证据
→ SCI-103 In Review
→ Human 验收
→ SCI-103 Done
```

输出：

- `cell_population_diff.csv`
- `pathway_enrichment.csv`
- `response_volcano_plot.png`
- `celltype_abundance_heatmap.png`
- `literature_evidence_summary.md`

全部默认进入 Project Files。

`SCI-103` 同时分配给单细胞分析 Claw 和文献检索 Claw，但两者各自保留独立 Invocation 与 Session；看板分别展示两个 Agent 的责任和运行状态。

### 7.3 SCI-104：形成阶段研究报告

主 Conversation：差异分析与阶段报告。

多 Agent 过程：

```text
Clarifying

若楠 @科研写作 Claw
→ 科研写作 Claw 读取已验收的 QC 摘要、差异表、正式图表和文献摘要
→ 生成报告 v1
→ SCI-104 In Review

Human 要求修改结论强度并补充研究限制
→ SCI-104 Changes Requested
→ 科研写作 Claw @文献检索 Claw 补充限制性证据
→ 文献检索 Claw 返回补充证据
→ 科研写作 Claw 生成报告 v2
→ SCI-104 In Review
→ Human 接受
→ SCI-104 Done
```

第一次返工：

```text
若楠：
报告中“与治疗响应相关”表述过强，
请改成“在当前样本中观察到相关趋势”，
并补充样本规模和多重检验限制。
```

最终输出：

- `免疫治疗标志物阶段研究报告_v2.docx`
- `阶段汇报图表包.zip`

### 7.4 SCI-105：评估 Harmony 批次校正路线

这是被放弃的备选路线。

过程：

```text
Clarifying
→ In Progress
→ Cancelled
→ Archived
```

取消原因：

```text
scVI 调参后已稳定完成，Harmony 不再继续投入。
```

该 Issue 保留历史，不硬删除。

---

## 8. Project 全局事项看板

### 8.1 中途快照

Day 1 结束时：

```text
待澄清或审批确认
  SCI-104 形成阶段研究报告

进行中
  SCI-103 识别响应相关免疫细胞亚群
  SCI-105 评估 Harmony 批次校正路线

等待反馈
  SCI-101 确认样本纳排与分组

待验收
  暂无

已完成
  暂无

执行失败
  SCI-102 完成原始数据质控与批次校正
```

这些 Issue 来自两个不同 Conversation，但统一出现在 Project 看板中。

卡片显示唯一主 Conversation：

```text
SCI-102
完成原始数据质控与批次校正
Blocked · 执行失败
主会话：数据准备与质量控制
周宁 · 单细胞质控 Claw
更新于 18 分钟前
```

### 8.2 最终快照

Day 2 结束时：

```text
已完成
  SCI-101 确认样本纳排与分组
  SCI-102 完成原始数据质控与批次校正
  SCI-103 识别响应相关免疫细胞亚群
  SCI-104 形成阶段研究报告

已取消 / 已归档
  SCI-105 评估 Harmony 批次校正路线
```

---

## 9. 文件作用域

### 9.1 Project Files

只展示 `scope = "project"`：

```text
sample_inclusion_protocol.md
cleaned_pbmc_v2.h5ad
qc_summary_v2.md
cell_population_diff.csv
pathway_enrichment.csv
response_volcano_plot.png
celltype_abundance_heatmap.png
免疫治疗标志物阶段研究报告_v2.docx
阶段汇报图表包.zip
```

### 9.2 Conversation A Files

只展示：

```text
scope = "conversation"
sourceConversationId = "conv-research-qc"
```

文件：

```text
pbmc_raw_counts.h5ad
sample_metadata_v1.csv
sample_metadata_v2.csv
qc_notebook.ipynb
qc_metrics_v1.csv
qc_metrics_v2.csv
qc_overview_v1.png
s09_doublet_comparison.png
```

### 9.3 Conversation B Files

该会话默认将新文件公开到 Project，因此正常情况下 Conversation Files 为空。

如果产生临时调试文件，例如：

```text
enrichment_debug.log
draft_figure_layout.json
```

Human 可以把单个文件归属改为 Conversation，使其只进入 Conversation B Files。

### 9.4 不建立逐人文件权限

Mock 不允许出现：

```text
visibleUserIds
allowedMemberIds
currentUserVisibleFiles
```

文件只按 Project 或 Conversation 归属进入对应文件区。

---

## 10. 科研数据血缘：整条故事的主轴

这条 Mock 的核心不是“生成若干文件”，而是让用户能够回答四个科研复核问题：

1. 这个结论用了哪一版输入数据？
2. 输入经过了哪些分析步骤和参数？
3. 哪次 Agent Invocation 产生了哪一版结果？
4. Human 为什么接受、返工或废弃这一版结果？

因此，故事中的每个稳定科研产物都必须同时保留：

```text
输入文件
→ Transformation / 分析步骤
→ Agent Invocation
→ 输出文件
→ 来源 Conversation
→ 对应 Issue
→ Human 验收动作
```

### 10.1 贯穿两个 Conversation 的主链路

```text
研究输入
  pbmc_raw_counts.h5ad
  sample_metadata_v1.csv
        │
        │ Conversation A / SCI-101
        │ Human 补齐 batch_id
        ▼
  sample_metadata_v2.csv
        │
        │ Conversation A / SCI-102 / Invocation 1
        │ QC + Doublet 检测 + scVI
        │ 运行 OOM，保留失败记录，不产生可发布结果
        ▼
  qc_metrics_v1.csv
  cleaned_pbmc_v1.h5ad
        │
        │ Human 发现 S09 过滤过严并要求返工
        │ Conversation A / SCI-102 / Invocation 2
        ▼
  qc_metrics_v2.csv
  cleaned_pbmc_v2.h5ad ── Human 验收并发布到 Project
        │
        │ Conversation B / SCI-103
        │ 细胞注释 + 差异丰度分析
        ▼
  cell_population_diff.csv
  response_volcano_plot.png
  celltype_abundance_heatmap.png
        │
        │ Conversation B / SCI-103
        │ 通路富集
        ▼
  pathway_enrichment.csv
        │
        │ Conversation B / SCI-104 / 报告编排
        ▼
  免疫治疗标志物阶段研究报告_v1.docx
        │
        │ Human 要求补充方法限制与失败路线
        │ Conversation B / SCI-104 / 返工
        ▼
  免疫治疗标志物阶段研究报告_v2.docx
  阶段汇报图表包.zip
```

这条链路体现两个关键边界：

- Conversation A 的完整消息与调试文件不会自动进入 Conversation B；
- 只有经 Human 验收并发布到 Project 的 `cleaned_pbmc_v2.h5ad`，才成为 Conversation B 的稳定输入。

### 10.2 分阶段血缘叙事

| 阶段 | 来源 Conversation / Issue | 输入 | 处理与决策 | 输出与去向 |
|---|---|---|---|---|
| 样本定义 | A / SCI-101 | `sample_metadata_v1.csv` | 周宁补齐批次并确认纳排规则 | `sample_metadata_v2.csv`，Conversation A |
| 数据质控 | A / SCI-102 | raw counts + metadata v2 | 第一次运行失败；第二次提交 v1；Human 因 S09 阈值返工；第三次得到 v2 | QC 中间物留在 A；cleaned v2 经验收发布到 Project |
| 差异分析 | B / SCI-103 | Project 中的 cleaned v2 | 细胞注释、差异丰度、统计检验 | 差异表与正式图表发布到 Project |
| 通路解释 | B / SCI-103 | 差异细胞结果 | 富集分析并由文献检索 Claw 补充证据 | 富集表发布到 Project；检索草稿留在 B |
| 报告交付 | B / SCI-104 | Project 中的表格、图表、QC 摘要 | 报告 v1 被要求补充局限性；v2 通过验收 | 报告 v2 与图表包发布到 Project |

### 10.3 Transformation Mock

| Transformation | Conversation | Input | Output |
|---|---|---|---|
| `xform-qc-v2` | Conversation A | raw counts、metadata v2 | QC metrics、cleaned data |
| `xform-cell-diff` | Conversation B | cleaned data | cell population diff |
| `xform-enrichment` | Conversation B | cell population diff | pathway enrichment |
| `xform-report-v2` | Conversation B | tables、plots | stage report v2 |

血缘由 Runtime 和工具 Mock 记录，不由事项管家猜测。

### 10.4 每个血缘节点的最小数据

```ts
interface ResearchLineageRecord {
  id: string;
  projectId: string;
  conversationId: string;
  issueId: string;
  invocationId: string;
  transformationType: string;
  inputArtifactIds: string[];
  outputArtifactIds: string[];
  parametersSummary: string;
  codeRevision?: string;
  createdAt: string;
}
```

Mock 展示时不需要暴露所有技术字段，但必须能从文件详情或 Issue 详情逐级查看：

```text
报告 v2
→ 使用了哪些表格和图
→ 这些表格和图来自哪次分析
→ 分析使用 cleaned v2
→ cleaned v2 来自哪次 QC Invocation
→ 为什么 v1 被返工、v2 被接受
```

### 10.5 版本、返工与废弃规则

- 返工产生新 Artifact，不覆盖旧 Artifact；
- `v1 → v2` 通过 `supersedesArtifactId` 记录替代关系；
- 被替代文件仍可从血缘详情查看，但不再作为 Project 默认最新版本；
- 失败 Invocation 可以有日志和部分中间物，但不能伪装成已验收 Project 产物；
- Issue 进入 Done 只表示该科研事项已被 Human 验收，不代表删除此前失败、返工和中间过程；
- 报告引用的必须是明确版本的 Artifact ID，不能只按文件名模糊关联。

---

## 11. Conversation-Agent Session

每个专业 Agent 都维护自己的 `Conversation × Agent` Session：

```text
Conversation A
  conv-research-qc × actor-qc
  → session-qc-in-conv-a

  conv-research-qc × actor-ruonan-claw
  → session-ruonan-in-conv-a

Conversation B
  conv-research-analysis × actor-cell-analysis
  → session-cell-analysis-in-conv-b

  conv-research-analysis × actor-literature
  → session-literature-in-conv-b

  conv-research-analysis × actor-research-writer
  → session-writer-in-conv-b

  conv-research-analysis × actor-ruonan-claw
  → session-ruonan-in-conv-b
```

规则：

- Conversation A 的原始数据讨论不会自动进入 Conversation B；
- Conversation B 通过 Project 文件和 SCI-102 Brief 获得稳定输入；
- SCI-102 只归属 Conversation A；
- Conversation B 可以引用 SCI-102，但不会续接 Conversation A Session；
- 同一个若楠的 Claw 进入两个 Conversation 时，也使用两个相互隔离的 Session；
- 单细胞分析 Claw `@文献检索 Claw` 时，传递的是当前消息引用、Artifact 和 Issue Brief，不是自己的完整 Session；
- 科研写作 Claw 只读取已发布的 Project 产物和在当前 Conversation 中明确引用的内容；
- 同一 Session 中的 Invocation 串行执行。

---

## 12. Inbox 与“我的工作与项目”

### 12.1 Inbox 事件

本故事至少产生：

| 时间 | 事件 |
|---|---|
| Day 1 10:20 | SCI-102 等待你补充样本批次 |
| Day 1 18:10 | 单细胞质控 Claw 执行失败 |
| Day 2 10:40 | SCI-102 已提交候选结果，等待验收 |
| Day 2 11:05 | SCI-102 已要求返工 |
| Day 2 14:30 | SCI-102 已完成 |
| Day 2 16:20 | SCI-104 等待验收 |

Inbox 只回答“现在需要我响应什么”，已读不改变 Issue 状态。

### 12.2 我的工作与项目

若楠看到：

```text
需要我处理
  SCI-102 待验收
  SCI-104 待验收

进行中
  SCI-103 识别响应相关免疫细胞亚群

最近交付
  SCI-101 样本纳排与分组说明

参与的 Project
  肺癌免疫治疗标志物探索
```

这里不是新的 Issue 数据源，只是当前用户的跨 Project 投影。

---

## 13. 建议 Mock ID

### 13.1 Project 与 Conversation

```text
proj-lung-immunotherapy
conv-research-qc
conv-research-analysis
```

### 13.2 Agent

```text
actor-ruonan-claw
actor-qc
actor-cell-analysis
actor-literature
actor-research-writer
```

### 13.3 Issue

```text
issue-sci-101-inclusion
issue-sci-102-qc
issue-sci-103-cell-diff
issue-sci-104-report
issue-sci-105-harmony
```

### 13.4 Artifact

```text
art-raw-counts
art-metadata-v1
art-metadata-v2
art-qc-metrics-v1
art-qc-metrics-v2
art-cleaned-v1
art-cleaned-v2
art-cell-diff
art-enrichment
art-volcano
art-heatmap
art-stage-report-v1
art-stage-report-v2
```

### 13.5 Invocation

```text
inv-qc-initial
inv-qc-metadata-resume
inv-qc-failed
inv-qc-retry
inv-qc-rework
inv-cell-diff
inv-enrichment
inv-literature-evidence
inv-report-v1
inv-literature-limitations
inv-report-rework
```

---

## 14. 原型演示顺序

1. 从“我的空间”进入“肺癌免疫治疗标志物探索”；
2. 在 Project 中看到两个 Conversation；
3. 进入“数据准备与质量控制”，查看 SCI-102 的源消息和失败 Invocation；
4. 打开 Conversation Files，看到原始数据、QC 日志和中间图；
5. 切换到 Project 事项看板，看到两个 Conversation 的全部 Issue；
6. 打开 SCI-102，看到唯一主会话、完整状态历史、返工意见和文件；
7. 从 SCI-102 跳回“数据准备与质量控制”的源消息；
8. 查看 SCI-102 从 Blocked 到 In Review、Changes Requested、Done 的历史；
9. 打开 Project Files，确认只显示 Project 公开文件；
10. 进入“差异分析与阶段报告”，查看单细胞分析 Claw 使用 Project 清洗数据继续分析；
11. 查看单细胞分析 Claw `@文献检索 Claw`，以及两个独立 Invocation 的交接记录；
12. 查看科研写作 Claw 使用差异结果、图表和文献摘要形成报告；
13. 打开 SCI-104，执行“要求返工”并查看状态变化；
14. 重新提交后点击“接受”，确认进入 Done；
15. 打开阶段报告文件详情，查看上游数据、图表、所属 Agent 和 Transformation；
16. 打开 Inbox，查看待验收、返工和执行失败事件；
17. 打开“我的工作与项目”，查看科研 Project 的个人工作投影。

---

## 15. 验收标准

- [ ] 一个科研 Project 至少包含两个 Conversation。
- [ ] 两个 Conversation 使用不同的默认文件归属。
- [ ] 每个 Issue 最多只有一个主 Conversation。
- [ ] Project 看板汇总两个 Conversation 的 Issue。
- [ ] SCI-102 覆盖 Clarifying、In Progress、Waiting for Human、Blocked、In Review、Changes Requested 和 Done。
- [ ] SCI-105 覆盖 Cancelled 与 Archived。
- [ ] Agent Reply 不自动完成 Issue。
- [ ] Human 已读不改变 Issue 状态。
- [ ] Human 点击“接受”后 Issue 才进入 Done。
- [ ] Project Files 与 Conversation Files 不按 Human 聚合。
- [ ] Project Files 不展示 Conversation 文件。
- [ ] Agent 只挂载 Project Files 与当前 Conversation Files。
- [ ] 两个 Conversation 的 Agent Session 隔离。
- [ ] 单细胞质控、单细胞分析、文献检索和科研写作以四个独立 Agent 展示。
- [ ] 每个专业 Agent 分别拥有可见的责任、Invocation 和 Session。
- [ ] Agent 间交接通过消息、Issue Brief 和 Artifact 完成，不共享私有运行上下文。
- [ ] Project 工具向 Conversation 继承。
- [ ] Conversation 增量工具只影响当前会话。
- [ ] 血缘至少包含多输入、多输出 Transformation。
- [ ] Inbox、我的工作与项目和 Project 看板使用同一 Issue 数据源。
- [ ] 所有主流程交互可在 Mock 原型中点击演示。

---

## 16. 最终故事摘要

> 若楠、周宁和林晓在“肺癌免疫治疗标志物探索”Project 中，通过“数据准备与质量控制”和“差异分析与阶段报告”两个 Conversation，与单细胞质控 Claw、单细胞分析 Claw、文献检索 Claw 和科研写作 Claw 协作完成研究。原始数据、QC 日志和中间图留在第一个 Conversation；单细胞质控 Claw 验收通过的清洗数据发布到 Project，成为单细胞分析 Claw 的稳定输入；单细胞分析 Claw 再把候选细胞亚群交给文献检索 Claw 补充证据，最后由科研写作 Claw 汇总为报告。各 Agent 分别保留自己的消息、责任、Invocation 与 Session，通过消息引用、Issue Brief 和有血缘的 Artifact 交接，而不是共享一个不可见的运行上下文。事项管家从消息中形成 Project Issue，Project 看板统一汇总两个 Conversation 的进展。最终，用户既能从全局看板看清工作状态，也能沿着报告反向追溯到具体 Agent、分析步骤、输入数据和 Human 验收动作。

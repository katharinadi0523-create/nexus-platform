# My Claw 组织协作机制定稿：Project、任务会话、文件、Issue 与科研数据血缘

> 日期：2026-07-29  
> 文档类型：产品机制讨论结论 / 需求变更补充  
> 关联文档：`2026-07-27-my-claw-option-b-my-work-and-projects-requirement-change.md`  
> 当前状态：方案结论已收敛，部分对象关系仍待下一轮确认

## 1. 文档目的

本文档汇总 2026-07-28 至 2026-07-29 围绕 My Claw 组织协作方案形成的最终结论，重点解决：

1. Project 与会话的关系；
2. Project、会话、Human 与 Agent 的成员边界；
3. 会话文件如何自动进入 Project，同时避免 Agent 越权读取；
4. 是否需要区分中间结果与最终交付物；
5. Inbox、“我的工作与项目”和 Project Issue 看板的职责；
6. Issue Manager、Issue Brief 与关键变化的关系；
7. 科研数据血缘如何以代码方式确定性记录；
8. 在暂不建设文件版本管理的前提下，如何实现第一期血缘展示。

本文档记录的是当前讨论结论。与既有方案冲突时，后续实现应以本文档为准，并再将结论合并回总 PRD。

---

## 2. 核心产品原则

### 2.1 促进上下文流通，不等于打通全部上下文

产品目标仍然是尽可能促进 Project 内的上下文流通，但实现方式不再是让所有 Human、Agent 和原始消息进入同一个会话。

需要共享的是：

- 项目目标与约束；
- Issue 状态；
- 关键变化；
- 文件与数据产物；
- 数据从输入到输出的来源关系。

不应默认共享的是：

- 所有原始讨论；
- 未经授权的受限会话内容；
- Agent 在其他任务中的完整运行目录；
- 与当前任务无关的上下文文件。

### 2.2 会话负责工作过程，Project 负责汇聚长期事实

当前方向是将会话理解为一个任务的协作空间。

会话中发生：

- Human 与 Human 对话；
- Human 与 Agent 对话；
- Agent 与 Agent 协作；
- 文件输入；
- Python、工具和沙箱执行；
- 文件与数据输出。

Project 中汇聚：

- Project 成员；
- 所有任务会话；
- Project Issue；
- Project 文件索引；
- 项目级共享资源；
- 数据与产物的来源关系。

### 2.3 自动汇聚不能依赖用户手工搬运

系统不得要求用户在会话中完成工作后，再点击“上传到项目”或“同步到项目”。

会话中的文件、Issue 和运行事实应自动登记到 Project。

需要人工参与的情况仅限于：

- Human 主动改变文件可见范围；
- Human 修正系统无法确定或记录错误的关系；
- Human 执行验收、返工、取消等业务动作。

---

## 3. 对象与成员模型

### 3.1 层级关系

```text
Tenant
└── Project
    ├── Project Members
    ├── Conversations / Tasks
    ├── Project Issues
    ├── Project File Index
    └── Project Shared Resources
```

### 3.2 Project 成员

- Project 成员必须从当前 Tenant 成员中选择；
- Tenant 成员不会自动成为 Project 成员；
- Project 是使用端的实际协作边界；
- Project 成员决定谁有资格被加入该 Project 下的任务会话。

### 3.3 会话成员

- 当前不建设“公开会话”或“所有 Project 成员自动加入的会话”；
- 每个会话都有明确的 Human 参与者；
- 会话中的 Human 必须先是 Project 成员；
- 会话参与者负责完成一个相对聚焦的任务；
- Project 成员不因为属于 Project 就自动看到所有会话消息。

### 3.4 Agent 添加规则

会话中允许添加两类 Agent。

#### 个人 Agent

- 只能选择当前会话 Human 参与者所拥有的个人 Agent；
- 如果某个 Human 不在当前会话，则不能加入该 Human 的个人 Agent；
- Human 被移出会话或失去会话权限后，其个人 Agent 也不得继续读取该会话上下文和文件。

#### 平台已发布 Agent

- 可以选择 Nexus Platform 管控端已经发布、且当前 Project 有权使用的 Agent；
- 平台已发布 Agent 不要求对应某个 Human；
- Agent 自身配置的工具、知识库、MCP、Skill 等能力继续跟随 Agent；
- Project 和会话只决定该次运行可读取的协作上下文与文件范围。

### 3.5 尚待确认的对象关系

本轮确认了“会话在用户感知上是一个任务协作空间”，但尚未最终冻结：

```text
一个会话是否严格对应一个 Issue
或
一个会话可以产生多个 Issue
```

在该关系确认前：

- Conversation 负责交互；
- Issue 负责结构化追踪；
- 不应在实现中擅自锁死 1:1 或 1:N 数据关系。

---

## 4. 会话文件范围

### 4.1 取消公开会话与受限会话分类

当前不通过“Open Conversation / Limited Conversation”决定成员范围。

所有会话均有明确参与者。创建会话时单独选择该任务产生文件的可见范围。

### 4.2 创建会话时配置文件可见范围

```text
文件可见范围
  ○ Project 成员
  ○ 仅任务成员
```

#### Project 成员

- 会话消息仍然只对任务成员可见；
- 会话产生的文件自动登记到 Project 文件索引；
- Project 全体成员可以在 Project 文件区域发现和使用这些文件；
- Project 成员不能因为能看到文件而读取来源会话的消息。

#### 仅任务成员

- 会话消息只对任务成员可见；
- 会话文件仍自动登记到 Project 文件索引；
- 只有当前任务成员能够在 Project 文件区域看到这些文件；
- 其他 Project 成员不需要看到受限文件的名称、摘要和内容。

### 4.3 不区分中间结果与最终交付物

第一期取消以下判断：

- 中间文件；
- 最终文件；
- 候选交付物；
- 正式交付物自动发布。

原因：

- 同一个文件在不同时刻可能具有不同意义；
- Human 对“是否最终”也可能存在分歧；
- A 接受后，B 仍可能要求修改；
- 依赖 Agent 判断容易产生误判；
- 强制 Human 手工确认会重新引入 WorkBuddy 式操作负担。

因此，第一期所有会话文件统一继承会话创建时选择的文件可见范围。

### 4.4 Human 主动共享与自动机制

- Human 主动将受限文件引用或发送到文件范围为 Project 成员的任务中，视为主动扩大该文件或新副本的可见范围；
- Human 的主动发送动作本身已经表达共享意图，不增加二次确认弹窗；
- Human 下载后重新上传形成新的文件记录；
- Agent、Issue Manager、自动摘要和检索机制不得自行扩大文件可见范围；
- 自动机制只可以在现有权限范围内建立引用。

---

## 5. 文件归属、存储与 Agent 访问边界

### 5.1 “属于 Project”不等于“放在同一个 Agent 可遍历目录”

所有会话文件都属于 Project 的业务生命周期，并进入统一的 Project 文件索引。

但是，不能把完整 Project 根目录直接挂载给 Agent。否则即使数据库记录了可见范围，Agent 仍可能通过终端、路径遍历或文件搜索读取其他任务文件。

### 5.2 逻辑文件结构

```text
Project
├── shared/
│   └── Project 成员可见文件
└── tasks/
    ├── task-a/
    │   └── 仅 Task A 成员可见文件
    ├── task-b/
    │   └── 仅 Task B 成员可见文件
    └── task-c/
        └── 仅 Task C 成员可见文件
```

该结构描述访问分区，不要求前端向用户暴露真实服务器路径。

### 5.3 Agent 运行时挂载

Agent 每次 Invocation 只获得当前运行允许访问的目录：

```text
Agent 可访问文件
=
Project 共享文件
+ 当前任务文件
+ 当前消息明确引用且有权访问的文件
```

不得挂载：

- 完整 Project 根目录；
- 其他任务的受限目录；
- 当前 Human 无权访问的文件；
- 仅因为 Issue 存在关联就自动开放的文件。

### 5.4 Project 文件中心

Project 文件中心是一个经过 ACL 过滤的聚合视图，而不是向所有用户和 Agent 暴露同一物理目录。

不同用户打开同一个 Project 文件中心时，可能看到不同结果：

```text
当前用户可见文件
=
Project 成员可见文件
+ 当前用户参加的受限任务文件
```

---

## 6. Inbox、“我的工作与项目”和 Project Issue 看板

三者必须回答不同问题，避免形成三个重复的“待办中心”。

| 产品区域 | 核心问题 | 范围 | 生命周期 |
|---|---|---|---|
| Inbox | 最近发生了什么、现在需要我响应什么 | 全局、跨 Project | 事件型，处理后消退 |
| 我的工作与项目 | 我跨 Project 负责、参与和关注哪些长期工作 | 个人、跨 Project | 持久个人聚合 |
| Project Issue 看板 | 这个 Project 整体正在做什么 | 当前 Project | 项目共同事实 |

### 6.1 Inbox

Inbox 承载：

- @；
- 分派；
- 等待 Human 补充；
- 等待审批或验收；
- 返工请求；
- Agent 失败；
- Issue Manager 需要 Human 确认的建议。

Inbox 不是 Issue 数据源，只是事件入口。

### 6.2 我的工作与项目

“我的工作与项目”承载当前用户跨 Project 的个人聚合：

- 当前负责的事项；
- 当前参与的 Project；
- 自己发起或参与过的工作；
- 最近变化和进展。

它不展示某个 Project 的全部事项。

### 6.3 Project Issue 看板

Project Issue 看板展示当前用户有权查看的全部 Project Issue。

第一期不再建设独立的“待我处理”一级视图，避免与 Inbox 和“我的工作与项目”重叠。

看板提供过滤器：

- 状态；
- 当前负责人；
- 发起人；
- 来源会话；
- 更新时间；
- 可见范围；
- 只看与我有关。

如果提供多种视图，应是同一批 Issue 的不同组织方式：

1. 状态看板；
2. 按会话查看；
3. 列表视图。

---

## 7. Issue Manager、Issue Brief 与关键变化

### 7.1 Issue Manager 职责

Issue Manager 是隐藏在后台的事项管理 Agent，负责：

- 识别 Issue；
- 提出 Issue 创建、修改、取消和关联建议；
- 维护 Issue Brief；
- 关联来源消息、会话、文件和 Invocation；
- 生成人类可读的事项变化说明。

Issue Manager 不负责：

- 执行具体科研任务；
- 独立维护一套数据血缘；
- 判断文件是中间结果还是最终交付物；
- 直接扩大文件可见范围；
- 将所有读取日志解释成语义关系。

### 7.2 Issue Brief

第一期在 Issue 创建时自动生成 Brief：

```text
Issue Brief
- 要解决的问题
- 背景和上下文
- 预期结果
- 当前负责人
- 来源消息
- 来源会话
- 当前相关文件
```

Issue Brief 是当前事项的结构化说明，不要求用户转移到 Issue 页面进行主要交流。

### 7.3 关键决策与关键变化

第一期不建设独立的“决策管理”对象。

当 Issue Manager 已经因为以下事件被调用时，可以在同一次结构化输出中增加可选的“关键变化”：

- 目标或范围明确改变；
- 一个方案被明确采用或否决；
- 验收标准改变；
- 负责人或计划发生重要调整；
- 新文件或数据产物改变后续工作。

规则：

- `keyChange` 可以为空；
- 不要求每次调用都生成；
- 必须关联证据消息；
- 不额外调用一次 LLM；
- Issue Manager 只生成可读说明，不负责写入确定性数据血缘。

---

## 8. 科研数据血缘

### 8.1 产品目标

支持科研用户回答：

- 当前文件来自哪些原始数据；
- 中间经过了什么处理；
- 谁或哪个 Agent 执行了处理；
- 使用了什么工具、Python 代码或参数；
- 处理后产生了哪些新文件；
- 新文件后续又被哪些工作使用。

第一期不判断文件的业务地位，只记录确定的：

```text
输入文件
→ 处理过程
→ 输出文件
```

### 8.2 数据血缘属于 Project，不只属于 Issue

同一个原始文件可能被多个 Issue 使用，一个 Issue 的输出也可能成为另一个 Issue 的输入。

因此：

- 底层血缘关系属于 Project；
- Issue 页面展示与当前 Issue 有关的局部血缘；
- 文件详情展示单个文件的上游与下游；
- 不将完整血缘仅存为 Issue 的一段文本。

---

## 9. 哪些文件进入血缘

### 9.1 第一类：Human 明确附加的输入文件

例如：

```text
@Agent，请分析附件中的原始实验数据。
附件：raw-data.csv
```

由消息服务或 Invocation Builder 直接记录：

```text
explicitInputArtifactIds = ["artifact-raw-data"]
```

该过程完全由代码记录，不需要 LLM 判断。

### 9.2 第二类：明确传入工具或 Python 执行的文件

例如：

```text
python analyze.py --input raw-data.csv --output result.csv
```

如果工具接口、命令包装器或沙箱 Runner 能识别输入文件参数，则由 Runtime 直接记录输入文件。

该过程也不需要 LLM 判断。

### 9.3 第三类：Agent 声明输出使用了某个输入文件

如果让 Agent 在输出时返回：

```json
{
  "inputArtifactIds": ["artifact-a"],
  "outputArtifactIds": ["artifact-b"]
}
```

则：

- 不需要额外再调用一次 LLM；
- 可以作为当前 Agent Run 的结构化输出一起返回；
- 但该关系仍然来自 Agent 判断，不属于完全确定性的代码事实；
- 第一阶段不应把 Agent 自主声明作为唯一可信来源。

### 9.4 第一阶段推荐：用沙箱 I/O 观测替代 Agent 语义声明

为了实现不增加 LLM 判断的第一期，可以将沙箱目录按用途拆分：

```text
/context    Project Brief、规则和参考上下文
/inputs     本次 Run 明确绑定的数据或文件输入
/workspace  Agent 工作目录
/outputs    本次 Run 产生的输出文件
```

规则：

- `/context` 中的文件即使被读取，也不进入数据血缘；
- `/inputs` 中被成功读取或传给工具的文件，记录为本次 Transformation 输入；
- `/outputs` 中新增的文件，记录为本次 Transformation 输出；
- 如果允许修改已有文件，则修改后的文件作为新的 Artifact 记录；
- Python 标准库、依赖包、系统文件不进入 Project 数据血缘；
- Runtime 只追踪 Project Artifact 挂载范围内的文件。

因此，第一期不需要额外 LLM，也不需要让 Issue Manager判断：

```text
读取 /inputs/raw-data.csv
+ 写入 /outputs/cleaned-data.csv
→ 自动记录 raw-data.csv → Python 处理 → cleaned-data.csv
```

### 9.5 不进入血缘的读取

以下行为只进入运行审计，不进入产品数据血缘：

- 阅读 Project Brief；
- 阅读 README；
- 查看工具说明；
- 搜索文件名；
- 预览无关文件；
- 读取 Python 库和系统依赖；
- Agent 偶然打开但未纳入 `/inputs` 的参考文件。

访问日志和数据血缘是两类不同数据：

```text
访问日志：Agent 看过什么
数据血缘：本次产出明确使用了什么输入
```

---

## 10. 血缘写入职责

| 组件 | 职责 |
|---|---|
| Message Service | 记录 Human 明确附加的文件 |
| Invocation Builder | 生成本次运行的输入文件清单 |
| Tool Gateway | 记录工具接口中的输入与输出 Artifact |
| Sandbox Runner | 观察 `/inputs` 读取和 `/outputs` 创建或修改 |
| File/Artifact Service | 为文件分配稳定 Artifact ID |
| Lineage Service | 写入输入、处理过程和输出关系 |
| Issue Service | 将 Transformation、Artifact 与 Issue 关联 |
| Issue Manager | 生成可读说明，不作为确定性血缘事实源 |

---

## 11. 第一阶段不建设完整文件版本管理

### 11.1 结论

由于当前产品缺少文件版本管理，而交付时间紧，第一阶段可以不建设：

- v1、v2 等版本展示；
- 文件版本对比；
- 恢复历史版本；
- 覆盖历史；
- 完整版本树。

### 11.2 最低技术前提

即使不建设版本管理，每次上传、生成或修改后的文件仍必须获得一个稳定的 `Artifact ID`。

同名文件可以是两个不同 Artifact：

```text
artifact-001  清洗数据.csv
artifact-002  清洗数据.csv
```

前端无需将其表达为 v1、v2，但底层不能只用文件名或路径作为血缘主键。

对于外部上传且无法确定来源的文件：

```text
来源：外部上传，来源未记录
```

系统不得自动编造上游关系。

---

## 12. 第一阶段数据结构

### 12.1 Artifact

```ts
interface Artifact {
  id: string;
  projectId: string;
  conversationId: string;
  issueIds: string[];
  name: string;
  path: string;
  visibilityScope: "project" | "task_members";
  createdByType: "human" | "agent" | "tool";
  createdById: string;
  createdAt: string;

  /**
   * 直接上游文件，可以有 0 到多个，因此必须是数组，不能是单个 string。
   */
  sourceArtifactIds: string[];

  /**
   * 内部关联处理记录。普通用户页面不直接展示该 ID。
   */
  producedByTransformationId?: string;
}
```

`sourceArtifactIds` 必须为数组：

```ts
sourceArtifactIds: string[]
```

原因：

- 一个报告可能同时来源于数据表、图表和 PRD；
- 一个分析结果可能同时使用多个实验数据文件；
- 一个合并数据集可能具有多个上游数据源。

### 12.2 Transformation

```ts
interface Transformation {
  id: string;
  projectId: string;
  conversationId: string;
  issueIds: string[];

  executorType: "human" | "agent" | "tool";
  executorId: string;

  operationType:
    | "python"
    | "tool"
    | "file_conversion"
    | "document_generation"
    | "manual_upload"
    | "other";

  operationLabel: string;
  inputArtifactIds: string[];
  outputArtifactIds: string[];
  createdAt: string;

  /**
   * 仅供内部调试、审计与 Trace 使用，不在普通用户界面直接展示。
   */
  runId?: string;
}
```

输入和输出都必须是数组：

```ts
inputArtifactIds: string[]
outputArtifactIds: string[]
```

因为一次 Python 处理可能：

- 使用多个输入文件；
- 同时产生数据表、图片和报告等多个输出文件。

### 12.3 不向普通用户展示 Run ID

`Run ID`、`Transformation ID` 和 `Artifact ID` 都是内部标识。

普通用户看到：

```text
Python 数据清洗
由科研数据分析 Agent 执行
2026-07-29 14:30
输入：原始实验数据.csv
输出：清洗数据.csv、异常值明细.csv
```

而不是：

```text
Run ID: run-72918192
Transformation ID: tf-128818
```

只有开发者调试、审计或 Trace 页面可以查看内部 ID。

---

## 13. 科研数据血缘示例

```text
原始实验数据.csv
→ Python 数据清洗
→ 清洗后数据.parquet
→ 统计分析
→ 差异分析结果.csv
→ 图表生成
→ 实验结果图.png
→ 报告撰写
→ 阶段研究报告.docx
```

对应数据结构：

```text
Transformation A
inputArtifactIds:
  - raw-experiment-data
outputArtifactIds:
  - cleaned-data

Transformation B
inputArtifactIds:
  - cleaned-data
outputArtifactIds:
  - difference-result

Transformation C
inputArtifactIds:
  - difference-result
outputArtifactIds:
  - result-chart

Transformation D
inputArtifactIds:
  - difference-result
  - result-chart
outputArtifactIds:
  - stage-report
```

系统无需判断其中哪个是中间结果、哪个是最终交付，只展示真实记录的来源关系。

---

## 14. 页面展示

### 14.1 Issue 详情：数据与产物流转

展示当前 Issue 相关的局部链路：

```text
输入
  原始实验数据.csv

处理过程
  Python 数据清洗
  执行者：科研数据分析 Agent
  时间：2026-07-29 14:30

输出
  清洗后数据.parquet
  异常值明细.csv
```

不展示内部 Run ID。

### 14.2 文件详情：来源与去向

第一期展示：

- 直接来源文件；
- 由什么操作生成；
- 执行者；
- 创建时间；
- 下游产生或使用该文件的记录；
- 关联 Issue；
- 来源会话；
- 文件可见范围。

第一期不展示：

- 版本历史；
- 版本比较；
- 版本恢复。

### 14.3 未知来源

对于 Human 从平台外部上传、且系统没有可靠来源记录的文件：

```text
来源：外部上传
上游：未记录
```

不得让 LLM 推测并写入确定性血缘。

---

## 15. 第一阶段范围

### 15.1 必须实现或在原型中表达

- [ ] Tenant → Project → Conversation/Task 的成员约束；
- [ ] 会话 Human 必须是 Project 成员；
- [ ] 个人 Agent 只能来自当前会话 Human；
- [ ] 支持添加当前 Project 可用的平台已发布 Agent；
- [ ] 创建会话时选择文件范围：Project 成员 / 仅任务成员；
- [ ] 会话文件自动进入 Project 文件索引；
- [ ] Agent 只挂载 Project 共享文件、当前任务文件和明确授权文件；
- [ ] Project Issue 看板与 Inbox、“我的工作与项目”职责分离；
- [ ] Issue 创建时生成 Brief；
- [ ] Artifact 使用稳定 ID；
- [ ] `sourceArtifactIds`、`inputArtifactIds`、`outputArtifactIds` 使用数组；
- [ ] 通过附件、工具参数和沙箱 I/O 观测记录血缘；
- [ ] Issue 页面展示局部数据与产物流转；
- [ ] 文件详情展示来源与去向；
- [ ] 普通用户界面不展示 Run ID。

### 15.2 明确不做

- [ ] 公开会话；
- [ ] 自动判断中间结果与最终交付物；
- [ ] 手动“上传到 Project”作为正常文件流转机制；
- [ ] 完整文件版本管理；
- [ ] 独立决策管理模块；
- [ ] 依赖 Issue Manager 或额外 LLM 判断确定性数据血缘；
- [ ] 全项目复杂血缘大图；
- [ ] 跨 Project Issue 引用；
- [ ] 完整 Issue 依赖图；
- [ ] 自动扩大受限文件可见范围。

---

## 16. 后续待确认

1. Conversation/Task 与 Issue 的最终映射是 1:1 还是 1:N；
2. 会话文件可见范围是否允许创建后修改；
3. Human 将受限文件共享到 Project 范围后，是扩大原文件 ACL，还是产生新的公共副本；
4. Sandbox 是否能够提供文件级读取观测，还是第一期只记录明确附件和工具参数；
5. Python 输出是否统一要求写入 `/outputs`，以降低识别复杂度；
6. 同名 Artifact 在没有版本 UI 的情况下如何向用户区分；
7. 受限上游文件产生 Project 可见输出时，权限如何继承；
8. Issue Manager 的 `keyChange` 是否进入第一期原型。

---

## 17. 最终结论

第一阶段采用以下机制：

> Project 是长期协作和事实汇聚边界，会话是有明确参与者的任务协作空间。创建会话时选择文件对 Project 成员可见或仅任务成员可见，不区分中间结果与最终交付物，所有文件自动登记到 Project 文件索引。Agent 不获得完整 Project 根目录，而是按当前任务和权限挂载文件。Inbox 负责事件，“我的工作与项目”负责跨 Project 的个人聚合，Project Issue 看板负责项目全局状态。Issue Manager 维护 Issue 和 Brief，但数据血缘由 Runtime、工具和沙箱以代码方式记录。第一期不建设完整版本管理，只通过稳定 Artifact ID、输入数组、Transformation 和输出数组展示“哪个文件经过什么处理产生了哪些文件”，普通用户页面不暴露 Run ID。

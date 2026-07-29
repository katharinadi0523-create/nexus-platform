# My Claw 组织协作原型 Release Note

> 发布版本：方案二 · Project 多会话协作迭代版  
> 发布日期：2026-07-29  
> 版本性质：交互原型 / Mock 机制验证  
> 适用范围：My Claw 使用端

---

## 版本概述

本次迭代将 My Claw 从“一个 Project 对应一条顶层会话”的轻量群聊模型，升级为：

```text
一个 Project
+ 多个 Conversation
+ 一个 Project 事项看板
+ Project / Conversation 两级工具
+ Project / Conversation 两级文件归属
+ 多个独立 Agent
+ 可追溯的科研数据血缘
```

Conversation 仍然是用户开展工作的主要交互界面；Project 则负责汇聚长期目标、成员、Agent、事项、稳定文件和数据血缘。

本次迭代的目标不是把会话改造成复杂的项目管理工具，而是在保留对话式交互的同时，补齐跨会话的全局状态、交付追踪和研究复核能力。

---

## 主要更新

### 1. 使用端取消 Workspace 层级

My Claw 使用端不再要求用户先选择 Workspace。

新的全局结构为：

```text
我的空间
├── Inbox
├── 我的工作与项目
├── 个人 Chat
└── Projects
```

- 个人 Chat 延续现有个人会话体验；
- Project Chat 由 Project 下的多个 Conversation 承载；
- Workspace、组织资源治理和 Agent 发布管理仍属于开发或管控侧，不进入日常使用路径。

### 2. Project 支持多个 Conversation

Project 不再等同于一条会话，而是长期协作和事实汇聚边界。

```text
Project
├── Conversation A
├── Conversation B
├── Conversation C
├── Issue Board
├── Project Files
└── Project Shared Tools
```

用户可以在一个 Project 内围绕不同工作主题创建多个 Conversation，并在左侧导航中直接展开和进入。

### 3. 每个 Project 新增全局事项看板

每个 Project 拥有且仅拥有一个事项看板，统一汇总该 Project 下所有 Conversation 产生的 Issue。

看板帮助成员回答：

- 当前 Project 整体正在做什么；
- 哪些事项正在进行、等待反馈或等待验收；
- 哪些 Agent 执行失败；
- 哪些事项经过返工后已经完成；
- 每个事项来自哪个主 Conversation。

Issue 由后台隐形事项管家辅助识别和维护，Human 仍可以手动创建、修改、取消、归档或纠正 Issue。

### 4. 一个 Issue 最多关联一个主 Conversation

Issue 与 Conversation 不再采用 N:M 关系。

```text
Conversation : Issue = 1:N
Issue : Primary Conversation = 0..1:1
```

- 一个 Conversation 可以产生多个 Issue；
- 一个 Issue 最多拥有一个主 Conversation；
- 从事项看板手动创建的 Issue 可以暂时没有主 Conversation；
- 其他 Conversation 如需提到该事项，只创建引用，不成为第二个主 Conversation。

Issue 详情中的主会话入口已调整为紧凑单行样式，可直接定位到来源消息。

如果当前用户无权访问主 Conversation，Issue 详情中不展示整个主会话字段，也不提示该受限会话的存在。

### 5. 创建 Conversation 时选择文件默认归属

创建 Conversation 时，不再选择“公开会话”或“受限会话”，而是选择该会话后续产生文件的默认归属：

```text
文件归属
  ○ 文件仅属于当前 Conversation
  ● 文件公开到 Project（默认）
```

该选项只决定文件进入 Project Files 还是 Conversation Files，不决定会话消息的参与者范围。

### 6. Project 与 Conversation 支持两级工具配置

Agent 的实际可用工具由三层能力共同组成：

```text
Agent 默认 Capability
+ Project Shared Tools
+ 当前 Conversation Tools
```

- Agent 自身的 Skill、插件、MCP、知识库和 Workflow 继续跟随 Agent；
- Project Shared Tools 向 Project 下所有 Conversation 继承；
- Conversation Tools 只对当前 Conversation 增量生效；
- Conversation 配置不会回写 Project，也不会修改 Agent 发布版本。

### 7. 多 Agent 以独立角色参与科研协作

科研故事线不再使用一个统一的 Agent 组，而是将专业 Agent 分别展示：

- 单细胞质控 Claw；
- 单细胞分析 Claw；
- 文献检索 Claw；
- 科研写作 Claw；
- 若楠的个人 Claw。

每个 Agent 都拥有独立的：

- Project / Conversation 参与身份；
- `@Agent` 入口；
- Issue 责任；
- Conversation-Agent Session；
- Invocation 与执行状态；
- 产物和数据血缘记录。

Agent 之间通过可见消息、Issue Brief 和 Artifact 交接，不直接共享彼此的私有运行上下文。

### 8. 新增科研数据血缘演示

本次提供“肺癌免疫治疗标志物探索”科研 Mock 故事线，覆盖两个 Conversation：

```text
数据准备与质量控制
→ 原始数据、样本元数据、QC、批次校正

差异分析与阶段报告
→ 细胞注释、差异分析、通路证据、科研报告
```

核心产物链路为：

```text
原始表达矩阵
+ 样本元数据
→ 质控与批次校正
→ 清洗数据
→ 细胞注释与差异分析
→ 通路富集与文献证据
→ 阶段研究报告
```

故事同时覆盖 Issue 澄清、执行、等待 Human、运行阻塞、重试、待验收、要求返工、再次验收和完成。

---

## 设计备注

以下条目是本次讨论中已经收敛的关键产品逻辑。它们不一定全部直接暴露给用户，但后续实现不能偏离。

### 备注 1：Conversation、Issue 与 Invocation 是三类不同对象

```text
Conversation = 持续交流和上下文容器
Issue = Project 级长期工作台账
Invocation = Agent 的一次具体执行
```

- 一次 Invocation 成功不代表 Issue 完成；
- Agent 回复不自动将 Issue 变为 Done；
- Human 已读不改变 Issue 状态；
- 只有 Human 明确点击“接受”或执行等价验收动作，Issue 才进入 Done；
- Human 可以要求返工，返工会创建新的 Invocation，并保留此前候选交付和意见。

### 备注 2：事项管家不拥有独立用户会话

事项管家是后台系统 Agent，负责：

- 识别可能的 Issue；
- 建议创建、修改、取消或更新状态；
- 维护结构化 Issue Brief；
- 根据消息和运行事件提出前端提示。

事项管家不出现在成员列表、Agent 数量或 Conversation 列表中，也不创建一条用户需要进入的管理会话。

Human 始终可以手动进行 Issue 增删改查，并覆盖事项管家的错误判断。

### 备注 3：文件归属与消息可见性必须分开

本次只定义两种文件产品作用域：

```text
scope = "project"
scope = "conversation"
```

- Project Files 只显示 `scope = "project"` 的文件；
- Conversation Files 只显示属于当前 Conversation 的文件；
- 不按 Human 聚合文件；
- 不创建 `visibleUserIds` 或 `allowedMemberIds`；
- Project 成员身份不会自动把 Conversation 文件提升为 Project 文件；
- `sourceConversationId` 只表示文件来源，不代表访问权限。

一个 Agent 执行时只挂载：

```text
Project Files
+ 当前 Conversation Files
```

不会挂载其他 Conversation 的文件，也不会获得一个可遍历的完整 Project 根目录。

### 备注 4：无权访问主 Conversation 时不展示关联框

Issue 看板可以向 Project 成员展示 Issue 的公开字段，但不能借此泄露受限 Conversation。

如果用户无权访问主 Conversation：

- 不展示 Conversation 名称；
- 不展示“无权访问某会话”的占位框；
- 不展示“主会话”字段本身；
- 不复制来源消息；
- Issue 的其他 Project 级公开信息继续正常展示。

### 备注 5：Session 按 Conversation × Agent 隔离

```text
Conversation × Agent
→ Conversation-Agent Session

Conversation-Agent Session
→ 1:N Invocations
```

- 同一个 Agent 在同一个 Conversation 内续接同一执行 Session；
- 同一个 Agent 进入两个 Conversation 时使用两套 Session；
- Issue 不负责 Session 路由；
- Project Brief、Project Files 和 Project 工具可以继承；
- 其他 Conversation 的原始消息不会自动注入当前 Session；
- 同一个 Session 中同时触发两个 Invocation 时，第一期采用串行或显式排队。

### 备注 6：多 Agent 交接不等于共享全部上下文

专业 Agent 之间通过以下对象交接：

```text
明确 @Agent 的消息
+ 被引用的来源消息
+ Issue Brief
+ Project Artifact
+ 当前 Conversation Artifact
```

例如：

```text
单细胞质控 Claw
→ 发布 cleaned_pbmc_v2.h5ad 到 Project
→ 单细胞分析 Claw 将其作为稳定输入
→ 文献检索 Claw 根据差异结果补充证据
→ 科研写作 Claw 组合已验收产物形成报告
```

后一个 Agent 不读取前一个 Agent 的完整 Session，也不依赖一个不可见的统一调度 Agent。

### 备注 7：数据血缘必须由确定性运行事实记录

数据血缘的目标是回答：

1. 一个结果使用了哪些输入；
2. 输入经过了什么 Transformation；
3. 哪个 Agent 的哪次 Invocation 产生了输出；
4. 输出属于哪个 Project、Conversation 和 Issue；
5. Human 为什么接受、返工或废弃某次结果。

最小链路为：

```text
Input Artifacts
→ Transformation
→ Agent Invocation
→ Output Artifacts
```

建议记录：

```ts
interface ResearchLineageRecord {
  id: string;
  projectId: string;
  conversationId: string;
  issueId?: string;
  agentId: string;
  invocationId: string;
  transformationType: string;
  inputArtifactIds: string[];
  outputArtifactIds: string[];
  parametersSummary?: string;
  codeRevision?: string;
  createdAt: string;
}
```

血缘事实来源按优先级包括：

1. Human 明确附加为输入的文件；
2. Tool Gateway 中明确传入和返回的 Artifact；
3. Sandbox `/inputs` 中被实际读取的文件；
4. Sandbox `/outputs` 中实际生成的文件；
5. Runner 记录的参数、代码版本和运行结果。

以下信息不自动形成产品数据血缘：

- 仅仅出现在 Project Context 中的文件；
- Agent 浏览过但没有用于产出的资料；
- Python 依赖包和系统文件；
- 事项管家或额外 LLM 根据语义猜测的文件关系。

事项管家可以把确定性血缘转换为用户可读摘要，但不能成为血缘事实源。

### 备注 8：数据血缘属于 Project，Issue 只展示局部视图

一个 Artifact 可能被多个 Issue 使用，一个 Issue 的输出也可能成为另一个 Issue 的输入。

因此：

- 底层血缘关系归属于 Project；
- Issue 详情只展示与当前 Issue 相关的局部链路；
- 文件详情展示该文件的来源、Transformation、去向和关联 Issue；
- 不把完整血缘保存为 Issue 中的一段自然语言；
- 第一期不建设全 Project 的复杂血缘大图。

### 备注 9：第一期不建设完整文件版本管理

即使没有文件版本 UI，每次上传、生成或修改后的文件仍必须获得新的稳定 Artifact ID。

```text
report.docx（Artifact A）
report.docx（Artifact B）
```

两者即使同名，也不能只按文件名或路径识别。

返工时：

- 新产物使用新的 Artifact ID；
- 旧产物继续保留在运行和血缘记录中；
- 可以用 `sourceArtifactIds` 或替代关系表达新旧产物联系；
- 被替代产物不再作为默认稳定输入；
- 失败 Invocation 的日志和部分输出不能伪装成已验收 Project 产物。

### 备注 10：Inbox、我的工作与项目、事项看板共用同一 Issue 数据

三者职责不同，但不是三套任务系统：

| 入口 | 回答的问题 | 数据形态 |
|---|---|---|
| Inbox | 最近发生了什么、现在需要我响应什么 | 跨 Project 事件 |
| 我的工作与项目 | 我参与的工作整体进展如何 | 跨 Project 的个人投影 |
| Project 事项看板 | 当前 Project 整体正在做什么 | Project 共同事实 |

Inbox 已读只处理事件，不修改 Issue 业务状态。

---

## 原型验证重点

建议按照以下链路演示本次版本：

1. 从“我的空间”直接进入科研 Project；
2. 在同一个 Project 下查看两个 Conversation；
3. 在不同 Conversation 中观察多个独立 Agent 的分工；
4. 从消息触发 Issue，并在 Project 看板查看跨 Conversation 汇总；
5. 演示 SCI-102 从执行失败、重试、返工到 Human 验收完成；
6. 从 Issue 的唯一主会话入口定位来源消息；
7. 验证无权访问主 Conversation 时不展示关联区域；
8. 查看 Project Files 与 Conversation Files 的不同归属；
9. 从阶段报告反向追溯图表、差异结果、清洗数据和原始输入；
10. 在 Inbox 和“我的工作与项目”查看同一批 Issue 的不同投影。

---

## 本期边界

本次为原型机制验证，以下能力不在本期范围：

- 真实 Agent Runtime 和任务调度服务；
- 完整文件版本管理；
- 逐人文件 ACL；
- 全 Project 复杂数据血缘图；
- 跨 Project Issue 引用；
- 完整 Issue 依赖图；
- 事项管家基于 LLM 猜测数据血缘；
- 将使用端 Workspace 恢复为必经导航层。

---

## 关联文档

- `2026-07-29-my-claw-project-multi-conversation-prototype-change-spec.md`
- `2026-07-29-my-claw-project-task-files-issue-lineage-decisions.md`
- `2026-07-29-my-claw-scientific-research-storyline-mock-spec.md`
- `2026-07-27-my-claw-option-b-my-work-and-projects-requirement-change.md`


# My Claw 方案二原型需求变更说明：Project 多会话、文件归属、事项汇总与两级工具

> 文档类型：增量需求变更 / Coding Agent 原型实现规格  
> 日期：2026-07-29  
> 适用代码库：`/Users/nanbunan/Dev-Projects/nexus-platform`  
> 适用分支：由 Coding Agent 从当前方案二分支新建独立功能分支  
> 基础需求：`2026-07-27-my-claw-option-b-my-work-and-projects-requirement-change.md`  
> 机制补充：`2026-07-29-my-claw-project-task-files-issue-lineage-decisions.md`

---

## 0. 给 Coding Agent 的执行说明

这是对当前 My Claw 组织协作“方案二”原型的增量修改，不是重做整套产品。

实现时必须遵循以下优先级：

1. 本文明确写出的新增和变更；
2. `2026-07-29-my-claw-project-task-files-issue-lineage-decisions.md` 中未被本文覆盖的 Artifact、Agent 挂载和数据血缘规则；
3. `2026-07-27-my-claw-option-b-my-work-and-projects-requirement-change.md` 中未被本文覆盖的原有要求；
4. 更早的基础 PRD。

如果文档冲突，以优先级更高者为准。

ƒƒ禁止：

- 直接覆盖或重写原需求文档；
- 修改与本需求无关的登录、认证、个人 Chat 或 Nexus Platform 管控端逻辑；
- 恢复使用端 Workspace；
- 把 Project 再实现成一条顶层会话；
- 只改视觉、不改 Mock 对象关系；
- 用静态截图或不可交互卡片冒充原型功能；
- 擅自引入真实后端、真实 Agent Runtime 或复杂权限服务。

---



## 1. 本次变更结论

本次冻结四项产品关系：

### 1.1 Project 不再与 Conversation 同层等价

现状：

```text
Project A = 一条顶层 Conversation
Project B = 一条顶层 Conversation
```

目标：

```text
Project
├── Conversation A
├── Conversation B
├── Conversation C
└── Issue Board
```

对象基数：

```text
Project : Conversation = 1:N
Project : Issue Board = 1:1
Project : Issue = 1:N
Conversation : Issue = 1:N
Issue : Primary Conversation = 0..1:1
```

具体含义：

- 一个 Project 可以包含多个 Conversation；
- 一个 Conversation 可以识别、创建或推进多个 Issue；
- 一个 Issue 最多归属一个主 Conversation；
- 从 Project 事项看板手工创建、尚未开始会话协作的 Issue 可以暂时没有主 Conversation；
- 一个 Project 只有一个事项看板；
- 所有 Conversation 产生的 Issue 汇总到该 Project 的同一事项看板；
- 事项看板对 Project 全部成员可见。



### 1.2 创建会话时定义文件的默认归属范围

Project 内新增“创建会话”入口。

这里不定义“公开会话”或“受限会话”。所有 Project Conversation 都有明确的 Human 参与者，会话消息仅对会话参与者可见。

创建会话时，创建人必须为“该会话产生的文件”选择默认归属范围：

```text
文件归属
  ○ 文件仅属于当前会话
  ● 文件公开到 Project（默认）
```



#### 文件公开到 Project

- 会话消息仍然只对会话成员可见；
- 会话中新产生的文件默认 `scope = "project"`；
- 文件进入 Project 文件区；
- 文件作为 Project 公开文件被发现和使用；
- 看到文件不代表可以读取其来源会话的消息；
- 这是创建会话时的默认选项。



#### 文件仅属于当前会话

- 会话消息仍然只对会话成员可见；
- 会话中新产生的文件默认 `scope = "conversation"`；
- 文件进入当前 Conversation 的文件区；
- 文件不会进入 Project 文件区；
- 系统不为文件维护逐人可见列表或逐人 ACL；
- 会话产生的 Issue 仍汇总到 Project 唯一事项看板。



### 1.3 Project 与 Conversation 两级配置工具

工具配置层级：

```text
Agent 默认 Capability
        +
Project Shared Tools
        ↓ 继承
Conversation Tools
```

有效工具计算：

```text
当前 Invocation 有效工具
= Agent 发布版本默认工具
+ Project Shared Tool Bindings
+ 当前 Conversation Tool Bindings
（取交集）
```

规则：

- Agent 默认工具继续跟随 Agent；
- Project 工具向 Project 下所有 Conversation 继承；
- Conversation 工具只对当前 Conversation 生效；
- Conversation 工具是增量配置，不回写 Project；
- Project 或 Conversation 的 Binding 都不修改 Agent 发布版本；
- 同一工具在多个层级重复绑定时，按同一个已发布资源版本去重；
- 权限冲突时取更严格权限；



### 1.4 文件和数据血缘沿用机制补充文档

本次原型必须表达：

- 文件按 `project` 或 `conversation` 两种作用域落入对应文件区；
- 文件归属范围由创建会话时选择的默认文件归属决定；
- Project 文件区只展示 Project 公开文件，不聚合 Conversation 文件；
- Agent 不得获得完整 Project 根目录；
- Agent 只获得 Project 文件与当前 Conversation 文件；
- 文件具有稳定 Artifact ID；
- 文件来源与去向可以用 Mock 血缘关系展示；
- 暂不建设文件版本管理。

---



## 2. 本次不变的产品边界

以下要求继续保持：

- My Claw 使用端没有 Workspace 选择器；
- 使用端只有一个“我的空间”；
- 个人 Chat 继续复用当前个人会话列表；
- Project 列表直接展示当前用户有权访问的 Project；
- Inbox 是用户级全局入口；
- “我的工作与项目”是当前用户的跨 Project 聚合；
- Conversation 仍然是 Project 中主要的工作交互方式；
- Issue 由隐形事项管家辅助识别和组织；
- 事项管家不出现在成员列表，不形成用户可见会话；
- Agent Reply 直接回复原消息；
- Invocation 状态显示在触发消息下；
- Invocation 完成不等于 Issue 完成；
- Human 已读不等于 Issue 完成。

---



## 3. 调整后的对象模型

```text
My Claw / 我的空间
├── Inbox
├── 我的工作与项目
├── 个人 Chat
│   └── Personal Conversations
└── Projects
    └── Project
        ├── Project Members
        ├── Project Agents
        ├── Project Shared Tools
        ├── Project Work Sources
        ├── Project Files
        ├── Issue Board
        │   └── Issues
        └── Conversations
            └── Conversation
                ├── Conversation Members
                ├── Default Artifact Scope
                ├── Conversation Agents
                ├── Conversation Tools
                ├── Messages
                ├── Invocations
                └── Conversation Files / Artifacts
```



### 3.1 Project 的职责

Project 负责汇聚长期协作事实：

- 项目目标与说明；
- Project 成员；
- Project 可用 Agent；
- Project 共享工具；
- GitHub Repository 和 Local Directory；
- 多个 Conversation；
- 唯一事项看板；
- Project 公开文件；
- Artifact 与数据血缘。

Project 不直接承载一条固定的顶层聊天记录。

### 3.2 Conversation 的职责

Conversation 是 Project 下一个相对聚焦的任务协作空间，负责：

- Human 与 Human 对话；
- Human 与 Agent 对话；
- Agent 执行和回复；
- 明确的 Human 参与者与消息访问范围；
- 创建时选定的默认文件归属范围；
- 当前会话 Instructions；
- 当前会话增量工具；
- 文件输入与输出；
- 产生、关联和推进 Issue。



### 3.3 Issue 的职责

Issue 是 Project 级长期工作台账：

- 最多归属于一个主 Conversation；
- 可以暂时不绑定 Conversation，但开始会话协作后只能选择一个主 Conversation；
- 汇总负责人、状态、验收标准、关键进展和交付物；
- 对 Project 全体成员可见；
- 不复制无权访问的来源会话原始内容。



### 3.4 Invocation 与 Session

一个 Agent 在不同 Conversation 中不得默认共享同一执行 Session，否则一个会话的成员消息可能泄漏到另一个 Conversation。

本次调整后：

```text
Conversation × Agent = Conversation-Agent Session
Conversation-Agent Session 1:N Invocation
```

规则：

- 同一个 Agent 在同一个 Conversation 内持续续接；
- 同一个 Agent 在两个 Conversation 中使用两套 Session；
- 同一 Conversation-Agent Session 的 Invocation 串行；
- Issue 不决定 Session 路由；
- Issue 绑定主 Conversation 后，其对话执行只使用该 Conversation-Agent Session；
- Project Instructions 和 Project 工具可以继承，但其他 Conversation 原始消息不能自动注入。

---



## 4. Project 页面信息架构



### 4.1 页面结构

进入 Project 后使用以下结构：

```text
Project Header
  Project 名称
  Human / Agent 数量
  Project 工具
  Project 文件
  新建会话
  Project 设置

Project 主导航
  会话
  事项

会话视图
  会话列表
  当前会话消息区
  当前会话工具 / 文件 / 设置入口

事项视图
  Project 唯一事项看板
```



### 4.2 默认进入规则

打开 `/my-claw/projects/[projectId]` 时：

1. 如果用户在该 Project 有最近访问的可见 Conversation，恢复该 Conversation；
2. 否则打开“会话”视图并展示可见会话列表；
3. 如果没有任何可见 Conversation，展示创建会话空状态；
4. 不先增加 Project 概览页；
5. 不要求用户再经过第二个 Project 选择器。



### 4.3 会话列表

会话列表只显示当前用户可见的 Conversation。

每项显示：

- 会话名称；
- 最近一条可见消息摘要；
- 最近更新时间；
- 未读数；
- 当前运行中的 Agent 状态；
- 与当前用户相关的 Issue 数量；
- 会话成员头像，最多显示 3 个。

排序：

1. 置顶；
2. 有未读或正在运行；
3. 最近更新时间。

会话列表不展示“公开/受限”标签，也不把文件归属范围渲染成会话状态。文件默认归属只在创建表单和 Conversation Settings 中展示。

---



## 5. 创建会话



### 5.1 入口

Project Header 新增主按钮：

```text
[ + 新建会话 ]
```

点击后打开统一创建表单：

```text
会话名称              必填
会话说明              可选
Human 参与者          必填，至少包含创建者
参与 Agent            可选
Conversation Tools    可选

文件归属               必填
  ○ 文件仅属于当前会话
  ● 文件公开到 Project（默认）
```

文件归属说明必须直接显示在单选项下：

```text
文件公开到 Project（默认）
该会话产生的文件自动进入 Project 文件区，成为 Project 公开文件。
会话消息仍然只对会话成员可见。

文件仅属于当前会话
文件进入当前会话文件区，不进入 Project 文件区。
```



### 5.2 成员规则

成员选择规则：

- 只能选择 Project Human Members；
- 个人 Agent 只有在其所属 Human 已加入会话时才可加入；
- 平台已发布 Agent 可以从当前 Project 已添加的 Agent 中选择；
- 未加入当前会话的 Human 和 Agent 不得读取会话消息；
- 会话产生的文件落入 Project 文件区还是当前 Conversation 文件区，由文件归属设置决定，而不是由会话自身类型决定。



### 5.3 创建结果

创建成功后：

- 自动进入新会话；
- 只有会话成员能看到会话及其消息；
- 未修改单选项时，`defaultArtifactScope = "project"`；
- 选择“文件仅属于当前会话”时，`defaultArtifactScope = "conversation"`；
- 继承 Project Instructions；
- 继承 Project Shared Tools；
- Conversation Tools 仅在当前会话中增加。



### 5.4 创建后的文件归属

第一期规则：

- 默认文件归属是新 Artifact 的默认值，不是会话状态；
- 修改默认文件归属只影响之后新产生的 Artifact；
- 历史 Artifact 保留自己的 `scope`，不得被静默批量改写；
- Human 可以在有权限时主动把某个“仅属于当前会话”的文件发布到 Project；
- 发布动作将文件转为 Project 文件或生成 Project 文件副本，但不修改会话消息范围；
- 第一阶段不提供将已经公开到 Project 的文件假装撤回为“仅属于当前会话”的能力。

---



## 6. 事项看板与多会话关联



### 6.1 Project 唯一事项看板

每个 Project 有且只有一个事项看板。

看板展示该 Project 全部 Conversation 产生的 Issue，不为每个 Conversation 创建独立看板。

看板对所有 Project Members 可见。

原状态列继续沿用：

```text
待澄清或审批确认
进行中
等待反馈
待验收
已完成
```

`Cancelled` 与 `Archived` 通过筛选查看。

如果原型保留“执行失败”，必须表达为 Invocation 异常提示，不得创造一个未定义的 Issue 业务状态。

### 6.2 Conversation 与 Issue 的 1:N 关系

允许：

```text
Conversation A
├── Issue 1
└── Issue 2

Conversation B
└── Issue 3

Project Board
└── Issue 4（尚未绑定主 Conversation）
```

规则：

- 从消息创建 Issue 时，自动将当前 Conversation 设为主 Conversation；
- 一个 Conversation 可以通过多个消息产生多个 Issue；
- 从 Project 看板手工创建的 Issue 可以暂时不绑定 Conversation；
- 未绑定的 Issue 开始在某个 Conversation 推进时，可以将该 Conversation 设为唯一主 Conversation；
- 已有主 Conversation 的 Issue 不得再关联第二个 Conversation；
- 其他 Conversation 可以引用该 Issue，但引用不改变主 Conversation、权限或 Agent 上下文；
- 如果工作需要在另一个 Conversation 独立推进，应新建 Issue，并用 `relatedIssueId` 表达业务关联；
- 合并 Issue 后只能保留一个主 Conversation；主 Conversation 冲突时必须由 Human 选择；
- 不允许跨 Project 绑定或引用 Issue。



### 6.3 Issue 卡片增加来源会话信息

卡片至少显示：

- Issue 标题；
- 状态；
- Human / Agent 负责人；
- 最近进展；
- 主 Conversation；
- Artifact 数；
- 更新时间；
- 是否等待当前用户。

示例：

```text
调研 Project 多会话协作模式
In Progress
若楠 · Charon
主会话：需求讨论
3 个文件 · 20 分钟前
```



### 6.4 Issue 详情增加“主会话”

Issue Drawer 增加：

```text
主会话
  需求讨论

[打开会话]
```

点击规则：

- Issue 尚未绑定会话：显示“尚未绑定会话”和“选择主会话”；
- 用户有权访问主会话：打开会话并定位证据消息；
- 用户不是主会话成员：禁止跳转，仅显示“无权访问主会话”；
- 对无权限用户不得展示来源会话名称、消息摘要或参与成员，Mock 应直接使用通用文案；
- 不得通过 Issue Drawer 暴露无权访问的来源消息、来源 Conversation Files 或 Agent 执行详情。



### 6.5 会话过程与 Project Issue 的公开边界

这是本次设计的关键边界：

```text
会话原始过程 = 会话成员可见
Issue 项目级事实 = Project 全员可见
```

项目级可见内容：

- Issue 标题；
- Issue Brief；
- 状态；
- Human / Agent 负责人；
- 验收标准；
- 项目级公开进展；
- `scope = "project"` 的 Artifact。

继续留在 Conversation 作用域的内容：

- 来源消息原文；
- 来源会话完整摘要；
- `scope = "conversation"` 的文件；
- Agent 在来源会话中的运行上下文；

事项管家在提出 Issue 创建或更新建议时，必须生成适合 Project 范围公开的 Issue Brief，不能直接复制会话消息原文。

### 6.6 Conversation 内的 Issue 入口

当前 Conversation 顶部或右侧增加“本会话事项”入口：

```text
本会话事项 · 3
```

该入口只是 Project Issue 数据的过滤视图，不创建第二套 Issue 数据。

支持：

- 查看主 Conversation 为当前 Conversation 的 Issue；
- 从当前会话新建 Issue；
- 将尚未绑定会话的 Issue 绑定到当前 Conversation；
- 在当前消息中引用已有主 Conversation 的 Issue，但不改变归属；
- 打开 Project 全部事项；
- 从 Issue 跳转到有权访问的唯一主 Conversation。

---



## 7. 两级工具配置



### 7.1 Project 工具

入口保持在：

```text
Project Settings
→ 共享工具
```

Project Shared Tools：

- 对 Project 下全部 Conversation 生效；
- 对符合兼容性和权限要求的 Agent 生效；
- 不自动覆盖 Agent 默认 Capability；
- 添加、移除、授权和失效规则沿用原需求。



### 7.2 Conversation 工具

在 Conversation Header 增加：

```text
工具 · 6
```

点击打开 Conversation Settings Drawer：

```text
继承自 Project · 4
  GitHub MCP
  网页检索
  数据分析工作流
  审批动作

仅当前会话 · 2
  文献检索插件
  科研绘图工作流

[添加会话工具]
```

规则：

- 继承项只读展示，不能在 Conversation 中删除；
- Conversation 可以添加当前 Project 有权使用的已发布工具；
- Conversation 增量工具不会出现在其他 Conversation；
- Conversation 删除增量工具后，只影响后续 Invocation；
- 已完成 Invocation 保留工具使用审计；
- 如果希望移除继承工具，必须回到 Project Settings 操作；
- 第一阶段不实现 Conversation 对 Project 工具的显式屏蔽。



### 7.3 工具来源标识

Agent 有效能力和 Execution Detail 中按来源分组：

```text
Agent 默认能力
Project 继承工具
Conversation 工具
```

同一个工具重复出现时只展示一次，并在详情中显示来源：

```text
GitHub MCP
来源：Agent 默认能力、Project 继承
实际版本：2.3.1
```



### 7.4 权限和 Credential

- Project 与 Conversation Binding 都只保存 `credentialRef`；
- 不得在 Mock 或页面中出现真实 Credential；
- Conversation 不得通过重新绑定绕过 Project 或用户授权；
- 无权限、未授权、失效和不兼容状态必须有对应 Mock；
- 工具继承不会改变文件的 `project` / `conversation` 归属；
- 工具调用只获得 Project 文件与当前 Conversation 文件的运行时挂载。

---



## 8. 文件、Artifact 与血缘的原型表达



### 8.1 文件按产品作用域归属，不按人聚合

```text
Project
├── Project Files
│   └── scope = "project"
└── Conversations
    ├── Conversation A Files
    │   └── scope = "conversation"
    └── Conversation B Files
        └── scope = "conversation"
```

第一阶段不存在文件级数据权限，也不维护：

- `visibleUserIds`；
- `allowedMemberIds`；
- “当前用户可见文件”的动态聚合；
- 按 Human 身份拼装 Project 文件列表；
- 同一个文件对不同 Project 成员显示不同结果的文件 ACL。

文件最终只能落在两个产品作用域之一：

1. Project 文件：进入 Project 文件区，是 Project 公开文件；
2. Conversation 文件：进入产生该文件的 Conversation 文件区，是该会话的工作文件。

Project 文件区只查询：

```text
artifact.scope === "project"
```

Conversation 文件区只查询：

```text
artifact.scope === "conversation"
&& artifact.sourceConversationId === currentConversationId
```

页面入口：

- Project Header 的“文件”打开 Project 文件区；
- Conversation Header 的“文件”打开当前 Conversation 文件区；
- Project 文件可以在会话消息中被引用，但不会因此复制到 Conversation 文件区；
- Conversation 文件发布到 Project 前，不出现在 Project 文件区；
- 同一个 Artifact 不得同时存在于 `projectFileIds` 和 `conversationFileIds`。

Project 文件区不得把各 Conversation 文件按当前用户聚合进来。Conversation 文件也不得因为某个 Human 是 Project Member 就自动出现在 Project 文件区。

文件列表可展示：

- 文件名；
- 创建者；
- 来源会话；
- 关联 Issue；
- 创建时间；
- 来源与去向入口；
- 归属标记：Project / 当前会话。

### 8.2 创建会话时的默认文件归属

```text
会话默认选择“文件公开到 Project”
→ artifact.scope = "project"
→ 展示在 Project 文件区

会话选择“文件仅属于当前会话”
→ artifact.scope = "conversation"
→ 展示在当前 Conversation 文件区
```

规则：

- 该设置决定会话中新上传和新生成文件的默认落点；
- 每个 Artifact 自己保存 `scope`，不依赖用户身份计算；
- Project 公开是产品作用域，不是一组 Human ACL；
- Conversation 归属也是产品作用域，不生成文件级成员列表；
- Human 主动“发布到 Project”时，可以将 Conversation 文件转为 Project 文件，或生成一个新的 Project 文件副本；
- Agent、事项管家和自动摘要不得自行把 Conversation 文件发布到 Project；
- 变更会话默认归属只影响后续新文件，不追溯修改历史文件。

### 8.3 Agent 文件挂载

Mock Execution Detail 必须能表达：

```text
本次可访问文件
├── Project Files
└── Current Conversation Files
```

规则：

- Agent 在当前 Conversation 运行时挂载 Project 文件与当前 Conversation 文件；
- 不挂载其他 Conversation 文件；
- 文件挂载按作用域与当前 `conversationId` 计算，不按 Human 文件权限计算；
- 当前消息引用的文件必须已经属于 Project 或当前 Conversation；
- 不得表达成“Agent 可以读取其他 Conversation 文件”。

### 8.4 数据血缘

第一期用 Mock 表达：

```text
输入 Artifact[]
→ Transformation
→ 输出 Artifact[]
```

至少提供一个科研示例：

```text
原始实验数据.csv
→ Python 数据清洗
→ 清洗后数据.parquet
→ 统计分析
→ 差异分析结果.csv
→ 报告生成
→ 阶段研究报告.docx
```

Issue Drawer 展示局部链路，文件详情展示来源与去向。

普通用户界面不展示 `runId`、`transformationId` 或 `artifactId`。

---



## 9. Invocation 上下文

每次 Agent 执行按以下层次组装：

```text
Agent Identity / Default Capability
Project Instructions
Conversation Instructions
Effective Tool Manifest
Project Work Source Manifest
Conversation-Agent Session Summary
Recent Messages In Current Conversation
Current Trigger Message
Explicit Message / File References
Related Issue Brief
On-demand Retrieved Content
```

不得自动注入：

- 其他 Conversation 的完整消息；
- 其他 Conversation 的 Session Summary；
- 其他 Conversation Files；
- Project 全部文件正文；
- Project 全部 Issue；
- 其他 Agent 私有 Session；
- 其他 Project 的消息和资源。

一个 Issue 只使用其主 Conversation 的会话上下文。其他 Conversation 即使引用该 Issue，也不会把消息自动注入主 Conversation-Agent Session。跨会话只能通过以下方式传递明确内容：

- Project 级 Issue Brief；
- Human 明确引用；
- 当前作用域内的按需检索；
- Project Artifact。

---



## 10. 核心 Mock 数据模型

Coding Agent 必须同步修改 Mock 数据，不得只在组件中写死。

```ts
export interface MyClawProject {
  id: string;
  name: string;
  description: string;
  instructions: string;
  status: "active" | "archived";
  ownerUserId: string;
  humanMemberIds: string[];
  agentBindingIds: string[];
  conversationIds: string[];
  issueIds: string[];
  sharedToolBindingIds: string[];
  workSourceIds: string[];
  projectFileIds: string[];
  createdAt: string;
  updatedAt: string;
  originWorkspaceId?: string;
}

export interface ProjectConversation {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  humanMemberIds: string[];
  agentBindingIds: string[];
  conversationToolBindingIds: string[];
  messageIds: string[];
  issueIds: string[];
  conversationFileIds: string[];
  instructions?: string;
  defaultArtifactScope: "project" | "conversation";
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface ProjectIssue {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  status: ProjectIssueStatus;
  /**
   * 最多一个主 Conversation。
   * 从 Project 看板手工创建且尚未开始会话协作时可以为空。
   */
  conversationId?: string;
  sourceMessageId?: string;
  relatedMessageIds: string[];
  referenceIds: string[];
  humanAssigneeIds: string[];
  agentAssigneeIds: string[];
  invocationIds: string[];
  artifactIds: string[];
  acceptanceCriteria: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IssueReference {
  id: string;
  projectId: string;
  issueId: string;
  conversationId: string;
  messageId: string;
  createdByUserId: string;
  createdAt: string;
}

export interface ProjectSharedToolBinding {
  id: string;
  projectId: string;
  publishedResourceVersionId: string;
  permission: "read" | "execute" | "write";
  credentialRef?: string;
  status:
    | "active"
    | "authorization_required"
    | "degraded"
    | "revoked";
}

export interface ConversationToolBinding {
  id: string;
  projectId: string;
  conversationId: string;
  publishedResourceVersionId: string;
  permission: "read" | "execute" | "write";
  credentialRef?: string;
  status:
    | "active"
    | "authorization_required"
    | "degraded"
    | "revoked";
  addedByUserId: string;
  createdAt: string;
}

export interface ConversationAgentSession {
  id: string;
  projectId: string;
  conversationId: string;
  actorId: string;
  status: "active" | "paused" | "expired" | "error";
  invocationIds: string[];
  queuedInvocationIds: string[];
  lastSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface Artifact {
  id: string;
  projectId: string;
  /**
   * 文件由会话产生时记录来源；直接添加到 Project 时可以为空。
   */
  sourceConversationId?: string;
  issueIds: string[];
  name: string;
  scope: "project" | "conversation";
  createdByType: "human" | "agent" | "tool";
  createdById: string;
  sourceArtifactIds: string[];
  producedByTransformationId?: string;
  createdAt: string;
}

export interface Transformation {
  id: string;
  projectId: string;
  conversationId: string;
  issueIds: string[];
  executorType: "human" | "agent" | "tool";
  executorId: string;
  operationLabel: string;
  inputArtifactIds: string[];
  outputArtifactIds: string[];
  createdAt: string;
  runId?: string;
}
```

关键约束：

- `MyClawProject` 不再使用单个 `threadId` 表示唯一顶层会话；
- `ProjectConversation.projectId` 必填；
- `ProjectConversation.issueIds` 只记录以当前 Conversation 为主 Conversation 的 Issue；
- `ProjectIssue.conversationId` 最多保存一个主 Conversation；
- `ProjectIssue.sourceMessageId` 与 `relatedMessageIds` 只记录主 Conversation 内的消息；
- `IssueReference` 只记录其他会话对 Issue 的引用，不形成第二个归属关系；
- `MyClawProject.projectFileIds` 只记录 `scope = "project"` 的文件；
- `ProjectConversation.conversationFileIds` 只记录当前会话中 `scope = "conversation"` 的文件；
- `Artifact.scope` 是产品归属，不得增加逐人可见字段；
- `Artifact.sourceConversationId` 只记录来源，不决定它展示在 Project 文件区还是 Conversation 文件区；
- `Artifact.sourceArtifactIds` 必须是数组；
- `Transformation.inputArtifactIds` 和 `outputArtifactIds` 必须是数组；
- Project、Conversation、Issue、Artifact 的关系必须由 Mock Provider 维护；
- 切换页面后状态必须仍来自同一个 Mock 数据源。

---



## 11. Provider Actions

至少支持以下原型 Actions：

```ts
interface ProjectConversationActions {
  openProject(projectId: string): void;
  openConversation(projectId: string, conversationId: string): void;

  createConversation(payload: {
    projectId: string;
    name: string;
    description?: string;
    humanMemberIds: string[];
    agentBindingIds: string[];
    conversationToolResourceIds: string[];
    defaultArtifactScope: "project" | "conversation";
    instructions?: string;
  }): string;

  updateConversation(
    conversationId: string,
    patch: Partial<Pick<
      ProjectConversation,
      | "name"
      | "description"
      | "humanMemberIds"
      | "agentBindingIds"
      | "defaultArtifactScope"
      | "instructions"
    >>
  ): void;

  archiveConversation(conversationId: string): void;

  publishArtifactToProject(artifactId: string): void;

  sendProjectMessage(payload: {
    projectId: string;
    conversationId: string;
    content: string;
    mentionedHumanIds: string[];
    mentionedActorIds: string[];
    quotedMessageIds: string[];
    fileIds: string[];
  }): void;

  createIssue(payload: {
    projectId: string;
    conversationId?: string;
    sourceMessageId?: string;
    title: string;
    humanAssigneeIds: string[];
    agentAssigneeIds: string[];
  }): void;

  bindIssueToConversation(
    issueId: string,
    conversationId: string
  ): void;

  unbindIssueFromConversation(
    issueId: string
  ): void;

  referenceIssueFromMessage(
    issueId: string,
    conversationId: string,
    messageId: string
  ): void;

  bindConversationTool(payload: {
    projectId: string;
    conversationId: string;
    publishedResourceVersionId: string;
    permission: "read" | "execute" | "write";
    credentialRef?: string;
  }): void;

  unbindConversationTool(bindingId: string): void;
}
```

行为约束：

- `sendProjectMessage` 必须包含 `conversationId`；
- 不得继续把消息只写入 `project.threadId`；
- 创建会话时，Provider 校验所有 Human 参与者属于 Project；
- 未显式选择文件归属时，Provider 使用 `defaultArtifactScope = "project"`；
- 新 Artifact 继承当前 Conversation 的默认文件归属，但每个 Artifact 必须保存自己的 `scope`；
- `scope = "project"` 时写入 `project.projectFileIds`，不得写入 `conversation.conversationFileIds`；
- `scope = "conversation"` 时写入来源 Conversation 的 `conversationFileIds`，不得写入 `project.projectFileIds`；
- `publishArtifactToProject` 必须移动归属或创建 Project 文件副本，并同步两个文件 ID 集合；
- 从会话创建 Issue 时，同时写入唯一 `conversationId` 和 Conversation 的 `issueIds`；
- 从看板创建 Issue 时允许 `conversationId` 为空；
- `bindIssueToConversation` 只允许对尚未绑定的 Issue 执行；
- 其他会话只能创建 `IssueReference`，不能改写 Issue 的主 Conversation；
- 解除绑定或删除引用不得删除 Conversation、Message 或 Issue；
- 非会话成员打开 Conversation 时返回权限错误状态；
- 会话级工具不能写进 Project Binding 集合。

---



## 12. 必备 Mock 场景



### 12.1 Project 与 Conversation

使用同一个 Project：

```text
Project：Claw 组织协作机制
Human：若楠、林晓、李涛
Agent：若楠的 Claw、Charon、需求分析多智能体
```

至少提供 4 个 Conversation：

1. `方案二需求讨论`
   - 成员：若楠、林晓、李涛；
   - 默认文件归属：文件公开到 Project；
  - 有 3 个 Issue；
  - 有 Project 可见文件。
2. `原型技术验证`
  - 成员：若楠、李涛；
  - Agent：若楠的 Claw；
   - 默认文件归属：文件仅属于当前会话；
  - 有 2 个 Issue；
  - 有仅属于当前会话的文件。
3. `科研数据血缘`
  - 成员：若楠、林晓；
   - 默认文件归属：文件公开到 Project；
  - 有一组输入、Transformation 和输出 Artifact；
  - 有自己的 Issue；
  - 在一条消息中引用 `原型技术验证` 的 Issue，但不改变该 Issue 的主 Conversation。
4. `供应商评估`
  - 有独立的会话成员集合；
   - 默认文件归属：文件公开到 Project；
  - 当前演示用户不是成员；
  - 不出现在当前用户会话列表；
  - 其 Issue 仍出现在 Project 看板，但来源入口显示无权访问；
   - 其 `scope = "project"` 文件出现在 Project 文件区，但不能反向读取来源消息。



### 12.2 Conversation 1:N Issue

至少提供：

- 一个 Conversation 关联 3 个 Issue；
- 一个从 Project 看板创建、暂未绑定 Conversation 的 Issue；
- 一个后来绑定到唯一主 Conversation 的 Issue；
- 一个在其他 Conversation 中被引用、但主 Conversation 不变的 Issue；
- 一个来自当前用户未参与 Conversation 的 Project 级 Issue；
- 一个没有 Agent Invocation、由 Human 手工创建的 Issue；
- 一个含多轮返工的 Issue。



### 12.3 两级工具

Project Tools：

- GitHub MCP：active；
- 网页检索插件：active；
- 数据分析工作流：active；
- 审批动作：authorization_required。

Conversation Tools：

- `方案二需求讨论` 增加 PRD 写作工作流；
- `原型技术验证` 增加本地目录工具；
- `科研数据血缘` 增加科研绘图工作流；
- 至少一个工具与 Project 工具重复，用于验证去重；
- 至少一个工具对某 Agent 不兼容；
- 至少一个工具 revoked。



### 12.4 文件与血缘

至少提供：

- 默认归属为 Project 的会话产生的 Project 文件；
- 默认归属为 Conversation 的会话产生的 Conversation 文件；
- Human 将仅会话成员文件主动发布后形成的新 Project 可见 Artifact；
- 外部上传且来源未记录的文件；
- 一个多输入、多输出 Transformation；
- 文件详情的上游和下游；
- Issue Drawer 的局部血缘。

---



## 13. 页面与组件影响

Coding Agent 应优先复用当前方案二组件，只新增必要层级。

建议新增或重构：

```text
components/my-claw/project-conversation/
  project-conversation-list.tsx
  project-conversation-list-item.tsx
  create-project-conversation-dialog.tsx
  conversation-settings-drawer.tsx
  conversation-members-section.tsx

components/my-claw/project-tools/
  conversation-tools-section.tsx
  add-conversation-tool-dialog.tsx
  effective-tool-source-list.tsx

components/my-claw/project-issues/
  issue-primary-conversation.tsx
  conversation-issues-filter.tsx

components/my-claw/project-files/
  project-files-panel.tsx
  conversation-files-panel.tsx
  artifact-lineage-section.tsx
```

建议 Mock 目录：

```text
lib/mock/my-claw/project-conversations/
lib/mock/my-claw/project-issues/
lib/mock/my-claw/project-tools/
lib/mock/my-claw/project-files/
lib/mock/my-claw/lineage/
```

路由建议：

```text
/my-claw/projects/[projectId]
/my-claw/projects/[projectId]/conversations/[conversationId]
/my-claw/projects/[projectId]?view=issues
/my-claw/projects/[projectId]?view=files
```

如果当前代码使用 query 切换 Conversation，可以暂时保留，但 URL 必须同时包含 `projectId` 和 `conversationId`，并支持刷新恢复。

---



## 14. 关键交互要求



### 14.1 Project 内切换 Conversation

- 不刷新整个 My Claw Shell；
- 保留其他 Conversation 的输入草稿；
- 恢复每个 Conversation 的滚动位置；
- 当前 Conversation 的 Header、成员、工具和文件状态同步切换；
- 不把上一 Conversation 的消息短暂闪现在新 Conversation。



### 14.2 从消息创建或关联 Issue

消息菜单：

```text
创建事项
绑定未归属事项
引用已有事项
```

规则：

- 只搜索当前 Project Issue；
- “绑定未归属事项”只显示尚未绑定主 Conversation 的 Issue；
- 确认绑定后，当前 Conversation 成为唯一主 Conversation；
- “引用已有事项”可以选择已有主 Conversation 的 Issue；
- 引用只生成 `IssueReference`，不改变 Issue 归属；
- 前端显示轻量成功提示，并允许撤销。



### 14.3 从 Issue 返回来源

- Issue 有主 Conversation 时直接打开该唯一来源；
- Issue 尚未绑定 Conversation 时显示“尚未绑定会话”；
- 当前用户不是主 Conversation 成员时显示来源不可访问；
- 不得为了完成跳转临时扩大用户权限。



### 14.4 新建会话后的反馈

- 新会话立即出现在列表并被选中；
- 显示会话成员数量；
- 显示默认文件归属；
- 未手动选择时显示“新文件默认公开到 Project”；
- 选择会话归属时显示“新文件默认进入当前会话”；
- 创建失败时保留表单输入；
- 重复提交只创建一个 Conversation。

---



## 15. 权限不变量

必须满足：

- Project Member 才能访问 Project；
- Conversation 消息只对该 Conversation 的成员可见；
- 会话 Human 必须是 Project Human Member；
- 个人 Agent 的所属 Human 不在当前会话时，该个人 Agent 不得加入或继续访问；
- 平台 Agent 必须已加入当前 Project，才可加入 Conversation；
- Project 事项看板对 Project 全员可见；
- 文件不建立逐人数据权限或文件级 ACL；
- `scope = "project"` 的文件只进入 Project 文件区；
- `scope = "conversation"` 的文件只进入来源 Conversation 文件区；
- Project 文件区不得按当前用户聚合 Conversation 文件；
- Issue 关联不得改变 Artifact 的归属作用域；
- Issue Manager 可以处理会话事件，但输出到项目看板的内容必须是项目级 Brief，不能复制来源消息原文；
- Conversation 工具不得绕过 Project、用户、Agent 或 Credential 权限；
- 一个 Conversation-Agent Session 不得读取另一个 Conversation-Agent Session。

---



## 16. 验收标准



### 对象关系

- [ ] 一个 Project 可以创建并展示多个 Conversation。
- [ ] Project 不再使用单个顶层 Conversation 表达全部聊天。
- [ ] 每个 Project 只有一个事项看板。
- [ ] 一个 Conversation 可以产生多个 Issue。
- [ ] 一个 Issue 最多绑定一个主 Conversation。
- [ ] 从看板创建的 Issue 可以暂时不绑定 Conversation。
- [ ] 其他 Conversation 只能引用 Issue，不能形成第二个归属。
- [ ] 不允许跨 Project 绑定或引用 Issue。



### 会话

- [ ] Project Header 有“新建会话”按钮。
- [ ] 创建会话时必须选择 Human 参与者。
- [ ] Conversation 消息只对会话成员可见。
- [ ] 创建会话时可以选择“文件仅属于当前会话”或“文件公开到 Project”。
- [ ] 文件默认归属是 Project。
- [ ] 文件归属不得被渲染成会话自身的公开/受限状态。
- [ ] 非成员看不到不属于自己的会话列表项和消息。
- [ ] Project 根路由能恢复最近访问会话。
- [ ] 空 Project 有清晰的创建会话空状态。



### 事项

- [ ] 所有 Conversation 的 Issue 汇总在同一 Project 看板。
- [ ] Issue 卡片显示唯一主 Conversation，未绑定时显示“尚未绑定”。
- [ ] Issue Drawer 显示唯一主 Conversation。
- [ ] 有权限时可以跳回来源消息。
- [ ] 无权限时显示来源不可访问，不泄漏原文。
- [ ] Conversation 内可以查看“本会话事项”过滤结果。



### 工具

- [ ] Project Settings 可以配置 Project Shared Tools。
- [ ] Conversation Settings 可以配置 Conversation Tools。
- [ ] Conversation 自动继承 Project Tools。
- [ ] Conversation 增量工具不影响其他 Conversation。
- [ ] 重复工具正确去重。
- [ ] 权限冲突取更严格权限。
- [ ] Execution Detail 显示工具来源层级。



### 文件与血缘

- [ ] Project 文件区只展示 `scope = "project"` 的文件。
- [ ] Conversation 文件区只展示 `scope = "conversation"` 且来源为当前 Conversation 的文件。
- [ ] 不存在按 Human 聚合的文件列表。
- [ ] 不存在文件级 `visibleUserIds` 或 `allowedMemberIds`。
- [ ] 创建会话时默认选择“文件公开到 Project”。
- [ ] 选择“文件仅属于当前会话”后，新文件进入当前 Conversation 文件区。
- [ ] 修改会话默认文件归属不追溯修改历史 Artifact。
- [ ] Agent 不获得完整 Project 根目录。
- [ ] 文件详情展示来源、去向和关联 Issue。
- [ ] Issue Drawer 展示局部数据与产物流转。
- [ ] 普通用户界面不显示内部 Run ID。



### Session 与上下文

- [ ] Session 粒度为 Conversation × Agent。
- [ ] 同一 Conversation-Agent Invocation 串行。
- [ ] 两个 Conversation 不共享原始 Session 消息。
- [ ] 跨会话 Issue 引用只通过 Brief、显式引用和当前作用域检索共享上下文。
- [ ] 一个会话的成员消息不会进入其他 Conversation。



### 原型质量

- [ ] 所有关键入口可点击。
- [ ] 新建会话流程可完整演示。
- [ ] 会话切换、事项跳转、工具配置和文件详情可交互。
- [ ] Mock 状态在切换页面后保持一致。
- [ ] 目标文件 ESLint 通过。
- [ ] TypeScript 编译通过，或明确记录仅有的基线错误。
- [ ] Production build 通过。
- [ ] 1280px 宽度无横向溢出。
- [ ] 个人 Chat、Inbox 和“我的工作与项目”无明显回归。

---



## 17. 必测 Demo Script

Coding Agent 完成后必须按以下顺序自测：

1. 从“我的空间”进入 `Claw 组织协作机制` Project；
2. 看到多个 Conversation，而不是直接进入唯一顶层群聊；
3. 创建一个会话，选择若楠和李涛为成员，不修改默认文件归属；
4. 在该会话上传文件，确认文件进入 Project 文件区；
5. 创建第二个会话，将文件归属改为“文件仅属于当前会话”；
6. 上传文件，确认它只出现在第二个 Conversation 文件区，不出现在 Project 文件区；
7. 在第一个会话从一条消息创建两个 Issue；
8. 在第二个 Conversation 中引用其中一个 Issue，确认其主 Conversation 不变；
9. 打开 Project 事项看板，确认所有会话的 Issue 汇总展示；
10. 从 Project 看板创建一个暂未绑定会话的 Issue，再将其绑定到唯一主 Conversation；
11. 从非主会话成员视角打开该 Issue，确认能看到 Issue，但不能读取无权访问的来源；
12. 在 Project Settings 添加 Project 工具；
13. 在某个 Conversation 添加会话工具；
14. 确认该 Conversation 的有效工具包含 Agent 默认、Project 继承和 Conversation 增量三组；
15. 切换到其他 Conversation，确认看不到前一个 Conversation 的增量工具；
16. 打开科研文件详情，查看输入、处理过程和输出关系；
17. 刷新页面，确认当前 Project、Conversation 和 Mock 变更仍能恢复。

---



## 18. 非目标

本次不实现：

- 使用端 Workspace；
- 每个 Conversation 一套独立事项看板；
- 一个 Issue 同时归属于多个 Conversation；
- 跨 Project Issue；
- 复杂的会话组织角色权限；
- 用公开/受限状态定义 Conversation；
- 对历史 Artifact 进行批量归属迁移；
- Conversation 层屏蔽继承的 Project 工具；
- 真实 Credential；
- 文件级数据权限与逐人 ACL；
- 真实 Issue Manager Runtime；
- 真实 Agent Runtime；
- 全量文件版本管理；
- 自动判断中间结果或最终交付物；
- 全 Project 复杂血缘大图；
- 甘特图、Sprint、工时和复杂 Issue 依赖。

---



## 19. 最终产品定义

> My Claw 使用端只有一个“我的空间”。Project 是长期协作与事实汇聚边界，一个 Project 包含多个有明确参与者的 Conversation，并拥有一个面向全体 Project 成员的事项看板。创建 Conversation 时，创建人选择“文件仅属于当前会话”或“文件公开到 Project”，默认选择公开到 Project；这定义的是新文件最终落入 Project 文件区还是当前 Conversation 文件区，不是 Conversation 自身的公开或受限状态，也不是逐人数据权限。Conversation 是具体任务的主要对话与执行空间，一个 Conversation 可以产生多个 Issue，一个 Issue 最多归属于一个主 Conversation；其他 Conversation 只能引用该 Issue，不改变归属和 Agent 上下文。Project 工具向 Conversation 继承，Conversation 可以增加本会话专属工具，Agent 默认能力仍跟随 Agent。Agent 在会话内获得 Project 文件和当前 Conversation 文件，不挂载其他 Conversation 文件。事项看板汇总 Project 全部工作的结构化事实，但不会泄漏无权访问的来源会话原始内容。

# 工作流运行引擎实现文档

## 一、代码库检查结果

### 1. 运行按钮入口
- **文件**: `components/workflow/workflow-editor.tsx`
- **位置**: 第285-288行
- **原状态**: 只有UI按钮，点击无实际功能
- **修改**: 已连接 `handleRun` 函数，调用 `executeWorkflow`

### 2. Workflow数据结构
- **文件**: `components/workflow/workflow-editor.tsx`
- **数据结构**:
  ```typescript
  nodes: Node[] // ReactFlow的Node类型
  edges: Edge[] // ReactFlow的Edge类型
  ```
- **节点结构**:
  ```typescript
  {
    id: string,
    type: string, // "start" | "end" | "llm" | "knowledge" | "branch" | "intent-recognize" | ...
    position: { x: number, y: number },
    data: {
      // 节点配置数据
      outputVariables?: Array<{ name: string, type: string }>,
      inputVariables?: Array<{ name: string, type: string, value?: string }>,
      conditions?: Array<{...}>, // branch节点
      intents?: Array<{...}>, // intent-recognize节点
      mockOutput?: any, // 可选的mock输出
      // ... 其他配置
    }
  }
  ```
- **边结构**:
  ```typescript
  {
    id: string,
    source: string, // 源节点ID
    target: string, // 目标节点ID
    sourceHandle?: string, // 源节点的handle ID（用于分支路由）
    targetHandle?: string, // 目标节点的handle ID
    type?: string, // "smoothstep" 等
    label?: string, // 边的标签（可用于路由匹配）
  }
  ```

### 3. Entry节点定义
- **识别方式**: `node.type === "start"`
- **位置**: `workflow-runner.ts` 中的 `isEntryNode` 函数
- **说明**: 通过节点类型判断，没有单独的 `entryNodeId` 或 `isEntry` 标记

### 4. 节点类型
- **Router节点**: `type === "branch"` (分支器)
- **Intent节点**: `type === "intent-recognize"` (意图识别)
- **其他节点类型**:
  - `start`: 开始节点
  - `end`: 结束节点
  - `llm`: 大模型节点
  - `knowledge`: 知识检索节点
  - `agent`: 智能体节点
  - `code`: 代码节点
  - `table-select`: 选表节点
  - `data-clarify`: 数据澄清节点
  - `data-query`: 数据查询节点
  - `data-visualize`: 数据可视化节点
  - `object-query`: 本体对象节点

### 5. Mock配置
- **当前状态**: 节点数据中没有预设的 `mockOutput` 字段
- **实现策略**: 
  - 优先读取 `node.data.mockOutput`（如果存在）
  - 否则根据节点类型生成默认Mock输出
  - 所有Mock输出都是确定性的，保证每次运行结果一致

## 二、实现文件列表

### 新增文件
1. **`components/workflow/workflow-runner.ts`**
   - 运行引擎核心逻辑
   - 包含类型定义、执行函数、Mock输出生成

2. **`components/workflow/workflow-result-panel.tsx`**
   - 运行结果展示面板
   - 显示节点执行顺序、输入输出、最终结果

### 修改文件
1. **`components/workflow/workflow-editor.tsx`**
   - 添加运行按钮点击处理
   - 集成运行结果面板
   - 调整布局以支持结果面板显示

## 三、核心实现逻辑

### 1. Router/Intent节点识别
- **Router节点**: `type === "branch"`
- **Intent节点**: `type === "intent-recognize"`
- **识别函数**: `isRouterNode(node)` 在 `workflow-runner.ts` 中

### 2. 路由激活逻辑
- **Branch节点**:
  - 输出包含 `routeKey` 字段（如 `"condition-0"`, `"else"`）
  - 通过匹配 `edge.sourceHandle` 与 `routeKey` 来激活对应边
  - 默认走第一个条件分支，如果没有条件则走else分支

- **Intent节点**:
  - 输出包含 `routeKey` 字段（如 `"intent-0"`, `"other"`）
  - 通过匹配 `edge.sourceHandle` 与 `routeKey` 来激活对应边
  - 默认识别为第一个意图，如果没有配置则走"其他意图"分支

### 3. Fan-out支持
- 普通节点的所有出边都会被激活
- 每个激活的边都会向下游节点传递输出
- 下游节点的输入会合并所有上游节点的输出（格式：`{ upstreamNodeId: output }`）

### 4. FinalOutput汇总规则
- **优先级1**: 收集所有终端节点（`type === "end"` 或没有出边的节点）的输出
- **格式**: `{ terminalNodeId: output }` 的对象形式
- **优先级2**: 如果没有终端节点，使用最后一个执行节点的输出
- **格式**: `{ lastNodeId: output }`

### 5. Mock输出策略
- **优先级1**: `node.data.mockOutput`（如果存在）
  - 支持对象、字符串、函数（函数会接收node参数）
- **优先级2**: 根据节点类型生成默认Mock
  - 所有Mock输出都是确定性的
  - 保证每次运行结果一致

## 四、执行流程

1. **构建图结构**: 构建 `outgoingEdges` 和 `incomingEdges` 映射
2. **找到入口节点**: 查找所有 `type === "start"` 的节点
3. **初始化队列**: 将入口节点加入就绪队列
4. **执行循环**:
   - 从队列取出节点
   - 计算输入（合并所有已激活入边的上游输出）
   - 生成Mock输出
   - 记录节点结果
   - 处理Router/Intent路由，激活对应出边
   - 将满足条件（所有入边已激活）的下游节点加入队列
5. **标记跳过节点**: 未被激活的节点标记为 `skipped`
6. **汇总最终输出**: 收集终端节点输出

## 五、UI展示

- **位置**: 右侧面板（与节点配置面板共用位置）
- **内容**:
  - 运行状态（成功/失败）
  - 执行时间
  - 执行节点数
  - 警告信息
  - 最终输出（可展开JSON）
  - 节点执行顺序列表（可展开查看每个节点的输入/输出/状态）

## 六、验收标准检查

✅ **现有任意一个包含分叉的 workflow**:
1. ✅ 点击【运行】不会报错白屏 - 已实现错误处理
2. ✅ Router/Intent 节点能稳定决定分支 - 已实现路由逻辑
3. ✅ fan-out 能把输出同时传给多个下游 - 已支持
4. ✅ UI 能看到每个执行过节点的 input/output，并有 finalOutput 汇总 - 已实现结果面板

## 七、使用说明

1. 点击底部工具栏的"运行"按钮
2. 运行引擎会执行工作流并生成结果
3. 右侧会显示运行结果面板
4. 可以展开查看每个节点的详细输入输出
5. 点击结果面板中的节点可以高亮画布上的对应节点（可选功能）

## 八、扩展点

- **Mock输出自定义**: 在节点配置中添加 `mockOutput` 字段即可自定义输出
- **路由逻辑扩展**: 可以修改 `isEdgeActivated` 函数来支持更复杂的路由规则
- **并行执行**: 当前是串行执行，后续可以扩展为并行（需要处理依赖关系）

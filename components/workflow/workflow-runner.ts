/**
 * 轻量级工作流运行引擎
 * 支持分叉、一对多连线、Router/Intent节点路由
 */

import { Node, Edge } from "reactflow";

// ==================== 类型定义 ====================

export interface NodeRuntime {
  nodeId: string;
  nodeType: string;
  inputActual: any;
  outputActual: any;
  status: "success" | "skipped" | "failed" | "running";
  logs?: string[];
  startedAt?: number;
  endedAt?: number;
}

export interface FlowRuntimeResult {
  status: "success" | "failed";
  startedAt: number;
  endedAt?: number;
  nodeResults: Record<string, NodeRuntime>;
  nodeOrder: string[];
  finalOutput: any;
  warnings: string[];
}

// ==================== 辅助函数 ====================

/**
 * 判断节点是否为入口节点
 */
function isEntryNode(node: Node): boolean {
  return node.type === "start";
}

/**
 * 判断节点是否为Router/Intent节点（分支节点）
 */
function isRouterNode(node: Node): boolean {
  return node.type === "branch" || node.type === "intent-recognize";
}

/**
 * 判断节点是否为终端节点
 */
function isTerminalNode(node: Node, outgoingEdges: Record<string, Edge[]>): boolean {
  const edges = outgoingEdges[node.id] || [];
  return edges.length === 0 || node.type === "end";
}

/**
 * 获取节点的Mock输出
 */
function getMockOutput(node: Node): any {
  // 优先级1: 节点数据中的 mockOutput
  if (node.data?.mockOutput !== undefined) {
    if (typeof node.data.mockOutput === "function") {
      return node.data.mockOutput(node);
    }
    return node.data.mockOutput;
  }

  // 优先级2: 根据节点类型生成默认Mock输出
  const nodeType = node.type || "";
  
  // Start节点：根据 inputVariables 生成输出
  if (nodeType === "start") {
    const inputVariables = node.data?.inputVariables || [];
    const output: any = {};
    inputVariables.forEach((v: { name: string; type: string; description?: string }) => {
      // 根据变量类型生成默认值
      if (v.type === "string") {
        output[v.name] = v.description || `示例${v.name}`;
      } else if (v.type === "array[file]") {
        output[v.name] = [];
      } else if (v.type === "array[string]") {
        output[v.name] = [];
      } else if (v.type === "number") {
        output[v.name] = 0;
      } else if (v.type === "boolean") {
        output[v.name] = false;
      } else {
        output[v.name] = null;
      }
    });
    return output;
  }

  // Router节点（分支器）：返回路由信息
  if (nodeType === "branch") {
    const conditions = node.data?.conditions || [];
    if (conditions.length > 0) {
      // 默认走第一个条件分支
      return {
        routeKey: "condition-0",
        selectedTargets: [],
        conditionIndex: 0,
      };
    }
    // 如果没有条件，走else分支
    return {
      routeKey: "else",
      selectedTargets: [],
      conditionIndex: -1,
    };
  }

  // Intent节点（意图识别）：返回意图信息
  if (nodeType === "intent-recognize") {
    const intents = node.data?.intents || [];
    if (intents.length > 0) {
      // 默认识别为第一个意图
      return {
        classification: intents[0].name || "意图1",
        classificationId: "0",
        routeKey: "intent-0",
      };
    }
    // 如果没有配置意图，走"其他意图"分支
    return {
      classification: "其他意图",
      classificationId: "-1",
      routeKey: "other",
    };
  }

  // LLM节点：根据 outputVariables 生成输出
  if (nodeType === "llm") {
    // 如果节点有 mockOutput，优先使用
    if (node.data?.mockOutput !== undefined) {
      if (typeof node.data.mockOutput === "function") {
        return node.data.mockOutput(node);
      }
      return node.data.mockOutput;
    }
    
    // 否则根据 outputVariables 生成默认输出
    const outputVariables = node.data?.outputVariables || [];
    const output: any = {};
    outputVariables.forEach((v: { name: string; type: string }) => {
      if (v.name === "text") {
        output.text = "这是大模型生成的示例回复内容";
      } else if (v.name === "queries") {
        output.queries = { entity: "示例实体", pattern: "示例模式" };
      } else if (v.type === "string") {
        output[v.name] = `示例${v.name}`;
      } else if (v.type === "array[object]") {
        output[v.name] = [];
      } else if (v.type === "object") {
        output[v.name] = {};
      } else {
        output[v.name] = null;
      }
    });
    
    // 如果没有 outputVariables，使用默认格式
    if (Object.keys(output).length === 0) {
      return {
        text: "这是大模型生成的示例回复内容",
      };
    }
    
    return output;
  }

  // Knowledge节点
  if (nodeType === "knowledge") {
    return {
      result: [
        {
          content: "知识库检索结果1",
          title: "相关文档标题",
          url: "https://example.com/doc1",
        },
      ],
    };
  }

  // Agent节点
  if (nodeType === "agent") {
    return {
      answer: "智能体生成的回答",
      ruleIntervention: "",
    };
  }

  // Code节点
  if (nodeType === "code") {
    const outputVariables = node.data?.outputVariables || [];
    const result: any = {};
    outputVariables.forEach((v: { name: string; type: string }) => {
      result[v.name] = `mock_${v.name}`;
    });
    return result;
  }

  // 数据节点
  if (nodeType === "table-select") {
    return {
      resultSet: [],
      message: "选表完成",
    };
  }

  if (nodeType === "data-clarify") {
    return {
      resultSet: [],
    };
  }

  if (nodeType === "data-query") {
    return {
      resultSet: [],
      queryCode: "SELECT * FROM table",
      message: "查询完成",
    };
  }

  if (nodeType === "data-visualize") {
    return {
      chartContent: {
        chartType: "bar",
        chartSource: "mock_data",
      },
      message: "可视化完成",
    };
  }

  if (nodeType === "object-query") {
    // 如果节点有 mockOutput，优先使用（虽然函数开头已经检查过，但这里再检查一次确保）
    if (node.data?.mockOutput !== undefined) {
      if (typeof node.data.mockOutput === "function") {
        return node.data.mockOutput(node);
      }
      return node.data.mockOutput;
    }
    
    // 否则返回默认空数组
    return {
      objectSets: [],
    };
  }

  // MCP节点：根据 outputVariables 生成输出
  if (nodeType === "mcp") {
    // 如果节点有 mockOutput，优先使用
    if (node.data?.mockOutput !== undefined) {
      if (typeof node.data.mockOutput === "function") {
        return node.data.mockOutput(node);
      }
      return node.data.mockOutput;
    }
    
    // 否则根据 outputVariables 生成默认输出
    const outputVariables = node.data?.outputVariables || [];
    const output: any = {};
    outputVariables.forEach((v: { name: string; type: string }) => {
      if (v.type === "boolean") {
        output[v.name] = true;
      } else if (v.type === "array[string]") {
        output[v.name] = [];
      } else if (v.type === "array[object]") {
        output[v.name] = [];
      } else if (v.type === "string") {
        output[v.name] = "";
      } else if (v.type === "number") {
        output[v.name] = 0;
      } else {
        output[v.name] = null;
      }
    });
    
    // 如果没有 outputVariables，使用默认格式
    if (Object.keys(output).length === 0) {
      return {
        success: true,
        result: {},
      };
    }
    
    return output;
  }

  // End节点
  if (nodeType === "end") {
    return {
      completed: true,
    };
  }

  // 默认：返回占位输出
  return {
    status: "mock_missing",
    nodeId: node.id,
    nodeType: nodeType,
  };
}

/**
 * 判断边是否被激活（用于Router/Intent节点）
 */
function isEdgeActivated(
  edge: Edge,
  sourceNodeOutput: any,
  sourceNodeType: string
): boolean {
  // 如果不是Router/Intent节点，所有出边都激活
  if (sourceNodeType !== "branch" && sourceNodeType !== "intent-recognize") {
    return true;
  }

  // Branch节点：根据routeKey匹配
  if (sourceNodeType === "branch") {
    const routeKey = sourceNodeOutput?.routeKey;
    if (!routeKey) return false;

    // 检查edge的sourceHandle是否匹配routeKey
    if (edge.sourceHandle === routeKey) {
      return true;
    }

    // 如果edge有label/condition字段，也可以匹配
    if (edge.label && routeKey.includes(edge.label)) {
      return true;
    }

    return false;
  }

  // Intent节点：根据routeKey匹配
  if (sourceNodeType === "intent-recognize") {
    const routeKey = sourceNodeOutput?.routeKey;
    if (!routeKey) return false;

    // 检查edge的sourceHandle是否匹配routeKey
    if (edge.sourceHandle === routeKey) {
      return true;
    }

    return false;
  }

  return true;
}

// ==================== 主执行函数 ====================

/**
 * 获取节点的执行延迟时间（毫秒）
 */
function getNodeExecutionDelay(nodeType: string): number {
  // 需要调用模型的节点：延迟更长
  if (nodeType === "llm" || nodeType === "intent-recognize") {
    return 2000 + Math.random() * 1000; // 2-3秒
  }
  
  // 知识检索节点：中等延迟
  if (nodeType === "knowledge") {
    return 1000 + Math.random() * 500; // 1-1.5秒
  }
  
  // 智能体节点：可能需要调用模型
  if (nodeType === "agent") {
    return 1500 + Math.random() * 1000; // 1.5-2.5秒
  }
  
  // 数据查询节点：可能需要调用模型
  if (nodeType === "data-query") {
    return 1200 + Math.random() * 800; // 1.2-2秒
  }
  
  // 数据澄清节点：可能需要调用模型
  if (nodeType === "data-clarify") {
    return 1000 + Math.random() * 500; // 1-1.5秒
  }
  
  // 数据可视化节点：可能需要调用模型
  if (nodeType === "data-visualize") {
    return 1000 + Math.random() * 500; // 1-1.5秒
  }
  
  // 代码节点：执行代码需要时间
  if (nodeType === "code") {
    return 800 + Math.random() * 400; // 0.8-1.2秒
  }
  
  // 其他节点：短延迟
  return 300 + Math.random() * 200; // 0.3-0.5秒
}

/**
 * 执行工作流（异步，支持逐步执行）
 */
export async function executeWorkflow(
  nodes: Node[],
  edges: Edge[],
  onProgress?: (result: Partial<FlowRuntimeResult>) => void
): Promise<FlowRuntimeResult> {
  const startedAt = Date.now();
  const warnings: string[] = [];
  const nodeResults: Record<string, NodeRuntime> = {};
  const nodeOrder: string[] = [];

  try {
    // 1. 构建图结构
    const outgoingEdges: Record<string, Edge[]> = {};
    const incomingEdges: Record<string, Edge[]> = {};
    const nodeMap: Record<string, Node> = {};

    nodes.forEach((node) => {
      nodeMap[node.id] = node;
      outgoingEdges[node.id] = [];
      incomingEdges[node.id] = [];
    });

    edges.forEach((edge) => {
      if (outgoingEdges[edge.source]) {
        outgoingEdges[edge.source].push(edge);
      }
      if (incomingEdges[edge.target]) {
        incomingEdges[edge.target].push(edge);
      }
    });

    // 2. 找到入口节点
    const entryNodes = nodes.filter(isEntryNode);
    if (entryNodes.length === 0) {
      warnings.push("未找到入口节点（start节点）");
      return {
        status: "failed",
        startedAt,
        nodeResults,
        nodeOrder,
        finalOutput: null,
        warnings,
      };
    }

    // 3. 初始化执行状态
    const readyQueue: string[] = [];
    const completedNodes = new Set<string>();
    const nodeOutputs: Record<string, any> = {};
    const activatedEdges = new Set<string>();

    // 入口节点入队
    entryNodes.forEach((node) => {
      readyQueue.push(node.id);
    });

    // 4. 执行循环
    while (readyQueue.length > 0) {
      const currentNodeId = readyQueue.shift()!;
      if (completedNodes.has(currentNodeId)) {
        continue;
      }

      const currentNode = nodeMap[currentNodeId];
      if (!currentNode) {
        warnings.push(`节点 ${currentNodeId} 不存在`);
        continue;
      }

      try {
        // 4.1 计算输入
        const inputActual: any = {};
        const incoming = incomingEdges[currentNodeId] || [];
        
        incoming.forEach((edge) => {
          // 只处理已激活的边
          if (activatedEdges.has(edge.id)) {
            const sourceOutput = nodeOutputs[edge.source];
            if (sourceOutput !== undefined) {
              // 合并上游输出：使用 { upstreamNodeId: output } 格式
              inputActual[edge.source] = sourceOutput;
            }
          }
        });

        // Start节点特殊处理：输入为空对象
        if (currentNode.type === "start") {
          // Start节点的输入是系统输入，不需要从上游获取
        }

        // 4.2 标记节点为运行中
        const nodeStartedAt = Date.now();
        nodeResults[currentNodeId] = {
          nodeId: currentNodeId,
          nodeType: currentNode.type || "unknown",
          inputActual,
          outputActual: null,
          status: "running",
          logs: [`节点开始执行: ${currentNode.type || "unknown"}`],
          startedAt: nodeStartedAt,
        };
        
        // 触发进度更新
        if (onProgress) {
          onProgress({
            status: "success",
            startedAt,
            nodeResults: { ...nodeResults },
            nodeOrder: [...nodeOrder],
            finalOutput: {},
            warnings: [...warnings],
          });
        }

        // 4.3 等待执行延迟（模拟节点执行时间）
        const delay = getNodeExecutionDelay(currentNode.type || "");
        await new Promise((resolve) => setTimeout(resolve, delay));

        // 4.4 执行节点（生成Mock输出）
        const outputActual = getMockOutput(currentNode);
        const nodeEndedAt = Date.now();

        // 4.5 记录节点结果
        nodeResults[currentNodeId] = {
          nodeId: currentNodeId,
          nodeType: currentNode.type || "unknown",
          inputActual,
          outputActual,
          status: "success",
          logs: [
            `节点执行成功: ${currentNode.type || "unknown"}`,
            `执行耗时: ${((nodeEndedAt - nodeStartedAt) / 1000).toFixed(2)}s`,
          ],
          startedAt: nodeStartedAt,
          endedAt: nodeEndedAt,
        };

        nodeOrder.push(currentNodeId);
        completedNodes.add(currentNodeId);
        nodeOutputs[currentNodeId] = outputActual;
        
        // 触发进度更新
        if (onProgress) {
          onProgress({
            status: "success",
            startedAt,
            nodeResults: { ...nodeResults },
            nodeOrder: [...nodeOrder],
            finalOutput: {},
            warnings: [...warnings],
          });
        }

        // 4.4 处理Router/Intent节点的路由
        const outgoing = outgoingEdges[currentNodeId] || [];
        const activatedOutgoing: Edge[] = [];

        if (isRouterNode(currentNode)) {
          // Router/Intent节点：根据输出决定激活哪些出边
          outgoing.forEach((edge) => {
            if (isEdgeActivated(edge, outputActual, currentNode.type || "")) {
              activatedOutgoing.push(edge);
              activatedEdges.add(edge.id);
            }
          });

          // 如果没有激活任何边，记录警告
          if (activatedOutgoing.length === 0) {
            warnings.push(
              `Router/Intent节点 ${currentNodeId} 没有激活任何出边，使用默认路由`
            );
            // 默认激活第一条出边
            if (outgoing.length > 0) {
              activatedOutgoing.push(outgoing[0]);
              activatedEdges.add(outgoing[0].id);
            }
          }
        } else {
          // 普通节点：激活所有出边
          outgoing.forEach((edge) => {
            activatedOutgoing.push(edge);
            activatedEdges.add(edge.id);
          });
        }

        // 4.5 将下游节点加入就绪队列
        activatedOutgoing.forEach((edge) => {
          const targetNodeId = edge.target;
          if (!completedNodes.has(targetNodeId)) {
            // 检查目标节点的所有入边是否都已到达
            const targetIncoming = incomingEdges[targetNodeId] || [];
            const allIncomingActivated = targetIncoming.every((inEdge) =>
              activatedEdges.has(inEdge.id)
            );

            // 如果所有入边都已激活，或者目标节点是入口节点，加入队列
            if (
              allIncomingActivated ||
              isEntryNode(nodeMap[targetNodeId]) ||
              targetIncoming.length === 0
            ) {
              if (!readyQueue.includes(targetNodeId)) {
                readyQueue.push(targetNodeId);
              }
            }
          }
        });
      } catch (error: any) {
        // 节点执行失败
        nodeResults[currentNodeId] = {
          nodeId: currentNodeId,
          nodeType: currentNode.type || "unknown",
          inputActual: {},
          outputActual: null,
          status: "failed",
          logs: [`节点执行失败: ${error?.message || String(error)}`],
        };
        nodeOrder.push(currentNodeId);
        completedNodes.add(currentNodeId);
        warnings.push(`节点 ${currentNodeId} 执行失败: ${error?.message || String(error)}`);
      }
    }

    // 5. 标记被跳过的节点
    nodes.forEach((node) => {
      if (!completedNodes.has(node.id)) {
        nodeResults[node.id] = {
          nodeId: node.id,
          nodeType: node.type || "unknown",
          inputActual: {},
          outputActual: null,
          status: "skipped",
          logs: ["节点未被激活（分支未选中）"],
        };
      }
    });

    // 6. 计算最终输出
    const terminalNodes = nodes.filter((node) =>
      isTerminalNode(node, outgoingEdges)
    );
    const finalOutput: any = {};

    terminalNodes.forEach((node) => {
      if (nodeOutputs[node.id] !== undefined) {
        finalOutput[node.id] = nodeOutputs[node.id];
      }
    });

    // 如果没有终端节点输出，使用最后一个执行节点的输出
    if (Object.keys(finalOutput).length === 0 && nodeOrder.length > 0) {
      const lastNodeId = nodeOrder[nodeOrder.length - 1];
      finalOutput[lastNodeId] = nodeOutputs[lastNodeId];
    }

    const endedAt = Date.now();

    return {
      status: "success",
      startedAt,
      endedAt,
      nodeResults,
      nodeOrder,
      finalOutput,
      warnings,
    };
  } catch (error: any) {
    return {
      status: "failed",
      startedAt,
      endedAt: Date.now(),
      nodeResults,
      nodeOrder,
      finalOutput: null,
      warnings: [...warnings, `工作流执行失败: ${error?.message || String(error)}`],
    };
  }
}

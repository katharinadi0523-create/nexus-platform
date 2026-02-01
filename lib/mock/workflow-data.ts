// ==========================================
// 工作流图数据定义
// ==========================================

import { Node, Edge } from "reactflow";

/**
 * 意图分析智能体工作流图
 * 结构: Start -> LLM(Parse) -> Parallel(3 Ontology Queries) -> LLM(Reason) -> Rule Match -> MCP Action -> End
 */
export const INTENT_ANALYSIS_WORKFLOW: {
  nodes: Node[];
  edges: Edge[];
} = {
  nodes: [
    // 1. Start Node
    {
      id: "node-start",
      type: "start",
      position: { x: 100, y: 400 },
      data: {
        inputVariables: [
          { name: "report", type: "string", required: true, description: "Identity/Behavior 报告" },
        ],
        mockOutput: {
          report: "Identity Report: DDG-113 (John Finn) & TAGS-62 (Bowditch); Behavior: Loitering in Taiwan Strait...",
        },
      },
    },
    // 2. LLM Parse Node
    {
      id: "node-llm-parse",
      type: "llm",
      position: { x: 350, y: 400 },
      data: {
        description: "解析输入报告，提取查询意图",
        inputVariables: [
          { name: "report", value: "开始/report", type: "string" },
        ],
        outputVariables: [
          { name: "queries", type: "object", description: "解析后的查询对象" },
        ],
        mockOutput: {
          queries: {
            entity: "DDG-113, TAGS-62",
            pattern: "Destroyer + Survey Ship",
            history: "Loitering in sensitive strait",
          },
        },
      },
    },
    // 3. Entity Query Node (精确查询)
    {
      id: "node-query-entity",
      type: "object-query",
      position: { x: 650, y: 200 },
      data: {
        description: "精确查询: 舰船与编队",
        ontologyConfig: {
          ontology: "TH态势感知与情报快判",
          objectType: "舰船单元",
          property: "name",
          queryRewrite: true,
          retrievalMethod: "structured", // mode_a: 结构化检索
          topK: 1,
          threshold: 0.6,
          injectionFields: [],
        },
        inputVariables: [
          { name: "query", value: "node-llm-parse/queries", type: "string" },
        ],
        outputVariables: [
          { name: "objectSets", type: "array[object]" },
        ],
        mockOutput: {
          objectSets: [
            {
              objectName: "DDG-113",
              objectID: "ship-ddg-113",
              metadata: { radar: "SPY-1D", type: "Destroyer" },
            },
            {
              objectName: "TAGS-62",
              objectID: "ship-tags-62",
              metadata: { type: "Survey", capabilities: ["Hydrographic", "Bathymetric"] },
            },
            {
              objectName: "US 7th Fleet",
              objectID: "formation-7th-fleet",
              metadata: { formationType: "Escort" },
            },
          ],
        },
      },
    },
    // 4. Pattern Query Node (语义检索)
    {
      id: "node-query-pattern",
      type: "object-query",
      position: { x: 650, y: 400 },
      data: {
        description: "语义检索: 编队战术模式",
        ontologyConfig: {
          ontology: "TH态势感知与情报快判",
          objectType: "编队战术模式",
          property: "description",
          queryRewrite: true,
          retrievalMethod: "semantic", // mode_b: 语义检索
          semanticWeight: 0.6,
          topK: 1,
          threshold: 0.6,
          injectionFields: [],
        },
        inputVariables: [
          { name: "query", value: "node-llm-parse/queries", type: "string" },
        ],
        outputVariables: [
          { name: "objectSets", type: "array[object]" },
        ],
        mockOutput: {
          objectSets: [
            {
              objectName: "HVU-PROT",
              objectID: "pattern-hvu-prot",
              metadata: {
                desc: "高价值单元护航 (High Value Unit Protection)",
                characteristics: ["Escort formation", "Defensive posture", "Survey support"],
              },
            },
          ],
        },
      },
    },
    // 5. History Query Node (语义检索)
    {
      id: "node-query-history",
      type: "object-query",
      position: { x: 650, y: 600 },
      data: {
        description: "语义检索: 历史战例",
        ontologyConfig: {
          ontology: "TH态势感知与情报快判",
          objectType: "历史战例",
          property: "description",
          queryRewrite: true,
          retrievalMethod: "semantic", // mode_b: 语义检索
          semanticWeight: 0.6,
          topK: 2,
          threshold: 0.6,
          injectionFields: [],
        },
        inputVariables: [
          { name: "query", value: "node-llm-parse/queries", type: "string" },
        ],
        outputVariables: [
          { name: "objectSets", type: "array[object]" },
        ],
        mockOutput: {
          objectSets: [
            {
              objectName: "Case_2023_SCS_Mapping",
              objectID: "case-2023-scs",
              metadata: {
                title: "2023年南海水文测绘行动",
                description: "类似编队在敏感海域进行长时间测绘作业",
                outcome: "Seabed Mapping",
              },
            },
            {
              objectName: "Case_2024_FONOP",
              objectID: "case-2024-fonop",
              metadata: {
                title: "2024年自由航行行动",
                description: "驱逐舰护航测量船通过国际水道",
                outcome: "Freedom of Navigation",
              },
            },
          ],
        },
      },
    },
    // 6. LLM Reason Node (融合推理)
    {
      id: "node-llm-reason",
      type: "llm",
      position: { x: 950, y: 400 },
      data: {
        description: "多维意图融合推理",
        inputVariables: [
          { name: "original_report", value: "开始/report", type: "string" },
          { name: "entity_data", value: "node-query-entity/objectSets", type: "array[object]" },
          { name: "pattern_match", value: "node-query-pattern/objectSets", type: "array[object]" },
          { name: "history_match", value: "node-query-history/objectSets", type: "array[object]" },
        ],
        outputVariables: [
          { name: "analysis", type: "string", description: "综合分析结果" },
          { name: "intent_hypothesis", type: "array[object]", description: "意图假设列表" },
        ],
        mockOutput: {
          analysis: "综合分析：实体特征显示具备强区域防空与水文测绘能力；模式匹配确认这是典型的高价值单元护航；历史战例表明此类编队常用于战前水文数据积累。\n>> 结论：主要意图为战场环境预置（水文调查）。",
          intent_hypothesis: [
            {
              id: "intent-uuid-101",
              type: "Assessment",
              intent: "Hydrographic Survey",
              prob: "High",
              description: "水文调查 - 主要意图",
            },
            {
              id: "intent-uuid-102",
              type: "Assessment",
              intent: "Electronic Surveillance",
              prob: "Medium",
              description: "电子侦察 - 次要意图",
            },
            {
              id: "intent-uuid-103",
              type: "Assessment",
              intent: "Battlefield Prep",
              prob: "Low",
              description: "战场预置 - 潜在意图",
            },
          ],
        },
      },
    },
    // 7. Rule Match Node
    {
      id: "node-rule-match",
      type: "object-query",
      position: { x: 1250, y: 400 },
      data: {
        description: "匹配作战规定",
        ontologyConfig: {
          ontology: "TH态势感知与情报快判",
          objectType: "作战条令",
          property: "content",
          queryRewrite: true,
          retrievalMethod: "semantic",
          semanticWeight: 0.6,
          topK: 5,
          threshold: 0.6,
          injectionFields: [],
        },
        inputVariables: [
          { name: "intent_hypothesis", value: "node-llm-reason/intent_hypothesis", type: "array[object]" },
        ],
        outputVariables: [
          { name: "matched_rules", type: "array[object]" },
        ],
        mockOutput: {
          objectSets: [
            {
              objectName: "《海空情况处置规定》",
              objectID: "reg-001",
              metadata: {
                clause: "查证与驱离条款",
                applicable: true,
              },
            },
          ],
        },
      },
    },
    // 8. MCP Action Node (创建意图对象)
    {
      id: "node-action-create",
      type: "mcp",
      position: { x: 1550, y: 400 },
      data: {
        description: "调用 Intent_Manager.batch_create 创建意图假设对象",
        // MCP 配置：使用一个虚拟的 MCP 对象，因为 Intent_Manager.batch_create 不在预设列表中
        selectedMCP: {
          id: "Intent_Manager.batch_create",
          name: "Intent_Manager.batch_create",
          description: "批量创建意图假设对象",
          icon: null, // 将在组件中处理
        },
        mcpTool: "Intent_Manager.batch_create",
        inputVariables: [
          { name: "intent_hypothesis", value: "node-llm-reason/intent_hypothesis", type: "array[object]", required: true },
          { name: "matched_rules", value: "node-rule-match/matched_rules", type: "array[object]", required: false },
        ],
        outputVariables: [
          { name: "success", type: "boolean" },
          { name: "created_ids", type: "array[string]" },
          { name: "timestamp", type: "string" },
        ],
        mockOutput: {
          success: true,
          created_ids: ["intent-uuid-101", "intent-uuid-102", "intent-uuid-103"],
          timestamp: "2026-02-02T10:00:13Z",
        },
      },
    },
    // 9. End Node
    {
      id: "node-end",
      type: "end",
      position: { x: 1850, y: 400 },
      data: {},
    },
  ],
  edges: [
    // Start -> LLM Parse
    {
      id: "e-start-parse",
      source: "node-start",
      target: "node-llm-parse",
      type: "smoothstep",
      animated: true,
    },
    // LLM Parse -> [Entity, Pattern, History] (Fan-Out)
    {
      id: "e-parse-entity",
      source: "node-llm-parse",
      target: "node-query-entity",
      type: "smoothstep",
      animated: true,
    },
    {
      id: "e-parse-pattern",
      source: "node-llm-parse",
      target: "node-query-pattern",
      type: "smoothstep",
      animated: true,
    },
    {
      id: "e-parse-history",
      source: "node-llm-parse",
      target: "node-query-history",
      type: "smoothstep",
      animated: true,
    },
    // [Entity, Pattern, History] -> LLM Reason (Fan-In)
    {
      id: "e-entity-reason",
      source: "node-query-entity",
      target: "node-llm-reason",
      type: "smoothstep",
      animated: true,
    },
    {
      id: "e-pattern-reason",
      source: "node-query-pattern",
      target: "node-llm-reason",
      type: "smoothstep",
      animated: true,
    },
    {
      id: "e-history-reason",
      source: "node-query-history",
      target: "node-llm-reason",
      type: "smoothstep",
      animated: true,
    },
    // LLM Reason -> Rule Match -> Action -> End
    {
      id: "e-reason-rule",
      source: "node-llm-reason",
      target: "node-rule-match",
      type: "smoothstep",
      animated: true,
    },
    {
      id: "e-rule-action",
      source: "node-rule-match",
      target: "node-action-create",
      type: "smoothstep",
      animated: true,
    },
    {
      id: "e-action-end",
      source: "node-action-create",
      target: "node-end",
      type: "smoothstep",
      animated: true,
    },
  ],
};

/**
 * 获取指定 Agent 的工作流图
 */
export function getWorkflowByAgentId(agentId: string): { nodes: Node[]; edges: Edge[] } | null {
  switch (agentId) {
    case "agent-intent-analysis":
      return INTENT_ANALYSIS_WORKFLOW;
    default:
      return null;
  }
}

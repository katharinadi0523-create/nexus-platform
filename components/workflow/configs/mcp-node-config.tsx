"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Node, Edge } from "reactflow";
import { MCPSelector, type MCP } from "@/components/agent-editor/MCPSelector";
import { VariableSelector } from "../variable-selector";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllActions } from "@/lib/mock/mock-mcp-actions";

interface MCPNodeData {
  description?: string;
  selectedMCP?: MCP;
  mcpTool?: string; // MCP 工具名称（如 "Intent_Manager.batch_create"）
  inputVariables?: Array<{ name: string; value: string; required?: boolean }>;
  outputVariables?: Array<{ name: string; type: string }>;
}

interface MCPNodeConfigProps {
  nodeData?: MCPNodeData;
  onUpdate: (data: MCPNodeData) => void;
  currentNodeId: string;
  nodes: Node[];
  edges: Edge[];
}

// Mock MCP Schema - 根据 MCP ID 或 mcpTool 获取输入输出 schema
// 默认 schema
const defaultMCPSchema = {
  inputSchema: [] as Array<{ name: string; type: string; required?: boolean; description?: string }>,
  outputSchema: [{ name: "result", type: "any", description: "MCP 执行结果" }] as Array<{ name: string; type: string; description?: string }>,
};

// 根据 MCP ID 或 mcpTool 返回不同的 schema
const mcpSchemaMap: Record<string, typeof defaultMCPSchema> = {
    "mcp-1": {
      // 百度AI搜索
      inputSchema: [{ name: "query", type: "string", required: true, description: "搜索关键词" }],
      outputSchema: [
        { name: "results", type: "array[object]", description: "搜索结果列表" },
        { name: "total", type: "number", description: "结果总数" },
      ],
    },
    "mcp-2": {
      // 智能写作
      inputSchema: [
        { name: "topic", type: "string", required: true, description: "写作主题" },
        { name: "style", type: "string", required: false, description: "写作风格" },
      ],
      outputSchema: [{ name: "content", type: "string", description: "生成的文本内容" }],
    },
    "action-transit-update-identity": {
      // Update_Identity
      inputSchema: [
        { name: "eventId", type: "string", required: true, description: "事件ID" },
        { name: "identity", type: "array[string]", required: true, description: "身份信息列表" },
      ],
      outputSchema: [
        { name: "success", type: "boolean", description: "是否成功" },
        { name: "snapshot_id", type: "string", description: "快照ID" },
      ],
    },
    "action-transit-update-threat": {
      // Update_Threat_Level
      inputSchema: [
        { name: "eventId", type: "string", required: true, description: "事件ID" },
        { name: "threat_level", type: "string", required: true, description: "威胁等级" },
        { name: "risk_factor", type: "string", required: false, description: "风险因子" },
      ],
      outputSchema: [
        { name: "success", type: "boolean", description: "是否成功" },
        { name: "timestamp", type: "string", description: "更新时间戳" },
      ],
    },
    "action-intent-01": {
      // Intent_Manager.batch_create
      inputSchema: [
        { name: "intent_hypothesis", type: "array[object]", required: true, description: "意图假设列表" },
        { name: "matched_rules", type: "array[object]", required: false, description: "匹配的规则" },
      ],
      outputSchema: [
        { name: "success", type: "boolean", description: "是否成功" },
        { name: "created_ids", type: "array[string]", description: "创建的ID列表" },
        { name: "timestamp", type: "string", description: "创建时间戳" },
      ],
    },
    // Intent_Manager.batch_create (通过 mcpTool 匹配)
    "Intent_Manager.batch_create": {
      inputSchema: [
        { name: "intent_hypothesis", type: "array[object]", required: true, description: "意图假设列表" },
        { name: "matched_rules", type: "array[object]", required: false, description: "匹配的规则" },
      ],
      outputSchema: [
        { name: "success", type: "boolean", description: "是否成功" },
        { name: "created_ids", type: "array[string]", description: "创建的ID列表" },
        { name: "timestamp", type: "string", description: "创建时间戳" },
      ],
    },
};

function getMCPSchema(mcpId?: string, mcpTool?: string): {
  inputSchema: Array<{ name: string; type: string; required?: boolean; description?: string }>;
  outputSchema: Array<{ name: string; type: string; description?: string }>;
} {
  // 优先通过 mcpTool 匹配
  if (mcpTool && mcpSchemaMap[mcpTool]) {
    return mcpSchemaMap[mcpTool];
  }

  // 然后通过 mcpId 匹配
  if (mcpId && mcpSchemaMap[mcpId]) {
    return mcpSchemaMap[mcpId];
  }

  return defaultMCPSchema;
}

export function MCPNodeConfig({
  nodeData,
  onUpdate,
  currentNodeId,
  nodes,
  edges,
}: MCPNodeConfigProps) {
  const [description, setDescription] = useState(nodeData?.description || "");
  const [mcpSelectorOpen, setMcpSelectorOpen] = useState(false);
  const selectedMCP = nodeData?.selectedMCP;

  // 获取 MCP 的输入输出 schema
  const mcpSchema = useMemo(() => {
    return getMCPSchema(selectedMCP?.id, nodeData?.mcpTool);
  }, [selectedMCP?.id, nodeData?.mcpTool]);

  // 初始化输入变量（根据 MCP schema）
  const [inputVariables, setInputVariables] = useState<
    Array<{ name: string; value: string; required?: boolean }>
  >(
    nodeData?.inputVariables ||
      mcpSchema.inputSchema.map((param) => ({
        name: param.name,
        value: "",
        required: param.required,
      }))
  );

  // 当 MCP 改变时，更新输入变量
  const handleMCPSelect = (mcps: MCP[]) => {
    const mcp = mcps[0]; // 只取第一个（单选）
    if (mcp) {
      // 检查是否是本体行动，如果是，使用 actionId 作为 mcpTool
      const allActions = getAllActions();
      const action = allActions.find((a) => a.id === mcp.id);
      const mcpTool = action ? mcp.id : nodeData?.mcpTool;
      
      const newSchema = getMCPSchema(mcp.id, mcpTool);
      const newInputVariables = newSchema.inputSchema.map((param) => {
        // 尝试保留已有的值
        const existing = inputVariables.find((v) => v.name === param.name);
        return {
          name: param.name,
          value: existing?.value || "",
          required: param.required,
        };
      });

      setInputVariables(newInputVariables);
      onUpdate({
        ...nodeData,
        selectedMCP: mcp,
        mcpTool: mcpTool,
        inputVariables: newInputVariables,
        outputVariables: newSchema.outputSchema,
      });
    }
  };

  const handleUpdateInputVariable = (
    index: number,
    field: "name" | "value",
    value: string
  ) => {
    const updated = inputVariables.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    setInputVariables(updated);
    onUpdate({ ...nodeData, inputVariables: updated });
  };

  return (
    <div className="space-y-6">
      {/* 描述 */}
      <div>
        <Input
          placeholder="添加描述..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            onUpdate({ ...nodeData, description: e.target.value });
          }}
          className="w-full"
        />
      </div>

      {/* MCP 选择 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-900">MCP工具</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMcpSelectorOpen(true)}
            className="gap-2"
          >
            <Package className="w-4 h-4" />
            {selectedMCP ? "更换MCP" : "选择MCP"}
          </Button>
        </div>
        {selectedMCP ? (
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <div className="flex-1">
              <div className="text-sm text-slate-700 font-medium">{selectedMCP.name}</div>
              {selectedMCP.description && (
                <div className="text-xs text-slate-500 mt-0.5">{selectedMCP.description}</div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="text-sm text-slate-400">未选择MCP工具</span>
          </div>
        )}
      </div>

      {/* 输入变量 */}
      {selectedMCP && mcpSchema.inputSchema.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-900">输入变量</h3>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-2 px-2">
              <div>变量名</div>
              <div>变量值</div>
            </div>
            {inputVariables.map((variable, index) => {
              const paramSchema = mcpSchema.inputSchema.find((p) => p.name === variable.name);
              return (
                <div
                  key={index}
                  className="grid grid-cols-2 gap-2 bg-slate-50 rounded-lg p-2"
                >
                  <div className="flex items-center gap-1 text-sm text-slate-700">
                    {variable.name}
                    {variable.required && <span className="text-red-500">*</span>}
                    {paramSchema?.type && (
                      <span className="text-xs text-slate-400">({paramSchema.type})</span>
                    )}
                  </div>
                  <VariableSelector
                    value={variable.value}
                    onSelect={(value) =>
                      handleUpdateInputVariable(index, "value", value)
                    }
                    currentNodeId={currentNodeId}
                    nodes={nodes}
                    edges={edges}
                    placeholder="选择上游节点输出"
                    className="text-sm"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 输出 */}
      {selectedMCP && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-900">输出</h3>
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            {mcpSchema.outputSchema.map((output, index) => (
              <div key={index} className="text-sm text-slate-700">
                <span className="font-medium">{output.name}</span>{" "}
                <span className="text-slate-500">({output.type})</span>
                {output.description && (
                  <div className="text-xs text-slate-500 mt-0.5">{output.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MCP Selector Dialog */}
      <MCPSelector
        open={mcpSelectorOpen}
        onOpenChange={setMcpSelectorOpen}
        onSelect={handleMCPSelect}
        selectedMCPs={selectedMCP ? [selectedMCP] : []}
        singleSelect={true}
      />
    </div>
  );
}

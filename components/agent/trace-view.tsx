"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Wrench,
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Share2,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ExecutionStep, ExecutionStepType, ExecutionStepStatus } from "@/lib/agent-data";

interface TraceViewProps {
  steps: ExecutionStep[];
}

/**
 * 判断是否为 MCP 工具调用
 */
function isMCPToolCall(step: ExecutionStep): boolean {
  if (step.stepType !== "tool_call") return false;
  
  // 检查步骤名称是否包含 MCP 相关关键词（如"动作:"、"更新"等）
  const stepName = step.stepName || "";
  if (stepName.includes("动作:") || stepName.includes("更新")) {
    return true;
  }
  
  // 检查 input.action 是否匹配 MCP 行动名称
  const action = step.input?.action;
  if (typeof action === "string") {
    const mcpActions = [
      "Update_Identity",
      "Update_Threat_Level",
      "Update_Entity",
      "Archive_Event",
      "Verify_Source",
      "Link_to_Entity",
      "Annotate_Image",
    ];
    if (mcpActions.some(mcpAction => action === mcpAction || action.includes(mcpAction))) {
      return true;
    }
  }
  
  return false;
}

/**
 * 获取步骤类型的图标
 */
function getStepIcon(stepType: ExecutionStepType, step?: ExecutionStep) {
  // 如果是 MCP 工具调用，使用 Package 图标
  if (step && isMCPToolCall(step)) {
    return Package;
  }
  
  switch (stepType) {
    case "thought":
      return Sparkles;
    case "tool_call":
      return Wrench;
    case "rag_retrieval":
      return Database;
    case "ontology_query":
      return Share2;
    case "final_answer":
      return CheckCircle2;
    default:
      return FileText;
  }
}

/**
 * 获取步骤类型的颜色主题
 */
function getStepColorTheme(stepType: ExecutionStepType, step?: ExecutionStep) {
  // 如果是 MCP 工具调用，使用绿色主题
  if (step && isMCPToolCall(step)) {
    return {
      border: "border-green-500",
      bg: "bg-green-50",
      icon: "text-green-600",
      badge: "bg-green-100 text-green-700",
    };
  }
  
  switch (stepType) {
    case "thought":
      return {
        border: "border-purple-500",
        bg: "bg-purple-50",
        icon: "text-purple-600",
        badge: "bg-purple-100 text-purple-700",
      };
    case "tool_call":
      return {
        border: "border-blue-500",
        bg: "bg-blue-50",
        icon: "text-blue-600",
        badge: "bg-blue-100 text-blue-700",
      };
    case "rag_retrieval":
      return {
        border: "border-green-500",
        bg: "bg-green-50",
        icon: "text-green-600",
        badge: "bg-green-100 text-green-700",
      };
    case "ontology_query":
      return {
        border: "border-orange-500",
        bg: "bg-orange-50",
        icon: "text-orange-600",
        badge: "bg-orange-100 text-orange-700",
      };
    case "final_answer":
      return {
        border: "border-slate-400",
        bg: "bg-slate-100",
        icon: "text-slate-600",
        badge: "bg-slate-200 text-slate-700",
      };
    default:
      return {
        border: "border-slate-500",
        bg: "bg-slate-50",
        icon: "text-slate-600",
        badge: "bg-slate-100 text-slate-700",
      };
  }
}

/**
 * 获取状态图标
 */
function getStatusIcon(status: ExecutionStepStatus) {
  switch (status) {
    case "running":
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    case "success":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-red-500" />;
  }
}

/**
 * 格式化 JSON 显示
 */
function formatJSON(value: any): string {
  if (value === null || value === undefined) {
    return "null";
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * 格式化持续时间
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * 渲染本体查询的对象实例卡片
 */
function renderOntologyObjectCard(obj: any, index: number) {
  // 尝试提取对象的关键信息
  const objId = obj.id || obj.objectId || `对象 ${index + 1}`;
  const objType = obj.type || obj.objectType || "未知类型";
  const properties = obj.properties || obj.attrs || {};
  const title = obj.title || obj.name || objId;

  // 提取关键属性（优先显示常见的属性）
  const keyProperties = Object.entries(properties)
    .slice(0, 5) // 最多显示 5 个属性
    .map(([key, value]) => ({ key, value }));

  return (
    <div
      key={index}
      className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:bg-orange-100 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
          <Share2 className="w-4 h-4 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-slate-900">{title}</span>
            <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
              {objType}
            </Badge>
            {objId && (
              <span className="text-xs text-slate-500 font-mono">{objId}</span>
            )}
          </div>
          {keyProperties.length > 0 && (
            <div className="space-y-1.5 mt-2">
              {keyProperties.map(({ key, value }) => (
                <div key={key} className="flex items-start gap-2 text-xs">
                  <span className="font-medium text-slate-700 min-w-[80px]">
                    {key}:
                  </span>
                  <span className="text-slate-600 break-words">
                    {typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {obj.links && Array.isArray(obj.links) && obj.links.length > 0 && (
            <div className="mt-2 pt-2 border-t border-orange-200">
              <span className="text-xs text-slate-500">
                关联对象: {obj.links.length} 个
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * TraceView 组件
 * 用于展示执行链路的时间轴视图，支持流式播放效果
 */
export function TraceView({ steps }: TraceViewProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [visibleSteps, setVisibleSteps] = useState<ExecutionStep[]>([]);
  const [isRunning, setIsRunning] = useState(true);

  // 流式播放效果：逐步显示步骤（根据 duration 模拟真实执行时间）
  useEffect(() => {
    if (steps.length === 0) {
      setIsRunning(false);
      setVisibleSteps([]);
      return;
    }

    // 重置状态
    setVisibleSteps([]);
    setIsRunning(true);

    let accumulatedDelay = 0;
    const timeouts: NodeJS.Timeout[] = [];

    steps.forEach((step, index) => {
      // 累加每个步骤的 duration 作为延迟时间（使用毫秒）
      accumulatedDelay += step.duration;
      
      const timeout = setTimeout(() => {
        setVisibleSteps((prev) => {
          const newSteps = [...prev, step];
          // 如果是最后一个步骤，标记为完成
          if (index === steps.length - 1) {
            setIsRunning(false);
          }
          return newSteps;
        });
      }, accumulatedDelay);
      
      timeouts.push(timeout);
    });

    // 清理函数：组件卸载或 steps 变化时清除所有定时器
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [steps]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  if (steps.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
        暂无执行链路数据
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* 渲染已显示的步骤 */}
      {visibleSteps.map((step, index) => {
        const isExpanded = expandedSteps.has(step.id);
        const isLast = index === visibleSteps.length - 1;
        const Icon = getStepIcon(step.stepType, step);
        const theme = getStepColorTheme(step.stepType, step);

        return (
          <div key={step.id} className="relative flex gap-4">
            {/* 左侧时间轴 */}
            <div className="flex flex-col items-center">
              {/* 图标 */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  theme.border,
                  theme.bg
                )}
              >
                <Icon className={cn("w-5 h-5", theme.icon)} />
              </div>
              {/* 连接线 */}
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-[40px]",
                    step.status === "failed" ? "bg-red-200" : "bg-slate-200"
                  )}
                />
              )}
            </div>

            {/* 右侧内容 */}
            <div className="flex-1 pb-6 min-w-0">
              <div
                className={cn(
                  "rounded-lg border transition-all",
                  step.status === "failed"
                    ? "border-red-200 bg-red-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                {/* 步骤头部 */}
                <button
                  onClick={() => step.stepType !== "thought" && step.stepType !== "final_answer" && toggleStep(step.id)}
                  disabled={step.stepType === "thought" || step.stepType === "final_answer"}
                  className={cn(
                    "w-full px-4 py-3 flex items-center justify-between gap-3 text-left transition-colors rounded-t-lg",
                    step.stepType === "thought" || step.stepType === "final_answer"
                      ? "cursor-default" 
                      : "hover:bg-slate-50/50 cursor-pointer"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {step.stepType !== "thought" && step.stepType !== "final_answer" && (
                      isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )
                    )}
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {step.stepName}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn("text-xs flex-shrink-0", theme.badge)}
                    >
                      {step.stepType === "thought"
                        ? "思考"
                        : step.stepType === "tool_call"
                        ? "工具调用"
                        : step.stepType === "rag_retrieval"
                        ? "知识检索"
                        : step.stepType === "ontology_query"
                        ? "本体查询"
                        : "最终答案"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {getStatusIcon(step.status)}
                    <span className="text-xs text-slate-500">
                      {formatDuration(step.duration)}
                    </span>
                  </div>
                </button>

                {/* Thought 类型：始终显示纯文本内容，不折叠 */}
                {step.stepType === "thought" ? (
                  <div className="px-4 pb-4 border-t border-slate-200">
                    <div className="pt-3">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {typeof step.output === "string" ? step.output : formatJSON(step.output)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : step.stepType === "final_answer" ? (
                  /* Final Answer 类型：显示在灰色回答框中 */
                  <div className="px-4 pb-4 border-t border-slate-200">
                    <div className="pt-3">
                      <div className="bg-slate-100 border border-slate-300 rounded-lg p-4">
                        <p className="text-sm text-slate-900 whitespace-pre-wrap leading-relaxed font-medium">
                          {typeof step.output === "string" ? step.output : formatJSON(step.output)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 其他类型：可折叠的 Input/Output */
                  isExpanded && (
                    <div className="px-4 pb-4 space-y-4 border-t border-slate-200">
                      {/* 时间信息 */}
                      <div className="grid grid-cols-2 gap-4 pt-3 text-xs text-slate-600">
                        <div>
                          <span className="font-medium">开始时间:</span>{" "}
                          <span className="text-slate-500">{step.startTime}</span>
                        </div>
                        <div>
                          <span className="font-medium">结束时间:</span>{" "}
                          <span className="text-slate-500">{step.endTime}</span>
                        </div>
                      </div>

                      {/* Input */}
                      <div>
                        <div className="text-xs font-medium text-slate-700 mb-2">
                          {step.stepType === "ontology_query"
                            ? "查询条件 (Query Filters)"
                            : "输入 (Input)"}
                        </div>
                        <div className="bg-slate-50 rounded border border-slate-200 p-3 overflow-x-auto">
                          <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words font-mono">
                            {formatJSON(step.input)}
                          </pre>
                        </div>
                      </div>

                      {/* Output - 本体查询特殊渲染 */}
                      {step.stepType === "ontology_query" ? (
                        <div>
                          <div className="text-xs font-medium text-slate-700 mb-2">
                            查询结果 (Query Results)
                          </div>
                          {step.output && typeof step.output === "object" ? (
                            Array.isArray(step.output) ? (
                              // 多个对象实例
                              <div className="space-y-3">
                                {step.output.length > 0 ? (
                                  step.output.map((obj: any, idx: number) =>
                                    renderOntologyObjectCard(obj, idx)
                                  )
                                ) : (
                                  <div className="bg-slate-50 rounded border border-slate-200 p-4 text-center text-sm text-slate-500">
                                    未找到匹配的对象实例
                                  </div>
                                )}
                              </div>
                            ) : (
                              // 单个对象实例
                              <div className="space-y-3">
                                {renderOntologyObjectCard(step.output, 0)}
                              </div>
                            )
                          ) : (
                            // 非对象格式，回退到 JSON 显示
                            <div className="bg-slate-50 rounded border border-slate-200 p-3 overflow-x-auto">
                              <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words font-mono">
                                {formatJSON(step.output)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        // 其他类型的 Output 保持原样
                        <div>
                          <div className="text-xs font-medium text-slate-700 mb-2">
                            输出 (Output)
                          </div>
                          <div className="bg-slate-50 rounded border border-slate-200 p-3 overflow-x-auto">
                            <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words font-mono">
                              {formatJSON(step.output)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Citations (仅 RAG 步骤) */}
                      {step.stepType === "rag_retrieval" &&
                        step.citations &&
                        step.citations.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-slate-700 mb-2">
                              引用来源 ({step.citations.length})
                            </div>
                            <div className="space-y-2">
                              {step.citations.map((citation, idx) => (
                                <div
                                  key={idx}
                                  className="bg-green-50 border border-green-200 rounded p-3 hover:bg-green-100 transition-colors"
                                >
                                  <div className="flex items-start gap-2">
                                    <FileText className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-slate-900">
                                          {citation.sourceName}
                                        </span>
                                        {citation.url && (
                                          <a
                                            href={citation.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:text-green-700 flex items-center gap-1"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                          </a>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                                        {citation.content}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {/* 执行中状态提示 */}
      {isRunning && (
        <div className="relative flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-slate-300 bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          </div>
          <div className="flex-1 pb-6 min-w-0">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>执行中...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

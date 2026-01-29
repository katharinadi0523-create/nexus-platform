"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, ChevronDown, Filter, AlertCircle } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { LogEntry as SFTLogEntry, AgentType, Message, FeedbackDetail } from "@/lib/agent-data";

// 将包含 <appforgeimg /> 的字符串拆分为 React 节点数组
const parseAgentContent = (content: string) => {
  // 正则匹配 <appforgeimg src="..." />
  const parts = content.split(/(<appforgeimg src="[^"]+" \/>)/g);
  
  return parts.map((part, index) => {
    const match = part.match(/<appforgeimg src="([^"]+)" \/>/);
    if (match) {
      return (
        <img 
          key={index} 
          src={match[1]} 
          alt="Agent Generated" 
          className="my-2 max-w-full rounded-lg border border-gray-200 shadow-sm" 
        />
      );
    }
    // 普通文本，保留换行符
    return <span key={index} className="whitespace-pre-wrap">{part}</span>;
  });
};

// LogEntry 类型定义
export type LogEntry = {
  id: string; // 会话ID (显示前8位)
  input: string; // 输入 (截断)
  output: string; // 输出 (截断)
  timestamp: string; // 请求发起时间 (YYYY-MM-DD HH:mm:ss)
  source: "应用广场" | "API调用" | "网页端体验" | "预览与调试"; // 渠道来源
  userFeedback: FeedbackDetail; // 用户反馈
  adminFeedback: FeedbackDetail; // 管理员反馈
  status: "pending" | "adopted"; // 操作状态
  fullMessages?: Message[]; // 完整的对话历史（用于详情页展示）
};

interface LogsTableProps {
  data: LogEntry[];
  onExportClick?: () => void;
  rawLogs?: SFTLogEntry[]; // SFT 格式的原始日志，用于导出
  agentType?: AgentType; // 智能体类型，用于决定导出格式
}

export function LogsTable({ data, onExportClick, rawLogs, agentType }: LogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>(data);

  // 同步 data prop 的变化到内部状态
  useEffect(() => {
    setLogs(data);
  }, [data]);

  const handleAdminFeedback = (logId: string, feedback: "good" | "bad") => {
    setLogs((prevLogs) =>
      prevLogs.map((log) => {
        if (log.id === logId) {
          // 将 "good" 映射为 "like"，"bad" 映射为 "dislike"
          const feedbackStatus: "like" | "dislike" = feedback === "good" ? "like" : "dislike";
          // 如果点击的是当前反馈，则取消反馈；否则设置新反馈
          const newFeedback: FeedbackDetail = 
            log.adminFeedback.status === feedbackStatus 
              ? { status: null }
              : { status: feedbackStatus };
          return { ...log, adminFeedback: newFeedback };
        }
        return log;
      })
    );
  };

  const handleAdopt = (logId: string) => {
    setLogs((prevLogs) =>
      prevLogs.map((log) => {
        if (log.id === logId) {
          return { ...log, status: log.status === "adopted" ? "pending" : "adopted" };
        }
        return log;
      })
    );
  };

  const truncateText = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const getSourceBadgeVariant = (source: LogEntry["source"]) => {
    return source === "预览与调试" ? "default" : "outline";
  };

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Table Container */}
        <div className="flex-1 overflow-auto bg-background px-6">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-32">会话ID</TableHead>
                <TableHead className="min-w-[200px]">输入</TableHead>
                <TableHead className="min-w-[200px]">输出</TableHead>
                <TableHead className="w-40">
                  <div className="flex items-center gap-1">
                    请求发起时间
                    <button className="ml-1">
                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    </button>
                  </div>
                </TableHead>
                <TableHead className="w-32">
                  <div className="flex items-center gap-1">
                    渠道来源
                    <Filter className="h-3 w-3 text-slate-400" />
                  </div>
                </TableHead>
                <TableHead className="w-28">
                  <div className="flex items-center gap-1">
                    用户反馈
                    <Filter className="h-3 w-3 text-slate-400" />
                  </div>
                </TableHead>
                <TableHead className="w-32">
                  <div className="flex items-center gap-1">
                    管理员反馈
                    <Filter className="h-3 w-3 text-slate-400" />
                  </div>
                </TableHead>
                <TableHead className="w-32">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  {/* 会话ID */}
                  <TableCell>
                    <span
                      className="text-sm text-slate-600 cursor-help"
                      title={log.id}
                    >
                      {log.id.slice(0, 8)}...
                    </span>
                  </TableCell>

                  {/* 输入 */}
                  <TableCell className="max-w-[200px]">
                    <div
                      className="text-sm text-slate-700 truncate cursor-pointer hover:text-blue-600"
                      title={log.input}
                      onClick={() => setSelectedLog(log)}
                    >
                      {truncateText(log.input, 30)}
                    </div>
                  </TableCell>

                  {/* 输出 */}
                  <TableCell className="max-w-[200px]">
                    <div
                      className="text-sm text-slate-700 truncate cursor-pointer hover:text-blue-600"
                      title={log.output}
                      onClick={() => setSelectedLog(log)}
                    >
                      {truncateText(log.output, 30)}
                    </div>
                  </TableCell>

                  {/* 请求发起时间 */}
                  <TableCell className="text-sm text-slate-600">{log.timestamp}</TableCell>

                  {/* 渠道来源 */}
                  <TableCell>
                    <Badge variant={getSourceBadgeVariant(log.source)}>
                      {log.source}
                    </Badge>
                  </TableCell>

                  {/* 用户反馈 */}
                  <TableCell className="text-sm">
                    {log.userFeedback.status === "like" ? (
                      <span className="text-green-600">👍</span>
                    ) : log.userFeedback.status === "dislike" ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-red-600">👎</span>
                        {(log.userFeedback.tags && log.userFeedback.tags.length > 0) || log.userFeedback.content ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="cursor-help">
                                <AlertCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-64 p-3 text-xs text-slate-700"
                              side="right"
                              sideOffset={8}
                            >
                              <div className="space-y-2">
                                {log.userFeedback.tags && log.userFeedback.tags.length > 0 && (
                                  <div>
                                    <div className="font-medium text-slate-900 mb-1">点踩原因：</div>
                                    <div className="flex flex-wrap gap-1">
                                      {log.userFeedback.tags.map((tag, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {log.userFeedback.content && (
                                  <div>
                                    <div className="font-medium text-slate-900 mb-1">反馈内容：</div>
                                    <div className="text-slate-600 whitespace-pre-wrap">
                                      {log.userFeedback.content}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : null}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>

                  {/* 管理员反馈 */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAdminFeedback(log.id, "good")}
                        className={cn(
                          "p-1 rounded hover:bg-slate-100 transition-colors",
                          log.adminFeedback.status === "like"
                            ? "text-yellow-600"
                            : "text-slate-400"
                        )}
                        title="点赞"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAdminFeedback(log.id, "bad")}
                        className={cn(
                          "p-1 rounded hover:bg-slate-100 transition-colors",
                          log.adminFeedback.status === "dislike"
                            ? "text-slate-600"
                            : "text-slate-400"
                        )}
                        title="点踩"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>

                  {/* 操作 */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <button
                        className="text-sm text-blue-600 hover:underline"
                        onClick={() => setSelectedLog(log)}
                      >
                        查看
                      </button>
                      <button
                        className={cn(
                          "text-sm hover:underline",
                          log.status === "adopted"
                            ? "text-slate-500"
                            : "text-blue-600"
                        )}
                        onClick={() => handleAdopt(log.id)}
                      >
                        {log.status === "adopted" ? "已采纳" : "采纳"}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 详情弹窗 */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>日志详情</DialogTitle>
            <DialogDescription>会话ID: {selectedLog?.id}</DialogDescription>
          </DialogHeader>
          
          {/* 元信息 */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-4 pb-4 border-b">
            <div>
              <span className="text-slate-500">请求时间:</span>
              <span className="ml-2 text-slate-700">{selectedLog?.timestamp}</span>
            </div>
            <div>
              <span className="text-slate-500">渠道来源:</span>
              <Badge variant={getSourceBadgeVariant(selectedLog?.source || "应用广场")} className="ml-2">
                {selectedLog?.source}
              </Badge>
            </div>
          </div>

          {/* 对话历史 */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {selectedLog?.fullMessages && selectedLog.fullMessages.length > 0 ? (
              // 显示完整的对话历史（聊天气泡样式）
              <div className="space-y-4">
                {selectedLog.fullMessages.map((message, index) => {
                  if (message.role === "system") {
                    // System 消息：显示为顶部灰色提示框
                    return (
                      <div
                        key={index}
                        className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-sm text-slate-600"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-500">系统提示</span>
                        </div>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    );
                  } else if (message.role === "user") {
                    // User 消息：右侧蓝色气泡
                    return (
                      <div key={index} className="flex justify-end mb-3">
                        <div className="max-w-[75%]">
                          <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm p-4 shadow-sm">
                            {message.content && (
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {message.content}
                              </p>
                            )}
                            {message.imageUrl && (
                              <div className={message.content ? "mt-2" : ""}>
                                <img 
                                  src={message.imageUrl} 
                                  alt="User Upload" 
                                  className="max-w-[300px] w-full h-auto rounded-lg border-2 border-white/30 shadow-md bg-white/10 object-contain" 
                                  onError={(e) => {
                                    console.error("Failed to load image:", message.imageUrl);
                                    // 显示占位符而不是隐藏
                                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Crect fill='%23ccc' width='200' height='150'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3E图片加载失败%3C/text%3E%3C/svg%3E";
                                  }}
                                  onLoad={() => {
                                    console.log("Image loaded successfully:", message.imageUrl);
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 mt-1.5 block text-right px-1">用户</span>
                        </div>
                      </div>
                    );
                  } else if (message.role === "assistant") {
                    // Assistant 消息：左侧灰色/白色气泡
                    return (
                      <div key={index} className="flex justify-start mb-3">
                        <div className="max-w-[75%]">
                          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                            <div className="text-sm text-slate-800 break-words leading-relaxed">
                              {parseAgentContent(message.content)}
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 mt-1.5 block px-1">助手</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              // Fallback: 如果没有完整消息历史，显示原来的 input/output
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-2">输入</h4>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                    {selectedLog?.input}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-2">输出</h4>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                    {selectedLog?.output}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

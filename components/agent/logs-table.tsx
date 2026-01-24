"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, ChevronDown, Filter } from "lucide-react";
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
import { cn } from "@/lib/utils";

// LogEntry 类型定义
export type LogEntry = {
  id: string; // 会话ID (显示前8位)
  input: string; // 输入 (截断)
  output: string; // 输出 (截断)
  timestamp: string; // 请求发起时间 (YYYY-MM-DD HH:mm:ss)
  source: "应用广场" | "API调用" | "网页端体验" | "预览与调试"; // 渠道来源
  userFeedback: "like" | "dislike" | null; // 用户反馈
  adminFeedback: "good" | "bad" | null; // 管理员反馈 (可交互)
  status: "pending" | "adopted"; // 操作状态
};

interface LogsTableProps {
  data: LogEntry[];
}

interface LogsTableProps {
  data: LogEntry[];
  onExportClick?: () => void;
}

export function LogsTable({ data, onExportClick }: LogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>(data);

  const handleAdminFeedback = (logId: string, feedback: "good" | "bad") => {
    setLogs((prevLogs) =>
      prevLogs.map((log) => {
        if (log.id === logId) {
          // 如果点击的是当前反馈，则取消反馈；否则设置新反馈
          const newFeedback = log.adminFeedback === feedback ? null : feedback;
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
                    {log.userFeedback === "like" ? (
                      <span className="text-green-600">👍</span>
                    ) : log.userFeedback === "dislike" ? (
                      <span className="text-red-600">👎</span>
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
                          log.adminFeedback === "good"
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
                          log.adminFeedback === "bad"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>日志详情</DialogTitle>
            <DialogDescription>会话ID: {selectedLog?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
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
            <div className="grid grid-cols-2 gap-4 text-sm">
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

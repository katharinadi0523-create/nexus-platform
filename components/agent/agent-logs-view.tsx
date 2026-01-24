"use client";

import { useState } from "react";
import { Search, RefreshCcw, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogsTable, type LogEntry } from "@/components/agent/logs-table";
import { InterventionList } from "@/components/agent/intervention-list";
import { ExportLogsDialog } from "@/components/agent/export-logs-dialog";

// Mock 日志数据（转换为 LogEntry 格式）
const MOCK_FULL_LOGS: LogEntry[] = [
  {
    id: "X7pL2qK9mN3vB8wR",
    input: "请分析一下Transformer架构的核心优势",
    output: "Transformer架构的核心优势包括：1. 并行计算能力，能够同时处理整个序列；2. 长距离依赖捕获，通过自注意力机制建立全局连接；3. 训练效率高，避免了RNN的序列化计算瓶颈...",
    timestamp: "2025-01-15 14:23:45",
    source: "应用广场",
    userFeedback: "like",
    adminFeedback: null,
    status: "pending",
  },
  {
    id: "Y8qM3rL0nO4wC9xS",
    input: "RAG技术如何解决LLM的幻觉问题？",
    output: "RAG通过检索外部知识库来增强生成过程，确保回答基于经过验证的信息源，从而减少幻觉。具体来说，系统会先检索相关文档，然后将这些文档作为上下文传递给LLM...",
    timestamp: "2025-01-15 13:15:32",
    source: "API调用",
    userFeedback: null,
    adminFeedback: "good",
    status: "pending",
  },
  {
    id: "Z9rN4sM1pP5xD0yT",
    input: "什么是Agent的ReAct模式？",
    output: "ReAct模式结合了推理（Reasoning）和行动（Acting），通过交替执行思考和行动来解决问题。Agent首先思考下一步应该做什么，然后执行相应的行动，观察结果，再继续思考...",
    timestamp: "2025-01-15 12:08:19",
    source: "网页端体验",
    userFeedback: "dislike",
    adminFeedback: null,
    status: "pending",
  },
  {
    id: "A0sO5tN2qQ6yE1zU",
    input: "如何优化向量检索的召回率？",
    output: "优化向量检索召回率的方法包括：1. 使用混合检索策略，结合关键词检索和语义检索；2. 调整Top-K参数；3. 使用重排序模型对初步结果进行精细化打分；4. 优化向量模型和索引结构...",
    timestamp: "2025-01-15 11:42:07",
    source: "应用广场",
    userFeedback: "like",
    adminFeedback: "good",
    status: "adopted",
  },
  {
    id: "B1tP6uO3rR7zF2aV",
    input: "Transformer的位置编码是如何工作的？",
    output: "位置编码通过正弦和余弦函数为每个位置生成唯一的编码向量。这些向量与词嵌入相加后输入模型，使得Transformer能够理解序列中元素的相对或绝对位置...",
    timestamp: "2025-01-15 10:35:54",
    source: "API调用",
    userFeedback: null,
    adminFeedback: null,
    status: "pending",
  },
  {
    id: "C2uQ7vP4sS8aG3bW",
    input: "RAG系统中的上下文窗口如何管理？",
    output: "上下文窗口管理策略包括：按相关性排序后取Top-K、使用滑动窗口、或者通过摘要压缩来减少上下文长度。关键是平衡检索到的信息量和模型的上下文限制...",
    timestamp: "2025-01-15 09:28:41",
    source: "网页端体验",
    userFeedback: "like",
    adminFeedback: "good",
    status: "adopted",
  },
  {
    id: "D3vR8wQ5tT9bH4cX",
    input: "Agent的工具调用机制是什么？",
    output: "工具调用允许Agent通过外部工具（如API、数据库、计算器等）执行超出纯文本生成范围的操作。LLM会生成工具调用的请求，系统执行工具并返回结果，然后LLM基于结果继续生成...",
    timestamp: "2025-01-15 08:17:28",
    source: "应用广场",
    userFeedback: null,
    adminFeedback: "bad",
    status: "pending",
  },
  {
    id: "E4wS9xR6uU0cI5dY",
    input: "多头注意力机制的优势是什么？",
    output: "多头注意力通过并行运行多个注意力头，使模型能够从不同的表示子空间学习信息。每个头都有自己的Q、K、V权重矩阵，最终拼接并通过线性变换得到结果，增强了模型的表达能力...",
    timestamp: "2025-01-15 07:06:15",
    source: "API调用",
    userFeedback: "like",
    adminFeedback: null,
    status: "pending",
  },
  {
    id: "F5xT0yS7vV1dJ6eZ",
    input: "如何评估RAG系统的效果？",
    output: "评估RAG系统可以从多个维度：1. 检索质量（召回率、精确率）；2. 生成质量（相关性、准确性、流畅性）；3. 端到端效果（用户满意度、任务完成率）。常用的评估指标包括BLEU、ROUGE、语义相似度等...",
    timestamp: "2025-01-14 22:55:02",
    source: "网页端体验",
    userFeedback: null,
    adminFeedback: "good",
    status: "pending",
  },
  {
    id: "G6yU1zT8wW2eK7fA",
    input: "Transformer相比RNN的主要区别？",
    output: "主要区别：1. Transformer使用自注意力机制，能够并行处理整个序列，而RNN需要顺序处理；2. Transformer能够直接捕获长距离依赖，RNN需要通过多层和门控机制；3. Transformer训练速度更快，但参数量通常更大...",
    timestamp: "2025-01-14 21:44:49",
    source: "应用广场",
    userFeedback: "dislike",
    adminFeedback: null,
    status: "pending",
  },
  {
    id: "preview_test_001",
    input: "测试预览功能",
    output: "这是从预览与调试渠道产生的测试日志",
    timestamp: "2025-01-15 15:30:00",
    source: "预览与调试",
    userFeedback: "like",
    adminFeedback: null,
    status: "pending",
  },
];

interface LogsContentProps {
  logsSubTab: "qa-logs" | "qa-intervention";
  setLogsSubTab: (tab: "qa-logs" | "qa-intervention") => void;
  selectedLogs: Set<string>;
  setSelectedLogs: (logs: Set<string>) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
}

function LogsContent({
  logsSubTab,
  setLogsSubTab,
  selectedLogs,
  setSelectedLogs,
  currentPage,
  setCurrentPage,
  pageSize,
  searchKeyword,
  setSearchKeyword,
  dateRange,
  setDateRange,
}: LogsContentProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // 根据搜索和日期范围过滤日志
  const filteredLogs = MOCK_FULL_LOGS.filter((log) => {
    const matchesSearch =
      !searchKeyword ||
      log.input.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      log.output.toLowerCase().includes(searchKeyword.toLowerCase());

    const matchesDateRange =
      (!dateRange.start || log.timestamp >= dateRange.start) &&
      (!dateRange.end || log.timestamp <= dateRange.end + " 23:59:59");

    return matchesSearch && matchesDateRange;
  });

  const totalLogs = filteredLogs.length;
  const totalPages = Math.ceil(totalLogs / pageSize);
  const displayedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      <Tabs
        value={logsSubTab}
        onValueChange={(v) => setLogsSubTab(v as "qa-logs" | "qa-intervention")}
        className="flex flex-1 flex-col overflow-hidden"
      >
        {/* Secondary Navigation */}
        <div className="border-b border-slate-200 bg-white px-6">
          <TabsList className="bg-transparent p-0 h-auto">
            <TabsTrigger
              value="qa-logs"
              className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              问答日志
            </TabsTrigger>
            <TabsTrigger
              value="qa-intervention"
              className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              问答干预
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content Area */}
        <TabsContent value="qa-logs" className="flex-1 overflow-hidden flex flex-col m-0 mt-0">
          {/* Filters Bar */}
          <div className="flex-none border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="搜索输入/输出关键词"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Date Range Picker */}
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-40"
                  title="请选择开始日期"
                />
                <span className="text-slate-400">至</span>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-40"
                  title="请选择结束日期"
                />
              </div>

              {/* Action Buttons */}
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" disabled={selectedLogs.size === 0}>
                  批量采纳
                </Button>
                <Button onClick={() => setExportDialogOpen(true)}>导出</Button>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <LogsTable data={displayedLogs} />

          {/* Export Dialog */}
          <ExportLogsDialog
            open={exportDialogOpen}
            onOpenChange={setExportDialogOpen}
            totalCount={totalLogs}
            filteredLogs={filteredLogs}
            searchKeyword={searchKeyword}
            dateRange={dateRange}
          />

          {/* Pagination */}
          <div className="flex-none border-t border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">共 {totalLogs} 条</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="min-w-[32px]"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="text-sm text-slate-600 ml-4">{pageSize}条/页</div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm text-slate-600">前往</span>
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    className="w-16 h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const page = parseInt(e.currentTarget.value);
                        if (page >= 1 && page <= totalPages) {
                          setCurrentPage(page);
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                  />
                  <span className="text-sm text-slate-600">页</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="qa-intervention" className="flex-1 overflow-hidden m-0 mt-0">
          <InterventionList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function AgentLogsView() {
  const [logsSubTab, setLogsSubTab] = useState<"qa-logs" | "qa-intervention">("qa-logs");
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  return (
    <LogsContent
      logsSubTab={logsSubTab}
      setLogsSubTab={setLogsSubTab}
      selectedLogs={selectedLogs}
      setSelectedLogs={setSelectedLogs}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      pageSize={pageSize}
      searchKeyword={searchKeyword}
      setSearchKeyword={setSearchKeyword}
      dateRange={dateRange}
      setDateRange={setDateRange}
    />
  );
}

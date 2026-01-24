"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Search, RefreshCcw, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogsTable, type LogEntry } from "@/components/agent/logs-table";
import { InterventionList } from "@/components/agent/intervention-list";
import { ExportLogsDialog } from "@/components/agent/export-logs-dialog";
import {
  getAgentById,
  getLogsByAgentId,
  convertLogsToTableFormat,
  type LogEntry as SFTLogEntry,
} from "@/lib/agent-data";

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
  logs: LogEntry[];
  sftLogs: SFTLogEntry[];
  agentType?: "autonomous" | "workflow" | undefined;
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
  logs,
  sftLogs,
  agentType,
}: LogsContentProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // 在传递给 ExportLogsDialog 之前准备数据
  const logsForExport = Array.isArray(sftLogs) ? sftLogs : [];
  const agentTypeForExport = agentType ?? undefined;

  // 根据搜索和日期范围过滤日志
  const filteredLogs = logs.filter((log) => {
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
  const displayedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="w-40"
                  title="请选择开始日期"
                />
                <span className="text-slate-400">至</span>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
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
          <LogsTable 
            data={displayedLogs} 
            rawLogs={sftLogs}
            agentType={agentType}
          />

          {/* Export Dialog */}
          <ExportLogsDialog
            open={exportDialogOpen}
            onOpenChange={setExportDialogOpen}
            totalCount={logsForExport.length}
            filteredLogs={filteredLogs}
            searchKeyword={searchKeyword}
            dateRange={dateRange}
            logs={logsForExport}
            agentType={agentTypeForExport}
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
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
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

        <TabsContent
          value="qa-intervention"
          className="flex-1 overflow-hidden m-0 mt-0"
        >
          <InterventionList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AgentLogsPage() {
  const params = useParams();
  const agentId = params.id as string;

  const [logsSubTab, setLogsSubTab] = useState<"qa-logs" | "qa-intervention">(
    "qa-logs"
  );
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // 获取智能体信息和日志
  const agent = getAgentById(agentId);
  const sftLogs = getLogsByAgentId(agentId);
  const tableLogs = convertLogsToTableFormat(sftLogs, agent?.type);


  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            智能体不存在
          </h2>
          <p className="text-sm text-slate-600">
            未找到 ID 为 {agentId} 的智能体
          </p>
        </div>
      </div>
    );
  }

  // 确保数据正确传递
  const sftLogsToPass = Array.isArray(sftLogs) ? sftLogs : [];
  const agentTypeToPass = agent?.type ?? undefined;
  
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
      logs={tableLogs}
      sftLogs={sftLogsToPass}
      agentType={agentTypeToPass}
    />
  );
}

"use client";

import { useState, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Copy,
  CheckCircle2,
  XCircle,
  Filter,
  Grid3x3,
  ChevronDown,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { TRACE_MOCK_DATA, type Trace } from "@/lib/mock-trace-data";

const ITEMS_PER_PAGE = 20;

// 格式化延迟时间
function formatLatency(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

// 格式化数字（添加千分位）
function formatNumber(num: number): string {
  return num.toLocaleString();
}

// 复制到剪贴板
function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`已复制${label}`);
}

export default function TracePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [traces] = useState<Trace[]>(TRACE_MOCK_DATA);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const [timeRange, setTimeRange] = useState("过去3天");
  const [rootSpan, setRootSpan] = useState("Root Span");
  const [sdkUpload, setSdkUpload] = useState("SDK 上报");

  // 过滤数据
  const filteredTraces = useMemo(() => {
    return traces.filter((trace) => {
      const matchesSearch =
        trace.traceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trace.input.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trace.output.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trace.autonomousAgent?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trace.workflowAgent?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [traces, searchQuery]);

  const totalPages = Math.ceil(filteredTraces.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTraces = filteredTraces.slice(startIndex, endIndex);

  const handleRefresh = () => {
    toast.success("刷新成功");
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleGoToPage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const page = parseInt(formData.get("page") as string);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Trace</h1>
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="h-9 w-9"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {/* Menu Button */}
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Time Range */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9">
              {timeRange}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setTimeRange("过去1天")}>
              过去1天
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeRange("过去3天")}>
              过去3天
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeRange("过去7天")}>
              过去7天
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeRange("过去30天")}>
              过去30天
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Root Span */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9">
              {rootSpan}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setRootSpan("Root Span")}>
              Root Span
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRootSpan("All Spans")}>
              All Spans
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* SDK Upload */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9">
              {sdkUpload}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setSdkUpload("SDK 上报")}>
              SDK 上报
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSdkUpload("API 上报")}>
              API 上报
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSdkUpload("全部")}>
              全部
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filter Button */}
        <Button variant="outline" className="h-9">
          <Filter className="mr-2 h-4 w-4" />
          过滤器
        </Button>

        {/* Custom View */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9">
              <Grid3x3 className="mr-2 h-4 w-4" />
              自定义视图
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>默认视图</DropdownMenuItem>
            <DropdownMenuItem>紧凑视图</DropdownMenuItem>
            <DropdownMenuItem>详细视图</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索 Trace ID、Input、Output..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">TraceID</TableHead>
              <TableHead className="min-w-[200px]">Input</TableHead>
              <TableHead className="min-w-[200px]">Output</TableHead>
              <TableHead className="w-[100px]">Tokens</TableHead>
              <TableHead className="w-[120px]">Latency</TableHead>
              <TableHead className="w-[140px]">LatencyFirstResp</TableHead>
              <TableHead className="w-[150px]">StartTime</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTraces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              paginatedTraces.map((trace) => (
                <TableRow key={trace.traceId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {trace.status === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-mono text-sm">
                        {trace.traceId.slice(0, 12)}...
                      </span>
                      <button
                        onClick={() => copyToClipboard(trace.traceId, "Trace ID")}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px] truncate text-sm">
                      {trace.input}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px] truncate text-sm">
                      {trace.output}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatNumber(trace.tokens)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50"
                    >
                      <Play className="mr-1 h-3 w-3" />
                      {formatLatency(trace.latency)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {trace.latencyFirstResp !== null ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50"
                      >
                        <Play className="mr-1 h-3 w-3" />
                        {formatLatency(trace.latencyFirstResp)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {trace.startTime}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredTraces.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {filteredTraces.length} 条
          </div>
          <div className="flex items-center gap-4">
            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <span>‹</span>
              </Button>
              {Array.from({ length: Math.min(4, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 4) {
                  pageNum = i + 1;
                } else if (currentPage <= 2) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 1) {
                  pageNum = totalPages - 3 + i;
                } else {
                  pageNum = currentPage - 1 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <span>›</span>
              </Button>
            </div>

            {/* Items Per Page */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  {itemsPerPage}条/页
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setItemsPerPage(10)}>
                  10条/页
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setItemsPerPage(20)}>
                  20条/页
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setItemsPerPage(50)}>
                  50条/页
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Go To Page */}
            <form onSubmit={handleGoToPage} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">前往</span>
              <Input
                name="page"
                type="number"
                min={1}
                max={totalPages}
                defaultValue={currentPage}
                className="w-16 h-8 text-center"
              />
              <span className="text-sm text-muted-foreground">页</span>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

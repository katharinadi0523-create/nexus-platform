"use client";

import { useState } from "react";
import { X, Download, Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// 导出记录类型定义
export interface ExportRecord {
  id: string; // 导出任务ID
  status: "success" | "exporting" | "failed"; // 导出状态
  format: ".jsonl" | ".xlsx" | ".csv"; // 导出格式
  sampleCount: number; // 样本数
  fileSize: string; // 文件大小
  operator: string; // 操作人
  startTime: string; // 导出开始时间
  endTime: string; // 导出结束时间
  exportTo?: string; // 导出至（仅用于导出至数据目录）
}

interface ExportRecordsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock 数据：导出为文件的记录
const MOCK_FILE_RECORDS: ExportRecord[] = [
  {
    id: "X7pL2qK9mN3vB8wR",
    status: "success",
    format: ".jsonl",
    sampleCount: 10,
    fileSize: "0.02M",
    operator: "name wang",
    startTime: "2025-05-05 05:05:05",
    endTime: "2025-05-05 05:05:05",
  },
  {
    id: "Y8qM3rL0nO4wC9xS",
    status: "exporting",
    format: ".xlsx",
    sampleCount: 10000,
    fileSize: "131.42KB",
    operator: "name wang",
    startTime: "2025-05-05 05:05:05",
    endTime: "2025-05-05 05:05:05",
  },
  {
    id: "Z9rN4sM1pP5xD0yT",
    status: "failed",
    format: ".jsonl",
    sampleCount: 1,
    fileSize: "931.31KB",
    operator: "name wang",
    startTime: "2025-05-05 05:05:05",
    endTime: "2025-05-05 05:05:05",
  },
  {
    id: "A0sO5tN2qQ6yE1zU",
    status: "exporting",
    format: ".xlsx",
    sampleCount: 5000,
    fileSize: "0.123M",
    operator: "name wang",
    startTime: "2025-05-05 05:05:05",
    endTime: "2025-05-05 05:05:05",
  },
  {
    id: "B1tP6uO3rR7zF2aV",
    status: "success",
    format: ".jsonl",
    sampleCount: 100,
    fileSize: "2KB",
    operator: "name wang",
    startTime: "2025-05-05 05:05:05",
    endTime: "2025-05-05 05:05:05",
  },
];

// Mock 数据：导出至数据目录的记录
const MOCK_CATALOG_RECORDS: ExportRecord[] = [
  {
    id: "C2uQ7vP4sS8aG3bW",
    status: "success",
    format: ".jsonl",
    sampleCount: 1000,
    fileSize: "50.2KB",
    operator: "name wang",
    startTime: "2025-05-05 05:05:05",
    endTime: "2025-05-05 05:05:05",
    exportTo: "情报数据目录/数据卷/vol-001",
  },
  {
    id: "D3vR8wQ5tT9bH4cX",
    status: "exporting",
    format: ".xlsx",
    sampleCount: 5000,
    fileSize: "200KB",
    operator: "name wang",
    startTime: "2025-05-05 05:05:05",
    endTime: "2025-05-05 05:05:05",
    exportTo: "金融数据目录/数据卷/vol-finance-001",
  },
  {
    id: "E4wS9xR6uU0cI5dY",
    status: "failed",
    format: ".jsonl",
    sampleCount: 100,
    fileSize: "5KB",
    operator: "name wang",
    startTime: "2025-05-05 05:05:05",
    endTime: "2025-05-05 05:05:05",
    exportTo: "通用数据目录/数据卷/vol-general-001",
  },
];

// 生成更多Mock数据（用于分页）
const generateMockRecords = (baseRecords: ExportRecord[], count: number): ExportRecord[] => {
  const records: ExportRecord[] = [];
  for (let i = 0; i < count; i++) {
    const base = baseRecords[i % baseRecords.length];
    records.push({
      ...base,
      id: `${base.id}-${i}`,
      sampleCount: Math.floor(Math.random() * 10000) + 1,
      fileSize: `${(Math.random() * 100).toFixed(2)}KB`,
    });
  }
  return records;
};

const ALL_FILE_RECORDS = generateMockRecords(MOCK_FILE_RECORDS, 50);
const ALL_CATALOG_RECORDS = generateMockRecords(MOCK_CATALOG_RECORDS, 30);

export function ExportRecordsDialog({ open, onOpenChange }: ExportRecordsDialogProps) {
  const [activeTab, setActiveTab] = useState<"file" | "catalog">("file");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<"sampleCount" | "fileSize" | "startTime" | "endTime" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // 根据当前Tab获取记录
  const allRecords = activeTab === "file" ? ALL_FILE_RECORDS : ALL_CATALOG_RECORDS;

  // 切换Tab时重置到第一页
  const handleTabChange = (tab: "file" | "catalog") => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSortField(null);
  };

  // 排序
  const sortedRecords = [...allRecords].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: number | string;
    let bValue: number | string;

    switch (sortField) {
      case "sampleCount":
        aValue = a.sampleCount;
        bValue = b.sampleCount;
        break;
      case "fileSize":
        // 转换文件大小为数字（KB）
        aValue = parseFloat(a.fileSize.replace(/[^0-9.]/g, "")) || 0;
        bValue = parseFloat(b.fileSize.replace(/[^0-9.]/g, "")) || 0;
        break;
      case "startTime":
      case "endTime":
        aValue = a[sortField];
        bValue = b[sortField];
        break;
      default:
        return 0;
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    } else {
      return sortDirection === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    }
  });

  // 分页
  const totalPages = Math.ceil(sortedRecords.length / pageSize);
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 处理排序
  const handleSort = (field: "sampleCount" | "fileSize" | "startTime" | "endTime") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // 获取状态Badge
  const getStatusBadge = (status: ExportRecord["status"]) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 inline-block" />
            导出成功
          </Badge>
        );
      case "exporting":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5 inline-block" />
            导出中
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5 inline-block" />
            导出失败
          </Badge>
        );
    }
  };

  // 处理下载
  const handleDownload = (record: ExportRecord) => {
    // TODO: 实现下载逻辑
    console.log("下载记录:", record);
  };

  // 处理删除
  const handleDelete = (record: ExportRecord) => {
    // TODO: 实现删除逻辑
    console.log("删除记录:", record);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>导出记录</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as "file" | "catalog")} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4 border-b">
            <TabsList className="bg-transparent p-0 h-auto">
              <TabsTrigger
                value="file"
                className="px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                导出至文件
              </TabsTrigger>
              <TabsTrigger
                value="catalog"
                className="px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                导出至数据目录
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="file" className="flex-1 overflow-hidden flex flex-col m-0 mt-0">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-32">导出任务ID</TableHead>
                      <TableHead className="w-28">导出状态</TableHead>
                      <TableHead className="w-24">
                        <button
                          onClick={() => handleSort("sampleCount")}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          样本数
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="w-24">
                        <button
                          onClick={() => handleSort("fileSize")}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          文件大小
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="w-24">操作人</TableHead>
                      <TableHead className="w-40">
                        <button
                          onClick={() => handleSort("startTime")}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          导出开始时间
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="w-40">
                        <button
                          onClick={() => handleSort("endTime")}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          导出结束时间
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="w-32">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-sm text-slate-600">
                            {record.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell className="text-sm">{record.sampleCount.toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{record.fileSize}</TableCell>
                          <TableCell className="text-sm">{record.operator}</TableCell>
                          <TableCell className="text-sm">{record.startTime}</TableCell>
                          <TableCell className="text-sm">{record.endTime}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleDownload(record)}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                disabled={record.status === "exporting" || record.status === "failed"}
                              >
                                下载
                              </button>
                              <button
                                onClick={() => handleDelete(record)}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                删除
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* 分页 */}
            <div className="border-t px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">共 {sortedRecords.length} 条</div>
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
                    let pageNum: number;
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
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="text-sm text-slate-400">...</span>
                  )}
                  {totalPages > 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="min-w-[32px]"
                    >
                      {totalPages}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="text-sm text-slate-600 ml-4">{pageSize}条/页</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="catalog" className="flex-1 overflow-hidden flex flex-col m-0 mt-0">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-32">导出任务ID</TableHead>
                      <TableHead className="w-28">导出状态</TableHead>
                      <TableHead className="w-24">
                        <button
                          onClick={() => handleSort("sampleCount")}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          样本数
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="w-24">
                        <button
                          onClick={() => handleSort("fileSize")}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          文件大小
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="w-32">导出至</TableHead>
                      <TableHead className="w-24">操作人</TableHead>
                      <TableHead className="w-40">
                        <button
                          onClick={() => handleSort("startTime")}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          导出开始时间
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="w-40">
                        <button
                          onClick={() => handleSort("endTime")}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          导出结束时间
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-sm text-slate-600">
                            {record.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell className="text-sm">{record.sampleCount.toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{record.fileSize}</TableCell>
                          <TableCell className="text-sm text-slate-700">
                            {record.exportTo || "-"}
                          </TableCell>
                          <TableCell className="text-sm">{record.operator}</TableCell>
                          <TableCell className="text-sm">{record.startTime}</TableCell>
                          <TableCell className="text-sm">{record.endTime}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* 分页 */}
            <div className="border-t px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">共 {sortedRecords.length} 条</div>
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
                    let pageNum: number;
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
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="text-sm text-slate-400">...</span>
                  )}
                  {totalPages > 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="min-w-[32px]"
                    >
                      {totalPages}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="text-sm text-slate-600 ml-4">{pageSize}条/页</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Search, Plus, RefreshCw, ArrowUpDown, HelpCircle, Copy, Eye, Download, Trash2 } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface KeywordLibrary {
  id: string;
  name: string;
  libraryId: string;
  keywordCount: number;
  applicationStatus: "applied" | "not_applied";
  type: "whitelist" | "blacklist";
  creator: string;
  updateTime: string;
}

const mockKeywordLibraries: KeywordLibrary[] = [
  {
    id: "1",
    name: "科研白名单",
    libraryId: "lib-research-whitelist-001",
    keywordCount: 156,
    applicationStatus: "applied",
    type: "whitelist",
    creator: "张科研",
    updateTime: "2026-01-28 14:32:15",
  },
  {
    id: "2",
    name: "医疗白名单",
    libraryId: "lib-medical-whitelist-002",
    keywordCount: 234,
    applicationStatus: "applied",
    type: "whitelist",
    creator: "李医生",
    updateTime: "2026-01-28 10:15:42",
  },
  {
    id: "3",
    name: "金融敏感词黑名单",
    libraryId: "lib-finance-blacklist-003",
    keywordCount: 89,
    applicationStatus: "applied",
    type: "blacklist",
    creator: "王金融",
    updateTime: "2026-01-27 16:45:30",
  },
  {
    id: "4",
    name: "教育领域白名单",
    libraryId: "lib-education-whitelist-004",
    keywordCount: 312,
    applicationStatus: "applied",
    type: "whitelist",
    creator: "陈教育",
    updateTime: "2026-01-27 09:20:18",
  },
  {
    id: "5",
    name: "政治敏感词黑名单",
    libraryId: "lib-politics-blacklist-005",
    keywordCount: 67,
    applicationStatus: "applied",
    type: "blacklist",
    creator: "管理员1",
    updateTime: "2026-01-26 18:55:22",
  },
  {
    id: "6",
    name: "法律术语白名单",
    libraryId: "lib-legal-whitelist-006",
    keywordCount: 198,
    applicationStatus: "not_applied",
    type: "whitelist",
    creator: "赵律师",
    updateTime: "2026-01-25 11:30:45",
  },
  {
    id: "7",
    name: "社交媒体违规词黑名单",
    libraryId: "lib-social-blacklist-007",
    keywordCount: 145,
    applicationStatus: "applied",
    type: "blacklist",
    creator: "周运营",
    updateTime: "2026-01-24 15:12:33",
  },
  {
    id: "8",
    name: "技术术语白名单",
    libraryId: "lib-tech-whitelist-008",
    keywordCount: 267,
    applicationStatus: "applied",
    type: "whitelist",
    creator: "吴工程师",
    updateTime: "2026-01-23 13:45:10",
  },
  {
    id: "9",
    name: "GFJG",
    libraryId: "lib-5w8wvkd5",
    keywordCount: 1,
    applicationStatus: "not_applied",
    type: "whitelist",
    creator: "管理员1",
    updateTime: "2026-01-27 21:26:50",
  },
  {
    id: "10",
    name: "微博黑名单",
    libraryId: "lib-dymameub",
    keywordCount: 1,
    applicationStatus: "not_applied",
    type: "blacklist",
    creator: "管理员1",
    updateTime: "2026-01-27 21:26:20",
  },
];

const ITEMS_PER_PAGE = 10;

export default function KeywordLibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [keywordLibraries] = useState<KeywordLibrary[]>(mockKeywordLibraries);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);

  const filteredLibraries = keywordLibraries.filter(
    (lib) =>
      lib.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lib.libraryId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredLibraries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLibraries = filteredLibraries.slice(startIndex, endIndex);

  const handleRefresh = () => {
    toast.success("刷新成功");
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("已复制到剪贴板");
  };

  const handleView = (id: string) => {
    toast.info(`查看详情: ${id}`);
  };

  const handleExport = (id: string) => {
    toast.success(`导出词库: ${id}`);
  };

  const handleDelete = (lib: KeywordLibrary) => {
    toast.success(`已删除：${lib.name}`);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">关键词库</h1>
        <p className="text-sm text-muted-foreground">
          通过配置黑名单和白名单,实现对大模型输入输出的敏感词精准识别与过滤,既能拦截风险,又能豁免安全关键词
        </p>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="请输入词库名称/ID搜索"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="h-9 w-9 rounded-full"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Create Button */}
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            创建关键词库
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>词库名称</TableHead>
              <TableHead>词库ID</TableHead>
              <TableHead>关键词数量</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  应用状态
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="cursor-help">
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2 text-xs">
                      应用状态说明
                    </PopoverContent>
                  </Popover>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  类型
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="cursor-help">
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2 text-xs">
                      类型说明
                    </PopoverContent>
                  </Popover>
                </div>
              </TableHead>
              <TableHead>创建人</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  更新时间
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLibraries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              paginatedLibraries.map((lib) => (
                <TableRow key={lib.id}>
                  <TableCell className="font-medium">{lib.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{lib.libraryId}</span>
                      <button
                        onClick={() => handleCopyId(lib.libraryId)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>{lib.keywordCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          lib.applicationStatus === "applied" ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      <span className="text-sm">
                        {lib.applicationStatus === "applied" ? "已应用" : "未应用"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                        lib.type === "whitelist"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {lib.type === "whitelist" ? "白名单词库" : "黑名单词库"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{lib.creator}</TableCell>
                  <TableCell className="text-muted-foreground">{lib.updateTime}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleView(lib.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        详情
                      </button>
                      <button
                        onClick={() => handleExport(lib.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        导出
                      </button>
                      <button
                        onClick={() => handleDelete(lib)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
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

      {/* Pagination */}
      {filteredLibraries.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {filteredLibraries.length} 条
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
              <Button
                variant="default"
                size="sm"
                className="h-8 w-8"
              >
                {currentPage}
              </Button>
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
          </div>
        </div>
      )}
    </div>
  );
}

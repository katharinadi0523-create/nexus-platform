"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, RefreshCw, Eye, Edit, Trash2, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TermBank {
  id: string;
  name: string;
  count: number;
  description: string;
  creator: string;
  updateTime: string;
  createTime: string;
}

const mockTermBanks: TermBank[] = [
  {
    id: "1",
    name: "耐糖量测试",
    count: 10,
    description: "我是描述",
    creator: "阿星",
    updateTime: "2025-05-05 05:05:05",
    createTime: "2025-05-05 05:05:05",
  },
  {
    id: "2",
    name: "耐糖量测试2",
    count: 1000,
    description: "我是描述我是描述我是描述我是描述我是描述我是描述我是描述我是描述",
    creator: "阿星ing1111",
    updateTime: "2025-05-05 05:05:05",
    createTime: "2025-05-05 05:05:05",
  },
  {
    id: "3",
    name: "耐糖量测试耐糖量测试",
    count: 1000,
    description: "我是描述",
    creator: "阿星",
    updateTime: "2025-05-05 05:05:05",
    createTime: "2025-05-05 05:05:05",
  },
  {
    id: "4",
    name: "耐糖量测试6546",
    count: 1000,
    description: "我是描述",
    creator: "阿星",
    updateTime: "2025-05-05 05:05:05",
    createTime: "2025-05-05 05:05:05",
  },
  {
    id: "5",
    name: "耐糖量测试/845",
    count: 1000,
    description: "我是描述",
    creator: "阿星",
    updateTime: "2025-05-05 05:05:05",
    createTime: "2025-05-05 05:05:05",
  },
  {
    id: "6",
    name: "耐糖量测试855",
    count: 1000,
    description: "我是描述",
    creator: "阿星",
    updateTime: "2025-05-05 05:05:05",
    createTime: "2025-05-05 05:05:05",
  },
];

const ITEMS_PER_PAGE = 20;

export default function TermBankPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [termBanks] = useState<TermBank[]>(mockTermBanks);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);

  const filteredTermBanks = termBanks.filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTermBanks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTermBanks = filteredTermBanks.slice(startIndex, endIndex);

  const handleRefresh = () => {
    toast.success("刷新成功");
  };

  const handleView = (id: string) => {
    // Navigation handled by Link
  };

  const handleEdit = (id: string) => {
    // Navigation handled by Link
  };

  const handleDelete = (bank: TermBank) => {
    toast.success(`已删除：${bank.name}`);
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
        <h1 className="text-2xl font-semibold">术语库</h1>
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索术语库名称"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>

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
            创建术语库
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>词库名称</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  词条数量
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead>描述</TableHead>
              <TableHead>创建人</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  更新时间
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  创建时间
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTermBanks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              paginatedTermBanks.map((bank) => (
                <TableRow key={bank.id}>
                  <TableCell className="font-medium">{bank.name}</TableCell>
                  <TableCell>{bank.count}</TableCell>
                  <TableCell className="text-muted-foreground max-w-md truncate">
                    {bank.description}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{bank.creator}</TableCell>
                  <TableCell className="text-muted-foreground">{bank.updateTime}</TableCell>
                  <TableCell className="text-muted-foreground">{bank.createTime}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/term-bank/${bank.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        查看
                      </Link>
                      <Link
                        href={`/term-bank/${bank.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete(bank)}
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
      {filteredTermBanks.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {filteredTermBanks.length} 条
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
                    className="h-8 w-8"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span className="px-2 text-muted-foreground">...</span>
              )}
              {totalPages > 5 && (
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(totalPages)}
                >
                  {totalPages}
                </Button>
              )}
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

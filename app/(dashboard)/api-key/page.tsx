"use client";

import { useState, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Plus,
  Eye,
  EyeOff,
  Info,
  Edit,
  Trash2,
  Ban,
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
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

interface ApiKey {
  id: string;
  name: string;
  apiKey: string;
  status: "enabled" | "disabled";
  description: string;
  organization: string;
  project: string;
  creator: string;
  createdAt: string;
  lastUsedAt: string | null;
}

const MOCK_API_KEYS: ApiKey[] = [
  {
    id: "1",
    name: "ccx",
    apiKey: "5500a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1fd0",
    status: "enabled",
    description: "用于生产环境的API密钥，用于访问核心业务系统",
    organization: "组织2",
    project: "项目A",
    creator: "张三",
    createdAt: "2024-01-15 10:30:00",
    lastUsedAt: "2024-01-20 14:25:00",
  },
  {
    id: "2",
    name: "测试",
    apiKey: "347e8f9a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0d1cc",
    status: "enabled",
    description: "测试环境使用的API密钥，用于开发和调试",
    organization: "组织2",
    project: "项目B",
    creator: "李四",
    createdAt: "2024-01-10 09:15:00",
    lastUsedAt: "2024-01-19 16:45:00",
  },
  {
    id: "3",
    name: "测试apikey",
    apiKey: "ec34a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g6cfc",
    status: "disabled",
    description: "已废弃的测试密钥，不再使用",
    organization: "组织2",
    project: "项目C",
    creator: "王五",
    createdAt: "2023-12-20 11:20:00",
    lastUsedAt: null,
  },
  {
    id: "4",
    name: "生产环境主密钥",
    apiKey: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6",
    status: "enabled",
    description: "生产环境的主要API密钥，具有最高权限，用于访问所有核心业务系统的API服务，包括用户管理、订单处理、支付系统等",
    organization: "组织1",
    project: "项目A",
    creator: "赵六",
    createdAt: "2024-01-05 08:00:00",
    lastUsedAt: "2024-01-20 18:30:00",
  },
  {
    id: "5",
    name: "数据分析专用密钥",
    apiKey: "f9e8d7c6b5a4g3h2i1j0k9l8m7n6o5p4q3r2s1t0u9v8w7x6y5z4a3b2c1d0e9f8g7h6i5j4",
    status: "enabled",
    description: "专门用于数据分析服务的API密钥，仅具有读取权限",
    organization: "组织1",
    project: "项目B",
    creator: "孙七",
    createdAt: "2024-01-12 14:20:00",
    lastUsedAt: "2024-01-20 12:15:00",
  },
];

const ITEMS_PER_PAGE = 10;

// Mock 组织和项目数据
const ORGANIZATIONS = [
  { value: "组织1", label: "组织1" },
  { value: "组织2", label: "组织2" },
];

const PROJECTS = [
  { value: "项目A", label: "项目A" },
  { value: "项目B", label: "项目B" },
  { value: "项目C", label: "项目C" },
  { value: "dataset", label: "dataset" },
];

// 生成随机 API Key
function generateApiKey(): string {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 格式化日期时间
function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 格式化 API Key 显示（只显示前4位和后4位）
function formatApiKey(key: string, visible: boolean): string {
  if (visible) {
    return key;
  }
  if (key.length <= 8) {
    return key;
  }
  return `${key.slice(0, 4)}${"*".repeat(8)}${key.slice(-4)}`;
}

export default function ApiKeyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(MOCK_API_KEYS);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: "",
    organization: "组织2",
    project: "dataset",
    description: "",
  });
  
  const [nameCharCount, setNameCharCount] = useState(0);
  const [descriptionCharCount, setDescriptionCharCount] = useState(0);

  // 过滤数据
  const filteredApiKeys = useMemo(() => {
    return apiKeys.filter((key) => {
      const matchesSearch = key.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [apiKeys, searchQuery]);

  const totalPages = Math.ceil(filteredApiKeys.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApiKeys = filteredApiKeys.slice(startIndex, endIndex);

  const handleRefresh = () => {
    toast.success("刷新成功");
  };

  const handleCreateApiKey = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    // 重置表单
    setFormData({
      name: "",
      organization: "组织2",
      project: "dataset",
      description: "",
    });
    setNameCharCount(0);
    setDescriptionCharCount(0);
  };

  const handleSubmit = () => {
    // 验证必填字段
    if (!formData.name.trim()) {
      toast.error("请输入名称");
      return;
    }
    if (!formData.organization) {
      toast.error("请选择所属组织");
      return;
    }
    if (!formData.project) {
      toast.error("请选择所属项目");
      return;
    }
    if (formData.name.length > 50) {
      toast.error("名称不能超过50个字符");
      return;
    }
    if (formData.description.length > 200) {
      toast.error("描述不能超过200个字符");
      return;
    }

    // 生成新的 API Key
    const newApiKey: ApiKey = {
      id: String(Date.now()),
      name: formData.name.trim(),
      apiKey: generateApiKey(),
      status: "enabled",
      description: formData.description.trim(),
      organization: formData.organization,
      project: formData.project,
      creator: "当前用户", // 可以从用户上下文获取
      createdAt: formatDateTime(new Date()),
      lastUsedAt: null,
    };

    // 添加到列表（添加到最前面）
    setApiKeys([newApiKey, ...apiKeys]);
    toast.success("API Key 创建成功");
    handleCloseDialog();
    
    // 重置到第一页
    setCurrentPage(1);
  };

  const handleNameChange = (value: string) => {
    if (value.length <= 50) {
      setFormData({ ...formData, name: value });
      setNameCharCount(value.length);
    }
  };

  const handleDescriptionChange = (value: string) => {
    if (value.length <= 200) {
      setFormData({ ...formData, description: value });
      setDescriptionCharCount(value.length);
    }
  };

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const handleEdit = (id: string) => {
    toast.info(`编辑 API Key: ${id}`);
  };

  const handleDisable = (id: string) => {
    toast.warning(`禁用 API Key: ${id}`);
  };

  const handleDelete = (id: string) => {
    toast.error(`删除 API Key: ${id}`);
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
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">API Key管理</h1>
        
        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed">
            API Key是用于身份验证的一串唯一身份代码，归属于组织下特定的项目，用户可使用此凭证访问特定项目下多个业务系统的API服务，应妥善保管以防泄露。
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-[300px]">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索名称"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pr-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="h-9 w-9"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleCreateApiKey} className="h-9">
            <Plus className="mr-2 h-4 w-4" />
            创建API Key
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">名称</TableHead>
                <TableHead className="min-w-[200px]">API Key</TableHead>
                <TableHead className="min-w-[100px]">状态</TableHead>
                <TableHead className="min-w-[200px]">描述</TableHead>
                <TableHead className="min-w-[120px]">所属组织</TableHead>
                <TableHead className="min-w-[120px]">所属项目</TableHead>
                <TableHead className="min-w-[100px]">创建人</TableHead>
                <TableHead className="min-w-[160px]">创建时间</TableHead>
                <TableHead className="min-w-[160px]">上次使用时间</TableHead>
                <TableHead className="sticky right-0 bg-white z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] min-w-[150px] text-right">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedApiKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                paginatedApiKeys.map((key) => {
                  const isVisible = visibleKeys.has(key.id);
                  return (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {formatApiKey(key.apiKey, isVisible)}
                          </span>
                          <button
                            onClick={() => toggleKeyVisibility(key.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            type="button"
                          >
                            {isVisible ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              key.status === "enabled"
                                ? "bg-green-500"
                                : "bg-red-500"
                            )}
                          />
                          <span className="text-sm">
                            {key.status === "enabled" ? "启用中" : "已禁用"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px] truncate text-sm text-muted-foreground">
                          {key.description || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{key.organization}</TableCell>
                      <TableCell className="text-sm">{key.project}</TableCell>
                      <TableCell className="text-sm">{key.creator}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {key.createdAt}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {key.lastUsedAt || "-"}
                      </TableCell>
                      <TableCell className="sticky right-0 bg-white z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleEdit(key.id)}
                            className="text-blue-600 hover:text-blue-700 text-sm transition-colors"
                            type="button"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDisable(key.id)}
                            className="text-orange-600 hover:text-orange-700 text-sm transition-colors"
                            type="button"
                          >
                            禁用
                          </button>
                          <button
                            onClick={() => handleDelete(key.id)}
                            className="text-red-600 hover:text-red-700 text-sm transition-colors"
                            type="button"
                          >
                            删除
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {filteredApiKeys.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {filteredApiKeys.length} 条
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

      {/* Create API Key Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            // 关闭时重置表单
            setFormData({
              name: "",
              organization: "组织2",
              project: "dataset",
              description: "",
            });
            setNameCharCount(0);
            setDescriptionCharCount(0);
          }
          setIsCreateDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>创建API Key</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* 名称 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="name" className="text-sm font-medium">
                  <span className="text-red-500">*</span> 名称:
                </Label>
                <span className="text-xs text-muted-foreground">
                  {nameCharCount}/50
                </span>
              </div>
              <Input
                id="name"
                placeholder="请输入名称"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                可使用中文、英文及数字,50个字以内
              </p>
            </div>

            {/* 所属组织 */}
            <div className="space-y-2">
              <Label htmlFor="organization" className="text-sm font-medium">
                <span className="text-red-500">*</span> 所属组织:
              </Label>
              <Select
                value={formData.organization}
                onValueChange={(value) =>
                  setFormData({ ...formData, organization: value })
                }
                options={ORGANIZATIONS}
                placeholder="请选择所属组织"
              />
            </div>

            {/* 所属项目 */}
            <div className="space-y-2">
              <Label htmlFor="project" className="text-sm font-medium">
                <span className="text-red-500">*</span> 所属项目:
              </Label>
              <Select
                value={formData.project}
                onValueChange={(value) =>
                  setFormData({ ...formData, project: value })
                }
                options={PROJECTS}
                placeholder="请选择所属项目"
              />
            </div>

            {/* 描述 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-sm font-medium">
                  描述:
                </Label>
                <span className="text-xs text-muted-foreground">
                  {descriptionCharCount}/200
                </span>
              </div>
              <Textarea
                id="description"
                placeholder="请输入描述"
                value={formData.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                maxLength={200}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              className="border-blue-200"
            >
              取消
            </Button>
            <Button onClick={handleSubmit}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

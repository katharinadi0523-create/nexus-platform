"use client";

import { useState, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Plus,
  Info,
  Edit,
  Trash2,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Tag {
  id: string;
  name: string;
  values: string[];
  description: string;
  creator: string;
  createdAt: string;
}

const MOCK_TAGS: Tag[] = [
  {
    id: "1",
    name: "测试信息",
    values: ["测试信息", "招聘信息"],
    description: "1",
    creator: "test",
    createdAt: "2026-01-16 14:14:27",
  },
  {
    id: "2",
    name: "数据信息",
    values: ["数据3", "数据2", "数据1"],
    description: "测试",
    creator: "test",
    createdAt: "2026-01-16 11:06:19",
  },
  {
    id: "3",
    name: "产品分类",
    values: ["电子产品", "家居用品", "服装配饰"],
    description: "用于产品分类的标签",
    creator: "管理员1",
    createdAt: "2026-01-15 09:30:15",
  },
  {
    id: "4",
    name: "优先级",
    values: ["高", "中", "低"],
    description: "任务优先级标签",
    creator: "管理员1",
    createdAt: "2026-01-14 16:45:22",
  },
  {
    id: "5",
    name: "状态",
    values: ["进行中", "已完成", "已取消"],
    description: "任务状态标签",
    creator: "test",
    createdAt: "2026-01-13 10:20:33",
  },
  {
    id: "6",
    name: "奶茶种类",
    values: ["星巴克", "沪上阿姨", "茶白道", "蜜雪冰城", "1+"],
    description: "t",
    creator: "管理员1",
    createdAt: "2025-12-29 14:10:42",
  },
  {
    id: "7",
    name: "部门",
    values: ["技术部", "产品部", "运营部", "市场部"],
    description: "公司部门分类",
    creator: "管理员1",
    createdAt: "2025-12-28 11:25:18",
  },
  {
    id: "8",
    name: "地区",
    values: ["北京", "上海", "广州", "深圳", "杭州"],
    description: "城市地区标签",
    creator: "test",
    createdAt: "2025-12-27 15:50:09",
  },
  {
    id: "9",
    name: "项目类型",
    values: ["Web开发", "移动应用", "数据分析"],
    description: "项目分类标签",
    creator: "管理员1",
    createdAt: "2025-12-26 09:15:27",
  },
  {
    id: "10",
    name: "难度等级",
    values: ["简单", "中等", "困难"],
    description: "任务难度等级",
    creator: "test",
    createdAt: "2025-12-25 13:40:55",
  },
  {
    id: "11",
    name: "客户类型",
    values: ["企业客户", "个人客户", "VIP客户"],
    description: "客户分类标签",
    creator: "管理员1",
    createdAt: "2025-12-24 10:30:12",
  },
  {
    id: "12",
    name: "文档类型",
    values: ["技术文档", "产品文档", "用户手册"],
    description: "文档分类",
    creator: "test",
    createdAt: "2025-12-23 14:20:38",
  },
  {
    id: "13",
    name: "版本",
    values: ["v1.0", "v2.0", "v3.0", "beta"],
    description: "版本标签",
    creator: "管理员1",
    createdAt: "2025-12-22 16:55:44",
  },
  {
    id: "14",
    name: "紧急程度",
    values: ["紧急", "重要", "一般"],
    description: "任务紧急程度",
    creator: "test",
    createdAt: "2025-12-21 11:10:20",
  },
];

const ITEMS_PER_PAGE = 10;

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

export default function TagManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tags, setTags] = useState<Tag[]>(MOCK_TAGS);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: "",
    values: [] as string[],
    description: "",
  });
  const [newValue, setNewValue] = useState("");

  // 过滤数据
  const filteredTags = useMemo(() => {
    return tags.filter((tag) => {
      const matchesName = tag.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesValues = tag.values.some((value) =>
        value.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return matchesName || matchesValues;
    });
  }, [tags, searchQuery]);

  const totalPages = Math.ceil(filteredTags.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTags = filteredTags.slice(startIndex, endIndex);

  const handleRefresh = () => {
    toast.success("刷新成功");
  };

  const handleCreateTag = () => {
    setIsCreateDialogOpen(true);
    setFormData({
      name: "",
      values: [],
      description: "",
    });
    setNewValue("");
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      values: [...tag.values],
      description: tag.description,
    });
    setNewValue("");
    setIsEditDialogOpen(true);
  };

  const handleDeleteTag = (id: string) => {
    if (confirm("确定要删除这个标签吗？")) {
      setTags(tags.filter((tag) => tag.id !== id));
      toast.success("标签删除成功");
    }
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setFormData({
      name: "",
      values: [],
      description: "",
    });
    setNewValue("");
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingTag(null);
    setFormData({
      name: "",
      values: [],
      description: "",
    });
    setNewValue("");
  };

  const handleSubmitCreate = () => {
    if (!formData.name.trim()) {
      toast.error("请输入标签名称");
      return;
    }
    if (formData.values.length === 0) {
      toast.error("请至少添加一个标签值");
      return;
    }

    const newTag: Tag = {
      id: String(Date.now()),
      name: formData.name.trim(),
      values: formData.values,
      description: formData.description.trim(),
      creator: "当前用户", // 可以从用户上下文获取
      createdAt: formatDateTime(new Date()),
    };

    setTags([newTag, ...tags]);
    toast.success("标签创建成功");
    handleCloseCreateDialog();
    setCurrentPage(1);
  };

  const handleSubmitEdit = () => {
    if (!formData.name.trim()) {
      toast.error("请输入标签名称");
      return;
    }
    if (formData.values.length === 0) {
      toast.error("请至少添加一个标签值");
      return;
    }
    if (!editingTag) return;

    setTags(
      tags.map((tag) =>
        tag.id === editingTag.id
          ? {
              ...tag,
              name: formData.name.trim(),
              values: formData.values,
              description: formData.description.trim(),
            }
          : tag
      )
    );
    toast.success("标签更新成功");
    handleCloseEditDialog();
  };

  const handleAddValue = () => {
    if (!newValue.trim()) {
      toast.error("请输入标签值");
      return;
    }
    if (formData.values.includes(newValue.trim())) {
      toast.error("标签值已存在");
      return;
    }
    setFormData({
      ...formData,
      values: [...formData.values, newValue.trim()],
    });
    setNewValue("");
  };

  const handleRemoveValue = (value: string) => {
    setFormData({
      ...formData,
      values: formData.values.filter((v) => v !== value),
    });
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
        <h1 className="text-2xl font-bold">标签管理</h1>

        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed">
            标签管理功能核心用于辅助知识库检索,以及对数据资产进行打标绑定与资源分类统计,以键值对(Key-Value)为基础形态,为多个平台提供统一的标签管控入口,核心支持标签的创建、查询、编辑与删除操作。
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-[400px]">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索标签及标签值"
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
          <Button onClick={handleCreateTag} className="h-9">
            <Plus className="mr-2 h-4 w-4" />
            添加标签
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">标签名称</TableHead>
              <TableHead className="min-w-[200px]">标签值</TableHead>
              <TableHead className="min-w-[200px]">标签描述</TableHead>
              <TableHead className="min-w-[100px]">创建人</TableHead>
              <TableHead className="min-w-[160px]">创建时间</TableHead>
              <TableHead className="min-w-[120px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              paginatedTags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {tag.values.map((value, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-gray-100 text-gray-700 border-gray-200"
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px] truncate text-sm text-muted-foreground">
                      {tag.description || "-"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{tag.creator}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tag.createdAt}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleEditTag(tag)}
                        className="text-blue-600 hover:text-blue-700 text-sm transition-colors"
                        type="button"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="text-red-600 hover:text-red-700 text-sm transition-colors"
                        type="button"
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
      {filteredTags.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {filteredTags.length} 条
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

      {/* Create Tag Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseCreateDialog();
          }
          setIsCreateDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>添加标签</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 标签名称 */}
            <div className="space-y-2">
              <Label htmlFor="create-name" className="text-sm font-medium">
                <span className="text-red-500">*</span> 标签名称:
              </Label>
              <Input
                id="create-name"
                placeholder="请输入标签名称"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* 标签值 */}
            <div className="space-y-2">
              <Label htmlFor="create-values" className="text-sm font-medium">
                <span className="text-red-500">*</span> 标签值:
              </Label>
              <div className="flex gap-2">
                <Input
                  id="create-values"
                  placeholder="请输入标签值"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddValue();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddValue}>
                  添加
                </Button>
              </div>
              {formData.values.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.values.map((value, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-gray-100 text-gray-700 border-gray-200 pr-1"
                    >
                      {value}
                      <button
                        type="button"
                        onClick={() => handleRemoveValue(value)}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 标签描述 */}
            <div className="space-y-2">
              <Label htmlFor="create-description" className="text-sm font-medium">
                标签描述:
              </Label>
              <Textarea
                id="create-description"
                placeholder="请输入标签描述"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCreateDialog}>
              取消
            </Button>
            <Button onClick={handleSubmitCreate}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseEditDialog();
          }
          setIsEditDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑标签</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 标签名称 */}
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">
                <span className="text-red-500">*</span> 标签名称:
              </Label>
              <Input
                id="edit-name"
                placeholder="请输入标签名称"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* 标签值 */}
            <div className="space-y-2">
              <Label htmlFor="edit-values" className="text-sm font-medium">
                <span className="text-red-500">*</span> 标签值:
              </Label>
              <div className="flex gap-2">
                <Input
                  id="edit-values"
                  placeholder="请输入标签值"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddValue();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddValue}>
                  添加
                </Button>
              </div>
              {formData.values.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.values.map((value, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-gray-100 text-gray-700 border-gray-200 pr-1"
                    >
                      {value}
                      <button
                        type="button"
                        onClick={() => handleRemoveValue(value)}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 标签描述 */}
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-medium">
                标签描述:
              </Label>
              <Textarea
                id="edit-description"
                placeholder="请输入标签描述"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditDialog}>
              取消
            </Button>
            <Button onClick={handleSubmitEdit}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

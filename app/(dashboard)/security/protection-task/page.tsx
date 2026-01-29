"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, RefreshCw, ArrowUpDown, ChevronUp, Shield, Settings, Eye, Edit, Trash2, Copy } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ProtectionTask {
  id: string;
  name: string;
  taskId: string;
  status: "enabled" | "disabled";
  protectedObjectCount: number;
  protectionCategories: ("policy" | "lexicon")[];
  creator: string;
  updateTime: string;
  enableStatus: boolean;
}

const mockProtectionTasks: ProtectionTask[] = [
  {
    id: "1",
    name: "科研智能体内容合规检测",
    taskId: "task-research-compliance-001",
    status: "enabled",
    protectedObjectCount: 6,
    protectionCategories: ["policy", "lexicon"],
    creator: "张科研",
    updateTime: "2026-01-28 14:32:15",
    enableStatus: true,
  },
  {
    id: "2",
    name: "医疗问答敏感信息过滤",
    taskId: "task-medical-filter-002",
    status: "enabled",
    protectedObjectCount: 12,
    protectionCategories: ["policy"],
    creator: "李医生",
    updateTime: "2026-01-28 10:15:42",
    enableStatus: true,
  },
  {
    id: "3",
    name: "金融客服风险内容拦截",
    taskId: "task-finance-risk-003",
    status: "disabled",
    protectedObjectCount: 19,
    protectionCategories: ["policy", "lexicon"],
    creator: "王金融",
    updateTime: "2026-01-27 16:45:30",
    enableStatus: false,
  },
  {
    id: "4",
    name: "教育平台内容安全防护",
    taskId: "task-education-safety-004",
    status: "enabled",
    protectedObjectCount: 4,
    protectionCategories: ["policy"],
    creator: "陈教育",
    updateTime: "2026-01-27 09:20:18",
    enableStatus: true,
  },
  {
    id: "5",
    name: "通用大模型提示词攻击防护",
    taskId: "task-prompt-injection-005",
    status: "enabled",
    protectedObjectCount: 9,
    protectionCategories: ["policy", "lexicon"],
    creator: "管理员1",
    updateTime: "2026-01-26 18:55:22",
    enableStatus: true,
  },
  {
    id: "6",
    name: "法律咨询内容合规检测",
    taskId: "task-legal-compliance-006",
    status: "enabled",
    protectedObjectCount: 10,
    protectionCategories: ["policy"],
    creator: "赵律师",
    updateTime: "2026-01-25 11:30:45",
    enableStatus: true,
  },
  {
    id: "7",
    name: "社交媒体内容审核任务",
    taskId: "task-social-moderation-007",
    status: "enabled",
    protectedObjectCount: 8,
    protectionCategories: ["policy"],
    creator: "周运营",
    updateTime: "2026-01-24 15:12:33",
    enableStatus: true,
  },
  {
    id: "8",
    name: "技术文档敏感信息脱敏",
    taskId: "task-tech-desensitize-008",
    status: "enabled",
    protectedObjectCount: 15,
    protectionCategories: ["policy", "lexicon"],
    creator: "吴工程师",
    updateTime: "2026-01-23 13:45:10",
    enableStatus: true,
  },
  {
    id: "9",
    name: "客户服务对话安全监控",
    taskId: "task-customer-service-009",
    status: "enabled",
    protectedObjectCount: 22,
    protectionCategories: ["policy"],
    creator: "陆可",
    updateTime: "2026-01-22 16:41:24",
    enableStatus: true,
  },
  {
    id: "10",
    name: "企业内部知识库访问控制",
    taskId: "task-internal-kb-010",
    status: "disabled",
    protectedObjectCount: 7,
    protectionCategories: ["policy", "lexicon"],
    creator: "宋星",
    updateTime: "2026-01-21 14:20:18",
    enableStatus: false,
  },
  {
    id: "gf-protection",
    name: "GF专属防护",
    taskId: "task-gf-exclusive-001",
    status: "enabled",
    protectedObjectCount: 8,
    protectionCategories: ["policy", "lexicon"],
    creator: "管理员1",
    updateTime: "2026-01-29 10:30:00",
    enableStatus: true,
  },
];

const ITEMS_PER_PAGE = 10;

export default function ProtectionTaskPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [protectionTasks, setProtectionTasks] = useState<ProtectionTask[]>(mockProtectionTasks);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const [showWorkflow, setShowWorkflow] = useState(false);

  const filteredTasks = protectionTasks.filter((task) =>
    task.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  const handleRefresh = () => {
    toast.success("刷新成功");
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("已复制到剪贴板");
  };

  const handleToggleEnable = (taskId: string) => {
    setProtectionTasks((tasks) =>
      tasks.map((task) =>
        task.id === taskId
          ? { ...task, enableStatus: !task.enableStatus, status: task.enableStatus ? "disabled" : "enabled" }
          : task
      )
    );
    toast.success("状态已更新");
  };

  const handleView = (id: string) => {
    // Navigation handled by Link
  };

  const handleEdit = (id: string) => {
    toast.info(`编辑任务: ${id}`);
  };

  const handleDelete = (task: ProtectionTask) => {
    toast.success(`已删除：${task.name}`);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">防护任务</h1>
          <p className="text-sm text-muted-foreground">
            配置大模型安全检测任务,在模型服务使用过程中实时识别风险,并执行相应的防护动作。
          </p>
        </div>
        <button
          onClick={() => setShowWorkflow(!showWorkflow)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          使用流程 {showWorkflow ? "⌄" : "^"}
        </button>
      </div>

      {/* Workflow Guidance */}
      {showWorkflow && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-8">
            {/* Step 1 */}
            <div className="flex items-start gap-4 flex-1">
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-purple-100 flex items-center justify-center">
                  <Plus className="h-3 w-3 text-purple-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">创建关键词库</h3>
                <p className="text-sm text-muted-foreground">
                  通过配置黑名单词库和白名单词库,以规则实现对大模型输入输出的风险信息匹配,去创建 &gt;
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="text-muted-foreground">
              →
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4 flex-1">
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-purple-100 flex items-center justify-center">
                  <Settings className="h-3 w-3 text-purple-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">创建防护任务</h3>
                <p className="text-sm text-muted-foreground">
                  通过策略智能识别内容合规、敏感信息、提示词攻击等风险,结合词库进行规则干预,支持多种处置动作,实现大模型服务的全链路安全防护。
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="text-muted-foreground">
              →
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4 flex-1">
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-purple-100 flex items-center justify-center">
                  <Eye className="h-3 w-3 text-purple-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">查看防护日志</h3>
                <p className="text-sm text-muted-foreground">
                  防护过程中,可以在任务详情查看防护日志和任务详情等内容
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="请输入任务名称搜索"
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
            创建防护任务
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>任务名称</TableHead>
              <TableHead>任务ID</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  状态
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead>防护对象数</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  防护类别
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead>创建人</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  更新时间
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead>启停状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              paginatedTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{task.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{task.taskId}</span>
                      <button
                        onClick={() => handleCopyId(task.taskId)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          task.status === "enabled" ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      <span className="text-sm">
                        {task.status === "enabled" ? "已启用" : "已停用"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{task.protectedObjectCount}个</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.protectionCategories.map((category, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-50 text-green-700"
                        >
                          {category === "policy" ? "策略防护" : "词库防护"}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="cursor-help">
                                <svg
                                  className="h-3 w-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2 text-xs">
                              {category === "policy" ? "策略防护说明" : "词库防护说明"}
                            </PopoverContent>
                          </Popover>
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{task.creator}</TableCell>
                  <TableCell className="text-muted-foreground">{task.updateTime}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={task.enableStatus}
                        onCheckedChange={() => handleToggleEnable(task.id)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {task.enableStatus ? "启用" : "停用"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/security/protection-task/${task.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        详情
                      </Link>
                      <button
                        onClick={() => handleEdit(task.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(task)}
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
      {filteredTasks.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {filteredTasks.length} 条
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

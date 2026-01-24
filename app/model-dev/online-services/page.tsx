"use client";

import { useState } from "react";
import { Search, RefreshCw, Plus, ChevronDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Service status enum
export enum ServiceStatus {
  CREATING = "创建中",
  RUNNING = "运行中",
  GOING_ONLINE = "上线中",
  GOING_OFFLINE = "下线中",
  OFFLINE = "已下线",
  FAILED = "已失败",
}

interface OnlineService {
  id: string;
  name: string;
  serviceId: string;
  status: ServiceStatus;
  modelSource: string;
  creator: string;
  createdAt: string;
}

// Mock data with specified models
const mockServices: OnlineService[] = [
  {
    id: "1",
    name: "Qwen3-DPO服务",
    serviceId: "ex-qwen3dpo001",
    status: ServiceStatus.RUNNING,
    modelSource: "模型广场>Qwen3-DPO",
    creator: "管理员1",
    createdAt: "2026-01-14 15:33:56",
  },
  {
    id: "2",
    name: "DeepSeek-Distill服务",
    serviceId: "ex-deepseek001",
    status: ServiceStatus.GOING_ONLINE,
    modelSource: "模型广场>DeepSeek-Distill",
    creator: "管理员1",
    createdAt: "2026-01-13 14:34:24",
  },
  {
    id: "3",
    name: "GFJG行业大模型服务",
    serviceId: "ex-gfjg001",
    status: ServiceStatus.OFFLINE,
    modelSource: "模型广场>GFJG行业大模型",
    creator: "管理员1",
    createdAt: "2026-01-12 16:31:46",
  },
  {
    id: "4",
    name: "多模态感知大模型服务",
    serviceId: "ex-multimodal001",
    status: ServiceStatus.RUNNING,
    modelSource: "模型广场>多模态感知大模型",
    creator: "管理员1",
    createdAt: "2026-01-11 10:20:30",
  },
  {
    id: "5",
    name: "科研L1大模型服务",
    serviceId: "ex-research001",
    status: ServiceStatus.CREATING,
    modelSource: "模型广场>科研L1大模型",
    creator: "管理员1",
    createdAt: "2026-01-10 09:15:22",
  },
  {
    id: "6",
    name: "态势感知大模型服务",
    serviceId: "ex-situation001",
    status: ServiceStatus.RUNNING,
    modelSource: "模型广场>态势感知大模型",
    creator: "管理员1",
    createdAt: "2026-01-09 14:45:18",
  },
  {
    id: "7",
    name: "情报决策机理模型服务",
    serviceId: "ex-intelligence001",
    status: ServiceStatus.GOING_OFFLINE,
    modelSource: "模型广场>情报决策机理模型",
    creator: "管理员1",
    createdAt: "2026-01-08 11:30:45",
  },
];

const statusColors: Record<ServiceStatus, string> = {
  [ServiceStatus.CREATING]: "bg-yellow-500",
  [ServiceStatus.RUNNING]: "bg-green-500",
  [ServiceStatus.GOING_ONLINE]: "bg-blue-500",
  [ServiceStatus.GOING_OFFLINE]: "bg-orange-500",
  [ServiceStatus.OFFLINE]: "bg-gray-400",
  [ServiceStatus.FAILED]: "bg-red-500",
};

const allStatuses = [
  ServiceStatus.CREATING,
  ServiceStatus.RUNNING,
  ServiceStatus.GOING_ONLINE,
  ServiceStatus.GOING_OFFLINE,
  ServiceStatus.OFFLINE,
  ServiceStatus.FAILED,
];

export default function OnlineServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<ServiceStatus[]>([]);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);

  const filteredServices = mockServices.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.serviceId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(service.status);

    return matchesSearch && matchesStatus;
  });

  const handleStatusToggle = (status: ServiceStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleResetStatus = () => {
    setSelectedStatuses([]);
  };

  const handleConfirmStatus = () => {
    setIsStatusFilterOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">在线服务</h1>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="请输入服务名称/ID搜索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>

        <Button>
          <Plus className="h-4 w-4 mr-2" />
          创建在线服务
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">服务名称</TableHead>
              <TableHead className="w-[150px]">服务ID</TableHead>
              <TableHead className="w-[150px]">
                <div className="flex items-center gap-2">
                  <span>服务状态</span>
                  <Popover open={isStatusFilterOpen} onOpenChange={setIsStatusFilterOpen}>
                    <PopoverTrigger asChild>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Filter className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-0" align="start">
                      <div className="p-3 border-b">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-sm">服务状态</span>
                        </div>
                      </div>
                      <div className="p-2">
                        {allStatuses.map((status) => (
                          <label
                            key={status}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <Checkbox
                              checked={selectedStatuses.includes(status)}
                              onCheckedChange={() => handleStatusToggle(status)}
                            />
                            <span className="text-sm">{status}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex items-center justify-between p-3 border-t gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleResetStatus}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          重置
                        </Button>
                        <Button size="sm" onClick={handleConfirmStatus}>
                          确定
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </TableHead>
              <TableHead className="w-[250px]">模型来源</TableHead>
              <TableHead className="w-[120px]">创建人</TableHead>
              <TableHead className="w-[180px]">
                <div className="flex items-center gap-1">
                  <span>创建时间</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </TableHead>
              <TableHead className="w-[200px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="text-gray-600">{service.serviceId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          statusColors[service.status]
                        )}
                      />
                      <span className="text-sm">{service.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{service.modelSource}</TableCell>
                  <TableCell>{service.creator}</TableCell>
                  <TableCell className="text-gray-600">{service.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        详情
                      </Button>
                      {service.status === ServiceStatus.OFFLINE ? (
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          上线
                        </Button>
                      ) : service.status === ServiceStatus.RUNNING ||
                        service.status === ServiceStatus.GOING_ONLINE ? (
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          下线
                        </Button>
                      ) : null}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            更多
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>编辑</DropdownMenuItem>
                          <DropdownMenuItem>删除</DropdownMenuItem>
                          <DropdownMenuItem>复制</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

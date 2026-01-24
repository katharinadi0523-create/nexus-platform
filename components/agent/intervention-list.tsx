"use client";

import { useState } from "react";
import {
  Search,
  RefreshCcw,
  Plus,
  Settings,
  ChevronDown,
  Edit,
  Trash2,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// 干预数据接口
export interface Intervention {
  id: number;
  status: "enabled" | "disabled";
  question: string;
  answer: string;
  updatedAt: string;
}

interface InterventionListProps {
  data?: Intervention[];
}

// Mock 数据
const DEFAULT_INTERVENTIONS: Intervention[] = [
  {
    id: 1,
    status: "enabled",
    question: "什么是OSINT",
    answer: "OSINT是开源情报（Open Source Intelligence）的缩写，是指从公开可获取的信息源中收集、分析和利用情报的方法。OSINT广泛应用于网络安全、商业情报、军事分析等领域。",
    updatedAt: "2025-05-01",
  },
  {
    id: 2,
    status: "disabled",
    question: "你是谁?",
    answer: "我是新星AppForge工作流小助手，我的名字是nexus X。我可以帮助您处理各种工作流任务，包括数据分析、文档处理、自动化流程等。",
    updatedAt: "2025-05-02",
  },
  {
    id: 3,
    status: "enabled",
    question: "如何创建智能体？",
    answer: "创建智能体的步骤：1. 点击右上角的'创建智能体'按钮；2. 填写智能体的基本信息（名称、描述等）；3. 配置智能体的能力（知识库、工具、工作流等）；4. 设置对话参数和开场白；5. 保存并发布。",
    updatedAt: "2025-05-03",
  },
  {
    id: 4,
    status: "enabled",
    question: "RAG技术是什么？",
    answer: "RAG（Retrieval-Augmented Generation）是检索增强生成技术，通过结合外部知识库检索和大型语言模型生成能力，能够提供更准确、更及时的回答。RAG解决了LLM的知识局限性和时效性问题。",
    updatedAt: "2025-05-04",
  },
  {
    id: 5,
    status: "disabled",
    question: "如何优化知识库检索效果？",
    answer: "优化知识库检索效果的方法包括：1. 使用混合检索策略（关键词+语义检索）；2. 调整Top-K参数；3. 使用重排序模型；4. 优化文档切片策略；5. 定期更新和维护知识库内容。",
    updatedAt: "2025-05-05",
  },
];

export function InterventionList({ data = DEFAULT_INTERVENTIONS }: InterventionListProps) {
  const [interventions, setInterventions] = useState<Intervention[]>(data);
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // 过滤数据
  const filteredInterventions = interventions.filter((item) => {
    const matchesSearch =
      !searchKeyword ||
      item.question.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "enabled" && item.status === "enabled") ||
      (filterStatus === "disabled" && item.status === "disabled");
    return matchesSearch && matchesStatus;
  });

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredInterventions.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // 选择单个
  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  // 切换展开/收起
  const handleToggleExpand = (id: number) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // 切换状态
  const handleToggleStatus = (id: number) => {
    setInterventions((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "enabled" ? "disabled" : "enabled" }
          : item
      )
    );
  };

  // 批量操作
  const handleBatchEnable = () => {
    setInterventions((prev) =>
      prev.map((item) => (selectedIds.has(item.id) ? { ...item, status: "enabled" } : item))
    );
    setSelectedIds(new Set());
  };

  const handleBatchDisable = () => {
    setInterventions((prev) =>
      prev.map((item) => (selectedIds.has(item.id) ? { ...item, status: "disabled" } : item))
    );
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    setInterventions((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
  };

  // 删除单个
  const handleDelete = (id: number) => {
    setInterventions((prev) => prev.filter((item) => item.id !== id));
  };

  const isAllSelected =
    filteredInterventions.length > 0 &&
    filteredInterventions.every((item) => selectedIds.has(item.id));

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Header 区 */}
      <div className="flex-none border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">问答干预</h2>
          <div className="flex items-center gap-3">
            <Label htmlFor="global-switch" className="text-sm text-slate-700 cursor-pointer">
              启用
            </Label>
            <Switch
              id="global-switch"
              checked={globalEnabled}
              onCheckedChange={setGlobalEnabled}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Toolbar 区 */}
      <div className="flex-none border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: 搜索、筛选、刷新 */}
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="搜索问题或回答"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={setFilterStatus}
              options={[
                { value: "all", label: "全部状态" },
                { value: "enabled", label: "已启用" },
                { value: "disabled", label: "未启用" },
              ]}
              className="w-32"
            />
            <Button variant="outline" size="icon">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Middle: 批量操作 */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-slate-600">已选择 {selectedIds.size} 项</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleBatchEnable}>
                启用
              </Button>
              <Button variant="outline" size="sm" onClick={handleBatchDisable}>
                停用
              </Button>
              <Button variant="outline" size="sm" onClick={handleBatchDelete}>
                删除
              </Button>
            </div>
          )}

          {/* Right: 设置和添加 */}
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              问答干预设置
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              添加问答对
            </Button>
          </div>
        </div>
      </div>

      {/* List 区 */}
      <div className="flex-1 overflow-auto bg-slate-50 px-6 py-4">
        {filteredInterventions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            暂无数据
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInterventions.map((item) => {
              const isExpanded = expandedIds.has(item.id);
              const isSelected = selectedIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "relative bg-white border border-slate-200 rounded-md p-4 hover:shadow-sm transition-shadow",
                    isSelected && "ring-2 ring-blue-500"
                  )}
                >
                  {/* 第一行: Checkbox + ID + 状态 Badge */}
                  <div className="flex items-center gap-3 mb-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                    />
                    <span className="text-sm font-medium text-slate-700">#{item.id}</span>
                    <Badge
                      className={cn(
                        item.status === "enabled"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      {item.status === "enabled" ? "启用" : "未启用"}
                    </Badge>
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleExpand(item.id)}
                        className="h-8"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            收起
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            展开
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8">
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(item.id)}
                        className="h-8"
                      >
                        {item.status === "enabled" ? "停用" : "启用"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 第二行: 问题 */}
                  <div className="mt-2">
                    <span className="text-sm font-medium text-slate-600">问题：</span>
                    <span className="text-sm text-slate-900 ml-2">{item.question}</span>
                  </div>

                  {/* 第三行: 回答 */}
                  <div className="mt-1">
                    <span className="text-sm font-medium text-slate-600">回答：</span>
                    <div className="text-sm text-slate-700 ml-2 mt-1">
                      {isExpanded ? (
                        <div className="whitespace-pre-wrap">{item.answer}</div>
                      ) : (
                        <div className="overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          {item.answer}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

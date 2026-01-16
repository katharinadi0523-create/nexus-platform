"use client";

import { useState } from "react";
import {
  Search,
  RefreshCw,
  Plus,
  Eye,
  GitBranch,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Workflow {
  id: string;
  name: string;
  description: string;
  updateTime: string;
}

interface WorkflowSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (workflow: Workflow) => void;
}

const mockWorkflows: Workflow[] = [
  {
    id: "wf-1",
    name: "云时代poc",
    description: "找到AI产线的各位大神",
    updateTime: "2025-12-30 12:34:06",
  },
  {
    id: "wf-2",
    name: "南航办公助手",
    description: "--",
    updateTime: "2025-12-24 09:36:21",
  },
  {
    id: "wf-3",
    name: "知识库检索工作流-油...",
    description: "油气价格知识检索",
    updateTime: "2025-11-28 07:21:14",
  },
  {
    id: "wf-4",
    name: "评测工作流for算法",
    description: "评测工作流for算法",
    updateTime: "2025-11-27 05:35:49",
  },
  {
    id: "wf-5",
    name: "西游记问答",
    description: "这是一个可以回答西游记相关问题的智能工作流",
    updateTime: "2025-12-17 13:49:37",
  },
];

export function WorkflowSelector({
  open,
  onOpenChange,
  onSelect,
}: WorkflowSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredWorkflows = mockWorkflows.filter((wf) =>
    wf.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredWorkflows.length / itemsPerPage);
  const displayedWorkflows = filteredWorkflows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelect = (workflow: Workflow) => {
    onSelect(workflow);
    onOpenChange(false);
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-left">选择工作流</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索工作流名称"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4 text-slate-600" />
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              创建工作流
            </button>
          </div>

          {/* Workflow List */}
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg">
            <div className="divide-y divide-slate-200">
              {displayedWorkflows.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  暂无工作流
                </div>
              ) : (
                displayedWorkflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <GitBranch className="w-5 h-5 text-green-600" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900 truncate">
                            {workflow.name}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">
                          {workflow.description}
                        </p>
                        <p className="text-xs text-slate-400">
                          {workflow.updateTime}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                          <Eye className="w-4 h-4" />
                          查看
                        </button>
                        <button
                          onClick={() => handleSelect(workflow)}
                          className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          添加
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
              <div className="text-sm text-slate-600">
                共{filteredWorkflows.length}条
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg transition-colors",
                    currentPage === 1
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  &lt;
                </button>
                <div className="flex items-center gap-1">
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
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-lg transition-colors",
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2 text-slate-400">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-lg transition-colors",
                          currentPage === totalPages
                            ? "bg-blue-600 text-white"
                            : "text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg transition-colors",
                    currentPage === totalPages
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  &gt;
                </button>
                <select
                  value={itemsPerPage}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>10条/页</option>
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">前往</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page);
                      }
                    }}
                    className="w-16 px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600">页</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

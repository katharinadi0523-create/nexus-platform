"use client";

import { useState } from "react";
import {
  Search,
  RefreshCw,
  Plus,
  Eye,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface KnowledgeBase {
  id: string;
  name: string;
  itemCount: number;
  createTime: string;
  source?: string;
}

interface KnowledgeBaseSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (kb: KnowledgeBase) => void;
}

const mockKnowledgeBases: KnowledgeBase[] = [
  {
    id: "kb-1",
    name: "app-ngy1wu0t_qa",
    itemCount: 156,
    createTime: "2026-01-11 14:20:51",
  },
  {
    id: "kb-2",
    name: "app-in5jnfqk_qa",
    itemCount: 89,
    createTime: "2026-01-10 09:15:32",
  },
  {
    id: "kb-3",
    name: "app-msuc0pch_qa",
    itemCount: 234,
    createTime: "2026-01-09 17:49:35",
  },
  {
    id: "kb-4",
    name: "app-bh4a2qek_qa",
    itemCount: 67,
    createTime: "2026-01-08 11:23:18",
  },
  {
    id: "kb-5",
    name: "app-ghsfxst0_qa",
    itemCount: 312,
    createTime: "2026-01-07 16:42:09",
  },
  {
    id: "kb-6",
    name: "app-6jfe6te1_qa",
    itemCount: 45,
    createTime: "2026-01-06 10:30:45",
  },
];

const mockMultimodalBases: KnowledgeBase[] = [
  {
    id: "mm-1",
    name: "文档知识库-南航销售版",
    itemCount: 528,
    createTime: "2026-01-11 14:20:51",
    source: "多模态数据治理平台/数据集市/RAG知识库",
  },
  {
    id: "mm-2",
    name: "产品文档库",
    itemCount: 267,
    createTime: "2026-01-10 09:15:32",
    source: "多模态数据治理平台/数据集市/RAG知识库",
  },
];

export function KnowledgeBaseSelector({
  open,
  onOpenChange,
  onSelect,
}: KnowledgeBaseSelectorProps) {
  const [activeTab, setActiveTab] = useState("dev");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const currentBases =
    activeTab === "dev" ? mockKnowledgeBases : mockMultimodalBases;

  const filteredBases = currentBases.filter((kb) =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBases.length / itemsPerPage);
  const displayedBases = filteredBases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelect = (kb: KnowledgeBase) => {
    onSelect(kb);
    onOpenChange(false);
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-left">选择知识库</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs and Header Controls */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v);
                setCurrentPage(1);
              }}
              className="flex-1"
            >
              <TabsList>
                <TabsTrigger value="dev">应用开发-知识库</TabsTrigger>
                <TabsTrigger value="multimodal">多模态数据治理-知识库</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="搜索知识库名称"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-48 pl-9"
                />
              </div>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4 text-slate-600" />
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                创建知识库
              </button>
            </div>
          </div>

          {/* Knowledge Base List */}
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg">
            <div className="divide-y divide-slate-200">
              {displayedBases.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  暂无知识库
                </div>
              ) : (
                displayedBases.map((kb) => (
                  <div
                    key={kb.id}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900 truncate">
                            {kb.name}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                            {kb.itemCount}个
                          </span>
                        </div>
                        {kb.source && (
                          <p className="text-xs text-slate-500 mb-1">
                            来源: {kb.source}
                          </p>
                        )}
                        <p className="text-xs text-slate-500">
                          创建时间: {kb.createTime}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                          <Eye className="w-4 h-4" />
                          查看
                        </button>
                        <button
                          onClick={() => handleSelect(kb)}
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
                共{filteredBases.length}条
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, Plus, FileText, Settings, Trash2 } from "lucide-react";
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
import type { KnowledgeBaseGroup } from "./GroupTreeSidebar";

export interface KnowledgeBase {
  id: string;
  name: string;
  fileCount: number;
  charCount: number;
  description: string;
  createTime: string;
}

interface KnowledgeBaseTableProps {
  selectedGroup: KnowledgeBaseGroup | null;
}

// All knowledge bases across all groups
const allKnowledgeBases: KnowledgeBase[] = [
  // AI-related knowledge bases (default_all group)
  {
    id: "ai_001",
    name: "Transformer 架构详解",
    fileCount: 1,
    charCount: 125000,
    description: "Transformer 架构详解 (Attention Is All You Need)",
    createTime: "2023-12-10 14:30:00",
  },
  {
    id: "ai_002",
    name: "RAG 检索增强生成技术",
    fileCount: 1,
    charCount: 98000,
    description: "RAG 检索增强生成技术白皮书",
    createTime: "2024-01-05 10:15:00",
  },
  {
    id: "ai_003",
    name: "AI Agent 设计模式",
    fileCount: 1,
    charCount: 45000,
    description: "AI Agent 设计模式与工程实践",
    createTime: "2024-01-14 16:20:00",
  },
  {
    id: "ai_004",
    name: "大语言模型原理与实践",
    fileCount: 3,
    charCount: 256000,
    description: "深入理解大语言模型的工作原理和应用实践",
    createTime: "2024-01-20 09:45:00",
  },
  {
    id: "ai_005",
    name: "向量数据库技术指南",
    fileCount: 2,
    charCount: 89000,
    description: "向量数据库在 RAG 系统中的应用指南",
    createTime: "2024-02-01 11:30:00",
  },
  // Tianjin group knowledge bases
  {
    id: "tianjin_001",
    name: "笔录知识库",
    fileCount: 1,
    charCount: 2153,
    description: "笔录知识库",
    createTime: "2025-12-17 19:35:45",
  },
  {
    id: "tianjin_002",
    name: "自查清单",
    fileCount: 3,
    charCount: 3979,
    description: "自查清单",
    createTime: "2025-12-17 19:35:45",
  },
  {
    id: "tianjin_003",
    name: "法律法规",
    fileCount: 2,
    charCount: 74907,
    description: "法律法规",
    createTime: "2025-12-17 19:35:45",
  },
  {
    id: "tianjin_004",
    name: "初核报告模板",
    fileCount: 1,
    charCount: 1234,
    description: "初核报告模板",
    createTime: "2025-12-17 19:35:45",
  },
  {
    id: "tianjin_005",
    name: "领域映射关系知识库",
    fileCount: 2,
    charCount: 5678,
    description: "领域映射关系知识库(测试)",
    createTime: "2025-12-17 19:35:45",
  },
  {
    id: "tianjin_006",
    name: "纪检调查报告知识库",
    fileCount: 1,
    charCount: 3456,
    description: "纪检调查报告知识库",
    createTime: "2025-12-17 19:35:45",
  },
  {
    id: "tianjin_007",
    name: "纪检初步核实报告知识库",
    fileCount: 1,
    charCount: 2345,
    description: "纪检初步核实报告知识库",
    createTime: "2025-12-17 19:35:45",
  },
  {
    id: "tianjin_008",
    name: "纪检审查报告知识库",
    fileCount: 1,
    charCount: 4567,
    description: "纪检审查报告知识库",
    createTime: "2025-12-17 19:35:45",
  },
  // Other groups knowledge bases
  {
    id: "test_001",
    name: "测试知识库1",
    fileCount: 5,
    charCount: 10000,
    description: "测试群组1的知识库",
    createTime: "2025-12-15 10:20:00",
  },
  {
    id: "test_002",
    name: "测试知识库2",
    fileCount: 3,
    charCount: 5000,
    description: "测试群组2的知识库",
    createTime: "2025-12-16 14:30:00",
  },
  {
    id: "migration_001",
    name: "迁移知识库1",
    fileCount: 4,
    charCount: 15000,
    description: "迁移知识库示例",
    createTime: "2025-12-10 08:15:00",
  },
];

// Mock data based on selected group
const getMockKnowledgeBases = (groupId: string | null): KnowledgeBase[] => {
  // Return all knowledge bases when "全部群组" is selected
  if (!groupId || groupId === "all") {
    return allKnowledgeBases;
  }

  // Mock data for "天津纪委知识库"
  if (groupId === "tianjin") {
    return allKnowledgeBases.filter((kb) => kb.id.startsWith("tianjin_"));
  }

  // Mock data for "测试群组1"
  if (groupId === "test1") {
    return allKnowledgeBases.filter((kb) => kb.id.startsWith("test_"));
  }

  // Mock data for "迁移知识库"
  if (groupId === "migration") {
    return allKnowledgeBases.filter((kb) => kb.id.startsWith("migration_"));
  }

  // Default: return AI knowledge bases (default_all group)
  return allKnowledgeBases.filter((kb) => kb.id.startsWith("ai_"));
};

export function KnowledgeBaseTable({ selectedGroup }: KnowledgeBaseTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const knowledgeBases = getMockKnowledgeBases(selectedGroup?.id || null);

  const filteredKnowledgeBases = knowledgeBases.filter((kb) =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    // Refresh logic here
  };

  const handleConfigure = (id: string) => {
    router.push(`/knowledge-base/${id}`);
  };

  const handleDelete = (id: string) => {
    // Delete logic here
  };

  const handleCreate = () => {
    router.push("/knowledge-base/create");
  };

  const handleTagManagement = () => {
    // Tag management logic here
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          {selectedGroup?.name || "请选择知识库群组"}
        </h1>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜索知识库名称"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Tag Management Button */}
          <Button variant="outline" onClick={handleTagManagement}>
            标签管理
          </Button>

          {/* Create Button */}
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            创建知识库
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>知识库名称</TableHead>
              <TableHead>文件总数</TableHead>
              <TableHead>字符总数</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredKnowledgeBases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                  {selectedGroup
                    ? "暂无知识库数据"
                    : "请从左侧选择一个知识库群组"}
                </TableCell>
              </TableRow>
            ) : (
              filteredKnowledgeBases.map((kb) => (
                <TableRow key={kb.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                        <FileText className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-semibold">{kb.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{kb.fileCount}</TableCell>
                  <TableCell>{kb.charCount.toLocaleString()}</TableCell>
                  <TableCell className="text-slate-600">{kb.description}</TableCell>
                  <TableCell className="text-slate-600">{kb.createTime}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleConfigure(kb.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        配置
                      </button>
                      <button
                        onClick={() => handleDelete(kb.id)}
                        className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
  );
}

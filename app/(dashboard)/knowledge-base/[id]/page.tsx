"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  FileText,
  Search,
  Plus,
  Trash2,
  Download,
  Settings,
  Power,
  EyeOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getKnowledgeBaseDetail,
  type FileItem,
  type ChunkItem,
} from "@/lib/mock-knowledge-base-details";
import { HitTestingView } from "@/components/knowledge-base/HitTestingView";

export default function KnowledgeBaseDetailPage() {
  const params = useParams();
  const kbId = params.id as string;

  // Get knowledge base detail data based on ID
  const kbDetail = useMemo(() => {
    return getKnowledgeBaseDetail(kbId);
  }, [kbId]);

  // Fallback to default if not found
  const defaultDetail = {
    id: kbId,
    name: "未知知识库",
    documentCount: 0,
    totalSize: "0 KB",
    lastSaved: "00:00",
    strategy: "自动切片",
    files: [] as FileItem[],
    chunks: {} as { [fileId: string]: ChunkItem[] },
    fullContent: {} as { [fileId: string]: string },
  };

  const detail = kbDetail || defaultDetail;

  const [activeTab, setActiveTab] = useState<"segmentation" | "test">("segmentation");
  const [fileSearch, setFileSearch] = useState("");
  const [chunkSearch, setChunkSearch] = useState("");
  const [selectedFileId, setSelectedFileId] = useState<string>(
    detail.files[0]?.id || ""
  );
  const [files, setFiles] = useState<FileItem[]>(detail.files);
  const [documentEnabled, setDocumentEnabled] = useState(true);
  const [hideOriginalFile, setHideOriginalFile] = useState(false);
  
  // Manage chunks state per file
  const [chunksState, setChunksState] = useState<{
    [fileId: string]: ChunkItem[];
  }>(detail.chunks);

  // Update chunks state when detail changes
  useEffect(() => {
    setChunksState(detail.chunks);
    setFiles(detail.files);
    if (detail.files.length > 0) {
      const firstFileId = detail.files[0].id;
      if (!selectedFileId || !detail.files.find((f) => f.id === selectedFileId)) {
        setSelectedFileId(firstFileId);
      }
    }
  }, [detail]);

  // Get chunks for selected file
  const chunks = useMemo(() => {
    return chunksState[selectedFileId] || [];
  }, [selectedFileId, chunksState]);

  const selectedFile = files.find((f) => f.id === selectedFileId);
  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(fileSearch.toLowerCase())
  );
  const filteredChunks = chunks.filter((c) =>
    c.content.toLowerCase().includes(chunkSearch.toLowerCase())
  );

  const handleFileDelete = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
    if (selectedFileId === id && files.length > 1) {
      const nextFile = files.find((f) => f.id !== id);
      setSelectedFileId(nextFile?.id || files[0]?.id || "");
    }
  };

  const handleChunkToggle = (id: string) => {
    // Update chunk enabled state
    setChunksState((prev) => ({
      ...prev,
      [selectedFileId]: (prev[selectedFileId] || []).map((c) =>
        c.id === id ? { ...c, enabled: !c.enabled } : c
      ),
    }));
  };

  // Use knowledge base detail data
  const kbName = detail.name;
  const documentCount = detail.documentCount;
  const totalSize = detail.totalSize;
  const lastSaved = detail.lastSaved;
  const strategy = detail.strategy;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Top Header */}
      <div className="border-b bg-white">
        {/* Header Row 1: Title and Stats */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/knowledge-base"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold">{kbName}</h1>
              <button className="p-1.5 hover:bg-slate-100 rounded transition-colors">
                <Edit className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="rounded-md bg-slate-100 px-3 py-1.5 text-sm">
              {documentCount}个
            </div>
            <div className="rounded-md bg-slate-100 px-3 py-1.5 text-sm">
              {totalSize}
            </div>
            <div className="rounded-md bg-slate-100 px-3 py-1.5 text-sm text-slate-600">
              自动保存于 {lastSaved}
            </div>
          </div>
        </div>

        {/* Header Row 2: Tabs */}
        <div className="px-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "segmentation" | "test")}>
            <TabsList className="h-10">
              <TabsTrigger value="segmentation">文件分段</TabsTrigger>
              <TabsTrigger value="test">命中测试</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "segmentation" && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: File List */}
          <div className="w-[280px] border-r bg-white flex flex-col">
            {/* Search and Add Button */}
            <div className="p-4 space-y-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="搜索文件名称"
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                添加文件
              </Button>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto">
                {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => {
                    setSelectedFileId(file.id);
                    // Reset chunk search when switching files
                    setChunkSearch("");
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 cursor-pointer border-b hover:bg-slate-50 transition-colors",
                    selectedFileId === file.id && "bg-blue-50 border-blue-200"
                  )}
                >
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">W</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {file.name.length > 15
                        ? `${file.name.substring(0, 15)}...`
                        : file.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {file.enabled && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileDelete(file.id);
                      }}
                      className="p-1 hover:bg-slate-200 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Top Toolbar */}
            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold">{selectedFile?.name}</h2>
                  <button className="p-2 hover:bg-slate-100 rounded transition-colors">
                    <Download className="w-4 h-4 text-slate-500" />
                  </button>
                  <Badge variant="outline" className="bg-slate-50">
                    {strategy}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={documentEnabled}
                      onCheckedChange={setDocumentEnabled}
                    />
                    <span className="text-sm text-slate-600">启用</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHideOriginalFile(!hideOriginalFile)}
                  >
                    <EyeOff className="mr-2 h-4 w-4" />
                    隐藏原文件
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    文档配置
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    添加切片
                  </Button>
                </div>
              </div>
            </div>

            {/* Content Area: Split View */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left: Document Preview */}
              {!hideOriginalFile && (
                <div className="w-1/2 border-r overflow-y-auto bg-slate-50 p-6">
                  <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
                    {selectedFile && detail.fullContent[selectedFile.id] ? (
                      <div className="space-y-4 text-slate-700">
                        <h3 className="text-xl font-bold mb-4">{selectedFile.name}</h3>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {detail.fullContent[selectedFile.id]}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 py-12">
                        <p>暂无文档内容预览</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Right: Chunks List */}
              <div
                className={cn(
                  "flex flex-col overflow-hidden",
                  hideOriginalFile ? "w-full" : "w-1/2"
                )}
              >
                <div className="border-b px-6 py-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    切片({chunks.length > 0 ? chunks[0].total : 0})
                  </h3>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="搜索切片"
                      value={chunkSearch}
                      onChange={(e) => setChunkSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {filteredChunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500">
                          切片数: {chunk.index}/{chunk.total} 字符数:{" "}
                          {chunk.charCount}
                        </span>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={chunk.enabled}
                            onCheckedChange={() => handleChunkToggle(chunk.id)}
                          />
                          <span className="text-xs text-slate-500">启用</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
                        {chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hit Test Tab Content */}
      {activeTab === "test" && (
        <div className="flex-1 overflow-hidden bg-white p-6">
          <HitTestingView />
        </div>
      )}
    </div>
  );
}

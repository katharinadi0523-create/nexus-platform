"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  ChevronDown,
  Filter,
  FolderOpen,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  loadKnowledgeBaseDocuments,
  saveKnowledgeBaseDocuments,
  type KnowledgeBaseListItem,
  type StoredKbDocument,
} from "@/lib/mock/knowledge-base-list";
import { HitTestingView } from "@/components/knowledge-base/HitTestingView";
import { GraphRetrievalDrawer } from "@/components/knowledge-base/GraphRetrievalDrawer";
import { FileUpload } from "@/components/knowledge-base/FileUpload";

type ProcessStatus =
  | "解析中"
  | "处理中"
  | "已解析"
  | "解析失败"
  | "已完成"
  | "切片失败";
type UsageStatus = "已启用" | "已停用";
type QualityLevel = "高" | "中" | "低" | "-";
type DocType = "PDF" | "DOC" | "DOCX" | "TXT";
type TimePreset = "1h" | "1d" | "1w" | null;

interface KbDocument {
  id: string;
  name: string;
  type: DocType;
  processStatus: ProcessStatus;
  usageStatus: UsageStatus;
  quality: QualityLevel;
  layoutComplexity: QualityLevel;
  size: string;
  uploader: string;
  uploadedAt: string;
}

interface KnowledgeBaseDetailWorkbenchProps {
  meta: KnowledgeBaseListItem;
  initialHitTest?: boolean;
}

const mockDocuments: KbDocument[] = [
  {
    id: "doc_1",
    name: "xxxx.pdf",
    type: "PDF",
    processStatus: "解析中",
    usageStatus: "已停用",
    quality: "-",
    layoutComplexity: "-",
    size: "-",
    uploader: "刘明明",
    uploadedAt: "2025-03-12 12:30:00",
  },
  {
    id: "doc_2",
    name: "Member1.txt",
    type: "TXT",
    processStatus: "处理中",
    usageStatus: "已停用",
    quality: "-",
    layoutComplexity: "-",
    size: "-",
    uploader: "刘明明",
    uploadedAt: "2025-03-12 12:28:00",
  },
  {
    id: "doc_3",
    name: "xxxx.doc",
    type: "DOC",
    processStatus: "已解析",
    usageStatus: "已停用",
    quality: "中",
    layoutComplexity: "中",
    size: "22MB",
    uploader: "刘明明",
    uploadedAt: "2025-03-12 11:50:00",
  },
  {
    id: "doc_4",
    name: "xxxx.docx",
    type: "DOCX",
    processStatus: "已解析",
    usageStatus: "已停用",
    quality: "低",
    layoutComplexity: "低",
    size: "22MB",
    uploader: "黄涵",
    uploadedAt: "2025-03-11 16:20:00",
  },
  {
    id: "doc_5",
    name: "制度汇编.pdf",
    type: "PDF",
    processStatus: "已完成",
    usageStatus: "已启用",
    quality: "高",
    layoutComplexity: "中",
    size: "18MB",
    uploader: "刘明明",
    uploadedAt: "2025-03-10 09:12:00",
  },
  {
    id: "doc_6",
    name: "会议纪要.docx",
    type: "DOCX",
    processStatus: "解析失败",
    usageStatus: "已停用",
    quality: "-",
    layoutComplexity: "-",
    size: "4MB",
    uploader: "黄涵",
    uploadedAt: "2025-03-09 14:05:00",
  },
  {
    id: "doc_7",
    name: "案例库.txt",
    type: "TXT",
    processStatus: "切片失败",
    usageStatus: "已停用",
    quality: "低",
    layoutComplexity: "高",
    size: "1MB",
    uploader: "刘明明",
    uploadedAt: "2025-03-08 10:40:00",
  },
];

const customRetrievalItems = [
  { label: "全文检索", configured: true, clickable: false },
  { label: "语义检索", configured: true, clickable: false },
  { label: "PageIndex检索", configured: true, clickable: false },
  { label: "元数据增强", configured: true, clickable: false },
  { label: "文档标签增强", configured: true, clickable: false },
  { label: "内容标签增强", configured: false, clickable: false },
  { label: "图谱检索", configured: true, clickable: true },
  { label: "混合检索策略 (20)", configured: true, clickable: false },
];

const templateRetrievalItems = [
  { label: "全文检索", configured: true, clickable: false },
  { label: "语义检索", configured: true, clickable: false },
  { label: "混合检索策略 (1)", configured: true, clickable: false },
];

function FileTypeIcon({ type }: { type: DocType }) {
  const styles: Record<DocType, string> = {
    PDF: "bg-red-500",
    DOC: "bg-blue-600",
    DOCX: "bg-blue-600",
    TXT: "bg-slate-500",
  };
  const labels: Record<DocType, string> = {
    PDF: "PDF",
    DOC: "W",
    DOCX: "W",
    TXT: "TXT",
  };

  return (
    <div
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white",
        styles[type]
      )}
    >
      {labels[type]}
    </div>
  );
}

function StatusDot({
  color,
  label,
}: {
  color: "green" | "gray" | "red" | "orange" | "blue";
  label: string;
}) {
  const colorMap = {
    green: "bg-emerald-500",
    gray: "bg-slate-400",
    red: "bg-red-500",
    orange: "bg-orange-500",
    blue: "bg-blue-500",
  };

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
      <span className={cn("h-2 w-2 rounded-full", colorMap[color])} />
      {label}
    </span>
  );
}

function ProcessStatusCell({ status }: { status: ProcessStatus }) {
  if (status === "解析中" || status === "处理中") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-blue-600">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {status}
      </span>
    );
  }

  if (status === "已解析" || status === "已完成") {
    return <StatusDot color="green" label={status} />;
  }

  if (status === "解析失败") {
    return <StatusDot color="red" label={status} />;
  }

  return <StatusDot color="orange" label={status} />;
}

function QualityBadge({ level }: { level: QualityLevel }) {
  if (level === "-") {
    return <span className="text-slate-400">-</span>;
  }

  const styles: Record<Exclude<QualityLevel, "-">, string> = {
    高: "border-emerald-300 text-emerald-600 bg-emerald-50",
    中: "border-orange-300 text-orange-600 bg-orange-50",
    低: "border-red-300 text-red-600 bg-red-50",
  };

  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-8 items-center justify-center rounded border px-2 text-xs",
        styles[level]
      )}
    >
      {level}
    </span>
  );
}

function OverviewStat({
  count,
  color,
  label,
}: {
  count: number;
  color: "green" | "gray" | "red" | "orange" | "blue";
  label: string;
}) {
  const colorMap = {
    green: "bg-emerald-500",
    gray: "bg-slate-400",
    red: "bg-red-500",
    orange: "bg-orange-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <span className="font-medium">{count}个</span>
        <span className={cn("h-2 w-2 rounded-full", colorMap[color])} />
        <span>{label}</span>
      </div>
    </div>
  );
}

function ConfigStatusBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
      已配
    </span>
  ) : (
    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400">
      未配
    </span>
  );
}

function TagChips({
  items,
  maxVisible = 3,
}: {
  items: string[];
  maxVisible?: number;
}) {
  const visible = items.slice(0, maxVisible);
  const rest = items.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
        >
          {item}
        </span>
      ))}
      {rest > 0 && (
        <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500">
          +{rest}
        </span>
      )}
    </div>
  );
}

function KnowledgeBaseDocumentList({
  documents,
  onToggleUsage,
  onDelete,
  onImport,
}: {
  documents: KbDocument[];
  onToggleUsage: (id: string) => void;
  onDelete: (id: string) => void;
  onImport: (files: File[]) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [timePreset, setTimePreset] = useState<TimePreset>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openImport = () => {
    setPendingFiles([]);
    setImportOpen(true);
  };

  const confirmImport = () => {
    if (pendingFiles.length === 0) {
      toast.error("请先选择要上传的文档");
      return;
    }
    onImport(pendingFiles);
    setImportOpen(false);
    setPendingFiles([]);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <h2 className="text-base font-semibold text-slate-900">
          文档列表（{filteredDocuments.length}）
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-52">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜索文档名称"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {(
            [
              { key: "1h", label: "近1小时" },
              { key: "1d", label: "近1天" },
              { key: "1w", label: "近1周" },
            ] as const
          ).map((item) => (
            <Button
              key={item.key}
              variant="outline"
              size="sm"
              className={cn(
                timePreset === item.key &&
                  "border-[#2773ff] bg-blue-50 text-[#2773ff]"
              )}
              onClick={() =>
                setTimePreset((prev) => (prev === item.key ? null : item.key))
              }
            >
              {item.label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-slate-600"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            开始时间 - 结束时间
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => toast.success("已刷新文档列表")}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            className="bg-[#2773ff] text-white hover:bg-[#1f63e0]"
            onClick={openImport}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            导入文档
          </Button>
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <FolderOpen className="mb-3 h-12 w-12 text-slate-300" />
          <p className="mb-1 text-sm text-slate-500">暂无文档</p>
          <p className="mb-3 text-xs text-slate-400">
            请上传文档以进行 RAG 解析与切片
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-[#2773ff] hover:underline"
            onClick={openImport}
          >
            <Upload className="h-3.5 w-3.5" />
            立即上传
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>
                  <span className="inline-flex items-center gap-1">
                    文档名称 <Filter className="h-3 w-3 text-slate-400" />
                  </span>
                </TableHead>
                <TableHead>
                  <span className="inline-flex items-center gap-1">
                    文档类型 <Filter className="h-3 w-3 text-slate-400" />
                  </span>
                </TableHead>
                <TableHead>
                  <span className="inline-flex items-center gap-1">
                    处理状态 <Filter className="h-3 w-3 text-slate-400" />
                  </span>
                </TableHead>
                <TableHead>
                  <span className="inline-flex items-center gap-1">
                    使用状态 <Filter className="h-3 w-3 text-slate-400" />
                  </span>
                </TableHead>
                <TableHead>
                  <span className="inline-flex items-center gap-1">
                    文档质量 <Filter className="h-3 w-3 text-slate-400" />
                  </span>
                </TableHead>
                <TableHead>
                  <span className="inline-flex items-center gap-1">
                    排版复杂度 <Filter className="h-3 w-3 text-slate-400" />
                  </span>
                </TableHead>
                <TableHead>
                  <span className="inline-flex items-center gap-1">
                    文档大小 <Filter className="h-3 w-3 text-slate-400" />
                  </span>
                </TableHead>
                <TableHead>
                  <span className="inline-flex items-center gap-1">
                    上传人 <Filter className="h-3 w-3 text-slate-400" />
                  </span>
                </TableHead>
                <TableHead className="min-w-[180px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileTypeIcon type={doc.type} />
                      <span className="text-sm text-slate-800">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">
                    {doc.type}
                  </TableCell>
                  <TableCell>
                    <ProcessStatusCell status={doc.processStatus} />
                  </TableCell>
                  <TableCell>
                    <StatusDot
                      color={doc.usageStatus === "已启用" ? "green" : "gray"}
                      label={doc.usageStatus}
                    />
                  </TableCell>
                  <TableCell>
                    <QualityBadge level={doc.quality} />
                  </TableCell>
                  <TableCell>
                    <QualityBadge level={doc.layoutComplexity} />
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">
                    {doc.size}
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">
                    {doc.uploader}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 text-sm">
                      <button
                        type="button"
                        className="text-[#2773ff] hover:text-[#1f63e0]"
                        onClick={() => toast.message(`编辑文档：${doc.name}`)}
                      >
                        编辑
                      </button>
                      {doc.usageStatus === "已停用" ? (
                        <button
                          type="button"
                          className="text-[#2773ff] hover:text-[#1f63e0]"
                          onClick={() => onToggleUsage(doc.id)}
                        >
                          启用
                        </button>
                      ) : doc.processStatus === "已解析" ||
                        doc.processStatus === "已完成" ? (
                        <button
                          type="button"
                          className="text-[#2773ff] hover:text-[#1f63e0]"
                          onClick={() =>
                            toast.message(`开始切片：${doc.name}`)
                          }
                        >
                          切片
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="text-[#2773ff] hover:text-[#1f63e0]"
                          onClick={() => onToggleUsage(doc.id)}
                        >
                          停用
                        </button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-0.5 text-[#2773ff] hover:text-[#1f63e0]"
                          >
                            更多
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              toast.message(`下载文档：${doc.name}`)
                            }
                          >
                            下载
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onToggleUsage(doc.id)}
                          >
                            {doc.usageStatus === "已启用" ? "停用" : "启用"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => onDelete(doc.id)}
                          >
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>导入文档</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-slate-500">
              支持 PDF / DOC / DOCX / TXT，上传后将自动进入 RAG 解析与切片流程。
            </p>
            <FileUpload
              value={pendingFiles}
              onChange={setPendingFiles}
              accept=".doc,.docx,.pdf,.txt"
              maxFiles={20}
              maxSize={200}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              取消
            </Button>
            <Button
              className="bg-[#2773ff] text-white hover:bg-[#1f63e0]"
              onClick={confirmImport}
            >
              开始解析
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function toKbDocuments(docs: StoredKbDocument[]): KbDocument[] {
  return docs.map((doc) => ({
    ...doc,
    type: normalizeDocType(doc.type),
    processStatus: doc.processStatus as ProcessStatus,
    usageStatus: doc.usageStatus as UsageStatus,
    quality: doc.quality as QualityLevel,
    layoutComplexity: doc.layoutComplexity as QualityLevel,
  }));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatNowLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function normalizeDocType(value: string): DocType {
  const normalized = value.toUpperCase();
  if (["PDF", "DOC", "DOCX", "TXT"].includes(normalized)) {
    return normalized as DocType;
  }
  return "TXT";
}

function resolveFileType(fileName: string): DocType {
  const ext = fileName.split(".").pop()?.toUpperCase();
  return normalizeDocType(ext ?? "TXT");
}

export function TemplateKnowledgeBaseDetail({
  meta,
  initialHitTest = false,
}: KnowledgeBaseDetailWorkbenchProps) {
  const isCustom = meta.createMethod === "自定义创建";
  const [status, setStatus] = useState(meta.status);
  const [showHitTest, setShowHitTest] = useState(initialHitTest);
  const [documents, setDocuments] = useState<KbDocument[]>([]);
  const [docsReady, setDocsReady] = useState(false);
  const [editingBasic, setEditingBasic] = useState(false);
  const [graphDrawerOpen, setGraphDrawerOpen] = useState(false);
  const [basicInfo, setBasicInfo] = useState({
    name: meta.name,
    description:
      meta.description ||
      (meta.documentCount === 0
        ? "暂无描述"
        : "这是一段描述信息描述信息描述信息描述信息描述信息"),
    groupName: meta.groupName || "全部群组",
    creator: meta.creator,
    createTime: meta.createTime,
    metadataTags: ["doc_id 1%", "doc_id 1%", "doc_id 1%", "source", "author"],
    documentTags: ["标签", "标签", "标签", "标签", "标签"],
    contentTags: ["标签", "标签", "标签", "标签", "标签"],
  });

  /* eslint-disable react-hooks/set-state-in-effect -- document data is restored from browser localStorage after hydration. */
  useEffect(() => {
    const stored = loadKnowledgeBaseDocuments(meta.id);
    if (stored !== null) {
      setDocuments(toKbDocuments(stored));
    } else if (meta.documentCount === 0) {
      setDocuments([]);
    } else {
      setDocuments(mockDocuments);
    }
    setDocsReady(true);
  }, [meta.id, meta.documentCount]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!docsReady) return;
    // 仅对本地创建的知识库（或已有文档存储记录）持久化
    const stored = loadKnowledgeBaseDocuments(meta.id);
    if (stored !== null || meta.documentCount === 0) {
      saveKnowledgeBaseDocuments(meta.id, documents);
    }
  }, [documents, docsReady, meta.id, meta.documentCount]);

  const overview = useMemo(() => {
    return {
      total: documents.length,
      enabled: documents.filter((d) => d.usageStatus === "已启用").length,
      disabled: documents.filter((d) => d.usageStatus === "已停用").length,
      parsed: documents.filter((d) => d.processStatus === "已解析").length,
      parseFailed: documents.filter((d) => d.processStatus === "解析失败")
        .length,
      completed: documents.filter((d) => d.processStatus === "已完成").length,
      sliceFailed: documents.filter((d) => d.processStatus === "切片失败")
        .length,
    };
  }, [documents]);

  const retrievalItems = isCustom
    ? customRetrievalItems
    : templateRetrievalItems;

  const handleToggleKbStatus = () => {
    const next = status === "已启用" ? "已停用" : "已启用";
    setStatus(next);
    toast.success(next === "已启用" ? "知识库已启用" : "知识库已停用");
  };

  const handleToggleDocUsage = (id: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              usageStatus: doc.usageStatus === "已启用" ? "已停用" : "已启用",
            }
          : doc
      )
    );
  };

  const handleDeleteDoc = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    toast.success("文档已删除");
  };

  const handleImportDocs = (files: File[]) => {
    const now = formatNowLocal();
    const newDocs: KbDocument[] = files.map((file, index) => ({
      id: `doc_${Date.now()}_${index}`,
      name: file.name,
      type: resolveFileType(file.name),
      processStatus: "解析中",
      usageStatus: "已停用",
      quality: "-",
      layoutComplexity: "-",
      size: formatFileSize(file.size),
      uploader: meta.creator || "当前用户",
      uploadedAt: now,
    }));

    setDocuments((prev) => [...newDocs, ...prev]);
    toast.success(
      `已上传 ${files.length} 个文档，正在进行 RAG 解析切片`
    );

    // 模拟解析完成
    window.setTimeout(() => {
      setDocuments((prev) =>
        prev.map((doc) =>
          newDocs.some((n) => n.id === doc.id)
            ? { ...doc, processStatus: "已解析", quality: "中", layoutComplexity: "中" }
            : doc
        )
      );
      toast.message("部分文档解析完成，可继续执行切片");
    }, 2500);
  };

  if (showHitTest) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={() => setShowHitTest(false)}
            className="rounded-lg p-2 transition-colors hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">
            命中测试（{basicInfo.name}）
          </h1>
        </div>
        <div className="flex-1 overflow-hidden p-6">
          <HitTestingView />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] overflow-y-auto rounded-lg border border-slate-200 bg-[#f8f9fb]">
      <div className="space-y-4 p-5">
        {/* Header */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/knowledge-base"
              className="rounded-lg p-2 transition-colors hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Link>
            <h1 className="text-lg font-semibold text-slate-900">
              知识库详情（{basicInfo.name}）
            </h1>
            <StatusDot
              color={status === "已启用" ? "green" : "gray"}
              label={status}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => toast.success("已复制知识库配置")}
            >
              复制
            </Button>
            <Button variant="outline" onClick={handleToggleKbStatus}>
              {status === "已启用" ? "停用" : "启用"}
            </Button>
            <Button
              className="bg-[#2773ff] text-white hover:bg-[#1f63e0]"
              onClick={() => setShowHitTest(true)}
            >
              命中测试
            </Button>
          </div>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                检索配置
              </h2>
              {isCustom && (
                <button
                  type="button"
                  className="text-sm text-[#2773ff] hover:underline"
                  onClick={() => toast.message("查看检索配置详情")}
                >
                  查看详情
                </button>
              )}
            </div>
            {isCustom ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {retrievalItems.map((item) => {
                  const content = (
                    <>
                      <span className="truncate text-sm text-slate-700">
                        {item.label}
                      </span>
                      <ConfigStatusBadge configured={item.configured} />
                    </>
                  );

                  if (item.clickable) {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setGraphDrawerOpen(true)}
                        className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:border-[#2773ff]/40 hover:bg-blue-50/60"
                      >
                        {content}
                      </button>
                    );
                  }

                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2.5"
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {retrievalItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <ConfigStatusBadge configured={item.configured} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                文档概览
              </h2>
              <span className="text-sm text-slate-500">
                共{overview.total}个
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-sm text-slate-500">使用状态</div>
                <div className="space-y-2">
                  <OverviewStat
                    count={overview.enabled}
                    color="green"
                    label="已启用"
                  />
                  <OverviewStat
                    count={overview.disabled}
                    color="gray"
                    label="已停用"
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm text-slate-500">处理状态</div>
                <div className="grid grid-cols-2 gap-2">
                  <OverviewStat
                    count={overview.parsed}
                    color="green"
                    label="已解析"
                  />
                  <OverviewStat
                    count={overview.parseFailed}
                    color="red"
                    label="解析失败"
                  />
                  <OverviewStat
                    count={overview.completed}
                    color="blue"
                    label="已完成"
                  />
                  <OverviewStat
                    count={overview.sliceFailed}
                    color="orange"
                    label="切片失败"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">基本信息</h2>
            <button
              type="button"
              onClick={() => setEditingBasic((v) => !v)}
              className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="编辑基本信息"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3">
            <div>
              <div className="mb-1 text-sm text-slate-500">知识库名称</div>
              {editingBasic ? (
                <Input
                  value={basicInfo.name}
                  onChange={(e) =>
                    setBasicInfo((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              ) : (
                <div className="text-sm text-slate-900">{basicInfo.name}</div>
              )}
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-500">描述</div>
              {editingBasic ? (
                <Input
                  value={basicInfo.description}
                  onChange={(e) =>
                    setBasicInfo((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              ) : (
                <div className="truncate text-sm text-slate-900">
                  {basicInfo.description}
                </div>
              )}
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-500">群组</div>
              <div className="text-sm text-slate-900">{basicInfo.groupName}</div>
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-500">创建配置</div>
              <div className="text-sm text-slate-900">
                {isCustom ? "自定义创建" : "模板创建"}
              </div>
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-500">创建人</div>
              <div className="text-sm text-slate-900">{basicInfo.creator}</div>
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-500">创建时间</div>
              <div className="text-sm text-slate-900">{basicInfo.createTime}</div>
            </div>

            {isCustom && (
              <>
                <div>
                  <div className="mb-1 text-sm text-slate-500">元数据配置</div>
                  <TagChips items={basicInfo.metadataTags} />
                </div>
                <div>
                  <div className="mb-1 text-sm text-slate-500">文档标签</div>
                  <TagChips items={basicInfo.documentTags} />
                </div>
                <div>
                  <div className="mb-1 text-sm text-slate-500">内容标签</div>
                  <TagChips items={basicInfo.contentTags} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Shared document list */}
        <KnowledgeBaseDocumentList
          documents={documents}
          onToggleUsage={handleToggleDocUsage}
          onDelete={handleDeleteDoc}
          onImport={handleImportDocs}
        />
      </div>

      <GraphRetrievalDrawer
        open={graphDrawerOpen}
        onOpenChange={setGraphDrawerOpen}
      />
    </div>
  );
}

"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Copy,
  FileText,
  Info,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getKnowledgeBaseV2,
  getKnowledgeDocumentsV2,
  knowledgeBasesV2,
  type KnowledgeDocumentRow,
} from "@/lib/mock-knowledge-base-v2";
import {
  getKnowledgeBaseMeta,
  type KnowledgeBaseListItem,
} from "@/lib/mock/knowledge-base-list";
import { TemplateKnowledgeBaseDetail } from "@/components/knowledge-base/TemplateKnowledgeBaseDetail";
import { cn } from "@/lib/utils";

type ImportFileKind = "text" | "table";

interface ImportQueueItem {
  id: string;
  file: File;
  kind: ImportFileKind;
}

interface MetadataFieldDraft {
  id: string;
  name: string;
  description: string;
  matchModes: string[];
}

const documentTagOptions = ["产品手册", "制度规范", "FAQ", "合同资料", "培训材料"];
const contentTagOptions = ["奶茶", "门店经营", "供应商", "定价", "售后"];

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${Math.ceil(size / 1024)} KB`;
  }
  return `${size} B`;
}

function fileTypeFromName(name: string) {
  const suffix = name.split(".").pop();
  return suffix ? suffix.toLowerCase() : "--";
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-slate-200 py-3 text-sm">
      <span className="text-slate-700">{label}</span>
      <span className="rounded bg-slate-50 px-2 py-0.5 text-xs text-slate-500">{value}</span>
    </div>
  );
}

function Metric({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("h-2 w-2 rounded-full", dot)} />
      <span>{label}</span>
      <strong className="text-2xl font-semibold text-slate-950">{value}</strong>
    </span>
  );
}

function BasicInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
}

function ConfigDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [tab, setTab] = useState("retrieval");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] overflow-auto p-0 sm:max-w-none">
        <SheetHeader className="border-b border-slate-200 px-6 py-5">
          <SheetTitle>知识库检索配置</SheetTitle>
        </SheetHeader>
        <div className="px-6 py-5">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-10 rounded-none bg-transparent p-0">
              <TabsTrigger value="retrieval" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent">
                检索配置
              </TabsTrigger>
              <TabsTrigger value="mixed" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent">
                混合检索策略配置
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {tab === "retrieval" ? (
            <div className="mt-8 flex h-72 items-center justify-center text-sm text-slate-400">
              暂无检索配置
            </div>
          ) : (
            <div className="mt-6">
              <div className="flex items-center justify-between border border-slate-200 px-4 py-3">
                <span className="font-medium text-slate-900">检索策略（1）</span>
                <Button variant="outline" size="sm">收起</Button>
              </div>
              <div className="border-x border-b border-slate-200 px-4 py-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-800">检索策略_1</span>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">待配置</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ToggleStrategyButton({
  children,
  selected,
  onClick,
}: {
  children: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 border px-4 text-sm",
        selected
          ? "border-blue-500 bg-blue-50 font-medium text-blue-700"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
      )}
    >
      {children}
    </button>
  );
}

function ImportDocumentDrawer({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (documents: KnowledgeDocumentRow[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileKind, setFileKind] = useState<ImportFileKind>("text");
  const [queue, setQueue] = useState<ImportQueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [parsingStrategies, setParsingStrategies] = useState(["文字识别"]);
  const [cleanHeaderFooter, setCleanHeaderFooter] = useState(true);
  const [cleanLogo, setCleanLogo] = useState(false);
  const [cleanWatermark, setCleanWatermark] = useState(false);
  const [contentClean, setContentClean] = useState(true);
  const [qualityAnalysis, setQualityAnalysis] = useState(false);
  const [autoChunk, setAutoChunk] = useState(true);
  const [semanticChunk, setSemanticChunk] = useState("智能切片");
  const [fulltextChunk, setFulltextChunk] = useState("智能切片");
  const [pageIndexChunk, setPageIndexChunk] = useState("按层级切分");
  const [metadataFields, setMetadataFields] = useState<MetadataFieldDraft[]>([
    {
      id: "metadata-source",
      name: "来源",
      description: "文档来源系统或资料出处",
      matchModes: ["精准匹配"],
    },
  ]);
  const [documentTags, setDocumentTags] = useState<string[]>(["产品手册"]);
  const [contentTags, setContentTags] = useState<string[]>(["奶茶"]);

  const accept = fileKind === "text" ? ".doc,.docx,.pdf,.txt" : ".xls,.xlsx,.csv";

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).slice(0, Math.max(0, 20 - queue.length));
    if (files.length === 0) return;
    setQueue((current) => [
      ...current,
      ...files.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        kind: fileKind,
      })),
    ]);
  }

  function toggleParsingStrategy(strategy: string) {
    setParsingStrategies((current) => {
      if (current.includes(strategy)) {
        const next = current.filter((item) => item !== strategy);
        return next.length === 0 ? current : next;
      }
      return [...current, strategy];
    });
  }

  function removeQueuedFile(id: string) {
    setQueue((current) => current.filter((item) => item.id !== id));
  }

  function addMetadataField() {
    setMetadataFields((current) => [
      ...current,
      {
        id: `metadata-${Date.now()}`,
        name: "",
        description: "",
        matchModes: ["精准匹配"],
      },
    ]);
  }

  function updateMetadataField(id: string, patch: Partial<MetadataFieldDraft>) {
    setMetadataFields((current) =>
      current.map((field) => (field.id === id ? { ...field, ...patch } : field))
    );
  }

  function removeMetadataField(id: string) {
    setMetadataFields((current) => current.filter((field) => field.id !== id));
  }

  function toggleMetadataMatchMode(id: string, mode: string) {
    setMetadataFields((current) =>
      current.map((field) => {
        if (field.id !== id) return field;
        const nextModes = field.matchModes.includes(mode)
          ? field.matchModes.filter((item) => item !== mode)
          : [...field.matchModes, mode];
        return { ...field, matchModes: nextModes };
      })
    );
  }

  function toggleTag(value: string, selected: string[], setSelected: (next: string[]) => void) {
    if (selected.includes(value)) {
      setSelected(selected.filter((item) => item !== value));
      return;
    }
    setSelected([...selected, value]);
  }

  function confirmImport() {
    if (queue.length === 0) return;
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    const importedDocuments = queue.map<KnowledgeDocumentRow>((item, index) => ({
      id: `local-doc-${item.id}-${index}`,
      name: item.file.name,
      type: fileTypeFromName(item.file.name),
      processStatus: "已启用",
      usageStatus: "已启用",
      quality: qualityAnalysis ? "分析中" : "--",
      complexity: item.kind === "table" ? "中" : "低",
      size: formatFileSize(item.file.size),
      uploader: "管理员",
      uploadedAt: timestamp,
      metadataFields: metadataFields
        .filter((field) => field.name.trim())
        .map((field) => ({
          name: field.name.trim(),
          description: field.description.trim(),
          matchModes: field.matchModes,
        })),
      documentTags,
      contentTags,
    }));
    onImport(importedDocuments);
    setQueue([]);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[calc(100vw-240px)] overflow-auto p-0 sm:max-w-none">
        <SheetHeader className="border-b border-slate-200 px-6 py-5">
          <SheetTitle>导入文档</SheetTitle>
        </SheetHeader>
        <div className="space-y-9 px-6 py-6">
          <section>
            <h3 className="mb-6 font-semibold text-slate-950">上传文档</h3>
            <div className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-4">
              <div className="flex items-center gap-1 text-sm text-slate-700">
                <span className="text-red-500">*</span>本地上传
              </div>
              <div className="space-y-3">
                <div className="flex">
                  <ToggleStrategyButton selected={fileKind === "text"} onClick={() => setFileKind("text")}>文本型数据</ToggleStrategyButton>
                  <ToggleStrategyButton selected={fileKind === "table"} onClick={() => setFileKind("table")}>表格型数据</ToggleStrategyButton>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files) addFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    addFiles(event.dataTransfer.files);
                  }}
                  className={cn(
                    "flex h-48 w-full flex-col items-center justify-center border border-dashed text-center transition-colors",
                    dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white"
                  )}
                >
                  <Upload className="mb-5 h-6 w-6 text-slate-500" />
                  <div className="text-sm font-medium text-slate-900">
                    将单个或多个文件拖到此处，或<span className="text-blue-600">点击上传</span>
                  </div>
                  <p className="mt-5 text-xs text-slate-500">
                    {fileKind === "text"
                      ? "支持上传.doc .docx .pdf .txt文件;单次至多上传20个文件;每个文件不超过200MB"
                      : "支持上传.xls .xlsx .csv文件;单次至多上传20个文件;每个文件不超过200MB"}
                  </p>
                </button>
                {queue.length > 0 && (
                  <div className="border border-slate-200">
                    <div className="flex h-10 items-center justify-between border-b border-slate-100 px-4 text-sm">
                      <span className="font-medium text-slate-900">待导入文件（{queue.length}）</span>
                      <button type="button" className="text-blue-600" onClick={() => setQueue([])}>清空</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {queue.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="min-w-0 flex-1 truncate text-slate-900">{item.file.name}</span>
                          <span className="text-slate-500">{formatFileSize(item.file.size)}</span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                            {item.kind === "text" ? "文本型数据" : "表格型数据"}
                          </span>
                          <button type="button" className="text-slate-400 hover:text-red-600" onClick={() => removeQueuedFile(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-6 font-semibold text-slate-950">解析清洗</h3>
            <div className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-5">
              <div className="flex items-center gap-1 text-sm text-slate-700">
                <span className="text-red-500">*</span>解析策略
              </div>
              <div className="flex flex-wrap">
                {["文字识别", "图片文字识别(OCR)", "表格解析", "图片解析", "公式解析"].map((strategy) => (
                  <ToggleStrategyButton
                    key={strategy}
                    selected={parsingStrategies.includes(strategy)}
                    onClick={() => toggleParsingStrategy(strategy)}
                  >
                    {strategy}
                  </ToggleStrategyButton>
                ))}
              </div>
              <span className="flex items-center gap-1 text-sm text-slate-700">内容清洗 <Info className="h-3.5 w-3.5 text-slate-400" /></span>
              <div className="flex items-center gap-8">
                <Switch checked={contentClean} onCheckedChange={setContentClean} />
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={cleanHeaderFooter} onCheckedChange={(value) => setCleanHeaderFooter(Boolean(value))} />页眉页脚</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={cleanLogo} onCheckedChange={(value) => setCleanLogo(Boolean(value))} />Logo</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={cleanWatermark} onCheckedChange={(value) => setCleanWatermark(Boolean(value))} />水印</label>
              </div>
              <span className="flex items-center gap-1 text-sm text-slate-700">质量分析 <Info className="h-3.5 w-3.5 text-slate-400" /></span>
              <Switch checked={qualityAnalysis} onCheckedChange={setQualityAnalysis} />
            </div>
          </section>

          <section>
            <h3 className="mb-6 flex items-center gap-1 font-semibold text-slate-950">切片策略 <Info className="h-3.5 w-3.5 text-slate-400" /></h3>
            <div className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-5">
              <span className="text-sm text-slate-700">自动切片</span>
              <Switch checked={autoChunk} onCheckedChange={setAutoChunk} />
              {[
                { name: "语义检索", value: semanticChunk, setValue: setSemanticChunk, options: ["智能切片", "按常见标识符切分", "按页切分", "自定义正则切分", "按层级切分"] },
                { name: "全文检索", value: fulltextChunk, setValue: setFulltextChunk, options: ["智能切片", "按常见标识符切分", "按页切分", "自定义正则切分", "按层级切分"] },
                { name: "PageIndex 检索", value: pageIndexChunk, setValue: setPageIndexChunk, options: ["按层级切分"] },
              ].map((config) => (
                <div key={config.name} className="contents">
                  <span className="text-sm text-slate-700">{config.name}</span>
                  <div className="flex border border-slate-200">
                    <span className="flex w-28 items-center justify-center border-r border-slate-200 text-sm text-slate-700">
                      <span className="mr-1 text-red-500">*</span>选择策略
                    </span>
                    <div className="flex flex-1">
                      {config.options.map((option) => (
                        <ToggleStrategyButton
                          key={option}
                          selected={config.value === option}
                          onClick={() => config.setValue(option)}
                        >
                          {option}
                        </ToggleStrategyButton>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-950">元数据配置</h3>
              <Button type="button" variant="outline" size="sm" className="rounded" onClick={addMetadataField}>
                <Plus className="mr-2 h-4 w-4" />
                添加字段
              </Button>
            </div>
            <div className="border border-slate-200">
              <div className="grid grid-cols-[180px_1fr_260px_52px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <span>字段名称</span>
                <span>字段描述</span>
                <span>匹配模式</span>
                <span />
              </div>
              <div className="divide-y divide-slate-100">
                {metadataFields.map((field) => (
                  <div key={field.id} className="grid grid-cols-[180px_1fr_260px_52px] items-center gap-3 px-4 py-3">
                    <Input
                      value={field.name}
                      onChange={(event) => updateMetadataField(field.id, { name: event.target.value })}
                      placeholder="请输入字段名"
                      maxLength={20}
                      className="h-9 rounded"
                    />
                    <Input
                      value={field.description}
                      onChange={(event) => updateMetadataField(field.id, { description: event.target.value })}
                      placeholder="请输入字段描述"
                      maxLength={100}
                      className="h-9 rounded"
                    />
                    <div className="flex items-center gap-4 text-sm">
                      {["精准匹配", "语义匹配"].map((mode) => (
                        <label key={mode} className="flex items-center gap-2">
                          <Checkbox
                            checked={field.matchModes.includes(mode)}
                            onCheckedChange={() => toggleMetadataMatchMode(field.id, mode)}
                          />
                          {mode}
                        </label>
                      ))}
                    </div>
                    <button type="button" className="text-slate-400 hover:text-red-600" onClick={() => removeMetadataField(field.id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="font-semibold text-slate-950">标签配置</h3>
              <div className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-5">
                <span className="text-sm text-slate-700">文档标签</span>
                <div className="flex flex-wrap gap-2">
                  {documentTagOptions.map((tag) => (
                    <ToggleStrategyButton
                      key={tag}
                      selected={documentTags.includes(tag)}
                      onClick={() => toggleTag(tag, documentTags, setDocumentTags)}
                    >
                      {tag}
                    </ToggleStrategyButton>
                  ))}
                </div>
                <span className="text-sm text-slate-700">内容标签</span>
                <div className="flex flex-wrap gap-2">
                  {contentTagOptions.map((tag) => (
                    <ToggleStrategyButton
                      key={tag}
                      selected={contentTags.includes(tag)}
                      onClick={() => toggleTag(tag, contentTags, setContentTags)}
                    >
                      {tag}
                    </ToggleStrategyButton>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
        <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white px-6 py-4">
          <Button disabled={queue.length === 0} className="rounded bg-blue-600 px-8 hover:bg-blue-700" onClick={confirmImport}>确定</Button>
          <Button variant="outline" className="rounded px-6" onClick={() => onOpenChange(false)}>取消</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function GraphRagKnowledgeBaseDetail({ kbId }: { kbId: string }) {
  const searchParams = useSearchParams();
  const initialHitTest = searchParams.get("tab") === "test";
  const [meta, setMeta] = useState<KnowledgeBaseListItem | null>(null);
  const [ready, setReady] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- localStorage-backed metadata is available only after hydration. */
  useEffect(() => {
    setMeta(getKnowledgeBaseMeta(kbId));
    setReady(true);
  }, [kbId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!ready) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
        加载中...
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white">
        <p className="text-sm text-slate-500">未找到该知识库</p>
        <Link href="/knowledge-base" className="text-sm text-[#2773ff] hover:underline">
          返回知识库列表
        </Link>
      </div>
    );
  }

  return <TemplateKnowledgeBaseDetail meta={meta} initialHitTest={initialHitTest} />;
}

export default function KnowledgeBaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const isKnowledgeBaseV2 = useMemo(
    () => knowledgeBasesV2.some((item) => item.id === id),
    [id]
  );
  const detail = useMemo(() => getKnowledgeBaseV2(id), [id]);
  const initialDocuments = useMemo(() => getKnowledgeDocumentsV2(id), [id]);
  const [documents, setDocuments] = useState<KnowledgeDocumentRow[]>(initialDocuments);
  const [configOpen, setConfigOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredDocuments = documents.filter((document) =>
    document.name.toLowerCase().includes(search.toLowerCase())
  );

  function importDocuments(importedDocuments: KnowledgeDocumentRow[]) {
    setDocuments((current) => [...importedDocuments, ...current]);
  }

  function updateDocument(id: string, patch: Partial<KnowledgeDocumentRow>) {
    setDocuments((current) =>
      current.map((document) => (document.id === id ? { ...document, ...patch } : document))
    );
  }

  function deleteDocument(id: string) {
    setDocuments((current) => current.filter((document) => document.id !== id));
  }

  if (!isKnowledgeBaseV2) {
    return (
      <Suspense
        fallback={
          <div className="flex h-[calc(100vh-8rem)] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
            加载中...
          </div>
        }
      >
        <GraphRagKnowledgeBaseDetail kbId={id} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <div className="flex h-20 items-center justify-between border-b border-slate-200 px-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded" onClick={() => router.push("/knowledge-base")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-950">{detail.name}</h1>
            <span className="inline-flex items-center gap-1 text-sm text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              已启用
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded"><Copy className="mr-2 h-4 w-4" />复制</Button>
          <Button variant="outline" className="rounded">启用</Button>
          <Button className="rounded bg-blue-600 hover:bg-blue-700" onClick={() => router.push(`/knowledge-base/hit-test?id=${detail.id}`)}>
            命中测试
          </Button>
        </div>
      </div>

      <div className="space-y-7 p-6">
        <div className="grid grid-cols-[1fr_520px] gap-4">
          <section className="border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-950">检索配置</h2>
              <button type="button" className="text-sm text-slate-700 hover:text-blue-600" onClick={() => setConfigOpen(true)}>
                查看详情
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-6">
              <SummaryItem label="全文检索" value="未配" />
              <SummaryItem label="语义检索" value="未配" />
              <SummaryItem label="元数据增强" value="未配" />
              <SummaryItem label="文档标签增强" value="未配" />
              <SummaryItem label="PageIndex检索" value="未配" />
              <SummaryItem label="内容标签增强" value="未配" />
              <SummaryItem label="混合检索策略（0）" value="未配" />
            </div>
          </section>
          <section className="border border-slate-200 bg-white p-5">
            <h2 className="mb-5 font-semibold text-slate-950">文档概览</h2>
            <div className="mb-5 text-sm text-slate-500">共{documents.length}个</div>
            <div className="space-y-5 rounded bg-slate-50 px-6 py-5 text-sm text-slate-600">
              <div className="flex items-center gap-7">
                <span>使用状态</span>
                <Metric dot="bg-emerald-500" label="已启用" value={documents.filter((item) => item.usageStatus === "已启用").length} />
                <Metric dot="bg-slate-400" label="已停用" value={documents.filter((item) => item.usageStatus === "已停用").length} />
              </div>
              <div className="flex items-center gap-7">
                <span>处理状态</span>
                <Metric dot="bg-emerald-500" label="已启用" value={documents.filter((item) => item.processStatus === "已启用").length} />
                <Metric dot="bg-slate-400" label="已停用" value={documents.filter((item) => item.processStatus === "已停用").length} />
                <Metric dot="bg-red-500" label="解析失败" value={documents.filter((item) => item.processStatus === "解析失败").length} />
                <Metric dot="bg-amber-500" label="切片失败" value={documents.filter((item) => item.processStatus === "切片失败").length} />
              </div>
            </div>
          </section>
        </div>

        <section>
          <div className="mb-5 flex items-center gap-3">
            <h2 className="font-semibold text-slate-950">基本信息</h2>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-500">编辑基本信息</Button>
          </div>
          <div className="grid grid-cols-3 gap-x-12 gap-y-5">
            <BasicInfoItem label="知识库名称" value={detail.name} />
            <BasicInfoItem label="描述" value={detail.description || "--"} />
            <BasicInfoItem label="群组" value={detail.groupName} />
            <BasicInfoItem label="创建配置" value="--" />
            <BasicInfoItem label="创建人" value={detail.createdBy} />
            <BasicInfoItem label="创建时间" value={detail.createdAt} />
            <BasicInfoItem label="元数据配置" value="--" />
            <BasicInfoItem label="文档标签" value="--" />
            <BasicInfoItem label="内容标签" value="--" />
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-950">文档列表（{documents.length}）</h2>
          </div>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative w-60">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索文档名称" className="h-9 rounded pl-9" />
            </div>
            <div className="flex h-9 overflow-hidden border border-slate-200">
              {["近1小时", "近1天", "近1周"].map((item) => (
                <button key={item} type="button" className="border-r border-slate-200 px-4 text-sm last:border-r-0 hover:bg-slate-50">
                  {item}
                </button>
              ))}
            </div>
            <button type="button" className="flex h-9 w-80 items-center justify-between border border-slate-200 px-3 text-sm text-slate-400">
              <span>开始时间</span>
              <span>-</span>
              <span>结束时间</span>
              <Calendar className="h-4 w-4" />
            </button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded">
              <Search className="h-4 w-4" />
            </Button>
            <Button className="ml-auto rounded bg-blue-600 hover:bg-blue-700" onClick={() => setImportOpen(true)}>
              导入文档
            </Button>
          </div>

          <div className="overflow-hidden border-y border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>文档名称</TableHead>
                  <TableHead>文档类型</TableHead>
                  <TableHead>处理状态</TableHead>
                  <TableHead>使用状态</TableHead>
                  <TableHead>文档质量</TableHead>
                  <TableHead>排版复杂度</TableHead>
                  <TableHead>文档大小</TableHead>
                  <TableHead>上传人</TableHead>
                  <TableHead>上传时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">
                      <div>{document.name}</div>
                      {(document.documentTags?.length || document.contentTags?.length || document.metadataFields?.length) ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {document.documentTags?.map((tag) => (
                            <span key={`doc-${tag}`} className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-normal text-blue-700">
                              {tag}
                            </span>
                          ))}
                          {document.contentTags?.map((tag) => (
                            <span key={`content-${tag}`} className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-normal text-emerald-700">
                              {tag}
                            </span>
                          ))}
                          {Boolean(document.metadataFields?.length) && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-600">
                              元数据 {document.metadataFields?.length}
                            </span>
                          )}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>{document.type}</TableCell>
                    <TableCell>{document.processStatus}</TableCell>
                    <TableCell>{document.usageStatus}</TableCell>
                    <TableCell>{document.quality}</TableCell>
                    <TableCell>{document.complexity}</TableCell>
                    <TableCell>{document.size}</TableCell>
                    <TableCell>{document.uploader}</TableCell>
                    <TableCell>{document.uploadedAt}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-sm text-blue-600">
                            更多 <ChevronDown className="inline h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem
                            onSelect={() =>
                              updateDocument(document.id, {
                                usageStatus: document.usageStatus === "已启用" ? "已停用" : "已启用",
                              })
                            }
                          >
                            {document.usageStatus === "已启用" ? "停用" : "启用"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => updateDocument(document.id, { processStatus: "已启用" })}>
                            重新解析
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => updateDocument(document.id, { processStatus: "已启用" })}>
                            重新切片
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onSelect={() => deleteDocument(document.id)}>
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDocuments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="h-56 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <FileText className="mb-4 h-16 w-16 text-blue-200" />
                        <p className="text-base font-medium text-slate-700">您还没有导入任何文档</p>
                        <button type="button" className="mt-4 text-sm text-blue-600" onClick={() => setImportOpen(true)}>
                          + 导入文档
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <ConfigDrawer open={configOpen} onOpenChange={setConfigOpen} />
      <ImportDocumentDrawer open={importOpen} onOpenChange={setImportOpen} onImport={importDocuments} />
    </div>
  );
}

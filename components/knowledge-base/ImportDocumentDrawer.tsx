"use client";

import { useRef, useState } from "react";
import { FileText, Info, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  type KnowledgeDocumentRow,
} from "@/lib/mock-knowledge-base-v2";
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

const documentTagOptions = [
  "产品手册",
  "制度规范",
  "FAQ",
  "合同资料",
  "培训材料",
];
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

interface ImportDocumentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (documents: KnowledgeDocumentRow[]) => void;
  /** 当前知识库密级：文件密级默认并锁定为此值 */
  knowledgeBaseSecurityLevel?: import("@/lib/security-level").SecurityLevel;
}

export function ImportDocumentDrawer({
  open,
  onOpenChange,
  onImport,
  knowledgeBaseSecurityLevel = "公开",
}: ImportDocumentDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileKind, setFileKind] = useState<ImportFileKind>("text");
  const [queue, setQueue] = useState<ImportQueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [securityConfirmed, setSecurityConfirmed] = useState(false);
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
  const [graphChunk, setGraphChunk] = useState("按句子切分");
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

  const accept =
    fileKind === "text" ? ".doc,.docx,.pdf,.txt" : ".xls,.xlsx,.csv";

  function resetDraft() {
    setQueue([]);
    setDragging(false);
    setSecurityConfirmed(false);
    setFileKind("text");
    setParsingStrategies(["文字识别"]);
    setCleanHeaderFooter(true);
    setCleanLogo(false);
    setCleanWatermark(false);
    setContentClean(true);
    setQualityAnalysis(false);
    setAutoChunk(true);
    setSemanticChunk("智能切片");
    setFulltextChunk("智能切片");
    setPageIndexChunk("按层级切分");
    setGraphChunk("按句子切分");
    setMetadataFields([
      {
        id: "metadata-source",
        name: "来源",
        description: "文档来源系统或资料出处",
        matchModes: ["精准匹配"],
      },
    ]);
    setDocumentTags(["产品手册"]);
    setContentTags(["奶茶"]);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetDraft();
    onOpenChange(next);
  }

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

  function toggleTag(
    value: string,
    selected: string[],
    setSelected: (next: string[]) => void
  ) {
    if (selected.includes(value)) {
      setSelected(selected.filter((item) => item !== value));
      return;
    }
    setSelected([...selected, value]);
  }

  function confirmImport() {
    if (queue.length === 0) return;
    if (!securityConfirmed) {
      return;
    }
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
    resetDraft();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
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
                  <ToggleStrategyButton
                    selected={fileKind === "text"}
                    onClick={() => setFileKind("text")}
                  >
                    文本型数据
                  </ToggleStrategyButton>
                  <ToggleStrategyButton
                    selected={fileKind === "table"}
                    onClick={() => setFileKind("table")}
                  >
                    表格型数据
                  </ToggleStrategyButton>
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
                    dragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-300 bg-white"
                  )}
                >
                  <Upload className="mb-5 h-6 w-6 text-slate-500" />
                  <div className="text-sm font-medium text-slate-900">
                    将单个或多个文件拖到此处，或
                    <span className="text-blue-600">点击上传</span>
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
                      <span className="font-medium text-slate-900">
                        待导入文件（{queue.length}）
                      </span>
                      <button
                        type="button"
                        className="text-blue-600"
                        onClick={() => setQueue([])}
                      >
                        清空
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {queue.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-4 py-3 text-sm"
                        >
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="min-w-0 flex-1 truncate text-slate-900">
                            {item.file.name}
                          </span>
                          <span className="text-slate-500">
                            {formatFileSize(item.file.size)}
                          </span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                            {item.kind === "text" ? "文本型数据" : "表格型数据"}
                          </span>
                          <button
                            type="button"
                            className="text-slate-400 hover:text-red-600"
                            onClick={() => removeQueuedFile(item.id)}
                          >
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
                {[
                  "文字识别",
                  "图片文字识别(OCR)",
                  "表格解析",
                  "图片解析",
                  "公式解析",
                ].map((strategy) => (
                  <ToggleStrategyButton
                    key={strategy}
                    selected={parsingStrategies.includes(strategy)}
                    onClick={() => toggleParsingStrategy(strategy)}
                  >
                    {strategy}
                  </ToggleStrategyButton>
                ))}
              </div>
              <span className="flex items-center gap-1 text-sm text-slate-700">
                内容清洗 <Info className="h-3.5 w-3.5 text-slate-400" />
              </span>
              <div className="flex items-center gap-8">
                <Switch
                  checked={contentClean}
                  onCheckedChange={setContentClean}
                />
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={cleanHeaderFooter}
                    onCheckedChange={(value) =>
                      setCleanHeaderFooter(Boolean(value))
                    }
                  />
                  页眉页脚
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={cleanLogo}
                    onCheckedChange={(value) => setCleanLogo(Boolean(value))}
                  />
                  Logo
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={cleanWatermark}
                    onCheckedChange={(value) =>
                      setCleanWatermark(Boolean(value))
                    }
                  />
                  水印
                </label>
              </div>
              <span className="flex items-center gap-1 text-sm text-slate-700">
                质量分析 <Info className="h-3.5 w-3.5 text-slate-400" />
              </span>
              <Switch
                checked={qualityAnalysis}
                onCheckedChange={setQualityAnalysis}
              />
            </div>
          </section>

          <section>
            <h3 className="mb-6 flex items-center gap-1 font-semibold text-slate-950">
              切片策略 <Info className="h-3.5 w-3.5 text-slate-400" />
            </h3>
            <div className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-5">
              <span className="text-sm text-slate-700">自动切片</span>
              <Switch checked={autoChunk} onCheckedChange={setAutoChunk} />
              {(
                [
                  {
                    name: "语义检索",
                    value: semanticChunk,
                    setValue: setSemanticChunk,
                    options: [
                      "智能切片",
                      "按常见标识符切分",
                      "按页切分",
                      "自定义正则切分",
                      "按层级切分",
                    ],
                  },
                  {
                    name: "全文检索",
                    value: fulltextChunk,
                    setValue: setFulltextChunk,
                    options: [
                      "智能切片",
                      "按常见标识符切分",
                      "按页切分",
                      "自定义正则切分",
                      "按层级切分",
                    ],
                  },
                  {
                    name: "PageIndex 检索",
                    value: pageIndexChunk,
                    setValue: setPageIndexChunk,
                    options: ["按层级切分"],
                  },
                  {
                    name: "图谱检索",
                    value: graphChunk,
                    setValue: setGraphChunk,
                    options: ["按句子切分"],
                  },
                ] as const
              ).map((config) => (
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded"
                onClick={addMetadataField}
              >
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
                  <div
                    key={field.id}
                    className="grid grid-cols-[180px_1fr_260px_52px] items-center gap-3 px-4 py-3"
                  >
                    <Input
                      value={field.name}
                      onChange={(event) =>
                        updateMetadataField(field.id, {
                          name: event.target.value,
                        })
                      }
                      placeholder="请输入字段名"
                      maxLength={20}
                      className="h-9 rounded"
                    />
                    <Input
                      value={field.description}
                      onChange={(event) =>
                        updateMetadataField(field.id, {
                          description: event.target.value,
                        })
                      }
                      placeholder="请输入字段描述"
                      maxLength={100}
                      className="h-9 rounded"
                    />
                    <div className="flex items-center gap-4 text-sm">
                      {["精准匹配", "语义匹配"].map((mode) => (
                        <label key={mode} className="flex items-center gap-2">
                          <Checkbox
                            checked={field.matchModes.includes(mode)}
                            onCheckedChange={() =>
                              toggleMetadataMatchMode(field.id, mode)
                            }
                          />
                          {mode}
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-red-600"
                      onClick={() => removeMetadataField(field.id)}
                    >
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
                      onClick={() =>
                        toggleTag(tag, documentTags, setDocumentTags)
                      }
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
                      onClick={() =>
                        toggleTag(tag, contentTags, setContentTags)
                      }
                    >
                      {tag}
                    </ToggleStrategyButton>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
        <div className="sticky bottom-0 space-y-3 border-t border-slate-200 bg-white px-6 py-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-700">
              <span className="text-red-500">*</span>
              <span>文件密级</span>
              <span className="inline-flex items-center rounded-[4px] bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {knowledgeBaseSecurityLevel}
              </span>
              <span className="text-xs text-slate-400">（与当前知识库密级一致，不可修改）</span>
            </div>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <Checkbox
                checked={securityConfirmed}
                onCheckedChange={(checked) => setSecurityConfirmed(checked === true)}
                className="mt-0.5"
              />
              <span>
                我已确认本次上传文件密级为「{knowledgeBaseSecurityLevel}」，与知识库密级保持一致。
              </span>
            </label>
          </div>
          <div className="flex gap-3">
            <Button
              disabled={queue.length === 0 || !securityConfirmed}
              className="rounded bg-blue-600 px-8 hover:bg-blue-700"
              onClick={confirmImport}
            >
              确定
            </Button>
            <Button
              variant="outline"
              className="rounded px-6"
              onClick={() => handleOpenChange(false)}
            >
              取消
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  HelpCircle,
  List,
  Minus,
  Pencil,
  Plus,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { GraphRetrievalDrawer } from "@/components/knowledge-base/GraphRetrievalDrawer";
import { getKnowledgeDocumentsV2 } from "@/lib/mock-knowledge-base-v2";

type LeftTab = "preview" | "info";
type RightTab = "chunks" | "parse";
type ChunkStrategy =
  | "semantic-smart"
  | "pageindex-hierarchy"
  | "graph-sentence";

interface DocumentChunk {
  id: number;
  content: string;
  tags: string[];
}

interface DocumentMetadataColumn {
  key: string;
  tip?: string;
  value: string;
}

const DOCUMENT_NAME_MAX = 100;
const METADATA_VALUE_MAX = 100;

/** 文档名称：字母/中文开头，可含字母、中文、数字、_、-、. */
const DOCUMENT_NAME_PATTERN =
  /^[a-zA-Z\u4e00-\u9fa5][a-zA-Z\u4e00-\u9fa50-9_.-]*$/;

const DOCUMENT_TAG_OPTIONS = [
  { value: "Key1: Value1", label: "Key1: Value1" },
  { value: "Key1: Value2", label: "Key1: Value2" },
  { value: "产品手册", label: "产品手册" },
  { value: "制度规范", label: "制度规范" },
  { value: "FAQ", label: "FAQ" },
  { value: "合同资料", label: "合同资料" },
  { value: "培训材料", label: "培训材料" },
];

function isValidDocumentName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > DOCUMENT_NAME_MAX) return false;
  return DOCUMENT_NAME_PATTERN.test(trimmed);
}

function CountedInput({
  value,
  onChange,
  max,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  max: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Input
        value={value}
        placeholder={placeholder}
        maxLength={max}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        className="h-9 pr-14"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums text-slate-400">
        {value.length}/{max}
      </span>
    </div>
  );
}

function DocumentTagMultiSelect({
  value,
  onChange,
  options,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((opt) => value.includes(opt.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-h-9 w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm"
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {selected.length === 0 ? (
              <span className="text-slate-400">请选择文档标签</span>
            ) : (
              selected.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                >
                  {opt.label}
                  <span
                    role="button"
                    tabIndex={0}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(value.filter((item) => item !== opt.value));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        onChange(value.filter((item) => item !== opt.value));
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </span>
              ))
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-1"
        align="start"
      >
        <div className="max-h-60 overflow-auto">
          {options.map((opt) => {
            const checked = value.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
                onClick={() =>
                  onChange(
                    checked
                      ? value.filter((item) => item !== opt.value)
                      : [...value, opt.value]
                  )
                }
              >
                <Checkbox checked={checked} />
                <span className="text-left text-slate-700">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EditDocumentInfoDialog({
  open,
  onOpenChange,
  initialName,
  initialMetadata,
  initialTags,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  initialMetadata: DocumentMetadataColumn[];
  initialTags: string[];
  onConfirm: (payload: {
    name: string;
    metadata: DocumentMetadataColumn[];
    tags: string[];
  }) => void;
}) {
  const [name, setName] = useState(initialName);
  const [metadata, setMetadata] =
    useState<DocumentMetadataColumn[]>(initialMetadata);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [nameTouched, setNameTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setMetadata(initialMetadata.map((item) => ({ ...item })));
    setTags([...initialTags]);
    setNameTouched(false);
  }, [open, initialName, initialMetadata, initialTags]);

  const nameValid = isValidDocumentName(name);
  const showNameError = nameTouched && !nameValid;

  const tagOptions = useMemo(() => {
    const extras = tags
      .filter((tag) => !DOCUMENT_TAG_OPTIONS.some((opt) => opt.value === tag))
      .map((tag) => ({ value: tag, label: tag }));
    return [...DOCUMENT_TAG_OPTIONS, ...extras];
  }, [tags]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>编辑文档信息</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="grid grid-cols-[96px_1fr] items-start gap-4">
            <div className="flex items-center gap-0.5 pt-2 text-sm text-slate-700">
              <span className="text-red-500">*</span>
              文档名称
            </div>
            <div className="space-y-1.5">
              <CountedInput
                value={name}
                max={DOCUMENT_NAME_MAX}
                onChange={(next) => {
                  setName(next);
                  setNameTouched(true);
                }}
              />
              <p
                className={cn(
                  "text-xs leading-relaxed",
                  showNameError ? "text-red-500" : "text-slate-400"
                )}
              >
                支持字母、中文、数字、下划线(_)、中划线(-)、点(.)，并且必须以字母或中文开头
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[96px_1fr] items-start gap-4">
            <div className="pt-2 text-sm text-slate-700">元数据</div>
            <div className="rounded-md border border-slate-200 bg-slate-50/40 p-3">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {metadata.map((column, index) => (
                  <div key={column.key} className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <span className="truncate">{column.key}</span>
                      {column.tip ? (
                        <span title={column.tip} className="text-slate-400">
                          <HelpCircle className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </div>
                    <CountedInput
                      value={column.value === "—" ? "" : column.value}
                      max={METADATA_VALUE_MAX}
                      placeholder="示例文本"
                      onChange={(next) =>
                        setMetadata((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, value: next } : item
                          )
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[96px_1fr] items-start gap-4">
            <div className="pt-2 text-sm text-slate-700">文档标签</div>
            <DocumentTagMultiSelect
              value={tags}
              onChange={setTags}
              options={tagOptions}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            className="rounded bg-[#2773ff] hover:bg-[#1f63e0]"
            disabled={!nameValid}
            onClick={() => {
              if (!nameValid) {
                setNameTouched(true);
                return;
              }
              onConfirm({
                name: name.trim(),
                metadata: metadata.map((item) => ({
                  ...item,
                  value: item.value.trim() || "—",
                })),
                tags,
              });
              onOpenChange(false);
            }}
          >
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const CHUNK_STRATEGY_OPTIONS = [
  { value: "semantic-smart", label: "语义检索：智能切片" },
  { value: "pageindex-hierarchy", label: "pageindex检索：按层级解析" },
  { value: "graph-sentence", label: "图谱检索：按句子切片" },
];

const SAMPLE_PREVIEW = `北京住房租赁合同

甲方（出租人）：张某某
乙方（承租人）：李某某

根据《中华人民共和国民法典》及相关法律法规，甲乙双方在平等、自愿的基础上，就房屋租赁事宜协商一致，订立本合同。

第一条 房屋基本情况
甲方将位于北京市朝阳区建国路88号某小区3号楼2单元1501室的房屋出租给乙方使用。该房屋建筑面积约89平方米，房屋用途为住宅。

第二条 租赁期限
租赁期限自2024年3月1日起至2026年2月28日止，共计24个月。租赁期满，乙方如需续租，应提前30日书面通知甲方。

第三条 租金及支付方式
月租金为人民币捌仟元整（¥8,000.00）。乙方应于每月1日前将当月租金支付至甲方指定账户。押金为两个月租金，计人民币壹万陆仟元整（¥16,000.00）。

第四条 房屋交付与验收
甲方应于合同签订后3日内将房屋及附属设施交付乙方。双方应共同对房屋现状进行验收并签署交接清单。

第五条 双方权利义务
甲方应保证房屋权属清晰，不存在影响乙方正常居住的法律障碍。乙方应合理使用房屋，不得擅自转租、改建，并按时缴纳租金及物业等相关费用。

第六条 合同解除与违约责任
任何一方提前解除合同，应提前30日书面通知对方，并按约定承担相应违约责任。因不可抗力导致合同无法履行的，双方互不承担违约责任。

第七条 争议解决
本合同履行过程中发生争议，双方应友好协商；协商不成的，可向房屋所在地人民法院提起诉讼。

甲方（签章）：____________    乙方（签章）：____________
签订日期：2024年2月20日`;

const SAMPLE_CHUNKS: DocumentChunk[] = [
  {
    id: 1,
    content:
      "甲方（出租人）：张某某；乙方（承租人）：李某某。双方就北京市朝阳区建国路88号某小区3号楼2单元1501室房屋租赁事宜协商一致，订立本合同。",
    tags: ["切片标签1", "切片标签2", "切片标签3", "切片标签4", "切片标签5", "切片标签6", "切片标签7"],
  },
  {
    id: 2,
    content:
      "房屋基本情况：建筑面积约89平方米，用途为住宅。租赁期限自2024年3月1日起至2026年2月28日止，共计24个月。租赁期满如需续租，应提前30日书面通知甲方。",
    tags: ["切片标签1", "切片标签2", "切片标签3"],
  },
  {
    id: 3,
    content:
      "月租金为人民币捌仟元整（¥8,000.00）。乙方应于每月1日前支付当月租金。押金为两个月租金，计人民币壹万陆仟元整（¥16,000.00）。",
    tags: ["切片标签1", "切片标签2", "切片标签3", "切片标签4"],
  },
  {
    id: 4,
    content:
      "甲方应于合同签订后3日内交付房屋及附属设施，双方共同验收并签署交接清单。甲方保证权属清晰；乙方不得擅自转租、改建，并按时缴纳相关费用。",
    tags: ["切片标签1", "切片标签2"],
  },
  {
    id: 5,
    content:
      "任何一方提前解除合同，应提前30日书面通知对方并承担违约责任。争议协商不成的，可向房屋所在地人民法院提起诉讼。签订日期：2024年2月20日。",
    tags: ["切片标签1", "切片标签2", "切片标签3", "切片标签4", "切片标签5"],
  },
];

const VISIBLE_TAG_COUNT = 4;

function LevelBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50">
      {value || "--"}
    </span>
  );
}

function InfoTip({ content }: { content: string }) {
  return (
    <span
      className="inline-flex text-slate-400"
      title={content}
      aria-label={content}
    >
      <HelpCircle className="h-3.5 w-3.5" />
    </span>
  );
}

function ChunkTagRow({ tags }: { tags: string[] }) {
  const visible = tags.slice(0, VISIBLE_TAG_COUNT);
  const remaining = Math.max(0, tags.length - VISIBLE_TAG_COUNT);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600"
        >
          {tag}
        </span>
      ))}
      {remaining > 0 && (
        <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500">
          +{remaining}
        </span>
      )}
    </div>
  );
}

function BasicInfoItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-sm text-slate-900">{children}</div>
    </div>
  );
}

interface DocumentDetailViewProps {
  knowledgeBaseId: string;
  documentId: string;
  documentName?: string;
}

export function DocumentDetailView({
  knowledgeBaseId,
  documentId,
  documentName,
}: DocumentDetailViewProps) {
  const documentRecord = useMemo(() => {
    const list = getKnowledgeDocumentsV2(knowledgeBaseId);
    return list.find((item) => item.id === documentId) ?? null;
  }, [knowledgeBaseId, documentId]);

  const initialDisplayName =
    documentName?.trim() || documentRecord?.name || "北京住房租赁合同.docx";
  const fileType = (
    documentRecord?.type ||
    initialDisplayName.split(".").pop() ||
    "docx"
  ).toUpperCase();
  const initialDocumentTags = useMemo(
    () =>
      documentRecord?.documentTags && documentRecord.documentTags.length > 0
        ? documentRecord.documentTags
        : ["Key1: Value1", "Key1: Value2"],
    [documentRecord]
  );
  const quality = documentRecord?.quality || "高";
  const complexity = documentRecord?.complexity || "高";
  const size = documentRecord?.size || "22MB";
  const uploader = documentRecord?.uploader || "admin";
  const uploadedAt = documentRecord?.uploadedAt || "2025-08-15 12:20:30";

  const initialMetadataColumns: DocumentMetadataColumn[] = useMemo(() => {
    if (documentRecord?.metadataFields?.length) {
      return documentRecord.metadataFields.map((field) => {
        const lower = field.name.toLowerCase();
        let value = "";
        if (lower.includes("title") || field.name === "标题") {
          value = initialDisplayName.replace(/\.[^.]+$/, "");
        } else if (lower.includes("author") || field.name === "作者") {
          value = uploader;
        } else if (
          lower.includes("date") ||
          lower.includes("time") ||
          field.name.includes("日期")
        ) {
          value = uploadedAt.slice(0, 10);
        } else if (lower.includes("summary") || field.name.includes("摘要")) {
          value = field.description || "";
        } else if (field.description) {
          value = field.description;
        }
        return {
          key: field.name,
          tip: field.description || `字段：${field.name}`,
          value: value || "—",
        };
      });
    }
    return [
      {
        key: "title",
        tip: "文档标题",
        value: initialDisplayName.replace(/\.[^.]+$/, ""),
      },
      { key: "author", tip: "文档作者", value: uploader },
      {
        key: "publish_date",
        tip: "发布日期",
        value: uploadedAt.slice(0, 10),
      },
      { key: "summary", tip: "文档摘要", value: "近期市场..." },
    ];
  }, [documentRecord, initialDisplayName, uploader, uploadedAt]);

  const [enabled, setEnabled] = useState(
    () =>
      documentRecord?.processStatus === "已启用" ||
      documentRecord?.usageStatus === "已启用"
  );
  const [leftTab, setLeftTab] = useState<LeftTab>("preview");
  const [editInfoOpen, setEditInfoOpen] = useState(false);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [documentTags, setDocumentTags] = useState(initialDocumentTags);
  const [metadataColumns, setMetadataColumns] = useState(initialMetadataColumns);
  const [rightTab, setRightTab] = useState<RightTab>("chunks");
  const [strategy, setStrategy] = useState<ChunkStrategy>("semantic-smart");
  const [keyword, setKeyword] = useState("");
  const [selectedChunkId, setSelectedChunkId] = useState<number | null>(2);
  const [expandedChunkIds, setExpandedChunkIds] = useState<number[]>([]);
  const [zoom, setZoom] = useState(100);
  const [graphOpen, setGraphOpen] = useState(false);

  useEffect(() => {
    setDisplayName(initialDisplayName);
    setDocumentTags(initialDocumentTags);
    setMetadataColumns(initialMetadataColumns);
  }, [initialDisplayName, initialDocumentTags, initialMetadataColumns]);

  const filteredChunks = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return SAMPLE_CHUNKS;
    return SAMPLE_CHUNKS.filter(
      (chunk) =>
        String(chunk.id).includes(q) ||
        chunk.content.toLowerCase().includes(q) ||
        chunk.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [keyword]);

  const showViewGraph = strategy === "graph-sentence";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/knowledge-base/${knowledgeBaseId}`}
            className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="返回知识库详情"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="truncate text-base font-semibold text-slate-900">
            {displayName}
          </h1>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-slate-600">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                enabled ? "bg-emerald-500" : "bg-slate-400"
              )}
            />
            {enabled ? "已启用" : "已停用"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            className="rounded"
            onClick={() => toast.message("文档配置功能开发中")}
          >
            文档配置
          </Button>
          <Button
            className="rounded bg-[#2773ff] hover:bg-[#1f63e0]"
            onClick={() => {
              setEnabled((prev) => !prev);
              toast.success(enabled ? "文档已停用" : "文档已启用");
            }}
          >
            {enabled ? "停用" : "启用"}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="grid min-h-0 flex-1 grid-cols-2 overflow-hidden">
        {/* Left: preview / document info */}
        <section className="flex min-h-0 flex-col border-r border-slate-200">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-100 px-4">
            <div className="flex items-center gap-5">
              <button
                type="button"
                className={cn(
                  "border-b-2 pb-2.5 pt-2.5 text-sm font-medium",
                  leftTab === "preview"
                    ? "border-[#2773ff] text-[#2773ff]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
                onClick={() => setLeftTab("preview")}
              >
                原文预览
              </button>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 border-b-2 pb-2.5 pt-2.5 text-sm font-medium",
                  leftTab === "info"
                    ? "border-[#2773ff] text-[#2773ff]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
                onClick={() => setLeftTab("info")}
              >
                文档信息
                <span
                  role="button"
                  tabIndex={0}
                  className="rounded p-0.5 hover:bg-slate-100"
                  aria-label="编辑文档信息"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditInfoOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      setEditInfoOpen(true);
                    }
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </span>
              </button>
            </div>
            <button
              type="button"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              title="目录"
              onClick={() => toast.message("目录功能开发中")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {leftTab === "preview" ? (
            <div className="relative min-h-0 flex-1 overflow-hidden bg-[#f4f6f8]">
              <div className="h-full overflow-y-auto p-6">
                <div
                  className="mx-auto origin-top rounded-sm border border-slate-200 bg-white px-10 py-12 shadow-sm"
                  style={{
                    width: "min(100%, 720px)",
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "top center",
                  }}
                >
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-800">
                    {SAMPLE_PREVIEW}
                  </pre>
                </div>
              </div>

              <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-md">
                <button
                  type="button"
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-50"
                  onClick={() => setZoom((z) => Math.max(50, z - 10))}
                  aria-label="缩小"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="min-w-12 text-center text-xs text-slate-600">
                  {zoom}%
                </span>
                <button
                  type="button"
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-50"
                  onClick={() => setZoom((z) => Math.min(200, z + 10))}
                  aria-label="放大"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto bg-white px-6 py-6">
              <section className="space-y-5">
                <h2 className="text-base font-semibold text-slate-900">
                  基本信息
                </h2>
                <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                  <BasicInfoItem label="名称">{displayName}</BasicInfoItem>
                  <BasicInfoItem label="类型">{fileType}</BasicInfoItem>
                  <BasicInfoItem label="文档大小">{size}</BasicInfoItem>
                  <BasicInfoItem label="文档标签">
                    <ChunkTagRow tags={documentTags} />
                  </BasicInfoItem>
                  <BasicInfoItem label="文档质量">
                    <LevelBadge value={quality} />
                  </BasicInfoItem>
                  <BasicInfoItem label="排版复杂度">
                    <LevelBadge value={complexity} />
                  </BasicInfoItem>
                  <BasicInfoItem label="上传人">{uploader}</BasicInfoItem>
                  <BasicInfoItem label="上传时间">{uploadedAt}</BasicInfoItem>
                </div>
              </section>

              <section className="mt-10 space-y-4">
                <h2 className="text-base font-semibold text-slate-900">
                  元数据
                </h2>
                <div className="overflow-x-auto border border-slate-200">
                  <table className="w-full min-w-[520px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80">
                        {metadataColumns.map((column) => (
                          <th
                            key={column.key}
                            className="px-4 py-3 text-left font-medium text-slate-700"
                          >
                            <span className="inline-flex items-center gap-1">
                              {column.key}
                              {column.tip ? (
                                <InfoTip content={column.tip} />
                              ) : null}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {metadataColumns.map((column) => (
                          <td
                            key={column.key}
                            className="border-t border-slate-100 px-4 py-3 text-slate-800"
                          >
                            <span className="line-clamp-2" title={column.value}>
                              {column.value}
                            </span>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}
        </section>

        {/* Right: chunks */}
        <section className="flex min-h-0 flex-col bg-white">
          <div className="flex h-11 shrink-0 items-center gap-5 border-b border-slate-100 px-4">
            <button
              type="button"
              className={cn(
                "border-b-2 pb-2.5 pt-2.5 text-sm font-medium",
                rightTab === "chunks"
                  ? "border-[#2773ff] text-[#2773ff]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
              onClick={() => setRightTab("chunks")}
            >
              切片结果
            </button>
            <button
              type="button"
              className={cn(
                "border-b-2 pb-2.5 pt-2.5 text-sm font-medium",
                rightTab === "parse"
                  ? "border-[#2773ff] text-[#2773ff]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
              onClick={() => setRightTab("parse")}
            >
              解析结果
            </button>
          </div>

          {rightTab === "chunks" ? (
            <>
              <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-3">
                <span className="text-sm font-medium text-slate-800">
                  切片（{SAMPLE_CHUNKS.length}）
                </span>
                {showViewGraph && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded border-[#2773ff] text-[#2773ff] hover:bg-blue-50"
                    onClick={() => setGraphOpen(true)}
                  >
                    查看图谱
                  </Button>
                )}
                <div className="ml-auto w-[240px]">
                  <Select
                    value={strategy}
                    onValueChange={(value) =>
                      setStrategy(value as ChunkStrategy)
                    }
                    options={CHUNK_STRATEGY_OPTIONS}
                    className="h-8"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded"
                  onClick={() => toast.message("添加切片功能开发中")}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  添加切片
                </Button>
              </div>

              <div className="shrink-0 border-b border-slate-100 px-4 py-3">
                <div className="relative">
                  <Input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="搜索关键词或切片 ID"
                    className="h-9 rounded-md border-slate-200 pr-9"
                  />
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f4f6f8] p-4">
                {filteredChunks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
                    暂无匹配的切片
                  </div>
                ) : (
                  filteredChunks.map((chunk) => {
                    const selected = selectedChunkId === chunk.id;
                    const expanded = expandedChunkIds.includes(chunk.id);
                    const longContent = chunk.content.length > 90;
                    const displayContent =
                      !expanded && longContent
                        ? `${chunk.content.slice(0, 90)}...`
                        : chunk.content;

                    return (
                      <button
                        key={chunk.id}
                        type="button"
                        onClick={() => setSelectedChunkId(chunk.id)}
                        className={cn(
                          "w-full rounded-lg border bg-white p-4 text-left shadow-sm transition-colors",
                          selected
                            ? "border-[#2773ff] ring-1 ring-[#2773ff]/30"
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>切片 ID: {chunk.id}</span>
                          <span>字符: {chunk.content.length}</span>
                        </div>
                        <p className="mb-2 text-sm leading-relaxed text-slate-800">
                          {displayContent}
                          {longContent && (
                            <button
                              type="button"
                              className="ml-1 text-[#2773ff] hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedChunkIds((prev) =>
                                  prev.includes(chunk.id)
                                    ? prev.filter((id) => id !== chunk.id)
                                    : [...prev, chunk.id]
                                );
                              }}
                            >
                              {expanded ? (
                                <span className="inline-flex items-center gap-0.5">
                                  收起 <Minus className="h-3 w-3" />
                                </span>
                              ) : (
                                "更多"
                              )}
                            </button>
                          )}
                        </p>
                        <ChunkTagRow tags={chunk.tags} />
                      </button>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
              解析结果示例开发中
            </div>
          )}
        </section>
      </div>

      <GraphRetrievalDrawer
        open={graphOpen}
        onOpenChange={setGraphOpen}
        title="文档图谱"
        variant="document"
      />

      <EditDocumentInfoDialog
        open={editInfoOpen}
        onOpenChange={setEditInfoOpen}
        initialName={displayName}
        initialMetadata={metadataColumns}
        initialTags={documentTags}
        onConfirm={({ name, metadata, tags }) => {
          setDisplayName(name);
          setMetadataColumns(metadata);
          setDocumentTags(tags);
          toast.success("文档信息已更新");
        }}
      />
    </div>
  );
}

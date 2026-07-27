"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  List,
  Minus,
  Plus,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GraphRetrievalDrawer } from "@/components/knowledge-base/GraphRetrievalDrawer";

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

function ChunkTagRow({ tags }: { tags: string[] }) {
  const visible = tags.slice(0, VISIBLE_TAG_COUNT);
  const remaining = Math.max(0, tags.length - VISIBLE_TAG_COUNT);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((tag) => (
        <span
          key={tag}
          className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
        >
          {tag}
        </span>
      ))}
      {remaining > 0 && (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
          +{remaining}
        </span>
      )}
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
  documentName,
}: DocumentDetailViewProps) {
  const displayName = documentName?.trim() || "北京住房租赁合同.docx";
  const [enabled, setEnabled] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("chunks");
  const [strategy, setStrategy] = useState<ChunkStrategy>("semantic-smart");
  const [keyword, setKeyword] = useState("");
  const [selectedChunkId, setSelectedChunkId] = useState<number | null>(2);
  const [expandedChunkIds, setExpandedChunkIds] = useState<number[]>([]);
  const [zoom, setZoom] = useState(100);
  const [graphOpen, setGraphOpen] = useState(false);

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
        {/* Left: preview */}
        <section className="flex min-h-0 flex-col border-r border-slate-200">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-100 px-4">
            <button
              type="button"
              className="border-b-2 border-[#2773ff] pb-2.5 pt-2.5 text-sm font-medium text-[#2773ff]"
            >
              原文预览
            </button>
            <button
              type="button"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              title="目录"
              onClick={() => toast.message("目录功能开发中")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

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
    </div>
  );
}

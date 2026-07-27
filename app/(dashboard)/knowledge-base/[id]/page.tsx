"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Copy,
  FileText,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ImportDocumentDrawer } from "@/components/knowledge-base/ImportDocumentDrawer";
import { cn } from "@/lib/utils";

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-dashed border-slate-200 py-3 text-sm">
      <span className="text-slate-700">{label}</span>
      <span className="rounded bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
        {value}
      </span>
    </div>
  );
}

function Metric({
  dot,
  label,
  value,
}: {
  dot: string;
  label: string;
  value: number;
}) {
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
              <TabsTrigger
                value="retrieval"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
              >
                检索配置
              </TabsTrigger>
              <TabsTrigger
                value="mixed"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
              >
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
                <Button variant="outline" size="sm">
                  收起
                </Button>
              </div>
              <div className="border-x border-b border-slate-200 px-4 py-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-800">检索策略_1</span>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">
                    待配置
                  </span>
                </div>
              </div>
            </div>
          )}
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
        <Link
          href="/knowledge-base"
          className="text-sm text-[#2773ff] hover:underline"
        >
          返回知识库列表
        </Link>
      </div>
    );
  }

  return (
    <TemplateKnowledgeBaseDetail meta={meta} initialHitTest={initialHitTest} />
  );
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
  const [documents, setDocuments] =
    useState<KnowledgeDocumentRow[]>(initialDocuments);
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
      current.map((document) =>
        document.id === id ? { ...document, ...patch } : document
      )
    );
  }

  function deleteDocument(id: string) {
    setDocuments((current) =>
      current.filter((document) => document.id !== id)
    );
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
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded"
            onClick={() => router.push("/knowledge-base")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-950">
              {detail.name}
            </h1>
            <span className="inline-flex items-center gap-1 text-sm text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              已启用
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded">
            <Copy className="mr-2 h-4 w-4" />
            复制
          </Button>
          <Button variant="outline" className="rounded">
            启用
          </Button>
          <Button
            className="rounded bg-blue-600 hover:bg-blue-700"
            onClick={() =>
              router.push(`/knowledge-base/hit-test?id=${detail.id}`)
            }
          >
            命中测试
          </Button>
        </div>
      </div>

      <div className="space-y-7 p-6">
        <div className="grid grid-cols-[1fr_520px] gap-4">
          <section className="border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-950">检索配置</h2>
              <button
                type="button"
                className="text-sm text-slate-700 hover:text-blue-600"
                onClick={() => setConfigOpen(true)}
              >
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
            <div className="mb-5 text-sm text-slate-500">
              共{documents.length}个
            </div>
            <div className="space-y-5 rounded bg-slate-50 px-6 py-5 text-sm text-slate-600">
              <div className="flex items-center gap-7">
                <span>使用状态</span>
                <Metric
                  dot="bg-emerald-500"
                  label="已启用"
                  value={
                    documents.filter((item) => item.usageStatus === "已启用")
                      .length
                  }
                />
                <Metric
                  dot="bg-slate-400"
                  label="已停用"
                  value={
                    documents.filter((item) => item.usageStatus === "已停用")
                      .length
                  }
                />
              </div>
              <div className="flex items-center gap-7">
                <span>处理状态</span>
                <Metric
                  dot="bg-emerald-500"
                  label="已启用"
                  value={
                    documents.filter((item) => item.processStatus === "已启用")
                      .length
                  }
                />
                <Metric
                  dot="bg-slate-400"
                  label="已停用"
                  value={
                    documents.filter((item) => item.processStatus === "已停用")
                      .length
                  }
                />
                <Metric
                  dot="bg-red-500"
                  label="解析失败"
                  value={
                    documents.filter(
                      (item) => item.processStatus === "解析失败"
                    ).length
                  }
                />
                <Metric
                  dot="bg-amber-500"
                  label="切片失败"
                  value={
                    documents.filter(
                      (item) => item.processStatus === "切片失败"
                    ).length
                  }
                />
              </div>
            </div>
          </section>
        </div>

        <section>
          <div className="mb-5 flex items-center gap-3">
            <h2 className="font-semibold text-slate-950">基本信息</h2>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-500">
              编辑基本信息
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-x-12 gap-y-5">
            <BasicInfoItem label="知识库名称" value={detail.name} />
            <BasicInfoItem
              label="描述"
              value={detail.description || "--"}
            />
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
            <h2 className="font-semibold text-slate-950">
              文档列表（{documents.length}）
            </h2>
          </div>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative w-60">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索文档名称"
                className="h-9 rounded pl-9"
              />
            </div>
            <div className="flex h-9 overflow-hidden border border-slate-200">
              {["近1小时", "近1天", "近1周"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className="border-r border-slate-200 px-4 text-sm last:border-r-0 hover:bg-slate-50"
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="flex h-9 w-80 items-center justify-between border border-slate-200 px-3 text-sm text-slate-400"
            >
              <span>开始时间</span>
              <span>-</span>
              <span>结束时间</span>
              <Calendar className="h-4 w-4" />
            </button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded">
              <Search className="h-4 w-4" />
            </Button>
            <Button
              className="ml-auto rounded bg-blue-600 hover:bg-blue-700"
              onClick={() => setImportOpen(true)}
            >
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
                      <Link
                        href={`/knowledge-base/${id}/document/${document.id}?name=${encodeURIComponent(document.name)}`}
                        className="text-[#2773ff] hover:underline"
                      >
                        {document.name}
                      </Link>
                      {document.documentTags?.length ||
                      document.contentTags?.length ||
                      document.metadataFields?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {document.documentTags?.map((tag) => (
                            <span
                              key={`doc-${tag}`}
                              className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-normal text-blue-700"
                            >
                              {tag}
                            </span>
                          ))}
                          {document.contentTags?.map((tag) => (
                            <span
                              key={`content-${tag}`}
                              className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-normal text-emerald-700"
                            >
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
                            更多{" "}
                            <ChevronDown className="inline h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem
                            onSelect={() =>
                              updateDocument(document.id, {
                                usageStatus:
                                  document.usageStatus === "已启用"
                                    ? "已停用"
                                    : "已启用",
                              })
                            }
                          >
                            {document.usageStatus === "已启用"
                              ? "停用"
                              : "启用"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              updateDocument(document.id, {
                                processStatus: "已启用",
                              })
                            }
                          >
                            重新解析
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              updateDocument(document.id, {
                                processStatus: "已启用",
                              })
                            }
                          >
                            重新切片
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onSelect={() => deleteDocument(document.id)}
                          >
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
                        <p className="text-base font-medium text-slate-700">
                          您还没有导入任何文档
                        </p>
                        <button
                          type="button"
                          className="mt-4 text-sm text-blue-600"
                          onClick={() => setImportOpen(true)}
                        >
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
      <ImportDocumentDrawer
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={importDocuments}
      />
    </div>
  );
}

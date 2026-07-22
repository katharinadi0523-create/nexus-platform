"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, Search, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getKnowledgeBaseV2 } from "@/lib/mock-knowledge-base-v2";

function KnowledgeBaseHitTestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "docstore_JzrYZMN9";
  const detail = useMemo(() => getKnowledgeBaseV2(id), [id]);
  const [query, setQuery] = useState("");

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col bg-blue-50/60">
      <div className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded" onClick={() => router.push(`/knowledge-base/${detail.id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-slate-950">{detail.name}</h1>
            <p className="mt-1 text-xs text-slate-500">自动保存于 16:07</p>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(420px,1fr)_minmax(420px,0.95fr)] gap-4 overflow-hidden p-6">
        <section className="flex min-h-0 flex-col bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-950">查询测试</h2>
            <p className="mt-2 text-sm text-slate-500">输入指定的查询文本测试知识的召回效果。</p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-5">
            <Textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="请输入查询文本"
              className="min-h-[280px] flex-1 resize-none rounded-none border-slate-200"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" className="rounded">
                <Settings2 className="mr-2 h-4 w-4" />
                策略配置
              </Button>
              <Button disabled={!query.trim()} className="rounded bg-blue-600 hover:bg-blue-700">
                测试
              </Button>
            </div>
            <div className="flex flex-1 items-center justify-center text-slate-400">
              <div className="text-center">
                <FileText className="mx-auto mb-4 h-16 w-16 text-blue-200" />
                <div className="font-medium text-slate-800">暂无数据</div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-950">命中切片（0）</h2>
            <div className="relative w-60">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input placeholder="搜索切片" className="h-9 rounded pl-9" />
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center text-slate-400">
            <div className="text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 text-blue-200" />
              <div className="font-medium text-slate-800">暂无数据</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function KnowledgeBaseHitTestPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-blue-50/60 text-sm text-slate-400">
          加载命中测试...
        </div>
      }
    >
      <KnowledgeBaseHitTestContent />
    </Suspense>
  );
}

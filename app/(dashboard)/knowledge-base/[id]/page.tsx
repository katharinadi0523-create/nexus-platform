"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  getKnowledgeBaseMeta,
  type KnowledgeBaseListItem,
} from "@/lib/mock/knowledge-base-list";
import { TemplateKnowledgeBaseDetail } from "@/components/knowledge-base/TemplateKnowledgeBaseDetail";

function KnowledgeBaseDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const kbId = params.id as string;
  const initialHitTest = searchParams.get("tab") === "test";
  const [meta, setMeta] = useState<KnowledgeBaseListItem | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMeta(getKnowledgeBaseMeta(kbId));
    setReady(true);
  }, [kbId]);

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
    <TemplateKnowledgeBaseDetail
      meta={meta}
      initialHitTest={initialHitTest}
    />
  );
}

export default function KnowledgeBaseDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
          加载中...
        </div>
      }
    >
      <KnowledgeBaseDetailContent />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { DocumentDetailView } from "@/components/knowledge-base/DocumentDetailView";

function DocumentDetailPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const knowledgeBaseId = String(params.id);
  const documentId = String(params.docId);
  const documentName = searchParams.get("name") ?? undefined;

  return (
    <DocumentDetailView
      knowledgeBaseId={knowledgeBaseId}
      documentId={documentId}
      documentName={documentName}
    />
  );
}

export default function KnowledgeBaseDocumentDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-slate-400">
          加载中...
        </div>
      }
    >
      <DocumentDetailPageInner />
    </Suspense>
  );
}

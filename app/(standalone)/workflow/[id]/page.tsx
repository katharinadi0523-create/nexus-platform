"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Rocket } from "lucide-react";
import { toast } from "sonner";
import { WorkflowEditor } from "@/components/workflow/workflow-editor";
import { Button } from "@/components/ui/button";
import { ExportConfigurationButton } from "@/components/import-export/export-configuration-button";
import { ImportDraftNotice, type ImportDraftResult } from "@/components/import-export/import-draft-notice";
import { ReferenceRelationshipDialog } from "@/components/reference-relations/reference-relationship-dialog";

const WORKFLOW_META: Record<string, { name: string; hasPublishedVersion: boolean; version?: string }> = {
  "workflow-ticket": { name: "客户工单处理流程", hasPublishedVersion: true, version: "V5" },
  "workflow-report": { name: "经营日报生成流程", hasPublishedVersion: true, version: "V3" },
  "workflow-review": { name: "合同条款审核流程", hasPublishedVersion: false },
  "imported-workflow": { name: "售后问题处理流程", hasPublishedVersion: false },
  new: { name: "未命名工作流", hasPublishedVersion: false },
};

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = params?.id as string;
  const meta = WORKFLOW_META[workflowId] ?? { name: "工作流草稿", hasPublishedVersion: false };
  const resultParam = searchParams.get("importResult");
  const queryImportResult: ImportDraftResult | null = resultParam === "success" || resultParam === "success_with_warnings" ? resultParam : null;
  const importResult = queryImportResult;
  const importOperation = "create";
  const [hasBlockingIssues, setHasBlockingIssues] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <header className="flex h-16 flex-none items-center justify-between border-b border-slate-200 bg-white px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Button type="button" variant="outline" size="icon-sm" className="h-8 w-8 rounded-[4px] border-slate-300 bg-white shadow-none" onClick={() => router.push("/workflow")} aria-label="返回工作流列表">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-base font-semibold text-slate-950">{meta.name}</h1>
              <span className="rounded-[4px] bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">草稿</span>
              {meta.hasPublishedVersion ? <span className="text-xs text-slate-500">已发布 {meta.version}</span> : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReferenceRelationshipDialog objectType="workflow" objectId={workflowId} objectName={meta.name} />
          {meta.hasPublishedVersion ? (
            <ExportConfigurationButton
              objectType="workflow"
              objectName={meta.name}
              sourceType="published"
              sourceVersion={meta.version}
            />
          ) : null}
          <Button type="button" disabled={hasBlockingIssues} title={hasBlockingIssues ? "存在待关联或异常节点，完成配置后才能发布" : "发布"} className="h-8 rounded-[4px] bg-blue-600 px-4 text-sm text-white shadow-none hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => toast.success(`已发布：${meta.name}`)}>
            <Rocket className="h-4 w-4" />发布
          </Button>
        </div>
      </header>

      {importResult ? <ImportDraftNotice objectType="workflow" result={importResult} operation={importOperation} /> : null}

      <main className="min-h-0 flex-1 overflow-hidden">
        <WorkflowEditor agentId={workflowId} importResult={importResult} importObjectType="workflow" onBlockingIssueChange={setHasBlockingIssues} />
      </main>
    </div>
  );
}

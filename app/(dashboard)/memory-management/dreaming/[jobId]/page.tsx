import { notFound } from "next/navigation";
import { DreamingJobDetailWorkbench } from "@/components/memory-management/dreaming-detail-workbench";
import {
  dreamingJobs,
  getDreamingJob,
  type DreamingInputRef,
  type DreamingJob,
} from "@/lib/mock/memory-management";

type DreamingJobSearchParams = Record<string, string | string[] | undefined>;

function readParam(searchParams: DreamingJobSearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function DreamingJobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<DreamingJobSearchParams>;
}) {
  const { jobId } = await params;
  const resolvedSearchParams = await searchParams;
  const existingJob = getDreamingJob(jobId);
  const fallbackName = readParam(resolvedSearchParams, "name");

  let job = existingJob;
  if (!job && fallbackName) {
    const rawInputRefs = readParam(resolvedSearchParams, "inputRefs");
    const inputRefs = (rawInputRefs?.split(",").filter(Boolean) ?? [
      "store_content",
    ]) as DreamingInputRef[];
    job = {
      ...dreamingJobs[0],
      id: jobId,
      name: fallbackName,
      storeId: readParam(resolvedSearchParams, "storeId") ?? dreamingJobs[0].storeId,
      inputRefs,
      inputSummary:
        readParam(resolvedSearchParams, "inputSummary") ?? dreamingJobs[0].inputSummary,
      prompt: readParam(resolvedSearchParams, "prompt") || undefined,
      modelTier:
        readParam(resolvedSearchParams, "modelTier") === "advanced" ? "advanced" : "standard",
      createdBy: "当前用户",
      createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
    } satisfies DreamingJob;
  }

  if (!job) {
    notFound();
  }

  return <DreamingJobDetailWorkbench job={job} />;
}

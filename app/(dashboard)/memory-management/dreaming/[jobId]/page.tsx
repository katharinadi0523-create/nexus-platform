import { notFound } from "next/navigation";
import { UpdateJobDetailWorkbench } from "@/components/memory-management/dreaming-detail-workbench";
import {
  getUpdateJob,
  updateJobs,
  type UpdateJob,
} from "@/lib/mock/memory-management";

type UpdateJobSearchParams = Record<string, string | string[] | undefined>;

function readParam(searchParams: UpdateJobSearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function UpdateJobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<UpdateJobSearchParams>;
}) {
  const { jobId } = await params;
  const resolvedSearchParams = await searchParams;
  const existingJob = getUpdateJob(jobId);
  const fallbackName = readParam(resolvedSearchParams, "name");

  let job = existingJob;
  if (!job && fallbackName) {
    job = {
      ...updateJobs[0],
      id: jobId,
      name: fallbackName,
      storeId: readParam(resolvedSearchParams, "storeId") ?? updateJobs[0].storeId,
      inputMaterialCount: Number(readParam(resolvedSearchParams, "inputMaterialCount") ?? 20),
      prompt: readParam(resolvedSearchParams, "prompt"),
      modelTier:
        readParam(resolvedSearchParams, "modelTier") === "advanced" ? "advanced" : "standard",
      createdBy: "当前用户",
      createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
    } satisfies UpdateJob;
  }

  if (!job) {
    notFound();
  }

  return <UpdateJobDetailWorkbench job={job} />;
}

import { notFound } from "next/navigation";
import {
  MemoryStoreDetailWorkbench,
  type StoreDetailTab,
} from "@/components/memory-management/memory-store-detail-workbench";
import {
  createBlankMemoryFiles,
  createInitialMemoryVersionId,
  createTemplateMemoryFiles,
  getMemoryStore,
  type MemoryStore,
} from "@/lib/mock/memory-management";

type StoreSearchParams = Record<string, string | string[] | undefined>;

function readParam(searchParams: StoreSearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

const storeDetailTabs: StoreDetailTab[] = ["nodes", "versions", "mounts"];

export default async function MemoryStoreDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<StoreSearchParams>;
}) {
  const { storeId } = await params;
  const resolvedSearchParams = await searchParams;
  const existingStore = getMemoryStore(storeId);
  const fallbackName = readParam(resolvedSearchParams, "name");
  const initialization = readParam(resolvedSearchParams, "init");
  const requestedTab = readParam(resolvedSearchParams, "tab");
  const initialTab: StoreDetailTab = storeDetailTabs.includes(
    requestedTab as StoreDetailTab
  )
    ? (requestedTab as StoreDetailTab)
    : "nodes";

  let store = existingStore;
  if (!store && fallbackName) {
    const files =
      initialization === "template"
        ? createTemplateMemoryFiles(fallbackName)
        : createBlankMemoryFiles(fallbackName);
    const now = new Date().toLocaleString("zh-CN", { hour12: false });
    const versionId = createInitialMemoryVersionId(new Date());
    store = {
      id: storeId,
      name: fallbackName,
      description:
        readParam(resolvedSearchParams, "description") ?? "新创建的组织共享记忆库。",
      scope: "org",
      kind: "shared",
      nodeCount: Math.max(files.length - 1, 0),
      tokenCount: files.reduce((total, file) => total + file.content.length, 0),
      currentVersion: versionId,
      mountCount: 0,
      updatedBy: "当前用户",
      updatedAt: now,
      files,
      versions: [
        {
          version: versionId,
          source: initialization === "import" ? "导入" : "人工",
          author: "当前用户",
          createdAt: now,
          summary: "创建记忆库。",
          files,
        },
      ],
      mountRelations: [],
    } satisfies MemoryStore;
  }

  if (!store) {
    notFound();
  }

  return <MemoryStoreDetailWorkbench store={store} initialTab={initialTab} />;
}

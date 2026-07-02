import { MemoryManagementWorkbench } from "@/components/memory-management/memory-management-workbench";

type MemoryManagementSearchParams = Record<string, string | string[] | undefined>;

function readParam(searchParams: MemoryManagementSearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function MemoryManagementPage({
  searchParams,
}: {
  searchParams: Promise<MemoryManagementSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <MemoryManagementWorkbench
      initialTab={readParam(resolvedSearchParams, "tab") === "dreaming" ? "dreaming" : "stores"}
      initialCreateRequested={readParam(resolvedSearchParams, "create") === "1"}
      initialStoreId={readParam(resolvedSearchParams, "storeId")}
    />
  );
}

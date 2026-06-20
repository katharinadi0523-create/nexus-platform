"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  ManagementCell,
  ManagementEmptyRow,
  ManagementIconButton,
  ManagementPageTitle,
  ManagementPrimaryButton,
  ManagementRow,
  ManagementRowActions,
  ManagementTable,
  ManagementTableBody,
  ManagementTableFrame,
  ManagementTableHead,
  ManagementTableHeader,
  ManagementTextAction,
  ManagementToolbar,
} from "@/components/management/management-list";
import { Select } from "@/components/ui/select";
import {
  createBlankMemoryFiles,
  createMemoryStoreId,
  createTemplateMemoryFiles,
  memoryStores,
  type MemoryStore,
  type MemoryStoreType,
} from "@/lib/mock/memory-management";
import {
  CreateMemoryStoreDialog,
  type CreateMemoryStoreValue,
} from "@/components/memory-management/create-memory-store-dialog";
import {
  formatCompactNumber,
  MemoryStoreIcon,
  StoreTypeBadge,
} from "@/components/memory-management/memory-shared";
import { UpdateJobList } from "@/components/memory-management/dreaming-list";
import { cn } from "@/lib/utils";

type MainTab = "stores" | "dreaming";

function getStoreDetailHref(store: MemoryStore) {
  return `/memory-management/stores/${store.id}`;
}

export function MemoryManagementWorkbench() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab: MainTab = requestedTab === "dreaming" ? "dreaming" : "stores";
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<MemoryStoreType | "all">("all");
  const [materialFilter, setMaterialFilter] = useState<"all" | "pending">("all");
  const [stores, setStores] = useState<MemoryStore[]>(memoryStores);
  const [createOpen, setCreateOpen] = useState(false);
  const deferredKeyword = useDeferredValue(keyword);

  useEffect(() => {
    stores.forEach((store) => router.prefetch(getStoreDetailHref(store)));
  }, [router, stores]);

  const filteredStores = useMemo(() => {
    const normalizedKeyword = deferredKeyword.trim().toLowerCase();
    return stores.filter((store) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [store.name, store.description, store.updatedBy]
          .join(" ")
          .toLowerCase()
          .includes(normalizedKeyword);
      const matchesType = typeFilter === "all" || store.type === typeFilter;
      const matchesMaterial =
        materialFilter === "all" || store.updateMaterialCount > 0;
      return matchesKeyword && matchesType && matchesMaterial;
    });
  }, [deferredKeyword, materialFilter, stores, typeFilter]);

  function switchTab(tab: MainTab) {
    router.replace(tab === "stores" ? "/memory-management" : "/memory-management?tab=dreaming");
  }

  function handleRefresh() {
    setStores(memoryStores);
    toast.success("记忆库列表已刷新。");
  }

  function handleDelete(store: MemoryStore) {
    if (store.type === "builtin_c") {
      toast.info("自带 C Store 跟随 Claw 生命周期，不支持删除。");
      return;
    }
    if (!window.confirm(`确认删除“${store.name}”吗？此操作仅影响当前 Demo 状态。`)) {
      return;
    }
    setStores((current) => current.filter((item) => item.id !== store.id));
    toast.success(`已删除：${store.name}`);
  }

  function handleCreate(value: CreateMemoryStoreValue) {
    const id = createMemoryStoreId(value.name);
    const sourceStore = stores.find((store) => store.id === value.forkSourceStoreId);
    const files =
      value.initialization === "fork" && sourceStore
        ? sourceStore.files.map((file) => ({
            ...file,
            id: `file-${Date.now()}-${file.id}`,
          }))
        : value.initialization === "template"
          ? createTemplateMemoryFiles(value.name)
          : createBlankMemoryFiles(value.name);
    const createdAt = new Date().toLocaleString("zh-CN", { hour12: false });
    const store: MemoryStore = {
      id,
      name: value.name,
      description:
        value.description ||
        (value.initialization === "import"
          ? `由 ${value.importedFileName ?? "Markdown 文件"} 导入。`
          : value.initialization === "fork" && sourceStore
            ? `从 ${sourceStore.name} v${sourceStore.currentVersion} fork。`
          : "新创建的共享 Memory Store。"),
      type: value.initialization === "fork" ? "fork" : "shared",
      nodeCount: Math.max(files.length - 1, 0),
      tokenCount: files.reduce((total, file) => total + file.content.length, 0),
      currentVersion: 1,
      mountCount: 0,
      updateMaterialCount: 0,
      updatedBy: "当前用户",
      updatedAt: createdAt,
      files,
      versions: [
        {
          version: 1,
          source:
            value.initialization === "fork"
              ? "fork"
              : value.initialization === "import"
                ? "导入"
                : "人工",
          author: "当前用户",
          createdAt,
          summary:
            value.initialization === "template"
              ? "从客户/项目记忆模板初始化。"
              : value.initialization === "fork" && sourceStore
                ? `从 ${sourceStore.name} v${sourceStore.currentVersion} fork。`
              : value.initialization === "import"
                ? `从 ${value.importedFileName ?? "Markdown 文件"} 导入。`
                : "创建空白 Store。",
          files,
        },
      ],
      updateMaterials: [],
      mountRelations: [],
    };

    setStores((current) => [store, ...current]);
    setCreateOpen(false);
    toast.success(`已创建：${store.name}`);
    const params = new URLSearchParams({
      name: store.name,
      description: store.description,
      init: value.initialization,
    });
    router.push(`${getStoreDetailHref(store)}?${params.toString()}`);
  }

  return (
    <div className="space-y-5 pb-10">
      <ManagementPageTitle>记忆</ManagementPageTitle>

      <div className="border-b border-slate-200">
        <div className="flex gap-7">
            {[
              { value: "stores" as const, label: "记忆库" },
              { value: "dreaming" as const, label: "记忆沉淀" },
            ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => switchTab(tab.value)}
              className={cn(
                "relative pb-3 text-sm font-medium transition-colors",
                activeTab === tab.value
                  ? "text-blue-600 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5 after:bg-blue-600"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "dreaming" ? (
        <UpdateJobList
          stores={stores}
          createRequested={searchParams.get("create") === "1"}
          initialStoreId={searchParams.get("storeId") ?? undefined}
        />
      ) : (
        <>
          <ManagementToolbar
            searchValue={keyword}
            onSearchChange={setKeyword}
            searchPlaceholder="搜索 Store 名称或描述"
            actions={
              <>
                <Select
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as MemoryStoreType | "all")}
                  options={[
                    { value: "all", label: "全部类型" },
                    { value: "shared", label: "共享" },
                    { value: "fork", label: "fork" },
                    { value: "builtin_c", label: "自带-C" },
                  ]}
                  className="h-8 w-[116px] rounded-[4px] border-slate-300 bg-white shadow-none"
                />
                <Select
                  value={materialFilter}
                  onValueChange={(value) => setMaterialFilter(value as "all" | "pending")}
                  options={[
                    { value: "all", label: "全部材料" },
                    { value: "pending", label: "有更新材料" },
                  ]}
                  className="h-8 w-[130px] rounded-[4px] border-slate-300 bg-white shadow-none"
                />
                <ManagementIconButton onClick={handleRefresh} aria-label="刷新记忆库列表">
                  <RefreshCw className="h-4 w-4" />
                </ManagementIconButton>
                <ManagementPrimaryButton onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  创建 Memory Store
                </ManagementPrimaryButton>
              </>
            }
          />

          <ManagementTableFrame>
            <ManagementTable className="min-w-[1480px] table-fixed">
              <ManagementTableHeader>
                <ManagementTableHead className="w-[240px]">名称</ManagementTableHead>
                <ManagementTableHead className="w-[250px]">描述</ManagementTableHead>
                <ManagementTableHead className="w-[90px]">
                  <span className="inline-flex items-center gap-2">
                    类型 <Filter className="h-3.5 w-3.5" />
                  </span>
                </ManagementTableHead>
                <ManagementTableHead className="w-[125px]">规模</ManagementTableHead>
                <ManagementTableHead className="w-[90px]">当前版本</ManagementTableHead>
                <ManagementTableHead className="w-[80px]">挂载数</ManagementTableHead>
                <ManagementTableHead className="w-[110px]">更新材料池</ManagementTableHead>
                <ManagementTableHead className="w-[150px]">最近记忆沉淀</ManagementTableHead>
                <ManagementTableHead className="w-[100px]">更新人</ManagementTableHead>
                <ManagementTableHead className="w-[160px]">更新时间</ManagementTableHead>
                <ManagementTableHead className="w-[160px]">操作</ManagementTableHead>
              </ManagementTableHeader>
              <ManagementTableBody>
                {filteredStores.length === 0 ? (
                  <ManagementEmptyRow
                    colSpan={11}
                    description="请调整搜索关键词或筛选条件。"
                  />
                ) : (
                  filteredStores.map((store) => (
                    <ManagementRow key={store.id}>
                      <ManagementCell>
                        <div className="flex items-center gap-3">
                          <MemoryStoreIcon type={store.type} />
                          <button
                            type="button"
                            className="min-w-0 truncate text-left font-semibold text-slate-900 hover:text-blue-600"
                            onClick={() => router.push(getStoreDetailHref(store))}
                          >
                            {store.name}
                          </button>
                        </div>
                      </ManagementCell>
                      <ManagementCell>
                        <p className="truncate text-slate-600">{store.description}</p>
                      </ManagementCell>
                      <ManagementCell>
                        <StoreTypeBadge type={store.type} />
                      </ManagementCell>
                      <ManagementCell>
                        <div className="text-slate-800">{store.nodeCount} 个节点</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {formatCompactNumber(store.tokenCount)} tokens
                        </div>
                      </ManagementCell>
                      <ManagementCell className="font-medium">v{store.currentVersion}</ManagementCell>
                      <ManagementCell>
                        <button
                          type="button"
                          className="font-medium text-blue-600 hover:text-blue-700"
                          onClick={() => toast.info(`当前有 ${store.mountCount} 个 Claw 挂载。`)}
                        >
                          {store.mountCount}
                        </button>
                      </ManagementCell>
                      <ManagementCell>
                        {store.updateMaterialCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-rose-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            {store.updateMaterialCount} 待处理
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </ManagementCell>
                      <ManagementCell className="text-slate-600">
                        {store.lastUpdateJobAt ?? "从未"}
                      </ManagementCell>
                      <ManagementCell>{store.updatedBy}</ManagementCell>
                      <ManagementCell>{store.updatedAt}</ManagementCell>
                      <ManagementCell>
                        <ManagementRowActions>
                          <ManagementTextAction
                            onClick={() => router.push(getStoreDetailHref(store))}
                          >
                            详情
                          </ManagementTextAction>
                          <ManagementTextAction
                            onClick={() =>
                              router.push(
                                `/memory-management?tab=dreaming&create=1&storeId=${store.id}`
                              )
                            }
                          >
                            记忆沉淀
                          </ManagementTextAction>
                          <ManagementTextAction
                            disabled={store.type === "builtin_c"}
                            onClick={() => handleDelete(store)}
                          >
                            删除
                          </ManagementTextAction>
                        </ManagementRowActions>
                      </ManagementCell>
                    </ManagementRow>
                  ))
                )}
              </ManagementTableBody>
            </ManagementTable>
          </ManagementTableFrame>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>共 {filteredStores.length} 个 Memory Store</span>
            <span>第 1 / 1 页</span>
          </div>
        </>
      )}

      <CreateMemoryStoreDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        stores={stores}
        onSubmit={handleCreate}
      />
    </div>
  );
}

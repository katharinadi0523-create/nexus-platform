"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  MinusCircle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "@/components/claw-hub-next/detail/section-card";
import { MemoryMountConfigDialog } from "@/components/claw-hub-next/detail/memory-mount-config-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  defaultClawMemoryMounts,
  formatMemoryVersionLabel,
  getMemoryStore,
  memoryStores,
  type ClawMemoryMount,
} from "@/lib/mock/memory-management";
import { MemoryStoreDetailWorkbench } from "@/components/memory-management/memory-store-detail-workbench";
import {
  AccessBadge,
  MemoryStoreIcon,
} from "@/components/memory-management/memory-shared";

function toMemoryStoreLabel(name: string): string {
  const base = name.trim().replace(/^store[_-]?/i, "");
  if (base.endsWith("记忆库")) {
    return base;
  }
  return `${base}记忆库`;
}

interface ClawMemorySettings {
  memoryGuide: string;
  mounts: ClawMemoryMount[];
}

const initialSettings: ClawMemorySettings = {
  memoryGuide:
    "重点记录与具体用户无关的任务执行方法、复盘结论和可复用教训；不得记录调用者个人信息。",
  mounts: defaultClawMemoryMounts,
};

export function ClawMemorySection({ clawName }: { clawName: string }) {
  const router = useRouter();
  const [settings, setSettings] = useState<ClawMemorySettings>(initialSettings);
  const [guideDraft, setGuideDraft] = useState(initialSettings.memoryGuide);
  const [mountOpen, setMountOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const builtInStore = getMemoryStore("store-claw-native");
  const clawMemoryLabel = toMemoryStoreLabel(clawName);

  const availableStores = useMemo(
    () =>
      memoryStores.filter(
        (store) =>
          store.kind !== "builtin" &&
          !settings.mounts.some((mount) => mount.storeId === store.id)
      ),
    [settings.mounts]
  );

  function handleMountConfirm(storeIds: string[]) {
    const newMounts: ClawMemoryMount[] = storeIds.map((storeId, index) => {
      const store = getMemoryStore(storeId);
      return {
        id: `mount-${Date.now()}-${index}-${storeId}`,
        storeId,
        access: "read_write",
        usagePrompt: store?.description ?? "",
      };
    });
    setSettings((current) => ({
      ...current,
      mounts: [...current.mounts, ...newMounts],
    }));
    setMountOpen(false);
    toast.success(
      newMounts.length === 1
        ? `已挂载：${toMemoryStoreLabel(getMemoryStore(newMounts[0].storeId)?.name ?? newMounts[0].storeId)}`
        : `已挂载 ${newMounts.length} 个记忆库`
    );
  }

  function handleRemoveMount(mount: ClawMemoryMount) {
    const storeName = toMemoryStoreLabel(
      getMemoryStore(mount.storeId)?.name ?? mount.storeId
    );
    if (!window.confirm(`确认从 ${clawName} 移除「${storeName}」吗？`)) {
      return;
    }
    setSettings((current) => ({
      ...current,
      mounts: current.mounts.filter((item) => item.id !== mount.id),
    }));
    toast.success(`已移除挂载：${storeName}`);
  }

  function handleSaveGuide() {
    setSettings((current) => ({ ...current, memoryGuide: guideDraft.trim() }));
    toast.success("记忆指引已保存。");
  }

  return (
    <>
      <div className="space-y-5">
        <SectionCard title="Claw记忆库">
          <div className="grid gap-4">
            <div className="rounded-[6px] border border-slate-200 bg-white p-5">
              <div className="flex min-w-0 items-start gap-3">
                <MemoryStoreIcon kind="builtin" />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-950">{clawMemoryLabel}</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-y border-slate-100 py-4">
                <MemoryMetric label="主题文件" value={`${builtInStore?.nodeCount ?? 26} 个`} />
                <MemoryMetric
                  label="版本"
                  value={formatMemoryVersionLabel(builtInStore?.currentVersion ?? "2026061001")}
                />
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="claw-memory-guide">记忆指引</Label>
                <Textarea
                  id="claw-memory-guide"
                  value={guideDraft}
                  onChange={(event) => setGuideDraft(event.target.value)}
                  className="min-h-24 resize-none rounded-[4px] border-slate-300 text-sm leading-6 shadow-none"
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveGuide}
                  className="h-8 rounded-[4px] bg-blue-600 shadow-none hover:bg-blue-700"
                >
                  保存指引
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDetailOpen(true)}
                  disabled={!builtInStore}
                  className="h-8 rounded-[4px] border-slate-300 shadow-none"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  查看详情
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    router.push(
                      "/memory-management?tab=dreaming&create=1&storeId=store-claw-native"
                    )
                  }
                  className="h-8 rounded-[4px] border-slate-300 shadow-none"
                >
                  发起记忆沉淀
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="外接记忆"
          description="挂载组织共享记忆库（S）。本期挂载库统一为全量读写——可检索，也可在任务中直接写入客观事实。"
          action={
            <Button
              size="sm"
              onClick={() => setMountOpen(true)}
              className="h-8 rounded-[4px] bg-blue-600 shadow-none hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              挂载记忆库
            </Button>
          }
        >
          <div className="overflow-hidden rounded-[6px] border border-slate-200 bg-white">
            <div className="grid grid-cols-[minmax(180px,1fr)_110px_minmax(280px,1.6fr)_70px] border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700">
              <span>组织共享记忆库</span>
              <span>权限</span>
              <span>使用指引</span>
              <span>操作</span>
            </div>
            {settings.mounts.length > 0 ? (
              settings.mounts.map((mount) => {
                const store = getMemoryStore(mount.storeId);
                const storeLabel = toMemoryStoreLabel(store?.name ?? mount.storeId);
                return (
                  <div
                    key={mount.id}
                    className="grid grid-cols-[minmax(180px,1fr)_110px_minmax(280px,1.6fr)_70px] items-center border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() => router.push(`/memory-management/stores/${mount.storeId}`)}
                      className="truncate text-left font-medium text-blue-600 hover:text-blue-700"
                    >
                      {storeLabel}
                    </button>
                    <div>
                      <AccessBadge access={mount.access} />
                    </div>
                    <p className="line-clamp-2 pr-6 leading-6 text-slate-600">
                      {mount.usagePrompt}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemoveMount(mount)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      aria-label={`移除 ${storeLabel}`}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-12 text-center text-sm text-slate-400">
                当前没有外接记忆库
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <MemoryMountConfigDialog
        open={mountOpen}
        onOpenChange={setMountOpen}
        stores={availableStores}
        onConfirm={handleMountConfirm}
      />

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col overflow-hidden p-0 sm:max-w-none sm:w-[min(1080px,94vw)]"
        >
          <SheetTitle className="sr-only">{clawMemoryLabel} 详情</SheetTitle>
          {builtInStore ? (
            <MemoryStoreDetailWorkbench store={builtInStore} embedded />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function MemoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

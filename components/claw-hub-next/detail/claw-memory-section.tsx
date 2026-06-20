"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "@/components/claw-hub-next/detail/section-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultClawMemoryMounts,
  getMemoryStore,
  memoryStores,
  type ClawMemoryMount,
  type MountAccess,
} from "@/lib/mock/memory-management";
import {
  AccessBadge,
  formatCompactNumber,
  MemoryStoreIcon,
} from "@/components/memory-management/memory-shared";

interface ClawMemorySettings {
  memoryGuide: string;
  mounts: ClawMemoryMount[];
  asyncExtraction: boolean;
  acceptContextPack: boolean;
  returnMemorySignals: boolean;
  debugMemorySandbox: boolean;
}

const initialSettings: ClawMemorySettings = {
  memoryGuide:
    "重点记录与具体用户无关的任务执行方法、复盘结论和可复用教训；不得记录调用者个人信息。",
  mounts: defaultClawMemoryMounts,
  asyncExtraction: true,
  acceptContextPack: true,
  returnMemorySignals: true,
  debugMemorySandbox: true,
};

export function ClawMemorySection({ clawName }: { clawName: string }) {
  const router = useRouter();
  const [settings, setSettings] = useState<ClawMemorySettings>(initialSettings);
  const [guideDraft, setGuideDraft] = useState(initialSettings.memoryGuide);
  const [mountOpen, setMountOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedAccess, setSelectedAccess] = useState<MountAccess>("read_only");
  const [usagePrompt, setUsagePrompt] = useState("");
  const [mountError, setMountError] = useState("");
  const builtInStore = getMemoryStore("store-claw-native");

  const availableStores = useMemo(
    () =>
      memoryStores.filter(
        (store) =>
          store.type !== "builtin_c" &&
          !settings.mounts.some((mount) => mount.storeId === store.id)
      ),
    [settings.mounts]
  );

  function resetMountForm() {
    setSelectedStoreId("");
    setSelectedAccess("read_only");
    setUsagePrompt("");
    setMountError("");
  }

  function handleMountOpenChange(open: boolean) {
    if (!open) {
      resetMountForm();
    }
    setMountOpen(open);
  }

  function addMount(mount: ClawMemoryMount) {
    setSettings((current) => ({
      ...current,
      mounts: [...current.mounts, mount],
    }));
    setMountOpen(false);
    resetMountForm();
    toast.success(`已挂载：${getMemoryStore(mount.storeId)?.name ?? mount.storeId}`);
  }

  function handleSubmitMount() {
    if (!selectedStoreId) {
      setMountError("请选择 Memory Store。");
      return;
    }
    if (!usagePrompt.trim()) {
      setMountError("请填写使用指引，说明何时查询或标为更新材料。");
      return;
    }
    const mount: ClawMemoryMount = {
      id: `mount-${Date.now()}`,
      storeId: selectedStoreId,
      access: selectedAccess,
      usagePrompt: usagePrompt.trim(),
    };
    addMount(mount);
  }

  function handleRemoveMount(mount: ClawMemoryMount) {
    const storeName = getMemoryStore(mount.storeId)?.name ?? mount.storeId;
    if (!window.confirm(`确认从 ${clawName} 移除“${storeName}”吗？`)) {
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
    toast.success("C Store 记忆指引已保存。");
  }

  function updateSetting(
    key: "asyncExtraction" | "acceptContextPack" | "returnMemorySignals" | "debugMemorySandbox",
    checked: boolean
  ) {
    setSettings((current) => ({ ...current, [key]: checked }));
    toast.success("运行设置已更新。");
  }

  return (
    <>
      <div className="space-y-5">
        <SectionCard
          title="自带记忆"
          description="每个 Claw 自动拥有 C 类经验 Store；U 归调用用户所有，专家只读注入、不写入也不留存。"
        >
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-[6px] border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <MemoryStoreIcon type="builtin_c" />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-950">
                      {builtInStore?.name ?? `${clawName} · 经验记忆`}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      跨用户积累脱敏执行经验，与当前 Claw 生命周期一致。
                    </p>
                  </div>
                </div>
                <span className="rounded-[3px] border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  C · 自带
                </span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-y border-slate-100 py-4">
                <MemoryMetric label="节点" value={`${builtInStore?.nodeCount ?? 26} 个`} />
                <MemoryMetric
                  label="Token"
                  value={formatCompactNumber(builtInStore?.tokenCount ?? 43820)}
                />
                <MemoryMetric label="版本" value={`v${builtInStore?.currentVersion ?? 3}`} />
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
                  onClick={() =>
                    router.push("/memory-management/stores/store-claw-native")
                  }
                  className="h-8 rounded-[4px] border-slate-300 shadow-none"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  查看 Store
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

            <div className="rounded-[6px] border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-blue-50 text-blue-600">
                    <Users className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-semibold text-slate-950">用户记忆</div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      U 归当前调用用户所有；本 Claw 运行时只读注入该用户的记忆 index，不写入也不留存。
                    </p>
                  </div>
                </div>
                <span className="rounded-[3px] border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  U · 隐私
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-y border-slate-100 py-4">
                <MemoryMetric label="已读取 U 的用户" value="128 人" />
                <MemoryMetric label="可读 U 节点规模" value="1,846 个" />
              </div>
              <div className="mt-4 rounded-[6px] border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-slate-600">
                <div className="font-medium text-slate-800">隐私边界</div>
                管控端仅展示“已读取 N 个用户的 U · 内容不可见”，不提供内容浏览、搜索或导出。用户可在使用端查看、修正和删除自己的记忆。
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="外接记忆"
          description="挂载组织共享 Store，并为当前 Claw 配置读取和提议边界。"
          action={
            <Button
              size="sm"
              onClick={() => setMountOpen(true)}
              disabled={availableStores.length === 0}
              className="h-8 rounded-[4px] bg-blue-600 shadow-none hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              挂载 Memory Store
            </Button>
          }
        >
          <div className="overflow-hidden rounded-[6px] border border-slate-200 bg-white">
            <div className="grid grid-cols-[minmax(180px,1fr)_110px_minmax(280px,1.6fr)_70px] border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700">
              <span>Memory Store</span>
              <span>权限</span>
              <span>使用指引</span>
              <span>操作</span>
            </div>
            {settings.mounts.length > 0 ? (
              settings.mounts.map((mount) => {
                const store = getMemoryStore(mount.storeId);
                return (
                  <div
                    key={mount.id}
                    className="grid grid-cols-[minmax(180px,1fr)_110px_minmax(280px,1.6fr)_70px] items-center border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/memory-management/stores/${mount.storeId}`)
                      }
                      className="truncate text-left font-medium text-blue-600 hover:text-blue-700"
                    >
                      {store?.name ?? mount.storeId}
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
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`移除 ${store?.name ?? mount.storeId}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-12 text-center text-sm text-slate-400">
                当前没有外接 Memory Store
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="运行设置"
          description="控制异步提取和 Sub-agent 调用过程中的记忆协议。"
        >
          <div className="divide-y divide-slate-100 overflow-hidden rounded-[6px] border border-slate-200 bg-white">
            <RuntimeSetting
              id="memory-async-extraction"
              title="异步提取"
              description="主 agent 任务不内联写；会话结束或闲置后由异步 pass 提取值得长期保留的信息，并且只写 U/C。"
              checked={settings.asyncExtraction}
              onCheckedChange={(checked) => updateSetting("asyncExtraction", checked)}
            />
            <RuntimeSetting
              id="memory-context-pack"
              title="接受 context_pack"
              description="作为 Sub-agent 被调用时，接收调用方挑选的相关记忆摘要，仅用于当前任务。"
              checked={settings.acceptContextPack}
              onCheckedChange={(checked) => updateSetting("acceptContextPack", checked)}
            />
            <RuntimeSetting
              id="memory-signals"
              title="回传 memory_signals"
              description="将任务中发现的轻量记忆信号回传给调用方，由调用方决定写入 U/C 或标为更新材料。"
              checked={settings.returnMemorySignals}
              onCheckedChange={(checked) =>
                updateSetting("returnMemorySignals", checked)
              }
            />
            <RuntimeSetting
              id="memory-debug-sandbox"
              title="调试会话记忆沙箱"
              description="预览调试页读取真实记忆，写入隔离暂存；关闭会话即丢弃，可手动转正。"
              checked={settings.debugMemorySandbox}
              onCheckedChange={(checked) => updateSetting("debugMemorySandbox", checked)}
            />
          </div>
        </SectionCard>
      </div>

      <Dialog open={mountOpen} onOpenChange={handleMountOpenChange}>
        <DialogContent className="rounded-[8px] sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>挂载 Memory Store</DialogTitle>
            <DialogDescription>
              选择组织记忆资源，并明确当前 Claw 的访问权限和使用场景。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>Memory Store</Label>
              <Select
                value={selectedStoreId}
                onValueChange={(value) => {
                  setSelectedStoreId(value);
                  setMountError("");
                }}
                placeholder="请选择可挂载 Store"
                options={availableStores.map((store) => ({
                  value: store.id,
                  label: `${store.name} · ${store.nodeCount} 个节点`,
                }))}
                className="rounded-[4px] border-slate-300 bg-white shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label>访问权限</Label>
              <Select
                value={selectedAccess}
                onValueChange={(value) => setSelectedAccess(value as MountAccess)}
                options={[
                  { value: "read_only", label: "只读 · 仅检索消费（默认）" },
                  { value: "propose_only", label: "仅提议 · 可标为更新材料" },
                ]}
                className="rounded-[4px] border-slate-300 bg-white shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memory-usage-prompt">使用指引</Label>
              <Textarea
                id="memory-usage-prompt"
                value={usagePrompt}
                onChange={(event) => {
                  setUsagePrompt(event.target.value);
                  setMountError("");
                }}
                placeholder="说明这份记忆是什么、何时查询，以及什么信息应标为更新材料。"
                className="min-h-28 resize-none rounded-[4px] shadow-none"
              />
              {mountError ? <p className="text-xs text-rose-600">{mountError}</p> : null}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleMountOpenChange(false)}
              className="rounded-[4px]"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmitMount}
              className="rounded-[4px] bg-blue-600 hover:bg-blue-700"
            >
              确认挂载
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

function RuntimeSetting({
  id,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div>
        <Label htmlFor={id} className="text-sm font-medium text-slate-900">
          {title}
        </Label>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="shrink-0 data-[state=checked]:bg-blue-600"
      />
    </div>
  );
}

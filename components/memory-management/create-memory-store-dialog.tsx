"use client";

import { useState } from "react";
import { GitFork, FileUp, LayoutTemplate, Plus, Square } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { MemoryStore } from "@/lib/mock/memory-management";
import { cn } from "@/lib/utils";

export type StoreInitialization = "blank" | "template" | "fork" | "import";

export interface CreateMemoryStoreValue {
  name: string;
  description: string;
  initialization: StoreInitialization;
  importedFileName?: string;
  forkSourceStoreId?: string;
}

const initializationOptions: Array<{
  value: StoreInitialization;
  title: string;
  description: string;
  icon: typeof Square;
}> = [
  {
    value: "blank",
    title: "空白",
    description: "仅创建 INDEX.md，从零维护记忆。",
    icon: Square,
  },
  {
    value: "template",
    title: "从模板",
    description: "预置实体、决策与经验目录。",
    icon: LayoutTemplate,
  },
  {
    value: "fork",
    title: "从已有 Store fork",
    description: "复制成熟 Store，作为新 Claw 或新专项的冷启动记忆。",
    icon: GitFork,
  },
  {
    value: "import",
    title: "导入 Markdown",
    description: "将已有 md 文件初始化为 Store。",
    icon: FileUp,
  },
];

export function CreateMemoryStoreDialog({
  open,
  onOpenChange,
  stores,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: MemoryStore[];
  onSubmit: (value: CreateMemoryStoreValue) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [initialization, setInitialization] = useState<StoreInitialization>("blank");
  const [importedFileName, setImportedFileName] = useState("");
  const [forkSourceStoreId, setForkSourceStoreId] = useState(stores[0]?.id ?? "");
  const [nameError, setNameError] = useState("");

  function resetForm() {
    setName("");
    setDescription("");
    setInitialization("blank");
    setImportedFileName("");
    setForkSourceStoreId(stores[0]?.id ?? "");
    setNameError("");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit() {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setNameError("请输入 Memory Store 名称。");
      return;
    }

    onSubmit({
      name: normalizedName,
      description: description.trim(),
      initialization,
      importedFileName: importedFileName || undefined,
      forkSourceStoreId: initialization === "fork" ? forkSourceStoreId : undefined,
    });
    resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[8px] sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>创建 Memory Store</DialogTitle>
          <DialogDescription>
            创建独立的组织记忆资源。后续可挂载给多个 Claw，并通过记忆沉淀持续整理。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="memory-store-name">
              名称 <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="memory-store-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (nameError) {
                  setNameError("");
                }
              }}
              placeholder="例如：store_客户某局"
              className={cn("rounded-[4px] shadow-none", nameError && "border-rose-400")}
            />
            {nameError ? <p className="text-xs text-rose-600">{nameError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="memory-store-description">描述</Label>
            <Textarea
              id="memory-store-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="说明这份记忆包含什么，以及适合哪些任务使用。"
              className="min-h-20 resize-none rounded-[4px] shadow-none"
            />
          </div>

          <div className="space-y-2">
            <Label>初始化方式</Label>
            <div className="grid gap-3 sm:grid-cols-4">
              {initializationOptions.map((option) => {
                const Icon = option.icon;
                const selected = initialization === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setInitialization(option.value)}
                    className={cn(
                      "rounded-[6px] border p-4 text-left transition-colors",
                      selected
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", selected ? "text-blue-600" : "text-slate-500")} />
                    <div className="mt-3 text-sm font-semibold text-slate-900">{option.title}</div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {initialization === "import" ? (
            <div className="space-y-2 rounded-[6px] border border-dashed border-slate-300 bg-slate-50 p-4">
              <Label htmlFor="memory-store-import">选择 Markdown 文件</Label>
              <Input
                id="memory-store-import"
                type="file"
                accept=".md,text/markdown"
                className="rounded-[4px] bg-white shadow-none"
                onChange={(event) => setImportedFileName(event.target.files?.[0]?.name ?? "")}
              />
              <p className="text-xs text-slate-500">
                {importedFileName ? `已选择：${importedFileName}` : "Demo 中仅记录文件名并生成初始主题节点。"}
              </p>
            </div>
          ) : null}

          {initialization === "fork" ? (
            <div className="space-y-2 rounded-[6px] border border-slate-200 bg-slate-50 p-4">
              <Label>来源 Store</Label>
              <Select
                value={forkSourceStoreId}
                onValueChange={setForkSourceStoreId}
                options={stores
                  .filter((store) => store.type !== "builtin_c")
                  .map((store) => ({
                    value: store.id,
                    label: `${store.name} · v${store.currentVersion}`,
                  }))}
                className="rounded-[4px] bg-white shadow-none"
              />
              <p className="text-xs leading-5 text-slate-500">
                Demo 将复制来源 Store 的主题节点，形成新的 fork Store。
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} className="rounded-[4px]">
            取消
          </Button>
          <Button onClick={handleSubmit} className="rounded-[4px] bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  FilePlus2,
  FileText,
  Folder,
  History,
  Pencil,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  formatMemoryVersionLabel,
  type MemoryFile,
  type MemoryStore,
} from "@/lib/mock/memory-management";
import {
  AccessBadge,
  formatCompactNumber,
  MemoryStoreIcon,
  StoreKindBadge,
} from "@/components/memory-management/memory-shared";
import { cn } from "@/lib/utils";

function groupFiles(files: MemoryFile[]) {
  const rootFiles = files.filter((file) => !file.path.includes("/"));
  const groups = new Map<string, MemoryFile[]>();
  files
    .filter((file) => file.path.includes("/"))
    .forEach((file) => {
      const [group] = file.path.split("/");
      groups.set(group, [...(groups.get(group) ?? []), file]);
    });
  return { rootFiles, groups: Array.from(groups.entries()) };
}

export type StoreDetailTab = "nodes" | "versions" | "mounts";

const detailTabs: Array<{ value: StoreDetailTab; label: string }> = [
  { value: "nodes", label: "主题文件" },
  { value: "versions", label: "版本" },
  { value: "mounts", label: "挂载关系" },
];

export function MemoryStoreDetailWorkbench({
  store,
  initialTab = "nodes",
  embedded = false,
}: {
  store: MemoryStore;
  initialTab?: StoreDetailTab;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [files, setFiles] = useState<MemoryFile[]>(store.files.map((file) => ({ ...file })));
  const [selectedFileId, setSelectedFileId] = useState(store.files[0]?.id ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(store.files[0]?.content ?? "");
  const [currentVersion, setCurrentVersion] = useState(store.currentVersion);
  const [activeTab, setActiveTab] = useState<StoreDetailTab>(initialTab);
  const groupedFiles = useMemo(() => groupFiles(files), [files]);
  const selectedFile = files.find((file) => file.id === selectedFileId) ?? files[0];

  function selectFile(file: MemoryFile) {
    setSelectedFileId(file.id);
    setDraft(file.content);
    setEditing(false);
  }

  function handleSave() {
    if (!selectedFile) {
      return;
    }
    setFiles((current) =>
      current.map((file) =>
        file.id === selectedFile.id ? { ...file, content: draft } : file
      )
    );
    setEditing(false);
    toast.success(`已保存：${selectedFile.path}`);
  }

  function handleAddFile() {
    const path = window.prompt("请输入新的主题文件路径，例如 lessons/新经验.md");
    const normalizedPath = path?.trim();
    if (!normalizedPath) {
      return;
    }
    const markdownPath = normalizedPath.endsWith(".md")
      ? normalizedPath
      : `${normalizedPath}.md`;
    if (files.some((file) => file.path === markdownPath)) {
      toast.info("该路径已经存在。");
      return;
    }
    const nextFile: MemoryFile = {
      id: `memory-file-${Date.now()}`,
      path: markdownPath,
      content: `---\ntopic: ${markdownPath.split("/").pop()?.replace(/\.md$/, "") ?? "新主题"}\ntype: project\nsources: []\n---\n\n请补充内容。\n`,
    };
    setFiles((current) => [...current, nextFile]);
    setSelectedFileId(nextFile.id);
    setDraft(nextFile.content);
    setEditing(true);
  }

  function handleDeleteFile() {
    if (!selectedFile || selectedFile.path === "INDEX.md") {
      toast.info("INDEX.md 是库索引，不支持删除。");
      return;
    }
    if (!window.confirm(`确认删除“${selectedFile.path}”吗？`)) {
      return;
    }
    const nextFiles = files.filter((file) => file.id !== selectedFile.id);
    setFiles(nextFiles);
    setSelectedFileId(nextFiles[0]?.id ?? "");
    setDraft(nextFiles[0]?.content ?? "");
    setEditing(false);
    toast.success(`已删除：${selectedFile.path}`);
  }

  function handleRollback(version: MemoryStore["versions"][number]) {
    if (version.version === currentVersion) {
      toast.info("当前已经是该版本。");
      return;
    }
    const nextFiles = version.files.map((file) => ({ ...file }));
    setFiles(nextFiles);
    setCurrentVersion(version.version);
    setSelectedFileId(nextFiles[0]?.id ?? "");
    setDraft(nextFiles[0]?.content ?? "");
    setEditing(false);
    toast.success(`已回滚到 ${formatMemoryVersionLabel(version.version)}。`);
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-white",
        embedded ? "h-full" : "-m-6 min-h-[calc(100vh-60px)]"
      )}
    >
      <header
        className={cn(
          "flex min-h-[72px] flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-3",
          embedded && "pr-14"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {embedded ? null : (
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/memory-management")}
              className="h-9 w-9 rounded-[4px] border-slate-300 shadow-none"
              aria-label="返回记忆库"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <MemoryStoreIcon kind={store.kind} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold text-slate-950">{store.name}</h1>
              <StoreKindBadge kind={store.kind} />
              <span className="text-sm font-medium text-slate-500">
                {formatMemoryVersionLabel(currentVersion)}
              </span>
            </div>
            <p className="mt-1 max-w-3xl truncate text-sm text-slate-500">{store.description}</p>
          </div>
        </div>
        <Button
          onClick={() =>
            router.push(
              `/memory-management?tab=dreaming&create=1&storeId=${store.id}`
            )
          }
          className="h-8 rounded-[4px] bg-blue-600 px-4 text-sm shadow-none hover:bg-blue-700"
        >
          发起记忆沉淀
        </Button>
      </header>

      <div className="grid gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 sm:grid-cols-4">
        {[
          { label: "主题文件", value: `${store.nodeCount} 个` },
          { label: "Token 规模", value: formatCompactNumber(store.tokenCount) },
          { label: "挂载 Claw", value: `${store.mountCount} 个` },
          { label: "最近整理", value: store.lastDreamingAt ?? "从未" },
        ].map((item) => (
          <div key={item.label}>
            <div className="text-xs text-slate-500">{item.label}</div>
            <div className="mt-1 text-base font-semibold text-slate-900">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-7 border-b border-slate-200 px-6 pt-3">
        {detailTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
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

      {activeTab === "nodes" ? (
        <main className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] overflow-hidden">
          <aside className="min-h-0 overflow-y-auto border-r border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">主题文件</h2>
              <button
                type="button"
                onClick={handleAddFile}
                className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                aria-label="新增主题文件"
              >
                <FilePlus2 className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-3 text-xs leading-5 text-slate-500">
              记忆库由 INDEX 与多个主题文件（Node）组成；一个文件一个 Type，变更以文件 + 版本 Diff 衡量。
            </p>
            <div className="space-y-1">
              {groupedFiles.rootFiles.map((file) => (
                <FileTreeButton
                  key={file.id}
                  file={file}
                  selected={selectedFile?.id === file.id}
                  onClick={() => selectFile(file)}
                />
              ))}
              {groupedFiles.groups.map(([group, groupItems]) => (
                <div key={group} className="pt-2">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-slate-500">
                    <Folder className="h-3.5 w-3.5" />
                    {group}
                  </div>
                  <div className="mt-1 space-y-1 pl-3">
                    {groupItems.map((file) => (
                      <FileTreeButton
                        key={file.id}
                        file={file}
                        selected={selectedFile?.id === file.id}
                        onClick={() => selectFile(file)}
                        compact
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-white">
            {selectedFile ? (
              <>
                <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 px-5">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                    <span className="truncate font-medium text-slate-900">{selectedFile.path}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteFile}
                      disabled={selectedFile.path === "INDEX.md"}
                      className="h-8 rounded-[4px] border-slate-300 shadow-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      删除
                    </Button>
                    {editing ? (
                      <Button
                        size="sm"
                        onClick={handleSave}
                        className="h-8 rounded-[4px] bg-blue-600 shadow-none hover:bg-blue-700"
                      >
                        <Save className="h-3.5 w-3.5" />
                        保存
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(true)}
                        className="h-8 rounded-[4px] border-slate-300 shadow-none"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        编辑
                      </Button>
                    )}
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-auto p-6">
                  {editing ? (
                    <Textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      className="min-h-full resize-none rounded-[4px] border-slate-300 font-mono text-sm leading-6 shadow-none"
                    />
                  ) : (
                    <article className="mx-auto max-w-4xl whitespace-pre-wrap font-mono text-sm leading-7 text-slate-700">
                      {selectedFile.content}
                    </article>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                暂无主题文件
              </div>
            )}
          </section>
        </main>
      ) : null}

      {activeTab === "versions" ? (
        <main className="min-h-0 flex-1 overflow-auto bg-slate-50/40 p-6">
          <div className="grid gap-4 xl:grid-cols-2">
            {store.versions.map((version) => {
              const active = version.version === currentVersion;
              return (
                <div
                  key={version.version}
                  className={cn(
                    "rounded-[6px] border bg-white p-4",
                    active ? "border-blue-300" : "border-slate-200"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <History className="h-4 w-4 text-slate-500" />
                      {formatMemoryVersionLabel(version.version)}
                    </div>
                    <span className="text-xs text-slate-500">{version.source}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{version.summary}</p>
                  <div className="mt-3 text-xs text-slate-400">
                    {version.author} · {version.createdAt}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    {active ? (
                      <span className="text-xs font-medium text-blue-600">当前版本</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRollback(version)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        回滚到此版本
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toast.info("Demo 中版本 Diff 对比入口待接入。")}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      Diff 对比
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      ) : null}

      {activeTab === "mounts" ? (
        <main className="min-h-0 flex-1 overflow-auto bg-slate-50/40 p-6">
          <div className="mb-3 rounded-[6px] border border-blue-100 bg-blue-50/70 px-4 py-2.5 text-xs leading-5 text-slate-600">
            本期挂载库统一为<span className="font-medium text-slate-800">「全量读写」</span>，写入即对其他挂载方可见；细粒度 RO/RW 待平台数据权限就绪后再做。
          </div>
          <div className="overflow-hidden rounded-[6px] border border-slate-200 bg-white">
            <div className="grid grid-cols-[180px_120px_minmax(260px,1fr)_170px] border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700">
              <span>Claw</span>
              <span>权限</span>
              <span>使用指引</span>
              <span>更新时间</span>
            </div>
            {store.mountRelations.length > 0 ? (
              store.mountRelations.map((relation) => (
                <div
                  key={relation.id}
                  className="grid grid-cols-[180px_120px_minmax(260px,1fr)_170px] items-center border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                >
                  <span className="font-medium text-slate-900">{relation.clawName}</span>
                  <span>
                    <AccessBadge access={relation.access} />
                  </span>
                  <p className="line-clamp-2 pr-6 leading-6 text-slate-600">
                    {relation.usagePrompt}
                  </p>
                  <span className="text-slate-500">{relation.updatedAt}</span>
                </div>
              ))
            ) : (
              <div className="px-6 py-16 text-center text-sm text-slate-400">
                暂无挂载关系
              </div>
            )}
          </div>
        </main>
      ) : null}
    </div>
  );
}

function FileTreeButton({
  file,
  selected,
  onClick,
  compact,
}: {
  file: MemoryFile;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-[4px] px-2 py-2 text-left text-sm transition-colors",
        selected
          ? "bg-blue-50 font-medium text-blue-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      {compact ? <ChevronRight className="h-3 w-3" /> : <FileText className="h-3.5 w-3.5" />}
      <span className="truncate">{file.path.split("/").pop()}</span>
    </button>
  );
}

"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  Bot,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Download,
  Maximize2,
  Minimize2,
  FileText,
  Files,
  Folder,
  ListTodo,
  LocateFixed,
  LoaderCircle,
  MoreHorizontal,
  Paperclip,
  PanelRightClose,
  PlugZap,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  WorkspaceEntryItem,
  WorkspaceFolderItem,
} from "@/lib/mock/claw-hub-next";
import { CLAW_CLIENT_WORKSPACE_ROOT } from "./personal-workspace-data";
import { usePersonalChatContext } from "./personal-chat-context";
import type { PersonalChatAttachment } from "./personal-chat-context";
import { cn } from "@/lib/utils";
import { useOptionalWorkspaceCatalog } from "@/components/workspace-1/workspaceCatalog";
import { FileGlyph } from "@/components/skillhub-v2/shared";
import { entryName } from "@/components/skillhub-v2/skill-file-ops";
import { SkillFilesTab, type SkillFilesTabHandle } from "@/components/skillhub-v2/skill-files-tab";
import { skillFileBaseName } from "@/components/workspace-1/workspaceFileQuote";

export type PersonalPanelView = "summary" | "execution" | "files" | "workspace" | "file";

export type ConversationPanelFile = {
  id: string;
  name: string;
  path: string;
  size: string;
  source?: string;
  status?: "new" | "modified";
  updatedAt?: string | number;
};

export type ConversationPanelTask = {
  id: string;
  title: string;
  status: "done" | "running" | "pending" | "failed";
  kind?: "task" | "subagent";
  recordContent?: string;
  prompt?: string;
  traceEvents?: SubagentTraceEvent[];
  durationLabel?: string;
  updatedAt?: string | number;
};

type SummarySectionKey = "tasks" | "taskList" | "subagents" | "outputs" | "materials";
type SubagentTraceEvent = {
  id: string;
  kind: "thought" | "skill" | "plugin";
  title: string;
  content?: string;
  duration?: string;
  status: "done" | "running" | "failed";
  expandedByDefault?: boolean;
};

const SUMMARY_ROW_HEIGHTS: Record<SummarySectionKey, number> = {
  tasks: 40,
  taskList: 40,
  subagents: 40,
  outputs: 60,
  materials: 48,
};

const SUMMARY_SECTION_WEIGHTS: Record<SummarySectionKey, number> = {
  tasks: 0.25,
  taskList: 0.55,
  subagents: 0.45,
  outputs: 0.4,
  materials: 0.35,
};
const PROCESS_STATUS_HEIGHT = 62;
const PROCESS_TABS_HEIGHT = 38;
const SUMMARY_TIME_ZONE = "Asia/Shanghai";

function formatArtifactTimestamp(value?: string | number) {
  if (value == null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const time = new Intl.DateTimeFormat("zh-CN", {
    timeZone: SUMMARY_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SUMMARY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const datePart = (type: Intl.DateTimeFormatPartTypes) => dateParts.find((part) => part.type === type)?.value ?? "";
  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SUMMARY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const todayPart = (type: Intl.DateTimeFormatPartTypes) => todayParts.find((part) => part.type === type)?.value ?? "";
  const isToday = datePart("year") === todayPart("year") && datePart("month") === todayPart("month") && datePart("day") === todayPart("day");
  const label = isToday ? time : `${datePart("month")}-${datePart("day")} ${time}`;
  const fullLabel = new Intl.DateTimeFormat("zh-CN", {
    timeZone: SUMMARY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);

  return { label, fullLabel, dateTime: date.toISOString() };
}

function allocateSummaryRows(
  availableHeight: number,
  sections: Array<{ key: SummarySectionKey; count: number }>,
  collapsed: Record<SummarySectionKey, boolean>,
) {
  const visibleSections = sections.filter((section) => !collapsed[section.key] && section.count > 0);
  const rows = Object.fromEntries(sections.map((section) => [section.key, 0])) as Record<SummarySectionKey, number>;
  const minHeight = visibleSections.reduce((height, section) => height + SUMMARY_ROW_HEIGHTS[section.key], 0);

  if (visibleSections.length > 0 && availableHeight < minHeight) {
    return { rows, fallbackToPanelScroll: true };
  }

  const totalWeight = visibleSections.reduce((weight, section) => weight + SUMMARY_SECTION_WEIGHTS[section.key], 0) || 1;
  let remainingHeight = Math.max(0, availableHeight);
  while (true) {
    const candidates = visibleSections
      .filter((section) => rows[section.key] < section.count)
      .filter((section) => SUMMARY_ROW_HEIGHTS[section.key] <= remainingHeight)
      .sort((a, b) => {
        const aShare = (rows[a.key] * SUMMARY_ROW_HEIGHTS[a.key]) / (SUMMARY_SECTION_WEIGHTS[a.key] / totalWeight);
        const bShare = (rows[b.key] * SUMMARY_ROW_HEIGHTS[b.key]) / (SUMMARY_SECTION_WEIGHTS[b.key] / totalWeight);
        return aShare - bShare;
      });
    const next = candidates[0];
    if (!next) break;
    rows[next.key] += 1;
    remainingHeight -= SUMMARY_ROW_HEIGHTS[next.key];
  }

  return { rows, fallbackToPanelScroll: false };
}

function SummarySectionHeader({
  title,
  count,
  expanded,
  onToggle,
}: {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      onClick={onToggle}
      className="flex h-8 w-full shrink-0 items-center gap-2 rounded-md px-1 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
    >
      {expanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
      <span className="flex-1 text-sm font-semibold text-slate-800">{title}</span>
      <span className="text-xs text-slate-400">{count}</span>
    </button>
  );
}

type WorkspaceFile = {
  id: string;
  name: string;
  path: string;
  sizeLabel: string;
  file?: File;
  subagentTask?: ConversationPanelTask;
};

type PersonalConversationSidePanelProps = {
  open: boolean;
  personalMode?: boolean;
  view: PersonalPanelView;
  panelWidth: number;
  onPanelWidthChange: (width: number) => void;
  onViewChange: (view: PersonalPanelView) => void;
  onClose: () => void;
  outputs?: ConversationPanelFile[];
  tasks?: ConversationPanelTask[];
  conversationTitle?: string;
  historicalMaterials?: PersonalChatAttachment[];
};

function flattenLegacyFiles(folder: WorkspaceFolderItem, parentPath = ""): WorkspaceFile[] {
  return folder.children.flatMap((entry: WorkspaceEntryItem) => {
    const path = parentPath ? `${parentPath} / ${entry.name}` : entry.name;
    if (entry.kind === "folder") return flattenLegacyFiles(entry, path);
    return [{ id: entry.id, name: entry.name, path, sizeLabel: entry.sizeLabel }];
  });
}

function parseCsv(text: string) {
  return text.split(/\r?\n/).filter(Boolean).slice(0, 40).map((line) => line.split(","));
}

function SubagentRecordPreview({ task }: { task: ConversationPanelTask }) {
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const events = task.traceEvents?.length ? task.traceEvents : [{
    id: `${task.id}-summary`,
    kind: "thought" as const,
    title: "执行摘要",
    content: task.recordContent ?? "暂无详细执行记录",
    status: task.status === "failed" ? "failed" as const : task.status === "running" ? "running" as const : "done" as const,
    expandedByDefault: true,
  }];
  const statusLabel = { done: "已完成", running: "执行中...", pending: "等待执行", failed: "执行失败" }[task.status];

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-50/60 p-4">
      <article className="flex min-h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        <header className="flex min-h-11 items-center gap-2 border-b border-slate-100 px-4">
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{task.title.replace(/^子智能体：/, "")}</span>
          <span className={cn("shrink-0 text-xs", task.status === "running" ? "text-blue-600" : task.status === "failed" ? "text-rose-600" : "text-slate-400")}>{statusLabel}</span>
        </header>
        <div className="space-y-4 p-4">
          <div className="ml-auto max-w-[84%] rounded-lg bg-blue-50 px-3 py-2.5 text-[13px] leading-5 text-slate-700">{task.prompt ?? "查看该子智能体收到的任务内容与执行过程。"}</div>
          <div className="ml-1 border-l border-slate-200 pl-4">
            {events.map((event, index) => {
              const isExpanded = expandedEvents[event.id] ?? Boolean(event.expandedByDefault);
              const EventIcon = event.kind === "thought" ? Brain : event.kind === "skill" ? Sparkles : PlugZap;
              const eventLabel = event.kind === "thought"
                ? `思考完成${event.duration ? `，用时 ${event.duration}` : ""}`
                : `${event.title} ${event.kind === "skill" ? "技能" : "插件"}调用${event.status === "running" ? "中..." : event.status === "failed" ? "失败" : "完成"}`;
              return (
                <div key={event.id} className="relative pb-3 last:pb-0">
                  <span className="absolute -left-[21px] top-1 flex h-3.5 w-3.5 items-center justify-center bg-white">
                    <EventIcon className={cn("h-3.5 w-3.5", event.status === "running" ? "text-blue-500" : event.status === "failed" ? "text-rose-500" : "text-slate-500")} />
                  </span>
                  <button type="button" aria-expanded={isExpanded} onClick={() => setExpandedEvents((current) => ({ ...current, [event.id]: !isExpanded }))} className="flex min-h-6 w-full items-center gap-1.5 text-left text-[13px] text-slate-600 hover:text-slate-900">
                    <span className="min-w-0 flex-1 truncate">{eventLabel}</span>
                    <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition-transform", isExpanded && "rotate-90")} />
                  </button>
                  {isExpanded && event.content ? <p className="mt-1 whitespace-pre-wrap text-[13px] leading-5 text-slate-700">{event.content}</p> : null}
                  {index < events.length - 1 ? <span aria-hidden="true" className="absolute -bottom-0.5 left-[-17px] h-3 border-l border-slate-200" /> : null}
                </div>
              );
            })}
          </div>
        </div>
      </article>
    </div>
  );
}

function FilePreview({ file }: { file: WorkspaceFile }) {
  const [content, setContent] = useState("");
  const [spreadsheetRows, setSpreadsheetRows] = useState<string[][]>([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "file";
  const previewLabel = extension === "xlsx" || extension === "csv"
    ? "表格预览"
    : extension === "pdf"
      ? "PDF 预览"
      : extension === "html"
        ? "网页预览"
        : extension === "md"
          ? "Markdown 预览"
          : "文档预览";

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;
    setContent("");
    setSpreadsheetRows([]);
    setPreviewUrl("");
    if (!file.file) {
      if (extension === "html") setContent(`<main style="font-family:system-ui;padding:32px;color:#334155"><h1>${file.name.replace(/\.[^.]+$/, "")}</h1><p>HTML 网页预览示例</p></main>`);
      return;
    }
    if (["png", "jpg", "jpeg", "gif", "webp", "pdf"].includes(extension)) {
      objectUrl = URL.createObjectURL(file.file);
      setPreviewUrl(objectUrl);
    } else if (extension === "csv" || extension === "txt" || extension === "md" || extension === "html") {
      void file.file.text().then((text) => {
        if (cancelled) return;
        if (extension === "csv") setSpreadsheetRows(parseCsv(text));
        else setContent(text);
      });
    } else if (extension === "docx" || extension === "xlsx") {
      void import("jszip").then(async ({ default: JSZip }) => {
        const zip = await JSZip.loadAsync(file.file as File);
        const target = extension === "docx" ? "word/document.xml" : "xl/worksheets/sheet1.xml";
        const xmlFile = zip.file(target);
        if (!xmlFile) return;
        const xmlText = await xmlFile.async("text");
        if (cancelled) return;
        const xml = new DOMParser().parseFromString(xmlText, "application/xml");
        if (extension === "docx") {
          const paragraphs = Array.from(xml.getElementsByTagName("w:p")).map((paragraph) => Array.from(paragraph.getElementsByTagName("w:t")).map((node) => node.textContent ?? "").join(""));
          setContent(paragraphs.join("\n\n"));
        } else {
          const stringsXml = zip.file("xl/sharedStrings.xml");
          const sharedStrings = stringsXml ? Array.from(new DOMParser().parseFromString(await stringsXml.async("text"), "application/xml").getElementsByTagName("si")).map((item) => Array.from(item.getElementsByTagName("t")).map((node) => node.textContent ?? "").join("")) : [];
          const rows = Array.from(xml.getElementsByTagName("row")).map((row) => Array.from(row.getElementsByTagName("c")).map((cell) => {
            const rawValue = cell.getElementsByTagName("v")[0]?.textContent ?? cell.textContent ?? "";
            return cell.getAttribute("t") === "s" ? sharedStrings[Number(rawValue)] ?? rawValue : rawValue;
          }));
          setSpreadsheetRows(rows);
        }
      }).catch(() => setContent("暂时无法读取此文件内容。"));
    }
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.file, file.name, extension]);

  const mockRows = extension === "xlsx" || extension === "csv"
    ? [["名称", "状态", "更新时间"], ["示例记录", "已完成", "2026-10-23"], ["当前文件", "可预览", "—"]]
    : [];
  const rows = spreadsheetRows.length ? spreadsheetRows : mockRows;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="truncate text-sm font-medium text-slate-800">{file.name}</div>
        <div className="mt-1 truncate text-xs text-slate-400">{file.path} · {file.sizeLabel}</div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-4">
        {previewUrl && ["png", "jpg", "jpeg", "gif", "webp"].includes(extension) ? <div className="relative flex h-full min-h-64 items-start justify-center rounded-lg bg-white p-3"><Image src={previewUrl} alt={file.name} width={1200} height={900} unoptimized className="max-h-full max-w-full object-contain" /></div> : null}
        {previewUrl && extension === "pdf" ? <iframe title={file.name} src={previewUrl} className="h-full min-h-[32rem] w-full rounded-lg border-0 bg-white" /> : null}
        {extension === "html" && content ? <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="flex justify-end border-b px-3 py-1"><span className="text-[11px] text-slate-400">网页预览 · 脚本已隔离</span></div><iframe title={file.name} sandbox="" srcDoc={content} className="min-h-0 flex-1 border-0" /></div> : null}
        {rows.length ? <div className="overflow-auto rounded-lg border border-slate-200 bg-white"><table className="min-w-full border-collapse text-left text-xs">{rows.map((row, rowIndex) => <tbody key={rowIndex}><tr className={rowIndex === 0 ? "bg-slate-50 font-medium text-slate-700" : "text-slate-600"}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border-b border-r border-slate-100 px-3 py-2">{cell}</td>)}</tr></tbody>)}</table></div> : null}
        {extension !== "html" && !rows.length && !previewUrl ? <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-700">{content ? <pre className={cn("whitespace-pre-wrap font-sans", extension === "md" && "prose prose-sm max-w-none")}>{content}</pre> : <><div className="mb-4 text-xs font-medium text-slate-400">{previewLabel}</div><h1 className="mb-3 text-xl font-semibold text-slate-800">{file.name.replace(/\.[^.]+$/, "")}</h1><p>这是工作空间文件的预览区域。选择已上传文件时会展示文件实际内容；示例工作空间数据用于演示文件类型对应的预览样式。</p><p className="mt-3 text-slate-500">文件路径：{file.path}</p></>}</article> : null}
      </div>
    </div>
  );
}

export function PersonalConversationSidePanel({
  open,
  personalMode = false,
  view,
  panelWidth,
  onPanelWidthChange,
  onViewChange,
  onClose,
  outputs = [],
  tasks = [],
  historicalMaterials = [],
}: PersonalConversationSidePanelProps) {
  const context = usePersonalChatContext();
  const catalog = useOptionalWorkspaceCatalog();
  const router = useRouter();
  const pathname = usePathname();
  const filesRef = useRef<SkillFilesTabHandle>(null);
  const [workspaceFileTabs, setWorkspaceFileTabs] = useState<string[]>([]);
  const [workspaceActiveFilePath, setWorkspaceActiveFilePath] = useState<string | null>(null);
  const materials = useMemo(() => {
    const byId = new Map<string, PersonalChatAttachment>();
    [...historicalMaterials, ...(context?.attachments ?? [])].forEach((item) => {
      const key = item.source === "workspace" ? `workspace-path:${item.path ?? item.name}` : item.id;
      byId.set(key, item);
    });
    return [...byId.values()];
  }, [context?.attachments, historicalMaterials]);
  const [sessionFileQuery, setSessionFileQuery] = useState("");
  const [sessionFileSearchOpen, setSessionFileSearchOpen] = useState(false);
  const [openMoreMenuKey, setOpenMoreMenuKey] = useState<string | null>(null);
  const [deletedOutputIds, setDeletedOutputIds] = useState<Set<string>>(() => new Set());
  const [pendingDeleteOutput, setPendingDeleteOutput] = useState<ConversationPanelFile | null>(null);
  const [openFiles, setOpenFiles] = useState<WorkspaceFile[]>([]);
  const [activeFileId, setActiveFileId] = useState("");
  const [fileReturnView, setFileReturnView] = useState<PersonalPanelView>("files");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [summarySectionHeight, setSummarySectionHeight] = useState(0);
  const [currentProgressVisible, setCurrentProgressVisible] = useState(true);
  const [collapsedSummarySections, setCollapsedSummarySections] = useState<Record<SummarySectionKey, boolean>>({
    tasks: false,
    taskList: false,
    subagents: false,
    outputs: false,
    materials: false,
  });
  const resizingPointerId = useRef<number | null>(null);
  const fileTabsRef = useRef<HTMLDivElement | null>(null);
  const summaryContentRef = useRef<HTMLDivElement | null>(null);
  const sessionFileSearchRef = useRef<HTMLInputElement | null>(null);
  const taskListRef = useRef<HTMLDivElement | null>(null);
  const subagentListRef = useRef<HTMLDivElement | null>(null);
  const processListManuallyScrolled = useRef(false);
  const workspaceFiles = useMemo(() => {
    if (catalog?.activeSpace) {
      return catalog.activeSpace.files
        .filter((item) => !item.path.endsWith("/"))
        .map((item) => ({
          id: item.path,
          name: skillFileBaseName(item.path),
          path: item.path,
          sizeLabel: item.sizeLabel ?? "",
        }));
    }
    return flattenLegacyFiles(CLAW_CLIENT_WORKSPACE_ROOT);
  }, [catalog?.activeSpace]);
  const sortedOutputs = useMemo(() => [...outputs].sort((a, b) => {
    const aTime = typeof a.updatedAt === "number" ? a.updatedAt : Date.parse(a.updatedAt ?? "");
    const bTime = typeof b.updatedAt === "number" ? b.updatedAt : Date.parse(b.updatedAt ?? "");
    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) return bTime - aTime;
    return outputs.indexOf(b) - outputs.indexOf(a);
  }), [outputs]);
  const availableOutputs = useMemo(() => sortedOutputs.filter((file) => !deletedOutputIds.has(file.id)), [deletedOutputIds, sortedOutputs]);
  const normalizedSessionFileQuery = sessionFileQuery.trim().toLowerCase();
  const filteredOutputs = useMemo(() => normalizedSessionFileQuery
    ? availableOutputs.filter((file) => `${file.name} ${file.path} ${file.source ?? ""}`.toLowerCase().includes(normalizedSessionFileQuery))
    : availableOutputs, [availableOutputs, normalizedSessionFileQuery]);
  const filteredMaterials = useMemo(() => normalizedSessionFileQuery
    ? materials.filter((file) => `${file.name} ${file.path ?? ""} ${file.source ?? ""}`.toLowerCase().includes(normalizedSessionFileQuery))
    : materials, [materials, normalizedSessionFileQuery]);
  const summarySections = useMemo(() => [
    ...(tasks.length ? [{ key: "tasks" as const, count: tasks.length }] : []),
    ...(outputs.length ? [{ key: "outputs" as const, count: outputs.length }] : []),
    ...(materials.length ? [{ key: "materials" as const, count: materials.length }] : []),
  ], [materials.length, outputs.length, tasks.length]);
  const taskItems = useMemo(() => tasks.filter((item) => item.kind !== "subagent"), [tasks]);
  const subagentItems = useMemo(() => tasks.filter((item) => item.kind === "subagent"), [tasks]);
  const sortedSubagentItems = useMemo(() => [...subagentItems].sort((a, b) => {
    const aTime = typeof a.updatedAt === "number" ? a.updatedAt : Date.parse(a.updatedAt ?? "");
    const bTime = typeof b.updatedAt === "number" ? b.updatedAt : Date.parse(b.updatedAt ?? "");
    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) return bTime - aTime;
    return 0;
  }), [subagentItems]);
  const currentProgressItem = taskItems.find((item) => item.status === "running")
    ?? subagentItems.find((item) => item.status === "running")
    ?? [...taskItems].reverse().find((item) => item.status === "done")
    ?? [...subagentItems].reverse().find((item) => item.status === "done")
    ?? taskItems.find((item) => item.status === "pending")
    ?? subagentItems[0];
  const currentProgressTaskIndex = taskItems.findIndex((item) => item.id === currentProgressItem?.id);
  const currentProgressSubagentIndex = sortedSubagentItems.findIndex((item) => item.id === currentProgressItem?.id);
  const completedTaskCount = taskItems.filter((item) => item.status === "done").length;
  const currentProgressListCollapsed = currentProgressItem?.kind === "subagent"
    ? collapsedSummarySections.subagents
    : collapsedSummarySections.taskList;
  const showCurrentProgressLocator = Boolean(currentProgressItem) && !currentProgressListCollapsed && !currentProgressVisible;

  function syncCurrentProgressVisibility() {
    const list = currentProgressItem?.kind === "subagent" ? subagentListRef.current : taskListRef.current;
    const container = activeLayout.fallbackToPanelScroll ? summaryContentRef.current : list;
    const index = currentProgressItem?.kind === "subagent" ? currentProgressSubagentIndex : currentProgressTaskIndex;
    const row = index >= 0 ? list?.children[index] as HTMLElement | undefined : undefined;
    if (!container || !row) {
      setCurrentProgressVisible(false);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    setCurrentProgressVisible(rowRect.bottom > containerRect.top && rowRect.top < containerRect.bottom);
  }

  function markProgressListManuallyScrolled() {
    processListManuallyScrolled.current = true;
    syncCurrentProgressVisibility();
  }

  function locateCurrentProgress() {
    if (!currentProgressItem) return;
    const isSubagent = currentProgressItem.kind === "subagent";
    setCollapsedSummarySections((current) => ({
      ...current,
      ...(isSubagent ? { subagents: false } : { taskList: false }),
    }));
    requestAnimationFrame(() => {
      const container = isSubagent ? subagentListRef.current : taskListRef.current;
      const index = isSubagent ? currentProgressSubagentIndex : currentProgressTaskIndex;
      if (index >= 0) container?.children[index]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      setCurrentProgressVisible(true);
    });
  }

  function toggleProgressList(key: "taskList" | "subagents") {
    setCollapsedSummarySections((current) => ({ ...current, [key]: !current[key] }));
    requestAnimationFrame(() => requestAnimationFrame(syncCurrentProgressVisibility));
  }
  const summaryLayout = useMemo(() => {
    const sectionChromeHeight = 32 * summarySections.length
      + 12 * Math.max(0, summarySections.length - 1)
      + (tasks.length && !collapsedSummarySections.tasks
        ? PROCESS_STATUS_HEIGHT + (subagentItems.length ? PROCESS_TABS_HEIGHT : 0)
        : 0);
    const availableListHeight = Math.max(0, summarySectionHeight - 32 - sectionChromeHeight);
    return allocateSummaryRows(availableListHeight, summarySections, collapsedSummarySections);
  }, [collapsedSummarySections, subagentItems.length, summarySectionHeight, summarySections, tasks.length]);
  const activeFile = openFiles.find((file) => file.id === activeFileId) ?? openFiles[0];
  const activePrimaryView = view === "summary" ? "execution" : view === "file" ? fileReturnView : view;
  const showExecution = personalMode ? activePrimaryView === "execution" : view === "summary";
  const showSessionFiles = personalMode ? activePrimaryView === "files" : view === "summary";
  const executionLayout = useMemo(() => {
    const hasTaskList = taskItems.length > 0;
    const hasSubagents = subagentItems.length > 0;
    const groupCount = Number(hasTaskList) + Number(hasSubagents);
    const chromeHeight = 32 + groupCount * 32 + Math.max(0, groupCount - 1) * 12;
    const availableHeight = Math.max(0, summarySectionHeight - 32 - chromeHeight);
    const sections = [
      ...(hasTaskList ? [{ key: "taskList" as const, count: taskItems.length }] : []),
      ...(hasSubagents ? [{ key: "subagents" as const, count: subagentItems.length }] : []),
    ];
    return allocateSummaryRows(availableHeight, sections, collapsedSummarySections);
  }, [collapsedSummarySections, subagentItems.length, summarySectionHeight, taskItems.length]);
  const filesLayout = useMemo(() => {
    const sections = [
      ...(filteredOutputs.length ? [{ key: "outputs" as const, count: filteredOutputs.length }] : []),
      ...(filteredMaterials.length ? [{ key: "materials" as const, count: filteredMaterials.length }] : []),
    ];
    const chromeHeight = (sections.length ? 32 : 0) + (sessionFileSearchOpen ? 36 : 0) + sections.length * 32 + Math.max(0, sections.length - 1) * 12;
    return allocateSummaryRows(Math.max(0, summarySectionHeight - 32 - chromeHeight), sections, collapsedSummarySections);
  }, [collapsedSummarySections, filteredMaterials.length, filteredOutputs.length, sessionFileSearchOpen, summarySectionHeight]);
  const activeLayout = personalMode ? (showExecution ? executionLayout : filesLayout) : summaryLayout;

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  useLayoutEffect(() => {
    const element = summaryContentRef.current;
    if (!element) return;
    const updateHeight = () => setSummarySectionHeight(element.getBoundingClientRect().height);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [open, view, isFullscreen]);

  useEffect(() => {
    if (sessionFileSearchOpen) sessionFileSearchRef.current?.focus();
  }, [sessionFileSearchOpen]);

  const handleWorkspaceTabsChange = useCallback((tabs: string[], activePath: string | null) => {
    setWorkspaceFileTabs(tabs);
    setWorkspaceActiveFilePath(activePath);
  }, []);

  useEffect(() => {
    if (catalog?.activeSpace) return;
    setWorkspaceFileTabs([]);
    setWorkspaceActiveFilePath(null);
  }, [catalog?.activeSpace]);

  useEffect(() => {
    fileTabsRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeFileId, openFiles.length, view, workspaceActiveFilePath, workspaceFileTabs.length]);

  useEffect(() => {
    if (!open || (personalMode ? activePrimaryView !== "execution" : view !== "summary") || (!personalMode && collapsedSummarySections.tasks)) return;
    processListManuallyScrolled.current = false;
    if (activeLayout.fallbackToPanelScroll) return;
    requestAnimationFrame(() => {
      if (currentProgressItem?.kind === "subagent" && currentProgressSubagentIndex >= 0 && !collapsedSummarySections.subagents) {
        subagentListRef.current?.children[currentProgressSubagentIndex]?.scrollIntoView({ block: "nearest" });
      } else if (currentProgressTaskIndex >= 0 && !collapsedSummarySections.taskList) {
        taskListRef.current?.children[currentProgressTaskIndex]?.scrollIntoView({ block: "nearest" });
      }
    });
  }, [activeLayout.fallbackToPanelScroll, activePrimaryView, collapsedSummarySections.subagents, collapsedSummarySections.taskList, collapsedSummarySections.tasks, currentProgressItem?.id, currentProgressItem?.kind, currentProgressSubagentIndex, currentProgressTaskIndex, open, personalMode, view]);

  useEffect(() => {
    if (!open || (personalMode ? activePrimaryView !== "execution" : view !== "summary") || (!personalMode && collapsedSummarySections.tasks) || processListManuallyScrolled.current || activeLayout.fallbackToPanelScroll) return;
    if (currentProgressItem?.kind === "subagent" && currentProgressSubagentIndex >= 0 && !collapsedSummarySections.subagents) {
      subagentListRef.current?.children[currentProgressSubagentIndex]?.scrollIntoView({ block: "nearest" });
    } else if (currentProgressTaskIndex >= 0 && !collapsedSummarySections.taskList) {
      taskListRef.current?.children[currentProgressTaskIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeLayout.fallbackToPanelScroll, activePrimaryView, collapsedSummarySections.subagents, collapsedSummarySections.taskList, collapsedSummarySections.tasks, currentProgressItem?.id, currentProgressItem?.kind, currentProgressSubagentIndex, currentProgressTaskIndex, open, personalMode, view]);


  function openFile(file: WorkspaceFile) {
    if (view !== "file") setFileReturnView(activePrimaryView === "execution" ? "execution" : activePrimaryView === "workspace" ? "workspace" : "files");
    setOpenFiles((current) => current.some((item) => item.id === file.id) ? current.map((item) => item.id === file.id ? { ...item, ...file } : item) : [...current, file]);
    setActiveFileId(file.id);
    onViewChange("file");
  }

  function closeFile(fileId: string) {
    const next = openFiles.filter((file) => file.id !== fileId);
    setOpenFiles(next);
    if (activeFileId === fileId) setActiveFileId(next[next.length - 1]?.id ?? "");
    if (next.length === 0) onViewChange(personalMode ? fileReturnView : "summary");
  }

  function referenceFile(file: WorkspaceFile) {
    context?.addAttachments([{
      id: `workspace:${file.id}`,
      name: file.name,
      source: "workspace",
      path: file.path,
      sizeLabel: file.sizeLabel,
    }]);
  }

  function locateFile(file: ConversationPanelFile | { id: string; name: string; path?: string }) {
    onViewChange("workspace");
    const path = file.path ?? file.name;
    window.requestAnimationFrame(() => filesRef.current?.revealPath(path));
  }

  function downloadAttachment(file: File) {
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function confirmDeleteOutput() {
    if (!pendingDeleteOutput) return;
    const outputId = pendingDeleteOutput.id;
    setDeletedOutputIds((current) => new Set(current).add(outputId));
    if (openFiles.some((file) => file.id === outputId)) closeFile(outputId);
    setPendingDeleteOutput(null);
    toast.success("已从本次会话和工作空间移除该产物");
  }

  function selectPrimaryView(id: PersonalPanelView) {
    if (id === "workspace") {
      filesRef.current?.hidePreview();
      if (view === "workspace") return;
    }
    onViewChange(id);
  }

  function closePanel() {
    setIsFullscreen(false);
    onClose();
  }

  function resizePanel(clientX: number) {
    onPanelWidthChange(clampPanelWidth(window.innerWidth - clientX));
  }

  function clampPanelWidth(width: number) {
    const maxWidth = Math.max(280, Math.min(window.innerWidth * 0.85, 1100));
    return Math.round(Math.min(maxWidth, Math.max(280, width)));
  }

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-slate-900/20 min-[1440px]:hidden"
          onClick={closePanel}
          aria-hidden="true"
        />
      ) : null}
      <aside
        className={cn(
          "relative min-h-0 shrink-0 flex-col bg-white",
          open ? "flex" : "hidden",
          open && !isFullscreen && "min-[1440px]:-mt-12 min-[1440px]:h-[calc(100%+3rem)]",
          isFullscreen
            ? "fixed inset-0 z-[60] h-screen w-screen min-w-0 border-0 shadow-2xl"
            : cn(
                "border-l border-slate-200",
                "max-[1439px]:fixed max-[1439px]:inset-y-0 max-[1439px]:right-0 max-[1439px]:z-40 max-[1439px]:shadow-2xl"
              )
        )}
        style={!isFullscreen ? { width: panelWidth } : undefined}
        aria-label="会话右侧区域"
      >
        {!isFullscreen ? (
          <div
            role="separator"
            aria-label="调整侧栏宽度"
            aria-orientation="vertical"
            aria-valuemin={280}
            aria-valuemax={1100}
            aria-valuenow={panelWidth}
            aria-valuetext={`${panelWidth} 像素`}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                onPanelWidthChange(clampPanelWidth(panelWidth + 24));
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                onPanelWidthChange(clampPanelWidth(panelWidth - 24));
              }
            }}
            onPointerDown={(event) => {
              event.preventDefault();
              resizingPointerId.current = event.pointerId;
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (resizingPointerId.current === event.pointerId) resizePanel(event.clientX);
            }}
            onPointerUp={(event) => {
              if (resizingPointerId.current === event.pointerId) resizingPointerId.current = null;
            }}
            onLostPointerCapture={() => { resizingPointerId.current = null; }}
            className="group absolute inset-y-0 left-0 z-20 w-2 -translate-x-1/2 cursor-col-resize touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"
          >
            <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-blue-400 group-focus-visible:bg-blue-500" />
          </div>
        ) : null}
        <div className="flex h-11 min-w-0 shrink-0 items-center border-b border-slate-200 px-2">
          {personalMode ? (
            <div role="tablist" aria-label="会话侧栏内容" className="flex shrink-0 items-center gap-1">
              {([
                { id: "execution", label: "执行进度", Icon: ListTodo },
                { id: "files", label: "会话文件", Icon: Files },
                { id: "workspace", label: "工作空间", Icon: Folder },
              ] as const).map(({ id, label, Icon }) => (
                <button key={id} type="button" role="tab" aria-label={label} aria-selected={activePrimaryView === id} title={label} onClick={() => selectPrimaryView(id)} className={cn("flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400", activePrimaryView === id ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => selectPrimaryView("summary")} className={cn("shrink-0 rounded-md px-2.5 py-1.5 text-xs", view === "summary" ? "bg-blue-50 font-medium text-blue-700" : "text-slate-500 hover:bg-slate-50")}>摘要</button>
              <button type="button" onClick={() => selectPrimaryView("workspace")} className={cn("shrink-0 rounded-md px-2.5 py-1.5 text-xs", view === "workspace" ? "bg-blue-50 font-medium text-blue-700" : "text-slate-500 hover:bg-slate-50")}>工作空间</button>
            </div>
          )}
          {openFiles.length || workspaceFileTabs.length ? <span aria-hidden="true" className="mx-2 h-5 w-px shrink-0 bg-slate-300" /> : null}
          <div ref={fileTabsRef} aria-label="已打开的文件" className="flex min-w-0 flex-1 touch-pan-x items-stretch gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
            {workspaceFileTabs.length > 0 ? (
              <div className="workspace-preview-tabs workspace-chat__tabs-files" role="tablist" aria-label="已打开的工作空间文件">
                {workspaceFileTabs.map((path) => {
                  const active = path === workspaceActiveFilePath && view === "workspace";
                  const name = entryName(path);
                  return (
                    <div
                      key={path}
                      data-active={active}
                      className={cn("workspace-preview-tab", active && "is-active")}
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={active}
                        title={path}
                        onClick={() => {
                          onViewChange("workspace");
                          filesRef.current?.openTab(path);
                        }}
                      >
                        <FileGlyph path={path} />
                        <span>{name}</span>
                      </button>
                      <button
                        type="button"
                        className="workspace-preview-tab__close"
                        aria-label={`关闭 ${name}`}
                        title="关闭"
                        onClick={() => filesRef.current?.closeFileTab(path)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {openFiles.map((file) => (
              <div key={file.id} data-active={view === "file" && activeFileId === file.id} className={cn("flex max-w-40 shrink-0 items-center gap-1 rounded-md px-2 py-1", view === "file" && activeFileId === file.id ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50")}>
                <button type="button" title={file.name} onClick={() => { setActiveFileId(file.id); onViewChange("file"); }} className="max-w-32 truncate text-xs">{file.name}</button>
                <button type="button" aria-label={`关闭${file.name}`} onClick={() => closeFile(file.id)} className="rounded text-slate-400 hover:text-slate-700"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1 border-l border-slate-200 pl-2">
            <button type="button" aria-label={isFullscreen ? "退出全屏" : "全屏显示"} title={isFullscreen ? "退出全屏" : "全屏显示"} onClick={() => setIsFullscreen((current) => !current)} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
            <button type="button" aria-label="收起会话侧栏" title="收起会话侧栏" onClick={closePanel} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
              <PanelRightClose className="h-4 w-4" />
            </button>
          </div>
        </div>

        {(view === "summary" || view === "execution" || view === "files") ? (
          <div
            ref={summaryContentRef}
            onScroll={personalMode && activePrimaryView === "execution" ? syncCurrentProgressVisibility : undefined}
            onWheel={personalMode && activePrimaryView === "execution" ? markProgressListManuallyScrolled : undefined}
            className={cn(
              "min-h-0 flex-1 p-4",
              activeLayout.fallbackToPanelScroll
                ? "overflow-y-auto"
                : "overflow-hidden",
            )}
          >
            {(showExecution && tasks.length > 0) || (showSessionFiles && (personalMode || outputs.length > 0 || materials.length > 0)) ? (
              <div className="flex flex-col gap-3">
                {personalMode && showExecution ? <h2 className="h-8 shrink-0 px-1 text-sm font-semibold leading-8 text-slate-800">进程</h2> : null}
                {personalMode && showSessionFiles ? (
                  <div className="flex h-8 shrink-0 items-center gap-2 px-1">
                    <h2 className="min-w-0 flex-1 text-sm font-semibold leading-8 text-slate-800">会话文件</h2>
                    <button type="button" aria-label={sessionFileSearchOpen ? "关闭会话文件搜索" : "搜索会话文件"} title={sessionFileSearchOpen ? "关闭搜索" : "搜索文件"} onClick={() => {
                      if (sessionFileSearchOpen) {
                        setSessionFileSearchOpen(false);
                        setSessionFileQuery("");
                      } else {
                        setSessionFileSearchOpen(true);
                      }
                    }} className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400", sessionFileSearchOpen ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")}>
                      {sessionFileSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                    </button>
                  </div>
                ) : null}
                {personalMode && showSessionFiles && sessionFileSearchOpen ? (
                  <label className="flex h-9 shrink-0 items-center gap-2 rounded-md border border-slate-200 px-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
                    <Search className="h-4 w-4 shrink-0 text-slate-400" />
                    <input ref={sessionFileSearchRef} value={sessionFileQuery} onChange={(event) => setSessionFileQuery(event.target.value)} placeholder="搜索文件名称" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400" />
                    {sessionFileQuery ? <button type="button" aria-label="清除搜索词" onClick={() => setSessionFileQuery("")} className="text-slate-400 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button> : null}
                  </label>
                ) : null}
                {showExecution && tasks.length ? (
                  <section className="shrink-0">
                    {!personalMode ? <SummarySectionHeader title="进程" count={tasks.length} expanded={!collapsedSummarySections.tasks} onToggle={() => setCollapsedSummarySections((current) => ({ ...current, tasks: !current.tasks }))} /> : null}
                    {personalMode || !collapsedSummarySections.tasks ? (
                      <>
                        {!personalMode ? <div className="mb-2 rounded-md border border-slate-100 bg-slate-50/70 px-2.5 py-2" aria-live="polite">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            {currentProgressItem?.status === "running" ? <LoaderCircle className="h-3 w-3 animate-spin text-blue-500" /> : currentProgressItem?.status === "done" ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <Circle className="h-3 w-3 text-slate-400" />}
                            <span>{currentProgressItem?.status === "running" ? "当前进行" : currentProgressItem?.status === "done" ? "最近完成" : "待开始"}</span>
                            {taskItems.length ? <span className="ml-auto tabular-nums">{completedTaskCount}/{taskItems.length} 项完成</span> : null}
                            {currentProgressItem ? (
                              <button
                                type="button"
                                aria-label="定位当前进程"
                                title="定位当前进程"
                                onClick={() => {
                                  requestAnimationFrame(() => {
                                    if (currentProgressItem.kind === "subagent") {
                                      setCollapsedSummarySections((current) => ({ ...current, subagents: false }));
                                      subagentListRef.current?.children[currentProgressSubagentIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                                    } else {
                                      setCollapsedSummarySections((current) => ({ ...current, taskList: false }));
                                      taskListRef.current?.children[currentProgressTaskIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                                    }
                                  });
                                }}
                                className="inline-flex h-5 shrink-0 items-center gap-1 rounded px-1 text-[11px] text-blue-600 hover:bg-blue-50"
                              >
                                <LocateFixed className="h-3 w-3" />定位
                              </button>
                            ) : null}
                          </div>
                          <div className="mt-1 truncate text-[13px] font-medium text-slate-700" title={currentProgressItem?.title ?? "暂无进程"}>{currentProgressItem?.title ?? "暂无进程"}</div>
                        </div> : null}
                        {taskItems.length ? (
                          <section className="shrink-0">
                            {personalMode ? (
                              <div className="flex h-8 items-center gap-1">
                                <button type="button" aria-expanded={!collapsedSummarySections.taskList} onClick={() => toggleProgressList("taskList")} className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-1 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                                  {collapsedSummarySections.taskList ? <ChevronRight className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                                  <span className="flex-1 text-sm font-semibold text-slate-800">任务清单</span>
                                  <span className="text-xs text-slate-400 tabular-nums">{completedTaskCount}/{taskItems.length}</span>
                                </button>
                                {currentProgressItem?.kind !== "subagent" && showCurrentProgressLocator ? (
                                  <button type="button" aria-label="定位当前任务" title="定位当前任务" onClick={locateCurrentProgress} className="inline-flex h-7 shrink-0 items-center gap-1 rounded px-1.5 text-[11px] text-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"><LocateFixed className="h-3 w-3" />定位</button>
                                ) : null}
                              </div>
                            ) : <SummarySectionHeader title="任务清单" count={taskItems.length} expanded={!collapsedSummarySections.taskList} onToggle={() => setCollapsedSummarySections((current) => ({ ...current, taskList: !current.taskList }))} />}
                            {!collapsedSummarySections.taskList ? (
                              <div ref={taskListRef} className={cn("overflow-x-hidden", activeLayout.fallbackToPanelScroll ? "overflow-y-visible" : "overflow-y-auto")} style={activeLayout.fallbackToPanelScroll ? undefined : { maxHeight: activeLayout.rows.taskList * SUMMARY_ROW_HEIGHTS.taskList }} aria-label="任务清单" onScroll={personalMode ? syncCurrentProgressVisibility : undefined} onWheel={() => { processListManuallyScrolled.current = true; }} onTouchMove={() => { processListManuallyScrolled.current = true; }} onPointerDown={() => { processListManuallyScrolled.current = true; }}>
                                {taskItems.map((task) => {
                                  const StatusIcon = task.status === "done" ? CheckCircle2 : task.status === "running" ? LoaderCircle : task.status === "failed" ? X : Circle;
                                  const statusClass = task.status === "done" ? "text-emerald-500" : task.status === "running" ? "animate-spin text-blue-500" : task.status === "failed" ? "text-rose-500" : "text-slate-300";
                                  return <div key={task.id} title={task.title} className="flex h-10 items-center gap-2 rounded-md px-2 text-[13px] text-slate-700 hover:bg-slate-50"><StatusIcon className={cn("h-4 w-4 shrink-0", statusClass)} /><span className="min-w-0 flex-1 truncate">{task.title}</span><span className="shrink-0 text-[11px] text-slate-400">{{ done: "已完成", running: "进行中", pending: "待开始", failed: "失败" }[task.status]}</span></div>;
                                })}
                              </div>
                            ) : null}
                          </section>
                        ) : null}
                        {subagentItems.length ? (
                          <section className="shrink-0">
                            {personalMode ? (
                              <div className="flex h-8 items-center gap-1">
                                <button type="button" aria-expanded={!collapsedSummarySections.subagents} onClick={() => toggleProgressList("subagents")} className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-1 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                                  {collapsedSummarySections.subagents ? <ChevronRight className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                                  <span className="flex-1 text-sm font-semibold text-slate-800">子智能体</span>
                                  <span className="text-xs text-slate-400">{subagentItems.length}</span>
                                </button>
                                {currentProgressItem?.kind === "subagent" && showCurrentProgressLocator ? (
                                  <button type="button" aria-label="定位当前子智能体" title="定位当前子智能体" onClick={locateCurrentProgress} className="inline-flex h-7 shrink-0 items-center gap-1 rounded px-1.5 text-[11px] text-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"><LocateFixed className="h-3 w-3" />定位</button>
                                ) : null}
                              </div>
                            ) : <SummarySectionHeader title="子智能体" count={subagentItems.length} expanded={!collapsedSummarySections.subagents} onToggle={() => setCollapsedSummarySections((current) => ({ ...current, subagents: !current.subagents }))} />}
                            {!collapsedSummarySections.subagents ? (
                              <div ref={subagentListRef} className={cn("overflow-x-hidden", activeLayout.fallbackToPanelScroll ? "overflow-y-visible" : "overflow-y-auto")} style={activeLayout.fallbackToPanelScroll ? undefined : { maxHeight: activeLayout.rows.subagents * SUMMARY_ROW_HEIGHTS.subagents }} aria-label="子智能体执行记录" onScroll={personalMode ? syncCurrentProgressVisibility : undefined} onWheel={() => { processListManuallyScrolled.current = true; }} onTouchMove={() => { processListManuallyScrolled.current = true; }} onPointerDown={() => { processListManuallyScrolled.current = true; }}>
                                {sortedSubagentItems.map((task) => {
                                  const recordName = task.title.replace(/^子智能体：/, "");
                                  const recordFile: WorkspaceFile = { id: `subagent-record:${task.id}`, name: recordName, path: `执行进度 / 子智能体执行记录 / ${recordName}`, sizeLabel: "执行详情", subagentTask: task };
                                  const statusClass = task.status === "running" ? "text-blue-600" : task.status === "failed" ? "text-rose-500" : "text-slate-400";
                                  return <button key={task.id} type="button" title={`${recordName} · 点击查看执行记录`} onClick={() => openFile(recordFile)} className="flex h-10 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"><Bot className="h-4 w-4 shrink-0 text-slate-600" /><span className="min-w-0 flex-1 truncate">{recordName}</span><span className={cn("shrink-0 text-[11px]", statusClass)}>{task.status === "running" ? "执行中..." : task.durationLabel ?? "查看记录"}</span><ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" /></button>;
                                })}
                              </div>
                            ) : null}
                          </section>
                        ) : null}
                      </>
                    ) : null}
                  </section>
                ) : null}

                {showSessionFiles && filteredOutputs.length === 0 && filteredMaterials.length === 0 ? (
                  <p className="px-3 py-10 text-center text-sm text-slate-500">{normalizedSessionFileQuery ? "没有找到匹配的文件" : "这次对话上传、引用或生成的文件会出现在这里。"}</p>
                ) : null}

                {showSessionFiles && filteredOutputs.length ? (
                  <section className="shrink-0">
                    <div className="flex h-8 shrink-0 items-center gap-1">
                      <button type="button" aria-expanded={!collapsedSummarySections.outputs} onClick={() => setCollapsedSummarySections((current) => ({ ...current, outputs: !current.outputs }))} className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-1 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                        {collapsedSummarySections.outputs ? <ChevronRight className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                        <span className="flex-1 text-sm font-semibold text-slate-800">产物</span>
                        <span className="text-xs text-slate-400">{filteredOutputs.length}</span>
                      </button>
                    </div>
                    {!collapsedSummarySections.outputs ? (
                      <div
                        className={cn("overflow-x-hidden", activeLayout.fallbackToPanelScroll ? "overflow-y-visible" : "overflow-y-auto")}
                        style={activeLayout.fallbackToPanelScroll ? undefined : { maxHeight: activeLayout.rows.outputs * SUMMARY_ROW_HEIGHTS.outputs }}
                        aria-label="对话产物列表"
                      >
                        {filteredOutputs.map((file) => {
                          const timestamp = formatArtifactTimestamp(file.updatedAt);
                          const isInDraft = context?.attachments.some((item) => item.id === `workspace:${file.id}`);
                          const moreMenuKey = `output:${file.id}`;
                          const moreMenuOpen = openMoreMenuKey === moreMenuKey;
                          return (
                            <div key={file.id} className={cn("group flex h-[60px] w-full shrink-0 items-center gap-1 rounded-md px-2 hover:bg-slate-50", moreMenuOpen && "bg-slate-50")}>
                              <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                              <button type="button" title={file.name} onClick={() => openFile({ id: file.id, name: file.name, path: file.path, sizeLabel: file.size })} className="flex min-w-0 flex-1 items-center text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[13px] text-slate-700">{file.name}</span>
                                  <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                                    {timestamp ? <><time dateTime={timestamp.dateTime} title={timestamp.fullLabel}>{timestamp.label}</time> · </> : null}{file.size}
                                  </span>
                                </span>
                              </button>
                              {isInDraft ? (
                                <span className="inline-flex shrink-0 items-center gap-1 px-1 text-[11px] text-blue-600" title="已加入当前待发送内容"><Check className="h-3.5 w-3.5" />已引用</span>
                              ) : (
                                <button type="button" aria-label={`引用${file.name}`} title="引用" onClick={() => referenceFile({ id: file.id, name: file.name, path: file.path, sizeLabel: file.size })} className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-white hover:text-blue-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400", moreMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100")}><Paperclip className="h-3.5 w-3.5" /></button>
                              )}
                              <DropdownMenu open={moreMenuOpen} onOpenChange={(isOpen) => setOpenMoreMenuKey(isOpen ? moreMenuKey : null)}>
                                <DropdownMenuTrigger asChild>
                                  <button type="button" aria-label={`${file.name}更多操作`} title="更多" className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-white hover:text-slate-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400", moreMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100")}><MoreHorizontal className="h-4 w-4" /></button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" side="bottom" className="w-40">
                                  <DropdownMenuItem onSelect={() => toast.info("当前示例产物暂未提供可下载的源文件")}><Download />下载</DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => locateFile({ id: `output:${file.id}`, name: file.name, path: file.path })}><LocateFixed />定位</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem variant="destructive" onSelect={() => setPendingDeleteOutput(file)}><Trash2 />删除</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {showSessionFiles && filteredMaterials.length ? (
                  <section className="shrink-0">
                    <SummarySectionHeader
                      title="资料"
                      count={filteredMaterials.length}
                      expanded={!collapsedSummarySections.materials}
                      onToggle={() => setCollapsedSummarySections((current) => ({ ...current, materials: !current.materials }))}
                    />
                    {!collapsedSummarySections.materials ? (
                      <div
                        className={cn("overflow-x-hidden", activeLayout.fallbackToPanelScroll ? "overflow-y-visible" : "overflow-y-auto")}
                        style={activeLayout.fallbackToPanelScroll ? undefined : { maxHeight: activeLayout.rows.materials * SUMMARY_ROW_HEIGHTS.materials }}
                        aria-label="对话资料列表"
                      >
                        {filteredMaterials.map((file) => {
                          const workspaceId = file.id.startsWith("workspace:")
                            ? file.id.slice("workspace:".length)
                            : file.id.startsWith("history:workspace:")
                              ? file.id.slice("history:workspace:".length)
                              : "";
                          const workspaceFile = workspaceFiles.find((item) => item.id === workspaceId);
                          const filePath = file.path ?? workspaceFile?.path ?? "工作空间";
                          const isWorkspaceReference = file.source === "workspace";
                          const isInDraft = isWorkspaceReference && context?.attachments.some((item) => item.id === `workspace:${workspaceId}`);
                          const canLocate = isWorkspaceReference || workspaceFiles.some((item) => item.name === file.name);
                          const targetWorkspaceFile = workspaceFile ?? workspaceFiles.find((item) => item.name === file.name);
                          const moreMenuKey = `material:${file.id}`;
                          const moreMenuOpen = openMoreMenuKey === moreMenuKey;
                          return (
                            <div key={file.id} className={cn("group flex h-12 items-center gap-1 rounded-md px-2 hover:bg-slate-50", moreMenuOpen && "bg-slate-50")}>
                              <FileText className="h-4 w-4 shrink-0 text-slate-500" />
                              <button type="button" title={file.name} onClick={() => {
                                openFile({ ...workspaceFile, id: file.id, name: file.name, path: filePath, sizeLabel: file.sizeLabel ?? workspaceFile?.sizeLabel ?? "", file: file.file });
                              }} className="min-w-0 flex-1 text-left">
                                <span className="block truncate text-[13px] text-slate-700">{file.name}</span>
                                <span className="block truncate text-[11px] text-slate-400">{file.source === "upload" ? "上传" : `引用 · ${filePath}`}</span>
                              </button>
                              {personalMode ? (
                                <>
                                  {isWorkspaceReference ? (isInDraft ? (
                                    <span className="inline-flex shrink-0 items-center gap-1 px-1 text-[11px] text-blue-600" title="已加入当前待发送内容"><Check className="h-3.5 w-3.5" />已加入</span>
                                  ) : (
                                    <button type="button" aria-label={`引用${file.name}`} title="引用" onClick={() => referenceFile({ id: workspaceId || file.id, name: file.name, path: filePath, sizeLabel: file.sizeLabel ?? workspaceFile?.sizeLabel ?? "" })} className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-white hover:text-blue-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400", moreMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100")}><Paperclip className="h-3.5 w-3.5" /></button>
                                  )) : null}
                                  <DropdownMenu open={moreMenuOpen} onOpenChange={(isOpen) => setOpenMoreMenuKey(isOpen ? moreMenuKey : null)}>
                                    <DropdownMenuTrigger asChild>
                                      <button type="button" aria-label={`${file.name}更多操作`} title="更多" className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-white hover:text-slate-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400", moreMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100")}><MoreHorizontal className="h-4 w-4" /></button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" side="bottom" className="w-40">
                                      <DropdownMenuItem onSelect={() => {
                                        if (file.file) downloadAttachment(file.file);
                                        else toast.info("当前示例文件暂未提供可下载的源文件");
                                      }}><Download />下载</DropdownMenuItem>
                                      {canLocate && targetWorkspaceFile ? <DropdownMenuItem onSelect={() => locateFile({ id: targetWorkspaceFile.id, name: file.name, path: targetWorkspaceFile.path })}><LocateFixed />定位</DropdownMenuItem> : null}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </>
                              ) : (
                                <>
                                  {file.source === "upload" && file.file ? <button type="button" aria-label={`下载${file.name}`} title="下载" onClick={() => downloadAttachment(file.file!)} className="hidden shrink-0 text-slate-400 hover:text-blue-600 group-hover:block focus-visible:block"><Download className="h-3.5 w-3.5" /></button> : file.source === "workspace" ? <button type="button" aria-label={`在工作空间中定位${file.name}`} title="在工作空间中定位" onClick={() => locateFile(file)} className="hidden shrink-0 text-slate-400 hover:text-blue-600 group-hover:block focus-visible:block"><LocateFixed className="h-3.5 w-3.5" /></button> : null}
                                  {file.id.startsWith("history:") ? null : <button type="button" aria-label={`移除${file.name}`} title="从本次对话移除" onClick={() => context?.removeAttachment(file.id)} className="hidden shrink-0 text-slate-400 hover:text-slate-700 group-hover:block focus-visible:block"><X className="h-3.5 w-3.5" /></button>}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </section>
                ) : null}
              </div>
            ) : (
              <div className="flex h-full min-h-48 flex-col px-5 text-center">
                {personalMode ? <h2 className="-mx-1 h-8 shrink-0 text-left text-sm font-semibold leading-8 text-slate-800">{showExecution ? "进程" : "会话文件"}</h2> : null}
                <p className="my-auto text-sm text-slate-500">{showExecution ? "本次会话暂无执行进度。" : "这次对话上传、引用或生成的文件会出现在这里。"}</p>
              </div>
            )}
          </div>
        ) : null}

        {catalog?.activeSpace ? (
          <div className={cn("flex min-h-0 flex-1 flex-col", view !== "workspace" && "hidden")}>
            <SkillFilesTab
              key={`${catalog.activeSpace.id}-${catalog.rootEpoch}`}
              ref={filesRef}
              files={catalog.activeSpace.files}
              canEdit
              fill
              workspaceLayout
              workspaceRootLabel={catalog.activeSpace.name}
              protectSkillMarkdown={false}
              quoteOnly
              embedTabs
              onTabsChange={handleWorkspaceTabsChange}
              onFilesChange={(files) => catalog.updateFiles(catalog.activeSpace!.id, files)}
              onQuoteFile={(quote) => {
                referenceFile({ id: quote.path, name: quote.name, path: quote.path, sizeLabel: "" });
                return undefined;
              }}
              onLeaveWorkspace={() => {
                router.push(pathname.startsWith("/claw-client") ? "/claw-client?tab=workspace" : "/my-claw/files");
              }}
            />
          </div>
        ) : view === "workspace" ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-sm text-slate-500">
            工作空间尚未加载。
          </div>
        ) : null}

        {view === "file" ? (
          activeFile?.subagentTask ? <SubagentRecordPreview task={activeFile.subagentTask} /> : activeFile ? <FilePreview file={activeFile} /> : <div className="flex flex-1 items-center justify-center text-xs text-slate-400">选择文件以打开预览</div>
        ) : null}
      </aside>
      <Dialog open={Boolean(pendingDeleteOutput)} onOpenChange={(isOpen) => { if (!isOpen) setPendingDeleteOutput(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>删除产物</DialogTitle>
            <DialogDescription>删除「{pendingDeleteOutput?.name}」后，该文件会从本次会话产物和工作空间中同时移除，且无法在此恢复。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" onClick={() => setPendingDeleteOutput(null)} className="h-9 rounded-md border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50">取消</button>
            <button type="button" onClick={confirmDeleteOutput} className="h-9 rounded-md bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700">确认删除</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

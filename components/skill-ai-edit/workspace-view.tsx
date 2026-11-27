"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CircleCheck,
  FileArchive,
  Link2,
  LoaderCircle,
  MessageSquare,
  Paperclip,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { ClawConversationTimeline } from "@/components/claw-hub-next/conversation-timeline";
import type { ConversationTimelineItem } from "@/components/claw-hub-next/detail/utils";
import { cn } from "@/lib/utils";
import {
  CREATE_TIMELINE_ITEMS,
  OPTIMIZE_TIMELINE_ITEMS,
  RESEARCH_OPTIMIZE_TIMELINE_ITEMS,
} from "./claw-mock-flows";
import {
  CREATE_SKILL_FILES,
  CREATE_SKILL_NAME,
  CREATE_SKILL_SAMPLE,
} from "./create-skill-mock";
import { useSkillTimelinePlayback, visibleCreateFiles } from "./create-skill-playback";
import { buildFileTree, FileGlyph } from "./shared";
import { SkillFilesTab } from "./skill-files-tab";
import type { SkillFile, SkillRecord, SkillWorkOrder, WorkOrderType } from "./types";
import { getCurrentManagedVersion } from "./versioning";
import {
  SKILL_EMBEDDED_CLAW_HISTORY_VISIBLE,
  SkillEmbeddedClawHistory,
} from "./skill-embedded-claw-history";
import "@/components/skill-ai-edit/skillAiEdit.css";

interface SkillWorkspaceViewProps {
  mode: WorkOrderType;
  skill?: SkillRecord;
  workOrder?: SkillWorkOrder;
  /** 内嵌 Claw：默认全宽对话；历史侧栏由 SKILL_EMBEDDED_CLAW_HISTORY_VISIBLE 控制 */
  embeddedClawLayout?: boolean;
  onBack: () => void;
  onSaveVersion: (input: {
    mode: WorkOrderType;
    skillId?: string;
    name: string;
    request: string;
    evidence: string[];
    intent?: "default" | "as-new";
    silent?: boolean;
    files?: SkillFile[];
  }) => void;
  /** 创建/修改工作台：注册离开守卫，供外层页签/导航拦截 */
  bindWorkspaceLeaveGuard?: (guard: ((action: () => void) => void) | null) => void;
}
const OPTIMIZATION_ARTIFACTS: SkillFile[] = [
  {
    path: "src/parser.py",
    content: `def looks_like_header(row):
    return any(isinstance(value, str) for value in row)

def positional_columns(row):
    return [f"column_{index + 1}" for index, _ in enumerate(row)]

def read(file):
    first = peek(file)
    header = first if looks_like_header(first) else positional_columns(first)
    return rows(file, header)
`,
  },
  {
    path: "tests/test_headerless.py",
    content: `def test_missing_header():
    result = read_fixture("no_header.csv")
    assert result.columns == ["column_1", "column_2", "column_3"]
`,
  },
  {
    path: "CHANGELOG.md",
    content: `# Changelog

- 增加缺表头输入的健壮性处理
- 增加 headerless fixture 单元测试
`,
  },
];

function isDebugOnlySkillRequest(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;
  return /调试|验证|试运行|只测|不改写|不变更|仅测试|不要改|别改|不改文件/i.test(normalized);
}

function buildSkillZipFileName(skill: SkillRecord): string {
  const currentVersion = getCurrentManagedVersion(skill);
  const tag = skill.savedDraft ? "draft" : currentVersion?.version ?? "draft";
  const base = skill.name.trim() || skill.displayName?.trim() || "skill";
  return `${base}-${tag}.zip`;
}

const RESEARCH_OPTIMIZATION_ARTIFACTS: SkillFile[] = [
  {
    path: "src/citations.py",
    content: `def trace_claim(claim, sections):
    evidence = rank_matching_paragraphs(claim, sections)
    return {
        "claim": claim,
        "page": evidence.page,
        "section": evidence.section,
        "quote": evidence.text,
    }
`,
  },
  {
    path: "tests/test_multi_experiment_trace.py",
    content: `def test_each_claim_has_own_evidence():
    result = extract_fixture("rice_drought_study.pdf")
    assert all(claim["page"] for claim in result["claims"])
    assert len({claim["quote"] for claim in result["claims"]}) == len(result["claims"])
`,
  },
];

export function SkillWorkspaceView({
  mode,
  skill,
  workOrder,
  embeddedClawLayout = false,
  onBack,
  onSaveVersion,
  bindWorkspaceLeaveGuard,
}: SkillWorkspaceViewProps) {
  const baseFiles = (skill ? getCurrentManagedVersion(skill)?.files : undefined) ?? CREATE_SKILL_FILES;
  const isResearchOptimization = mode === "optimize" && skill?.id === "research-evidence-extractor";
  const evidenceOptions = isResearchOptimization
    ? [
        {
          label: "失败运行 TASK-RESEARCH-1042",
          detail:
            "运行状态：结果不一致\n问题：3 条结论共用同一证据片段\n输入：rice_drought_study.pdf\n影响：证据无法按实验追溯",
        },
        {
          label: "论文 rice_drought_study.pdf",
          detail:
            "文件：rice_drought_study.pdf\n页数：12\n实验章节：2\n检测结果：结论与实验段落存在多对一映射",
        },
      ]
    : mode === "create"
      ? [
          {
            label: CREATE_SKILL_SAMPLE,
            detail:
              "文件：genes.gff\n格式：GFF3\n特征数：3（gene / mRNA / CDS）\n检测：本地 Skill 库无 GFF 解析能力\n本体：命中 Object Type · GeneAnnotation",
          },
        ]
      : [
          {
            label: "失败运行 TASK-2087",
            detail:
              "运行状态：失败\n异常：KeyError: gene_id\n定位：src/parser.py:18\n输入：no_header.csv",
          },
          {
            label: "样本 no_header.csv",
            detail:
              "文件：no_header.csv\n记录数：1,284\n列数：3\n检测结果：无表头\n推断字段：gene_id / sample_a / sample_b",
          },
        ];
  const sourceItems =
    mode === "create"
      ? CREATE_TIMELINE_ITEMS
      : isResearchOptimization
        ? RESEARCH_OPTIMIZE_TIMELINE_ITEMS
        : OPTIMIZE_TIMELINE_ITEMS;
  const playback = useSkillTimelinePlayback(sourceItems);
  const skillZipFileName = useMemo(
    () => (mode === "optimize" && skill ? buildSkillZipFileName(skill) : null),
    [mode, skill],
  );
  const generatedFiles = useMemo(() => {
    if (mode === "create") return CREATE_SKILL_FILES;
    if (isResearchOptimization) {
      const merged = [
        ...baseFiles,
        ...RESEARCH_OPTIMIZATION_ARTIFACTS.filter(
          (artifact) => !baseFiles.some((file) => file.path === artifact.path)
        ),
      ];
      return merged.map((file) => ({
        ...file,
        change:
          file.path === "src/evidence.py"
            ? ("modified" as const)
            : file.path === "src/citations.py" ||
                file.path === "tests/test_multi_experiment_trace.py"
              ? ("added" as const)
              : ("unchanged" as const),
      }));
    }
    const optimizationFiles = baseFiles.some((file) => file.path === "src/parser.py")
      ? baseFiles
      : [...baseFiles, ...OPTIMIZATION_ARTIFACTS];
    return optimizationFiles.map((file) => ({
            ...file,
            change:
              file.path === "src/parser.py" || file.path === "CHANGELOG.md"
                ? ("modified" as const)
                : file.path === "tests/test_headerless.py"
                  ? ("added" as const)
                  : ("unchanged" as const),
          }));
  }, [baseFiles, isResearchOptimization, mode]);
  const files = useMemo(() => {
    if (mode === "create") {
      return visibleCreateFiles(generatedFiles, playback.phase === "complete");
    }
    if (playback.phase === "complete") return generatedFiles;
    return baseFiles.map((file) => ({ ...file, change: "unchanged" as const }));
  }, [baseFiles, generatedFiles, mode, playback.phase]);
  const initialFile = files.find((file) => file.change === "modified") ?? files[0];
  const [selectedFilePath, setSelectedFilePath] = useState(initialFile?.path ?? "");
  const timelineScrollerRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [evidence, setEvidence] = useState<string[]>(
    workOrder?.evidence ??
      (mode === "optimize"
        ? evidenceOptions.map((item) => item.label)
        : mode === "create"
          ? [CREATE_SKILL_SAMPLE]
          : [])
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const pendingLeaveActionRef = useRef<(() => void) | null>(null);
  const pendingReplayRef = useRef<HTMLElement | null>(null);
  const [additionalTimelineItems, setAdditionalTimelineItems] = useState<
    ConversationTimelineItem[]
  >([]);
  const [skillPackageUpdated, setSkillPackageUpdated] = useState(false);
  const [chatPlacement] = useState<"left" | "right">("right");
  const [draftFiles, setDraftFiles] = useState<SkillFile[]>(files);
  const timelineItems = [...playback.items, ...additionalTimelineItems];
  const conversationIdle = playback.phase === "idle";
  const conversationReady = playback.phase === "complete";
  const conversationPlaying = playback.isPlaying;
  const showSkillSaveActions =
    skillPackageUpdated && !conversationPlaying && (mode === "create" ? conversationReady : true);
  const workspaceLeaveDirty =
    (mode === "create" || mode === "optimize") && skillPackageUpdated;
  const artifactsAvailable = mode === "optimize" || playback.phase === "complete";
  const showArtifacts = artifactsAvailable && !embeddedClawLayout;
  const fileTree = buildFileTree(files);
  const selectedFile = files.find((file) => file.path === selectedFilePath) ?? files[0];
  const request =
    timelineItems.find((item) => item.type === "user")?.message.content ?? input;
  const draftName = mode === "create" ? CREATE_SKILL_NAME : skill?.name ?? "skill-draft";
  const artifactsTitle =
    mode === "optimize" && playback.phase !== "complete" ? "当前技能文件" : "生成产物预览";
  const artifactsBadge =
    mode === "optimize" && playback.phase !== "complete" ? "当前文件" : "草稿";

  useEffect(() => {
    setDraftFiles(files);
  }, [files]);

  useEffect(() => {
    if (files.length === 0) return;
    if (!files.some((file) => file.path === selectedFilePath)) {
      setSelectedFilePath(files[files.length - 1]!.path);
    }
  }, [files, selectedFilePath]);

  useEffect(() => {
    const node = timelineScrollerRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [timelineItems.length, playback.phase, isGenerating]);

  useEffect(() => {
    if (!workOrder?.request || playback.phase !== "idle") return;
    playback.start(workOrder.request, buildSendAttachments(skillZipFileName, workOrder.evidence));
    // Mounted work orders should start the same playback as a first send.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrder?.request]);

  useEffect(() => {
    if (playback.phase !== "complete") return;
    if (mode === "create") {
      setSkillPackageUpdated(true);
      return;
    }
    if (mode === "optimize") {
      const hasFileChanges = generatedFiles.some(
        (file) => file.change === "modified" || file.change === "added",
      );
      if (hasFileChanges) setSkillPackageUpdated(true);
    }
  }, [generatedFiles, mode, playback.phase]);

  function appendDebugOnlyExchange(request: string, attachments?: string[]) {
    const stamp = Date.now();
    setAdditionalTimelineItems((current) => [
      ...current,
      {
        key: `user-${stamp}`,
        type: "user",
        message: {
          id: `user-${stamp}`,
          role: "user",
          sender: "邸若楠",
          time: "刚刚",
          content: request,
          attachments,
          auditRecords: [],
        },
      },
      {
        key: `thinking-${stamp}`,
        type: "thinking",
        active: false,
        message: {
          id: `thinking-${stamp}`,
          role: "assistant",
          sender: "Claw",
          time: "刚刚",
          content: "Claw 已读取当前技能包，正在按调试要点验证，不改写文件。",
          auditRecords: [],
        },
      },
      {
        key: `skill-${stamp}`,
        type: "action",
        title: "Skill · 调试验证",
        kind: "skill",
        status: "done",
        logs: ["已按样例完成结构校验。", "本轮不变更技能包。"],
        source: "audit",
      },
      {
        key: `output-${stamp}`,
        type: "output",
        message: {
          id: `output-${stamp}`,
          role: "assistant",
          sender: "Claw",
          time: "刚刚",
          content: "调试完成：当前技能包未改写，可继续对话验证。",
          auditRecords: [],
        },
      },
    ]);
  }

  function buildSendAttachments(
    zipName: string | null,
    extra: string[] = evidence,
  ): string[] | undefined {
    const merged = [...(zipName ? [zipName] : []), ...extra.filter((item) => item !== zipName)];
    return merged.length ? merged : undefined;
  }

  function handleSend() {
    const next = input.trim();
    if (!next || isGenerating || conversationPlaying) return;
    const sendAttachments = buildSendAttachments(skillZipFileName);
    const debugOnly = mode === "optimize" && isDebugOnlySkillRequest(next);
    if (conversationIdle) {
      if (debugOnly) {
        appendDebugOnlyExchange(next, sendAttachments);
        setInput("");
        return;
      }
      playback.start(next, sendAttachments);
      setInput("");
      return;
    }
    if (debugOnly) {
      appendDebugOnlyExchange(next, sendAttachments);
      setInput("");
      return;
    }
    const stamp = Date.now();
    setAdditionalTimelineItems((current) => [
      ...current,
      {
        key: `user-${stamp}`,
        type: "user",
        message: {
          id: `user-${stamp}`,
          role: "user",
          sender: "邸若楠",
          time: "刚刚",
          content: next,
          attachments: sendAttachments,
          auditRecords: [],
        },
      },
    ]);
    setInput("");
    setIsGenerating(true);
    window.setTimeout(() => {
      setAdditionalTimelineItems((current) => [
        ...current,
        {
          key: `thinking-${stamp}`,
          type: "thinking",
          active: false,
          message: {
            id: `thinking-${stamp}`,
            role: "assistant",
            sender: "Claw",
            time: "刚刚",
            content: "Claw 已完成上下文读取，正在同步更新当前 Skill 版本产物。",
            auditRecords: [],
          },
        },
        {
          key: `skill-${stamp}`,
          type: "action",
          title: "Skill · 创建 / 修改",
          kind: "skill",
          status: "done",
          logs: ["已应用补充要求。", "技能包文件已更新。"],
          source: "audit",
        },
        {
          key: `output-${stamp}`,
          type: "output",
          message: {
            id: `output-${stamp}`,
            role: "assistant",
            sender: "Claw",
            time: "刚刚",
            content: "我已按修改要求更新当前 Skill 包。关闭对话后会进入该技能的管理页。",
            auditRecords: [],
          },
        },
      ]);
      setSkillPackageUpdated(true);
      setIsGenerating(false);
    }, 700);
  }

  function toggleEvidence(item: string) {
    setEvidence((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item]
    );
  }

  function buildSavePayload() {
    return {
      mode,
      skillId: skill?.id,
      name: draftName,
      request,
      evidence,
    };
  }

  function performSave(options?: { silent?: boolean; skipBusyGuard?: boolean }) {
    if (!skillPackageUpdated) {
      return false;
    }
    if (mode === "create" && !conversationReady) {
      if (!options?.silent) toast.info("技能仍在生成中，请等待完整输出后再保存");
      return false;
    }
    if (!options?.skipBusyGuard && (conversationPlaying || isGenerating)) {
      if (!options?.silent) toast.info("请等待当前对话完成后再保存");
      return false;
    }
    onSaveVersion({
      ...buildSavePayload(),
      intent: "default",
      silent: options?.silent,
      files: draftFiles,
    });
    setSkillPackageUpdated(false);
    return true;
  }

  function handleCloseConversation() {
    if (skillPackageUpdated && (mode !== "create" || conversationReady)) {
      performSave({ silent: true, skipBusyGuard: true });
      return;
    }
    onBack();
  }

  const requestLeave = useCallback(
    (action: () => void) => {
      if (!workspaceLeaveDirty) {
        action();
        return;
      }
      pendingLeaveActionRef.current = action;
      pendingReplayRef.current = null;
      setLeaveOpen(true);
    },
    [workspaceLeaveDirty],
  );

  function resolveLeave(choice: "save" | "save-as-new" | "discard" | "cancel") {
    if (choice === "cancel") {
      pendingLeaveActionRef.current = null;
      pendingReplayRef.current = null;
      setLeaveOpen(false);
      return;
    }
    if (choice === "save") {
      if (!performSave()) return;
      pendingLeaveActionRef.current = null;
      pendingReplayRef.current = null;
      setLeaveOpen(false);
      return;
    }
    setLeaveOpen(false);
    const action = pendingLeaveActionRef.current;
    pendingLeaveActionRef.current = null;
    const replay = pendingReplayRef.current;
    pendingReplayRef.current = null;
    if (action) {
      action();
      return;
    }
    if (replay) replay.click();
  }

  useEffect(() => {
    const guarded =
      (mode === "create" || mode === "optimize") && workspaceLeaveDirty;
    bindWorkspaceLeaveGuard?.(guarded ? requestLeave : null);
    return () => bindWorkspaceLeaveGuard?.(null);
  }, [bindWorkspaceLeaveGuard, mode, requestLeave, workspaceLeaveDirty]);

  useEffect(() => {
    if (!workspaceLeaveDirty) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-workspace-leave-safe]")) return;
      if (target.closest('[data-testid="skillhub-workspace-view"]')) return;
      const clickable = target.closest(
        "button, a, [role='tab'], [role='menuitem']",
      ) as HTMLElement | null;
      if (!clickable) return;
      const shellNav = clickable.closest(
        ".skill-platform-shell__side-item, .skill-platform-shell__nav-item",
      );
      if (!shellNav || !(shellNav instanceof HTMLElement)) return;
      event.preventDefault();
      event.stopPropagation();
      pendingLeaveActionRef.current = null;
      pendingReplayRef.current = shellNav;
      setLeaveOpen(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [workspaceLeaveDirty]);

  return (
    <section
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white"
      data-testid="skillhub-workspace-view"
      data-workspace-leave-safe
      data-workspace-phase={playback.phase}
      data-create-phase={mode === "create" ? playback.phase : undefined}
    >
      <header className="flex shrink-0 flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => requestLeave(onBack)}
            aria-label="返回技能管理"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-400">技能管理 /</span>
              <h1 className="truncate text-base font-semibold text-slate-950">
                {mode === "create" ? "新技能" : skill?.name} · 工作台
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                <Sparkles className="h-3 w-3" />
                复用 Claw
              </span>
            </div>
            {conversationIdle && mode === "create" ? (
              <p className="mt-1 text-xs text-slate-500">
                先在下方描述需求并发送。发送前不会开始检索、装配或生成文件。
              </p>
            ) : conversationIdle && mode === "optimize" ? (
              <p className="mt-1 text-xs text-slate-500">
                {embeddedClawLayout
                  ? skillZipFileName
                    ? `当前技能包 ${skillZipFileName} 已挂入对话。描述修改要求并发送，完整输出后可保存版本。`
                    : "描述修改要求并发送，完整输出后可保存版本。"
                  : skillZipFileName
                    ? `当前技能包 ${skillZipFileName} 已挂入对话。先在右侧描述修改要求再发送。`
                    : "左侧为当前技能文件。先在右侧描述修改要求再发送，完整输出后才会展示改动。"}
              </p>
            ) : !conversationReady ? (
              <p className="mt-1 text-xs text-slate-500">
                Claw 正在执行{mode === "create" ? "创建" : "修改"}链路，完整输出后才会更新产物预览。
              </p>
            ) : evidence.length > 0 ? (
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <Link2 className="h-3 w-3" />
                已挂依据：{evidence.join(" · ")}
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-500">从空起点描述目标，AI 生成确定性的 Skill 版本。</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 pl-11 lg:pl-0">
          {showSkillSaveActions && mode !== "create" ? (
            <>
              {mode === "optimize" ? (
                <span className="text-sm font-medium text-amber-700">skill 有更新</span>
              ) : null}
              <Button
                type="button"
                className="h-9 rounded-[5px] bg-[#2773ff] hover:bg-[#1f66f0]"
                onClick={() => performSave()}
              >
                <CircleCheck className="h-4 w-4" />
                保存
              </Button>
            </>
          ) : null}
        </div>
      </header>

      <div
        className={
          embeddedClawLayout
            ? cn(
                "sdp-ai-split min-h-0 flex-1 overflow-hidden",
                chatPlacement === "left" && "sdp-ai-split--chat-left",
              )
            : "flex min-h-0 flex-1 overflow-hidden"
        }
      >
        {!embeddedClawLayout && SKILL_EMBEDDED_CLAW_HISTORY_VISIBLE ? (
          <SkillEmbeddedClawHistory mode={mode} skillName={skill?.name} />
        ) : null}
        {embeddedClawLayout ? (
          <div className="sdp-ai-files-pane">
            <SkillFilesTab
              files={draftFiles}
              canEdit={!conversationPlaying && !isGenerating && draftFiles.length > 0}
              fill
              workspaceLayout={chatPlacement === "left"}
              workspaceTabsLayout={chatPlacement === "left"}
              hideEditorActions={mode === "create" && chatPlacement === "right"}
              workspaceRootLabel={draftName}
              onFilesChange={setDraftFiles}
              aiSessionView={conversationPlaying || isGenerating ? "preview" : null}
              aiEditOpen={conversationPlaying || isGenerating}
            />
          </div>
        ) : showArtifacts ? (
        <div
          className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden border-r border-slate-200 bg-slate-50/50"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
            <div className="text-sm font-semibold text-slate-800">{artifactsTitle}</div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
              {artifactsBadge}
            </span>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-[190px_minmax(0,1fr)] overflow-hidden">
            <div className="min-h-0 overflow-y-auto border-r border-slate-200 bg-white p-3">
              <div className="space-y-1">
                {fileTree.rootFiles.map((path) => (
                  <FileTreeButton
                    key={path}
                    path={path}
                    active={selectedFilePath === path}
                    onClick={() => setSelectedFilePath(path)}
                  />
                ))}
                {fileTree.folders.map(([folder, children]) => (
                  <div key={folder}>
                    <div className="flex h-8 items-center gap-2 px-2 text-xs font-medium text-slate-600">
                      <FileGlyph path={folder} open />
                      {folder}
                    </div>
                    <div className="ml-3 border-l border-slate-200 pl-2">
                      {children.map((path) => (
                        <FileTreeButton
                          key={path}
                          path={path}
                          label={path.slice(path.indexOf("/") + 1)}
                          active={selectedFilePath === path}
                          onClick={() => setSelectedFilePath(path)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden p-4">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="font-mono text-xs text-slate-600">{selectedFile?.path}</span>
                  <span className="text-xs text-slate-400">
                    {selectedFile?.change === "added"
                      ? "新增"
                      : selectedFile?.change === "modified"
                        ? "diff 视图"
                        : "预览"}
                  </span>
                </div>
                {selectedFile?.path === "src/parser.py" &&
                mode === "optimize" &&
                playback.phase === "complete" ? (
                  <div className="min-h-0 flex-1 overflow-auto font-mono text-xs leading-6">
                    <div className="px-4 pt-3 text-slate-500">def read(file):</div>
                    <div className="bg-rose-50 px-4 text-rose-700">- header = next(file)</div>
                    <div className="bg-emerald-50 px-4 text-emerald-700">+ first = peek(file)</div>
                    <div className="bg-emerald-50 px-4 text-emerald-700">
                      + header = first if looks_like_header(first)
                    </div>
                    <div className="bg-emerald-50 px-4 text-emerald-700">
                      + else positional_columns(first)
                    </div>
                    <div className="px-4 pb-3 text-slate-500">return rows(file, header)</div>
                  </div>
                ) : (
                  <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-6 text-slate-700">
                    {selectedFile?.content}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
        ) : null}

        <div
          className={
            embeddedClawLayout
              ? cn(
                  "sdp-ai-edit-pane flex min-h-0 shrink-0 flex-col overflow-hidden border-slate-200",
                  chatPlacement === "left" ? "border-r" : "border-l",
                )
              : "flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden"
          }
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800">
              <MessageSquare className="h-4 w-4 text-[#2773ff]" />
              对话
            </div>
            {mode === "create" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleCloseConversation}
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          <div
            ref={timelineScrollerRef}
            className="h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain"
          >
            <div className="space-y-4 p-5">
              {!conversationIdle || additionalTimelineItems.length > 0 ? (
                <ClawConversationTimeline items={timelineItems} />
              ) : null}
              {isGenerating ? (
                <div className="flex max-w-[86%] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-500">
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#2773ff]" />
                  Claw 正在更新产物…
                </div>
              ) : null}
            </div>
          </div>
          <div className="shrink-0 border-t border-slate-200 bg-white p-4">
            <div className="rounded-lg border border-slate-200 bg-white focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
              {skillZipFileName && conversationIdle && mode === "optimize" ? (
                <div className="flex flex-wrap gap-2 border-b border-slate-100 px-3 pt-3">
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-2.5 py-1 text-xs font-medium text-blue-800">
                    <FileArchive className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                    <span className="truncate">{skillZipFileName}</span>
                  </span>
                </div>
              ) : null}
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  conversationPlaying
                    ? `Claw 正在按完整链路${mode === "create" ? "创建" : "修改"}技能…`
                    : conversationIdle && mode === "create"
                      ? "例如：上传了 genes.gff，本地还没有这种格式的解析技能…"
                      : conversationIdle && mode === "optimize"
                        ? "技能 zip 已挂载。描述修改要求，例如：对缺表头的文件按位置推断列…"
                        : "补充创建 / 修改要求，例如：再加一条缺 type 列的异常用例…"
                }
                disabled={conversationPlaying}
                className="min-h-24 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <div className="flex flex-col gap-2 px-3 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-slate-500"
                    onClick={() => setEvidenceDialogOpen(true)}
                  >
                    <Paperclip className="h-4 w-4" />
                    挂载依据
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 bg-[#2773ff]"
                    disabled={!input.trim() || isGenerating || conversationPlaying}
                    onClick={handleSend}
                  >
                    <Send className="h-3.5 w-3.5" />
                    发送
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={leaveOpen}
        onOpenChange={(open) => {
          if (!open) resolveLeave("cancel");
        }}
      >
        <DialogContent className="sm:max-w-[480px]" data-workspace-leave-safe showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "创建尚未保存" : "修改尚未保存"}</DialogTitle>
            <DialogDescription className="leading-6">
              {mode === "create"
                ? "当前 AI 创建的技能尚未保存。要离开当前页吗？可选择保存到技能列表，或不保存直接离开。"
                : "当前 AI 修改尚未写回技能。离开前可保存到当前技能，或不保存直接离开。"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-wrap gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-[5px]"
              onClick={() => resolveLeave("cancel")}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-[5px]"
              onClick={() => resolveLeave("discard")}
            >
              不保存
            </Button>
            {skillPackageUpdated ? (
              <Button
                type="button"
                className="rounded-[5px] bg-[#2773ff] hover:bg-[#1f66f0]"
                disabled={conversationPlaying || isGenerating}
                onClick={() => resolveLeave("save")}
              >
                保存
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>挂载优化依据</DialogTitle>
            <DialogDescription>
              依据会作为 Claw 对话上下文，并与本次修改保持可追溯关联。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {evidenceOptions.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3"
              >
                <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                  <Checkbox
                    checked={evidence.includes(item.label)}
                    onCheckedChange={() => toggleEvidence(item.label)}
                  />
                  {item.label}
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[#2773ff]"
                  onClick={() => setEvidencePreview(item.detail)}
                >
                  查看依据
                </Button>
              </div>
            ))}
            {evidencePreview ? (
              <pre className="whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-700">
                {evidencePreview}
              </pre>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function FileTreeButton({
  path,
  label,
  active,
  onClick,
}: {
  path: string;
  label?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded px-2 text-left text-xs transition-colors",
        active ? "bg-blue-50 text-[#2773ff]" : "text-slate-600 hover:bg-slate-50"
      )}
    >
      <FileGlyph path={path} />
      <span className="min-w-0 flex-1 truncate">{label ?? path}</span>
    </button>
  );
}

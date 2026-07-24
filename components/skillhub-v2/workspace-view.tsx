"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CircleCheck,
  FileWarning,
  Link2,
  LoaderCircle,
  MessageSquare,
  Paperclip,
  Play,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ClawConversationTimeline } from "@/components/claw-hub-next/conversation-timeline";
import type { ConversationTimelineItem } from "@/components/claw-hub-next/detail/utils";
import { cn } from "@/lib/utils";
import {
  CREATE_TIMELINE_ITEMS,
  OPTIMIZE_TIMELINE_ITEMS,
  RESEARCH_OPTIMIZE_TIMELINE_ITEMS,
} from "./claw-mock-flows";
import { buildFileTree, FileGlyph } from "./shared";
import type { SkillFile, SkillRecord, SkillWorkOrder, WorkOrderType } from "./types";

interface SkillWorkspaceViewProps {
  mode: WorkOrderType;
  skill?: SkillRecord;
  workOrder?: SkillWorkOrder;
  onBack: () => void;
  onSaveVersion: (input: {
    mode: WorkOrderType;
    skillId?: string;
    name: string;
    request: string;
    evidence: string[];
  }) => void;
}

const CREATE_FILES: SkillFile[] = [
  {
    path: "SKILL.md",
    content: `---
name: rice-rna-analysis
description: 分析水稻 RNA 表达矩阵并输出质控与差异摘要。
---

# Inputs
- expression matrix
- sample metadata

# Outputs
- QC summary
- differential expression brief
`,
    change: "added",
  },
  {
    path: "skill.json",
    content: `{
  "name": "rice-rna-analysis",
  "entry": "src/main.py",
  "runtime": "python3.11",
  "qualityGate": null
}`,
    change: "added",
  },
  {
    path: "src/main.py",
    content: `from analysis import run_qc

def run(expression, metadata):
    return run_qc(expression, metadata)
`,
    change: "added",
  },
  {
    path: "src/analysis.py",
    content: `import pandas as pd

def run_qc(expression, metadata):
    matrix = pd.read_csv(expression)
    return {"samples": len(matrix.columns), "status": "ready"}
`,
    change: "added",
  },
  {
    path: "tests/test_expression.py",
    content: `def test_expression_fixture():
    result = run("samples/rice_expression.csv", "samples/groups.csv")
    assert result["status"] == "ready"
`,
    change: "added",
  },
];

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
  onBack,
  onSaveVersion,
}: SkillWorkspaceViewProps) {
  const baseFiles = skill?.versions[0]?.files ?? CREATE_FILES;
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
  const files = useMemo(() => {
    if (mode === "create") return CREATE_FILES;
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
  const initialFile = files.find((file) => file.change === "modified") ?? files[0];
  const [selectedFilePath, setSelectedFilePath] = useState(initialFile?.path ?? "");
  const [input, setInput] = useState("");
  const [evidence, setEvidence] = useState<string[]>(
    workOrder?.evidence ??
      (mode === "optimize" ? evidenceOptions.map((item) => item.label) : [])
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const baseTimelineItems = (() => {
    const items =
      mode === "create"
        ? CREATE_TIMELINE_ITEMS
        : isResearchOptimization
          ? RESEARCH_OPTIMIZE_TIMELINE_ITEMS
          : OPTIMIZE_TIMELINE_ITEMS;
    if (!workOrder?.request) return items;
    return items.map((item) =>
      item.type === "user"
        ? {
            ...item,
            message: { ...item.message, content: workOrder.request },
          }
        : item
    );
  })();
  const [additionalTimelineItems, setAdditionalTimelineItems] = useState<
    ConversationTimelineItem[]
  >([]);
  const timelineItems = [...baseTimelineItems, ...additionalTimelineItems];
  const fileTree = buildFileTree(files);
  const selectedFile = files.find((file) => file.path === selectedFilePath) ?? files[0];
  const request =
    timelineItems.find((item) => item.type === "user")?.message.content ?? input;
  const draftName = mode === "create" ? "rice-rna-analysis" : skill?.name ?? "skill-draft";

  function handleSend() {
    const next = input.trim();
    if (!next || isGenerating) return;
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
          title: mode === "create" ? "Skill · create skill" : "Skill · 优化当前版本",
          kind: "skill",
          status: "done",
          logs: ["已应用补充要求。", "右侧文件预览已同步。"],
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
            content:
              mode === "create"
                ? "我补充了输入样例校验与输出契约，现在可以保存草稿并进入 AI 试运行。"
                : "我补充了异常分支与回归测试，改动会作为同一 Skill ID 下的新版本草稿保存。",
            auditRecords: [],
          },
        },
      ]);
      setIsGenerating(false);
    }, 700);
  }

  function toggleEvidence(item: string) {
    setEvidence((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item]
    );
  }

  return (
    <section
      className="flex min-h-[calc(100vh-132px)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white"
      data-testid="skillhub-workspace-view"
    >
      <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onBack}
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
            {evidence.length > 0 ? (
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
          <div className="inline-flex rounded-md bg-slate-100 p-1">
            <span
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium",
                mode === "create" ? "bg-white text-[#2773ff] shadow-sm" : "text-slate-400"
              )}
            >
              创建
            </span>
            <span
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium",
                mode === "optimize" ? "bg-[#2773ff] text-white shadow-sm" : "text-slate-400"
              )}
            >
              优化
            </span>
          </div>
          <Button
            type="button"
            className="h-9 rounded-[5px] bg-[#2773ff] hover:bg-[#1f66f0]"
            onClick={() =>
              onSaveVersion({
                mode,
                skillId: skill?.id,
                name: draftName,
                request,
                evidence,
              })
            }
          >
            <CircleCheck className="h-4 w-4" />
            {mode === "create" ? "保存为 v1.0 草稿" : "另存为新版本"}
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(360px,1fr)_minmax(420px,1.05fr)]">
        <div className="flex min-h-[560px] flex-col border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <MessageSquare className="h-4 w-4 text-[#2773ff]" />
              对话
            </div>
            <div className="flex items-center gap-1.5">
              {mode === "optimize" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEvidencePreview(evidenceOptions[0].detail);
                      setEvidenceDialogOpen(true);
                    }}
                    className={cn(
                      "rounded-full border px-2 py-1 text-[11px]",
                      evidence.includes(evidenceOptions[0].label)
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-500"
                    )}
                  >
                    <FileWarning className="mr-1 inline h-3 w-3" />
                    失败运行
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEvidencePreview(evidenceOptions[1].detail);
                      setEvidenceDialogOpen(true);
                    }}
                    className={cn(
                      "rounded-full border px-2 py-1 text-[11px]",
                      evidence.includes(evidenceOptions[1].label)
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-500"
                    )}
                  >
                    <Paperclip className="mr-1 inline h-3 w-3" />
                    {isResearchOptimization ? "论文样本" : "样本"}
                  </button>
                </>
              ) : null}
            </div>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-4 p-5">
              <ClawConversationTimeline items={timelineItems} />
              {isGenerating ? (
                <div className="flex max-w-[86%] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-500">
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#2773ff]" />
                  Claw 正在更新产物…
                </div>
              ) : null}
            </div>
          </ScrollArea>
          <div className="border-t border-slate-200 p-4">
            <div className="rounded-lg border border-slate-200 bg-white focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={mode === "create" ? "描述你想创建的技能…" : "继续说明要优化的地方…"}
                className="min-h-24 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <div className="flex items-center justify-between px-3 pb-3">
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
                  disabled={!input.trim() || isGenerating}
                  onClick={handleSend}
                >
                  <Send className="h-3.5 w-3.5" />
                  发送
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-[560px] flex-col bg-slate-50/50">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
            <div className="text-sm font-semibold text-slate-800">生成产物预览</div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
              新版本草稿
            </span>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-[190px_minmax(0,1fr)]">
            <div className="border-r border-slate-200 bg-white p-3">
              <div className="space-y-1">
                {fileTree.rootFiles.map((path) => (
                  <FileTreeButton
                    key={path}
                    path={path}
                    active={selectedFilePath === path}
                    change={files.find((file) => file.path === path)?.change}
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
                          change={files.find((file) => file.path === path)?.change}
                          onClick={() => setSelectedFilePath(path)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="min-w-0 p-4">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="font-mono text-xs text-slate-600">{selectedFile?.path}</span>
                  <span className="text-xs text-slate-400">
                    {selectedFile?.change === "added"
                      ? "新增"
                      : selectedFile?.change === "modified"
                        ? "diff 视图"
                        : "预览"}
                  </span>
                </div>
                {selectedFile?.path === "src/parser.py" && mode === "optimize" ? (
                  <div className="font-mono text-xs leading-6">
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
                  <pre className="max-h-[470px] overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-6 text-slate-700">
                    {selectedFile?.content}
                  </pre>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-blue-700">
                <Play className="h-3.5 w-3.5" />
                保存版本后进入 AI 试运行：静态扫描 + 沙箱运行 + 锁定依赖。
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>挂载优化依据</DialogTitle>
            <DialogDescription>
              依据会作为 Claw 对话上下文，并与本次新版本保持可追溯关联。
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
  change,
  onClick,
}: {
  path: string;
  label?: string;
  active: boolean;
  change?: "added" | "modified" | "unchanged";
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
      {change === "added" ? (
        <span className="font-semibold text-emerald-600">+</span>
      ) : change === "modified" ? (
        <span className="font-semibold text-amber-600">±</span>
      ) : null}
    </button>
  );
}

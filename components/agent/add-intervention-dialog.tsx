"use client";

import { useEffect, useRef, useState } from "react";
import {
  Cloud,
  Download,
  Info,
  Library,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AddMode = "manual" | "local" | "library";

export interface InterventionDraft {
  status: "enabled" | "disabled";
  question: string;
  answer: string;
  updatedAt: string;
}

export interface QaLibraryItem {
  id: string;
  name: string;
  pairCount: number;
  creator: string;
  updatedAt: string;
  pairs: { question: string; answer: string }[];
}

export const MOCK_QA_LIBRARIES: QaLibraryItem[] = [
  {
    id: "qa-lib-001",
    name: "产品 FAQ 问答库",
    pairCount: 3,
    creator: "张明",
    updatedAt: "2026-03-12 14:20",
    pairs: [
      {
        question: "如何开通产品试用？",
        answer: "进入控制台点击「立即试用」，填写企业信息后即可开通 14 天试用。",
      },
      {
        question: "支持哪些登录方式？",
        answer: "支持账号密码、短信验证码以及企业 SSO 登录。",
      },
      {
        question: "如何联系技术支持？",
        answer: "可在控制台右上角「帮助中心」提交工单，或拨打 400 服务热线。",
      },
    ],
  },
  {
    id: "qa-lib-002",
    name: "安全合规问答库",
    pairCount: 2,
    creator: "李华",
    updatedAt: "2026-02-28 09:10",
    pairs: [
      {
        question: "数据是否加密存储？",
        answer: "静态数据采用 AES-256 加密，传输层启用 TLS 1.2+。",
      },
      {
        question: "是否支持等保合规？",
        answer: "平台已通过等保三级测评，可提供合规证明材料。",
      },
    ],
  },
  {
    id: "qa-lib-003",
    name: "运维排障问答库",
    pairCount: 2,
    creator: "王芳",
    updatedAt: "2026-01-18 16:45",
    pairs: [
      {
        question: "服务异常如何排查？",
        answer: "先查看监控告警与最近发布记录，再核对依赖服务健康状态。",
      },
      {
        question: "如何回滚版本？",
        answer: "在发布管理中选择目标历史版本，确认后执行一键回滚。",
      },
    ],
  },
  {
    id: "qa-lib-004",
    name: "开源情报基础问答",
    pairCount: 2,
    creator: "赵强",
    updatedAt: "2025-12-05 11:30",
    pairs: [
      {
        question: "什么是 OSINT？",
        answer:
          "OSINT 是开源情报，指从公开可获取信息源中收集、分析并利用情报的方法。",
      },
      {
        question: "常见 OSINT 数据源有哪些？",
        answer: "包括新闻网站、社交媒体、公开数据库、政府公开信息与学术文献等。",
      },
    ],
  },
];

interface AddInterventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (items: InterventionDraft[]) => void;
}

function parseQaCsv(text: string): { question: string; answer: string }[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const startIndex =
    /问题|question/i.test(lines[0]) && /回答|answer/i.test(lines[0]) ? 1 : 0;

  const pairs: { question: string; answer: string }[] = [];
  for (let i = startIndex; i < lines.length; i += 1) {
    const line = lines[i];
    const commaIndex = line.indexOf(",");
    if (commaIndex === -1) continue;
    const question = line.slice(0, commaIndex).trim().replace(/^"|"$/g, "");
    const answer = line.slice(commaIndex + 1).trim().replace(/^"|"$/g, "");
    if (question && answer) {
      pairs.push({ question, answer });
    }
  }
  return pairs;
}

function todayLabel() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function AddInterventionDialog({
  open,
  onOpenChange,
  onAdd,
}: AddInterventionDialogProps) {
  const [mode, setMode] = useState<AddMode>("manual");
  const [showTip, setShowTip] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setMode("manual");
    setShowTip(true);
    setQuestion("");
    setAnswer("");
    setSelectedFile(null);
    setDragActive(false);
    setLibraryPickerOpen(false);
  }, [open]);

  const handleDownloadTemplate = () => {
    const template =
      "问题,回答\n什么是开源情报?,开源情报是指从公开可获取信息源中收集与分析情报的方法。\n";
    const blob = new Blob([`\uFEFF${template}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = "问答对导入模板.csv";
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".csv") && !lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
      toast.error("仅支持 CSV、XLSX 格式文件");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("文件大小不能超过 10MB");
      return;
    }
    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleConfirmManual = () => {
    const q = question.trim();
    const a = answer.trim();
    if (!q) {
      toast.error("请输入问题");
      return;
    }
    if (!a) {
      toast.error("请输入回答");
      return;
    }
    onAdd([
      {
        status: "enabled",
        question: q,
        answer: a,
        updatedAt: todayLabel(),
      },
    ]);
    toast.success("已添加问答对");
    onOpenChange(false);
  };

  const handleConfirmLocal = async () => {
    if (!selectedFile) {
      toast.error("请先选择要导入的文件");
      return;
    }
    const name = selectedFile.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      toast.error("当前原型仅支持解析 CSV，请下载模板后另存为 CSV 再导入");
      return;
    }
    try {
      const text = await selectedFile.text();
      const pairs = parseQaCsv(text);
      if (pairs.length === 0) {
        toast.error("未解析到有效问答对，请检查模板格式");
        return;
      }
      onAdd(
        pairs.map((pair) => ({
          status: "enabled" as const,
          question: pair.question.slice(0, 200),
          answer: pair.answer.slice(0, 2000),
          updatedAt: todayLabel(),
        }))
      );
      toast.success(`已导入 ${pairs.length} 条问答对`);
      onOpenChange(false);
    } catch {
      toast.error("文件读取失败，请重试");
    }
  };

  const handleConfirm = () => {
    if (mode === "manual") handleConfirmManual();
    else if (mode === "local") void handleConfirmLocal();
  };

  const handleLibraryPickerConfirm = (ids: Set<string>) => {
    const libs = MOCK_QA_LIBRARIES.filter((lib) => ids.has(lib.id));
    if (libs.length === 0) {
      toast.error("请至少添加一个问答库");
      return;
    }
    const items = libs.flatMap((lib) =>
      lib.pairs.map((pair) => ({
        status: "enabled" as const,
        question: pair.question,
        answer: pair.answer,
        updatedAt: todayLabel(),
      }))
    );
    onAdd(items);
    toast.success(`已从 ${libs.length} 个问答库导入 ${items.length} 条问答对`);
    setLibraryPickerOpen(false);
    onOpenChange(false);
  };

  const canSubmit =
    mode === "manual"
      ? question.trim().length > 0 && answer.trim().length > 0
      : mode === "local"
        ? Boolean(selectedFile)
        : false;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[640px]">
          <DialogHeader className="border-b border-slate-100 px-6 py-4">
            <DialogTitle className="text-base font-semibold text-slate-900">
              添加问答对
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            {showTip ? (
              <div className="flex items-start gap-2 rounded-md border border-[#d6e6ff] bg-[#eef5ff] px-3 py-2.5 text-sm text-slate-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2773ff]" />
                <p className="flex-1 leading-5">
                  通过手动输入或批量导入添加的问答对，将会自动处理为「已启用」状态
                </p>
                <button
                  type="button"
                  className="rounded p-0.5 text-slate-400 hover:bg-white/70 hover:text-slate-600"
                  onClick={() => setShowTip(false)}
                  aria-label="关闭提示"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}

            <div className="border-b border-slate-200">
              <div className="flex gap-6">
                {(
                  [
                    { id: "manual", label: "手动输入" },
                    { id: "local", label: "本地导入" },
                    { id: "library", label: "问答库导入" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMode(tab.id)}
                    className={cn(
                      "relative pb-2.5 text-sm transition-colors",
                      mode === tab.id
                        ? "font-medium text-[#2773ff]"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {tab.label}
                    {mode === tab.id ? (
                      <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#2773ff]" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            {mode === "manual" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-slate-700">
                    <span className="mr-0.5 text-red-500">*</span>
                    问题：
                  </Label>
                  <div className="relative">
                    <Textarea
                      value={question}
                      maxLength={200}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="请输入问题"
                      className="min-h-[96px] resize-none pb-7"
                    />
                    <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-slate-400">
                      {question.length}/200
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-slate-700">
                    <span className="mr-0.5 text-red-500">*</span>
                    回答：
                  </Label>
                  <div className="relative">
                    <Textarea
                      value={answer}
                      maxLength={2000}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="请输入回答"
                      className="min-h-[160px] resize-none pb-7"
                    />
                    <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-slate-400">
                      {answer.length}/2000
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {mode === "local" ? (
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  下载模板
                </Button>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                    dragActive
                      ? "border-[#2773ff] bg-blue-50"
                      : "border-slate-300 bg-slate-50 hover:border-slate-400"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) =>
                      handleFileSelect(e.target.files?.[0] ?? null)
                    }
                  />
                  <Cloud className="mx-auto mb-4 h-12 w-12 text-[#2773ff]" />
                  <p className="mb-2 text-sm text-slate-600">
                    拖拽文件到此处或
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="ml-1 text-[#2773ff] hover:underline"
                    >
                      点击上传
                    </button>
                  </p>
                  <p className="text-xs text-slate-400">
                    支持 CSV、XLSX 格式，文件大小不超过 10MB
                  </p>
                  {selectedFile ? (
                    <div className="mt-4 flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2">
                      <span className="truncate text-sm text-slate-700">
                        {selectedFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="ml-2 text-slate-400 hover:text-slate-600"
                        aria-label="移除文件"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {mode === "library" ? (
              <div className="space-y-4 py-6">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <Library className="mx-auto mb-3 h-10 w-10 text-[#2773ff]" />
                  <div className="text-sm font-medium text-slate-800">
                    从问答库导入
                  </div>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                    点击下方按钮选择一个或多个问答库，确认后将其中全部问答对导入到当前干预列表
                  </p>
                  <Button
                    type="button"
                    className="mt-5 bg-[#2773ff] hover:bg-[#1f63e0]"
                    onClick={() => setLibraryPickerOpen(true)}
                  >
                    选择问答库
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter className="border-t border-slate-100 px-6 py-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            {mode !== "library" ? (
              <Button
                onClick={handleConfirm}
                disabled={!canSubmit}
                className="bg-[#2773ff] hover:bg-[#1f63e0]"
              >
                确定
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QaLibraryPickerDialog
        open={libraryPickerOpen}
        onOpenChange={setLibraryPickerOpen}
        onConfirm={handleLibraryPickerConfirm}
      />
    </>
  );
}

function QaLibraryPickerDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (ids: Set<string>) => void;
}) {
  const [draftIds, setDraftIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (open) {
      setDraftIds(new Set());
    }
  }, [open]);

  const handleToggle = (id: string, nextSelected: boolean) => {
    setDraftIds((prev) => {
      const next = new Set(prev);
      if (nextSelected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[860px]">
        <DialogHeader className="border-b border-slate-100 px-6 py-4">
          <DialogTitle className="text-base font-semibold text-slate-900">
            选择问答库
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="mb-3 text-xs text-slate-500">
            已选择 {draftIds.size} 个问答库
          </div>
          <div className="max-h-[420px] overflow-auto rounded-md border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="min-w-[160px]">问答库名称</TableHead>
                  <TableHead className="min-w-[120px]">问答库ID</TableHead>
                  <TableHead className="w-[100px]">问答对数量</TableHead>
                  <TableHead className="w-[90px]">创建人</TableHead>
                  <TableHead className="min-w-[140px]">更新时间</TableHead>
                  <TableHead className="w-[140px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_QA_LIBRARIES.map((lib) => {
                  const added = draftIds.has(lib.id);
                  return (
                    <TableRow key={lib.id}>
                      <TableCell className="font-medium text-slate-800">
                        {lib.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {lib.id}
                      </TableCell>
                      <TableCell>{lib.pairCount}</TableCell>
                      <TableCell>{lib.creator}</TableCell>
                      <TableCell className="text-slate-600">
                        {lib.updatedAt}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center justify-end gap-3">
                          <button
                            type="button"
                            className="text-sm text-[#2773ff] hover:underline"
                          >
                            查看
                          </button>
                          {added ? (
                            <button
                              type="button"
                              className="text-sm text-slate-500 hover:text-red-600"
                              onClick={() => handleToggle(lib.id, false)}
                            >
                              移除
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="text-sm text-[#2773ff] hover:underline"
                              onClick={() => handleToggle(lib.id, true)}
                            >
                              添加
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            className="bg-[#2773ff] hover:bg-[#1f63e0]"
            disabled={draftIds.size === 0}
            onClick={() => onConfirm(new Set(draftIds))}
          >
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

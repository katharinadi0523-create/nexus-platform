"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import JSZip from "jszip";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Boxes, BriefcaseBusiness, ChartNoAxesCombined, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Download, Ellipsis, FileArchive, FileText, Grid2X2, List, MessageSquareText, Pencil, RefreshCw, Search, Settings2, Sparkles, Trash2, Upload, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { SkillsPage } from "@/components/skills/skills-page";
import { SkillDetailDialogShell } from "@/components/skills/skill-detail-dialog-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ConfirmDiscardDialog, DISCARD_CONFIRMATION_DESCRIPTION } from "@/components/ui/confirm-discard-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  filterMineSkills,
  getMineSkillOriginLabel,
  INITIAL_MINE_SKILLS,
  MINE_SKILL_ORIGIN_TABS,
  type MineSkillItem,
  type MineSkillOriginFilter,
} from "@/lib/mock/my-claw/skills-mine";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMyClaw } from "@/components/my-claw/provider";
import { queueWorkspaceChatBootstrap, type SkillEditChatContext } from "@/components/workspace-1/workspaceChatBridge";
import { readPersonalSkills, readPersonalSkillOverrides, writePersonalSkills } from "@/lib/mock/my-claw/personal-skills-storage";

type ImportedPersonalSkill = MineSkillItem & { version: string; files: string[]; skillMdContent: string };
const USER_VISIBLE_INITIAL_SKILLS = INITIAL_MINE_SKILLS.filter((skill) => skill.publisherScope !== "system");

function getSkillCardVisual(skill: MineSkillItem): { Icon: LucideIcon; tileClass: string; iconClass: string } {
  const text = `${skill.name} ${skill.description} ${skill.scene ?? ""}`;
  const name = skill.name;
  if (/写作|公文|文档|邮件/.test(name)) {
    return { Icon: FileText, tileClass: "bg-blue-50", iconClass: "text-blue-600" };
  }
  if (/差旅|报销|费用|票据/.test(name)) {
    return { Icon: BriefcaseBusiness, tileClass: "bg-amber-50", iconClass: "text-amber-600" };
  }
  if (/经营|运营|数据|指标|生产|分析|报表|复盘/.test(name)) {
    return { Icon: ChartNoAxesCombined, tileClass: "bg-emerald-50", iconClass: "text-emerald-600" };
  }
  if (/制度|流程|核对|检查|清单/.test(name)) {
    return { Icon: ClipboardList, tileClass: "bg-cyan-50", iconClass: "text-cyan-600" };
  }
  if (/会议|沟通|通知|纪要/.test(name)) {
    return { Icon: MessageSquareText, tileClass: "bg-violet-50", iconClass: "text-violet-600" };
  }
  if (/差旅|报销|费用|票据/.test(text)) {
    return { Icon: BriefcaseBusiness, tileClass: "bg-amber-50", iconClass: "text-amber-600" };
  }
  if (/经营|运营|数据|指标|生产|分析|报表|复盘/.test(text)) {
    return { Icon: ChartNoAxesCombined, tileClass: "bg-emerald-50", iconClass: "text-emerald-600" };
  }
  if (/制度|流程|核对|检查|清单/.test(text)) {
    return { Icon: ClipboardList, tileClass: "bg-cyan-50", iconClass: "text-cyan-600" };
  }
  if (/会议|沟通|通知|纪要/.test(text)) {
    return { Icon: MessageSquareText, tileClass: "bg-violet-50", iconClass: "text-violet-600" };
  }
  return { Icon: Sparkles, tileClass: "bg-indigo-50", iconClass: "text-indigo-600" };
}

function getSkillMarkdownBody(content: string) {
  return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "").trim();
}

function parseSkillMetadata(content: string) {
  const frontmatter = content.replace(/^\uFEFF/, "").match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) return null;
  const lines = frontmatter[1].split(/\r?\n/);
  const readValue = (key: string) => {
    const index = lines.findIndex((line) => new RegExp(`^${key}:\\s*(.*)$`).test(line));
    if (index < 0) return "";
    const raw = lines[index].match(new RegExp(`^${key}:\\s*(.*)$`))?.[1]?.trim() ?? "";
    if (!raw || /^[|>][+-]?$/.test(raw)) {
      const block: string[] = [];
      for (const line of lines.slice(index + 1)) {
        if (line.trim() && !/^\s/.test(line)) break;
        block.push(line);
      }
      const nonEmpty = block.filter((line) => line.trim());
      const indent = nonEmpty.length ? Math.min(...nonEmpty.map((line) => line.match(/^\s*/)?.[0].length ?? 0)) : 0;
      const value = block.map((line) => line.slice(indent)).join("\n").trim();
      return raw.startsWith(">") ? value.replace(/\s*\n\s*/g, " ").trim() : value;
    }
    return raw.replace(/^(?:(["'])(.*)\1)$/, "$2").trim();
  };
  return { name: readValue("name"), description: readValue("description"), scene: readValue("scene") };
}

function downloadBlobFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadSkillArchive(skill: MineSkillItem) {
  const safeName = skill.name.replace(/[\\/:*?"<>|]/g, "-").trim() || "skill";
  if (skill.archiveFile) {
    downloadBlobFile(`${safeName}.zip`, skill.archiveFile);
    return;
  }

  const zip = new JSZip();
  const files = skill.packageFiles?.length
    ? skill.packageFiles
    : skill.skillMdContent
      ? [{ path: "SKILL.md", content: skill.skillMdContent }]
      : [];
  if (!files.length) throw new Error("没有可下载的技能文件");
  files.forEach((file) => zip.file(file.path, file.content));
  zip.file(".skillhub.json", JSON.stringify({ schemaVersion: 1, name: skill.name, description: skill.description }, null, 2));
  downloadBlobFile(`${safeName}.zip`, await zip.generateAsync({ type: "blob" }));
}

function ManagementSkillSection({ title, skills, showCreator, onOpen, onToggle, onRemove }: {
  title: string;
  skills: MineSkillItem[];
  showCreator: boolean;
  onOpen: (skill: MineSkillItem) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onRemove: (skill: MineSkillItem) => void;
}) {
  return <section>
    <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
    <div className="overflow-hidden rounded-[6px] border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <Table className="min-w-[860px]">
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-200 hover:bg-slate-50">
              <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">名称</TableHead>
              <TableHead className="h-10 w-[120px] px-4 text-left text-sm font-medium text-slate-700">启用状态</TableHead>
              <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">描述</TableHead>
              {showCreator ? <TableHead className="h-10 w-[180px] px-4 text-left text-sm font-medium text-slate-700">创建人/组织</TableHead> : null}
              <TableHead className="h-10 w-[100px] px-4 text-left text-sm font-medium text-slate-700">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skills.map((skill) => <TableRow key={skill.id} className="border-slate-200 transition-colors hover:bg-slate-50">
              <TableCell className="px-4 py-3 align-middle text-sm font-medium text-slate-900">
                <button type="button" onClick={() => onOpen(skill)} aria-label={`查看技能「${skill.name}」`} className="inline-flex items-center gap-2 text-left hover:text-blue-700">
                  {skill.name}
                </button>
              </TableCell>
              <TableCell className="px-4 py-3 align-middle"><Switch checked={skill.enabled} onCheckedChange={(enabled) => onToggle(skill.id, enabled)} aria-label={`${skill.name} 启用开关`} className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200" /></TableCell>
              <TableCell className="max-w-[520px] px-4 py-3 align-middle text-sm leading-6 text-slate-600"><p className="line-clamp-2">{skill.description}</p></TableCell>
              {showCreator ? <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">{skill.creator}</TableCell> : null}
              <TableCell className="px-4 py-3 align-middle text-sm">
                {skill.origin === "mine" ? <button type="button" onClick={() => onRemove(skill)} className="font-medium text-blue-600 transition-colors hover:text-red-600">删除</button> : <button type="button" onClick={() => onRemove(skill)} className="font-medium text-blue-600 transition-colors hover:text-red-600">移除</button>}
              </TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </div>
    </div>
  </section>;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

function getVisiblePageIndices(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5];
  }
  if (currentPage >= totalPages - 2) {
    return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
}

function shouldShowEllipsis(page: number, previous?: number) {
  return previous !== undefined && page - previous > 1;
}

function MineSkillsWorkbench({
  personalWorkspace = false,
  capabilityWorkspace = false,
  viewSwitcher,
  onAddSkill,
  importedSkills = [],
  onImportSkill,
  onRemoveSkill,
  onOpenPlaza,
}: {
  personalWorkspace?: boolean;
  capabilityWorkspace?: boolean;
  viewSwitcher?: ReactNode;
  onAddSkill?: () => void;
  importedSkills?: ImportedPersonalSkill[];
  onImportSkill?: () => void;
  onRemoveSkill?: (skill: MineSkillItem) => void;
  onOpenPlaza?: () => void;
}) {
  const router = useRouter();
  const { createSession } = useMyClaw();
  const [skills, setSkills] = useState<MineSkillItem[]>(() => [...USER_VISIBLE_INITIAL_SKILLS, ...importedSkills.filter((skill) => skill.publisherScope !== "system")]);
  const [originFilter, setOriginFilter] = useState<MineSkillOriginFilter>("all");
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpInput, setJumpInput] = useState("1");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [detailSkill, setDetailSkill] = useState<MineSkillItem | null>(null);
  const [removeTarget, setRemoveTarget] = useState<MineSkillItem | null>(null);

  useEffect(() => {
    const overrides = readPersonalSkillOverrides();
    if (!Object.keys(overrides).length) return;
    setSkills((current) => current.map((skill) => overrides[skill.id] ? { ...skill, ...overrides[skill.id] } : skill));
  }, []);

  const filteredSkills = useMemo(
    () =>
      filterMineSkills(skills, {
        query,
        origin: personalWorkspace ? "all" : originFilter,
        nameOnly: capabilityWorkspace && personalWorkspace,
      }).sort((left, right) =>
        personalWorkspace
          ? Number(left.origin === "builtin") - Number(right.origin === "builtin") ||
            (right.addedAt ?? "").localeCompare(left.addedAt ?? "")
          : 0,
      ),
    [skills, query, originFilter, personalWorkspace, capabilityWorkspace]
  );

  const total = filteredSkills.length;
  const groupedManagement = capabilityWorkspace && personalWorkspace;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = groupedManagement ? filteredSkills : filteredSkills.slice((safePage - 1) * pageSize, safePage * pageSize);
  const tableColumnCount = 4 + Number(capabilityWorkspace) + Number(!personalWorkspace);

  useEffect(() => {
    setCurrentPage(1);
    setJumpInput("1");
  }, [query, originFilter, pageSize]);

  useEffect(() => {
    setJumpInput(String(safePage));
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  const handleToggle = (id: string, enabled: boolean, notify = true) => {
    setSkills((current) =>
      current.map((skill) => (skill.id === id ? { ...skill, enabled } : skill))
    );
    setDetailSkill((current) => current?.id === id ? { ...current, enabled } : current);
    const target = skills.find((skill) => skill.id === id);
    if (target && notify) {
      toast.success(enabled ? `已启用「${target.name}」` : `已停用「${target.name}」`);
    }
  };

  const handleUseSkill = (skill: MineSkillItem) => {
    if (!skill.enabled) handleToggle(skill.id, true, false);
    const sessionId = createSession(`使用：${skill.name}`);
    queueWorkspaceChatBootstrap(
      sessionId,
      `请使用「${skill.name}」技能协助我完成以下任务：\n`,
    );
    setDetailSkill(null);
    toast.success("已打开新对话，请补充任务后发送");
    router.push(
      capabilityWorkspace
        ? `/claw-client?sessionId=${encodeURIComponent(sessionId)}`
        : `/my-claw/chat?sessionId=${encodeURIComponent(sessionId)}`,
    );
  };

  const handleDelete = (skill: MineSkillItem) => {
    if (skill.publisherScope === "system") {
      toast.info("系统技能不支持移除。");
      return;
    }
    setRemoveTarget(skill);
  };

  const handleDownload = async (skill: MineSkillItem) => {
    try {
      await downloadSkillArchive(skill);
      toast.success(`已下载 Skill：${skill.name}`);
    } catch {
      toast.error(`「${skill.name}」下载失败，请稍后重试`);
    }
  };

  const confirmDelete = () => {
    if (!removeTarget || removeTarget.publisherScope === "system") return;
    setSkills((current) => current.filter((item) => item.id !== removeTarget.id));
    if (removeTarget.origin === "mine") onRemoveSkill?.(removeTarget);
    toast.success(removeTarget.origin === "mine" ? `已删除「${removeTarget.name}」` : `已从当前账号移除「${removeTarget.name}」`);
    setRemoveTarget(null);
  };

  const handleConfig = (skill: MineSkillItem) => {
    toast.info(`「${skill.name}」配置能力即将接入`);
  };

  const handleEditSkill = (skill: MineSkillItem) => {
    const mode: SkillEditChatContext["mode"] = skill.origin === "mine" ? "update" : "promote";
    const editContext: SkillEditChatContext = {
      mode,
      skillId: skill.id,
      name: skill.name,
      description: skill.description,
      scene: skill.scene,
      skillMdContent: skill.skillMdContent ?? `---\nname: ${skill.name}\ndescription: "${skill.description.replaceAll('"', '\\"')}"\n---\n\n# 使用说明\n暂无正文内容。\n`,
      files: skill.files?.length ? skill.files : ["SKILL.md"],
      packageFiles: skill.packageFiles,
      version: skill.version,
    };
    const sessionId = createSession(`编辑 Skill：${skill.name}`);
    queueWorkspaceChatBootstrap(sessionId, `请帮我编辑「${skill.name}」这个 Skill：`, editContext);
    setDetailSkill(null);
    router.push(`/claw-client?sessionId=${encodeURIComponent(sessionId)}`);
  };

  const applyJump = () => {
    const next = Number(jumpInput);
    if (!Number.isFinite(next)) {
      setJumpInput(String(safePage));
      return;
    }
    setCurrentPage(Math.min(totalPages, Math.max(1, Math.floor(next))));
  };

  const visiblePages = getVisiblePageIndices(safePage, totalPages);
  const enableAll = () => {
    const count = skills.filter((skill) => !skill.enabled).length;
    setSkills((current) => current.map((skill) => skill.enabled ? skill : { ...skill, enabled: true }));
    toast.success(count ? `已启用 ${count} 个技能` : "当前技能均已启用");
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-5 md:px-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {capabilityWorkspace && onOpenPlaza ? <Button type="button" variant="outline" size="icon" aria-label="返回技能广场" className="h-9 w-9 shrink-0 rounded-md border-slate-200 bg-white" onClick={onOpenPlaza}><ChevronLeft className="size-4" /></Button> : null}
          <div>
            <h2 className="text-[20px] font-medium leading-8 tracking-normal text-[#0f172a]">
              {capabilityWorkspace && personalWorkspace ? "我的技能" : viewSwitcher ?? "我的技能"}
            </h2>
            {capabilityWorkspace && personalWorkspace ? <p className="mt-1 text-xs text-[#5a6779]">平台与组织技能可启停；自定义 Skill 仅个人可用，可启停或删除。</p> : !capabilityWorkspace ? <p className="mt-1 text-sm text-[#5a6779]">
              {personalWorkspace
                ? "管理已添加技能，可启用、停用或移除。"
                : "管理已启用技能，按来源筛选并配置个人能力包。"}
            </p> : null}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {!personalWorkspace ? (
          <div className="-mb-px flex flex-wrap gap-5 border-b border-slate-200">
            {MINE_SKILL_ORIGIN_TABS.map((tab) => {
              const active = originFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setOriginFilter(tab.value)}
                  className={cn(
                    "pb-2.5 text-[13px] transition-colors duration-100",
                    active
                      ? "border-b-2 border-[#2773ff] font-semibold text-[#2773ff]"
                      : "border-b-2 border-transparent font-medium text-[#5a6779] hover:text-[#334155]"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : capabilityWorkspace ? <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full min-w-[220px] sm:w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索技能名称" className="h-8 rounded border border-slate-200 bg-white pl-9 pr-3 text-sm shadow-none" />
          </div>
          <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded border-slate-200" aria-label="刷新技能列表" title="刷新" onClick={() => { setCurrentPage(1); toast.success("技能列表已刷新"); }}><RefreshCw className="h-4 w-4" /></Button>
        </div> : <div />}
        {!capabilityWorkspace ? <div className={cn("relative w-full min-w-0 lg:max-w-[320px]", personalWorkspace && "lg:ml-auto")}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={personalWorkspace ? "搜索技能名称" : "搜索技能名称或描述"}
            className="h-8 rounded border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-none focus-visible:border-[#2773ff]/40 focus-visible:ring-[#dbe7f4]"
          />
        </div> : null}
        {capabilityWorkspace ? <div className="flex shrink-0 items-center gap-2">
          <div className="inline-flex h-8 items-center rounded border border-slate-200 bg-white p-0.5">
            <Button type="button" variant="ghost" size="icon" aria-label="表格展示" title="表格展示" aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")} className={cn("h-7 w-7 rounded-sm", viewMode === "list" && "bg-blue-50 text-blue-600")}><List className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="icon" aria-label="卡片展示" title="卡片展示" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")} className={cn("h-7 w-7 rounded-sm", viewMode === "grid" && "bg-blue-50 text-blue-600")}><Grid2X2 className="h-4 w-4" /></Button>
          </div>
          <Button type="button" variant="outline" className="h-8 rounded border-slate-200 px-3 text-sm" onClick={enableAll}>一键启用</Button>
          <Button type="button" className="h-8 rounded bg-[#2773ff] px-3 text-sm text-white hover:bg-blue-700" onClick={personalWorkspace ? onImportSkill : onAddSkill}><Upload className="mr-1 h-4 w-4" />{personalWorkspace ? "导入 Skill" : "添加技能"}</Button>
        </div> : null}
      </div>

      {capabilityWorkspace && viewMode === "grid" ? <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {pageRows.length === 0 ? <div className="col-span-full rounded-md border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">没有匹配的技能，试试调整名称关键词。</div> : pageRows.map((skill, index) => <Fragment key={skill.id}>
          {groupedManagement && (index === 0 || pageRows[index - 1]?.origin !== skill.origin) ? <h3 className="col-span-full mt-2 text-sm font-semibold text-slate-700">{skill.origin === "builtin" ? "平台与组织" : "自定义"}</h3> : null}
          <article role="button" tabIndex={0} onClick={() => setDetailSkill(skill)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setDetailSkill(skill); } }} className="cursor-pointer rounded-md border border-slate-200 bg-white p-4 transition-colors hover:border-blue-200 hover:bg-slate-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {(() => { const { Icon, tileClass, iconClass } = getSkillCardVisual(skill); return <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tileClass)}><Icon className={cn("h-5 w-5", iconClass)} /></span>; })()}
                <div className="min-w-0"><h3 className="flex flex-wrap items-center gap-2 font-medium text-slate-900">{skill.name}</h3>{skill.origin !== "mine" ? <p className="mt-1 text-xs text-slate-400">{skill.creator}</p> : null}</div>
              </div>
              <Switch checked={skill.enabled} onCheckedChange={(checked) => handleToggle(skill.id, checked)} aria-label={`${skill.name} 启用开关`} className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200" />
            </div>
            <p className="mt-3 line-clamp-3 min-h-[60px] text-sm leading-5 text-slate-600">{skill.description}</p>
          </article>
        </Fragment>)}
      </div> : groupedManagement ? <div className="space-y-5">
        {pageRows.length === 0 ? <section className="rounded-md border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500">没有匹配的技能，试试调整名称关键词。</section> : <>
          {pageRows.some((skill) => skill.origin === "mine") ? <ManagementSkillSection title="自定义" skills={pageRows.filter((skill) => skill.origin === "mine")} showCreator={false} onOpen={setDetailSkill} onToggle={handleToggle} onRemove={handleDelete} /> : null}
          {pageRows.some((skill) => skill.origin === "builtin") ? <ManagementSkillSection title="平台与组织" skills={pageRows.filter((skill) => skill.origin === "builtin")} showCreator onOpen={setDetailSkill} onToggle={handleToggle} onRemove={handleDelete} /> : null}
        </>}
      </div> : <section className="overflow-hidden rounded-[6px] border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <Table className="min-w-[880px]">
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-200 hover:bg-slate-50">
                <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">
                  名称
                </TableHead>
                {!personalWorkspace ? (
                  <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">
                    来源
                  </TableHead>
                ) : null}
                <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">
                  {capabilityWorkspace ? "启用状态" : "启用"}
                </TableHead>
                <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">
                  描述
                </TableHead>
                {capabilityWorkspace ? <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">创建人/组织</TableHead> : null}
                <TableHead className="h-10 px-4 text-left text-sm font-medium text-slate-700">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow className="border-0 hover:bg-transparent">
                  <TableCell colSpan={tableColumnCount} className="px-6 py-16 text-center">
                    <div className="mx-auto max-w-md space-y-3">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-400">
                        <Search className="h-5 w-5" />
                      </div>
                      <div className="text-base font-semibold text-slate-900">暂无匹配结果</div>
                      <p className="text-sm leading-6 text-slate-500">
                        {personalWorkspace
                          ? "没有匹配的技能，试试调整关键词。"
                          : "没有匹配的技能，试试换个来源或关键词。"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((skill, rowIndex) => (
                  <Fragment key={skill.id}>
                  {groupedManagement && (rowIndex === 0 || pageRows[rowIndex - 1]?.origin !== skill.origin) ? <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50"><TableCell colSpan={tableColumnCount} className="px-4 py-2 text-sm font-semibold text-slate-700">{skill.origin === "builtin" ? "平台与组织" : "自定义"}</TableCell></TableRow> : null}
                  <TableRow
                    className={cn(
                      "border-slate-200 transition-colors duration-100 hover:bg-slate-50",
                      rowIndex % 2 === 1 && "bg-slate-50/60"
                    )}
                  >
                    <TableCell className="px-4 py-3 align-middle text-sm font-medium text-slate-900">
                      <span className="inline-flex items-center gap-2">
                        {capabilityWorkspace ? <button type="button" onClick={() => setDetailSkill(skill)} aria-label={`查看技能「${skill.name}」`} className="inline-flex items-center gap-2 text-left hover:text-blue-700">{skill.name}</button> : skill.name}
                      </span>
                    </TableCell>
                    {!personalWorkspace ? (
                      <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">
                        {getMineSkillOriginLabel(skill.origin)}
                      </TableCell>
                    ) : null}
                    <TableCell className="px-4 py-3 align-middle">
                      <Switch
                        checked={skill.enabled}
                        onCheckedChange={(checked) => handleToggle(skill.id, checked)}
                        aria-label={`${skill.name} 启用开关`}
                        className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200"
                      />
                    </TableCell>
                    <TableCell className="max-w-[420px] px-4 py-3 align-middle text-sm leading-6 text-slate-600">
                      <p className="line-clamp-2">{skill.description}</p>
                    </TableCell>
                    {capabilityWorkspace ? <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">{groupedManagement && skill.origin === "mine" ? <span className="text-slate-400">—</span> : skill.creator}</TableCell> : null}
                    <TableCell className="px-4 py-3 align-middle">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {capabilityWorkspace && personalWorkspace ? skill.origin === "mine" ? <button type="button" onClick={() => handleDelete(skill)} className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">删除</button> : skill.publisherScope === "system" ? <span className="text-sm text-slate-400">—</span> : <button type="button" onClick={() => handleDelete(skill)} className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">移除</button> : null}
                        {!capabilityWorkspace ? <>
                        <button
                          type="button"
                          onClick={() => handleConfig(skill)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                          配置
                        </button>
                        {skill.origin !== "builtin" ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(skill)}
                            className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                          >
                            删除
                          </button>
                        ) : null}
                        </> : null}
                      </div>
                    </TableCell>
                  </TableRow>
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {total > 0 ? (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-end">
            <span className="lg:mr-3">共{total}条</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-[4px] text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                aria-label="上一页"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {visiblePages.map((page, index) => (
                <span key={page} className="inline-flex items-center gap-1.5">
                  {shouldShowEllipsis(page, visiblePages[index - 1]) ? (
                    <span className="px-2 text-slate-400">...</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "h-8 min-w-8 rounded-[4px] px-2 text-sm font-medium transition-colors",
                      page === safePage
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                    )}
                  >
                    {page}
                  </button>
                </span>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-[4px] text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                aria-label="下一页"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <select
              value={String(pageSize)}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="h-8 w-[92px] rounded-[4px] border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-300"
              aria-label="每页条数"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}条/页
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-slate-500">前往</span>
              <Input
                value={jumpInput}
                onChange={(event) => setJumpInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyJump();
                  }
                }}
                className="h-8 w-10 rounded-[4px] border-slate-200 px-2 text-center shadow-none"
                aria-label="跳转页码"
              />
              <span className="text-slate-500">页</span>
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-[4px] border-slate-200 px-3 text-sm shadow-none"
                onClick={applyJump}
              >
                确定
              </Button>
            </div>
          </div>
        ) : null}
      </section>}
      {capabilityWorkspace && !groupedManagement && viewMode === "grid" && total > pageSize ? <div className="mt-3 flex items-center justify-end gap-2 text-sm text-slate-600">
        <span className="mr-2">共{total}条</span>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" aria-label="上一页" disabled={safePage <= 1} onClick={() => setCurrentPage(Math.max(1, safePage - 1))}><ChevronLeft className="h-4 w-4" /></Button>
        <span>{safePage}/{totalPages}</span>
        <Button type="button" variant="outline" size="icon" className="h-8 w-8" aria-label="下一页" disabled={safePage >= totalPages} onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}><ChevronRight className="h-4 w-4" /></Button>
      </div> : null}
      <SkillDetailDialogShell
        open={!!detailSkill}
        onOpenChange={(open) => { if (!open) setDetailSkill(null); }}
        name={detailSkill?.name ?? ""}
        description={detailSkill?.description}
        icon={<Boxes className="size-6" />}
        badge={null}
        titleActions={detailSkill ? <>
          <Button type="button" className="h-9 bg-slate-900 px-4 text-white hover:bg-slate-800" onClick={() => handleUseSkill(detailSkill)}>立即使用</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button type="button" variant="outline" size="icon" className="size-9 shrink-0" aria-label="更多操作" title="更多操作"><Ellipsis className="size-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="z-[110] w-40">
              {capabilityWorkspace && personalWorkspace ? <DropdownMenuItem onSelect={() => handleEditSkill(detailSkill)}><Pencil className="size-4" />编辑</DropdownMenuItem> : null}
              <DropdownMenuItem onSelect={() => { void handleDownload(detailSkill); }}><Download className="size-4" />下载</DropdownMenuItem>
              {detailSkill.origin === "mine" ? <DropdownMenuItem variant="destructive" onSelect={() => { setDetailSkill(null); handleDelete(detailSkill); }}><Trash2 className="size-4" />删除</DropdownMenuItem> : detailSkill.publisherScope !== "system" ? <DropdownMenuItem variant="destructive" onSelect={() => { setDetailSkill(null); handleDelete(detailSkill); }}><Trash2 className="size-4" />移除</DropdownMenuItem> : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </> : undefined}
        headerActions={detailSkill ? <>
          <Switch checked={detailSkill.enabled} onCheckedChange={(checked) => handleToggle(detailSkill.id, checked)} aria-label={`${detailSkill.name} 启用开关`} className="data-[state=checked]:bg-blue-600" />
        </> : undefined}
        metadata={detailSkill ? detailSkill.origin === "builtin" ? [
          { label: "创建人/组织", value: detailSkill.creator },
          { label: "更新时间", value: detailSkill.updatedAt },
        ] : [
          { label: "更新时间", value: detailSkill.updatedAt },
        ] : []}
      >
        <div className="text-sm leading-6 text-slate-700">
          {detailSkill?.skillMdContent && getSkillMarkdownBody(detailSkill.skillMdContent) ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
            h1: ({ children }) => <h2 className="mb-3 mt-1 text-lg font-semibold text-slate-900">{children}</h2>,
            h2: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold text-slate-900">{children}</h3>,
            h3: ({ children }) => <h4 className="mb-2 mt-3 font-semibold text-slate-900">{children}</h4>,
            p: ({ children }) => <p className="my-2 whitespace-pre-wrap">{children}</p>,
            ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
            ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
            li: ({ children }) => <li className="pl-1">{children}</li>,
            code: ({ children }) => <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[12px]">{children}</code>,
            blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-blue-300 pl-3 text-slate-600">{children}</blockquote>,
            hr: () => <hr className="my-3 border-slate-200" />,
          }}>{getSkillMarkdownBody(detailSkill.skillMdContent)}</ReactMarkdown> : <p className="py-4 text-slate-400">该 Skill 暂未提供 SKILL.md 正文内容。</p>}
        </div>
      </SkillDetailDialogShell>
      <Dialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader><DialogTitle>确认删除已选技能？</DialogTitle><DialogDescription>删除后「{removeTarget?.name}」将从个人技能列表和个人存储空间移除，不影响历史会话记录和已生成产物。</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setRemoveTarget(null)}>取消</Button><Button variant="destructive" onClick={confirmDelete}>删除</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function MyClawSkillsHub({
  personalWorkspace = false,
  capabilityWorkspace = false,
  hideViewTabs = false,
  activeView: controlledActiveView,
  onActiveViewChange,
}: {
  personalWorkspace?: boolean;
  capabilityWorkspace?: boolean;
  hideViewTabs?: boolean;
  activeView?: "mine" | "plaza";
  onActiveViewChange?: (view: "mine" | "plaza") => void;
} = {}) {
  const router = useRouter();
  const { createSession } = useMyClaw();
  const searchParams = useSearchParams();
  const tabs = personalWorkspace
    ? [
        { value: "plaza", label: "技能广场" },
        { value: "mine", label: "我的技能" },
      ]
    : [
        { value: "mine", label: "我的技能" },
        { value: "plaza", label: "技能广场" },
      ];
  const [localActiveView, setLocalActiveView] = useState<"mine" | "plaza">(
    personalWorkspace ? "plaza" : "mine",
  );
  const importInputRef = useRef<HTMLInputElement>(null);
  const [skillImportOpen, setSkillImportOpen] = useState(false);
  const [skillImportError, setSkillImportError] = useState("");
  const [skillImportFileName, setSkillImportFileName] = useState("");
  const [skillImportParsing, setSkillImportParsing] = useState(false);
  const [skillImportPreview, setSkillImportPreview] = useState<{ name: string; description: string; scene: string; usageInstructions: string; files: string[]; skillMdContent: string; archiveFile: File } | null>(null);
  const [importedSkills, setImportedSkills] = useState<ImportedPersonalSkill[]>([]);
  const [importedSkillsLoaded, setImportedSkillsLoaded] = useState(false);
  const [discardImportOpen, setDiscardImportOpen] = useState(false);
  const activeView = controlledActiveView ?? localActiveView;
  useEffect(() => {
    if (personalWorkspace && capabilityWorkspace && searchParams.get("skillView") === "mine") {
      setLocalActiveView("mine");
      onActiveViewChange?.("mine");
    }
  }, [capabilityWorkspace, onActiveViewChange, personalWorkspace, searchParams]);
  useEffect(() => {
    setImportedSkills(readPersonalSkills() as ImportedPersonalSkill[]);
    setImportedSkillsLoaded(true);
  }, []);
  useEffect(() => {
    if (importedSkillsLoaded) writePersonalSkills(importedSkills);
  }, [importedSkills, importedSkillsLoaded]);
  const handleActiveViewChange = (value: string) => {
    const nextView = value === "plaza" ? "plaza" : "mine";
    setLocalActiveView(nextView);
    onActiveViewChange?.(nextView);
  };
  const openSkillCreator = () => {
    const examplePrompt = "请创建一个会议行动项整理 Skill：从会议纪要中提取行动事项、责任人和截止时间，按表格输出；不确定的信息标记为待确认。";
    const sessionId = createSession("创建 Skill：会议行动项整理");
    queueWorkspaceChatBootstrap(sessionId, examplePrompt, undefined, { examplePrompt });
    router.push(`/claw-client?sessionId=${encodeURIComponent(sessionId)}`);
  };
  const openSkillImport = () => {
    setSkillImportError("");
    setSkillImportFileName("");
    setSkillImportPreview(null);
    setSkillImportParsing(false);
    setSkillImportOpen(true);
  };
  const resetSkillImportDraft = () => {
    setSkillImportPreview(null);
    setSkillImportFileName("");
    setSkillImportError("");
    setSkillImportParsing(false);
  };
  const requestCloseSkillImport = () => {
    if (skillImportParsing) return;
    if (skillImportFileName || skillImportPreview || skillImportError) setDiscardImportOpen(true);
    else {
      setSkillImportOpen(false);
      resetSkillImportDraft();
    }
  };
  const parseSkillArchive = async (file?: File) => {
    if (!file) return;
    setSkillImportFileName(file.name);
    setSkillImportError("");
    setSkillImportPreview(null);
    if (!file.name.toLocaleLowerCase().endsWith(".zip")) {
      setSkillImportError("导入失败：仅支持上传 ZIP 格式文件");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setSkillImportError("导入失败：ZIP 文件大小不能超过 100MB");
      return;
    }
    setSkillImportParsing(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const manifests = Object.values(zip.files).filter((entry) => {
        if (entry.dir) return false;
        const normalizedPath = entry.name.replace(/^\.\//, "");
        return normalizedPath === "SKILL.md";
      });
      if (!manifests.length) throw new Error("导入失败：压缩包根目录下未检测到 SKILL.md 文件");
      if (manifests.length > 1) throw new Error("导入失败：压缩包中检测到多个 SKILL.md 文件，请保留一个后重试");
      const manifest = manifests[0];
      const content = await manifest.async("text");
      const metadata = parseSkillMetadata(content);
      if (!metadata) throw new Error("导入失败：SKILL.md 格式错误，请检查 YAML 元信息");
      const { name, description, scene } = metadata;
      if (!name || !description) throw new Error("导入失败：SKILL.md 必填内容缺失或格式错误，请检查 name 和 description");
      const files = Object.values(zip.files).filter((entry) => !entry.dir).map((entry) => entry.name);
      setSkillImportPreview({ name, description, scene, usageInstructions: getSkillMarkdownBody(content), files, skillMdContent: content, archiveFile: file });
      const normalizedName = name.trim().normalize("NFKC").toLocaleLowerCase();
      const isDuplicate = [...USER_VISIBLE_INITIAL_SKILLS, ...importedSkills.filter((skill) => skill.publisherScope !== "system")].some(
        (skill) => skill.name.trim().normalize("NFKC").toLocaleLowerCase() === normalizedName,
      );
      if (isDuplicate) setSkillImportError("Skill名称不可与已有名称重复");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setSkillImportError(message.startsWith("导入失败：") ? message : "导入失败：无法解析 ZIP 压缩包，请检查文件是否完整");
    } finally {
      setSkillImportParsing(false);
    }
  };
  const confirmSkillImport = () => {
    if (!skillImportPreview) return;
    const normalizedName = skillImportPreview.name.trim().normalize("NFKC").toLocaleLowerCase();
    const duplicateSkill = [...USER_VISIBLE_INITIAL_SKILLS, ...importedSkills.filter((skill) => skill.publisherScope !== "system")].find(
      (skill) => skill.name.trim().normalize("NFKC").toLocaleLowerCase() === normalizedName,
    );
    if (duplicateSkill) {
      setSkillImportError("Skill名称不可与已有名称重复");
      return;
    }
    const addedAt = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
    const imported: ImportedPersonalSkill = {
      id: `personal-skill-${Date.now()}`,
      name: skillImportPreview.name,
      description: skillImportPreview.description,
      creator: "我",
      origin: "mine",
      publisherScope: "personal",
      enabled: true,
      addedAt,
      updatedAt: addedAt,
      version: "v1.0",
      files: skillImportPreview.files,
      skillMdContent: skillImportPreview.skillMdContent,
      archiveFile: skillImportPreview.archiveFile,
      scene: skillImportPreview.scene,
    };
    setImportedSkills((current) => [imported, ...current]);
    setSkillImportOpen(false);
    setSkillImportPreview(null);
    setSkillImportFileName("");
    setSkillImportError("");
    toast.success("添加成功", { action: { label: "查看", onClick: () => handleActiveViewChange("mine") } });
  };
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8f9fb]">
      <Tabs
        value={activeView}
        onValueChange={handleActiveViewChange}
        className="flex h-full min-h-0 flex-col gap-0"
      >
        {!hideViewTabs && !capabilityWorkspace ? (
          <div
            className={cn(
              "shrink-0 border-b border-slate-200/80 bg-white/90 px-4 pt-3 md:px-6",
              personalWorkspace && "bg-[#f8fafc] px-4 pt-0 md:px-6"
            )}
          >
            <TabsList
              aria-label="技能视图"
              className={cn(
                "h-auto w-fit gap-1 rounded-none bg-transparent p-0",
                personalWorkspace && "h-11"
              )}
            >
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-[#5a6779] shadow-none data-[state=active]:border-[#2773ff] data-[state=active]:bg-transparent data-[state=active]:text-[#2773ff] data-[state=active]:shadow-none",
                    personalWorkspace && "px-3 py-2 text-[13px]"
                  )}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        ) : null}

        <TabsContent value="mine" className="mt-0 min-h-0 flex-1 overflow-y-auto">
          <MineSkillsWorkbench
            key={importedSkills.map((skill) => `${skill.id}:${skill.version}:${skill.updatedAt}`).join("|")}
            personalWorkspace={personalWorkspace}
            capabilityWorkspace={capabilityWorkspace}
            onAddSkill={() => handleActiveViewChange("plaza")}
            onOpenPlaza={() => handleActiveViewChange("plaza")}
            importedSkills={importedSkills}
            onImportSkill={openSkillImport}
            onRemoveSkill={(skill) => setImportedSkills((current) => current.filter((item) => item.id !== skill.id))}
          />
        </TabsContent>

        <TabsContent
          value="plaza"
          className={cn(
            "mt-0 min-h-0 flex-1 overflow-y-auto bg-[#e8f0fb] px-4 py-4 md:px-6",
            capabilityWorkspace && "bg-[#f8fafc] px-5 py-4 md:px-8"
          )}
        >
          <SkillsPage
            moduleView="hub"
            embedded
            capabilityWorkspace={capabilityWorkspace}
            managementCount={USER_VISIBLE_INITIAL_SKILLS.length + importedSkills.length}
            onPersonalImportSkill={openSkillImport}
            onCreatePersonalSkill={openSkillCreator}
            onOpenManagement={() => handleActiveViewChange("mine")}
          />
        </TabsContent>
      </Tabs>
      <input ref={importInputRef} type="file" accept=".zip,application/zip" className="hidden" onChange={(event) => { setSkillImportOpen(true); void parseSkillArchive(event.target.files?.[0]); event.target.value = ""; }} />
      <Dialog open={skillImportOpen} onOpenChange={(nextOpen) => { if (nextOpen) setSkillImportOpen(true); else requestCloseSkillImport(); }}>
        <DialogContent className="sm:max-w-[760px]">
          <DialogHeader><DialogTitle>导入 Skill</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className={cn(
              "group relative h-44 w-full overflow-hidden rounded-md border transition-colors",
              skillImportFileName
                ? "border-slate-200 bg-slate-50"
                : "border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100",
            )}>
              {skillImportFileName ? <div className="flex h-full items-center justify-center px-4">
                <div className="flex w-fit max-w-full items-center gap-3 sm:gap-4">
                  <div className={cn("grid size-12 shrink-0 place-items-center rounded-lg", skillImportError ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                    <FileArchive className="size-6" />
                  </div>
                  <div className="min-w-0 max-w-[min(50vw,420px)]">
                    <div className="truncate text-sm font-medium text-slate-800" title={skillImportFileName}>{skillImportFileName}</div>
                    <div className={cn("mt-1 text-xs", skillImportError ? "text-rose-600" : skillImportPreview ? "text-emerald-600" : "text-slate-500")}>
                      {skillImportParsing ? "正在解析压缩包…" : skillImportError ? "校验未通过，请查看下方原因" : skillImportPreview ? "压缩包校验通过" : "等待解析"}
                    </div>
                  </div>
                  {skillImportPreview && !skillImportError ? <CheckCircle2 className="size-5 shrink-0 text-emerald-500" /> : null}
                  <button
                    type="button"
                    disabled={skillImportParsing}
                    aria-label="删除当前压缩包"
                    title="删除当前压缩包"
                    onClick={resetSkillImportDraft}
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div> : <button
                type="button"
                disabled={skillImportParsing}
                onClick={() => importInputRef.current?.click()}
                onDragOver={(event) => { if (!skillImportParsing) event.preventDefault(); }}
                onDrop={(event) => { event.preventDefault(); if (!skillImportParsing) void parseSkillArchive(event.dataTransfer.files?.[0]); }}
                className="flex h-full w-full flex-col items-center justify-center px-5 py-7 text-center disabled:cursor-wait disabled:opacity-70"
              >
                <Upload className="mb-3 size-6 text-slate-400" />
                <span className="font-medium text-slate-700">点击选择或拖拽 ZIP 压缩包到此处</span>
                <span className="mt-2 text-sm text-slate-400">仅支持上传单份 .zip 文件，文件大小不超过 100MB</span>
                <span className="mt-1 text-sm text-slate-400">压缩包根目录需包含 SKILL.md，并填写技能名称与描述</span>
              </button>}
            </div>
            {skillImportError ? <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{skillImportError}</p> : null}
            {skillImportPreview ? <div className="max-h-52 overflow-auto rounded-md border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm leading-6 text-slate-600">
              <div><span className="font-semibold text-slate-700">Name:</span> {skillImportPreview.name}</div>
              <div className="whitespace-pre-wrap break-words"><span className="font-semibold text-slate-700">Description:</span> {skillImportPreview.description}</div>
              <div><span className="font-semibold text-slate-700">适用场景:</span> {skillImportPreview.scene || "未提供"}</div>
              <div className="mt-2 border-t border-slate-200 pt-2"><span className="font-semibold text-slate-700">使用说明:</span>
                {skillImportPreview.usageInstructions ? <div className="mt-1 whitespace-pre-wrap break-words font-sans">{skillImportPreview.usageInstructions}</div> : <div className="mt-1 font-sans text-slate-400">未提供</div>}
              </div>
            </div> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={skillImportParsing} onClick={requestCloseSkillImport}>取消</Button>
            <Button type="button" disabled={!skillImportPreview || Boolean(skillImportError) || skillImportParsing} onClick={confirmSkillImport}>保存并启用</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDiscardDialog
        open={discardImportOpen}
        onOpenChange={setDiscardImportOpen}
        onConfirm={() => { setDiscardImportOpen(false); setSkillImportOpen(false); resetSkillImportDraft(); }}
        description={DISCARD_CONFIRMATION_DESCRIPTION}
      />
    </div>
  );
}

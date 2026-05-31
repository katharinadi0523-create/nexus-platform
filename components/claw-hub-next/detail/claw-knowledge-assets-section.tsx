"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpDown,
  BookA,
  Box,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  ListFilter,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  ClawKnowledgeAssets,
  DatabaseRow,
  KnowledgeBaseRow,
  KnowledgeBaseLevel,
  OntologyObjectRow,
  TermBankRow,
} from "@/lib/mock/claw-hub-next";
import type { KnowledgePanelKey } from "@/components/claw-hub-next/detail/constants";
import { KNOWLEDGE_PANEL_ITEMS } from "@/components/claw-hub-next/detail/constants";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const SEARCH_PLACEHOLDERS: Record<KnowledgePanelKey, string> = {
  "knowledge-base": "搜索知识库名称",
  database: "搜索数据库名称",
  ontology: "搜索本体对象名称",
  "term-bank": "搜索术语库名称",
};

const ACTION_LABELS: Record<KnowledgePanelKey, string> = {
  "knowledge-base": "配置知识库",
  database: "配置数据库",
  ontology: "配置本体对象",
  "term-bank": "配置术语库",
};

const EMPTY_LABELS: Record<KnowledgePanelKey, string> = {
  "knowledge-base": "当前还没有知识库。",
  database: "当前还没有数据库。",
  ontology: "当前还没有本体对象。",
  "term-bank": "当前还没有术语库。",
};

function getVisiblePageIndices(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total]);
  for (let page = current - 2; page <= current + 2; page += 1) {
    if (page >= 1 && page <= total) {
      pages.add(page);
    }
  }

  return [...pages].sort((a, b) => a - b);
}

function shouldShowEllipsis(page: number, previousPage: number | undefined): boolean {
  return previousPage !== undefined && page - previousPage > 1;
}

function textIncludesQuery(parts: Array<string | undefined>, query: string) {
  if (!query) {
    return true;
  }

  return parts.join(" ").toLowerCase().includes(query);
}

function AssetIcon({ panel }: { panel: KnowledgePanelKey }) {
  const iconConfig = {
    "knowledge-base": {
      Icon: FileText,
      className: "bg-[#5f85f6] text-white",
    },
    database: {
      Icon: Database,
      className: "bg-[#7047e8] text-white",
    },
    ontology: {
      Icon: Box,
      className: "bg-[#f7c63a] text-white",
    },
    "term-bank": {
      Icon: BookA,
      className: "bg-[#35c3e5] text-white",
    },
  } satisfies Record<KnowledgePanelKey, { Icon: typeof FileText; className: string }>;

  const { Icon, className } = iconConfig[panel];

  return (
    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px]", className)}>
      <Icon className="h-5 w-5" aria-hidden />
    </span>
  );
}

function KnowledgeLevelBadge({ level }: { level: KnowledgeBaseLevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[4px] px-2 py-1 text-xs font-medium",
        level === "高级" ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-600"
      )}
    >
      {level}
    </span>
  );
}

function HeaderIcon({ type }: { type: "filter" | "sort" }) {
  const Icon = type === "filter" ? ListFilter : ArrowUpDown;
  return <Icon className="ml-1 h-3.5 w-3.5 text-slate-500" aria-hidden />;
}

function EmptyKnowledgeState({ label }: { label: string }) {
  return (
    <div className="border-t border-slate-200 px-4 py-14 text-center text-sm text-slate-400">
      {label}
    </div>
  );
}

function NameCell({
  panel,
  name,
}: {
  panel: KnowledgePanelKey;
  name: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AssetIcon panel={panel} />
      <div className="min-w-0 truncate text-sm font-semibold text-slate-900" title={name}>
        {name}
      </div>
    </div>
  );
}

function DescriptionCell({ children }: { children: ReactNode }) {
  return (
    <div className="line-clamp-2 max-w-[360px] whitespace-normal text-sm leading-6 text-slate-700">
      {children}
    </div>
  );
}

function RowActions({
  rowName,
  onRemove,
}: {
  rowName: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
        onClick={() => toast.info(`查看「${rowName}」入口即将接入。`)}
      >
        查看
      </button>
      <button type="button" onClick={onRemove} className="text-sm font-medium text-blue-600 hover:text-blue-700">
        移除
      </button>
    </div>
  );
}

function Pagination({
  total,
  pageSize,
  currentPage,
  totalPages,
  jumpInput,
  onPageSizeChange,
  onPageChange,
  onJumpInputChange,
  onApplyJump,
}: {
  total: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  jumpInput: string;
  onPageSizeChange: (next: number) => void;
  onPageChange: (next: number) => void;
  onJumpInputChange: (next: string) => void;
  onApplyJump: () => void;
}) {
  const visiblePages = getVisiblePageIndices(currentPage, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 py-3 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-end">
      <span className="lg:mr-3">共{total}条</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-[4px] text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          aria-label="上一页"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {visiblePages.map((page, index) => (
          <span key={page} className="inline-flex items-center gap-1.5">
            {shouldShowEllipsis(page, visiblePages[index - 1]) ? <span className="px-2 text-slate-400">...</span> : null}
            <button
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                "h-8 min-w-8 rounded-[4px] px-2 text-sm font-medium transition-colors",
                page === currentPage
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
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          aria-label="下一页"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <select
        value={String(pageSize)}
        onChange={(event) => onPageSizeChange(Number(event.target.value))}
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
          onChange={(event) => onJumpInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onApplyJump();
            }
          }}
          className="h-8 w-10 rounded-[4px] border-slate-200 px-2 text-center shadow-none"
          aria-label="跳转页码"
        />
      </div>
    </div>
  );
}

export interface ClawKnowledgeAssetsSectionProps {
  activePanel: KnowledgePanelKey;
  onActivePanelChange: (panel: KnowledgePanelKey) => void;
  assets: ClawKnowledgeAssets;
  onDeleteKnowledgeBase: (id: string) => void;
  onDeleteDatabase: (id: string) => void;
  onDeleteOntology: (id: string) => void;
  onDeleteTermBank: (id: string) => void;
  onOpenKnowledgeBaseConfig: () => void;
  onOpenDatabaseConfig: () => void;
  onOpenOntologyConfig: () => void;
  onOpenTermBankConfig: () => void;
}

export function ClawKnowledgeAssetsSection({
  activePanel,
  onActivePanelChange,
  assets,
  onDeleteKnowledgeBase,
  onDeleteDatabase,
  onDeleteOntology,
  onDeleteTermBank,
  onOpenKnowledgeBaseConfig,
  onOpenDatabaseConfig,
  onOpenOntologyConfig,
  onOpenTermBankConfig,
}: ClawKnowledgeAssetsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpInput, setJumpInput] = useState("");

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const tabCounts: Record<KnowledgePanelKey, number> = {
    "knowledge-base": assets.knowledgeBases.length,
    database: assets.databases.length,
    ontology: assets.ontologyObjects.length,
    "term-bank": assets.termBanks.length,
  };

  const filteredKnowledgeBases = useMemo(
    () =>
      assets.knowledgeBases.filter((row) =>
        textIncludesQuery([row.name, row.type, row.description, row.creator, row.updatedAt], normalizedQuery)
      ),
    [assets.knowledgeBases, normalizedQuery]
  );
  const filteredDatabases = useMemo(
    () =>
      assets.databases.filter((row) =>
        textIncludesQuery([row.name, row.dbType, row.description, row.creator, row.updatedAt], normalizedQuery)
      ),
    [assets.databases, normalizedQuery]
  );
  const filteredOntologyObjects = useMemo(
    () =>
      assets.ontologyObjects.filter((row) =>
        textIncludesQuery([row.name, row.scene, row.description, row.creator, row.updatedAt], normalizedQuery)
      ),
    [assets.ontologyObjects, normalizedQuery]
  );
  const filteredTermBanks = useMemo(
    () =>
      assets.termBanks.filter((row) =>
        textIncludesQuery([row.name, row.description, row.creator, row.updatedAt], normalizedQuery)
      ),
    [assets.termBanks, normalizedQuery]
  );

  const activeRows =
    activePanel === "knowledge-base"
      ? filteredKnowledgeBases
      : activePanel === "database"
        ? filteredDatabases
        : activePanel === "ontology"
          ? filteredOntologyObjects
          : filteredTermBanks;

  const total = activeRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = activeRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const actionMap: Record<KnowledgePanelKey, () => void> = {
    "knowledge-base": onOpenKnowledgeBaseConfig,
    database: onOpenDatabaseConfig,
    ontology: onOpenOntologyConfig,
    "term-bank": onOpenTermBankConfig,
  };

  function handlePanelChange(panel: KnowledgePanelKey) {
    onActivePanelChange(panel);
    setSearchQuery("");
    setCurrentPage(1);
    setJumpInput("");
  }

  function handleSearchQueryChange(nextQuery: string) {
    setSearchQuery(nextQuery);
    setCurrentPage(1);
    setJumpInput("");
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize);
    setCurrentPage(1);
    setJumpInput("");
  }

  function applyJumpPage() {
    const value = Number.parseInt(jumpInput.trim(), 10);
    if (Number.isNaN(value) || value < 1) {
      toast.error("请输入有效页码。");
      return;
    }

    const target = Math.min(value, totalPages);
    setCurrentPage(target);
    setJumpInput(String(target));
  }

  return (
    <section className="-m-5 min-h-full bg-white px-5 py-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-950">知识</h2>

        <div className="border-b border-slate-200">
          <div className="flex min-w-0 items-center gap-7 overflow-x-auto">
            {KNOWLEDGE_PANEL_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handlePanelChange(item.key)}
                className={cn(
                  "shrink-0 border-b-2 border-transparent px-0 py-3 text-sm font-medium transition-colors",
                  activePanel === item.key ? "border-blue-600 text-blue-600" : "text-slate-600 hover:text-slate-950"
                )}
              >
                {item.label} ({tabCounts[item.key]})
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-[212px]">
            <Search
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-700"
              aria-hidden
            />
            <Input
              value={searchQuery}
              onChange={(event) => handleSearchQueryChange(event.target.value)}
              placeholder={SEARCH_PLACEHOLDERS[activePanel]}
              className="h-8 rounded-[4px] border-slate-200 bg-white pl-3 pr-9 text-sm shadow-none placeholder:text-slate-400"
              aria-label={SEARCH_PLACEHOLDERS[activePanel]}
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-[4px] border-slate-200 bg-white text-slate-700 shadow-none hover:bg-slate-50"
              onClick={() => toast.success("已刷新。")}
              aria-label="刷新"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-[4px] bg-blue-600 px-4 text-sm font-medium text-white shadow-none hover:bg-blue-700"
              onClick={actionMap[activePanel]}
            >
              <Plus className="h-4 w-4" />
              {ACTION_LABELS[activePanel]}
            </Button>
          </div>
        </div>

        <div className="min-h-[520px] overflow-hidden">
          {total === 0 ? (
            <EmptyKnowledgeState label={searchQuery.trim() ? "没有匹配条件的资源。" : EMPTY_LABELS[activePanel]} />
          ) : activePanel === "knowledge-base" ? (
            <KnowledgeBaseTable rows={pageRows as KnowledgeBaseRow[]} onDelete={onDeleteKnowledgeBase} />
          ) : activePanel === "database" ? (
            <DatabaseTable rows={pageRows as DatabaseRow[]} onDelete={onDeleteDatabase} />
          ) : activePanel === "ontology" ? (
            <OntologyTable rows={pageRows as OntologyObjectRow[]} onDelete={onDeleteOntology} />
          ) : (
            <TermBankTable rows={pageRows as TermBankRow[]} onDelete={onDeleteTermBank} />
          )}
        </div>

        {total > 0 ? (
          <Pagination
            total={total}
            pageSize={pageSize}
            currentPage={safePage}
            totalPages={totalPages}
            jumpInput={jumpInput}
            onPageSizeChange={handlePageSizeChange}
            onPageChange={setCurrentPage}
            onJumpInputChange={setJumpInput}
            onApplyJump={applyJumpPage}
          />
        ) : null}
      </div>
    </section>
  );
}

function KnowledgeBaseTable({
  rows,
  onDelete,
}: {
  rows: KnowledgeBaseRow[];
  onDelete: (id: string) => void;
}) {
  return (
    <Table className="min-w-[1080px] table-fixed">
      <TableHeader>
        <TableRow className="border-slate-200 hover:bg-transparent">
          <TableHead className="w-[300px] px-4 text-sm font-semibold text-slate-900">知识库名称</TableHead>
          <TableHead className="w-[110px] px-4 text-sm font-semibold text-slate-900">
            <span className="inline-flex items-center">类型<HeaderIcon type="filter" /></span>
          </TableHead>
          <TableHead className="w-[330px] px-4 text-sm font-semibold text-slate-900">描述</TableHead>
          <TableHead className="w-[140px] px-4 text-sm font-semibold text-slate-900">
            <span className="inline-flex items-center">创建人<HeaderIcon type="filter" /></span>
          </TableHead>
          <TableHead className="w-[180px] px-4 text-sm font-semibold text-slate-900">
            <span className="inline-flex items-center">更新时间<HeaderIcon type="sort" /></span>
          </TableHead>
          <TableHead className="w-[120px] px-4 text-sm font-semibold text-slate-900">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} className="h-[62px] border-slate-200 bg-white hover:bg-slate-50/40">
            <TableCell className="px-4 py-2 align-middle">
              <NameCell panel="knowledge-base" name={row.name} />
            </TableCell>
            <TableCell className="px-4 py-2 align-middle">
              <KnowledgeLevelBadge level={row.type} />
            </TableCell>
            <TableCell className="px-4 py-2 align-middle">
              <DescriptionCell>{row.description}</DescriptionCell>
            </TableCell>
            <TableCell className="px-4 py-2 align-middle text-sm text-slate-700">
              <span className="block max-w-[120px] truncate" title={row.creator}>{row.creator}</span>
            </TableCell>
            <TableCell className="px-4 py-2 align-middle text-sm text-slate-700">{row.updatedAt}</TableCell>
            <TableCell className="px-4 py-2 align-middle">
              <RowActions rowName={row.name} onRemove={() => onDelete(row.id)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DatabaseTable({
  rows,
  onDelete,
}: {
  rows: DatabaseRow[];
  onDelete: (id: string) => void;
}) {
  return (
    <Table className="min-w-[1080px] table-fixed">
      <TableHeader>
        <TableRow className="border-slate-200 hover:bg-transparent">
          <TableHead className="w-[300px] px-4 text-sm font-semibold text-slate-900">数据库名称</TableHead>
          <TableHead className="w-[130px] px-4 text-sm font-semibold text-slate-900">
            <span className="inline-flex items-center">类型<HeaderIcon type="filter" /></span>
          </TableHead>
          <TableHead className="w-[330px] px-4 text-sm font-semibold text-slate-900">描述</TableHead>
          <TableHead className="w-[140px] px-4 text-sm font-semibold text-slate-900">
            <span className="inline-flex items-center">创建人<HeaderIcon type="filter" /></span>
          </TableHead>
          <TableHead className="w-[180px] px-4 text-sm font-semibold text-slate-900">
            <span className="inline-flex items-center">更新时间<HeaderIcon type="sort" /></span>
          </TableHead>
          <TableHead className="w-[120px] px-4 text-sm font-semibold text-slate-900">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} className="h-[62px] border-slate-200 bg-white hover:bg-slate-50/40">
            <TableCell className="px-4 py-2 align-middle">
              <NameCell panel="database" name={row.name} />
            </TableCell>
            <TableCell className="px-4 py-2 align-middle text-sm text-slate-800">{row.dbType}</TableCell>
            <TableCell className="px-4 py-2 align-middle">
              <DescriptionCell>{row.description}</DescriptionCell>
            </TableCell>
            <TableCell className="px-4 py-2 align-middle text-sm text-slate-700">
              <span className="block max-w-[120px] truncate" title={row.creator}>{row.creator}</span>
            </TableCell>
            <TableCell className="px-4 py-2 align-middle text-sm text-slate-700">{row.updatedAt}</TableCell>
            <TableCell className="px-4 py-2 align-middle">
              <RowActions rowName={row.name} onRemove={() => onDelete(row.id)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function OntologyTable({
  rows,
  onDelete,
}: {
  rows: OntologyObjectRow[];
  onDelete: (id: string) => void;
}) {
  return (
    <Table className="min-w-[1080px] table-fixed">
      <TableHeader>
        <TableRow className="border-slate-200 hover:bg-transparent">
          <TableHead className="w-[300px] px-4 text-sm font-semibold text-slate-900">本体对象名称</TableHead>
          <TableHead className="w-[140px] px-4 text-sm font-semibold text-slate-900">本体场景</TableHead>
          <TableHead className="w-[320px] px-4 text-sm font-semibold text-slate-900">描述</TableHead>
          <TableHead className="w-[140px] px-4 text-sm font-semibold text-slate-900">
            <span className="inline-flex items-center">创建人<HeaderIcon type="filter" /></span>
          </TableHead>
          <TableHead className="w-[180px] px-4 text-sm font-semibold text-slate-900">
            <span className="inline-flex items-center">更新时间<HeaderIcon type="sort" /></span>
          </TableHead>
          <TableHead className="w-[120px] px-4 text-sm font-semibold text-slate-900">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} className="h-[62px] border-slate-200 bg-white hover:bg-slate-50/40">
            <TableCell className="px-4 py-2 align-middle">
              <NameCell panel="ontology" name={row.name} />
            </TableCell>
            <TableCell className="px-4 py-2 align-middle text-sm text-slate-800">{row.scene}</TableCell>
            <TableCell className="px-4 py-2 align-middle">
              <DescriptionCell>{row.description}</DescriptionCell>
            </TableCell>
            <TableCell className="px-4 py-2 align-middle text-sm text-slate-700">
              <span className="block max-w-[120px] truncate" title={row.creator}>{row.creator}</span>
            </TableCell>
            <TableCell className="px-4 py-2 align-middle text-sm text-slate-700">{row.updatedAt}</TableCell>
            <TableCell className="px-4 py-2 align-middle">
              <RowActions rowName={row.name} onRemove={() => onDelete(row.id)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TermBankTable({
  rows,
  onDelete,
}: {
  rows: TermBankRow[];
  onDelete: (id: string) => void;
}) {
  return (
    <Table className="min-w-[980px] table-fixed">
      <TableHeader>
        <TableRow className="border-slate-200 hover:bg-transparent">
          <TableHead className="w-[340px] px-4 text-sm font-semibold text-slate-900">术语库名称</TableHead>
          <TableHead className="w-[360px] px-4 text-sm font-semibold text-slate-900">描述</TableHead>
          <TableHead className="w-[140px] px-4 text-sm font-semibold text-slate-900">
            <span className="inline-flex items-center">创建人<HeaderIcon type="filter" /></span>
          </TableHead>
          <TableHead className="w-[180px] px-4 text-sm font-semibold text-slate-900">
            <span className="inline-flex items-center">更新时间<HeaderIcon type="sort" /></span>
          </TableHead>
          <TableHead className="w-[120px] px-4 text-sm font-semibold text-slate-900">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} className="h-[62px] border-slate-200 bg-white hover:bg-slate-50/40">
            <TableCell className="px-4 py-2 align-middle">
              <NameCell panel="term-bank" name={row.name} />
            </TableCell>
            <TableCell className="px-4 py-2 align-middle">
              <DescriptionCell>{row.description}</DescriptionCell>
            </TableCell>
            <TableCell className="px-4 py-2 align-middle text-sm text-slate-700">
              <span className="block max-w-[120px] truncate" title={row.creator}>{row.creator}</span>
            </TableCell>
            <TableCell className="px-4 py-2 align-middle text-sm text-slate-700">{row.updatedAt}</TableCell>
            <TableCell className="px-4 py-2 align-middle">
              <RowActions rowName={row.name} onRemove={() => onDelete(row.id)} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

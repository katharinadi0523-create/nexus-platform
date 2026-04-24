"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  ClawKnowledgeAssets,
  DatabaseRow,
  KnowledgeBaseRow,
  OntologyObjectRow,
  TermBankRow,
} from "@/lib/mock/claw-hub-next";
import type { KnowledgePanelKey } from "@/components/claw-hub-next/detail/constants";
import { KNOWLEDGE_PANEL_ITEMS } from "@/components/claw-hub-next/detail/constants";

function EmptyKnowledgeState({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center text-sm text-slate-500">
      {label}
    </div>
  );
}

function RowActions({
  enabled,
  onToggle,
  onRemove,
  switchLabel,
}: {
  enabled: boolean;
  onToggle: (checked: boolean) => void;
  onRemove: () => void;
  switchLabel: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          aria-label={switchLabel}
          className="data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-200"
        />
      </div>
      <button type="button" onClick={onRemove} className="text-sm text-blue-600 hover:text-blue-700">
        移除
      </button>
    </div>
  );
}

function CapabilityTableShell({ children }: { children: ReactNode }) {
  return <section className="overflow-hidden rounded-[6px] border border-slate-200 bg-white">{children}</section>;
}

export interface ClawKnowledgeAssetsSectionProps {
  activePanel: KnowledgePanelKey;
  assets: ClawKnowledgeAssets;
  onToggleKnowledgeBase: (id: string, enabled: boolean) => void;
  onDeleteKnowledgeBase: (id: string) => void;
  onToggleDatabase: (id: string, enabled: boolean) => void;
  onDeleteDatabase: (id: string) => void;
  onToggleOntology: (id: string, enabled: boolean) => void;
  onDeleteOntology: (id: string) => void;
  onToggleTermBank: (id: string, enabled: boolean) => void;
  onDeleteTermBank: (id: string) => void;
  onOpenKnowledgeBaseConfig: () => void;
  onOpenDatabaseConfig: () => void;
  onOpenOntologyConfig: () => void;
  onOpenTermBankConfig: () => void;
}

export function ClawKnowledgeAssetsSection({
  activePanel,
  assets,
  onToggleKnowledgeBase,
  onDeleteKnowledgeBase,
  onToggleDatabase,
  onDeleteDatabase,
  onToggleOntology,
  onDeleteOntology,
  onToggleTermBank,
  onDeleteTermBank,
  onOpenKnowledgeBaseConfig,
  onOpenDatabaseConfig,
  onOpenOntologyConfig,
  onOpenTermBankConfig,
}: ClawKnowledgeAssetsSectionProps) {
  const meta = KNOWLEDGE_PANEL_ITEMS.find((item) => item.key === activePanel)!;

  const actionMap: Record<KnowledgePanelKey, () => void> = {
    "knowledge-base": onOpenKnowledgeBaseConfig,
    database: onOpenDatabaseConfig,
    ontology: onOpenOntologyConfig,
    "term-bank": onOpenTermBankConfig,
  };

  const actionLabelMap: Record<KnowledgePanelKey, string> = {
    "knowledge-base": "配置知识库",
    database: "配置数据库",
    ontology: "配置本体对象",
    "term-bank": "配置术语库",
  };

  const totalCount =
    activePanel === "knowledge-base"
      ? assets.knowledgeBases.length
      : activePanel === "database"
        ? assets.databases.length
        : activePanel === "ontology"
          ? assets.ontologyObjects.length
          : assets.termBanks.length;

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-base font-semibold text-slate-950">{meta.label}</div>
            <div className="text-sm text-slate-400">{totalCount} 项</div>
          </div>
          <div className="mt-1 text-sm text-slate-500">{meta.description}</div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 self-start rounded-md shadow-none"
          onClick={actionMap[activePanel]}
        >
          <Plus className="h-4 w-4" />
          {actionLabelMap[activePanel]}
        </Button>
      </div>

      {activePanel === "knowledge-base" ? (
        assets.knowledgeBases.length ? (
          <CapabilityTableShell>
            <Table className="min-w-[960px]">
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-200 hover:bg-slate-50">
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">知识库名称</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">知识库描述</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">创建人</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">更新时间</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.knowledgeBases.map((row: KnowledgeBaseRow) => (
                  <TableRow key={row.id} className={cn("border-slate-200 bg-white hover:bg-slate-50/40")}>
                    <TableCell className="px-4 py-3 align-middle">
                      <div className="text-[15px] font-medium text-slate-900">{row.name}</div>
                    </TableCell>
                    <TableCell className="max-w-[420px] whitespace-normal px-4 py-3 align-middle text-sm leading-6 text-slate-600">
                      {row.description}
                    </TableCell>
                    <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">{row.creator}</TableCell>
                    <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">{row.updatedAt}</TableCell>
                    <TableCell className="px-4 py-3 align-middle">
                      <RowActions
                        enabled={row.enabled}
                        onToggle={(checked) => onToggleKnowledgeBase(row.id, checked)}
                        onRemove={() => onDeleteKnowledgeBase(row.id)}
                        switchLabel={`${row.name} 启停`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CapabilityTableShell>
        ) : (
          <EmptyKnowledgeState label="当前还没有知识库。" />
        )
      ) : null}

      {activePanel === "database" ? (
        assets.databases.length ? (
          <CapabilityTableShell>
            <Table className="min-w-[960px]">
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-200 hover:bg-slate-50">
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">数据库名称</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">数据库描述</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">数据库类型</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">创建人</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">更新时间</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.databases.map((row: DatabaseRow) => (
                  <TableRow key={row.id} className="border-slate-200 bg-white hover:bg-slate-50/40">
                    <TableCell className="px-4 py-3 align-middle">
                      <div className="text-[15px] font-medium text-slate-900">{row.name}</div>
                    </TableCell>
                    <TableCell className="max-w-[360px] whitespace-normal px-4 py-3 align-middle text-sm leading-6 text-slate-600">
                      {row.description}
                    </TableCell>
                    <TableCell className="px-4 py-3 align-middle text-sm text-slate-800">{row.dbType}</TableCell>
                    <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">{row.creator}</TableCell>
                    <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">{row.updatedAt}</TableCell>
                    <TableCell className="px-4 py-3 align-middle">
                      <RowActions
                        enabled={row.enabled}
                        onToggle={(checked) => onToggleDatabase(row.id, checked)}
                        onRemove={() => onDeleteDatabase(row.id)}
                        switchLabel={`${row.name} 启停`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CapabilityTableShell>
        ) : (
          <EmptyKnowledgeState label="当前还没有数据库。" />
        )
      ) : null}

      {activePanel === "ontology" ? (
        assets.ontologyObjects.length ? (
          <CapabilityTableShell>
            <Table className="min-w-[960px]">
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-200 hover:bg-slate-50">
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">本体对象名称</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">本体场景</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">创建人</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">更新时间</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.ontologyObjects.map((row: OntologyObjectRow) => (
                  <TableRow key={row.id} className="border-slate-200 bg-white hover:bg-slate-50/40">
                    <TableCell className="px-4 py-3 align-middle">
                      <div className="text-[15px] font-medium text-slate-900">{row.name}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">{row.scene}</TableCell>
                    <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">{row.creator}</TableCell>
                    <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">{row.updatedAt}</TableCell>
                    <TableCell className="px-4 py-3 align-middle">
                      <RowActions
                        enabled={row.enabled}
                        onToggle={(checked) => onToggleOntology(row.id, checked)}
                        onRemove={() => onDeleteOntology(row.id)}
                        switchLabel={`${row.name} 启停`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CapabilityTableShell>
        ) : (
          <EmptyKnowledgeState label="当前还没有本体对象。" />
        )
      ) : null}

      {activePanel === "term-bank" ? (
        assets.termBanks.length ? (
          <CapabilityTableShell>
            <Table className="min-w-[960px]">
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-200 hover:bg-slate-50">
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">术语库名称</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">术语库描述</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">创建人</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">更新时间</TableHead>
                  <TableHead className="h-10 px-4 text-sm font-medium text-slate-700">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.termBanks.map((row: TermBankRow) => (
                  <TableRow key={row.id} className="border-slate-200 bg-white hover:bg-slate-50/40">
                    <TableCell className="px-4 py-3 align-middle">
                      <div className="text-[15px] font-medium text-slate-900">{row.name}</div>
                    </TableCell>
                    <TableCell className="max-w-[420px] whitespace-normal px-4 py-3 align-middle text-sm leading-6 text-slate-600">
                      {row.description}
                    </TableCell>
                    <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">{row.creator}</TableCell>
                    <TableCell className="px-4 py-3 align-middle text-sm text-slate-700">{row.updatedAt}</TableCell>
                    <TableCell className="px-4 py-3 align-middle">
                      <RowActions
                        enabled={row.enabled}
                        onToggle={(checked) => onToggleTermBank(row.id, checked)}
                        onRemove={() => onDeleteTermBank(row.id)}
                        switchLabel={`${row.name} 启停`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CapabilityTableShell>
        ) : (
          <EmptyKnowledgeState label="当前还没有术语库。" />
        )
      ) : null}
    </div>
  );
}

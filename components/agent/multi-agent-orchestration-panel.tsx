"use client";

import { useState } from "react";
import {
  ChevronRight,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CapabilityAgentItem } from "@/lib/mock/claw-hub-next";

export const MULTI_AGENT_ROOT_NODE_ID = "main-agent";

export type MultiAgentOrchestrationPanelProps = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  rootLabel?: string;
  subAgents: CapabilityAgentItem[];
  onAddSubAgent: () => void;
  onRemoveSubAgent: (agentId: string) => void;
};

/**
 * 多智能体「主智能体配置」中间树形编排面板，支持向左收起/展开。
 */
export function MultiAgentOrchestrationPanel({
  collapsed,
  onCollapsedChange,
  selectedNodeId,
  onSelectNode,
  rootLabel = "主智能体",
  subAgents,
  onAddSubAgent,
  onRemoveSubAgent,
}: MultiAgentOrchestrationPanelProps) {
  const [treeExpanded, setTreeExpanded] = useState(true);
  const [pendingDeleteAgent, setPendingDeleteAgent] = useState<CapabilityAgentItem | null>(null);

  const confirmDelete = () => {
    if (!pendingDeleteAgent) return;
    onRemoveSubAgent(pendingDeleteAgent.id);
    setPendingDeleteAgent(null);
  };

  if (collapsed) {
    return (
      <aside className="hidden w-10 shrink-0 flex-col items-center border-r border-slate-200 bg-white py-3 md:flex">
        <button
          type="button"
          onClick={() => onCollapsedChange(false)}
          aria-label="展开智能体编排"
          title="展开智能体编排"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
        <div
          className="mt-4 text-[11px] font-medium tracking-wide text-slate-400"
          style={{ writingMode: "vertical-rl" }}
        >
          智能体编排
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200 px-3">
          <div className="text-sm font-semibold text-slate-900">智能体编排</div>
          <button
            type="button"
            onClick={() => onCollapsedChange(true)}
            aria-label="收起智能体编排"
            title="向左收起"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          <div className="space-y-0.5">
            <div className="group flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setTreeExpanded((v) => !v)}
                aria-label={treeExpanded ? "收起子节点" : "展开子节点"}
                className="inline-flex h-7 w-5 shrink-0 items-center justify-center rounded text-slate-400 hover:text-slate-600"
              >
                <ChevronRight
                  className={cn("h-3.5 w-3.5 transition-transform", treeExpanded && "rotate-90")}
                />
              </button>
              <button
                type="button"
                onClick={() => onSelectNode(MULTI_AGENT_ROOT_NODE_ID)}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors",
                  selectedNodeId === MULTI_AGENT_ROOT_NODE_ID
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Network
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    selectedNodeId === MULTI_AGENT_ROOT_NODE_ID ? "text-blue-600" : "text-slate-400"
                  )}
                />
                <span className="min-w-0 truncate">{rootLabel}</span>
              </button>
              <button
                type="button"
                onClick={onAddSubAgent}
                aria-label="添加子智能体"
                title="添加子智能体"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 transition-all hover:bg-blue-50 hover:text-blue-600 group-hover:opacity-100"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {treeExpanded
              ? subAgents.map((agent) => {
                  const isActive = selectedNodeId === agent.id;
                  const isEnabled = agent.enabled !== false;
                  return (
                    <div key={agent.id} className="group flex items-center gap-0.5 pl-5">
                      <span className="w-5 shrink-0" aria-hidden />
                      <button
                        type="button"
                        onClick={() => onSelectNode(agent.id)}
                        className={cn(
                          "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors",
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : isEnabled
                              ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                              : "text-slate-400 hover:bg-slate-50 hover:text-slate-500"
                        )}
                      >
                        <Network
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            isActive ? "text-blue-600" : isEnabled ? "text-slate-400" : "text-slate-300"
                          )}
                        />
                        <span className={cn("min-w-0 truncate", !isEnabled && "line-through decoration-slate-300")}>
                          {agent.name}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteAgent(agent)}
                        aria-label={`删除 ${agent.name}`}
                        title="删除子智能体"
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              : null}
          </div>
        </nav>
      </aside>

      <Dialog
        open={Boolean(pendingDeleteAgent)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteAgent(null);
        }}
      >
        <DialogContent className="max-w-[400px] gap-0 border-slate-200 p-0">
          <DialogHeader className="border-b border-slate-100 px-5 py-4">
            <DialogTitle className="text-base font-semibold text-slate-900">删除子智能体</DialogTitle>
          </DialogHeader>
          <div className="px-5 py-5 text-sm leading-6 text-slate-600">
            是否删除该子智能体
            {pendingDeleteAgent?.name ? (
              <>
                「<span className="font-medium text-slate-900">{pendingDeleteAgent.name}</span>」
              </>
            ) : null}
            ？删除后不可恢复。
          </div>
          <DialogFooter className="border-t border-slate-100 bg-slate-50/80 px-5 py-3">
            <Button
              type="button"
              variant="outline"
              className="h-9 border-slate-200"
              onClick={() => setPendingDeleteAgent(null)}
            >
              取消
            </Button>
            <Button
              type="button"
              className="h-9 bg-rose-600 text-white hover:bg-rose-700"
              onClick={confirmDelete}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

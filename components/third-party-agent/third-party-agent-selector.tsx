"use client";

import { useMemo, useState } from "react";
import { Bot, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SecurityLevelBadge } from "@/components/security/security-level-badge";
import { THIRD_PARTY_AGENTS, type ThirdPartyAgentRecord } from "@/lib/mock/third-party-agents";
import { getSecurityLevelRank, type SecurityLevel } from "@/lib/security-level";
import { cn } from "@/lib/utils";

export function ThirdPartyAgentSelector({
  open,
  onOpenChange,
  callerSecurityLevel,
  selectedIds,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callerSecurityLevel: SecurityLevel;
  selectedIds: string[];
  onSelect: (agent: ThirdPartyAgentRecord) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const candidates = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return THIRD_PARTY_AGENTS.filter((item) =>
      item.usePermission
      && item.status === "已启用"
      && getSecurityLevelRank(item.securityLevel) <= getSecurityLevelRank(callerSecurityLevel)
      && (!keyword || `${item.name}${item.description}${item.protocol}${item.interfaceSpec}`.toLowerCase().includes(keyword))
    );
  }, [callerSecurityLevel, query]);
  const selected = candidates.find((item) => item.id === selectedId);

  const confirm = () => {
    if (!selected) return;
    onSelect(selected);
    setSelectedId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>引用第三方 Agent</DialogTitle>
          <DialogDescription>仅展示当前对象有使用权限、符合密级要求且已启用的资源。</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索名称、描述或接口类型" className="pl-9" />
        </div>
        <div className="space-y-2">
          {candidates.map((item) => {
            const alreadySelected = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={alreadySelected}
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  "w-full rounded-lg border p-4 text-left transition-colors",
                  alreadySelected && "cursor-not-allowed bg-slate-50 opacity-60",
                  !alreadySelected && selectedId === item.id && "border-blue-500 bg-blue-50",
                  !alreadySelected && selectedId !== item.id && "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><Bot className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{item.name}</span>
                      <span className="rounded bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">第三方</span>
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">{item.protocol === "A2A" ? "A2A" : "API"}</span>
                      {item.protocol !== "A2A" ? <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{formatInterfaceSpec(item.interfaceSpec)}</span> : null}
                      <SecurityLevelBadge level={item.securityLevel} />
                      {alreadySelected ? <span className="text-xs text-slate-400">已引用</span> : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{item.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
          {candidates.length === 0 ? <div className="rounded-lg border border-dashed border-slate-200 px-4 py-12 text-center text-sm text-slate-400">暂无符合条件的第三方 Agent</div> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button disabled={!selected} onClick={confirm} className="bg-blue-600 text-white hover:bg-blue-700">确认引用</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatInterfaceSpec(interfaceSpec: ThirdPartyAgentRecord["interfaceSpec"]): string {
  if (interfaceSpec === "Chat Completions") return "OpenAI Chat Completions";
  if (interfaceSpec === "Responses") return "OpenAI Responses";
  return interfaceSpec;
}

"use client";

import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getMarketplaceSkillConfigOptions } from "@/lib/mock/skills-marketplace";
import { cn } from "@/lib/utils";

export interface SkillConfigSelection {
  id: string;
  name: string;
  description: string;
  sizeLabel: string;
}

interface SkillConfigOption extends SkillConfigSelection {
  badge: string;
  hint: string;
}

interface SkillConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selections: SkillConfigSelection[]) => void;
}

const SKILL_CONFIG_OPTIONS: SkillConfigOption[] = getMarketplaceSkillConfigOptions();

export function SkillConfigDialog({ open, onOpenChange, onConfirm }: SkillConfigDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return SKILL_CONFIG_OPTIONS;
    }

    return SKILL_CONFIG_OPTIONS.filter((item) =>
      [item.name, item.description, item.badge, item.hint]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [searchQuery]);

  function handleToggleSelection(id: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id];
      }

      return current.filter((item) => item !== id);
    });
  }

  function resetDialogState() {
    setSearchQuery("");
    setSelectedIds([]);
  }

  function handleSubmit() {
    const selections = SKILL_CONFIG_OPTIONS.filter((item) => selectedIds.includes(item.id));
    resetDialogState();
    onConfirm(selections);
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetDialogState();
    }

    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-[1040px] gap-0 overflow-hidden rounded-[32px] border-slate-200 p-0 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.35)]">
        <DialogHeader className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(240,249,255,0.94),rgba(255,255,255,0.98))] px-6 py-5">
          <DialogTitle className="text-left text-xl text-slate-950">配置技能</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
              <Sparkles className="h-4 w-4" />
              可从已发布 Skill 列表中选择绑定
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索 Skill 名称或说明"
                className="h-11 rounded-[16px] border-slate-200 bg-white pl-9 shadow-none"
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white">
            <ScrollArea className="h-[460px]">
              <div className="space-y-3 p-4">
                {filteredOptions.length ? (
                  filteredOptions.map((item) => {
                    const checked = selectedIds.includes(item.id);

                    return (
                      <label
                        key={item.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-4 rounded-[22px] border px-4 py-4 transition-all",
                          checked
                            ? "border-sky-200 bg-sky-50/80"
                            : "border-slate-200 bg-slate-50/70 hover:border-sky-100 hover:bg-white"
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => handleToggleSelection(item.id, Boolean(value))}
                          className="mt-0.5"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-base font-semibold text-slate-950">{item.name}</div>
                              <div className="mt-1 text-sm leading-6 text-slate-600">{item.description}</div>
                            </div>
                            <Badge className="border-slate-200 bg-white text-slate-600">{item.badge}</Badge>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>{item.sizeLabel}</span>
                            <span>{item.hint}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center text-sm text-slate-400">
                    暂无匹配的 Skill，可尝试更换搜索词。
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 bg-slate-50/80 px-6 py-4">
          <Button variant="ghost" onClick={() => handleDialogOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedIds.length}>
            添加到 Claw配置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

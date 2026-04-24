"use client";

import { useDeferredValue, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { type SkillMarketplaceItem, skillMarketplaceItems } from "@/lib/mock/skill-marketplace";

function getSourceLabel(sourceType: SkillMarketplaceItem["sourceType"]) {
  return sourceType === "platform" ? "平台精选" : "我的组织";
}

function getSourceClass(sourceType: SkillMarketplaceItem["sourceType"]) {
  return sourceType === "platform"
    ? "border-sky-200 bg-sky-50 text-sky-700"
    : "border-slate-200 bg-slate-100 text-slate-700";
}

export function SkillMarketplacePickerDialog({
  open,
  onOpenChange,
  selectedIds,
  onSelect,
  title = "从技能广场添加技能",
  description = "选择资源管理 - 技能广场中已存在的技能，添加到当前 Claw 配置中。",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSelect: (item: SkillMarketplaceItem) => void;
  title?: string;
  description?: string;
}) {
  const [keyword, setKeyword] = useState("");
  const deferredKeyword = useDeferredValue(keyword);
  const normalizedKeyword = deferredKeyword.trim().toLowerCase();

  const filteredItems = skillMarketplaceItems.filter((item) => {
    if (!normalizedKeyword) return true;
    return (
      item.name.toLowerCase().includes(normalizedKeyword) ||
      item.author.toLowerCase().includes(normalizedKeyword) ||
      item.description.toLowerCase().includes(normalizedKeyword) ||
      item.tags.some((tag) => tag.toLowerCase().includes(normalizedKeyword))
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索技能名称、作者、说明或标签"
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[420px] rounded-2xl border border-slate-200">
          <div className="space-y-3 p-3">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const alreadySelected = selectedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-2xl border p-4 transition-colors",
                      alreadySelected ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white"
                    )}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-base font-semibold text-slate-950">{item.name}</div>
                          <Badge className={cn("rounded-full border", getSourceClass(item.sourceType))}>
                            {getSourceLabel(item.sourceType)}
                          </Badge>
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                            {item.category}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-500">作者：{item.author}</div>
                        <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="border-slate-200 bg-white text-slate-600">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button
                        variant={alreadySelected ? "outline" : "default"}
                        className={cn(alreadySelected ? "border-slate-200 text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800")}
                        disabled={alreadySelected}
                        onClick={() => {
                          onSelect(item);
                          onOpenChange(false);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        {alreadySelected ? "已添加" : "添加技能"}
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                <div className="text-base font-semibold text-slate-900">没有匹配到技能</div>
                <div className="mt-2 text-sm text-slate-500">换个关键词试试，或者直接浏览技能广场已有技能。</div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

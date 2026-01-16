"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Minus, Plus, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TagTreeItem {
  key: string;
  label: string;
  values: string[];
}

interface TagTreeSelectorProps {
  value?: string[];
  onChange?: (selectedTags: string[]) => void;
  options: TagTreeItem[];
  placeholder?: string;
  className?: string;
}

// Mock data based on design
const mockTagTree: TagTreeItem[] = [
  {
    key: "南航",
    label: "南航",
    values: ["PPT", "客服", "行业通识"],
  },
  {
    key: "水利设备",
    label: "水利设备",
    values: ["故障手册", "SOP"],
  },
];

export function TagTreeSelector({
  value = [],
  onChange,
  options = mockTagTree,
  placeholder = "请输入标签搜索或选择标签",
  className,
}: TagTreeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    new Set(options.map((item) => item.key))
  );

  const toggleExpand = (key: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
  };

  const handleTagToggle = (tag: string) => {
    const newValue = value.includes(tag)
      ? value.filter((t) => t !== tag)
      : [...value, tag];
    onChange?.(newValue);
  };

  // Filter options based on search
  const filteredOptions = searchQuery
    ? options.map((item) => ({
        ...item,
        values: item.values.filter(
          (v) =>
            v.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.label.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
    : options;

  const selectedTagsDisplay = value.slice(0, 3);
  const remainingCount = Math.max(0, value.length - 3);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex h-9 w-full min-h-[36px] items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            className
          )}
        >
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {selectedTagsDisplay.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {selectedTagsDisplay.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-0.5 text-xs text-white"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTagToggle(tag);
                      }}
                      className="hover:bg-blue-700 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {remainingCount > 0 && (
                  <span className="text-xs text-slate-500">
                    +{remainingCount}
                  </span>
                )}
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0"
        align="start"
        sideOffset={4}
      >
        <div className="flex flex-col">
          {/* Search */}
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="搜索标签"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Tree */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {filteredOptions.map((item) => {
              const isExpanded = expandedKeys.has(item.key);
              const hasVisibleValues = item.values.length > 0;

              return (
                <div key={item.key} className="mb-2">
                  {/* Key Header */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.key)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
                  >
                    {hasVisibleValues ? (
                      isExpanded ? (
                        <Minus className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )
                    ) : (
                      <div className="h-4 w-4" />
                    )}
                    <span className="flex-1 text-left font-medium text-slate-700">
                      {item.label}
                    </span>
                  </button>

                  {/* Values */}
                  {isExpanded && hasVisibleValues && (
                    <div className="ml-6 space-y-1">
                      {item.values.map((val) => {
                        const isChecked = value.includes(val);
                        return (
                          <div
                            key={val}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-blue-50",
                              isChecked && "bg-blue-50"
                            )}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => handleTagToggle(val)}
                              id={`tag-${item.key}-${val}`}
                            />
                            <label
                              htmlFor={`tag-${item.key}-${val}`}
                              className="flex-1 cursor-pointer text-sm text-slate-700"
                            >
                              {val}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t p-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                // Navigate to tag management
                setOpen(false);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              标签管理
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

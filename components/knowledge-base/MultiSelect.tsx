"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  value?: string[];
  onChange?: (selected: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  value = [],
  onChange,
  options,
  placeholder = "请选择",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange?.(newValue);
  };

  const removeTag = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = value.filter((v) => v !== optionValue);
    onChange?.(newValue);
  };

  const selectedOptions = options.filter((opt) => value.includes(opt.value));
  const displayTags = selectedOptions.slice(0, 3);
  const remainingCount = Math.max(0, selectedOptions.length - 3);

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
            {displayTags.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {displayTags.map((option) => (
                  <span
                    key={option.value}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-0.5 text-xs text-white"
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={(e) => removeTag(option.value, e)}
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
        className="w-[var(--radix-popover-trigger-width)] p-1"
        align="start"
      >
        <div className="max-h-[300px] overflow-auto">
          {options.map((option) => {
            const isChecked = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleToggle(option.value)}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  isChecked && "bg-accent"
                )}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => handleToggle(option.value)}
                  className="mr-2"
                />
                <span className="flex-1 text-left">{option.label}</span>
                {isChecked && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

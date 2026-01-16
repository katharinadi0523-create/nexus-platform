"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectableCardProps {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}

export function SelectableCard({
  title,
  description,
  selected,
  onSelect,
  className,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-full rounded-lg border-2 p-4 text-left transition-all hover:border-blue-300 h-full flex flex-col",
        selected
          ? "border-blue-600 bg-blue-50"
          : "border-slate-200 bg-white hover:bg-slate-50",
        className
      )}
    >
      {selected && (
        <div className="absolute right-3 top-3">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
      <h3
        className={cn(
          "mb-1 text-sm font-semibold pr-6",
          selected ? "text-blue-600" : "text-slate-900"
        )}
      >
        {title}
      </h3>
      <p className="text-xs text-slate-500 flex-1">{description}</p>
    </button>
  );
}

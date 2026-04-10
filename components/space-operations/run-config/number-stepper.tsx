"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface NumberStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  suffix,
  disabled,
  className,
  inputClassName,
}: NumberStepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div
        className={cn(
          "inline-flex h-9 items-stretch overflow-hidden rounded-md border border-slate-200 bg-white shadow-xs",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="h-9 w-9 shrink-0 rounded-none border-0 border-r border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          disabled={disabled || value <= min}
          onClick={() => onChange(clamp(value - step))}
          aria-label="减少"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <input
          type="text"
          inputMode="numeric"
          value={Number.isFinite(value) ? String(value) : ""}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            if (raw === "") {
              onChange(min);
              return;
            }
            onChange(clamp(Number.parseInt(raw, 10)));
          }}
          className={cn(
            "h-9 w-[72px] border-0 bg-transparent text-center text-sm font-medium text-slate-900 outline-none focus-visible:ring-0",
            inputClassName
          )}
          disabled={disabled}
          aria-label="数值"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="h-9 w-9 shrink-0 rounded-none border-0 border-l border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          disabled={disabled || value >= max}
          onClick={() => onChange(clamp(value + step))}
          aria-label="增加"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {suffix ? <span className="text-sm text-slate-600 tabular-nums">{suffix}</span> : null}
    </div>
  );
}

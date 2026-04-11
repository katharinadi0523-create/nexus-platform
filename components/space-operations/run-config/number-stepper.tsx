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
          "inline-flex h-8 items-stretch overflow-hidden rounded border border-[#cbd5e1] bg-white transition-colors hover:border-[#2773ff]/50",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8 shrink-0 rounded-none border-0 border-r border-[#cbd5e1] text-[#5a6779] hover:bg-[#f8f9fb] hover:text-[#1e293b]"
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
            "h-8 w-[72px] border-0 bg-transparent text-center text-xs font-medium text-[#1e293b] outline-none focus-visible:ring-0",
            inputClassName
          )}
          disabled={disabled}
          aria-label="数值"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8 shrink-0 rounded-none border-0 border-l border-[#cbd5e1] text-[#5a6779] hover:bg-[#f8f9fb] hover:text-[#1e293b]"
          disabled={disabled || value >= max}
          onClick={() => onChange(clamp(value + step))}
          aria-label="增加"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {suffix ? <span className="text-xs tabular-nums text-[#5a6779]">{suffix}</span> : null}
    </div>
  );
}

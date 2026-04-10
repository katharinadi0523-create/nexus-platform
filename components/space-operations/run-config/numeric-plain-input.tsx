"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface NumericPlainInputProps {
  id?: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

/** 无步进器的大数字输入，样式参考训练类表单单行输入 */
export function NumericPlainInput({
  id,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  suffix,
  disabled,
  className,
  inputClassName,
}: NumericPlainInputProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={Number.isFinite(value) ? String(value) : ""}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, "");
          if (raw === "") {
            onChange(min);
            return;
          }
          const n = Number.parseInt(raw, 10);
          if (!Number.isNaN(n)) {
            onChange(clamp(n));
          }
        }}
        className={cn(
          "h-9 w-[220px] max-w-full border-slate-200 bg-white text-left text-sm font-medium text-slate-900 shadow-xs",
          "focus-visible:border-sky-300 focus-visible:ring-[3px] focus-visible:ring-sky-200/50",
          inputClassName
        )}
      />
      {suffix ? <span className="text-sm text-slate-600 tabular-nums">{suffix}</span> : null}
    </div>
  );
}

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
          "h-8 w-[220px] max-w-full rounded border border-[#cbd5e1] bg-white text-left text-xs font-medium text-[#1e293b] shadow-none",
          "transition-[border-color,box-shadow] duration-100",
          "focus-visible:border-[#2773ff] focus-visible:ring-2 focus-visible:ring-[#2773ff]/20",
          inputClassName
        )}
      />
      {suffix ? <span className="text-xs tabular-nums text-[#5a6779]">{suffix}</span> : null}
    </div>
  );
}

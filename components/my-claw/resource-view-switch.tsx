"use client";

import { cn } from "@/lib/utils";

export type ResourceView = "plaza" | "mine";

export function ResourceViewSwitch({
  activeView,
  onChange,
  plazaLabel,
  mineLabel,
}: {
  activeView: ResourceView;
  onChange: (view: ResourceView) => void;
  plazaLabel: string;
  mineLabel: string;
}) {
  return (
    <span
      role="group"
      aria-label={`${plazaLabel}与${mineLabel}切换`}
      className="inline-flex items-center gap-3 align-middle"
    >
      <button
        type="button"
        aria-pressed={activeView === "plaza"}
        onClick={() => onChange("plaza")}
        className={cn(
          "text-[22px] leading-7 transition-colors focus-visible:outline-none focus-visible:underline focus-visible:decoration-slate-400 focus-visible:decoration-2 focus-visible:underline-offset-4",
          activeView === "plaza"
            ? "font-semibold text-slate-900"
            : "font-medium text-slate-500 hover:text-slate-800"
        )}
      >
        {plazaLabel}
      </button>
      <span aria-hidden="true" className="h-5 w-px bg-slate-300" />
      <button
        type="button"
        aria-pressed={activeView === "mine"}
        onClick={() => onChange("mine")}
        className={cn(
          "text-[22px] leading-7 transition-colors focus-visible:outline-none focus-visible:underline focus-visible:decoration-slate-400 focus-visible:decoration-2 focus-visible:underline-offset-4",
          activeView === "mine"
            ? "font-semibold text-slate-900"
            : "font-medium text-slate-500 hover:text-slate-800"
        )}
      >
        {mineLabel}
      </button>
    </span>
  );
}

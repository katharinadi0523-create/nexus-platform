"use client";

import { Sparkles } from "lucide-react";
import type { CapabilityScope, CapabilitySkillItem } from "@/lib/mock/claw-hub-next";
import { CAPABILITY_SCOPE_LABELS } from "@/components/claw-hub-next/detail/constants";
import { cn } from "@/lib/utils";
import { useWorkbenchEntity } from "@/components/claw-hub-next/workbench-entity-context";

export type ConfiguredSkillOption = CapabilitySkillItem & {
  scope: CapabilityScope;
};

export function detectSkillSlashCommand(
  text: string,
  cursor: number
): { query: string; startIndex: number } | null {
  const before = text.slice(0, cursor);
  const match = before.match(/(?:^|\s)\/([^\s]*)$/);

  if (!match) {
    return null;
  }

  const query = match[1] ?? "";
  const startIndex = before.length - query.length - 1;

  return { query, startIndex };
}

export function filterConfiguredSkills(
  skills: ConfiguredSkillOption[],
  query: string
): ConfiguredSkillOption[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return skills;
  }

  return skills.filter((skill) =>
    [skill.name, skill.description, CAPABILITY_SCOPE_LABELS[skill.scope]]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

interface SkillSlashPickerProps {
  skills: ConfiguredSkillOption[];
  query: string;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onSelect: (skill: ConfiguredSkillOption) => void;
}

export function SkillSlashPicker({
  skills,
  query,
  activeIndex,
  onActiveIndexChange,
  onSelect,
}: SkillSlashPickerProps) {
  const { entityLabel, configLabel } = useWorkbenchEntity();
  const filteredSkills = filterConfiguredSkills(skills, query);
  const safeActiveIndex =
    filteredSkills.length === 0 ? 0 : Math.min(activeIndex, filteredSkills.length - 1);

  return (
    <div
      role="listbox"
      aria-label="选择技能"
      className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-[0_12px_32px_rgba(37,99,235,0.12)]"
    >
      <div className="border-b border-blue-50 px-3 py-2.5">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span>选择技能</span>
          {query ? <span className="text-slate-400">· /{query}</span> : null}
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto p-1.5">
        {filteredSkills.length > 0 ? (
          filteredSkills.map((skill, index) => {
            const isActive = index === safeActiveIndex;

            return (
              <button
                key={`${skill.scope}-${skill.id}`}
                type="button"
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => onActiveIndexChange(index)}
                onClick={() => onSelect(skill)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition",
                  isActive ? "bg-blue-50" : "hover:bg-slate-50"
                )}
              >
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{skill.name}</span>
                    <span className="rounded-[4px] border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                      {skill.scope === "claw"
                        ? configLabel
                        : CAPABILITY_SCOPE_LABELS[skill.scope]}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">{skill.description}</span>
                </span>
              </button>
            );
          })
        ) : (
          <div className="px-3 py-6 text-center text-sm text-slate-400">
            {skills.length === 0
              ? `当前 ${entityLabel} 尚未配置可用技能`
              : "没有匹配的技能"}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowUp, BookOpen, ChevronDown, Mic, Paperclip } from "lucide-react";
import {
  detectSkillSlashCommand,
  filterConfiguredSkills,
  SkillSlashPicker,
  type ConfiguredSkillOption,
} from "@/components/claw-hub-next/skill-slash-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type { ClawDetailData } from "@/lib/mock/claw-hub-next";
import { cn } from "@/lib/utils";

type DebugChatComposerProps = {
  detail: ClawDetailData;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function DebugChatComposer({ detail, value, onChange, onSend }: DebugChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [skillMenuOpen, setSkillMenuOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [slashPicker, setSlashPicker] = useState<{ query: string; startIndex: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const configuredSkills = useMemo<ConfiguredSkillOption[]>(() => {
    const scopes = ["platform", "tenant", "claw"] as const;
    return scopes.flatMap((scope) =>
      detail.capabilityConfig.skills[scope]
        .filter((skill) => skill.enabled)
        .map((skill) => ({ ...skill, scope }))
    );
  }, [detail.capabilityConfig.skills]);
  const filteredSlashSkills = slashPicker
    ? filterConfiguredSkills(configuredSkills, slashPicker.query)
    : [];

  function syncSlashPicker(text: string, cursor: number) {
    setSlashPicker(detectSkillSlashCommand(text, cursor));
    setActiveIndex(0);
  }

  function selectSkill(skill: ConfiguredSkillOption, fromSlash: boolean) {
    setSelectedSkill(skill.name);
    setSkillMenuOpen(false);

    if (fromSlash && slashPicker) {
      const cursor = textareaRef.current?.selectionStart ?? value.length;
      const insertion = `/${skill.name} `;
      const nextValue = `${value.slice(0, slashPicker.startIndex)}${insertion}${value.slice(cursor)}`;
      onChange(nextValue);
      const nextCursor = slashPicker.startIndex + insertion.length;
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
      });
    }

    setSlashPicker(null);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (slashPicker && filteredSlashSkills.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, filteredSlashSkills.length - 1));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        selectSkill(filteredSlashSkills[activeIndex]!, true);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setSlashPicker(null);
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (value.trim()) onSend();
    }
  }

  return (
    <div className="relative rounded-2xl border border-slate-300 bg-white px-4 pb-3 pt-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-within:border-blue-300">
      {slashPicker ? (
        <div className="absolute bottom-full left-0 right-0 z-30 mb-2">
          <SkillSlashPicker
            skills={configuredSkills}
            query={slashPicker.query}
            activeIndex={activeIndex}
            onActiveIndexChange={setActiveIndex}
            onSelect={(skill) => selectSkill(skill, true)}
          />
        </div>
      ) : null}

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          syncSlashPicker(event.target.value, event.target.selectionStart ?? event.target.value.length);
        }}
        onClick={(event) => syncSlashPicker(event.currentTarget.value, event.currentTarget.selectionStart ?? event.currentTarget.value.length)}
        onKeyDown={handleKeyDown}
        placeholder="有问题，尽管提。输入 / 可选择技能"
        className="min-h-[76px] resize-none border-0 bg-transparent px-0 py-0 text-[15px] leading-7 shadow-none placeholder:text-slate-400 focus-visible:ring-0"
      />

      <div className="mt-2 flex items-center gap-2">
        <Popover open={skillMenuOpen} onOpenChange={setSkillMenuOpen}>
          <PopoverTrigger asChild>
            <button type="button" className="inline-flex h-9 max-w-[260px] items-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <BookOpen className="h-4 w-4" />
              <span className="truncate">{selectedSkill ? `技能 · ${selectedSkill}` : "技能"}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" sideOffset={8} className="w-[420px] border-0 bg-transparent p-0 shadow-none">
            <SkillSlashPicker skills={configuredSkills} query="" activeIndex={0} onActiveIndexChange={() => undefined} onSelect={(skill) => selectSkill(skill, false)} />
          </PopoverContent>
        </Popover>

        <div className="ml-auto flex items-center gap-1">
          <button type="button" title="上传附件" className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-50"><Paperclip className="h-4 w-4" /></button>
          <button type="button" title="语音输入" className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-50"><Mic className="h-4 w-4" /></button>
          <span className="mx-1 h-6 w-px bg-slate-200" />
          <button type="button" onClick={onSend} disabled={!value.trim()} aria-label="发送" className={cn("flex h-9 w-9 items-center justify-center rounded-md text-white", value.trim() ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300")}><ArrowUp className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

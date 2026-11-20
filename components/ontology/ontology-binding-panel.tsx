"use client";

import { Network, PencilLine, Plus, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OntologyAbilitySummary, OntologySceneIcon, OntologyStatGrid } from "@/components/ontology/ontology-binding-dialog";
import {
  getSceneById,
  maskKey,
  ONTOLOGY_PLATFORM_NAME,
  type OntologyBinding,
  type OntologyBindingScope,
} from "@/lib/mock/ontology-binding";

export interface OntologyBindingPanelProps {
  binding: OntologyBinding | null;
  scope: OntologyBindingScope;
  onBind: () => void;
  onEdit: () => void;
  onUnbind: () => void;
}

export function OntologyBindingPanel({ binding, scope, onBind, onEdit, onUnbind }: OntologyBindingPanelProps) {
  if (!binding) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#eef4ff] text-[#2773ff]">
          <Network className="h-5 w-5" />
        </div>
        <div className="mt-3 text-[15px] font-medium text-slate-900">还没有绑定本体</div>
        <p className="mx-auto mt-1 max-w-[460px] text-[13px] leading-6 text-slate-500">
          {scope === "personal"
            ? `填入${ONTOLOGY_PLATFORM_NAME}的 API Key，从本体场景库中绑定一个场景。主智能体会通过“本体助手”子智能体调用本体。`
            : `填入${ONTOLOGY_PLATFORM_NAME}的 API Key，从本体场景库中绑定一个场景。主智能体会通过“本体助手”子智能体调用本体，发布后使用者无需自己配置。`}
        </p>
        <Button size="sm" className="mt-4" onClick={onBind}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          绑定本体
        </Button>
      </div>
    );
  }

  const scene = getSceneById(binding.sceneId);
  const tone = scene?.tone ?? "blue";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <OntologySceneIcon scene={{ id: binding.sceneId, tone }} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[16px] font-semibold text-slate-900">{binding.sceneName}</span>
                <span className="rounded bg-[#e7f6ee] px-2 py-0.5 text-[11px] font-medium text-[#1d744a]">已连接</span>
              </div>
              <div className="mt-1 text-[12px] leading-5 text-slate-500">
                {binding.sceneUpdatedBy}更新于{binding.sceneUpdatedAt}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <PencilLine className="mr-1 h-3.5 w-3.5" />
              编辑
            </Button>
            <Button variant="outline" size="sm" onClick={onUnbind} className="text-slate-600">
              <Unlink className="mr-1 h-3.5 w-3.5" />
              解除绑定
            </Button>
          </div>
        </div>

        <div className="mt-4 max-w-[520px]">
          <OntologyStatGrid counts={binding.sceneCounts} />
        </div>

        {scene ? (
          <div className="mt-5 space-y-1.5">
            <div className="text-[13px] font-medium text-slate-700">本体能力</div>
            <OntologyAbilitySummary scene={scene} />
          </div>
        ) : null}

        <div className="mt-4 space-y-1.5">
          <div className="text-[13px] font-medium text-slate-700">补充说明</div>
          {binding.sceneDescription ? (
            <p className="rounded-lg bg-[#f6f8fb] px-3.5 py-3 text-[13px] leading-6 text-slate-700">{binding.sceneDescription}</p>
          ) : (
            <p className="text-[13px] text-slate-400">未填写，可在「编辑」中添加使用范围或注意事项</p>
          )}
        </div>

        <dl className="mt-5 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
          <div className="flex min-w-0 gap-2">
            <dt className="shrink-0 text-slate-500">API Key</dt>
            <dd className="truncate font-mono text-slate-800">{maskKey(binding.keyTail)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-slate-500">绑定时间</dt>
            <dd className="text-slate-800">{binding.boundAt}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

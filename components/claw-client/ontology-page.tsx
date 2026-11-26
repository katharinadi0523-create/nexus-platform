"use client";

import { useState } from "react";
import { toast } from "sonner";
import { OntologyBindingDialog } from "@/components/ontology/ontology-binding-dialog";
import { OntologyBindingPanel } from "@/components/ontology/ontology-binding-panel";
import { ONTOLOGY_PLATFORM_NAME, type OntologyBinding, useIsClient } from "@/lib/mock/ontology-binding";

const PERSONAL_BINDING_KEY = "nexus.of.personalBinding";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 原型：存储不可用时只保留内存状态
  }
}

/** 使用端「能力 › 本体」：和管控端一样，用自己的 OF Key 给个人 Claw 绑定一个场景。 */
export function MyClawOntologyPage() {
  const mounted = useIsClient();
  const [binding, setBinding] = useState<OntologyBinding | null>(() =>
  {
    if (typeof window === "undefined") return null;
    const stored = readJson<OntologyBinding | null>(PERSONAL_BINDING_KEY, null);
    // 旧版原型存的结构没有 sceneUpdatedBy，直接丢弃
    return stored && stored.sceneUpdatedBy ? stored : null;
  });
  const [dialog, setDialog] = useState({ open: false, key: 0 });

  function updateBinding(next: OntologyBinding | null) {
    setBinding(next);
    writeJson(PERSONAL_BINDING_KEY, next);
  }

  const openDialog = () => setDialog((d) => ({ open: true, key: d.key + 1 }));

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc]">
      <div className="mx-auto grid w-full max-w-[960px] gap-5 px-5 py-5 md:px-8">
        <header>
          <h1 className="text-[22px] font-semibold leading-7 text-slate-900">本体</h1>
          <p className="mt-1 text-[13px] leading-5 text-slate-500">
            用你在{ONTOLOGY_PLATFORM_NAME}创建的 API Key 绑定一个本体场景，只有你的 Claw 能用。一个 Claw 最多绑定一个场景。
          </p>
        </header>
        <OntologyBindingPanel
          binding={mounted ? binding : null}
          scope="personal"
          onBind={openDialog}
          onEdit={openDialog}
          onUnbind={() => {
            updateBinding(null);
            toast.success("已解除本体绑定。");
          }}
        />
      </div>

      {dialog.open ? (
        <OntologyBindingDialog
          key={dialog.key}
          open={dialog.open}
          onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
          scope="personal"
          initial={binding}
          onConfirm={(next) => {
            updateBinding(next);
            setDialog((d) => ({ ...d, open: false }));
            toast.success(`已为你的 Claw 绑定本体「${next.sceneName}」`);
          }}
        />
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes,
  Building2,
  Check,
  ExternalLink,
  FileCode2,
  Hexagon,
  Link2,
  Loader2,
  Lock,
  Package,
  Search,
  ShoppingCart,
  Truck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  buildBinding,
  maskKey,
  mockFetchSceneLibrary,
  MOCK_ONTOLOGY_SCENES,
  ONTOLOGY_KEY_GUIDE_URL,
  ONTOLOGY_PLATFORM_NAME,
  type OntologyBinding,
  type OntologyBindingScope,
  type OntologyScene,
  type OntologySceneTone,
} from "@/lib/mock/ontology-binding";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<OntologySceneTone, string> = {
  blue: "from-[#5b8cff] to-[#2f5bea]",
  indigo: "from-[#7c83ff] to-[#4b4fd6]",
  sky: "from-[#5cc3ff] to-[#2b8fe0]",
  teal: "from-[#43c6b8] to-[#1f8f87]",
  violet: "from-[#a17cff] to-[#6c47e0]",
};

const SCENE_ICON: Record<string, LucideIcon> = {
  "scene-2001": Building2,
  "scene-1001": ShoppingCart,
  "scene-1002": ShoppingCart,
  "scene-1003": Package,
  "scene-1004": Truck,
};

export function OntologySceneIcon({ scene, size = "md" }: { scene: Pick<OntologyScene, "id" | "tone">; size?: "md" | "lg" }) {
  const Icon = SCENE_ICON[scene.id] ?? Boxes;
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
        TONE_CLASS[scene.tone],
        size === "lg" ? "h-12 w-12" : "h-11 w-11",
      )}
    >
      <Icon className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} strokeWidth={1.8} />
    </div>
  );
}

export function OntologyStatGrid({ counts }: { counts: Pick<OntologyScene, "objectCount" | "linkCount" | "actionCount" | "functionCount"> }) {
  const items: Array<{ label: string; value: number; icon: LucideIcon }> = [
    { label: "对象", value: counts.objectCount, icon: Hexagon },
    { label: "链接", value: counts.linkCount, icon: Link2 },
    { label: "行为", value: counts.actionCount, icon: Zap },
    { label: "函数", value: counts.functionCount, icon: FileCode2 },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="min-w-0 rounded-md border border-slate-200 px-2 py-2 sm:px-2.5">
            <Icon className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.8} />
            <div className="mt-1 flex items-baseline justify-between gap-1">
              <span className="whitespace-nowrap text-[12px] text-slate-500">{item.label}</span>
              <span className="text-[13px] font-semibold text-slate-900">{item.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionTitle({ index, title, done, children }: { index: number; title: string; done: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold",
            done ? "bg-[#e8f0fb] text-[#2773ff]" : "bg-[#2773ff] text-white",
          )}
        >
          {done ? <Check className="h-3 w-3" /> : index}
        </span>
        <span className="text-[14px] font-semibold text-slate-900">{title}</span>
      </div>
      {children}
    </div>
  );
}

export interface OntologyBindingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: OntologyBindingScope;
  /** 已有绑定：Key 以密文展示、场景库直接展开、描述可改 */
  initial?: OntologyBinding | null;
  onConfirm: (binding: OntologyBinding) => void;
}

export function OntologyBindingDialog({ open, onOpenChange, scope, initial, onConfirm }: OntologyBindingDialogProps) {
  const [keyInput, setKeyInput] = useState("");
  const [keyTail, setKeyTail] = useState<string | null>(initial?.keyTail ?? null);
  const [scenes, setScenes] = useState<OntologyScene[]>(initial ? MOCK_ONTOLOGY_SCENES : []);
  const [verifying, setVerifying] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sceneId, setSceneId] = useState<string | null>(initial?.sceneId ?? null);
  const [description, setDescription] = useState(initial?.sceneDescription ?? "");
  const describeRef = useRef<HTMLDivElement | null>(null);

  const isPersonal = scope === "personal";
  const scene = scenes.find((item) => item.id === sceneId) ?? null;
  const filteredScenes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scenes.filter((item) => !q || `${item.name}${item.description}`.toLowerCase().includes(q));
  }, [scenes, query]);

  useEffect(() => {
    if (scene && !initial) describeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [scene, initial]);

  async function connect(raw: string) {
    const value = raw.trim();
    if (!value) return;
    setKeyError(null);
    setVerifying(true);
    const result = await mockFetchSceneLibrary(value);
    setVerifying(false);
    if (!result.ok) {
      setKeyError(result.reason);
      return;
    }
    setKeyTail(value.slice(-4));
    setKeyInput("");
    setScenes(result.scenes);
    setSceneId(null);
  }

  function resetKey() {
    setKeyTail(null);
    setScenes([]);
    setSceneId(null);
    setKeyError(null);
    setQuery("");
  }

  function handleConfirm() {
    if (!keyTail || !scene || !description.trim()) return;
    onConfirm(buildBinding(keyTail, scene, description.trim()));
  }

  const canConfirm = Boolean(keyTail && scene && description.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-32px)] max-w-[1040px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1040px]">
        <DialogHeader className="shrink-0 border-b border-slate-200 px-6 pb-4 pt-5 text-left">
          <DialogTitle className="text-base">{initial ? "编辑本体" : "绑定本体"}</DialogTitle>
          <DialogDescription className="text-[13px] leading-5">
            {isPersonal
              ? "用你自己的 API Key 连接本体场景，只有你的 Claw 能用。一个 Claw 最多绑定一个场景。"
              : "用 API Key 连接本体场景。发布后，使用者通过这把 Key 访问本体，无需自己配置。一个 Claw 最多绑定一个场景。"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-5">
          {/* 1. API Key */}
          <section className="space-y-3">
            <SectionTitle index={1} title={`${ONTOLOGY_PLATFORM_NAME} API Key`} done={Boolean(keyTail)}>
              <a
                href={ONTOLOGY_KEY_GUIDE_URL}
                onClick={(event) => event.preventDefault()}
                className="inline-flex items-center gap-0.5 text-[12px] text-[#2773ff] hover:underline"
              >
                如何获取 API Key
                <ExternalLink className="h-3 w-3" />
              </a>
            </SectionTitle>
            {keyTail ? (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-[#f8fafc] px-3.5 py-2.5">
                <Lock className="h-4 w-4 text-slate-400" />
                <span className="font-mono text-[13px] tracking-wide text-slate-800">{maskKey(keyTail)}</span>
                <span className="rounded bg-[#e7f6ee] px-2 py-0.5 text-[11px] font-medium text-[#1d744a]">已连接</span>
                <button type="button" onClick={resetKey} className="ml-auto text-[12px] text-[#2773ff] hover:underline">
                  更换 Key
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={keyInput}
                    onChange={(event) => setKeyInput(event.target.value)}
                    onPaste={(event) => {
                      const pasted = event.clipboardData.getData("text");
                      if (pasted.trim()) {
                        event.preventDefault();
                        setKeyInput(pasted.trim());
                        void connect(pasted);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void connect(keyInput);
                    }}
                    disabled={verifying}
                    placeholder={`粘贴在${ONTOLOGY_PLATFORM_NAME}创建的 API Key`}
                    autoComplete="off"
                    aria-label="API Key"
                    className="h-9 flex-1 font-mono text-[13px]"
                  />
                  <Button size="sm" className="h-9" onClick={() => void connect(keyInput)} disabled={!keyInput.trim() || verifying}>
                    {verifying ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                    {verifying ? "连接中" : "连接"}
                  </Button>
                </div>
                {keyError ? (
                  <div className="rounded-md border border-[#fbd5d5] bg-[#fff5f5] px-3 py-2 text-[13px] text-[#b42318]">{keyError}</div>
                ) : (
                  <p className="text-[12px] leading-5 text-slate-500">
                    {isPersonal
                      ? "Key 加密保存，填入后以密文显示，只用于你自己的 Claw。"
                      : "Key 加密保存，填入后以密文显示，只用于这个 Claw，不会给其他 Claw 复用。"}
                    能调用哪些行为和函数，由创建 Key 时开通的能力决定。
                  </p>
                )}
              </div>
            )}
          </section>

          {/* 2. 本体场景库 */}
          <section className="space-y-3">
            <SectionTitle index={2} title="本体场景库" done={Boolean(scene)}>
              {keyTail ? (
                <label className="relative flex w-full items-center sm:w-[260px]">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="请输入名称或描述"
                    aria-label="搜索本体场景"
                    className="h-9 pr-9 text-[13px]"
                  />
                  <Search className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500" />
                </label>
              ) : null}
            </SectionTitle>
            {!keyTail ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-[13px] text-slate-400">
                连接 API Key 后显示可绑定的本体场景
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredScenes.map((item) => {
                  const bound = item.id === sceneId;
                  return (
                    <article
                      key={item.id}
                      className={cn(
                        "flex min-w-0 flex-col gap-4 rounded-xl border bg-white p-4 transition",
                        bound ? "border-[#2773ff] shadow-[0_0_0_1px_#2773ff]" : "border-slate-200 hover:border-slate-300",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <OntologySceneIcon scene={item} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-semibold leading-6 text-slate-900">{item.name}</div>
                          <div className="truncate text-[12px] leading-5 text-slate-500">{item.description || "-"}</div>
                        </div>
                        {bound ? (
                          <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md bg-[#e8f0fb] px-2.5 text-[12px] font-medium text-[#2773ff]">
                            <Check className="h-3.5 w-3.5" />
                            已绑定
                          </span>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 shrink-0 px-3 text-[12px]" onClick={() => setSceneId(item.id)}>
                            绑定
                          </Button>
                        )}
                      </div>
                      <OntologyStatGrid counts={item} />
                      <div className="text-[12px] text-slate-500">
                        {item.updatedBy}更新于{item.updatedAt}
                      </div>
                    </article>
                  );
                })}
                {filteredScenes.length === 0 ? (
                  <div className="col-span-full rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-[13px] text-slate-500">
                    没有匹配的本体场景
                  </div>
                ) : null}
              </div>
            )}
          </section>

          {/* 3. 场景描述 */}
          <section ref={describeRef} className="space-y-3">
            <SectionTitle index={3} title="场景描述" done={Boolean(scene && description.trim())}>
              {scene ? <span className="text-[12px] text-slate-500">已选：{scene.name}</span> : null}
            </SectionTitle>
            {!scene ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-[13px] text-slate-400">
                绑定一个本体场景后填写
              </div>
            ) : (
              <div className="space-y-1.5">
                <Textarea
                  value={description}
                  maxLength={300}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  aria-label="场景描述"
                  className="text-[13px] leading-6"
                  placeholder={`如：${scene.name}本体涉及客户、联系人、商机、报价、合同及其之间的关系。`}
                />
                <div className="flex items-start justify-between gap-3 text-[12px] leading-5">
                  <span className="text-slate-500">Claw 将依据该描述调用本体，完成检索或行为与函数的执行。</span>
                  <span className="shrink-0 text-slate-400">{description.length} / 300</span>
                </div>
              </div>
            )}
          </section>
        </div>

        <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-slate-200 px-6 py-3.5">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={!canConfirm}>
            {initial ? "保存" : "完成绑定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

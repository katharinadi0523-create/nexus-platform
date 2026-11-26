"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { CircleAlert, PanelRightOpen } from "lucide-react";
import { useMyClaw } from "@/components/my-claw/provider";
import {
  PersonalChatContext,
  usePersonalChatContext,
  type PersonalChatAttachment,
} from "@/components/claw-client/personal-chat-context";
import { PersonalConversationSidePanel, type PersonalPanelView } from "@/components/claw-client/personal-conversation-side-panel";
import {
  getMyClawOpeningGreeting,
  MY_CLAW_BRAND_ICON_SRC,
  MY_CLAW_BRAND_NAME,
  MY_CLAW_USER_DISPLAY_NAME,
} from "@/lib/mock/my-claw/branding";
import { getPersonalClawDetail } from "@/lib/mock/my-claw/personal-claw";
import { getMyClawSession } from "@/lib/mock/my-claw/sessions";
import { takeWorkspaceChatBootstrap } from "@/components/workspace-1/workspaceChatBridge";
import type { SkillCreateChatContext, SkillEditChatContext } from "@/components/workspace-1/workspaceChatBridge";
import type { ModelErrorDemoState } from "@/components/claw-hub-next/debug-chat-composer";
import { updateStoredPersonalSkill, upsertPersonalSkill, writePersonalSkillOverride } from "@/lib/mock/my-claw/personal-skills-storage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ComposerWithAgents } from "./composer-with-agents";
import { EnterpriseSessionPanel } from "./enterprise-session-panel";
import { ExpenseChatPanel } from "./expense-chat-panel";
import { ResearchWorkspace } from "./research-workspace";
import { OntologyChatPanel } from "./ontology-chat-panel";

interface ChatWorkspaceProps {
  sessionId?: string | null;
  messageId?: string | null;
  /** Enables personal-only conversation layout and model/workspace controls. */
  personalMode?: boolean;
  /** Shows a runtime model error in the new-session prototype. */
  modelErrorDemo?: ModelErrorDemoState;
}

const MODEL_ERROR_DEMO_PROMPT = "请帮我整理这份项目复盘材料，提炼关键结论。";
const MODEL_ERROR_DEMO_ORIGINAL_MODEL = "Qwen3-8B";

function subscribeWideScreen(callback: () => void) {
  const query = window.matchMedia("(min-width: 1440px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getWideScreenSnapshot() {
  return window.matchMedia("(min-width: 1440px)").matches;
}

function BlankChatPanel({
  personalMode = false,
  workspacePanelOpen = false,
  workspaceView = "summary",
  workspacePanelWidth = 280,
  onWorkspaceViewChange,
  onWorkspacePanelWidthChange,
  onOpenWorkspace,
  onCloseWorkspace,
  modelErrorDemo,
  skillEditContext,
  skillCreateContext,
}: {
  personalMode?: boolean;
  workspacePanelOpen?: boolean;
  workspaceView?: PersonalPanelView;
  workspacePanelWidth?: number;
  onWorkspaceViewChange?: (view: PersonalPanelView) => void;
  onWorkspacePanelWidthChange?: (width: number) => void;
  onOpenWorkspace?: () => void;
  onCloseWorkspace?: () => void;
  modelErrorDemo?: ModelErrorDemoState;
  skillEditContext?: SkillEditChatContext;
  skillCreateContext?: SkillCreateChatContext;
}) {
  const router = useRouter();
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const chat = usePersonalChatContext();
  const [draft, setDraft] = useState("");
  const [activeModelError, setActiveModelError] = useState<ModelErrorDemoState | null>(modelErrorDemo ?? null);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [submittedSkillEdit, setSubmittedSkillEdit] = useState("");
  const [submittedSkillCreate, setSubmittedSkillCreate] = useState("");
  const [savingSkillEdit, setSavingSkillEdit] = useState(false);
  const greeting = getMyClawOpeningGreeting(MY_CLAW_USER_DISPLAY_NAME);
  const skillEditReferences = skillEditContext ? ["skill-creator", skillEditContext.name] : skillCreateContext ? ["skill-creator"] : [];
  const revisedSkillMarkdown = useMemo(() => {
    if (!skillEditContext || !submittedSkillEdit) return "";
    const instructions = submittedSkillEdit.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => `- ${line}`).join("\n");
    return `${skillEditContext.skillMdContent.trimEnd()}\n\n## 本轮修改要求（演示稿）\n${instructions}`;
  }, [skillEditContext, submittedSkillEdit]);

  const saveSkillEdit = () => {
    if (!skillEditContext || !revisedSkillMarkdown || savingSkillEdit) return;
    setSavingSkillEdit(true);
    const now = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
    const packageFiles = (skillEditContext.packageFiles?.length ? skillEditContext.packageFiles : [{ path: "SKILL.md", content: skillEditContext.skillMdContent }])
      .map((file) => file.path.replace(/^\.\//, "") === "SKILL.md" ? { ...file, content: revisedSkillMarkdown } : file);
    if (!packageFiles.some((file) => file.path.replace(/^\.\//, "") === "SKILL.md")) {
      packageFiles.unshift({ path: "SKILL.md", content: revisedSkillMarkdown });
    }
    const patch = {
      description: skillEditContext.description,
      skillMdContent: revisedSkillMarkdown,
      updatedAt: now,
      files: skillEditContext.files.includes("SKILL.md") ? skillEditContext.files : ["SKILL.md", ...skillEditContext.files],
      packageFiles,
    };

    if (skillEditContext.mode === "promote") {
      writePersonalSkillOverride(skillEditContext.skillId, {
        ...patch,
        creator: "我",
        origin: "mine",
        publisherScope: "personal",
      });
      toast.success(`「${skillEditContext.name}」已保存到自定义技能`);
    } else {
      const wasStoredSkillUpdated = updateStoredPersonalSkill(skillEditContext.skillId, patch);
      if (!wasStoredSkillUpdated) writePersonalSkillOverride(skillEditContext.skillId, patch);
      toast.success(`「${skillEditContext.name}」已更新`);
    }
    router.push("/claw-client?tab=skills&skillView=mine");
  };

  const handleSkillEditSend = () => {
    const instruction = draft.trim();
    if (!instruction) return;
    setSubmittedSkillEdit(instruction);
    setDraft("");
  };
  const handleSkillCreateSend = () => {
    const instruction = draft.trim();
    if (!instruction) return;
    setSubmittedSkillCreate(instruction);
    setDraft("");
  };
  const saveCreatedSkill = () => {
    if (!skillCreateContext || !submittedSkillCreate || savingSkillEdit) return;
    setSavingSkillEdit(true);
    const now = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false });
    const name = "会议行动项整理";
    const description = "从会议纪要中提取行动事项、责任人和截止时间，并整理为清晰的待办清单。";
    const skillMdContent = `---\nname: meeting-action-items\ndescription: "${description}"\n---\n\n# 使用说明\n根据会议纪要提取行动项，并按以下规则整理：\n- 提取行动事项、责任人和截止时间\n- 不确定的信息标记为待确认\n- 使用表格输出，便于跟踪\n\n## 创建需求\n${submittedSkillCreate}\n`;
    upsertPersonalSkill({
      id: `personal-skill-created-${Date.now()}`,
      name,
      description,
      creator: "我",
      origin: "mine",
      publisherScope: "personal",
      enabled: true,
      addedAt: now,
      updatedAt: now,
      version: "v1.0",
      files: ["SKILL.md"],
      skillMdContent,
      packageFiles: [{ path: "SKILL.md", content: skillMdContent }],
    });
    toast.success(`「${name}」已创建并加入技能管理`);
    router.push("/claw-client?tab=skills&skillView=mine");
  };

  useEffect(() => {
    if (!chat?.incomingDraft) return;
    const syncTimer = window.setTimeout(() => {
      const text = chat.consumeIncomingDraft();
      if (text) setDraft((current) => current || text);
    }, 0);
    return () => window.clearTimeout(syncTimer);
  }, [chat]);

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,rgba(251,253,255,0.98),rgba(244,248,255,0.98))]">
        <div className={modelErrorDemo || submittedSkillEdit || submittedSkillCreate ? "min-h-0 flex-1 overflow-y-auto px-6 py-10" : "flex min-h-0 flex-1 items-center justify-center px-6"}>
          {modelErrorDemo ? (
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
              <div className="flex justify-end">
                <div className="max-w-[78%] rounded-2xl rounded-tr-md bg-slate-200/80 px-4 py-3 text-sm leading-6 text-slate-800">
                  {MODEL_ERROR_DEMO_PROMPT}
                </div>
              </div>
              {activeModelError ? (
                <div className="flex items-start gap-3" role="alert">
                  <Image
                    src={MY_CLAW_BRAND_ICON_SRC}
                    alt={MY_CLAW_BRAND_NAME}
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 rounded-lg object-contain"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3.5 shadow-sm sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-2.5">
                      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <p className="text-sm leading-6 text-slate-700">
                        原模型 {MODEL_ERROR_DEMO_ORIGINAL_MODEL}
                        <span className="font-semibold text-slate-900">
                          {activeModelError === "unavailable" ? "不可用" : "已下架"}
                        </span>
                        ，请切换至其他模型后重新发送。
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModelError(null);
                        setDraft(MODEL_ERROR_DEMO_PROMPT);
                        setModelPickerOpen(true);
                      }}
                      className="h-8 shrink-0 rounded-md bg-blue-600 px-3 text-xs font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                    >
                      更换模型
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : submittedSkillCreate && skillCreateContext ? (
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
              <div className="flex justify-end"><div className="max-w-[78%] rounded-2xl rounded-tr-md bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-800">{submittedSkillCreate}</div></div>
              <div className="flex items-start gap-3">
                <Image src={MY_CLAW_BRAND_ICON_SRC} alt={MY_CLAW_BRAND_NAME} width={36} height={36} className="mt-1 size-9 shrink-0 rounded-lg object-contain" />
                <section className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-semibold text-slate-900">我先整理了一版 Skill</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">检查生成的说明，确认后会自动启用并加入技能管理的「自定义」区域。</p>
                  <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><span className="text-lg font-semibold">会</span></span>
                    <div className="min-w-0"><div className="truncate text-sm font-medium text-slate-900">会议行动项整理</div><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">从会议纪要中提取行动事项、责任人和截止时间，并整理为待办清单。</p></div>
                  </div>
                  <pre className="mt-3 max-h-[34vh] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-5 text-slate-700">{`---\nname: meeting-action-items\ndescription: "会议行动项整理"\n---\n\n# 使用说明\n- 提取行动事项、责任人和截止时间\n- 不确定的信息标记为待确认\n- 使用表格输出，便于跟踪\n\n## 创建需求\n${submittedSkillCreate}`}</pre>
                  <div className="mt-4 flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setDraft(submittedSkillCreate); setSubmittedSkillCreate(""); }}>继续调整</Button><Button type="button" disabled={savingSkillEdit} onClick={saveCreatedSkill}>{savingSkillEdit ? "正在保存…" : "保存并启用"}</Button></div>
                </section>
              </div>
            </div>
          ) : submittedSkillEdit && skillEditContext ? (
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
              <div className="flex justify-end"><div className="max-w-[78%] rounded-2xl rounded-tr-md bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-800">{submittedSkillEdit}</div></div>
              <div className="flex items-start gap-3">
                <Image src={MY_CLAW_BRAND_ICON_SRC} alt={MY_CLAW_BRAND_NAME} width={36} height={36} className="mt-1 size-9 shrink-0 rounded-lg object-contain" />
                <section className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><div className="text-sm font-semibold text-slate-900">我整理了一版修改稿</div><p className="mt-1 text-xs leading-5 text-slate-500">请检查内容，确认后保存到「{skillEditContext.name}」的 SKILL.md。</p></div>
                    <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">SKILL.md</span>
                  </div>
                  {skillEditContext.mode === "promote" ? <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700">保存后会将此 Skill 转入你的自定义区域；市场上的原始版本不变。</p> : null}
                  <pre className="mt-4 max-h-[42vh] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-5 text-slate-700">{revisedSkillMarkdown}</pre>
                  <div className="mt-4 flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setDraft(submittedSkillEdit); setSubmittedSkillEdit(""); }}>继续调整</Button><Button type="button" disabled={savingSkillEdit} onClick={saveSkillEdit}>{savingSkillEdit ? "正在保存…" : "保存 Skill"}</Button></div>
                </section>
              </div>
            </div>
          ) : skillCreateContext ? (
            <div className="flex max-w-lg flex-col items-center text-center">
              <Image src={MY_CLAW_BRAND_ICON_SRC} alt={MY_CLAW_BRAND_NAME} width={96} height={96} className="h-24 w-24 object-contain drop-shadow-sm" priority />
              <p className="mt-5 text-lg font-semibold text-slate-900">创建一个 Skill</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">描述你希望重复使用的工作流程，Skill Creator 会整理成 SKILL.md 供你确认。</p>
              <p className="mt-3 max-w-md rounded-lg bg-white/80 px-4 py-3 text-left text-xs leading-5 text-slate-500">示例：从会议纪要中提取行动事项、责任人和截止时间，标记待确认内容，并按表格输出。</p>
            </div>
          ) : skillEditContext ? (
            <div className="flex max-w-lg flex-col items-center text-center">
              <Image src={MY_CLAW_BRAND_ICON_SRC} alt={MY_CLAW_BRAND_NAME} width={96} height={96} className="h-24 w-24 object-contain drop-shadow-sm" priority />
              <p className="mt-5 text-lg font-semibold text-slate-900">编辑「{skillEditContext.name}」</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">描述你希望如何调整这个 Skill，Claw 会生成 SKILL.md 修改稿供你确认。</p>
              {skillEditContext.mode === "promote" ? <p className="mt-2 text-xs text-slate-400">保存后此 Skill 会转入自定义区域，市场原始版本不受影响。</p> : null}
            </div>
          ) : (
            <div className="flex max-w-lg flex-col items-center text-center">
              <Image
                src={MY_CLAW_BRAND_ICON_SRC}
                alt={MY_CLAW_BRAND_NAME}
                width={112}
                height={112}
                className="h-28 w-28 object-contain drop-shadow-sm"
                priority
              />
              <p className="mt-6 text-[17px] font-medium leading-8 tracking-[-0.01em] text-slate-800">
                {greeting}
              </p>
            </div>
          )}
        </div>
        <div className="shrink-0 px-4 py-4 lg:px-8 lg:py-5">
          <div className="mx-auto w-full max-w-4xl">
            <ComposerWithAgents
              detail={detail}
              modelScopeKey={modelErrorDemo ? `model-${modelErrorDemo}-runtime-demo-v2` : "new"}
              modelErrorDemo={modelErrorDemo}
              modelPickerOpen={modelPickerOpen}
              onModelPickerOpenChange={setModelPickerOpen}
              personalMode={personalMode}
              onOpenWorkspace={onOpenWorkspace}
              value={draft}
              onChange={setDraft}
              onSend={skillCreateContext ? handleSkillCreateSend : skillEditContext ? handleSkillEditSend : () => setDraft("")}
              skillEditReferences={skillEditReferences}
            />
          </div>
        </div>
      </div>
      {personalMode ? (
        <PersonalConversationSidePanel
          open={workspacePanelOpen}
          personalMode
          view={workspaceView}
          panelWidth={workspacePanelWidth}
          onPanelWidthChange={(width) => onWorkspacePanelWidthChange?.(width)}
          onViewChange={(view) => onWorkspaceViewChange?.(view)}
          onClose={() => onCloseWorkspace?.()}
        />
      ) : null}
    </div>
  );
}

function PersonalChatHeader({
  title,
  open,
  onOpenPanel,
}: {
  title: string;
  open: boolean;
  onOpenPanel: () => void;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{title}</h1>
      {!open ? <button type="button" onClick={onOpenPanel} aria-label="打开会话侧栏" title="打开会话侧栏" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
        <PanelRightOpen className="h-4 w-4" />
      </button> : null}
    </header>
  );
}

function PersonalChatContent({
  title,
  children,
  open,
  onOpenPanel,
  seedDraft = "",
}: {
  title: string;
  children: ReactNode;
  open: boolean;
  onOpenPanel: () => void;
  seedDraft?: string;
}) {
  const [attachments, setAttachments] = useState<PersonalChatAttachment[]>([]);
  const [incomingDraft, setIncomingDraft] = useState(seedDraft);
  const addAttachments = useCallback((items: PersonalChatAttachment[]) => {
    setAttachments((current) => {
      const ids = new Set(current.map((item) => item.id));
      return [...current, ...items.filter((item) => !ids.has(item.id))];
    });
  }, []);
  const removeAttachment = useCallback((id: string) => {
    setAttachments((current) => current.filter((item) => item.id !== id));
  }, []);
  const clearAttachments = useCallback(() => setAttachments([]), []);
  const consumeIncomingDraft = useCallback(() => {
    const text = incomingDraft;
    if (text) setIncomingDraft("");
    return text;
  }, [incomingDraft]);
  const contextValue = useMemo(
    () => ({ attachments, addAttachments, removeAttachment, clearAttachments, incomingDraft, consumeIncomingDraft }),
    [attachments, addAttachments, removeAttachment, clearAttachments, incomingDraft, consumeIncomingDraft],
  );

  return (
    <PersonalChatContext.Provider value={contextValue}>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <PersonalChatHeader title={title} open={open} onOpenPanel={onOpenPanel} />
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </PersonalChatContext.Provider>
  );
}

export function ChatWorkspace({ sessionId, messageId, personalMode = false, modelErrorDemo }: ChatWorkspaceProps) {
  const { setActiveSession } = useMyClaw();
  const isWideScreen = useSyncExternalStore(subscribeWideScreen, getWideScreenSnapshot, () => false);
  const sessionKey = sessionId ?? null;
  const [boot] = useState(() => takeWorkspaceChatBootstrap());
  const [panelOpenState, setPanelOpenState] = useState<{ sessionKey: string | null; open: boolean | null }>({ sessionKey, open: boot?.skillEdit ? false : boot ? true : null });
  const panelOpenOverride = panelOpenState.sessionKey === sessionKey ? panelOpenState.open : null;
  const setPanelOpenOverride = (open: boolean | null) => setPanelOpenState({ sessionKey, open });
  const workspacePanelOpen = panelOpenOverride ?? (isWideScreen && Boolean(sessionId));
  const [workspaceViewState, setWorkspaceViewState] = useState<{ sessionKey: string | null; view: PersonalPanelView }>({ sessionKey, view: boot ? "workspace" : "summary" });
  const workspaceView = workspaceViewState.sessionKey === sessionKey ? workspaceViewState.view : "summary";
  const [workspacePanelWidth, setWorkspacePanelWidth] = useState(400);

  useEffect(() => {
    setActiveSession(sessionId ?? null);
  }, [sessionId, setActiveSession]);

  useEffect(() => {
    if (!messageId) return;
    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(`personal-message-${messageId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => {
      window.clearTimeout(scrollTimer);
    };
  }, [messageId, sessionId]);

  const session = sessionId ? getMyClawSession(sessionId) : null;
  const changePanelView = (view: PersonalPanelView) => {
    setWorkspaceViewState({ sessionKey, view });
    setPanelOpenOverride(true);
  };
  const openSummaryPanel = () => {
    changePanelView("summary");
  };

  let content: ReactNode;
  if (!session) {
    content = (
      <BlankChatPanel
        personalMode={personalMode}
        modelErrorDemo={modelErrorDemo}
        skillEditContext={boot?.skillEdit}
        skillCreateContext={boot?.skillCreate}
        workspacePanelOpen={workspacePanelOpen}
        workspaceView={workspaceView}
        workspacePanelWidth={workspacePanelWidth}
        onWorkspacePanelWidthChange={setWorkspacePanelWidth}
        onWorkspaceViewChange={changePanelView}
        onOpenWorkspace={() => changePanelView("workspace")}
        onCloseWorkspace={() => setPanelOpenOverride(false)}
      />
    );
  } else if (session.kind === "expense") {
    content = <ExpenseChatPanel sessionId={sessionId!} conversationTitle={session.title} highlightedMessageId={messageId} personalMode={personalMode} workspacePanelOpen={workspacePanelOpen} workspaceView={workspaceView} workspacePanelWidth={workspacePanelWidth} onWorkspacePanelWidthChange={setWorkspacePanelWidth} onWorkspaceViewChange={changePanelView} onOpenWorkspace={() => changePanelView("workspace")} onCloseWorkspace={() => setPanelOpenOverride(false)} />;
  } else if (session.kind === "ontology_demo") {
    content = <OntologyChatPanel session={session} workspacePanelOpen={workspacePanelOpen} workspaceView={workspaceView} workspacePanelWidth={workspacePanelWidth} onWorkspacePanelWidthChange={setWorkspacePanelWidth} onWorkspaceViewChange={changePanelView} onOpenWorkspace={() => changePanelView("workspace")} onCloseWorkspace={() => setPanelOpenOverride(false)} />;
  } else if (session.kind === "research_multi_agent") {
    content = <ResearchWorkspace sessionId={sessionId!} conversationTitle={session.title} highlightedMessageId={messageId} personalMode={personalMode} workspacePanelOpen={workspacePanelOpen} workspaceView={workspaceView} workspacePanelWidth={workspacePanelWidth} onWorkspacePanelWidthChange={setWorkspacePanelWidth} onWorkspaceViewChange={changePanelView} onOpenWorkspace={() => changePanelView("workspace")} onCloseWorkspace={() => setPanelOpenOverride(false)} />;
  } else {
    content = <EnterpriseSessionPanel session={session} highlightedMessageId={messageId} personalMode={personalMode} workspacePanelOpen={workspacePanelOpen} workspaceView={workspaceView} workspacePanelWidth={workspacePanelWidth} onWorkspacePanelWidthChange={setWorkspacePanelWidth} onWorkspaceViewChange={changePanelView} onOpenWorkspace={() => changePanelView("workspace")} onCloseWorkspace={() => setPanelOpenOverride(false)} />;
  }

  if (!personalMode) return content;
  const title = session?.title ?? "新对话";
  return (
    <PersonalChatContent key={sessionKey ?? "new"} title={title} open={workspacePanelOpen} onOpenPanel={openSummaryPanel} seedDraft={boot?.text ?? ""}>
      {content}
    </PersonalChatContent>
  );
}

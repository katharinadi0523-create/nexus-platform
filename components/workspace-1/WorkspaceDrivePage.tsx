"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { SkillFilesTab, type SkillFilesTabHandle } from "@/components/skillhub-v2/skill-files-tab";
import { useMyClaw } from "@/components/my-claw/provider";
import { WorkspaceDriveDock } from "./WorkspaceDriveDock";
import { useWorkspaceClawComposer } from "./useWorkspaceClawComposer";
import {
  composerPreviewBindings,
  composerPreviewNumbers,
  quoteFileIntoComposer,
} from "./workspaceFileQuote";
import { useWorkspaceCatalog } from "./workspaceCatalog";
import { queueWorkspaceChatBootstrap } from "./workspaceChatBridge";
import "./workspaceDrive.css";

export function WorkspaceDrivePage() {
  const catalog = useWorkspaceCatalog();
  const { createSession } = useMyClaw();
  const router = useRouter();
  const pathname = usePathname();
  const filesRef = useRef<SkillFilesTabHandle>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((text: string) => {
    setToast(text);
    if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 1800);
  }, []);

  const dockComposer = useWorkspaceClawComposer(showToast);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current != null) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  function requestLeave(action: () => void) {
    pendingActionRef.current = action;
    setLeaveOpen(true);
  }

  function resolveLeave(mode: "save" | "discard" | "cancel") {
    if (mode === "cancel") {
      pendingActionRef.current = null;
      setLeaveOpen(false);
      return;
    }
    if (mode === "save") {
      const ok = filesRef.current?.save() ?? true;
      if (!ok) return;
    } else {
      filesRef.current?.discard();
    }
    setLeaveOpen(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  }

  useEffect(() => {
    if (!catalog) return;
    catalog.registerGuard((action) => {
      if (filesRef.current?.dirty) requestLeave(action);
      else action();
    });
    return () => catalog.registerGuard((action) => action());
  }, [catalog]);

  const promptKey = !catalog?.prompt
    ? ""
    : catalog.prompt.mode === "create"
      ? "create"
      : `${catalog.prompt.mode}:${catalog.prompt.id}`;

  useEffect(() => {
    if (!catalog?.prompt || catalog.prompt.mode === "delete") {
      setDraftName("");
      setDraftDescription("");
      setFormError("");
      return;
    }
    if (catalog.prompt.mode === "edit") {
      const space = catalog.spaces.find((item) => item.id === (catalog.prompt && "id" in catalog.prompt ? catalog.prompt.id : ""));
      setDraftName(space?.name ?? "");
      setDraftDescription(space?.description ?? "");
    } else {
      setDraftName("");
      setDraftDescription("");
    }
    setFormError("");
  }, [promptKey]);

  const startChatFromComposer = useCallback(() => {
    const text = dockComposer.buildSendText();
    if (!text) return;
    catalog?.runGuarded(() => {
      const titleSource =
        dockComposer.draft.trim() ||
        dockComposer.attachments[0]?.fileName ||
        dockComposer.quotes[0]?.text ||
        text;
      const title = titleSource.length > 18 ? `${titleSource.slice(0, 18)}…` : titleSource;
      const id = createSession(title);
      queueWorkspaceChatBootstrap(id, text);
      dockComposer.clear();
      const href = pathname.startsWith("/claw-client")
        ? `/claw-client?sessionId=${encodeURIComponent(id)}`
        : `/my-claw/chat?sessionId=${encodeURIComponent(id)}`;
      router.push(href);
    });
  }, [catalog, createSession, dockComposer, pathname, router]);

  const handleDockQuote = useCallback(
    (quote: { path: string; name: string; excerpt?: string }) =>
      quoteFileIntoComposer(quote, catalog?.activeSpace?.files ?? [], dockComposer, showToast),
    [catalog?.activeSpace?.files, dockComposer, showToast],
  );

  const previewQuoteBindings = useMemo(
    () => composerPreviewBindings(dockComposer),
    [dockComposer.attachments, dockComposer.quotes],
  );

  const previewQuoteNumbers = useMemo(
    () => composerPreviewNumbers(dockComposer),
    [dockComposer.attachments, dockComposer.quotes],
  );

  if (!catalog) return null;
  const { activeSpace, prompt } = catalog;
  const deleting = prompt?.mode === "delete" ? catalog.spaces.find((space) => space.id === prompt.id) : null;
  if (!activeSpace) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center text-sm text-slate-500">
        工作空间尚未加载。
      </div>
    );
  }

  function submitSpace() {
    if (!catalog || !prompt || prompt.mode === "delete") return;
    const error =
      prompt.mode === "create"
        ? catalog.createSpace({ name: draftName, description: draftDescription })
        : catalog.updateSpace(prompt.id, { name: draftName, description: draftDescription });
    if (error) {
      setFormError(error);
      return;
    }
    catalog.closePrompt();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="workspace-drive-main">
        <div className="workspace-drive-main__files">
          <SkillFilesTab
            key={`${activeSpace.id}-${catalog.rootEpoch}`}
            ref={filesRef}
            files={activeSpace.files}
            canEdit
            fill
            workspaceLayout
            workspaceRootLabel="工作空间"
            protectSkillMarkdown={false}
            onFilesChange={(files) => catalog.updateFiles(activeSpace.id, files)}
            onGuard={requestLeave}
            onQuoteFile={handleDockQuote}
            previewQuoteBindings={previewQuoteBindings}
            previewQuoteNumbers={previewQuoteNumbers}
          />
        </div>
        <WorkspaceDriveDock
          draft={dockComposer.draft}
          onDraftChange={dockComposer.setDraft}
          onSend={startChatFromComposer}
          quotes={dockComposer.quotes}
          onRemoveQuote={dockComposer.removeQuote}
          attachments={dockComposer.attachments}
          onRemoveAttachment={dockComposer.removeAttachment}
          onRemoveAttachmentSnippet={dockComposer.removeAttachmentSnippet}
          onAddFiles={dockComposer.addFiles}
          onToast={showToast}
        />
      </div>

      {toast ? (
        <div className="claw-toast" role="status">
          {toast}
        </div>
      ) : null}

      <Dialog
        open={Boolean(prompt && prompt.mode !== "delete")}
        onOpenChange={(open) => {
          if (!open) catalog.closePrompt();
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{prompt?.mode === "edit" ? "编辑工作空间" : "新建工作空间"}</DialogTitle>
            <DialogDescription className="leading-6">
              空间用来分开存放文件。建好之后再进入里面的目录。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm text-slate-700">
              名称
              <Input
                value={draftName}
                className="mt-1.5"
                placeholder="例如：项目资料"
                onChange={(event) => setDraftName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submitSpace();
                  }
                }}
              />
            </label>
            <label className="block text-sm text-slate-700">
              介绍
              <Textarea
                value={draftDescription}
                className="mt-1.5 min-h-20"
                rows={3}
                placeholder="这个空间用来放什么"
                onChange={(event) => setDraftDescription(event.target.value)}
              />
            </label>
            {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-[5px]" onClick={catalog.closePrompt}>
              取消
            </Button>
            <Button type="button" className="rounded-[5px] bg-[#2773ff] hover:bg-[#1f66f0]" onClick={submitSpace}>
              {prompt?.mode === "edit" ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) catalog.closePrompt();
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>删除工作空间</DialogTitle>
            <DialogDescription className="leading-6">
              将删除「{deleting?.name}」以及里面的文件，且不可恢复。确定删除？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-[5px]" onClick={catalog.closePrompt}>
              取消
            </Button>
            <Button
              type="button"
              className="rounded-[5px] bg-rose-600 hover:bg-rose-700"
              onClick={() => {
                if (!deleting) return;
                catalog.deleteSpace(deleting.id);
                catalog.closePrompt();
              }}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={leaveOpen}
        onOpenChange={(open) => {
          if (!open) resolveLeave("cancel");
        }}
      >
        <DialogContent className="sm:max-w-[440px]" data-unsaved-safe showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>文件有未保存的编辑</DialogTitle>
            <DialogDescription className="leading-6">当前文件有未保存的编辑，是否保存后再离开？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-[5px]" onClick={() => resolveLeave("cancel")}>
              取消
            </Button>
            <Button type="button" variant="ghost" className="rounded-[5px]" onClick={() => resolveLeave("discard")}>
              不保存
            </Button>
            <Button
              type="button"
              className="rounded-[5px] bg-[#2773ff] hover:bg-[#1f66f0]"
              onClick={() => resolveLeave("save")}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

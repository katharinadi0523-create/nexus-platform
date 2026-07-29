"use client";

import { useMemo, useState } from "react";
import { ListTodo, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProjectMessage } from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "../project-conversation-provider";

interface MessageIssueActionsProps {
  message: ProjectMessage;
}

export function MessageIssueActions({ message }: MessageIssueActionsProps) {
  const {
    currentUserId,
    getIssues,
    createIssue,
    bindIssueToConversation,
    referenceIssueFromMessage,
    openIssueDrawer,
  } = useProjectConversation();

  const [mode, setMode] = useState<"create" | "bind" | "reference" | null>(null);
  const [title, setTitle] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const issues = getIssues(message.projectId);
  const unbound = useMemo(
    () => issues.filter((issue) => !issue.conversationId),
    [issues]
  );
  const boundOthers = useMemo(
    () =>
      issues.filter(
        (issue) =>
          issue.conversationId &&
          issue.conversationId !== message.threadId
      ),
    [issues, message.threadId]
  );

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2200);
  };

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const id = createIssue({
      projectId: message.projectId,
      conversationId: message.threadId,
      sourceMessageId: message.id,
      title: trimmed,
      humanAssigneeIds: [currentUserId],
      agentAssigneeIds: [],
    });
    setMode(null);
    setTitle("");
    if (id) {
      showToast("已创建事项并绑定当前会话");
      openIssueDrawer(id);
    }
  };

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[#5a6779] opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100"
            aria-label="事项操作"
          >
            <MoreHorizontal className="h-3 w-3" />
            事项
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() => {
              setMode("create");
              setTitle(message.content.replace(/\s+/g, " ").slice(0, 40));
            }}
          >
            <ListTodo className="h-3.5 w-3.5" />
            创建事项
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={unbound.length === 0}
            onClick={() => setMode("bind")}
          >
            绑定未归属事项
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={boundOthers.length === 0}
            onClick={() => setMode("reference")}
          >
            引用已有事项
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {mode ? (
        <div className="absolute right-0 top-7 z-30 w-72 rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-lg">
          {mode === "create" ? (
            <>
              <div className="mb-2 text-[12px] font-semibold text-slate-800">
                从消息创建事项
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="事项标题"
                className="h-8 text-[12px]"
              />
              <p className="mt-1.5 text-[11px] text-[#5a6779]">
                将自动把当前会话设为主会话。
              </p>
              <div className="mt-2 flex justify-end gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11px]"
                  onClick={() => setMode(null)}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 bg-[#2773ff] text-[11px] hover:bg-[#1f63e0]"
                  onClick={handleCreate}
                >
                  创建
                </Button>
              </div>
            </>
          ) : null}

          {mode === "bind" ? (
            <>
              <div className="mb-2 text-[12px] font-semibold text-slate-800">
                绑定未归属事项
              </div>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {unbound.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    className="block w-full rounded-md px-2 py-1.5 text-left text-[12px] hover:bg-[#f8f9fb]"
                    onClick={() => {
                      bindIssueToConversation(issue.id, message.threadId);
                      setMode(null);
                      showToast(`已绑定 ${issue.key}`);
                      openIssueDrawer(issue.id);
                    }}
                  >
                    <span className="font-medium text-slate-800">
                      {issue.key}
                    </span>
                    <span className="ml-1 text-[#5a6779]">{issue.title}</span>
                  </button>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-2 h-7 w-full text-[11px]"
                onClick={() => setMode(null)}
              >
                取消
              </Button>
            </>
          ) : null}

          {mode === "reference" ? (
            <>
              <div className="mb-2 text-[12px] font-semibold text-slate-800">
                引用已有事项
              </div>
              <p className="mb-2 text-[11px] text-[#5a6779]">
                仅生成引用，不改变主会话归属。
              </p>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {boundOthers.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    className="block w-full rounded-md px-2 py-1.5 text-left text-[12px] hover:bg-[#f8f9fb]"
                    onClick={() => {
                      referenceIssueFromMessage(
                        issue.id,
                        message.threadId,
                        message.id
                      );
                      setMode(null);
                      showToast(`已引用 ${issue.key}`);
                    }}
                  >
                    <span className="font-medium text-slate-800">
                      {issue.key}
                    </span>
                    <span className="ml-1 text-[#5a6779]">{issue.title}</span>
                  </button>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-2 h-7 w-full text-[11px]"
                onClick={() => setMode(null)}
              >
                取消
              </Button>
            </>
          ) : null}
        </div>
      ) : null}

      {toast ? (
        <div className="absolute right-0 top-7 z-40 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] text-white shadow">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

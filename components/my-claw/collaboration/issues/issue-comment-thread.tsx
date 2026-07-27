"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { AtSign, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  AgentActor,
  IssueComment,
  ProjectArtifact,
  Squad,
} from "@/lib/mock/my-claw/collaboration";
import { ActorAvatar } from "../shared/actor-avatar";
import { ActorTypeBadge } from "../shared/actor-type-badge";
import { formatRelativeTime } from "../shared/format";
import { useCollaboration } from "../collaboration-provider";
import { cn } from "@/lib/utils";

export interface IssueCommentThreadProps {
  issueId: string;
  projectId: string;
  comments: IssueComment[];
  artifacts: ProjectArtifact[];
  onOpenRun?: (runId: string) => void;
  focusCommentId?: string;
}

interface MentionOption {
  id: string;
  kind: "agent" | "squad";
  label: string;
  subtitle: string;
  actorType?: AgentActor["type"];
}

export function IssueCommentThread({
  issueId,
  projectId,
  comments,
  artifacts,
  onOpenRun,
  focusCommentId,
}: IssueCommentThreadProps) {
  const {
    getUser,
    getActor,
    getProject,
    addComment,
    state,
  } = useCollaboration();
  const project = getProject(projectId);
  const [draft, setDraft] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionedActorIds, setMentionedActorIds] = useState<string[]>([]);
  const [mentionedSquadIds, setMentionedSquadIds] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mentionOptions = useMemo(() => {
    const actors: MentionOption[] = (project?.actorIds ?? [])
      .map((id) => getActor(id))
      .filter((actor): actor is AgentActor => Boolean(actor))
      .map((actor) => ({
        id: actor.id,
        kind: "agent" as const,
        label: actor.name,
        subtitle: actor.sourceLabel,
        actorType: actor.type,
      }));
    const squads: MentionOption[] = state.squads
      .filter((squad) => squad.projectId === projectId)
      .map((squad: Squad) => ({
        id: squad.id,
        kind: "squad" as const,
        label: squad.name,
        subtitle: "Squad",
      }));
    const q = mentionQuery.trim().toLowerCase();
    return [...actors, ...squads].filter(
      (option) =>
        !q ||
        option.label.toLowerCase().includes(q) ||
        option.subtitle.toLowerCase().includes(q)
    );
  }, [getActor, mentionQuery, project?.actorIds, projectId, state.squads]);

  const handleDraftChange = (value: string) => {
    setDraft(value);
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const match = before.match(/@([^\s@]*)$/);
    if (match) {
      setMentionOpen(true);
      setMentionQuery(match[1] ?? "");
    } else {
      setMentionOpen(false);
      setMentionQuery("");
    }
  };

  const insertMention = (option: MentionOption) => {
    const el = textareaRef.current;
    const cursor = el?.selectionStart ?? draft.length;
    const before = draft.slice(0, cursor);
    const after = draft.slice(cursor);
    const replaced = before.replace(/@([^\s@]*)$/, `@${option.label} `);
    setDraft(`${replaced}${after}`);
    if (option.kind === "agent") {
      setMentionedActorIds((prev) =>
        prev.includes(option.id) ? prev : [...prev, option.id]
      );
    } else {
      setMentionedSquadIds((prev) =>
        prev.includes(option.id) ? prev : [...prev, option.id]
      );
    }
    setMentionOpen(false);
    setMentionQuery("");
    requestAnimationFrame(() => el?.focus());
  };

  const handleSubmit = () => {
    const content = draft.trim();
    if (!content) return;
    addComment({
      issueId,
      content,
      mentionedActorIds,
      mentionedSquadIds,
    });
    setDraft("");
    setMentionedActorIds([]);
    setMentionedSquadIds([]);
    setMentionOpen(false);
  };

  const chronological = [...comments].reverse();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-3 text-[13px] font-semibold text-slate-900">
          Activity
        </h2>
        {chronological.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#e2e8f0] px-4 py-8 text-center text-[13px] text-[#5a6779]">
            还没有评论或系统事件
          </div>
        ) : (
          <div className="space-y-3">
            {chronological.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                getUser={getUser}
                getActor={getActor}
                artifacts={artifacts.filter(
                  (artifact) => artifact.runId === comment.runId
                )}
                onOpenRun={onOpenRun}
                focused={focusCommentId === comment.id}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative rounded-xl border border-[#e7ecf0] bg-white p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] text-[#5a6779]">
          <AtSign className="h-3.5 w-3.5" />
          输入 @ 提及项目 Agent 或 Squad，可触发 Mention Run
        </div>
        <Textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => handleDraftChange(event.target.value)}
          placeholder="添加评论…"
          className="min-h-[88px] border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
        {mentionOpen ? (
          <div className="absolute bottom-[72px] left-3 right-3 z-20 max-h-48 overflow-y-auto rounded-lg border border-[#e7ecf0] bg-white shadow-lg">
            {mentionOptions.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-[#5a6779]">
                无匹配对象
              </div>
            ) : (
              mentionOptions.map((option) => (
                <button
                  key={`${option.kind}-${option.id}`}
                  type="button"
                  onClick={() => insertMention(option)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#f8f9fb]"
                >
                  <ActorAvatar
                    name={option.label}
                    type={
                      option.kind === "squad"
                        ? "squad"
                        : (option.actorType ?? "platform_claw")
                    }
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-medium text-slate-800">
                      {option.label}
                    </div>
                    <div className="truncate text-[11px] text-[#5a6779]">
                      {option.subtitle}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : null}
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            className="bg-[#2773ff] hover:bg-[#1f63e0]"
            onClick={handleSubmit}
            disabled={!draft.trim()}
          >
            <Send className="h-3.5 w-3.5" />
            发送
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  getUser,
  getActor,
  artifacts,
  onOpenRun,
  focused,
}: {
  comment: IssueComment;
  getUser: (userId: string) => { name: string } | undefined;
  getActor: (actorId: string) => AgentActor | undefined;
  artifacts: ProjectArtifact[];
  onOpenRun?: (runId: string) => void;
  focused?: boolean;
}) {
  if (comment.author.kind === "system") {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg bg-[#f8f9fb] px-3 py-2.5",
          focused && "ring-2 ring-[#2773ff]/30"
        )}
      >
        <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-[#5a6779]">{comment.content}</p>
          <p className="mt-1 text-[11px] text-[#94a3b8]">
            {formatRelativeTime(comment.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  if (comment.author.kind === "agent") {
    const actor = getActor(comment.author.id);
    return (
      <div
        className={cn(
          "rounded-xl border border-[#dbe7f4] bg-[#f5f9ff] px-3.5 py-3",
          focused && "border-[#2773ff] ring-2 ring-[#2773ff]/25"
        )}
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <ActorAvatar
            name={actor?.name ?? "Agent"}
            type={actor?.type}
            size="sm"
          />
          <span className="text-[13px] font-medium text-slate-900">
            {actor?.name ?? "Agent"}
          </span>
          {actor ? <ActorTypeBadge type={actor.type} /> : null}
          <span className="text-[11px] text-[#94a3b8]">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {comment.runId ? (
            <button
              type="button"
              onClick={() => onOpenRun?.(comment.runId!)}
              className="text-[11px] font-medium text-[#2773ff] hover:underline"
            >
              查看 Run
            </button>
          ) : null}
        </div>
        <p className="text-[13px] leading-relaxed text-slate-700">
          {comment.content}
        </p>
        {artifacts.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {artifacts.map((artifact) => (
              <span
                key={artifact.id}
                className="rounded-md border border-[#dbe7f4] bg-white px-2 py-0.5 text-[11px] text-[#2f5fbf]"
              >
                {artifact.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const user = getUser(comment.author.id);
  return (
    <div
      className={cn(
        "rounded-xl border border-[#e7ecf0] bg-white px-3.5 py-3",
        focused && "border-[#2773ff] ring-2 ring-[#2773ff]/25"
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <ActorAvatar name={user?.name ?? "成员"} type="human" size="sm" />
        <span className="text-[13px] font-medium text-slate-900">
          {user?.name ?? "成员"}
        </span>
        <span className="text-[11px] text-[#94a3b8]">
          {formatRelativeTime(comment.createdAt)}
        </span>
      </div>
      <p className="text-[13px] leading-relaxed text-slate-700">
        {highlightMentions(comment.content, comment.mentionedActorIds, getActor)}
      </p>
      {comment.runId ? (
        <button
          type="button"
          onClick={() => onOpenRun?.(comment.runId!)}
          className="mt-2 text-[11px] font-medium text-[#2773ff] hover:underline"
        >
          已触发 Mention Run
        </button>
      ) : null}
    </div>
  );
}

function highlightMentions(
  content: string,
  mentionedActorIds: string[],
  getActor: (actorId: string) => AgentActor | undefined
): ReactNode {
  const names = mentionedActorIds
    .map((id) => getActor(id)?.name)
    .filter((name): name is string => Boolean(name));

  const parts: ReactNode[] = [];
  let remaining = content;
  let key = 0;
  while (remaining.length > 0) {
    let earliest = -1;
    let matched = "";
    for (const name of names) {
      const token = `@${name}`;
      const idx = remaining.indexOf(token);
      if (idx >= 0 && (earliest < 0 || idx < earliest)) {
        earliest = idx;
        matched = token;
      }
    }
    const generic = remaining.match(/@([\w\u4e00-\u9fff·\-]+)/);
    if (earliest < 0 && generic && generic.index != null) {
      earliest = generic.index;
      matched = generic[0];
    }
    if (earliest < 0 || !matched) {
      parts.push(remaining);
      break;
    }
    if (earliest > 0) parts.push(remaining.slice(0, earliest));
    parts.push(
      <span key={key++} className="font-medium text-[#2773ff]">
        {matched}
      </span>
    );
    remaining = remaining.slice(earliest + matched.length);
  }
  return parts;
}

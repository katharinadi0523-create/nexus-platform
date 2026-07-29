"use client";

import { useState } from "react";
import {
  Check,
  ExternalLink,
  FileText,
  GitCommitHorizontal,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type {
  ProjectArtifact,
  ProjectMessage,
} from "@/lib/mock/my-claw/project-conversation";
import { useProjectConversation } from "../project-conversation-provider";
import { ActorAvatar } from "../shared/actor-avatar";

interface AgentReplyProps {
  message: ProjectMessage;
  highlighted?: boolean;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function reviewLabel(status?: string) {
  switch (status) {
    case "accepted":
      return "已接受";
    case "changes_requested":
      return "已要求返工";
    case "unreviewed":
      return "待验收";
    default:
      return null;
  }
}

function ArtifactChip({ artifact }: { artifact: ProjectArtifact }) {
  const icon =
    artifact.kind === "commit" ? (
      <GitCommitHorizontal className="h-3.5 w-3.5" />
    ) : artifact.kind === "preview" || artifact.url ? (
      <ExternalLink className="h-3.5 w-3.5" />
    ) : (
      <FileText className="h-3.5 w-3.5" />
    );

  const content = (
    <>
      {icon}
      <span className="truncate">{artifact.name}</span>
    </>
  );

  if (artifact.url) {
    return (
      <a
        href={artifact.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-2 py-1 text-[12px] text-[#2773ff] transition-colors hover:bg-[#e8f0fb]"
      >
        {content}
      </a>
    );
  }

  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-2 py-1 text-[12px] text-slate-700">
      {content}
    </span>
  );
}

export function AgentReply({ message, highlighted }: AgentReplyProps) {
  const {
    getActor,
    getMessages,
    getUser,
    getArtifacts,
    acceptAgentReply,
    requestAgentChanges,
    openExecution,
  } = useProjectConversation();

  const [expanded, setExpanded] = useState(false);
  const [reworkOpen, setReworkOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const actor =
    message.author.kind === "agent" ? getActor(message.author.id) : undefined;
  const replyTo = message.replyToMessageId
    ? getMessages(message.projectId, message.threadId).find(
        (item) => item.id === message.replyToMessageId
      )
    : undefined;
  const artifacts = getArtifacts(message.artifactIds);
  const review = message.agentReview;
  const reviewText = reviewLabel(review?.status);
  const longContent = message.content.length > 280;
  const displayContent =
    !expanded && longContent
      ? `${message.content.slice(0, 280)}…`
      : message.content;

  const invocationId = message.invocationIds[0];

  return (
    <div
      id={`message-${message.id}`}
      className={`rounded-lg border border-[#e8f0fb] bg-[#f8fbff] px-3 py-2.5 transition-colors ${
        highlighted ? "ring-1 ring-[#2773ff]/30" : ""
      }`}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <ActorAvatar
          kind="agent"
          name={actor?.name ?? "Agent"}
          runtimeStatus={actor?.runtimeStatus}
          size="sm"
        />
        <span className="text-[13px] font-medium text-slate-800">
          {actor?.name ?? "Agent"}
        </span>
        <span className="text-[11px] text-[#5a6779]">
          {formatTime(message.createdAt)}
        </span>
        {reviewText ? (
          <span
            className={`ml-auto rounded px-1.5 py-0.5 text-[11px] font-medium ${
              review?.status === "accepted"
                ? "bg-emerald-50 text-emerald-700"
                : review?.status === "changes_requested"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-[#e8f0fb] text-[#2773ff]"
            }`}
          >
            {reviewText}
          </span>
        ) : null}
      </div>

      {replyTo ? (
        <div className="mb-2 rounded-md border-l-2 border-[#2773ff]/40 bg-white/80 px-2.5 py-1.5 text-[12px] text-[#5a6779]">
          <div className="mb-0.5 font-medium text-slate-600">
            回复{" "}
            {replyTo.author.kind === "human"
              ? getUser(replyTo.author.id)?.name
              : replyTo.author.kind === "agent"
                ? getActor(replyTo.author.id)?.name
                : "系统"}
          </div>
          <div className="line-clamp-2 whitespace-pre-wrap">
            {replyTo.content}
          </div>
        </div>
      ) : null}

      <p className="whitespace-pre-wrap text-[13px] leading-6 text-slate-800">
        {displayContent}
      </p>
      {longContent ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-[12px] font-medium text-[#2773ff] hover:underline"
        >
          {expanded ? "收起" : "展开全文"}
        </button>
      ) : null}

      {artifacts.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {artifacts.map((artifact) => (
            <ArtifactChip key={artifact.id} artifact={artifact} />
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {review?.status === "unreviewed" ? (
          <>
            <Button
              type="button"
              size="sm"
              className="h-7 bg-[#2773ff] px-2.5 text-[12px] hover:bg-[#1f63e0]"
              onClick={() => acceptAgentReply(message.id)}
            >
              <Check className="h-3.5 w-3.5" />
              接受
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 border-[#e2e8f0] px-2.5 text-[12px]"
              onClick={() => setReworkOpen(true)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              要求返工
            </Button>
          </>
        ) : null}
        {invocationId ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[12px] text-[#5a6779]"
            onClick={() => openExecution(invocationId)}
          >
            查看执行
          </Button>
        ) : null}
      </div>

      <Dialog open={reworkOpen} onOpenChange={setReworkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>要求返工</DialogTitle>
          </DialogHeader>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="请说明需要调整的点…"
            className="min-h-[100px] border-[#e2e8f0] text-[13px]"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReworkOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              className="bg-[#2773ff] hover:bg-[#1f63e0]"
              disabled={!feedback.trim()}
              onClick={() => {
                requestAgentChanges(message.id, feedback.trim());
                setReworkOpen(false);
                setFeedback("");
              }}
            >
              发送返工
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

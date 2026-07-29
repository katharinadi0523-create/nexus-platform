"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanban, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";
import { CreateProjectConversationDialog } from "@/components/my-claw/project-conversation/create-project-conversation-dialog";
import { AddMemberDrawer } from "@/components/my-claw/project-conversation/drawers/add-member-drawer";
import { ProjectCapabilityPanels } from "@/components/my-claw/project-tools/project-capability-panels";
import { ProjectIssueBoard } from "@/components/my-claw/project-issues/project-issue-board";
import { ProjectIssueDetailDrawer } from "@/components/my-claw/project-issues/project-issue-detail-drawer";
import { ProjectFilesBrowser } from "@/components/my-claw/project-files/project-files-browser";
import { FileDetailDrawer } from "@/components/my-claw/project-files/file-detail-drawer";
import { MembersOverlapPanel } from "@/components/my-claw/shared/members-overlap-panel";
import { cn } from "@/lib/utils";

interface ProjectOverviewPageProps {
  projectId: string;
  issueId?: string | null;
  view?: "overview" | "issues";
}

export function ProjectOverviewPage({
  projectId,
  issueId,
  view = "overview",
}: ProjectOverviewPageProps) {
  const router = useRouter();
  const {
    getProject,
    getMembers,
    getUser,
    getActor,
    getVisibleConversations,
    currentUserId,
    state,
    openIssueDrawer,
    closeDrawer,
  } = useProjectConversation();

  const [createOpen, setCreateOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [fileDetailId, setFileDetailId] = useState<string | null>(null);

  const project = getProject(projectId);
  const members = getMembers(projectId);
  const conversations = getVisibleConversations(projectId, currentUserId);

  const humans = useMemo(
    () =>
      members
        .filter((m) => m.kind === "human")
        .map((m) => getUser(m.userId))
        .filter(Boolean)
        .map((user) => ({
          key: user!.id,
          kind: "human" as const,
          name: user!.name,
          initials: user!.initials,
        })),
    [getUser, members]
  );

  const agents = useMemo(
    () =>
      members
        .filter((m) => m.kind === "agent")
        .map((m) => getActor(m.actorId))
        .filter(Boolean)
        .map((actor) => ({
          key: actor!.id,
          kind: "agent" as const,
          name: actor!.name,
        })),
    [getActor, members]
  );

  useEffect(() => {
    if (issueId) {
      openIssueDrawer(issueId);
    }
  }, [issueId, openIssueDrawer]);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-[#5a6779]">
        Project 不存在或无权访问
      </div>
    );
  }

  const showIssues = view === "issues";

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden bg-[#f8f9fb]">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-[#eef2f6] bg-white px-6 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <FolderKanban className="h-5 w-5 text-[#2773ff]" />
              <h1 className="truncate text-[18px] font-semibold text-slate-900">
                {project.name}
              </h1>
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                {project.status === "active" ? "进行中" : "已归档"}
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-[13px] text-[#5a6779]">
              {project.description || project.brief}
            </p>
          </div>
          <div className="mt-3 flex gap-1">
            <button
              type="button"
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] font-medium",
                !showIssues
                  ? "bg-[#e8f0fb] text-[#2773ff]"
                  : "text-[#5a6779] hover:bg-slate-50"
              )}
              onClick={() => router.replace(`/my-claw/projects/${projectId}`)}
            >
              概览
            </button>
            <button
              type="button"
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] font-medium",
                showIssues
                  ? "bg-[#e8f0fb] text-[#2773ff]"
                  : "text-[#5a6779] hover:bg-slate-50"
              )}
              onClick={() =>
                router.replace(`/my-claw/projects/${projectId}?view=issues`)
              }
            >
              事项
            </button>
          </div>
        </header>

        {showIssues ? (
          <ProjectIssueBoard
            projectId={projectId}
            onOpenIssue={(id) => {
              openIssueDrawer(id);
              router.replace(
                `/my-claw/projects/${projectId}?view=issues&issue=${id}`
              );
            }}
          />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-2">
              <MembersOverlapPanel
                humans={humans}
                agents={agents}
                onAdd={() => setAddMemberOpen(true)}
                addDisabled={project.status === "archived"}
              />

              <section className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                <div className="flex items-center justify-between">
                  <h2 className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-900">
                    <MessageSquarePlus className="h-3.5 w-3.5 text-[#2773ff]" />
                    会话 · {conversations.length}
                  </h2>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[11px] text-[#2773ff]"
                    onClick={() => setCreateOpen(true)}
                  >
                    新建
                  </Button>
                </div>
                <ul className="mt-3 space-y-1">
                  {conversations.slice(0, 5).map((conversation) => (
                    <li key={conversation.id}>
                      <Link
                        href={`/my-claw/projects/${projectId}/conversations/${conversation.id}`}
                        className="block rounded-lg px-2 py-1.5 text-[13px] text-slate-700 hover:bg-[#f8f9fb]"
                      >
                        {conversation.name}
                      </Link>
                    </li>
                  ))}
                  {conversations.length === 0 ? (
                    <li className="px-2 py-4 text-[12px] text-[#5a6779]">
                      暂无可见会话
                    </li>
                  ) : null}
                </ul>
              </section>

              <ProjectCapabilityPanels projectId={projectId} />

              <section className="rounded-xl border border-[#e2e8f0] bg-white p-4 lg:col-span-2">
                <ProjectFilesBrowser
                  projectId={projectId}
                  onOpenFileDetail={(fileId) => {
                    closeDrawer();
                    setAddMemberOpen(false);
                    setFileDetailId(fileId);
                  }}
                />
              </section>
            </div>
          </div>
        )}
      </div>

      {state.activeDrawer === "issue" && state.activeIssueId ? (
        <div className="pointer-events-none absolute inset-0 z-20 xl:pointer-events-auto xl:static xl:z-auto xl:flex xl:h-full xl:w-[460px] xl:shrink-0">
          <div className="pointer-events-auto relative h-full w-full">
            <ProjectIssueDetailDrawer
              issueId={state.activeIssueId}
              onClose={() => {
                closeDrawer();
                router.replace(
                  showIssues
                    ? `/my-claw/projects/${projectId}?view=issues`
                    : `/my-claw/projects/${projectId}`
                );
              }}
              onOpenConversation={(conversationId, messageId) => {
                const qs = messageId ? `?message=${messageId}` : "";
                router.push(
                  `/my-claw/projects/${projectId}/conversations/${conversationId}${qs}`
                );
              }}
            />
          </div>
        </div>
      ) : fileDetailId ? (
        <div className="pointer-events-none absolute inset-0 z-20 xl:pointer-events-auto xl:static xl:z-auto xl:flex xl:h-full xl:w-[460px] xl:shrink-0">
          <div className="pointer-events-auto relative h-full w-full">
            <FileDetailDrawer
              fileId={fileDetailId}
              onClose={() => setFileDetailId(null)}
            />
          </div>
        </div>
      ) : addMemberOpen ? (
        <div className="pointer-events-none absolute inset-0 z-20 xl:pointer-events-auto xl:static xl:z-auto xl:flex xl:h-full xl:w-[460px] xl:shrink-0">
          <div className="pointer-events-auto relative h-full w-full">
            <AddMemberDrawer
              projectId={projectId}
              onClose={() => setAddMemberOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <CreateProjectConversationDialog
        projectId={projectId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          router.push(
            `/my-claw/projects/${projectId}/conversations/${id}`
          );
        }}
      />
    </div>
  );
}

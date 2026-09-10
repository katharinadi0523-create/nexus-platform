import { MY_CLAW_BRAND_NAME } from "@/lib/mock/my-claw/branding";
import { buildExpenseConversationView } from "@/lib/mock/my-claw/expense-adapter";
import { buildEnterpriseConversationView } from "@/lib/mock/my-claw/enterprise-flows";
import {
  buildResearchSnapshot,
  RESEARCH_AGENTS,
  RESEARCH_DEFAULT_STEP,
  RESEARCH_MAX_STEP,
} from "@/lib/mock/my-claw/research-multi-agent";
import type { MyClawSessionListItem } from "@/lib/mock/my-claw/types";
import type {
  AgentActor,
  CollaborationProject,
  ProjectConversation,
  ProjectMessage,
} from "@/lib/mock/my-claw/project-conversation";

export type ConversationSearchSource = "personal" | "project";

export interface SearchableConversationMessage {
  id: string;
  content: string;
}

export interface SearchableConversation {
  id: string;
  source: ConversationSearchSource;
  title: string;
  agentName: string;
  updatedAt: string;
  href: string;
  preview: string;
  messages: SearchableConversationMessage[];
  projectId?: string;
}

export interface ConversationSearchHit {
  conversation: SearchableConversation;
  matchCount: number;
  snippet: string;
  matchedMessageId?: string;
  titleMatched: boolean;
}

const SNIPPET_RADIUS = 28;

export function countExactMatches(haystack: string, needle: string): number {
  if (!haystack || !needle) return 0;
  const source = haystack.toLowerCase();
  const target = needle.toLowerCase();
  let count = 0;
  let from = 0;
  while (from <= source.length - target.length) {
    const index = source.indexOf(target, from);
    if (index === -1) break;
    count += 1;
    from = index + target.length;
  }
  return count;
}

export function extractSnippet(
  text: string,
  query: string,
  radius: number = SNIPPET_RADIUS,
): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const needle = query.trim();
  if (!needle) {
    return normalized.length > radius * 2
      ? `${normalized.slice(0, radius * 2)}…`
      : normalized;
  }

  const lower = normalized.toLowerCase();
  const target = needle.toLowerCase();
  const index = lower.indexOf(target);
  if (index === -1) {
    return normalized.length > radius * 2
      ? `${normalized.slice(0, radius * 2)}…`
      : normalized;
  }

  const start = Math.max(0, index - radius);
  const end = Math.min(normalized.length, index + needle.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < normalized.length ? "…" : "";
  return `${prefix}${normalized.slice(start, end)}${suffix}`;
}

function lastMessagePreview(messages: SearchableConversationMessage[]): string {
  const last = messages[messages.length - 1];
  return last?.content.replace(/\s+/g, " ").trim() ?? "";
}

function personalHref(sessionId: string): string {
  return `/my-claw/chat?sessionId=${encodeURIComponent(sessionId)}`;
}

function projectHref(projectId: string, conversationId: string): string {
  return `/my-claw/projects/${projectId}/conversations/${conversationId}`;
}

function isSearchableResearchMessage(
  message: { role: string; kind?: string; text?: string },
): boolean {
  if (!message.text?.trim()) return false;
  if (message.role === "user") return true;
  if (message.role !== "assistant") return false;
  // Only the user-visible reply body; skip thinking / tools / files / knowledge.
  return !message.kind;
}

export function getPersonalSearchableMessages(
  session: MyClawSessionListItem,
): SearchableConversationMessage[] {
  if (session.kind === "expense") {
    return buildExpenseConversationView()
      .nodes.flatMap((node) => {
        if (node.type !== "user" && node.type !== "output") return [];
        const content = node.timeline.message.content?.trim();
        if (!content) return [];
        return [{ id: node.timeline.message.id, content }];
      });
  }

  if (session.kind === "enterprise_session") {
    return buildEnterpriseConversationView({ session }).nodes.flatMap((node) => {
      if (node.type !== "user" && node.type !== "output") return [];
      const content = node.timeline.message.content?.trim();
      if (!content) return [];
      return [{ id: node.timeline.message.id, content }];
    });
  }

  if (session.kind === "research_multi_agent") {
    const step =
      RESEARCH_DEFAULT_STEP >= 0 ? RESEARCH_DEFAULT_STEP : RESEARCH_MAX_STEP;
    return buildResearchSnapshot(step)
      .mainMessages.filter(isSearchableResearchMessage)
      .map((message) => ({
        id: message.id,
        content: (message.text ?? "").trim(),
      }));
  }

  return [];
}

export function getPersonalConversationAgentName(
  session: MyClawSessionListItem,
): string {
  if (session.kind === "research_multi_agent") {
    return RESEARCH_AGENTS.main.name;
  }
  return MY_CLAW_BRAND_NAME;
}

export function toPersonalSearchableConversation(
  session: MyClawSessionListItem,
): SearchableConversation {
  const messages = getPersonalSearchableMessages(session);
  return {
    id: session.id,
    source: "personal",
    title: session.title,
    agentName: getPersonalConversationAgentName(session),
    updatedAt: session.updatedAt,
    href: personalHref(session.id),
    preview: lastMessagePreview(messages) || session.preview,
    messages,
  };
}

export function formatConversationAgentNames(
  agentBindingIds: string[],
  getActor: (id: string) => AgentActor | undefined,
): string {
  const names = agentBindingIds
    .map((id) => getActor(id)?.name?.trim())
    .filter((name): name is string => Boolean(name));
  if (names.length === 0) return "未指定 Agent";
  return names.join("、");
}

export function isSearchableProjectMessage(message: ProjectMessage): boolean {
  return message.kind === "human" || message.kind === "agent_reply";
}

export function toProjectSearchableConversation(options: {
  conversation: ProjectConversation;
  project: CollaborationProject | undefined;
  messages: ProjectMessage[];
  getActor: (id: string) => AgentActor | undefined;
}): SearchableConversation | null {
  const { conversation, project, messages, getActor } = options;
  if (!project || project.status !== "active" || conversation.archivedAt) {
    return null;
  }

  const searchableMessages = messages
    .filter(isSearchableProjectMessage)
    .map((message) => ({
      id: message.id,
      content: message.content.trim(),
    }))
    .filter((message) => message.content.length > 0);

  return {
    id: conversation.id,
    source: "project",
    title: conversation.name,
    agentName: formatConversationAgentNames(
      conversation.agentBindingIds,
      getActor,
    ),
    updatedAt: conversation.updatedAt,
    href: projectHref(conversation.projectId, conversation.id),
    preview: lastMessagePreview(searchableMessages),
    messages: searchableMessages,
    projectId: conversation.projectId,
  };
}

function pickSnippet(conversation: SearchableConversation, query: string): {
  snippet: string;
  matchedMessageId?: string;
} {
  const needle = query.trim();
  if (!needle) {
    return { snippet: extractSnippet(conversation.preview, "") };
  }

  let best:
    | { message: SearchableConversationMessage; matchCount: number }
    | undefined;
  for (const message of conversation.messages) {
    const matchCount = countExactMatches(message.content, needle);
    if (matchCount === 0) continue;
    if (!best || matchCount > best.matchCount) {
      best = { message, matchCount };
    }
  }

  if (best) {
    return {
      snippet: extractSnippet(best.message.content, needle),
      matchedMessageId: best.message.id,
    };
  }

  return { snippet: extractSnippet(conversation.preview, "") };
}

export function searchConversations(
  conversations: SearchableConversation[],
  query: string,
): ConversationSearchHit[] {
  const needle = query.trim();

  if (!needle) {
    return [...conversations]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .map((conversation) => ({
        conversation,
        matchCount: 0,
        snippet: extractSnippet(conversation.preview, ""),
        titleMatched: false,
      }));
  }

  return conversations
    .map((conversation) => {
      const titleMatched =
        countExactMatches(conversation.title, needle) > 0;
      const titleCount = countExactMatches(conversation.title, needle);
      const contentCount = conversation.messages.reduce(
        (sum, message) => sum + countExactMatches(message.content, needle),
        0,
      );
      const matchCount = titleCount + contentCount;
      const { snippet, matchedMessageId } = pickSnippet(conversation, needle);
      return {
        conversation,
        matchCount,
        snippet,
        matchedMessageId,
        titleMatched,
      };
    })
    .filter((hit) => hit.matchCount > 0)
    .sort((a, b) => {
      if (a.matchCount !== b.matchCount) return b.matchCount - a.matchCount;
      return (
        new Date(b.conversation.updatedAt).getTime() -
        new Date(a.conversation.updatedAt).getTime()
      );
    });
}

export function buildConversationHref(hit: ConversationSearchHit): string {
  const { conversation, matchedMessageId } = hit;
  if (conversation.source === "project" && matchedMessageId) {
    return `${conversation.href}?message=${encodeURIComponent(matchedMessageId)}`;
  }
  return conversation.href;
}

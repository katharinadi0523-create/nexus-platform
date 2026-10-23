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
  authorLabel: string;
  role: "user" | "agent";
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
  score: number;
  matchedMessages: ConversationSearchMessageHit[];
  titleMatched: boolean;
}

export interface ConversationSearchMessageHit {
  message: SearchableConversationMessage;
  matchCount: number;
  snippet: string;
}

const SNIPPET_RADIUS = 28;
const RECENT_CONVERSATION_LIMIT = 12;

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
        return [{
          id: node.timeline.message.id,
          content,
          authorLabel: node.type === "user" ? "你" : MY_CLAW_BRAND_NAME,
          role: node.type === "user" ? "user" : "agent",
        }];
      });
  }

  if (session.kind === "enterprise_session") {
    return buildEnterpriseConversationView({ session }).nodes.flatMap((node) => {
      if (node.type !== "user" && node.type !== "output") return [];
      const content = node.timeline.message.content?.trim();
      if (!content) return [];
      return [{
        id: node.timeline.message.id,
        content,
        authorLabel: node.type === "user" ? "你" : node.timeline.message.sender,
        role: node.type === "user" ? "user" : "agent",
      }];
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
        authorLabel:
          message.role === "user" ? "你" : RESEARCH_AGENTS.main.name,
        role: message.role === "user" ? "user" : "agent",
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
  getUser: (id: string) => { name: string } | undefined;
}): SearchableConversation | null {
  const { conversation, project, messages, getActor, getUser } = options;
  if (!project || project.status !== "active" || conversation.archivedAt) {
    return null;
  }

  const searchableMessages = messages
    .filter(isSearchableProjectMessage)
    .map((message) => ({
      id: message.id,
      content: message.content.trim(),
      authorLabel:
        message.author.kind === "human"
          ? getUser(message.author.id)?.name ?? "用户"
          : getActor(message.author.id)?.name ?? "Agent",
      role: message.author.kind === "human" ? "user" as const : "agent" as const,
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

function findMatchedMessages(
  conversation: SearchableConversation,
  query: string,
): ConversationSearchMessageHit[] {
  const needle = query.trim();
  if (!needle) return [];

  return conversation.messages
    .map((message, index) => ({
      message,
      matchCount: countExactMatches(message.content, needle),
      snippet: extractSnippet(message.content, needle),
      index,
    }))
    .filter((hit) => hit.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount || b.index - a.index)
    .map((hit) => ({
      message: hit.message,
      matchCount: hit.matchCount,
      snippet: hit.snippet,
    }));
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
      .slice(0, RECENT_CONVERSATION_LIMIT)
      .map((conversation) => ({
        conversation,
        matchCount: 0,
        score: 0,
        matchedMessages: [],
        titleMatched: false,
      }));
  }

  return conversations
    .map((conversation) => {
      const titleMatched =
        countExactMatches(conversation.title, needle) > 0;
      const titleCount = countExactMatches(conversation.title, needle);
      const matchedMessages = findMatchedMessages(conversation, needle);
      const contentCount = matchedMessages.reduce(
        (sum, hit) => sum + hit.matchCount,
        0,
      );
      const matchCount = titleCount + contentCount;
      const bestMessageScore = matchedMessages[0]?.matchCount ?? 0;
      return {
        conversation,
        matchCount,
        score: titleCount * 3 + bestMessageScore,
        matchedMessages,
        titleMatched,
      };
    })
    .filter((hit) => hit.matchCount > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return (
        new Date(b.conversation.updatedAt).getTime() -
        new Date(a.conversation.updatedAt).getTime()
      );
    });
}

export function buildConversationHref(
  hit: ConversationSearchHit,
  messageId?: string,
): string {
  const { conversation } = hit;
  if (messageId) {
    const separator = conversation.href.includes("?") ? "&" : "?";
    return `${conversation.href}${separator}message=${encodeURIComponent(messageId)}`;
  }
  return conversation.href;
}

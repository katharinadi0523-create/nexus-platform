"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Menu,
  Network,
  Plus,
  Share2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResearchMultiAgentChatPane, ResearchMultiAgentProcessMonitor, ResearchMultiAgentSessionProvider } from "@/components/claw-hub-next/research-multi-agent-debug-panel";
import { getMultiAgentCreateDetail } from "@/lib/mock/multi-agent-create";
import type {
  CapabilityToolItem,
  CapabilityToolKind,
  ClawDetailData,
  ClawKnowledgeAssets,
} from "@/lib/mock/claw-hub-next";
import { buildKnowledgeAssetsFromLegacy } from "@/lib/mock/claw-hub-next";
import {
  getShelvedMultiAgentById,
  type ShelvedMultiAgentItem,
} from "@/lib/published-multi-agents";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
  timeLabel: string;
}

interface ResourceCountItem {
  name: string;
  count: number;
}

interface MultiAgentAppMeta {
  viewCount: string;
  usageCount: string;
  favoriteCount: number;
  shareCount: string;
  tags: string[];
  description: string;
  author: string;
  authorHandle: string;
  updatedAt: string;
  /** 主智能体挂接的资源类型数量 */
  publicConfig: ResourceCountItem[];
  /** 子智能体均为私有配置 */
  privateConfig: ResourceCountItem[];
}

function getMockConversations(): Conversation[] {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 5);

  return [
    {
      id: "conv-1",
      title: "昨天 15:30 会话",
      updatedAt: new Date(yesterday.setHours(15, 30, 0)),
      timeLabel: "昨天",
    },
    {
      id: "conv-2",
      title: "过去 7 天 会话 1",
      updatedAt: lastWeek,
      timeLabel: "过去 7 天",
    },
    {
      id: "conv-3",
      title: "过去 7 天 会话 2",
      updatedAt: new Date(lastWeek.getTime() - 2 * 24 * 60 * 60 * 1000),
      timeLabel: "过去 7 天",
    },
  ];
}

function buildUsageDetail(item: ShelvedMultiAgentItem): ClawDetailData {
  const base = getMultiAgentCreateDetail();
  return {
    ...base,
    overview: {
      ...base.overview,
      id: item.id,
      name: item.name,
      summary: item.description,
      publishStatus: "已发布",
    },
  };
}

function countEnabled<T extends { enabled?: boolean }>(items: T[] | undefined): number {
  return (items ?? []).filter((item) => item.enabled !== false).length;
}

/** 与插件配置页一致的类型推断 */
function resolveCapabilityToolKind(item: CapabilityToolItem): CapabilityToolKind {
  if (item.kind) {
    return item.kind;
  }
  const raw = `${item.meta ?? ""} ${item.badge ?? ""} ${item.name ?? ""}`.toLowerCase();
  if (raw.includes("工作流") || raw.includes("workflow")) {
    return "workflow";
  }
  if (raw.includes("插件") || raw.includes("openapi")) {
    return "plugin";
  }
  if (raw.includes("mcp") || raw.includes("接口")) {
    return "mcp";
  }
  if (raw.includes("本体")) {
    return "ontology_action";
  }
  return "mcp";
}

const TOOL_KIND_PUBLIC_LABELS: Record<CapabilityToolKind, string> = {
  plugin: "OpenAPI",
  mcp: "MCP",
  ontology_action: "本体动作",
  workflow: "工作流",
};

const TOOL_KIND_PUBLIC_ORDER: CapabilityToolKind[] = [
  "plugin",
  "mcp",
  "ontology_action",
  "workflow",
];

function resolveKnowledgeAssets(detail: ClawDetailData): ClawKnowledgeAssets {
  if (detail.knowledgeAssets) {
    return detail.knowledgeAssets;
  }
  return buildKnowledgeAssetsFromLegacy(
    detail.capabilityConfig.knowledge,
    detail.overview.updatedBy || detail.overview.creator
  );
}

/**
 * 公开配置：按实际挂载类型拆分
 * - 插件类：OpenAPI / MCP / 本体动作（及工作流）
 * - skill
 * - 知识类：知识库 / 数据库 / 本体对象 / 术语库
 * 私有配置：子智能体数量（本期均为私有）
 */
function buildAppMeta(
  item: ShelvedMultiAgentItem,
  detail: ClawDetailData
): MultiAgentAppMeta {
  const { tools, skills, agents } = detail.capabilityConfig;
  const knowledgeAssets = resolveKnowledgeAssets(detail);

  const toolItems = [
    ...(tools.platform ?? []),
    ...(tools.tenant ?? []),
    ...(tools.claw ?? []),
  ].filter((tool) => tool.enabled !== false);

  const toolCounts: Record<CapabilityToolKind, number> = {
    plugin: 0,
    mcp: 0,
    ontology_action: 0,
    workflow: 0,
  };
  for (const tool of toolItems) {
    toolCounts[resolveCapabilityToolKind(tool)] += 1;
  }

  const skillCount = countEnabled([
    ...(skills.platform ?? []),
    ...(skills.tenant ?? []),
    ...(skills.claw ?? []),
  ]);
  const subAgentCount = countEnabled(agents.claw ?? []);

  const publicConfig: ResourceCountItem[] = [
    ...TOOL_KIND_PUBLIC_ORDER.map((kind) => ({
      name: TOOL_KIND_PUBLIC_LABELS[kind],
      count: toolCounts[kind],
    })),
    { name: "skill", count: skillCount },
    {
      name: "知识库",
      count: countEnabled(knowledgeAssets.knowledgeBases),
    },
    {
      name: "数据库",
      count: countEnabled(knowledgeAssets.databases),
    },
    {
      name: "本体对象",
      count: countEnabled(knowledgeAssets.ontologyObjects),
    },
    {
      name: "术语库",
      count: countEnabled(knowledgeAssets.termBanks),
    },
  ].filter((row) => row.count > 0);

  const privateConfig: ResourceCountItem[] =
    subAgentCount > 0 ? [{ name: "子智能体", count: subAgentCount }] : [];

  const authorRaw = item.author.trim() || "@当前用户";
  const authorHandle = authorRaw.startsWith("@") ? authorRaw : `@${authorRaw}`;
  const authorName = authorHandle.replace(/^@/, "") || "当前用户";

  return {
    viewCount: "12.6k",
    usageCount: "3.8k",
    favoriteCount: 186,
    shareCount: "42",
    tags: item.agentTypes.length > 0 ? item.agentTypes : ["多智能体"],
    description: item.description,
    author: authorName,
    authorHandle,
    updatedAt: item.shelvedAt,
    publicConfig,
    privateConfig,
  };
}

export default function MultiAgentUsagePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [shelved, setShelved] = useState<ShelvedMultiAgentItem | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(true);

  useEffect(() => {
    if (!id) return;
    const item = getShelvedMultiAgentById(id);
    if (!item) {
      router.replace("/app-marketplace");
      return;
    }
    setShelved(item);
    setConversations(getMockConversations());
  }, [id, router]);

  const detail = useMemo(
    () => (shelved ? buildUsageDetail(shelved) : null),
    [shelved]
  );

  const appMeta = useMemo(
    () => (shelved && detail ? buildAppMeta(shelved, detail) : null),
    [shelved, detail]
  );

  const handleNewConversation = () => {
    setSelectedConversationId(null);
    setSessionKey((key) => key + 1);
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSessionKey((key) => key + 1);
  };

  if (!shelved || !detail || !appMeta) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 bg-white">
      {/* 左侧：智能体信息 + 对话历史 */}
      <div className="flex w-64 flex-col border-r border-gray-200">
        <div className="flex items-center gap-2 border-b border-gray-200 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/app-marketplace")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <Network className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-gray-900">
                {shelved.name}
              </div>
              <div className="truncate text-xs text-gray-500">
                {shelved.author}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <Button
            onClick={handleNewConversation}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            新会话
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            {conversations.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                暂无历史会话
              </div>
            ) : (
              conversations.reduce((acc, conv, idx) => {
                const prevConv = idx > 0 ? conversations[idx - 1] : null;
                const shouldShowLabel =
                  !prevConv || prevConv.timeLabel !== conv.timeLabel;
                if (shouldShowLabel) {
                  acc.push(
                    <div
                      key={`label-${conv.timeLabel}`}
                      className="pb-1 pt-2 text-xs font-medium text-gray-500"
                    >
                      {conv.timeLabel}
                    </div>
                  );
                }
                acc.push(
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelectConversation(conv.id)}
                    className={cn(
                      "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                      selectedConversationId === conv.id
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {conv.title}
                  </button>
                );
                return acc;
              }, [] as React.ReactNode[])
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 中间：对话 | 过程监控 | 应用详情 */}
      <ResearchMultiAgentSessionProvider
        key={`usage-${id}-${selectedConversationId ?? "new"}-${sessionKey}`}
        detail={detail}
      >
        <div className="flex min-h-0 min-w-0 flex-1">
          {/* 对话窗口 */}
          <div className="min-h-0 min-w-0 flex-1 border-r border-gray-200">
            <ResearchMultiAgentChatPane />
          </div>

          {/* 过程监控（任务 / 文件 / 工具），位于应用详情左侧 */}
          <div className="w-[280px] shrink-0 border-r border-gray-200 xl:w-[320px]">
            <ResearchMultiAgentProcessMonitor />
          </div>

          {/* 最右侧：应用详情 */}
          <div
            className={cn(
              "flex flex-col bg-white transition-all duration-200",
              detailsPanelOpen ? "w-80" : "w-12"
            )}
          >
            {detailsPanelOpen ? (
              <>
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-4">
                  <h3 className="text-base font-semibold text-gray-900">应用详情</h3>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDetailsPanelOpen(false)}
                      className="h-7 w-7 text-gray-500 hover:text-gray-700"
                      title="收起"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push("/app-marketplace")}
                      className="h-7 w-7 text-gray-500 hover:text-gray-700"
                      title="关闭"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <ScrollArea className="min-h-0 flex-1">
                  <div className="space-y-5 p-4">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">
                          {appMeta.viewCount}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">浏览量</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">
                          {appMeta.usageCount}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">使用量</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">
                          {appMeta.favoriteCount}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">收藏量</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900">
                          {appMeta.shareCount}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">分享量</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-200 bg-white hover:bg-gray-50"
                      >
                        <Heart className="mr-1.5 h-4 w-4" />
                        收藏
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-200 bg-white hover:bg-gray-50"
                      >
                        <Share2 className="mr-1.5 h-4 w-4" />
                        分享
                      </Button>
                    </div>

                    <div>
                      <p className="text-sm leading-relaxed text-gray-600">
                        {appMeta.description}
                      </p>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-gray-900">
                        应用标签
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {appMeta.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-gray-100 font-normal text-gray-600 hover:bg-gray-200"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-gray-900">
                        发布信息
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>
                          发布人: {appMeta.author} {appMeta.authorHandle}
                        </div>
                        <div>更新时间: {appMeta.updatedAt}</div>
                      </div>
                    </div>

                    {appMeta.publicConfig.length > 0 ? (
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-gray-900">
                          公开配置
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {appMeta.publicConfig.map((item) => (
                            <Badge
                              key={item.name}
                              variant="secondary"
                              className="bg-gray-100 font-normal text-gray-600 hover:bg-gray-200"
                            >
                              {item.name}*{item.count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {appMeta.privateConfig.length > 0 ? (
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-gray-900">
                          私有配置
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {appMeta.privateConfig.map((item) => (
                            <Badge
                              key={item.name}
                              variant="secondary"
                              className="bg-gray-100 font-normal text-gray-600 hover:bg-gray-200"
                            >
                              {item.name}*{item.count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex h-full flex-col items-center gap-2 py-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDetailsPanelOpen(true)}
                  className="h-8 w-8 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="展开应用详情"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/app-marketplace")}
                  className="h-8 w-8 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  title="关闭"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </ResearchMultiAgentSessionProvider>
    </div>
  );
}

"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { AgentCard } from "@/components/my-claw/agents/agent-card";
import { useMyClaw } from "@/components/my-claw/provider";
import { Input } from "@/components/ui/input";
import {
  ENTERPRISE_AGENT_CATEGORY_TABS,
  ENTERPRISE_AGENT_SOURCE_SCOPE_TABS,
  filterEnterpriseAgentList,
  getEnterpriseAgentById,
  isEnterpriseAgentFavorite,
  type EnterpriseAgentSort,
  type EnterpriseAgentSourceScope,
} from "@/lib/mock/my-claw/agents";
import { cn } from "@/lib/utils";

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium transition",
        active
          ? "bg-[#2773ff] text-white shadow-sm"
          : "border border-[#dbeafe] bg-white text-[#5a6779] hover:border-[#93c5fd] hover:text-[#2773ff]"
      )}
    >
      {children}
    </button>
  );
}

export function AgentsPlaza() {
  const {
    summonAgent,
    summonedAgentIds,
    selectedAgentId,
  } = useMyClaw();

  const [query, setQuery] = useState("");
  const [sourceScope, setSourceScope] =
    useState<EnterpriseAgentSourceScope>("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<EnterpriseAgentSort>("latest");
  const [favoriteOverrides, setFavoriteOverrides] = useState<
    Record<string, boolean>
  >({});

  const agents = useMemo(
    () =>
      filterEnterpriseAgentList({
        query,
        category,
        sourceScope,
        sort,
        favoriteOverrides,
      }),
    [query, category, sourceScope, sort, favoriteOverrides]
  );

  const handleToggleFavorite = (agentId: string) => {
    const agent = getEnterpriseAgentById(agentId);
    if (!agent) return;
    const current = isEnterpriseAgentFavorite(agent, favoriteOverrides);
    const next = !current;
    setFavoriteOverrides((prev) => ({ ...prev, [agentId]: next }));
    toast.success(next ? `已收藏「${agent.name}」` : `已取消收藏「${agent.name}」`);
  };

  const handleSummon = (agentId: string) => {
    const agent = getEnterpriseAgentById(agentId);
    if (!agent) return;
    summonAgent(agentId);
    toast.success(
      agent.researchMultiAgent || agent.id === "research-claw"
        ? `已召唤「${agent.name}」，会话已由其接管`
        : `已召唤「${agent.name}」`
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#e8f0fb]">
      <div
        className="flex-1 overflow-y-auto"
        style={{
          background:
            "linear-gradient(180deg, #f2f7fd 0%, #e8f0fb 38%, #e4edf8 100%)",
        }}
      >
        <section className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 py-5 md:px-6">
          <header className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <h1
                className="inline-block text-[26px] font-semibold leading-tight"
                style={{
                  backgroundImage: "linear-gradient(to right, #3CC6FF, #3857FF)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                }}
              >
                智能体广场
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#5a6779]">
                按来源与分类浏览企业智能体，召唤后进入对话。
              </p>
            </div>

            <label className="relative flex w-full min-w-[220px] max-w-[320px] items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#2773ff]" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="输入智能体名称检索"
                autoComplete="off"
                className="h-10 rounded-xl border-[#dbeafe] bg-white pl-9 shadow-sm"
              />
            </label>
          </header>

          <nav
            className="rounded-xl border border-[#dbeafe] bg-white p-2.5 shadow-sm"
            aria-label="来源范围"
          >
            <div className="flex flex-wrap gap-2">
              {ENTERPRISE_AGENT_SOURCE_SCOPE_TABS.map((tab) => (
                <FilterChip
                  key={tab.id}
                  active={sourceScope === tab.id}
                  onClick={() => setSourceScope(tab.id)}
                >
                  {tab.label}
                </FilterChip>
              ))}
            </div>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <nav
              className="min-w-0 flex-1 rounded-xl border border-[#dbeafe] bg-[rgba(219,234,254,0.55)] p-2"
              aria-label="智能体分类"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                {ENTERPRISE_AGENT_CATEGORY_TABS.map((tab) => (
                  <FilterChip
                    key={tab.id}
                    active={category === tab.id}
                    onClick={() => setCategory(tab.id)}
                  >
                    {tab.label}
                  </FilterChip>
                ))}
              </div>
            </nav>

            <div
              className="inline-flex shrink-0 overflow-hidden rounded-[10px] border border-[#dbeafe] bg-white"
              aria-label="排序"
            >
              {(
                [
                  ["latest", "最新"],
                  ["hot", "最热"],
                ] as const
              ).map(([id, label], index) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSort(id)}
                  className={cn(
                    "inline-flex h-8 items-center px-4 text-sm font-medium transition",
                    index === 0 && "border-r border-[#e2e8f0]",
                    sort === id
                      ? "bg-[#2773ff] text-white"
                      : "bg-transparent text-[#5a6779] hover:text-[#2773ff]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <section
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            aria-label="智能体列表"
          >
            {agents.length > 0 ? (
              agents.map((agent) => {
                const favorite = isEnterpriseAgentFavorite(
                  agent,
                  favoriteOverrides
                );
                const summoned = summonedAgentIds.includes(agent.id);
                const selected = selectedAgentId === agent.id;
                return (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    favorite={favorite}
                    summoned={summoned}
                    selected={selected}
                    onToggleFavorite={handleToggleFavorite}
                    onSummon={handleSummon}
                  />
                );
              })
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-[#bfdbfe] bg-white/70 px-6 py-12 text-center text-sm text-[#5a6779]">
                未找到匹配的智能体，可尝试切换来源、分类、排序或调整关键词。
              </div>
            )}
          </section>
        </section>
      </div>
    </div>
  );
}

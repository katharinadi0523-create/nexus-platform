"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { AgentCard } from "@/components/my-claw/agents/agent-card";
import { useMyClaw } from "@/components/my-claw/provider";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

export function AgentsPlaza() {
  const {
    summonAgent,
    summonedAgentIds,
    selectedAgentId,
    favoriteOverrides,
    setAgentFavorite,
  } = useMyClaw();

  const [query, setQuery] = useState("");
  const [sourceScope, setSourceScope] =
    useState<EnterpriseAgentSourceScope>("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<EnterpriseAgentSort>("latest");

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
    setAgentFavorite(agentId, next);
    toast.success(next ? `已收藏「${agent.name}」` : `已取消收藏「${agent.name}」`);
  };

  const handleSummon = (agentId: string) => {
    const agent = getEnterpriseAgentById(agentId);
    if (!agent) return;
    summonAgent(agentId);
    toast.success(
      agent.researchMultiAgent || agent.id === "research-claw"
        ? `已调用「${agent.name}」，会话已由其接管`
        : `已调用「${agent.name}」`
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8fafc]">
      <div className="flex-1 overflow-y-auto">
        <section className="mx-auto grid w-full max-w-[1320px] gap-5 px-5 py-5 md:px-8">
          <header className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <h1 className="text-[22px] font-semibold leading-7 tracking-normal text-slate-900">
                智能体广场
              </h1>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                按来源与分类浏览企业智能体，调用后进入当前会话。
              </p>
            </div>

            <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 lg:w-auto">
              <label className="relative flex w-full min-w-[220px] max-w-[320px] flex-1 items-center">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#2773ff]" />
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="输入智能体名称检索"
                  autoComplete="off"
                  className="h-9 rounded-md border-slate-200 bg-white pl-9 text-[13px] shadow-none"
                />
              </label>
              <Select
                ariaLabel="智能体排序方式"
                value={sort}
                onValueChange={(value) => setSort(value as EnterpriseAgentSort)}
                options={[
                  { value: "latest", label: "最新发布" },
                  { value: "hot", label: "最热" },
                ]}
                className="h-9 w-[120px] shrink-0 rounded-md border-slate-200 bg-white px-2.5 text-[13px] shadow-none"
              />
            </div>
          </header>

          <div className="space-y-2">
            <nav className="flex flex-wrap items-center gap-0.5" aria-label="智能体来源筛选">
              {ENTERPRISE_AGENT_SOURCE_SCOPE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={sourceScope === tab.id}
                  onClick={() => setSourceScope(tab.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[13px] leading-6 transition-colors",
                    sourceScope === tab.id
                      ? "bg-[#eaf2ff] font-medium text-[#2773ff]"
                      : "text-[#334155] hover:text-[#2773ff]"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <nav className="flex flex-wrap items-center gap-0.5" aria-label="智能体类别筛选">
              {ENTERPRISE_AGENT_CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={category === tab.id}
                  onClick={() => setCategory(tab.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[13px] leading-6 transition-colors",
                    category === tab.id
                      ? "bg-[#eaf2ff] font-medium text-[#2773ff]"
                      : "text-[#334155] hover:text-[#2773ff]"
                  )}
                >
                  {tab.id === "all" ? "全部类型" : tab.label}
                </button>
              ))}
            </nav>
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
              <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
                未找到匹配的智能体，试试调整关键词或筛选条件。
              </div>
            )}
          </section>
        </section>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Cable, CheckCircle2, CircleHelp } from "lucide-react";
import {
  EXTERNAL_SERVICE_CATALOG,
  EXTERNAL_SERVICE_WORKSPACES,
  useExternalServicesDemo,
} from "@/lib/external-services-demo";
import { ServiceLogo } from "@/components/external-services/service-logo";

interface Component {
  id: string;
  name: string;
  author: string;
  description: string;
  tags: string[];
  type: "plugin" | "mcp";
  icon?: string;
}

const MOCK_COMPONENTS: Component[] = [
  {
    id: "1",
    name: "音频解析",
    author: "@发布者",
    description: "音频解析工具,输出长字符串,支持MP3/M4A/WAV/PCM/AMR/MPGA/OGG类别。",
    tags: ["办公人事", "企业服务"],
    type: "plugin",
  },
  {
    id: "2",
    name: "音频解析",
    author: "@发布者",
    description: "音频解析工具,输出长字符串,支持MP3/M4A/WAV/PCM/AMR/MPGA/OGG类别。",
    tags: ["办公人事", "企业服务"],
    type: "plugin",
  },
  {
    id: "3",
    name: "图片理解",
    author: "@发布者",
    description: "音频解析工具,输出长字符串,支持MP3/M4A/WAV/PCM/AMR/MPGA/OGG类别。",
    tags: ["办公人事", "企业服务", "效率工具", "学习教育"],
    type: "mcp",
  },
  {
    id: "4",
    name: "音频解析",
    author: "@发布者",
    description: "音频解析工具,输出长字符串,支持MP3/M4A/WAV/PCM/AMR/MPGA/OGG类别。",
    tags: ["办公人事", "企业服务"],
    type: "plugin",
  },
  {
    id: "5",
    name: "音频解析",
    author: "@发布者",
    description: "音频解析工具,输出长字符串,支持MP3/M4A/WAV/PCM/AMR/MPGA/OGG类别。",
    tags: ["办公人事", "企业服务"],
    type: "plugin",
  },
  {
    id: "6",
    name: "图片理解",
    author: "@发布者",
    description: "音频解析工具,输出长字符串,支持MP3/M4A/WAV/PCM/AMR/MPGA/OGG类别。",
    tags: ["办公人事", "企业服务", "效率工具", "学习教育"],
    type: "mcp",
  },
  {
    id: "7",
    name: "音频解析",
    author: "@发布者",
    description: "音频解析工具,输出长字符串,支持MP3/M4A/WAV/PCM/AMR/MPGA/OGG类别。",
    tags: ["办公人事", "企业服务"],
    type: "plugin",
  },
  {
    id: "8",
    name: "音频解析",
    author: "@发布者",
    description: "音频解析工具,输出长字符串,支持MP3/M4A/WAV/PCM/AMR/MPGA/OGG类别。",
    tags: ["办公人事", "企业服务"],
    type: "plugin",
  },
  {
    id: "9",
    name: "图片理解",
    author: "@发布者",
    description: "音频解析工具,输出长字符串,支持MP3/M4A/WAV/PCM/AMR/MPGA/OGG类别。",
    tags: ["办公人事", "企业服务", "效率工具", "学习教育"],
    type: "mcp",
  },
];

const categories = [
  "全部类型",
  "办公人事",
  "企业服务",
  "效率工具",
  "学习教育",
  "营销创办",
  "智能制造",
  "其他",
];

const componentTypes = [
  { value: "all", label: "全部组件" },
];

export default function PluginMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeCategory, setActiveCategory] = useState("全部类型");
  const [selectedComponentType, setSelectedComponentType] = useState("all");
  const { state: externalServicesState, activeWorkspaceId, setActiveWorkspaceId } = useExternalServicesDemo();

  const filteredComponents = useMemo(() => {
    return MOCK_COMPONENTS.filter((component) => {
      const matchesSearch = component.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "全部类型" || component.tags.includes(activeCategory);
      const matchesType =
        selectedComponentType === "all" || component.type === selectedComponentType;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [searchQuery, activeCategory, selectedComponentType]);

  return (
    <div className="flex-1 overflow-y-auto bg-white h-full">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            组件广场，赋能新体验
          </h1>
          <span className="text-sm text-slate-500">只读分发货架 · 查看、试运行与装配</span>
        </div>

        <section className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Cable className="h-4 w-4 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900">企业预置服务</h2>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">当前 workspace</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">展示当前 workspace 已接入的服务；在智能体或工作流中装配后即可调用。</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <span>当前 workspace</span>
                <select value={activeWorkspaceId} onChange={(event) => setActiveWorkspaceId(event.target.value)} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-400">
                  {EXTERNAL_SERVICE_WORKSPACES.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
                </select>
              </label>
              <Link href="/mcp-management" className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">外部服务</Link>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {EXTERNAL_SERVICE_CATALOG.map((service) => {
              const connection = externalServicesState.connections.find((item) => item.serviceId === service.id && (item.ownerScope === "personal" || item.workspaceId === activeWorkspaceId));
              const canUse = Boolean(connection?.enabled);
              const availabilityLabel = canUse ? connection?.ownerScope === "personal" ? "个人已接入" : "已接入" : connection ? "连接已停用" : "未接入";
              const availabilityNote = canUse
                ? connection?.ownerScope === "personal" ? "个人连接，可在本人可用的工具选择器中添加" : "当前 workspace 已接入，可在工具选择器中添加"
                : connection
                  ? "当前 workspace 连接已停用，联系管理员"
                  : "需管理员在当前 workspace 接入";
              return <article key={service.id} className="flex min-h-32 flex-col rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3"><ServiceLogo src={service.logoSrc} className="h-10 w-10 rounded-lg" /><div><h3 className="font-medium text-slate-900">{service.name}</h3><p className="mt-0.5 text-xs text-blue-600">{service.vendor}</p></div></div>
                  <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs", canUse ? "bg-emerald-50 text-emerald-700" : connection ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600")}>{canUse ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleHelp className="h-3.5 w-3.5" />}{availabilityLabel}</span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{service.description}</p>
                <div className="mt-auto flex items-center justify-between pt-3 text-xs"><span className="text-slate-500">{availabilityNote}</span>{canUse ? <span className="font-medium text-emerald-700">可在工具选择器中添加</span> : <Link href="/mcp-management" className="font-medium text-blue-600 hover:text-blue-700">查看外部服务</Link>}</div>
              </article>;
            })}
          </div>
              <p className="mt-3 text-xs text-slate-500">组件广场用于发现和查看；服务连接属于当前 workspace，在「MCP 管理 → 外部服务」中配置。</p>
        </section>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索插件"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select
              value={selectedComponentType}
              onValueChange={setSelectedComponentType}
              placeholder="全部组件"
              options={componentTypes}
              className="w-40"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent p-0 h-auto border-b border-gray-200">
              <TabsTrigger
                value="all"
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4 py-2 font-medium data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                )}
              >
                全部组件
              </TabsTrigger>
              <TabsTrigger
                value="organization"
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4 py-2 font-medium data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                )}
              >
                我的组织
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  activeCategory === category
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Component Grid */}
        <div className="grid grid-cols-3 gap-6">
          {filteredComponents.map((component) => (
            <Card
              key={component.id}
              className="group cursor-pointer transition-all hover:shadow-md relative"
            >
              {/* Type Badge */}
              <div className="absolute top-4 right-4 z-10">
                <Badge
                  className={cn(
                    "text-xs font-semibold px-2 py-1",
                    component.type === "plugin"
                      ? "bg-purple-500 text-white"
                      : "bg-blue-500 text-white"
                  )}
                >
                  {component.type === "plugin" ? "插件" : "MCP"}
                </Badge>
              </div>

              <div className="p-5">
                {/* Icon */}
                <div className="mb-4">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold text-white",
                      component.type === "plugin"
                        ? "bg-blue-400"
                        : "bg-orange-400"
                    )}
                  >
                    {component.type === "plugin" ? "A" : ">>"}
                  </div>
                </div>

                {/* Title and Author */}
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {component.name}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{component.author}</p>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {component.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {component.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="bg-gray-50 text-gray-700 border-gray-200 text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Arrow */}
                <div className="flex justify-end">
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

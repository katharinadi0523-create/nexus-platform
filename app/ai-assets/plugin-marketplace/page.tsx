"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
            组件聚广场,赋能新体验
          </h1>
          <div className="flex items-center gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700">
              上架组件
            </Button>
            <div className="relative">
              <Button className="bg-blue-600 hover:bg-blue-700 pr-8">
                创建组件
              </Button>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white pointer-events-none" />
            </div>
          </div>
        </div>

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

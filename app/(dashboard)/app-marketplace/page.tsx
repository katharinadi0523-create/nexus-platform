"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  TrendingUp,
  Heart,
  ArrowRight,
  FileText,
  Shield,
  Wrench,
  Stethoscope,
  Headphones,
  Building2,
  Scale,
  MapPin,
  FileCheck,
  Code,
  Users,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Mock data types
interface FeaturedApp {
  id: string;
  title: string;
  author: string;
  description: string;
  tags: string[];
  icon: React.ComponentType<{ className?: string }>;
  stats: {
    downloads: string;
    favorites: string;
  };
}

interface App {
  id: string;
  title: string;
  author: string;
  description: string;
  tags: string[];
  icon: React.ComponentType<{ className?: string }>;
  stats: {
    downloads: string;
    favorites: string;
  };
}

// Featured apps data
const featuredApps: FeaturedApp[] = [
  {
    id: "1",
    title: "新星智能写作",
    author: "@AppForge",
    description:
      "公文写作助手通过场景智能识别、模板驱动与排版规范化，为各级机关提供一站式公文起草服务。",
    tags: ["效率工具", "写作"],
    icon: FileText,
    stats: {
      downloads: "4.5k",
      favorites: "234",
    },
  },
  {
    id: "2",
    title: "玄鉴·情报感知",
    author: "@AppForge",
    description:
      "基于全网开源数据的深度情报挖掘与关联分析，帮助情报分析师快速生成研判报告。",
    tags: ["数据分析", "国防军工"],
    icon: Shield,
    stats: {
      downloads: "3.2k",
      favorites: "189",
    },
  },
  {
    id: "3",
    title: "装备检修智能体",
    author: "@AppForge",
    description:
      "针对大型工业设备的故障诊断与维护手册查询，支持多模态识别与语音交互。",
    tags: ["智能制造", "运维"],
    icon: Wrench,
    stats: {
      downloads: "2.8k",
      favorites: "156",
    },
  },
];

// App list data
const appList: App[] = [
  {
    id: "4",
    title: "智能问诊智能体",
    author: "@AppForge",
    description: "模拟三甲医院预问诊流程，根据患者主诉生成结构化病历与挂号建议。",
    tags: ["医疗健康"],
    icon: Stethoscope,
    stats: {
      downloads: "5.1k",
      favorites: "312",
    },
  },
  {
    id: "5",
    title: "客服助手",
    author: "@AppForge",
    description: "底层适配多行业在线客服场景，帮助企业快速构建产品智能客服体系。",
    tags: ["企业服务"],
    icon: Headphones,
    stats: {
      downloads: "6.3k",
      favorites: "445",
    },
  },
  {
    id: "6",
    title: "企业信息查询",
    author: "@AppForge",
    description: "聚合工商、司法、舆情等多维数据，一键生成企业尽职调查报告。",
    tags: ["商业查询"],
    icon: Building2,
    stats: {
      downloads: "4.7k",
      favorites: "278",
    },
  },
  {
    id: "7",
    title: "司法笔录智能体",
    author: "@AppForge",
    description: "实时语音转写并自动提取案件关键要素，生成符合法律规范的询问笔录。",
    tags: ["政务司法"],
    icon: Scale,
    stats: {
      downloads: "3.9k",
      favorites: "201",
    },
  },
  {
    id: "8",
    title: "高德地图插件",
    author: "@AppForge官方",
    description: "集成多能力，精准导航、智能推荐，出行超便捷。",
    tags: ["效率工具"],
    icon: MapPin,
    stats: {
      downloads: "8.2k",
      favorites: "567",
    },
  },
  {
    id: "9",
    title: "合同审查助手",
    author: "@中国电子云",
    description: "针对合同管理的核心环节，提供从文档解析到风险评估的一体化服务。",
    tags: ["法务"],
    icon: FileCheck,
    stats: {
      downloads: "4.1k",
      favorites: "234",
    },
  },
  {
    id: "10",
    title: "代码审计专家",
    author: "@AppForge",
    description: "自动扫描代码漏洞，提供修复建议，支持主流编程语言。",
    tags: ["开发工具"],
    icon: Code,
    stats: {
      downloads: "7.5k",
      favorites: "489",
    },
  },
  {
    id: "11",
    title: "HR招聘助手",
    author: "@AppForge",
    description: "自动筛选简历，生成面试提纲，根据JD匹配度进行打分。",
    tags: ["人力资源"],
    icon: Users,
    stats: {
      downloads: "5.8k",
      favorites: "356",
    },
  },
];

const categories = [
  "全部类型",
  "营销创作",
  "学习教育",
  "企业服务",
  "效率工具",
  "智能制造",
  "其他",
];

export default function AppMarketplacePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [activeCategory, setActiveCategory] = useState("全部类型");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalItems = 200;

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleFeaturedAppClick = (app: FeaturedApp) => {
    if (app.title === "新星智能写作") {
      window.open("https://writing.andywork.top/", "_blank");
    } else if (app.title === "玄鉴·情报感知") {
      window.open("https://intelligence-detector.vercel.app/", "_blank");
    } else if (app.title === "装备检修智能体") {
      toast.info("🚧 功能开发中，敬请期待...");
    }
  };

  const handleAppClick = (appId: string) => {
    router.push(`/app-marketplace/${appId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
      {/* Header Section */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-blue-50/80 to-transparent p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,rgba(59,130,246,0.03)_49%,rgba(59,130,246,0.03)_51%,transparent_52%)] bg-[length:20px_20px]"></div>
        <h1 className="relative text-3xl font-bold text-gray-900">
          智能体赋能企业的每一步
        </h1>
      </div>

      {/* Featured Agents Section */}
      <div className="mb-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {featuredApps.map((app) => {
            const Icon = app.icon;
            return (
              <Card
                key={app.id}
                className="group relative cursor-pointer overflow-hidden border-2 border-blue-200/50 bg-white shadow-lg transition-all hover:border-blue-400 hover:shadow-xl"
                onClick={() => handleFeaturedAppClick(app)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent"></div>
                <div className="relative p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                      <Icon className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 transition-colors group-hover:text-blue-600" />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">
                    {app.title}
                  </h3>
                  <p className="mb-3 text-sm text-gray-500">{app.author}</p>
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                    {app.description}
                  </p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {app.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{app.stats.downloads}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{app.stats.favorites}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="mb-6 space-y-4">
        {/* First Level - Tabs */}
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent p-0">
              <TabsTrigger
                value="all"
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4 py-2 font-semibold data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                )}
              >
                所有应用
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4 py-2 font-semibold data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                )}
              >
                应用样板
              </TabsTrigger>
              <TabsTrigger
                value="organization"
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4 py-2 font-semibold data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                )}
              >
                我的组织
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4 py-2 font-semibold data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                )}
              >
                我收藏的
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="搜索应用"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Second Level - Category Pills */}
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

      {/* App Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {appList.map((app) => {
          const Icon = app.icon;
          return (
            <Card
              key={app.id}
              className="group cursor-pointer transition-all hover:shadow-md"
              onClick={() => handleAppClick(app.id)}
            >
              <div className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 transition-colors group-hover:text-blue-600" />
                </div>
                <h3 className="mb-1 text-base font-semibold text-gray-900">
                  {app.title}
                </h3>
                <p className="mb-2 text-xs text-gray-500">{app.author}</p>
                <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                  {app.description}
                </p>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {app.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>{app.stats.downloads}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    <span>{app.stats.favorites}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-4">
        <div className="text-sm text-gray-600">共{totalItems}条</div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            &lt;
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="min-w-[2.5rem]"
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="px-2 text-gray-400">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  className="min-w-[2.5rem]"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            &gt;
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={itemsPerPage}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
            disabled
          >
            <option>{itemsPerPage}条/页</option>
          </select>
          <Button variant="outline" size="sm">
            前往
          </Button>
        </div>
      </div>
    </div>
  );
}

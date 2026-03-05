"use client";

import { useEffect, useRef, useState } from "react";
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
  MessageSquare,
  ShoppingCart,
  Eye,
  Network,
  Share2,
  ChevronLeft,
  ChevronRight,
  Crosshair,
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
  badge?: "NEW" | "HOT";
  cardStyle?: "gradient" | "data-visualization" | "minimal" | "tech" | "network";
  externalLink?: string;
  route?: string;
  specialTags?: Array<{ label: string; style: "mvp" | "ontology" | "integrating" }>;
  iconImage?: string;
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
      "一站式AI写作工作台,通过自主规划、深度检索、个性化配置与企业级知识库融合,帮助个人及团队在协作中高效产出高质量内容。",
    tags: ["效率工具", "开发工具"],
    icon: FileText,
    iconImage: "/icons/智能写作.png",
    stats: {
      downloads: "4.5k",
      favorites: "234",
    },
    badge: "HOT",
    cardStyle: "gradient",
    externalLink: "https://nexus-ai-writing.vercel.app/",
    specialTags: [{ label: "MVP版，升级迭代ing", style: "mvp" }],
  },
  {
    id: "2",
    title: "智能问数",
    author: "@AppForge",
    description:
      "底座可适配多行业的在线客服问答场景,帮助企业快速构建产品智能客服体系,显著提升用户体验,提升客户满意度。",
    tags: ["效率工具", "开发工具"],
    icon: MessageSquare,
    iconImage: "/icons/智能问数.png",
    stats: {
      downloads: "4.5k",
      favorites: "234",
    },
    badge: "NEW",
    cardStyle: "data-visualization",
    route: "/agent/qa-agent",
    specialTags: [{ label: "集成中，敬请期待", style: "integrating" }],
  },
  {
    id: "3",
    title: "采购管理",
    author: "SupplySovereign",
    description:
      "智能采购管理助手，支持采购需求分析、供应商评估、合同管理等功能，帮助企业优化采购流程，降低采购成本。",
    tags: ["效率工具", "企业服务"],
    icon: ShoppingCart,
    stats: {
      downloads: "3.8k",
      favorites: "198",
    },
    badge: "HOT",
    cardStyle: "minimal",
    route: "/agent/procurement-agent",
    specialTags: [{ label: "集成中，敬请期待", style: "integrating" }],
  },
  {
    id: "4",
    title: "情报快判",
    author: "vifusion&AppForge&MDP（联合出品）",
    description:
      "基于多源情报融合的快速研判系统，支持实时监控、目标识别、威胁评估等功能，为决策提供及时准确的情报支持。",
    tags: ["数据分析", "国防军工"],
    icon: Eye,
    stats: {
      downloads: "5.2k",
      favorites: "312",
    },
    badge: "HOT",
    cardStyle: "tech",
    externalLink: "https://lms1668009622-arch.github.io/GF_LMS/",
    specialTags: [{ label: "本体·数字孪生", style: "ontology" }],
  },
  {
    id: "5",
    title: "情报融合研判智能体",
    author: "@AppForge",
    description:
      "整合多源情报数据，通过AI分析进行深度研判，生成综合情报报告，支持态势感知和决策辅助。",
    tags: ["数据分析", "国防军工"],
    icon: Network,
    stats: {
      downloads: "4.1k",
      favorites: "267",
    },
    badge: "NEW",
    cardStyle: "network",
    route: "/agent/intelligence-agent",
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
    title: "态势感知智能体",
    author: "@AppForge",
    description: "接入MDP平台多维数据，结合本体图谱与推理规则，实现对特定区域或目标的实时态势感知与意图快判。",
    tags: ["数据分析", "国防军工"],
    icon: Crosshair,
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
  // 推荐位轮播（仅影响推荐位区域）
  const carouselViewportRef = useRef<HTMLDivElement | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0); // 按“卡片”为单位滑动
  const [carouselCardWidth, setCarouselCardWidth] = useState<number | null>(
    null
  );
  const itemsPerPage = 20;
  const totalItems = 200;
  const carouselVisibleCount = 3;
  const carouselGapPx = 24;
  const carouselMaxIndex = Math.max(0, featuredApps.length - carouselVisibleCount);
  const carouselDotsCount = carouselMaxIndex + 1;

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    const el = carouselViewportRef.current;
    if (!el) return;

    const compute = () => {
      const w = el.getBoundingClientRect().width;
      // 3 卡：宽度 = (viewport - 2*gap) / 3
      const cardW = Math.floor((w - carouselGapPx * (carouselVisibleCount - 1)) / carouselVisibleCount);
      setCarouselCardWidth(cardW > 0 ? cardW : null);
    };

    compute();

    const ro = new ResizeObserver(() => compute());
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  // viewport resize 后，确保 index 不越界
  useEffect(() => {
    setCarouselIndex((prev) => Math.min(prev, carouselMaxIndex));
  }, [carouselMaxIndex]);

  const handleCarouselPrev = () => {
    setCarouselIndex((prev) => Math.max(0, prev - 1));
  };

  const handleCarouselNext = () => {
    setCarouselIndex((prev) => Math.min(carouselMaxIndex, prev + 1));
  };

  const handleFeaturedAppClick = (app: FeaturedApp) => {
    if (app.externalLink) {
      window.open(app.externalLink, "_blank");
    } else if (app.route) {
      router.push(app.route);
    } else {
      toast.info("🚧 功能开发中，敬请期待...");
    }
  };

  const handleAppClick = (appId: string) => {
    router.push(`/app-marketplace/${appId}`);
  };

  return (
    <div className="relative -m-6 w-[calc(100%+3rem)] min-h-full bg-slate-50/50 overflow-x-hidden">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center pt-20 pb-10 space-y-8 bg-gradient-to-b from-blue-50/50 via-gray-50/30 to-white relative w-full">
        {/* 轻微噪点纹理 */}
        <div className="absolute inset-0 opacity-[0.02] [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.3)_1px,transparent_0)] [background-size:20px_20px]" />
        
        {/* Slogan */}
        <h1 className="text-center relative z-10">
          <span className="text-5xl font-extrabold">
            <span className="text-blue-600">智能体</span>
            <span className="text-gray-900">・赋能企业的每一步</span>
          </span>
        </h1>
        
        {/* Search Bar */}
        <div className="w-full max-w-[760px] relative px-6 z-10">
          <div className="relative">
            <Input
              type="search"
              placeholder="搜索你感兴趣的应用"
              className="h-14 pr-14 pl-12 text-base border-2 border-blue-500/50 rounded-2xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-sm bg-white"
            />
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          </div>
      </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-[1400px] mx-auto px-6 pb-12 space-y-12">

      {/* Featured Agents Section */}
        <div className="mb-10 overflow-x-hidden min-w-0">
          <div className="mb-4">
            <h2 className="text-lg">
              <span className="font-bold text-gray-900">推荐智能体</span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-sm font-normal text-gray-500">应用开发平台精选智能体</span>
            </h2>
          </div>
          
          {/* Carousel Container - 移除重复的max-width，已在父容器统一 */}
          <div className="relative group">
          {/* Left Arrow */}
          <button
            onClick={handleCarouselPrev}
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50",
              carouselIndex === 0 && "pointer-events-none opacity-0"
            )}
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={handleCarouselNext}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50",
              carouselIndex >= carouselMaxIndex && "pointer-events-none opacity-0"
            )}
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>

          {/* Cards Container - viewport 必须 overflow-hidden */}
          <div ref={carouselViewportRef} className="overflow-hidden w-full min-w-0">
            {/* Track - flex 容器，宽度由子元素决定，但被 viewport 裁切 */}
            <div
              className="flex gap-6 transition-transform duration-300 ease-out will-change-transform min-w-0"
              style={{
                transform:
                  carouselCardWidth == null
                    ? undefined
                    : `translate3d(-${
                        carouselIndex * (carouselCardWidth + carouselGapPx)
                      }px, 0, 0)`,
              }}
            >
          {featuredApps.map((app) => {
            const Icon = app.icon;
            return (
              <Card
                key={app.id}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md flex-shrink-0 min-w-0"
                style={{
                  width:
                    carouselCardWidth == null
                      ? "calc((100% - 48px) / 3)"
                      : `${carouselCardWidth}px`,
                  flexBasis: carouselCardWidth == null ? undefined : `${carouselCardWidth}px`,
                }}
                onClick={() => handleFeaturedAppClick(app)}
              >
                {/* Badge */}
                {app.badge && (
                  <div className="absolute top-4 right-4 z-20">
                    <Badge
                      className={cn(
                        "text-xs font-semibold rounded-sm px-2 py-1",
                        app.badge === "NEW"
                          ? "bg-blue-600 text-white"
                          : "bg-orange-500 text-white"
                      )}
                    >
                      {app.badge}
                    </Badge>
                  </div>
                )}

                {/* Illustration / Background (统一上半区，按 cardStyle 走不同渐变) */}
                <div
                  className={cn(
                    "relative h-40 overflow-hidden",
                    "bg-gradient-to-b",
                    app.cardStyle === "data-visualization" && "from-[#4e54c8] to-[#8f94fb]",
                    app.cardStyle === "minimal" && "from-[#3b82f6] to-[#60a5fa]",
                    app.cardStyle === "tech" && "from-[#0ea5e9] to-[#6366f1]",
                    app.cardStyle === "network" && "from-[#22c55e] to-[#16a34a]",
                    app.cardStyle === "gradient" && "from-[#4e54c8] to-[#8f94fb]"
                  )}
                >
                  {/* subtle noise / texture */}
                  <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.6)_1px,transparent_0)] [background-size:18px_18px]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/25 via-white/10 to-transparent" />

                  {/* top-left icon container */}
                  <div className="absolute left-5 top-5 z-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/90 shadow-sm overflow-hidden">
                      {app.iconImage ? (
                        <img 
                          src={app.iconImage} 
                          alt={app.title}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <Icon className="h-6 w-6 text-slate-800" />
                      )}
                    </div>
                  </div>

                  {/* data visualization accent only for 智能问数 */}
                  {app.cardStyle === "data-visualization" && (
                    <div className="absolute inset-x-0 bottom-0 h-full opacity-30">
                      <svg
                        className="h-full w-full"
                        viewBox="0 0 400 160"
                        preserveAspectRatio="none"
                      >
                        <polyline
                          points="20,120 70,110 120,90 170,80 220,60 270,55 320,45 380,40"
                          fill="none"
                          stroke="rgba(255,255,255,0.9)"
                          strokeWidth="2"
                        />
                        <rect x="60" y="100" width="26" height="60" fill="rgba(255,255,255,0.35)" />
                        <rect x="120" y="80" width="26" height="80" fill="rgba(255,255,255,0.35)" />
                        <rect x="180" y="60" width="26" height="100" fill="rgba(255,255,255,0.35)" />
                        <rect x="240" y="70" width="26" height="90" fill="rgba(255,255,255,0.35)" />
                        <rect x="300" y="50" width="26" height="110" fill="rgba(255,255,255,0.35)" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="relative p-5">
                  {/* Title/Author (对齐) */}
                  <div className="mb-3 min-h-[52px]">
                    <h3 className="mb-1 text-xl font-extrabold text-blue-600 leading-tight">
                    {app.title}
                  </h3>
                    <p className="text-sm text-gray-500">{app.author}</p>
                  </div>

                  {/* Desc: 2 lines */}
                  <p className="mb-3 line-clamp-2 text-sm text-gray-600 leading-relaxed">
                    {app.description}
                  </p>
                  
                  <div className="mb-4 flex flex-wrap gap-2">
                    {app.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="bg-gray-50 text-gray-700 border-gray-200"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {app.specialTags?.map((specialTag, idx) => (
                      <Badge
                        key={`special-${idx}`}
                        className={cn(
                          "text-xs font-medium",
                          specialTag.style === "mvp"
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0"
                            : specialTag.style === "ontology"
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white border-0"
                            : "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0"
                        )}
                      >
                        {specialTag.label}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
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
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
            </div>
          </div>

          {/* Carousel Dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: carouselDotsCount }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCarouselIndex(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === carouselIndex
                    ? "w-8 bg-blue-600"
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                )}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="mb-6 space-y-4">
        {/* First Level - Tabs */}
        <div className="flex items-center justify-between border-b border-gray-200">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent p-0 h-auto">
              <TabsTrigger
                value="all"
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                )}
              >
                所有应用
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                )}
              >
                应用样板
              </TabsTrigger>
              <TabsTrigger
                value="organization"
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                )}
              >
                我的组织
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none"
                )}
              >
                我的收藏
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="搜索应用"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 border-gray-300"
            />
            </div>
            <select className="h-9 px-3 border border-gray-300 rounded-md text-sm bg-white">
              <option>最新</option>
              <option>最热</option>
              <option>最多收藏</option>
            </select>
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
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-w-0">
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
      </section>
    </div>
  );
}

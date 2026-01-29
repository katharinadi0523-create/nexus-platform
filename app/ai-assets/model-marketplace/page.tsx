"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Hexagon,
  FileText,
  Image as ImageIcon,
  Video,
  Mic,
  Sparkles,
  Brain,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Model {
  id: string;
  name: string;
  provider: string;
  modelType: string[];
  taskType: string[];
  description: string;
  updatedAt: string;
  versions: number;
  badge?: "最强模型" | "最新模型" | "更低延迟";
  iconImage?: string;
}

const MOCK_MODELS: Model[] = [
  {
    id: "1",
    name: "DeepSeek-R1-Distill-Qwen-14B",
    provider: "Deepseek",
    modelType: ["文本"],
    taskType: ["文本生成", "文本翻译"],
    description: "基于Qwen-14B的深度思考模型，支持多轮对话和复杂推理任务",
    updatedAt: "2025/01/15",
    versions: 3,
    badge: "最强模型",
    iconImage: "/icons/deepseek.png",
  },
  {
    id: "2",
    name: "DeepSeek-R1-Distill-Qwen-14B",
    provider: "Deepseek",
    modelType: ["文本"],
    taskType: ["文本生成", "文本翻译"],
    description: "基于Qwen-14B的深度思考模型，支持多轮对话和复杂推理任务",
    updatedAt: "2025/01/15",
    versions: 3,
    badge: "最新模型",
    iconImage: "/icons/deepseek.png",
  },
  {
    id: "3",
    name: "DeepSeek-R1-Distill-Qwen-14B",
    provider: "Deepseek",
    modelType: ["文本"],
    taskType: ["文本生成", "文本翻译"],
    description: "基于Qwen-14B的深度思考模型，支持多轮对话和复杂推理任务",
    updatedAt: "2025/01/15",
    versions: 3,
    badge: "更低延迟",
    iconImage: "/icons/deepseek.png",
  },
  {
    id: "4",
    name: "Qwen3-8B",
    provider: "Qwen",
    modelType: ["文本"],
    taskType: ["文本生成", "文本分类"],
    description: "轻量级文本生成模型，适合快速响应场景",
    updatedAt: "2025/01/10",
    versions: 2,
    iconImage: "/icons/qwen.png",
  },
  {
    id: "5",
    name: "DeepSeek-R1-Distill-Qwen-1.5B",
    provider: "Deepseek",
    modelType: ["文本"],
    taskType: ["文本翻译", "相似度校验"],
    description: "超轻量级模型，专为移动端和边缘设备优化",
    updatedAt: "2025/01/08",
    versions: 1,
    iconImage: "/icons/deepseek.png",
  },
  {
    id: "6",
    name: "GPT-Vision-Pro",
    provider: "OpenAI",
    modelType: ["多模态"],
    taskType: ["图像理解", "图片生成"],
    description: "强大的多模态模型，支持图像理解和生成",
    updatedAt: "2025/01/12",
    versions: 5,
    iconImage: "/icons/GPT.png",
  },
  {
    id: "7",
    name: "Stable-Diffusion-XL",
    provider: "Stability AI",
    modelType: ["视觉"],
    taskType: ["图片生成"],
    description: "高质量图像生成模型，支持多种艺术风格",
    updatedAt: "2025/01/05",
    versions: 8,
    iconImage: "/icons/stable diffusion.png",
  },
  {
    id: "8",
    name: "Whisper-Large",
    provider: "OpenAI",
    modelType: ["语音"],
    taskType: ["语音识别", "语音分类"],
    description: "高精度语音识别模型，支持多语言",
    updatedAt: "2025/01/14",
    versions: 4,
  },
  {
    id: "9",
    name: "VideoGen-Pro",
    provider: "Meta",
    modelType: ["视觉"],
    taskType: ["视频生成", "视频追踪"],
    description: "专业级视频生成和编辑模型",
    updatedAt: "2025/01/11",
    versions: 2,
  },
  {
    id: "10",
    name: "Claude-Vision",
    provider: "Anthropic",
    modelType: ["多模态"],
    taskType: ["深度思考", "图像理解"],
    description: "强大的视觉理解模型，支持复杂场景分析",
    updatedAt: "2025/01/13",
    versions: 3,
  },
];

const modelTypeFilters = [
  {
    label: "多模态",
    count: 11,
    tasks: ["深度思考", "图像理解", "图片生成"],
  },
  {
    label: "文本",
    count: 10,
    tasks: ["深度思考", "文本生成", "文本分类", "文本翻译", "相似度校验"],
  },
  {
    label: "视觉",
    count: 6,
    tasks: ["图片生成", "图像理解", "视频生成", "视频追踪"],
  },
  {
    label: "语音",
    count: 7,
    tasks: ["语音识别", "语音分类"],
  },
  {
    label: "其他",
    count: 8,
    tasks: ["深度思考", "视觉理解"],
  },
];

const providers = [
  { label: "Deepseek", count: 6 },
];

// 根据模型信息返回合适的图标
function getModelIcon(model: Model) {
  // 如果有iconImage，返回图片
  if (model.iconImage) {
    return { type: "image" as const, src: model.iconImage };
  }

  // 根据模型名称和类型返回合适的图标组件
  const name = model.name.toLowerCase();
  const modelType = model.modelType[0] || "";

  // 根据模型类型选择图标
  if (modelType === "语音" || name.includes("whisper")) {
    return { type: "icon" as const, component: Mic };
  }
  if (modelType === "视觉" && name.includes("video")) {
    return { type: "icon" as const, component: Video };
  }
  if (name.includes("claude")) {
    return { type: "icon" as const, component: Sparkles };
  }
  if (modelType === "视觉" || modelType === "多模态") {
    return { type: "icon" as const, component: ImageIcon };
  }
  if (modelType === "文本") {
    return { type: "icon" as const, component: FileText };
  }
  // 默认图标
  return { type: "icon" as const, component: Brain };
}

// 图标渲染组件
function ModelIcon({ model, size = "md" }: { model: Model; size?: "sm" | "md" | "lg" }) {
  const iconInfo = getModelIcon(model);
  const iconSize = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-8 w-8" : "h-6 w-6";
  const containerSize = size === "sm" ? "w-12 h-12" : size === "lg" ? "w-16 h-16" : "w-12 h-12";

  if (iconInfo.type === "image") {
    return (
      <div className={`${containerSize} rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0`}>
        <img
          src={iconInfo.src}
          alt={model.name}
          className="h-full w-full object-contain p-1"
        />
      </div>
    );
  }

  const IconComponent = iconInfo.component;
  return (
    <div className={`${containerSize} rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0`}>
      <IconComponent className={`${iconSize} text-white`} />
    </div>
  );
}

export default function ModelMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModelType, setSelectedModelType] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [expandedModelType, setExpandedModelType] = useState<string | null>(null);

  const filteredModels = useMemo(() => {
    return MOCK_MODELS.filter((model) => {
      const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModelType = !selectedModelType || model.modelType.includes(selectedModelType);
      const matchesProvider = !selectedProvider || model.provider === selectedProvider;
      return matchesSearch && matchesModelType && matchesProvider;
    });
  }, [searchQuery, selectedModelType, selectedProvider]);

  const featuredModels = MOCK_MODELS.slice(0, 3);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 h-full">
      <div className="flex h-full">
        {/* Left Sidebar Filters */}
        <aside className="w-64 border-r border-gray-200 bg-white p-4 overflow-y-auto flex-shrink-0">
        <div className="space-y-6">
          {/* Model Type Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">模型类型</h3>
            <div className="space-y-2">
              {modelTypeFilters.map((filter) => (
                <div key={filter.label}>
                  <button
                    onClick={() => {
                      setSelectedModelType(
                        selectedModelType === filter.label ? null : filter.label
                      );
                      setExpandedModelType(
                        expandedModelType === filter.label ? null : filter.label
                      );
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                      selectedModelType === filter.label
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <span>{filter.label}</span>
                    <span className="text-gray-500">({filter.count})</span>
                  </button>
                  {expandedModelType === filter.label && (
                    <div className="mt-2 ml-4 space-y-1">
                      {filter.tasks.map((task) => (
                        <button
                          key={task}
                          className="block w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded"
                        >
                          {task}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Provider Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">提供厂商</h3>
            <div className="space-y-2">
              {providers.map((provider) => (
                <button
                  key={provider.label}
                  onClick={() => {
                    setSelectedProvider(
                      selectedProvider === provider.label ? null : provider.label
                    );
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                    selectedProvider === provider.label
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <span>{provider.label}</span>
                  <span className="text-gray-500">({provider.count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Title */}
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            模型广场·解锁无限潜力
          </h1>

          {/* Featured Models */}
          <div className="mb-12">
            <div className="grid grid-cols-3 gap-6">
              {featuredModels.map((model) => (
                <Card
                  key={model.id}
                  className="group relative cursor-pointer overflow-hidden border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Badge */}
                  {model.badge && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge
                        className={cn(
                          "text-xs font-semibold px-2 py-1",
                          model.badge === "最强模型" && "bg-purple-500 text-white",
                          model.badge === "最新模型" && "bg-orange-500 text-white",
                          model.badge === "更低延迟" && "bg-green-500 text-white"
                        )}
                      >
                        {model.badge}
                      </Badge>
                    </div>
                  )}

                  {/* Icon Area */}
                  <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {model.iconImage ? (
                        <div className="w-16 h-16 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                          <img
                            src={model.iconImage}
                            alt={model.name}
                            className="h-full w-full object-contain p-2"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          {(() => {
                            const iconInfo = getModelIcon(model);
                            const IconComponent = iconInfo.type === "icon" ? iconInfo.component : Hexagon;
                            return <IconComponent className="h-8 w-8 text-white" />;
                          })()}
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                      {model.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {model.modelType.map((type) => (
                        <Badge
                          key={type}
                          variant="outline"
                          className="bg-gray-50 text-gray-700 border-gray-200 text-xs"
                        >
                          {type}
                        </Badge>
                      ))}
                      {model.taskType.map((task) => (
                        <Badge
                          key={task}
                          variant="outline"
                          className="bg-gray-50 text-gray-700 border-gray-200 text-xs"
                        >
                          {task}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {model.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>@{model.provider}</span>
                      <span>{model.updatedAt}更新</span>
                      <span>{model.versions}个版本</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Model List Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              模型列表 {filteredModels.length}个
            </h2>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="搜索模型名称"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
              <Select
                value="comprehensive"
                onValueChange={() => {}}
                placeholder="综合排序"
                options={[
                  { value: "comprehensive", label: "综合排序" },
                  { value: "latest", label: "最新" },
                  { value: "popular", label: "最热" },
                ]}
                className="w-32"
              />
            </div>
          </div>

          {/* Model Grid */}
          <div className="grid grid-cols-2 gap-6">
            {filteredModels.map((model) => (
              <Card
                key={model.id}
                className="group cursor-pointer transition-all hover:shadow-md"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <ModelIcon model={model} size="sm" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                          {model.name}
                        </h3>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {model.modelType.map((type) => (
                            <Badge
                              key={type}
                              variant="outline"
                              className="bg-gray-50 text-gray-700 border-gray-200 text-xs"
                            >
                              {type}
                            </Badge>
                          ))}
                          {model.taskType.map((task) => (
                            <Badge
                              key={task}
                              variant="outline"
                              className="bg-gray-50 text-gray-700 border-gray-200 text-xs"
                            >
                              {task}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    {model.badge && (
                      <Badge
                        className={cn(
                          "text-xs font-semibold px-2 py-1 flex-shrink-0",
                          model.badge === "最强模型" && "bg-purple-500 text-white",
                          model.badge === "最新模型" && "bg-orange-500 text-white",
                          model.badge === "更低延迟" && "bg-green-500 text-white"
                        )}
                      >
                        {model.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {model.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      <span>@{model.provider}</span>
                      <span className="mx-2">・</span>
                      <span>{model.updatedAt}更新</span>
                      <span className="mx-2">・</span>
                      <span>{model.versions}个版本</span>
                    </div>
                    {model.id === "1" && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          查看详情
                        </Button>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                          立即使用
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}

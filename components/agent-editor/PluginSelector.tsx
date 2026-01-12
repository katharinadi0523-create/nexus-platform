"use client";

import { useState } from "react";
import {
  FileText,
  Image,
  Music,
  Cloud,
  Calculator,
  Code,
  Key,
  Puzzle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface PluginSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (plugins: Plugin[]) => void;
  selectedPlugins?: Plugin[];
}

const presetPlugins: Plugin[] = [
  {
    id: "plugin-1",
    name: "文档解析",
    description: "解析各种格式的文档内容",
    icon: <FileText className="w-5 h-5" />,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "plugin-2",
    name: "图片理解",
    description: "理解图片内容并提取信息",
    icon: <Image className="w-5 h-5" />,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "plugin-3",
    name: "音频解析",
    description: "解析音频文件并提取文本",
    icon: <Music className="w-5 h-5" />,
    color: "bg-pink-100 text-pink-600",
  },
  {
    id: "plugin-4",
    name: "天气查询",
    description: "查询实时天气信息",
    icon: <Cloud className="w-5 h-5" />,
    color: "bg-cyan-100 text-cyan-600",
  },
  {
    id: "plugin-5",
    name: "计算器",
    description: "执行数学计算",
    icon: <Calculator className="w-5 h-5" />,
    color: "bg-green-100 text-green-600",
  },
  {
    id: "plugin-6",
    name: "代码解释器",
    description: "解释和执行代码",
    icon: <Code className="w-5 h-5" />,
    color: "bg-orange-100 text-orange-600",
  },
  {
    id: "plugin-7",
    name: "JWS解码器",
    description: "解码JWS格式数据",
    icon: <Key className="w-5 h-5" />,
    color: "bg-indigo-100 text-indigo-600",
  },
];

const myPlugins: Plugin[] = [
  {
    id: "my-plugin-1",
    name: "自定义插件1",
    description: "用户自定义的插件",
    icon: <Puzzle className="w-5 h-5" />,
    color: "bg-slate-100 text-slate-600",
  },
];

export function PluginSelector({
  open,
  onOpenChange,
  onSelect,
  selectedPlugins = [],
}: PluginSelectorProps) {
  const [activeTab, setActiveTab] = useState<"preset" | "my">("preset");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    selectedPlugins.map((p) => p.id)
  );

  const currentPlugins =
    activeTab === "preset" ? presetPlugins : myPlugins;

  const toggleSelection = (pluginId: string) => {
    setSelectedIds((prev) =>
      prev.includes(pluginId)
        ? prev.filter((id) => id !== pluginId)
        : [...prev, pluginId]
    );
  };

  const handleConfirm = () => {
    const allPlugins = [...presetPlugins, ...myPlugins];
    const selected = allPlugins.filter((p) => selectedIds.includes(p.id));
    onSelect(selected);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-left">选择插件</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "preset" | "my")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preset">预置插件</TabsTrigger>
              <TabsTrigger value="my">我的插件</TabsTrigger>
            </TabsList>

            {/* Plugin List */}
            <TabsContent value={activeTab} className="mt-4 flex-1 overflow-y-auto">
              <div className="space-y-2">
                {currentPlugins.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    暂无插件
                  </div>
                ) : (
                  currentPlugins.map((plugin) => {
                    const isSelected = selectedIds.includes(plugin.id);
                    return (
                      <button
                        key={plugin.id}
                        onClick={() => toggleSelection(plugin.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left",
                          isSelected
                            ? "border-blue-600 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                            plugin.color
                          )}
                        >
                          {plugin.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900">
                            {plugin.name}
                          </div>
                          <div className="text-sm text-slate-500 mt-0.5">
                            {plugin.description}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-slate-200">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              添加 ({selectedIds.length})
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

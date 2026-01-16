"use client";

import { useState } from "react";
import { Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryRecord {
  id: string;
  query: string;
  updateTime: string;
}

interface HitChunk {
  id: string;
  documentName: string;
  chunkIndex: number;
  totalChunks: number;
  score: number;
  content: string;
}

// Mock results data
const mockResults: HitChunk[] = [
  {
    id: "hit_1",
    documentName: "2018中国共产党纪律处分条例",
    chunkIndex: 1,
    totalChunks: 5,
    score: 0.99,
    content:
      "(二) 党纪面前一律平等。对违犯党纪的党组织和党员必须严肃、公正执行纪律，党内不允许有任何不受纪律约束的党组织和党员。(三) 实事求是。对党组织和党员违犯党纪的行为，应当以事实为依据，以党章、其他党内法规和国家法律法规为准绳，准确认定违纪性质，区别不同情况，恰当予以处理。",
  },
  {
    id: "hit_2",
    documentName: "2015中国共产党纪律处分条例",
    chunkIndex: 2,
    totalChunks: 5,
    score: 0.98,
    content:
      "(三)实事求是。对党组织和党员违犯党纪的行为，应当以事实为依据，以党章、其他党内法规和国家法律法规为准绳,准确认定违纪性质,区别不同情况,恰当予以处理。(四)民主集中制。实施党纪处分,应当按照规定程序经党组织集体讨论决定,不允许任何个人或者少数人擅自决定和批准。上级党组织对违犯党纪的党组织和党员作出的处理决定,下级党组织必须执行。(五)惩前毖后、治病救人。处理违犯",
  },
  {
    id: "hit_3",
    documentName: "2018中国共产党纪律处分条例",
    chunkIndex: 3,
    totalChunks: 5,
    score: 0.85,
    content:
      "中国共产党纪律处分条例(2018年8月18日) 第一编总则第一章指导思想、原则和适用范围第一条为了维护党章和其他党内法规,严肃党的纪律,纯洁党的组织,保障党员民主权利,教育党员遵纪守法,维护党的团结统一,保证党的路线、方针、政策、决议和国家法律法规的贯彻执行,根据《中国共产党章程》,制定本条例。第二条党的纪律建设必须坚持以马克思列宁主义、毛泽东思想、邓小平理论、“三",
  },
  {
    id: "hit_4",
    documentName: "2015中国共产党纪律处分条例",
    chunkIndex: 4,
    totalChunks: 5,
    score: 0.28,
    content:
      "中国共产党纪律处分条例(2015年修正) (2015年10月21日中共中央公布)第一编总则第一章 指导思想、原则和适用范围第一条为维护党的章程和其他党内法规,严肃党的纪律,纯洁党的组织,保障党员民主权利,教育党员遵纪守法,维护党的团结统一,保证党的路线、方针、政策、决议和国家法律法规的贯彻执行,根据《中国共产党章程》,制定本条例。第二条本条例以马克思列宁主义、毛泽东思想、",
  },
  {
    id: "hit_5",
    documentName: "2023中国共产党纪律处分条例",
    chunkIndex: 5,
    totalChunks: 5,
    score: 0.23,
    content:
      "第二条本条例以马克思列宁主义、毛泽东思想、邓小平理论、'三个代表'重要思想、科学发展观为指导，深入贯彻习近平总书记系列重要讲话精神，落实全面从严治党战略部署。",
  },
];

export function HitTestingView() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HitChunk[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const hasTested = results.length > 0;
  const hasHistory = history.length > 0;

  const handleTest = () => {
    if (!query.trim()) return;

    // Set results
    setResults(mockResults);

    // Add to history
    const newRecord: HistoryRecord = {
      id: Date.now().toString(),
      query: query.trim(),
      updateTime: new Date().toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).replace(/\//g, "-"),
    };
    setHistory([newRecord, ...history]);
  };

  const handleHistoryClick = (record: HistoryRecord) => {
    setQuery(record.query);
  };

  const filteredResults = results.filter((result) =>
    result.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.documentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full gap-6">
      {/* Left Panel: Input & History */}
      <div className="w-[400px] flex flex-col gap-6 flex-shrink-0">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">命中测试</h2>
            <p className="text-sm text-slate-500">
              根据给定的查询文本测试知识的召回效果。
            </p>
          </div>

          <div className="relative">
            <Textarea
              placeholder="请输入内容..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <div className="flex items-center justify-end gap-3 mt-3">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                策略配置
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleTest}
                disabled={!query.trim()}
              >
                测试
              </Button>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-sm font-semibold mb-3">历史记录</h3>
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {!hasHistory ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
                <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center mb-4">
                  <div className="flex gap-1">
                    <div className="w-8 h-8 bg-slate-200 rounded"></div>
                    <div className="w-8 h-8 bg-slate-200 rounded"></div>
                  </div>
                </div>
                <p className="text-sm">暂无数据</p>
              </div>
            ) : (
              <div className="divide-y">
                {history.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => handleHistoryClick(record)}
                    className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="text-sm text-slate-900 line-clamp-2">
                        {record.query}
                      </div>
                      <div className="text-xs text-slate-500">
                        更新时间: {record.updateTime}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Results */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="border-b pb-4 mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            命中切片 ({filteredResults.length > 0 ? filteredResults.length : results.length})
          </h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜索切片"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!hasTested ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center mb-4">
                <div className="flex gap-1">
                  <div className="w-8 h-8 bg-slate-200 rounded"></div>
                  <div className="w-8 h-8 bg-slate-200 rounded"></div>
                </div>
              </div>
              <p className="text-sm">暂无数据</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResults.map((result) => (
                <div
                  key={result.id}
                  className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
                >
                  {/* Top Row: Icon, Document Name, Chunk Info, Score */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {result.documentName}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      分段数: {result.chunkIndex}/{result.totalChunks}
                    </div>
                    <Badge className="bg-blue-600 text-white whitespace-nowrap">
                      分值: {result.score.toFixed(2)}
                    </Badge>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {result.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

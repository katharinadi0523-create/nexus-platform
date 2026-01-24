"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Grid3x3,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface BasicConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BasicConfigSheet({
  open,
  onOpenChange,
}: BasicConfigSheetProps) {
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [openingStatement, setOpeningStatement] = useState("");
  const [suggestedQuestion, setSuggestedQuestion] = useState("");
  const [conversationRounds, setConversationRounds] = useState("0");
  const [expandedSections, setExpandedSections] = useState({
    opening: true,
    suggested: true,
    rounds: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[400px] sm:w-[400px] p-0 overflow-y-auto">
        <SheetHeader className="px-6 py-4 border-b border-slate-200">
          <SheetTitle className="text-base font-semibold">基本配置</SheetTitle>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Identity Section */}
          <div className="flex items-start gap-4">
            {/* App Icon */}
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
              <Grid3x3 className="w-8 h-8 text-white" />
            </div>

            {/* App Name & Description */}
            <div className="flex-1 space-y-3">
              <div className="relative">
                <Input
                  placeholder="智能体应用名称"
                  value={appName}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 50) {
                      setAppName(value);
                    }
                  }}
                  className="pr-12"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  {appName.length}/50
                </div>
              </div>

              <div className="relative">
                <Textarea
                  placeholder="智能体应用描述"
                  value={appDescription}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 100) {
                      setAppDescription(value);
                    }
                  }}
                  className="min-h-[80px] pr-12 resize-none"
                />
                <div className="absolute right-3 bottom-3 text-xs text-slate-400">
                  {appDescription.length}/100
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Opening Statement */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleSection("opening")}
                className="flex items-center gap-2 text-sm font-medium text-slate-900"
              >
                {expandedSections.opening ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                开场白
              </button>
              <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </button>
            </div>
            {expandedSections.opening && (
              <div className="relative">
                <Textarea
                  placeholder="请输入开场白"
                  value={openingStatement}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 150) {
                      setOpeningStatement(value);
                    }
                  }}
                  className="min-h-[100px] pr-12 resize-none"
                />
                <div className="absolute right-3 bottom-3 text-xs text-slate-400">
                  {openingStatement.length}/150
                </div>
              </div>
            )}
          </div>

          {/* Suggested Question */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleSection("suggested")}
                className="flex items-center gap-2 text-sm font-medium text-slate-900"
              >
                {expandedSections.suggested ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                推荐问
              </button>
              <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </button>
            </div>
            {expandedSections.suggested && (
              <div className="relative">
                <Input
                  placeholder="请输入内容"
                  value={suggestedQuestion}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 50) {
                      setSuggestedQuestion(value);
                    }
                  }}
                  className="pr-12"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  {suggestedQuestion.length}/50
                </div>
              </div>
            )}
          </div>

          {/* Conversation Rounds */}
          <div className="space-y-2">
            <button
              onClick={() => toggleSection("rounds")}
              className="flex items-center gap-2 text-sm font-medium text-slate-900"
            >
              {expandedSections.rounds ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              参考对话轮数
            </button>
            {expandedSections.rounds && (
              <Input
                type="number"
                placeholder="0"
                value={conversationRounds}
                onChange={(e) => setConversationRounds(e.target.value)}
                className="w-full"
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { SecurityLevelBadge } from "@/components/security/security-level-badge";
import {
  buildSecurityLevelOptionsUpToUser,
  type SecurityLevel,
} from "@/lib/security-level";
import { cn } from "@/lib/utils";

interface BasicConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
  creationMode?: boolean;
  initialName?: string;
  initialDescription?: string;
  onNameChange?: (name: string) => void;
  onDescriptionChange?: (description: string) => void;
  securityLevel?: SecurityLevel;
  securityLevelSelected?: boolean;
  onCreationSecurityLevelChange?: (level: SecurityLevel) => void;
  onSecurityLevelChangeRequest?: () => void;
  securityLevelChangeDisabled?: boolean;
  securityLevelChangeTitle?: string;
}

export function BasicConfigSheet({
  open,
  onOpenChange,
  readOnly = false,
  creationMode = false,
  initialName = "",
  initialDescription = "",
  onNameChange,
  onDescriptionChange,
  securityLevel = "公开",
  securityLevelSelected = true,
  onCreationSecurityLevelChange,
  onSecurityLevelChangeRequest,
  securityLevelChangeDisabled = false,
  securityLevelChangeTitle = "修改密级",
}: BasicConfigSheetProps) {
  const [appName, setAppName] = useState(initialName);
  const [appDescription, setAppDescription] = useState(initialDescription);
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
              <div className="space-y-1.5">
                {creationMode ? (
                  <label htmlFor="workflow-basic-name" className="text-sm text-slate-700">
                    <span className="text-rose-500">*</span> 名称
                  </label>
                ) : null}
                <div className="relative">
                  <Input
                    id="workflow-basic-name"
                    readOnly={readOnly}
                    placeholder={creationMode ? "请输入工作流智能体名称" : "智能体应用名称"}
                    value={appName}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 50) {
                        setAppName(value);
                        onNameChange?.(value);
                      }
                    }}
                    className="pr-12"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    {appName.length}/50
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                {creationMode ? (
                  <label htmlFor="workflow-basic-description" className="text-sm text-slate-700">
                    <span className="text-rose-500">*</span> 描述
                  </label>
                ) : null}
                <div className="relative">
                  <Textarea
                    id="workflow-basic-description"
                    readOnly={readOnly}
                    placeholder={creationMode ? "请输入工作流智能体描述" : "智能体应用描述"}
                    value={appDescription}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 100) {
                        setAppDescription(value);
                        onDescriptionChange?.(value);
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
          </div>

          {creationMode ? (
            <div className="space-y-2">
              <label className="text-sm text-slate-700">
                <span className="text-rose-500">*</span> 密级
              </label>
              <Select
                value={securityLevelSelected ? securityLevel : ""}
                placeholder="请选择密级"
                options={buildSecurityLevelOptionsUpToUser()}
                disabled={readOnly}
                onValueChange={(value) => onCreationSecurityLevelChange?.(value as SecurityLevel)}
                className="bg-white"
              />
              <p className="text-xs leading-5 text-slate-500">
                仅展示当前角色可选密级；公开、内部可直接创建，秘密、机密需提交审批。
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">密级</span>
                <SecurityLevelBadge level={securityLevel} />
              </div>
              {onSecurityLevelChangeRequest ? (
                <button
                  type="button"
                  onClick={onSecurityLevelChangeRequest}
                  disabled={readOnly || securityLevelChangeDisabled}
                  title={securityLevelChangeTitle}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    readOnly || securityLevelChangeDisabled
                      ? "cursor-not-allowed text-slate-400"
                      : "text-blue-600 hover:text-blue-700"
                  )}
                >
                  修改
                </button>
              ) : null}
            </div>
          )}

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
              <button disabled={readOnly} className="p-1 hover:bg-slate-100 rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </button>
            </div>
            {expandedSections.opening && (
              <div className="relative">
                <Textarea
                  readOnly={readOnly}
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
              <button disabled={readOnly} className="p-1 hover:bg-slate-100 rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </button>
            </div>
            {expandedSections.suggested && (
              <div className="relative">
                <Input
                  readOnly={readOnly}
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
                readOnly={readOnly}
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

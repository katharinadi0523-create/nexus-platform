"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  RetrievalConfigStep,
  defaultRetrievalConfig,
  type RetrievalConfigState,
} from "@/components/knowledge-base/RetrievalConfigStep";
import {
  HybridStrategyStep,
  defaultHybridStrategies,
  type RetrievalStrategy,
} from "@/components/knowledge-base/HybridStrategyStep";
import { createCustomKnowledgeBase } from "@/lib/mock/knowledge-base-list";

const STEPS = [
  { id: 1, title: "定义知识库" },
  { id: 2, title: "检索配置" },
  { id: 3, title: "混合检索策略配置" },
] as const;

const mockGroups = [
  { value: "all", label: "全部群组" },
  { value: "tianjin", label: "全部群组/天津纪委知识库" },
  { value: "test1", label: "全部群组/测试群组1" },
  { value: "migration", label: "全部群组/迁移知识库" },
];

const NAME_PATTERN = /^[a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9\u4e00-\u9fa5_.-]*$/;

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 px-6 py-6">
      {STEPS.map((step, index) => {
        const isActive = currentStep === step.id;
        const isDone = currentStep > step.id;
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                  isActive || isDone
                    ? "bg-[#2773ff] text-white"
                    : "bg-slate-200 text-slate-500"
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <span
                className={cn(
                  "text-sm whitespace-nowrap",
                  isActive
                    ? "font-medium text-[#2773ff]"
                    : isDone
                      ? "font-medium text-slate-700"
                      : "text-slate-400"
                )}
              >
                {step.title}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-4 h-px w-16 sm:w-24",
                  currentStep > step.id ? "bg-[#2773ff]" : "bg-slate-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CreateCustomKnowledgeBasePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("知识库_1");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState("all");
  const [nameTouched, setNameTouched] = useState(false);
  const [groupTouched, setGroupTouched] = useState(false);
  const [retrievalConfig, setRetrievalConfig] = useState<RetrievalConfigState>(
    defaultRetrievalConfig
  );
  const [hybridStrategies, setHybridStrategies] = useState<RetrievalStrategy[]>(
    defaultHybridStrategies
  );
  const [showEngineError, setShowEngineError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nameError = useMemo(() => {
    if (!name.trim()) return "知识库名称不能为空";
    if (name.length > 100) return "知识库名称不能超过100个字符";
    if (!NAME_PATTERN.test(name)) {
      return "支持字母、中文、数字、下划线(_)、中划线(-)、点(.)，并且必须以字母或中文开头";
    }
    return "";
  }, [name]);

  const groupError = useMemo(() => {
    if (!groupId) return "请选择所属群组";
    return "";
  }, [groupId]);

  const handleCancel = () => {
    router.push("/knowledge-base");
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const validateStep1 = () => {
    setNameTouched(true);
    setGroupTouched(true);
    if (nameError || groupError) {
      toast.error("请先完善基本信息");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (retrievalConfig.engines.length === 0) {
      setShowEngineError(true);
      toast.error("请至少选择一种核心检索引擎");
      return false;
    }
    if (
      retrievalConfig.engines.includes("graph") &&
      !retrievalConfig.graph.prompt.trim()
    ) {
      toast.error("请填写图谱检索提示词");
      return false;
    }
    setShowEngineError(false);
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;

    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    // 第三步：确认创建
    if (submitting) return;
    setSubmitting(true);
    try {
      const created = createCustomKnowledgeBase({
        name,
        description,
        groupId,
      });
      toast.success("自定义知识库创建成功，请上传文档进行 RAG 解析切片");
      router.push(`/knowledge-base/${created.id}`);
    } catch {
      toast.error("创建失败，请重试");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-6 py-4">
        <Link
          href="/knowledge-base"
          className="rounded-lg p-1.5 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5 text-slate-700" />
        </Link>
        <h1 className="text-lg font-semibold text-slate-900">创建知识库</h1>
      </div>

      {/* Steps */}
      <div className="shrink-0 border-b border-slate-100">
        <StepIndicator currentStep={currentStep} />
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        {currentStep === 1 && (
          <div className="w-full max-w-3xl space-y-6">
            <h2 className="text-base font-semibold text-slate-900">基本信息</h2>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="kb-name" className="text-sm text-slate-700">
                  知识库名称
                </Label>
                <span className="text-red-500">*</span>
              </div>
              <div className="relative">
                <Input
                  id="kb-name"
                  value={name}
                  maxLength={100}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setNameTouched(true)}
                  className={cn(
                    "pr-14",
                    nameTouched && nameError ? "border-red-500" : ""
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  {name.length}/100
                </span>
              </div>
              {nameTouched && nameError ? (
                <p className="text-xs text-red-500">{nameError}</p>
              ) : (
                <p className="text-xs text-slate-400">
                  支持字母、中文、数字、下划线(_)、中划线(-)、点(.)，并且必须以字母或中文开头
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="kb-desc" className="text-sm text-slate-700">
                描述
              </Label>
              <div className="relative">
                <Textarea
                  id="kb-desc"
                  value={description}
                  maxLength={200}
                  rows={4}
                  placeholder="请输入知识库内容备注说明，便于查找和管理知识库。描述不影响Agent对知识库的调用效果"
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none pb-6"
                />
                <span className="absolute bottom-2 right-3 text-xs text-slate-400">
                  {description.length}/200
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label className="text-sm text-slate-700">所属群组</Label>
                <span className="text-red-500">*</span>
              </div>
              <Select
                value={groupId}
                onValueChange={(value) => {
                  setGroupId(value);
                  setGroupTouched(true);
                }}
                options={mockGroups}
                placeholder="请选择所属群组"
                className={cn(
                  groupTouched && groupError ? "border-red-500" : ""
                )}
              />
              {groupTouched && groupError && (
                <p className="text-xs text-red-500">{groupError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-slate-700">图标</Label>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 transition-colors hover:border-[#2773ff]/50 hover:bg-blue-50"
                onClick={() => toast.message("图标选择功能开发中")}
                aria-label="选择图标"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded bg-[#2773ff]">
                  <FileText className="h-4 w-4 text-white" />
                </div>
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <RetrievalConfigStep
            value={retrievalConfig}
            onChange={(next) => {
              setRetrievalConfig(next);
              if (next.engines.length > 0) setShowEngineError(false);
            }}
            showEngineError={showEngineError}
          />
        )}

        {currentStep === 3 && (
          <HybridStrategyStep
            value={hybridStrategies}
            onChange={setHybridStrategies}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center gap-3 border-t border-slate-200 bg-white px-8 py-4">
        {currentStep === 1 ? (
          <>
            <Button
              className="bg-[#2773ff] px-6 text-white hover:bg-[#1f63e0]"
              onClick={handleNext}
            >
              下一步
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
          </>
        ) : currentStep === 2 ? (
          <>
            <Button variant="outline" onClick={handlePrev}>
              上一步
            </Button>
            <Button
              className="bg-[#2773ff] px-6 text-white hover:bg-[#1f63e0]"
              onClick={handleNext}
            >
              下一步
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handlePrev}>
              上一步
            </Button>
            <Button
              className="bg-[#2773ff] px-6 text-white hover:bg-[#1f63e0]"
              onClick={handleNext}
              disabled={submitting}
            >
              {submitting ? "创建中..." : "确定"}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

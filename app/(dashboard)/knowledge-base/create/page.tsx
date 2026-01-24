"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Sparkles, HelpCircle, Upload, X, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SelectableCard } from "@/components/knowledge-base/SelectableCard";
import { FileUpload } from "@/components/knowledge-base/FileUpload";
import { TagTreeSelector, type TagTreeItem } from "@/components/knowledge-base/TagTreeSelector";
import { MultiSelect } from "@/components/knowledge-base/MultiSelect";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Zod Schema with conditional validation
const formSchema = z
  .object({
    // Basic Info
    name: z
      .string()
      .min(1, "知识库名称不能为空")
      .max(100, "知识库名称不能超过100个字符")
      .regex(
        /^[a-zA-Z\u4e00-\u9fa5][a-zA-Z0-9\u4e00-\u9fa5_.-]*$/,
        "只能输入字母、中文、数字、下划线(_)、中划线(-)、点(.)，并且必须以字母或中文开头"
      ),
    description: z.string().max(200, "描述不能超过200个字符").optional(),
    groupId: z.string().min(1, "请选择所属群组"),
    fileType: z.enum(["text", "table"]),
    files: z.array(z.instanceof(File)).min(1, "请至少上传一个文件"),

    // Strategy
    parsingStrategies: z
      .array(
        z.enum([
          "text-recognition",
          "image-understanding",
          "table-parsing",
          "formula-parsing",
        ])
      )
      .min(1, "请至少选择一种解析策略"),
    imageParsingMode: z.enum(["ocr", "understanding"]).optional(),
    chunkingStrategy: z.enum([
      "auto",
      "by-identifiers",
      "by-page",
      "by-regex",
      "by-hierarchy",
    ]),

    // Dynamic fields based on chunking strategy
    identifiers: z.array(z.string()).optional(),
    maxChunkLength: z.number().min(1, "切片最大长度必须大于0").default(600),
    chunkOverlapLength: z
      .number()
      .min(0, "重叠长度不能小于0")
      .max(100, "重叠长度不能超过100%")
      .default(15),
    regexExpression: z.string().max(250).optional(),
    regexPosition: z.enum(["before", "after"]).optional(),

    // Tags
    documentTags: z.array(z.string()).optional(),
    chunkTagsEnabled: z.boolean().default(false),
    chunkTags: z.array(z.string()).optional(),

    // Table-specific fields
    tableHeaderRow: z.number().min(1).default(1),
    tableDataStartRow: z.number().min(1).default(2),
    tableColumns: z.array(z.object({
      name: z.string().min(1, "列名不能为空"),
      description: z.string().max(30, "描述不能超过30个字符").optional(),
    })).optional(),
  })
  .refine(
    (data) => {
      if (data.chunkingStrategy === "by-identifiers") {
        return (
          data.identifiers && data.identifiers.length > 0
        );
      }
      return true;
    },
    {
      message: "请至少选择一个标识符",
      path: ["identifiers"],
    }
  )
  .refine(
    (data) => {
      if (data.chunkingStrategy === "by-regex") {
        return (
          data.regexExpression &&
          data.regexExpression.length > 0 &&
          data.regexPosition
        );
      }
      return true;
    },
    {
      message: "请输入正则表达式并选择位置",
      path: ["regexExpression"],
    }
  )
  .refine(
    (data) => {
      if (data.chunkTagsEnabled) {
        return data.chunkTags && data.chunkTags.length > 0;
      }
      return true;
    },
    {
      message: "请选择切片标签范围",
      path: ["chunkTags"],
    }
  )
  .refine(
    (data) => {
      if (data.parsingStrategies.includes("image-understanding")) {
        return data.imageParsingMode !== undefined;
      }
      return true;
    },
    {
      message: "请选择图片解析模式",
      path: ["imageParsingMode"],
    }
  )
  .refine(
    (data) => {
      if (data.fileType === "table") {
        return data.tableColumns && data.tableColumns.length > 0;
      }
      return true;
    },
    {
      message: "请至少配置一列",
      path: ["tableColumns"],
    }
  );

type FormData = z.infer<typeof formSchema>;

// Mock groups
const mockGroups = [
  { value: "all", label: "全部群组" },
  { value: "tianjin", label: "全部群组/天津纪委知识库" },
  { value: "test1", label: "全部群组/测试群组1" },
];

// Mock tag tree
const mockTagTree: TagTreeItem[] = [
  {
    key: "南航",
    label: "南航",
    values: ["PPT", "客服", "行业通识", "无陪伴", "退改签"],
  },
  {
    key: "水利设备",
    label: "水利设备",
    values: ["故障手册", "SOP"],
  },
];

// Mock table columns data
const mockTableColumns = [
  { name: "公告日期", description: "" },
  { name: "采购单位", description: "" },
  { name: "项目名称", description: "" },
  { name: "中标企业", description: "" },
  { name: "厂商系", description: "3" },
  { name: "中标金额(万元)", description: "8" },
  { name: "细分赛道", description: "" },
  { name: "场景/说明", description: "" },
];

export default function CreateKnowledgeBasePage() {
  const router = useRouter();
  const [charCount, setCharCount] = useState({ name: 0, description: 0 });
  const [regexCharCount, setRegexCharCount] = useState(0);
  const [tableFileUploaded, setTableFileUploaded] = useState(false);
  const [tableColumnDescriptions, setTableColumnDescriptions] = useState<Record<number, string>>({});
  const [isDragging, setIsDragging] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      groupId: "",
      fileType: "text",
      files: [],
      parsingStrategies: [],
      imageParsingMode: undefined,
      chunkingStrategy: "auto",
      maxChunkLength: 600,
      chunkOverlapLength: 15,
      chunkTagsEnabled: false,
      tableHeaderRow: 1,
      tableDataStartRow: 2,
      tableColumns: [],
    },
  });

  const fileType = form.watch("fileType");
  const files = form.watch("files");
  const tableColumns = form.watch("tableColumns") || [];

  const chunkingStrategy = form.watch("chunkingStrategy");
  const chunkTagsEnabled = form.watch("chunkTagsEnabled");
  const parsingStrategies: Array<"text-recognition" | "image-understanding" | "table-parsing" | "formula-parsing"> = 
    form.watch("parsingStrategies") || [];
  const imageParsingMode = form.watch("imageParsingMode");

  // Handle table file upload
  const handleTableFileUpload = (uploadedFiles: File[]) => {
    form.setValue("files", uploadedFiles);
    if (uploadedFiles.length > 0 && !tableFileUploaded) {
      setTableFileUploaded(true);
      // Auto-fill mock columns when file is uploaded
      form.setValue("tableColumns", mockTableColumns);
      // Initialize description states
      const descMap: Record<number, string> = {};
      mockTableColumns.forEach((col, idx) => {
        if (col.description) {
          descMap[idx] = col.description;
        }
      });
      setTableColumnDescriptions(descMap);
    }
  };

  // Handle table file removal
  const handleTableFileRemove = () => {
    form.setValue("files", []);
    form.setValue("tableColumns", []);
    setTableFileUploaded(false);
    setTableColumnDescriptions({});
  };

  // Handle table column description change
  const handleColumnDescriptionChange = (index: number, value: string) => {
    const newDesc = { ...tableColumnDescriptions, [index]: value };
    setTableColumnDescriptions(newDesc);
    const updatedColumns = [...tableColumns];
    updatedColumns[index] = {
      ...updatedColumns[index],
      description: value,
    };
    form.setValue("tableColumns", updatedColumns);
  };

  // Handle table column removal
  const handleColumnRemove = (index: number) => {
    const updatedColumns = tableColumns.filter((_, i) => i !== index);
    form.setValue("tableColumns", updatedColumns);
    const newDesc = { ...tableColumnDescriptions };
    delete newDesc[index];
    setTableColumnDescriptions(newDesc);
  };

  // Handle file type change
  const handleFileTypeChange = (value: "text" | "table") => {
    form.setValue("fileType", value);
    if (value === "text") {
      setTableFileUploaded(false);
      form.setValue("tableColumns", []);
      setTableColumnDescriptions({});
    }
  };

  // Handle parsing strategy toggle (multi-select)
  const handleParsingStrategyToggle = (
    strategy: "text-recognition" | "image-understanding" | "table-parsing" | "formula-parsing"
  ) => {
    const current = parsingStrategies;
    const isSelected = current.includes(strategy);

    if (isSelected) {
      // Remove strategy
      const updated = current.filter((s) => s !== strategy);
      form.setValue("parsingStrategies", updated);
      // If removing image-understanding, clear imageParsingMode
      if (strategy === "image-understanding") {
        form.setValue("imageParsingMode", undefined);
      }
    } else {
      // Add strategy
      const updated = [...current, strategy];
      form.setValue("parsingStrategies", updated);
      // If adding image-understanding, set default to OCR
      if (strategy === "image-understanding" && !imageParsingMode) {
        form.setValue("imageParsingMode", "ocr");
      }
    }
  };

  const onSubmit = (data: FormData) => {
    console.log("Form submitted:", data);
    // Handle form submission
    router.push("/knowledge-base");
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Page Title */}
      <h1 className="text-2xl font-semibold">创建知识库</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>基础信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="name">知识库名称</Label>
                <span className="text-red-500">*</span>
              </div>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="请输入知识库名称"
                  maxLength={100}
                  {...form.register("name", {
                    onChange: (e) =>
                      setCharCount((prev) => ({
                        ...prev,
                        name: e.target.value.length,
                      })),
                  })}
                  className={form.formState.errors.name ? "border-red-500" : ""}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  {charCount.name}/100
                </span>
              </div>
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
              <p className="text-xs text-slate-500">
                支持100位字符,只能输入字母、中文、数字、下划线(_)、中划线(-)、点(.)，并且必须以字母或中文开头
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">知识库描述</Label>
              <Textarea
                id="description"
                placeholder="请输入知识库内容备注说明,便于查找和管理知识库。描述不影响Agent对知识库的调用效果"
                maxLength={200}
                rows={4}
                {...form.register("description", {
                  onChange: (e) =>
                    setCharCount((prev) => ({
                      ...prev,
                      description: e.target.value.length,
                    })),
                })}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">支持0-200位字符</span>
                <span className="text-xs text-slate-400">
                  {charCount.description}/200
                </span>
              </div>
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label>图标</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-600">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <Button type="button" variant="outline" size="sm">
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI生成
                </Button>
              </div>
            </div>

            {/* Group */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>所属群组</Label>
                <span className="text-red-500">*</span>
              </div>
              <Select
                value={form.watch("groupId")}
                onValueChange={(value) => form.setValue("groupId", value)}
                options={mockGroups}
                placeholder="请选择所属群组"
                className={
                  form.formState.errors.groupId ? "border-red-500" : ""
                }
              />
              {form.formState.errors.groupId && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.groupId.message}
                </p>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Conditional Content Based on File Type */}
        {fileType === "text" ? (
          <>
            {/* File Upload for Text Type */}
            <Card>
              <CardHeader>
                <CardTitle>文件上传</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Type Toggle */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium">文件类型：</Label>
                  <Tabs
                    value={fileType}
                    onValueChange={(value) => handleFileTypeChange(value as "text" | "table")}
                  >
                    <TabsList>
                      <TabsTrigger value="text">文本型数据</TabsTrigger>
                      <TabsTrigger value="table">表格型数据</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <FileUpload
                  value={files}
                  onChange={(files) => form.setValue("files", files)}
                />
                {form.formState.errors.files && (
                  <p className="text-xs text-red-500 mt-2">
                    {form.formState.errors.files.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Strategy Card */}
        <Card>
          <CardHeader>
            <CardTitle>策略配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Parsing Strategy */}
            <div className="space-y-4">
              <div className="flex items-center gap-1">
                <Label>解析策略</Label>
                <span className="text-red-500">*</span>
              </div>
              <div className="space-y-4">
                {/* Four-column grid layout */}
                <div className="grid grid-cols-4 gap-4">
                  <SelectableCard
                    title="文字识别"
                    description="基于规则的文档提取"
                    selected={parsingStrategies.includes("text-recognition")}
                    onSelect={() => handleParsingStrategyToggle("text-recognition")}
                  />
                  <SelectableCard
                    title="图片解析"
                    description="将图片内文字或图片内容描述作为切片的一部分"
                    selected={parsingStrategies.includes("image-understanding")}
                    onSelect={() => handleParsingStrategyToggle("image-understanding")}
                  />
                  <SelectableCard
                    title="表格解析"
                    description="保留文内表格中的结构化信息"
                    selected={parsingStrategies.includes("table-parsing")}
                    onSelect={() => handleParsingStrategyToggle("table-parsing")}
                  />
                  <SelectableCard
                    title="公式解析"
                    description="识别并解析文档中的数学公式"
                    selected={parsingStrategies.includes("formula-parsing")}
                    onSelect={() => handleParsingStrategyToggle("formula-parsing")}
                  />
                </div>
                {/* Image Understanding Sub-options - Display below grid */}
                {parsingStrategies.includes("image-understanding") && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium text-slate-700 whitespace-nowrap">
                        图片解析模式：
                      </Label>
                      <RadioGroup
                        value={imageParsingMode || "ocr"}
                        onValueChange={(value) =>
                          form.setValue("imageParsingMode", value as "ocr" | "understanding")
                        }
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ocr" id="ocr" />
                          <Label htmlFor="ocr" className="font-normal cursor-pointer text-sm">
                            图片文字识别 (OCR)
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="cursor-help">
                                <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-64 p-3 text-xs text-slate-700"
                              side="right"
                              sideOffset={8}
                            >
                              识别图片、扫描件中的文字信息
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="understanding" id="understanding" />
                          <Label htmlFor="understanding" className="font-normal cursor-pointer text-sm">
                            图片内容理解
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="cursor-help">
                                <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-64 p-3 text-xs text-slate-700"
                              side="right"
                              sideOffset={8}
                            >
                              调用模型理解图片，适用于画面描述、图表研读等
                            </PopoverContent>
                          </Popover>
                        </div>
                      </RadioGroup>
                    </div>
                    {form.formState.errors.imageParsingMode && (
                      <p className="text-xs text-red-500 mt-2">
                        {form.formState.errors.imageParsingMode.message}
                      </p>
                    )}
                  </div>
                )}
                {/* Validation error for parsingStrategies */}
                {form.formState.errors.parsingStrategies && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.parsingStrategies.message}
                  </p>
                )}
              </div>
            </div>

            {/* Chunking Strategy */}
            <div className="space-y-4">
              <div className="flex items-center gap-1">
                <Label>切片策略</Label>
                <span className="text-red-500">*</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <SelectableCard
                  title="自动切片"
                  description="通用格式文本常见切分方法"
                  selected={chunkingStrategy === "auto"}
                  onSelect={() => form.setValue("chunkingStrategy", "auto")}
                />
                <SelectableCard
                  title="按常见标识符切分"
                  description="配置常见的标识符、切片最大长度等选项"
                  selected={chunkingStrategy === "by-identifiers"}
                  onSelect={() =>
                    form.setValue("chunkingStrategy", "by-identifiers")
                  }
                />
                <SelectableCard
                  title="按页切分"
                  description="适用于PPT、单页图标等"
                  selected={chunkingStrategy === "by-page"}
                  onSelect={() => form.setValue("chunkingStrategy", "by-page")}
                />
                <SelectableCard
                  title="自定义正则切分"
                  description="通过正则表达式,自定义匹配切片分隔符"
                  selected={chunkingStrategy === "by-regex"}
                  onSelect={() => form.setValue("chunkingStrategy", "by-regex")}
                />
                <SelectableCard
                  title="按层级切分"
                  description="根据文档中的标题层级结构,智能切分内容片段"
                  selected={chunkingStrategy === "by-hierarchy"}
                  onSelect={() =>
                    form.setValue("chunkingStrategy", "by-hierarchy")
                  }
                />
              </div>

              {/* Dynamic Fields */}
              <div className="space-y-4 pt-4">
                {/* Auto / By Page / By Hierarchy: Show max length and overlap */}
                {(chunkingStrategy === "auto" ||
                  chunkingStrategy === "by-page" ||
                  chunkingStrategy === "by-hierarchy") && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label>切片最大长度</Label>
                        <span className="text-red-500">*</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="cursor-help">
                              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3 text-xs">
                            设置每个切片的最大字符数
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Input
                        type="number"
                        {...form.register("maxChunkLength", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label>切片重叠长度</Label>
                        <span className="text-red-500">*</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          {...form.register("chunkOverlapLength", {
                            valueAsNumber: true,
                          })}
                          className="flex-1"
                        />
                        <span className="text-sm text-slate-500">%</span>
                      </div>
                    </div>
                  </>
                )}

                {/* By Identifiers */}
                {chunkingStrategy === "by-identifiers" && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label>标识符</Label>
                        <span className="text-red-500">*</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="cursor-help">
                              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3 text-xs">
                            选择用于切片的标识符
                          </PopoverContent>
                        </Popover>
                      </div>
                      <MultiSelect
                        value={form.watch("identifiers") || []}
                        onChange={(values) =>
                          form.setValue("identifiers", values)
                        }
                        options={[
                          { value: "period", label: "中/英文句号" },
                          { value: "comma", label: "中/英文逗号" },
                          { value: "question", label: "中/英文问号" },
                          { value: "exclamation", label: "中/英文叹号" },
                          { value: "ellipsis", label: "中/英文省略号" },
                          { value: "newline", label: "中/英文换行符" },
                        ]}
                        placeholder="请选择标识符"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label>切片最大长度</Label>
                        <span className="text-red-500">*</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="cursor-help">
                              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3 text-xs">
                            设置每个切片的最大字符数
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Input
                        type="number"
                        {...form.register("maxChunkLength", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label>切片重叠长度</Label>
                        <span className="text-red-500">*</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          {...form.register("chunkOverlapLength", {
                            valueAsNumber: true,
                          })}
                          className="flex-1"
                        />
                        <span className="text-sm text-slate-500">%</span>
                      </div>
                    </div>
                  </>
                )}

                {/* By Regex */}
                {chunkingStrategy === "by-regex" && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label>表达式</Label>
                        <span className="text-red-500">*</span>
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="请输入正则表达式,如第d+章"
                          maxLength={250}
                          {...form.register("regexExpression", {
                            onChange: (e) =>
                              setRegexCharCount(e.target.value.length),
                          })}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          {regexCharCount}/250
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label>正则式位置</Label>
                        <span className="text-red-500">*</span>
                      </div>
                      <RadioGroup
                        value={form.watch("regexPosition")}
                        onValueChange={(value) =>
                          form.setValue("regexPosition", value as "before" | "after")
                        }
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="before" id="before" />
                          <Label htmlFor="before" className="font-normal cursor-pointer">
                            正则式与前序切片合并
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="after" id="after" />
                          <Label htmlFor="after" className="font-normal cursor-pointer">
                            正则式与后序切片合并
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label>切片最大长度</Label>
                        <span className="text-red-500">*</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="cursor-help">
                              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3 text-xs">
                            设置每个切片的最大字符数
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Input
                        type="number"
                        {...form.register("maxChunkLength", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
          </>
        ) : (
          <>
            {/* Table File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>文件上传</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Type Toggle */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium">文件类型：</Label>
                  <Tabs
                    value={fileType}
                    onValueChange={(value) => handleFileTypeChange(value as "text" | "table")}
                  >
                    <TabsList>
                      <TabsTrigger value="text">文本型数据</TabsTrigger>
                      <TabsTrigger value="table">表格型数据</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                {!tableFileUploaded ? (
                  <div className="space-y-3">
                    <div
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = ".xlsx,.csv";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) {
                            handleTableFileUpload([file]);
                          }
                        };
                        input.click();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files[0];
                        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv'))) {
                          handleTableFileUpload([file]);
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                      }}
                      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                        isDragging
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      <Upload className="mb-4 h-12 w-12 text-slate-400" />
                      <p className="mb-2 text-sm font-medium text-slate-700">
                        将文件拖拽到此处或点击上传
                      </p>
                      <p className="text-xs text-slate-500">
                        支持上传 .xlsx、.csv 文件；单次至多上传 1 个文件；每个文件不超过 50MB；最多 30,000 行；每行最多 5,000 字符
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-3"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{file.name}</p>
                            <p className="text-xs text-slate-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = ".xlsx,.csv";
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  handleTableFileUpload([file]);
                                }
                              };
                              input.click();
                            }}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleTableFileRemove}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {form.formState.errors.files && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.files.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Table Structure Configuration */}
            {tableFileUploaded && (
              <Card>
                <CardHeader>
                  <CardTitle>表结构配置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Configuration Row */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium whitespace-nowrap">
                        <span className="text-red-500">*</span>表头：
                      </Label>
                      <Input
                        type="number"
                        value={form.watch("tableHeaderRow")}
                        onChange={(e) =>
                          form.setValue("tableHeaderRow", parseInt(e.target.value) || 1)
                        }
                        className="w-24"
                        min={1}
                      />
                      <span className="text-sm text-slate-600">行</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium whitespace-nowrap">
                        <span className="text-red-500">*</span>数据起始行：
                      </Label>
                      <Input
                        type="number"
                        value={form.watch("tableDataStartRow")}
                        onChange={(e) =>
                          form.setValue("tableDataStartRow", parseInt(e.target.value) || 2)
                        }
                        className="w-24"
                        min={1}
                      />
                      <span className="text-sm text-slate-600">行</span>
                    </div>
                  </div>

                  {/* Columns Table */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">列名</TableHead>
                          <TableHead>描述</TableHead>
                          <TableHead className="w-[100px]">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableColumns.map((column, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{column.name}</TableCell>
                            <TableCell>
                              <div className="relative">
                                <Input
                                  value={tableColumnDescriptions[index] || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.length <= 30) {
                                      handleColumnDescriptionChange(index, value);
                                    }
                                  }}
                                  placeholder="请输入描述"
                                  maxLength={30}
                                  className="w-full"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                  {(tableColumnDescriptions[index] || "").length}/30
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">
                                  {(tableColumnDescriptions[index] || "").length}/100
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleColumnRemove(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  删除
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {form.formState.errors.tableColumns && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.tableColumns.message}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Tags Card */}
        <Card>
          <CardHeader>
            <CardTitle>标签配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Tags */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>文档标签</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="cursor-help">
                      <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 text-xs">
                    为文档添加标签以便分类管理
                  </PopoverContent>
                </Popover>
              </div>
              <TagTreeSelector
                value={form.watch("documentTags") || []}
                onChange={(values) => form.setValue("documentTags", values)}
                options={mockTagTree}
                placeholder="请输入标签搜索或选择标签"
              />
            </div>

            {/* Chunk Tags */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label>切片标签</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="cursor-help">
                      <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 text-xs">
                    开启后针对所选的标签范围,大模型对文档所有切片自动选择标签
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={chunkTagsEnabled}
                  onCheckedChange={(checked) =>
                    form.setValue("chunkTagsEnabled", checked)
                  }
                />
                <span className="text-sm text-slate-600">
                  {chunkTagsEnabled ? "开启" : "关闭"}
                </span>
              </div>
              {chunkTagsEnabled && (
                <p className="text-xs text-slate-500">
                  开启后针对所选的标签范围,大模型对文档所有切片自动选择标签
                </p>
              )}
              {chunkTagsEnabled && (
                <TagTreeSelector
                  value={form.watch("chunkTags") || []}
                  onChange={(values) => form.setValue("chunkTags", values)}
                  options={mockTagTree}
                  placeholder="请选择切片标签范围"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fixed Bottom Bar */}
        <div className="fixed bottom-0 left-60 right-0 z-50 border-t bg-white px-6 py-4 shadow-lg">
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              取消
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              确认创建
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, ChevronDown, HardDrive, Database, FileJson, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import type { LogEntry } from "@/components/agent/logs-table";
import type { LogEntry as SFTLogEntry, AgentType } from "@/lib/agent-data";

// OpenAI Messages 格式
type MessageRole = "system" | "user" | "assistant";

interface Message {
  role: MessageRole;
  content: string;
  imageUrl?: string; // 用户上传的图片路径
}

// 扩展的日志条目，包含完整的对话历史
interface ExtendedLogEntry {
  id: string;
  messages: Message[];
  timestamp: string;
  source: LogEntry["source"];
}

interface ExportLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalCount?: number;
  filteredLogs?: LogEntry[];
  searchKeyword?: string;
  dateRange?: { start: string; end: string };
  logs?: SFTLogEntry[]; // SFT 格式的日志
  agentType?: AgentType; // 智能体类型，用于决定是否显示 System 列
}

const FIELD_OPTIONS = [
  { value: "keyword", label: "关键词" },
  { value: "dateRange", label: "日期范围" },
  { value: "source", label: "渠道来源" },
  { value: "userFeedback", label: "用户反馈" },
  { value: "adminFeedback", label: "管理员反馈" },
];

const SOURCE_OPTIONS = [
  { value: "应用广场", label: "应用广场" },
  { value: "API调用", label: "API调用" },
  { value: "网页端体验", label: "网页端体验" },
  { value: "预览与调试", label: "预览与调试" },
];

const FEEDBACK_OPTIONS = [
  { value: "like", label: "点赞" },
  { value: "dislike", label: "点踩" },
];

const ADMIN_FEEDBACK_OPTIONS = [
  { value: "good", label: "点赞" },
  { value: "bad", label: "点踩" },
];

// Mock 数据目录
const MOCK_DIRECTORIES = [
  { id: "finance", name: "金融数据" },
  { id: "general", name: "通用数据" },
  { id: "test", name: "测试数据" },
];

// Mock 数据卷（按目录分组）
const MOCK_VOLUMES: Record<string, string[]> = {
  finance: ["vol-finance-001", "vol-finance-002", "vol-finance-003"],
  general: ["vol-general-001", "vol-general-002"],
  test: ["vol-test-001"],
};

// 选中路径类型
interface SelectedPath {
  dir: string;
  type: "volume";
  volume: string | "new";
}

// 已删除硬编码的 Mock 数据 - 组件现在完全依赖 props.logs

// 数据分离逻辑
interface SeparatedData {
  system: string | null;
  input: Message[];
  output: string | null;
  messages: Message[];
}

const separateMessages = (messages: Message[]): SeparatedData => {
  const systemMessage = messages.find((msg) => msg.role === "system");
  const system = systemMessage ? systemMessage.content : null;

  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") {
      lastAssistantIndex = i;
      break;
    }
  }

  const input: Message[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === "system") continue;
    if (i === lastAssistantIndex) continue;
    input.push(messages[i]);
  }

  const output =
    lastAssistantIndex >= 0 ? messages[lastAssistantIndex].content : null;

  return {
    system,
    input,
    output,
    messages,
  };
};

// Generate preview data
const generatePreviewData = (
  mockLogs: ExtendedLogEntry[],
  maxCount: number = 10
) => {
  return mockLogs.slice(0, maxCount).map((log, index) => {
    const separated = separateMessages(log.messages);
    return {
      id: index + 1,
      system: separated.system,
      input: separated.input,
      output: separated.output,
      messages: separated.messages,
      logId: log.id,
    };
  });
};

// 三级级联菜单选择器组件
interface CascadingMenuSelectorProps {
  selectedPath: SelectedPath | null;
  onSelect: (path: SelectedPath) => void;
  onCreateNew: (dir: string) => void;
}

function CascadingMenuSelector({
  selectedPath,
  onSelect,
  onCreateNew,
}: CascadingMenuSelectorProps) {
  const getDisplayText = () => {
    if (!selectedPath) return "请选择数据目录...";
    const dir = MOCK_DIRECTORIES.find((d) => d.id === selectedPath.dir);
    if (!dir) return "请选择数据目录...";
    
    if (selectedPath.volume === "new") {
      return `${dir.name} / 数据卷 / [新建]`;
    }
    const volume = MOCK_VOLUMES[selectedPath.dir]?.find(
      (v) => v === selectedPath.volume
    );
    return `${dir.name} / 数据卷 / ${volume || selectedPath.volume}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={!selectedPath ? "text-muted-foreground" : ""}>
            {getDisplayText()}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {MOCK_DIRECTORIES.map((dir) => (
          <DropdownMenuSub key={dir.id}>
            <DropdownMenuSubTrigger>{dir.name}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {/* Layer 2: Types */}
              {/* Layer 3: Volumes (Nested) */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <HardDrive className="h-4 w-4 mr-2" />
                  数据卷
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {/* Layer 3: Volumes List */}
                  {MOCK_VOLUMES[dir.id]?.map((volume) => (
                    <DropdownMenuItem
                      key={volume}
                      onClick={() => {
                        onSelect({
                          dir: dir.id,
                          type: "volume",
                          volume: volume,
                        });
                      }}
                    >
                      {volume}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      onCreateNew(dir.id);
                    }}
                    className="text-blue-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    新建数据卷
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              
              <DropdownMenuItem disabled>
                <Database className="h-4 w-4 mr-2" />
                数据库
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <FileJson className="h-4 w-4 mr-2" />
                元数据
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export function ExportLogsDialog({
  open,
  onOpenChange,
  totalCount = 11234,
  filteredLogs = [],
  searchKeyword = "",
  dateRange,
  logs = [],
  agentType,
}: ExportLogsDialogProps) {
  const [exportMethod, setExportMethod] = useState<"local" | "catalog">("local");
  const [conditions, setConditions] = useState<Array<{ id: string; field: string; value: string }>>([]);
  
  // 三级级联菜单状态
  const [selectedPath, setSelectedPath] = useState<SelectedPath | null>(null);
  const [newVolumeName, setNewVolumeName] = useState("");
  const [fileName, setFileName] = useState("");
  
  // 展开/收起状态
  const [expandedRows, setExpandedRows] = useState<Map<number, { input: boolean; output: boolean }>>(new Map());

  // Initialize conditions from props
  useEffect(() => {
    const initialConditions: Array<{ id: string; field: string; value: string }> = [];
    if (searchKeyword) {
      initialConditions.push({
        id: "keyword-1",
        field: "keyword",
        value: searchKeyword,
      });
    }
    if (dateRange?.start || dateRange?.end) {
      initialConditions.push({
        id: "dateRange-1",
        field: "dateRange",
        value: `${dateRange.start || ""}|${dateRange.end || ""}`,
      });
    }
    if (initialConditions.length > 0) {
      setConditions(initialConditions);
    }
  }, [searchKeyword, dateRange]);

  // 将 SFT 格式的日志转换为 ExtendedLogEntry 格式
  const convertSFTToExtended = (sftLogs: SFTLogEntry[]): ExtendedLogEntry[] => {
    return sftLogs.map((log) => {
      // 随机分配 source（可以根据实际需求调整）
      const sources: LogEntry["source"][] = [
        "应用广场",
        "API调用",
        "网页端体验",
        "预览与调试",
      ];
      const source =
        sources[Math.floor(Math.random() * sources.length)] || "应用广场";

      return {
        id: log.id,
        messages: log.messages.map((msg) => ({
          role: msg.role as MessageRole,
          content: msg.content,
          imageUrl: msg.imageUrl, // 传递 imageUrl
        })),
        timestamp: log.createdAt,
        source,
      };
    });
  };

  // 完全依赖 props.logs，如果为空则显示空数据
  const extendedLogs = logs.length > 0 ? convertSFTToExtended(logs) : [];
  const previewData = generatePreviewData(
    extendedLogs,
    Math.min(10, totalCount)
  );

  // 根据 agentType 和实际 logs 内容决定是否显示 System 列
  // 规则：autonomous 类型显示 System 列，或者 logs 中确实包含 system 消息
  const hasSystemInLogs = logs.length > 0 &&
    logs.some((log) =>
      log.messages.some((msg) => msg.role === "system")
    );
  
  // 强制显示 System 列的条件：
  // 1. agentType 明确为 'autonomous'（字符串严格相等）
  // 2. 或者 logs 中确实包含 system 消息
  // 3. 或者 previewData 中有 system 内容（作为后备检查）
  const hasSystemFromAgentType = agentType === "autonomous";
  const hasSystemFromPreviewData = previewData.some((item) => item.system !== null);
  const hasSystem = hasSystemFromAgentType || hasSystemInLogs || hasSystemFromPreviewData;
  
  // 切换展开/收起状态
  const toggleExpand = (rowId: number, column: "input" | "output") => {
    setExpandedRows((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(rowId) || { input: false, output: false };
      newMap.set(rowId, { ...current, [column]: !current[column] });
      return newMap;
    });
  };
  
  // 获取展开状态
  const getExpandedState = (rowId: number, column: "input" | "output") => {
    return expandedRows.get(rowId)?.[column] || false;
  };
  

  const handleAddCondition = () => {
    if (conditions.length >= 5) return;
    setConditions([
      ...conditions,
      {
        id: Date.now().toString(),
        field: "",
        value: "",
      },
    ]);
  };

  const handleRemoveCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const handleConditionFieldChange = (id: string, field: string) => {
    setConditions(
      conditions.map((c) => {
        if (c.id === id) {
          return { ...c, field, value: "" };
        }
        return c;
      })
    );
  };

  const handleConditionValueChange = (id: string, value: string) => {
    setConditions(
      conditions.map((c) => {
        if (c.id === id) {
          return { ...c, value };
        }
        return c;
      })
    );
  };

  const getValueInputOptions = (field: string) => {
    switch (field) {
      case "source":
        return SOURCE_OPTIONS;
      case "userFeedback":
        return FEEDBACK_OPTIONS;
      case "adminFeedback":
        return ADMIN_FEEDBACK_OPTIONS;
      default:
        return [];
    }
  };

  // 处理级联菜单选择
  const handlePathSelect = (path: SelectedPath) => {
    setSelectedPath(path);
    setNewVolumeName("");
    setFileName("");
  };
  
  // 处理新建数据卷
  const handleCreateNewVolume = (dir: string) => {
    setSelectedPath({
      dir,
      type: "volume",
      volume: "new",
    });
    setNewVolumeName("");
    setFileName("");
  };

  const renderValueInput = (condition: { id: string; field: string; value: string }) => {
    const options = getValueInputOptions(condition.field);

    if (condition.field === "dateRange") {
      const [start, end] = condition.value.split("|");
      return (
        <div className="flex items-center gap-2 flex-1">
          <Input
            type="date"
            value={start || ""}
            onChange={(e) => {
              const newValue = `${e.target.value}|${end || ""}`;
              handleConditionValueChange(condition.id, newValue);
            }}
            className="flex-1"
            placeholder="开始日期"
          />
          <span className="text-slate-400 text-sm">至</span>
          <Input
            type="date"
            value={end || ""}
            onChange={(e) => {
              const newValue = `${start || ""}|${e.target.value}`;
              handleConditionValueChange(condition.id, newValue);
            }}
            className="flex-1"
            placeholder="结束日期"
          />
        </div>
      );
    }

    if (options.length > 0) {
      return (
        <select
          value={condition.value}
          onChange={(e) => handleConditionValueChange(condition.id, e.target.value)}
          className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="">请选择</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <Input
        type="text"
        value={condition.value}
        onChange={(e) => handleConditionValueChange(condition.id, e.target.value)}
        placeholder="请输入"
        className="flex-1"
      />
    );
  };

  // 检查是否可以导出
  const canExport = () => {
    if (exportMethod === "local") {
      // 导出至本地：默认导出为 jsonl 格式，总是可以导出
      return true;
    } else {
      // 导出至数据目录：需要检查所有必填项
      if (!selectedPath) return false;
      if (selectedPath.volume === "new" && !newVolumeName.trim()) return false;
      if (!fileName.trim()) return false;
      return true;
    }
  };

  const handleExport = () => {
    if (!canExport()) return;
    
    // 完全依赖 props.logs，如果为空则无法导出
    if (logs.length === 0) {
      return;
    }
    
    const exportData = logs.map((log) => ({
      messages: log.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    }));

    // 默认导出为 jsonl 格式
    const jsonlContent = exportData
      .map((item) => JSON.stringify(item))
      .join("\n");
    const blob = new Blob([jsonlContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exported-logs-${Date.now()}.jsonl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>导出</DialogTitle>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <div className="flex flex-col gap-6">
            {/* 导出方式 */}
            <div className="space-y-3">
              <Label className="font-medium text-sm text-gray-700 mb-2 block">
                导出方式
              </Label>
              <RadioGroup
                value={exportMethod}
                onValueChange={(value) => setExportMethod(value as "local" | "catalog")}
                className="flex flex-row gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="local" id="local" />
                  <Label htmlFor="local" className="cursor-pointer font-normal">
                    导出至本地
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="catalog" id="catalog" />
                  <Label htmlFor="catalog" className="cursor-pointer font-normal">
                    导出至数据目录
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 筛选条件 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-sm text-gray-700 mb-2 block">
                  筛选条件
                </Label>
                <button
                  onClick={handleAddCondition}
                  disabled={conditions.length >= 5}
                  className="text-sm text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  添加条件({conditions.length}/5)
                </button>
              </div>

              {conditions.length === 0 ? (
                <div className="text-sm text-slate-500 py-2">
                  暂无筛选条件，点击上方按钮添加
                </div>
              ) : (
                <div className="space-y-2">
                  {conditions.map((condition) => (
                    <div key={condition.id} className="flex items-center gap-2">
                      <select
                        value={condition.field}
                        onChange={(e) =>
                          handleConditionFieldChange(condition.id, e.target.value)
                        }
                        className="w-32 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      >
                        <option value="">请选择字段</option>
                        {FIELD_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {renderValueInput(condition)}
                      <button
                        onClick={() => handleRemoveCondition(condition.id)}
                        className="p-1.5 hover:bg-slate-100 rounded transition-colors shrink-0"
                        title="删除"
                      >
                        <Minus className="h-4 w-4 text-slate-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator className="my-2" />

            {/* 表格预览 */}
            <div className="flex flex-col min-h-[300px]">
              <div className="text-sm text-muted-foreground mb-2">
                共 {totalCount.toLocaleString()} 条问答对（支持预览10条）
              </div>
              <div className="border rounded-md overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto">
                <Table className="table-fixed w-full">
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-[8%]">序号</TableHead>
                      {hasSystem && (
                        <TableHead className="w-[18%]">System / 角色指令</TableHead>
                      )}
                      <TableHead className={hasSystem ? "w-[37%]" : "w-[46%]"}>
                        Input / 输入
                      </TableHead>
                      <TableHead className={hasSystem ? "w-[37%]" : "w-[46%]"}>
                        Output / 输出
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={hasSystem ? 4 : 3}
                          className="text-center text-sm text-slate-500 py-8"
                        >
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      previewData.map((item) => {
                        const isInputExpanded = getExpandedState(item.id, "input");
                        const isOutputExpanded = getExpandedState(item.id, "output");
                        
                        return (
                          <TableRow key={item.id}>
                            {/* 序号 */}
                            <TableCell className="text-sm">{item.id}</TableCell>

                            {/* System 列（仅当 hasSystem 为 true 时显示） */}
                            {hasSystem && (
                              <TableCell className="text-sm">
                                {item.system ? (
                                  <div className="max-h-20 overflow-hidden">
                                    <p className="line-clamp-2 text-slate-600 text-ellipsis break-words">
                                      {item.system}
                                    </p>
                                  </div>
                                ) : null}
                              </TableCell>
                            )}

                            {/* Input 列 - 显示对话流，支持展开/收起 */}
                            <TableCell className="text-sm">
                              <div className="space-y-1">
                                <div
                                  className={`${
                                    isInputExpanded
                                      ? "whitespace-pre-wrap"
                                      : "line-clamp-3"
                                  } text-xs`}
                                >
                                  {item.input.map((msg, idx) => {
                                    const isLastUser =
                                      idx === item.input.length - 1 &&
                                      msg.role === "user";
                                    return (
                                      <div
                                        key={idx}
                                        className={`${
                                          isLastUser
                                            ? "font-semibold text-slate-900"
                                            : "text-slate-600"
                                        } ${idx > 0 ? "mt-1" : ""}`}
                                      >
                                        <span
                                          className={
                                            msg.role === "user"
                                              ? "text-blue-600 font-bold"
                                              : "text-green-600 font-bold"
                                          }
                                        >
                                          {msg.role === "user" ? "User" : "Assistant"}
                                        </span>{" "}
                                        <span className="break-words">
                                          {msg.content}
                                        </span>
                                        {msg.imageUrl && (
                                          <div className="text-slate-500 mt-1">
                                            imageUrl: '{msg.imageUrl}'
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                {item.input.length > 0 && (
                                  <button
                                    onClick={() => toggleExpand(item.id, "input")}
                                    className="text-xs text-blue-500 hover:text-blue-600 hover:underline transition-colors"
                                  >
                                    {isInputExpanded ? "收起" : "展开"}
                                  </button>
                                )}
                              </div>
                            </TableCell>

                            {/* Output 列 - 支持展开/收起 */}
                            <TableCell className="text-sm">
                              {item.output ? (
                                <div className="space-y-1">
                                  <div
                                    className={`${
                                      isOutputExpanded
                                        ? "whitespace-pre-wrap"
                                        : "line-clamp-3"
                                    } text-slate-900 text-ellipsis break-words`}
                                  >
                                    {item.output}
                                  </div>
                                  <button
                                    onClick={() => toggleExpand(item.id, "output")}
                                    className="text-xs text-blue-500 hover:text-blue-600 hover:underline transition-colors"
                                  >
                                    {isOutputExpanded ? "收起" : "展开"}
                                  </button>
                                </div>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* 导出至数据目录时的三级级联菜单（放在表格预览之后） */}
          {exportMethod === "catalog" && (
            <div className="flex flex-col gap-4 mt-4">
              {/* 三级级联菜单选择器 */}
              <div className="space-y-2">
                <Label className="font-medium text-sm text-gray-700 mb-2 block">
                  <span className="text-red-500">*</span> 导出至
                </Label>
                <CascadingMenuSelector
                  selectedPath={selectedPath}
                  onSelect={handlePathSelect}
                  onCreateNew={handleCreateNewVolume}
                />
              </div>

              {/* 新建数据卷输入框（当选择新建时显示） */}
              {selectedPath?.volume === "new" && (
                <div className="space-y-2">
                  <Label className="font-medium text-sm text-gray-700 mb-2 block">
                    <span className="text-red-500">*</span> 新数据卷名称
                  </Label>
                  <Input
                    type="text"
                    value={newVolumeName}
                    onChange={(e) => setNewVolumeName(e.target.value)}
                    placeholder="请输入新数据卷名称"
                    className="w-full"
                  />
                </div>
              )}

              {/* 文件名称 */}
              {selectedPath && (selectedPath.volume !== "new" || newVolumeName) && (
                <div className="space-y-2">
                  <Label className="font-medium text-sm text-gray-700 mb-2 block">
                    <span className="text-red-500">*</span> 文件名称
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="请输入新建文件名"
                      className="flex-1"
                    />
                    <span className="text-sm text-slate-500 px-3 py-2 bg-slate-100 rounded-md border border-slate-200">
                      .jsonl
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          </div>
        </div>

        <DialogFooter className="p-6 pt-2 border-t bg-white">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={!canExport()}>
            导出
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

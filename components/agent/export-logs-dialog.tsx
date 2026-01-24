"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, ChevronDown, RefreshCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
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

interface FilterCondition {
  id: string;
  field: string;
  value: string;
}

import type { LogEntry } from "@/components/agent/logs-table";

interface ExportLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalCount?: number;
  filteredLogs?: LogEntry[];
  searchKeyword?: string;
  dateRange?: { start: string; end: string };
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

// Generate preview data from filtered logs
const generatePreviewData = (logs: LogEntry[], maxCount: number = 10) => {
  return logs.slice(0, maxCount).map((log, index) => ({
    id: index + 1,
    input: log.input,
    output: log.output,
  }));
};

export function ExportLogsDialog({
  open,
  onOpenChange,
  totalCount = 11234,
  filteredLogs = [],
  searchKeyword = "",
  dateRange,
}: ExportLogsDialogProps) {
  const [exportMethod, setExportMethod] = useState<"local" | "directory">("local");
  const [exportFormat, setExportFormat] = useState<"jsonl" | "csv" | "xlsx">("jsonl");
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [exportPath, setExportPath] = useState("");

  // Initialize conditions from props
  useEffect(() => {
    const initialConditions: FilterCondition[] = [];
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

  const previewData = generatePreviewData(filteredLogs, Math.min(10, totalCount));

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

  const renderValueInput = (condition: FilterCondition) => {
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
        <Select
          value={condition.value}
          onValueChange={(value) => handleConditionValueChange(condition.id, value)}
          options={options}
          placeholder="请选择"
          className="flex-1"
        />
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

  const handleExport = () => {
    // TODO: Implement export logic
    console.log("Exporting with:", {
      method: exportMethod,
      format: exportFormat,
      conditions,
      path: exportPath,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-none">
          <DialogTitle>导出</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4 flex-1 overflow-y-auto min-h-0">
          {/* 导出方式 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">导出方式 :</Label>
            <RadioGroup
              value={exportMethod}
              onValueChange={(value) => setExportMethod(value as "local" | "directory")}
              className="flex flex-row gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="local" id="local" />
                <Label htmlFor="local" className="cursor-pointer font-normal">
                  导出至本地
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="directory" id="directory" />
                <Label htmlFor="directory" className="cursor-pointer font-normal">
                  导出至数据目录
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* 筛选条件 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">筛选条件 :</Label>
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
                    <Select
                      value={condition.field}
                      onValueChange={(value) =>
                        handleConditionFieldChange(condition.id, value)
                      }
                      options={FIELD_OPTIONS}
                      placeholder="请选择字段"
                      className="w-32"
                    />
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

          {/* 数据预览 */}
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              共 {totalCount.toLocaleString()} 条问答对（支持预览10条）
            </div>
            <div className="border rounded-md overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-16">序号</TableHead>
                      <TableHead>输入/input</TableHead>
                      <TableHead>输出/output</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-sm text-slate-500 py-8">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      previewData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm">{item.id}</TableCell>
                          <TableCell className="text-sm">
                            <div className="max-h-20 overflow-hidden">
                              <p className="line-clamp-3 text-ellipsis break-words">{item.input}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="max-h-20 overflow-hidden">
                              <p className="line-clamp-3 text-ellipsis break-words">{item.output}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* 导出格式 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">导出格式 :</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(value) =>
                setExportFormat(value as "jsonl" | "csv" | "xlsx")
              }
              className="flex flex-row gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="jsonl" id="jsonl" />
                <Label htmlFor="jsonl" className="cursor-pointer font-normal">
                  jsonl
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="cursor-pointer font-normal">
                  csv
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx" className="cursor-pointer font-normal">
                  xlsx
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* 导出至数据目录时的路径输入 */}
          {exportMethod === "directory" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <span className="text-red-500">*</span>导出至 :
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    value={exportPath}
                    onChange={(e) => setExportPath(e.target.value)}
                    placeholder="请选择或输入搜索数据目录"
                    className="flex-1 pr-8"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                <button className="p-2 hover:bg-slate-100 rounded transition-colors">
                  <RefreshCcw className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-none mt-6 border-t border-slate-200 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleExport}>导出</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

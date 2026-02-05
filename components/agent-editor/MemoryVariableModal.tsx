"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import type { MemoryVariable } from "@/lib/types/agent";

interface MemoryVariableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variables: MemoryVariable[];
  onSave: (variables: MemoryVariable[]) => void;
}

export function MemoryVariableModal({
  open,
  onOpenChange,
  variables,
  onSave,
}: MemoryVariableModalProps) {
  const [localVariables, setLocalVariables] = useState<MemoryVariable[]>([]);

  useEffect(() => {
    if (open) {
      // 如果传入的变量为空，初始化一个空行
      setLocalVariables(
        variables.length > 0
          ? variables
          : [
              {
                id: Date.now().toString(),
                name: "",
                description: "",
                defaultValue: "",
                storageType: "user",
                required: false,
                showInFrontend: true,
              },
            ]
      );
    }
  }, [open, variables]);

  const handleAddVariable = () => {
    if (localVariables.length >= 20) return;
    setLocalVariables([
      ...localVariables,
      {
        id: Date.now().toString(),
        name: "",
        description: "",
        defaultValue: "",
        storageType: "user",
        required: false,
        showInFrontend: true,
      },
    ]);
  };

  const handleRemoveVariable = (id: string) => {
    setLocalVariables(localVariables.filter((v) => v.id !== id));
  };

  const handleVariableChange = (
    id: string,
    field: keyof MemoryVariable,
    value: string | boolean
  ) => {
    setLocalVariables(
      localVariables.map((v) =>
        v.id === id ? { ...v, [field]: value } : v
      )
    );
  };

  const handleSave = () => {
    // 过滤掉空行（名称为空的）
    const validVariables = localVariables.filter((v) => v.name.trim() !== "");
    onSave(validVariables);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[1400px] !w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-none">
          <DialogTitle>记忆变量</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Warning Banner */}
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
            <p className="text-sm text-orange-700">
              修改变量信息并更新发布，会导致应用用户已有的变量数据被删除或重置为默认值，请谨慎操作。
            </p>
          </div>

          {/* Table Header */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <div className="grid grid-cols-[1.1fr_1.6fr_1.2fr_140px_80px_100px_80px] gap-4 p-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-700">
              <div>变量名</div>
              <div>变量描述</div>
              <div>默认值</div>
              <div>存储维度</div>
              <div className="text-center">必填</div>
              <div className="text-center">前端展示</div>
              <div className="text-center">操作</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-200">
              {localVariables.map((variable) => (
                <div
                  key={variable.id}
                  className="grid grid-cols-[1.1fr_1.6fr_1.2fr_140px_80px_100px_80px] gap-4 p-3 items-center"
                >
                  {/* 变量名 */}
                  <Input
                    value={variable.name}
                    onChange={(e) =>
                      handleVariableChange(variable.id, "name", e.target.value)
                    }
                    placeholder="请输入变量"
                    className="h-8 text-sm w-full"
                  />

                  {/* 变量描述 */}
                  <Input
                    value={variable.description}
                    onChange={(e) =>
                      handleVariableChange(
                        variable.id,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="输入描述"
                    className="h-8 text-sm w-full"
                  />

                  {/* 默认值 */}
                  <Input
                    value={variable.defaultValue || ""}
                    onChange={(e) =>
                      handleVariableChange(
                        variable.id,
                        "defaultValue",
                        e.target.value
                      )
                    }
                    placeholder="请输入默认"
                    className="h-8 text-sm w-full"
                  />

                  {/* 存储维度 */}
                  <Select
                    value={variable.storageType}
                    onValueChange={(value) =>
                      handleVariableChange(
                        variable.id,
                        "storageType",
                        value as "user" | "session"
                      )
                    }
                    options={[
                      { value: "user", label: "用户" },
                      { value: "session", label: "会话" },
                    ]}
                    className="h-8 text-sm"
                  />

                  {/* 必填 */}
                  <div className="flex justify-center">
                    <Checkbox
                      checked={variable.required}
                      onCheckedChange={(checked) =>
                        handleVariableChange(
                          variable.id,
                          "required",
                          checked as boolean
                        )
                      }
                    />
                  </div>

                  {/* 前端展示 */}
                  <div className="flex justify-center">
                    <Checkbox
                      checked={variable.showInFrontend}
                      onCheckedChange={(checked) =>
                        handleVariableChange(
                          variable.id,
                          "showInFrontend",
                          checked as boolean
                        )
                      }
                    />
                  </div>

                  {/* 操作 */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleRemoveVariable(variable.id)}
                      className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAddVariable}
              disabled={localVariables.length >= 20}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              添加 ({localVariables.length}/20)
            </button>
          </div>
        </div>

        <DialogFooter className="flex-none mt-6 border-t border-slate-200 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleSave}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (projectId: string) => void;
}

export function CreateProjectDialog({
  open,
  onClose,
  onCreated,
}: CreateProjectDialogProps) {
  const { createProject, currentUserId } = useProjectConversation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("请填写 Project 名称");
      return;
    }
    const id = createProject({
      name: trimmed,
      description: description.trim() || undefined,
      ownerUserId: currentUserId,
    });
    if (!id) {
      setError("创建失败");
      return;
    }
    setName("");
    setDescription("");
    setError(null);
    onCreated(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white shadow-xl">
        <div className="border-b border-[#eef2f6] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-slate-900">
            新建 Project
          </h2>
          <p className="mt-1 text-[12px] text-[#5a6779]">
            Project 用于汇聚成员、工具、文件与事项；会话在 Project 下创建。
          </p>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-700">
              名称
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：订单增长专项"
              className="h-9 text-[13px]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-700">
              说明（可选）
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[72px] text-[13px]"
            />
          </div>
          {error ? <p className="text-[12px] text-red-600">{error}</p> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-[#eef2f6] px-5 py-3">
          <Button
            type="button"
            variant="ghost"
            className="h-9 text-[13px]"
            onClick={onClose}
          >
            取消
          </Button>
          <Button
            type="button"
            className="h-9 bg-[#2773ff] text-[13px] hover:bg-[#1f63e0]"
            onClick={handleSubmit}
          >
            创建
          </Button>
        </div>
      </div>
    </div>
  );
}

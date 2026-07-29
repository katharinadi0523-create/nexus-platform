"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProjectConversation } from "@/components/my-claw/project-conversation/project-conversation-provider";

interface CreateProjectIssueDialogProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (issueId: string) => void;
}

export function CreateProjectIssueDialog({
  projectId,
  open,
  onClose,
  onCreated,
}: CreateProjectIssueDialogProps) {
  const { currentUserId, createIssue } = useProjectConversation();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("请填写事项标题");
      return;
    }
    const id = createIssue({
      projectId,
      title: trimmed,
      summary: summary.trim() || undefined,
      humanAssigneeIds: [currentUserId],
      agentAssigneeIds: [],
    });
    if (!id) {
      setError("创建失败，请重试");
      return;
    }
    setTitle("");
    setSummary("");
    setError(null);
    onCreated(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white shadow-xl">
        <div className="border-b border-[#eef2f6] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-slate-900">新建事项</h2>
          <p className="mt-1 text-[12px] text-[#5a6779]">
            从看板创建的事项暂不绑定主会话，可稍后在会话中绑定。
          </p>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-700">
              标题
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：澄清导出字段范围"
              className="h-9 text-[13px]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-700">
              说明（可选）
            </label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="补充验收标准或背景"
              className="min-h-[80px] text-[13px]"
            />
          </div>
          {error ? (
            <p className="text-[12px] text-red-600">{error}</p>
          ) : null}
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
            <Plus className="h-3.5 w-3.5" />
            创建
          </Button>
        </div>
      </div>
    </div>
  );
}

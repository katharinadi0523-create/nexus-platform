"use client";

import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOCK_QA_LIBRARIES } from "@/components/agent/add-intervention-dialog";

interface SyncToQaLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 当前问答干预列表条数，仅用于提示文案 */
  pairCount: number;
}

export function SyncToQaLibraryDialog({
  open,
  onOpenChange,
  pairCount,
}: SyncToQaLibraryDialogProps) {
  const handleImport = (libraryName: string) => {
    // 具体导入动作暂不实现，仅反馈交互结果
    toast.success(
      `已将当前 ${pairCount} 条问答对同步至「${libraryName}」（原型占位）`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[860px]">
        <DialogHeader className="border-b border-slate-100 px-6 py-4">
          <DialogTitle className="text-base font-semibold text-slate-900">
            同步至问答库
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="mb-3 text-xs text-slate-500">
            将当前问答干预中的 {pairCount} 条问答对导入到目标问答库
          </div>
          <div className="max-h-[420px] overflow-auto rounded-md border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="min-w-[160px]">问答库名称</TableHead>
                  <TableHead className="min-w-[120px]">问答库ID</TableHead>
                  <TableHead className="w-[100px]">问答对数量</TableHead>
                  <TableHead className="w-[90px]">创建人</TableHead>
                  <TableHead className="min-w-[140px]">更新时间</TableHead>
                  <TableHead className="w-[140px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_QA_LIBRARIES.map((lib) => (
                  <TableRow key={lib.id}>
                    <TableCell className="font-medium text-slate-800">
                      {lib.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {lib.id}
                    </TableCell>
                    <TableCell>{lib.pairCount}</TableCell>
                    <TableCell>{lib.creator}</TableCell>
                    <TableCell className="text-slate-600">
                      {lib.updatedAt}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center justify-end gap-3">
                        <button
                          type="button"
                          className="text-sm text-[#2773ff] hover:underline"
                        >
                          查看
                        </button>
                        <button
                          type="button"
                          className="text-sm text-[#2773ff] hover:underline"
                          onClick={() => handleImport(lib.name)}
                        >
                          同步
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

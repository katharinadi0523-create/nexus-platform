"use client";

import { CirclePlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { WorkOrderStatusPill } from "./shared";
import type { SkillWorkOrder } from "./types";

interface WorkOrderListProps {
  workOrders: SkillWorkOrder[];
  onOpenWorkOrder: (workOrderId: string) => void;
}

export function WorkOrderList({ workOrders, onOpenWorkOrder }: WorkOrderListProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <Table className="min-w-[880px]">
        <TableHeader className="bg-slate-50">
          <TableRow className="hover:bg-slate-50">
            <TableHead className="h-10 px-4 text-xs font-semibold text-slate-600">工单号</TableHead>
            <TableHead className="h-10 px-4 text-xs font-semibold text-slate-600">类型</TableHead>
            <TableHead className="h-10 px-4 text-xs font-semibold text-slate-600">关联技能</TableHead>
            <TableHead className="h-10 px-4 text-xs font-semibold text-slate-600">来源</TableHead>
            <TableHead className="h-10 px-4 text-xs font-semibold text-slate-600">状态</TableHead>
            <TableHead className="h-10 px-4 text-xs font-semibold text-slate-600">产出版本</TableHead>
            <TableHead className="h-10 px-4 text-xs font-semibold text-slate-600">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workOrders.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="px-4 py-3 font-mono text-sm text-slate-800">{item.id}</TableCell>
              <TableCell className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium",
                    item.type === "create"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-violet-50 text-violet-700"
                  )}
                >
                  {item.type === "create" ? (
                    <CirclePlus className="h-3 w-3" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {item.type === "create" ? "创建" : "优化"}
                </span>
              </TableCell>
              <TableCell className="px-4 py-3 text-sm font-medium text-slate-800">
                {item.skillName}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-slate-500">对话</TableCell>
              <TableCell className="px-4 py-3">
                <WorkOrderStatusPill status={item.status} />
              </TableCell>
              <TableCell className="px-4 py-3 font-mono text-sm text-[#2773ff]">
                {item.outputVersion ?? "—"}
              </TableCell>
              <TableCell className="px-4 py-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-[#2773ff]"
                  onClick={() => onOpenWorkOrder(item.id)}
                >
                  查看
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {workOrders.length === 0 ? (
        <div className="border-t border-slate-100 px-6 py-14 text-center text-sm text-slate-500">
          暂无生成工单。
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { CheckCircle2, Clock3, Link2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ThirdPartyAgentDeregisterDialog({
  open,
  onOpenChange,
  agentName,
  referenceCount,
  pendingTaskIds,
  detailHref,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  referenceCount: number;
  pendingTaskIds: string[];
  detailHref?: string;
  onConfirm: () => void;
}) {
  const pendingTaskCount = pendingTaskIds.length;
  const blocked = referenceCount > 0 || pendingTaskCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[580px]">
        <DialogHeader>
          <DialogTitle>{blocked ? "注销前置检查未通过" : "确认注销平台登记？"}</DialogTitle>
          <DialogDescription className="pt-1 leading-6">
            {blocked
              ? `${agentName} 当前仍有未处理事项，暂不能注销。`
              : `确认从 AF 注销“${agentName}”的第三方 Agent 资产登记。`}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <DeregisterCheckRow
            icon={<Link2 className="h-4 w-4" />}
            label="资源引用关系"
            value={referenceCount > 0 ? `${referenceCount} 个未解除` : "已清零"}
            description={referenceCount > 0 ? "请先解除全部引用关系" : "当前没有资源引用该 Agent"}
            blocked={referenceCount > 0}
          />
          <DeregisterCheckRow
            icon={<Clock3 className="h-4 w-4" />}
            label="未结束异步任务"
            value={pendingTaskCount > 0 ? `${pendingTaskCount} 个处理中` : "已清零"}
            description={pendingTaskCount > 0 ? "请等待任务完成或在任务侧终止" : "当前没有未结束的异步任务"}
            blocked={pendingTaskCount > 0}
            detail={pendingTaskIds.length > 0 ? pendingTaskIds.join("、") : undefined}
          />
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>注销只移除 AF 中的平台登记，外部 Agent 程序、部署环境和运行状态不受影响。</span>
        </div>

        <DialogFooter>
          {blocked ? (
            <>
              {detailHref && referenceCount > 0 ? <Button variant="outline" asChild><Link href={detailHref}>查看引用关系</Link></Button> : null}
              <Button onClick={() => onOpenChange(false)} className="bg-blue-600 text-white hover:bg-blue-700">我知道了</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
              <Button onClick={onConfirm} className="bg-rose-600 text-white hover:bg-rose-700">确认注销</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeregisterCheckRow({
  icon,
  label,
  value,
  description,
  blocked,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  blocked: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-200 px-4 py-4 last:border-b-0">
      <div className={blocked ? "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600" : "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"}>
        {blocked ? icon : <CheckCircle2 className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-900">{label}</span>
          <span className={blocked ? "text-xs font-medium text-rose-700" : "text-xs font-medium text-emerald-700"}>{value}</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        {detail ? <p className="mt-1 break-all font-mono text-xs text-slate-400">{detail}</p> : null}
      </div>
    </div>
  );
}

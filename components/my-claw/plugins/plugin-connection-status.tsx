import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PluginRuntimeStatus } from "@/lib/mock/my-claw/plugins";

export type PluginConnectionStatusValue = "connected" | "failed" | "checking";

const STATUS_META: Record<PluginConnectionStatusValue, { label: string; className: string; dotClassName: string }> = {
  connected: { label: "连接正常", className: "text-emerald-700", dotClassName: "bg-emerald-500" },
  failed: { label: "连接失败", className: "text-red-700", dotClassName: "bg-red-500" },
  checking: { label: "正在检测", className: "text-blue-700", dotClassName: "bg-blue-500" },
};

export function PluginConnectionStatus({ status, className }: {
  status?: PluginConnectionStatusValue;
  className?: string;
}) {
  if (!status) return null;
  const meta = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-xs", meta.className, className)}>
      {status === "checking" ? <LoaderCircle className="size-3.5 animate-spin text-blue-600" /> : <span aria-hidden="true" className={cn("size-2 rounded-full", meta.dotClassName)} />}
      {meta.label}
    </span>
  );
}

export function PluginRuntimeStatus({ status = "normal", className }: {
  status?: PluginRuntimeStatus;
  className?: string;
}) {
  const isNormal = status === "normal";
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-xs", isNormal ? "text-emerald-700" : "text-red-700", className)}>
      <span aria-hidden="true" className={cn("size-2 rounded-full", isNormal ? "bg-emerald-500" : "bg-red-500")} />
      {isNormal ? "运行正常" : "运行异常"}
    </span>
  );
}

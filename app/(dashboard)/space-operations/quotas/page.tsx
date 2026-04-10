import { redirect } from "next/navigation";
import { spaceOperationsHref } from "@/lib/space-operations";

/** 旧路径 /space-operations/quotas → 运行配置 */
export default function SpaceOperationsQuotasRedirectPage() {
  redirect(spaceOperationsHref("run-config"));
}

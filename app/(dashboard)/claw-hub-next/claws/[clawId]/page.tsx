import { notFound } from "next/navigation";
import { ClawDetailWorkbench } from "@/components/claw-hub-next/claw-detail-workbench";
import {
  CLAW_SECURITY_LEVELS,
  createFallbackClawListItem,
  getClawDetail,
  type ClawSecurityLevel,
} from "@/lib/mock/claw-hub-next";

type ClawDetailSearchParams = Record<string, string | string[] | undefined>;

function getSearchParamValue(searchParams: ClawDetailSearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function getSecurityLevel(searchParams: ClawDetailSearchParams): ClawSecurityLevel | undefined {
  const value = getSearchParamValue(searchParams, "securityLevel");
  if (!value) return undefined;
  return CLAW_SECURITY_LEVELS.includes(value as ClawSecurityLevel)
    ? (value as ClawSecurityLevel)
    : undefined;
}

export default async function ClawHubNextDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clawId: string }>;
  searchParams: Promise<ClawDetailSearchParams>;
}) {
  const { clawId } = await params;
  const resolvedSearchParams = await searchParams;
  const fallbackListItem = clawId.startsWith("claw-")
    ? createFallbackClawListItem(clawId, {
        name: getSearchParamValue(resolvedSearchParams, "name"),
        creator: getSearchParamValue(resolvedSearchParams, "creator"),
        securityLevel: getSecurityLevel(resolvedSearchParams),
        model: getSearchParamValue(resolvedSearchParams, "model"),
        summary: getSearchParamValue(resolvedSearchParams, "summary"),
        updatedAt: getSearchParamValue(resolvedSearchParams, "updatedAt"),
        updatedBy: getSearchParamValue(resolvedSearchParams, "updatedBy"),
      })
    : undefined;
  const detail = getClawDetail(clawId, fallbackListItem);

  if (!detail) {
    notFound();
  }

  return <ClawDetailWorkbench detail={detail} />;
}

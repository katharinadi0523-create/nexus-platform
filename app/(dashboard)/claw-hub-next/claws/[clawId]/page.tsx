import { notFound } from "next/navigation";
import { ClawDetailWorkbench } from "@/components/claw-hub-next/claw-detail-workbench";
import { getClawDetail } from "@/lib/mock/claw-hub-next";

export default async function ClawHubNextDetailPage({
  params,
}: {
  params: Promise<{ clawId: string }>;
}) {
  const { clawId } = await params;
  const detail = getClawDetail(clawId);

  if (!detail) {
    notFound();
  }

  return <ClawDetailWorkbench detail={detail} />;
}

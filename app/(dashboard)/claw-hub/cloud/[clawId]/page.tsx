import { notFound } from "next/navigation";
import { ClawHubShell } from "@/components/claw-hub/claw-hub-shell";
import { CloudClawDetailView } from "@/components/claw-hub/cloud-claw-detail-view";
import { getCloudClawDetail } from "@/lib/mock/cloud-claw-hub";

export default async function CloudClawDetailPage({
  params,
}: {
  params: Promise<{ clawId: string }>;
}) {
  const { clawId } = await params;
  const detail = getCloudClawDetail(clawId);

  if (!detail) {
    notFound();
  }

  return (
    <ClawHubShell activeTab="cloud">
      <CloudClawDetailView key={detail.overview.id} detail={detail} />
    </ClawHubShell>
  );
}

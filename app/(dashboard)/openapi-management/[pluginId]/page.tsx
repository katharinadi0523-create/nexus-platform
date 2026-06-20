import { notFound } from "next/navigation";
import { OpenApiPluginDetailWorkbench } from "@/components/openapi-management/openapi-plugin-detail-workbench";
import { getOpenApiPlugin } from "@/lib/mock/openapi-plugins";

export default async function OpenApiPluginDetailPage({
  params,
}: {
  params: Promise<{ pluginId: string }>;
}) {
  const { pluginId } = await params;
  const plugin = getOpenApiPlugin(pluginId);

  if (!plugin) {
    notFound();
  }

  return <OpenApiPluginDetailWorkbench plugin={plugin} />;
}

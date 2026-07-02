import { notFound } from "next/navigation";
import { OpenApiToolEditWorkbench } from "@/components/openapi-management/openapi-tool-edit-workbench";
import { getOpenApiTool } from "@/lib/mock/openapi-plugins";

export default async function OpenApiToolEditPage({
  params,
}: {
  params: Promise<{ pluginId: string; toolId: string }>;
}) {
  const { pluginId, toolId } = await params;
  const result = getOpenApiTool(pluginId, toolId);

  if (!result) {
    notFound();
  }

  return <OpenApiToolEditWorkbench plugin={result.plugin} tool={result.tool} />;
}

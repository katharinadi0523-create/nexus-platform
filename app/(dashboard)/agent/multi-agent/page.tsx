import { redirect } from "next/navigation";

/**
 * 兼容旧入口：/agent/multi-agent → /multi-agent/create
 */
export default async function LegacyMultiAgentRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }> | { id?: string };
}) {
  const params = await Promise.resolve(searchParams);
  const id = params?.id?.trim();
  if (id) {
    redirect(`/multi-agent/create?id=${encodeURIComponent(id)}`);
  }
  redirect("/multi-agent/create");
}

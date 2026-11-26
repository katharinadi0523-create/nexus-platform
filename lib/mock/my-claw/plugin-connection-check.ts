import type { MinePluginItem, PluginConnectionStatus } from "./plugins";

export type PluginConnectionOutcome = Exclude<PluginConnectionStatus, "checking"> | "timeout";

/** Local-only health check simulation for the clickable product demo. */
export async function checkPluginConnection(plugin: MinePluginItem): Promise<PluginConnectionOutcome> {
  await new Promise((resolve) => window.setTimeout(resolve, 900));
  const endpoint = `${plugin.personalConfig?.pluginUrl ?? ""} ${plugin.personalConfig?.mcpJson ?? ""}`.toLowerCase();
  if (endpoint.includes("timeout")) return "timeout";
  if (endpoint.includes("offline") || endpoint.includes("unreachable") || endpoint.includes("connect-fail")) return "failed";
  return "connected";
}

export function currentLocalTime() {
  return new Date().toLocaleString("zh-CN", { hour12: false });
}

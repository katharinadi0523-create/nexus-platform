/** Relative time for fixed mock timestamps (no Date.now drift in SSR). */
export function formatRelativeTime(iso: string, now = "2026-07-27T02:00:00+08:00"): string {
  const diffMs = new Date(now).getTime() - new Date(iso).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "刚刚";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

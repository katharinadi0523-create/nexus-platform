/** Fixed "now" for stable relative-time labels in the prototype. */
export const ISSUE_BOARD_NOW = new Date("2026-07-27T18:00:00+08:00");

export function formatRelativeTime(
  iso: string,
  now: Date = ISSUE_BOARD_NOW
): string {
  const then = new Date(iso).getTime();
  const base = now.getTime();
  if (Number.isNaN(then)) return "—";

  const diffMs = base - then;
  const abs = Math.abs(diffMs);
  const minutes = Math.floor(abs / 60_000);
  const hours = Math.floor(abs / 3_600_000);
  const days = Math.floor(abs / 86_400_000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;

  return new Date(iso).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

"use client";

import type { ClarifyAutoResolutionProjection } from "@/lib/claw-clarify";
import { cn } from "@/lib/utils";

/**
 * 会话列表中的「等待确认」胶囊，只表达「这个会话在等你确认」，不可操作：
 * - 静默期 / 已暂停 / 不计时：浅蓝静态满底；
 * - 可见倒计时：蓝色填充从右向左收缩。
 * 暂停计时只能在会话内通过有效操作触发。
 */
export function ClarifyStatusCapsule({
  projection,
}: {
  projection: ClarifyAutoResolutionProjection;
}) {
  const counting = projection.phase === "visible_countdown";

  return (
    <span
      title="等待你的确认"
      className={cn(
        "relative inline-flex h-5 w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#d3e2fc] text-[11px] font-medium text-[#1f4fa3]",
      )}
    >
      {counting ? (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-full origin-left bg-[#8fb3f3] transition-transform duration-300 ease-linear motion-reduce:transition-none"
          style={{ transform: `scaleX(${projection.fillRatio})` }}
        />
      ) : null}
      <span className="relative">等待确认</span>
    </span>
  );
}

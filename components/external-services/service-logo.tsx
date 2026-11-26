import { cn } from "@/lib/utils";

export function ServiceLogo({ src, className }: { src: string; className?: string }) {
  return (
    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-1.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- ICO service marks are rendered as native browser assets. */}
      <img src={src} alt="" className="h-full w-full object-contain" />
    </span>
  );
}

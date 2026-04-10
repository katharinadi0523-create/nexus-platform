import { SPACE_DISPLAY_NAME } from "@/lib/space-operations";

export function SpaceOperationsHeader() {
  return (
    <section className="shrink-0 pb-2">
      <div className="min-w-0">
        <h1 className="truncate text-[30px] font-semibold tracking-[-0.02em] text-slate-950 sm:text-[36px]">
          {SPACE_DISPLAY_NAME}
        </h1>
      </div>
    </section>
  );
}

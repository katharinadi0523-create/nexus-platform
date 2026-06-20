import type { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const hasHeader = Boolean(title || description || action);

  return (
    <section className="space-y-5">
      {hasHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {title ? <div className="text-xl font-semibold text-slate-950">{title}</div> : null}
            {description ? <div className="mt-2 text-sm leading-7 text-slate-600">{description}</div> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

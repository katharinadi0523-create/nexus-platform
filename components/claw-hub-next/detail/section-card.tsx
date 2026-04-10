import type { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  const hasHeader = Boolean(title || description);

  return (
    <section className="space-y-5">
      {hasHeader ? (
        <div>
          {title ? <div className="text-xl font-semibold text-slate-950">{title}</div> : null}
          {description ? <div className="mt-2 text-sm leading-7 text-slate-600">{description}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

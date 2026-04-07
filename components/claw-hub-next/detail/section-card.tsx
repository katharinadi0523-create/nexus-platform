import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="gap-0 rounded-[28px] border-slate-200 bg-white py-0 shadow-sm">
      <CardContent className="space-y-5 p-6">
        <div>
          <div className="text-xl font-semibold text-slate-950">{title}</div>
          {description ? <div className="mt-2 text-sm leading-7 text-slate-600">{description}</div> : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

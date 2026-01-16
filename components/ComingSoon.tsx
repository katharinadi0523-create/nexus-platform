"use client";

import { Construction } from "lucide-react";

interface ComingSoonProps {
  title?: string;
}

export function ComingSoon({ title = "即将推出" }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
        <Construction className="w-12 h-12 text-blue-600" />
      </div>
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="text-muted-foreground text-center max-w-md">
        该功能正在开发中，敬请期待
      </p>
    </div>
  );
}

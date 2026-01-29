"use client";

import { useState } from "react";
import { Shield, ExternalLink } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";

interface ProtectionStatusBadgeProps {
  protectionTaskName: string;
  protectionTaskId: string;
  protectionTypes: ("policy" | "lexicon")[];
}

export function ProtectionStatusBadge({
  protectionTaskName,
  protectionTaskId,
  protectionTypes,
}: ProtectionStatusBadgeProps) {
  const typeLabels = {
    policy: "策略防护",
    lexicon: "词库防护",
  };

  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors border border-green-200"
        >
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">{protectionTaskName}生效中</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-4"
        align="end"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2">防护类型</p>
            <div className="flex flex-wrap gap-2">
              {protectionTypes.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-50 text-green-700 border border-green-200"
                >
                  {typeLabels[type]}
                </span>
              ))}
            </div>
          </div>
          <div className="pt-2 border-t">
            <Link
              href={`/security/protection-task/gf-protection?tab=info`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <span>查看防护任务详情</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

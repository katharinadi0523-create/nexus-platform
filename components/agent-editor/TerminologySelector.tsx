"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";

export interface Terminology {
  id: string;
  name: string;
}

interface TerminologySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (terminology: Terminology) => void;
}

const mockTerminologies: Terminology[] = [
  {
    id: "term-1",
    name: "北约军事术语集 2025",
  },
  {
    id: "term-2",
    name: "电子战缩略语表",
  },
];

export function TerminologySelector({
  open,
  onOpenChange,
  onSelect,
}: TerminologySelectorProps) {
  const handleSelect = (terminology: Terminology) => {
    onSelect(terminology);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-left">选择术语库</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {mockTerminologies.map((terminology) => (
            <button
              key={terminology.id}
              onClick={() => handleSelect(terminology)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-slate-900">
                {terminology.name}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

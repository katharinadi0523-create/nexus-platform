"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface CreateSynonymDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { standardTerm: string; synonyms: string[] }) => void;
}

export function CreateSynonymDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateSynonymDialogProps) {
  const [standardTerm, setStandardTerm] = useState("");
  const [synonymInput, setSynonymInput] = useState("");
  const [synonyms, setSynonyms] = useState<string[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && synonymInput.trim()) {
      e.preventDefault();
      if (!synonyms.includes(synonymInput.trim())) {
        setSynonyms([...synonyms, synonymInput.trim()]);
        setSynonymInput("");
      }
    }
  };

  const handleRemoveSynonym = (synonym: string) => {
    setSynonyms(synonyms.filter((s) => s !== synonym));
  };

  const handleSubmit = () => {
    if (standardTerm.trim()) {
      onSubmit({
        standardTerm: standardTerm.trim(),
        synonyms,
      });
      // Reset form
      setStandardTerm("");
      setSynonymInput("");
      setSynonyms([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建同义词</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Standard Term */}
          <div className="space-y-2">
            <Label htmlFor="standard-term">标准词</Label>
            <Input
              id="standard-term"
              value={standardTerm}
              onChange={(e) => setStandardTerm(e.target.value)}
              maxLength={80}
              placeholder="请输入标准词"
            />
            <div className="text-xs text-muted-foreground text-right">
              {standardTerm.length}/80
            </div>
          </div>

          {/* Synonyms */}
          <div className="space-y-2">
            <Label htmlFor="synonyms">同义词</Label>
            <div className="min-h-[80px] border rounded-md p-2 space-y-2">
              {synonyms.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {synonyms.map((synonym) => (
                    <Badge
                      key={synonym}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1"
                    >
                      {synonym}
                      <button
                        type="button"
                        onClick={() => handleRemoveSynonym(synonym)}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <Input
                id="synonyms"
                value={synonymInput}
                onChange={(e) => setSynonymInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入同义词后按 Enter 添加"
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!standardTerm.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

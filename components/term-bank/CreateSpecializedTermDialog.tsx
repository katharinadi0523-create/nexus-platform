"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CreateSpecializedTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { term: string; definition: string }) => void;
}

export function CreateSpecializedTermDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateSpecializedTermDialogProps) {
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");

  const handleSubmit = () => {
    if (term.trim()) {
      onSubmit({
        term: term.trim(),
        definition: definition.trim(),
      });
      // Reset form
      setTerm("");
      setDefinition("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建专有名词</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Term */}
          <div className="space-y-2">
            <Label htmlFor="term">专有名词</Label>
            <Input
              id="term"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              maxLength={80}
              placeholder="请输入专有名词"
            />
            <div className="text-xs text-muted-foreground text-right">
              {term.length}/80
            </div>
          </div>

          {/* Definition */}
          <div className="space-y-2">
            <Label htmlFor="definition">释义</Label>
            <Textarea
              id="definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="请输入释义"
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!term.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

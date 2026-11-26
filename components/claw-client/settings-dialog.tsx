"use client";

import { useRef, useState } from "react";
import { ClawClientSettingsPage, type SettingsSection } from "@/components/claw-client/settings-page";
import type { PersonalModelType } from "@/components/claw-client/personal-model-demo-store";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function ClawClientSettingsDialog({ open, onOpenChange, initialSection = "设定", initialModelView = "list", initialModelType = "chat", entryId = 0 }: { open: boolean; onOpenChange: (open: boolean) => void; initialSection?: SettingsSection; initialModelView?: "list" | "add"; initialModelType?: PersonalModelType; entryId?: number }) {
  const dirtyRef = useRef(false);
  const [closeRequest, setCloseRequest] = useState(0);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (nextOpen) {
        onOpenChange(true);
      } else if (dirtyRef.current) {
        setCloseRequest((current) => current + 1);
      } else {
        onOpenChange(false);
      }
    }}>
      <DialogContent className="h-[min(460px,88vh)] sm:max-w-[760px] overflow-hidden p-0" showCloseButton>
        <DialogTitle className="sr-only">设置</DialogTitle>
        {open ? <ClawClientSettingsPage key={entryId} initialSection={initialSection} initialModelView={initialModelView} initialModelType={initialModelType} closeRequest={closeRequest} onDirtyChange={(dirty) => { dirtyRef.current = dirty; }} onClose={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

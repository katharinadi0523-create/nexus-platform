"use client";

import { useRef, useState } from "react";
import { ClawClientSettingsPage } from "@/components/claw-client/settings-page";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function ClawClientSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
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
        {open ? <ClawClientSettingsPage closeRequest={closeRequest} onDirtyChange={(dirty) => { dirtyRef.current = dirty; }} onClose={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

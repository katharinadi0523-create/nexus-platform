"use client";

import { createContext, useContext } from "react";

export type PersonalChatAttachment = {
  id: string;
  name: string;
  source: "upload" | "workspace";
  path?: string;
  sizeLabel?: string;
  file?: File;
};

export type PersonalChatContextValue = {
  attachments: PersonalChatAttachment[];
  addAttachments: (items: PersonalChatAttachment[]) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
};

export const PersonalChatContext = createContext<PersonalChatContextValue | null>(null);

export function usePersonalChatContext() {
  return useContext(PersonalChatContext);
}

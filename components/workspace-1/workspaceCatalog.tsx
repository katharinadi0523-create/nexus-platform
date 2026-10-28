"use client";

import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useMyClaw } from "@/components/my-claw/provider";
import type { SkillFile } from "@/components/skillhub-v2/types";
import {
  createInitialSpaces,
  createSpaceId,
  validateSpaceName,
  type DriveSpace,
} from "./workspaceDriveData";

type SpaceDraft = {
  name: string;
  description: string;
};

export type SpacePrompt =
  | { mode: "create" }
  | { mode: "edit"; id: string }
  | { mode: "delete"; id: string };

export type WorkspaceCenterPane = 'new-chat' | 'workspace-files';

type WorkspaceCatalogValue = {
  spaces: DriveSpace[];
  activeId: string | null;
  activeSpace: DriveSpace | null;
  centerPane: WorkspaceCenterPane;
  rootEpoch: number;
  openNewChat: () => void;
  openHome: () => void;
  openSpace: (id: string) => void;
  updateFiles: (id: string, files: SkillFile[]) => void;
  createSpace: (draft: SpaceDraft) => string | null;
  updateSpace: (id: string, draft: SpaceDraft) => string | null;
  deleteSpace: (id: string) => string | null;
  prompt: SpacePrompt | null;
  askCreate: () => void;
  askEdit: (id: string) => void;
  askDelete: (id: string) => void;
  closePrompt: () => void;
  registerGuard: (guard: (action: () => void) => void) => void;
  runGuarded: (action: () => void) => void;
};

const WorkspaceCatalogContext = createContext<WorkspaceCatalogValue | null>(null);

export function WorkspaceCatalogProvider({ children }: { children: ReactNode }) {
  const { setActiveSession } = useMyClaw();
  const [spaces, setSpaces] = useState<DriveSpace[]>(() => createInitialSpaces());
  const [activeId, setActiveId] = useState<string | null>(
    () => createInitialSpaces().find((space) => space.isDefault)?.id ?? "space-default",
  );
  const [prompt, setPrompt] = useState<SpacePrompt | null>(null);
  const [rootEpoch, setRootEpoch] = useState(0);
  const [centerPane, setCenterPane] = useState<WorkspaceCenterPane>('new-chat');
  const guardRef = useRef<(action: () => void) => void>((action) => action());

  const value = useMemo<WorkspaceCatalogValue>(() => {
    const run = (action: () => void) => guardRef.current(action);
    return {
      spaces,
      activeId,
      activeSpace: spaces.find((space) => space.id === activeId) ?? null,
      centerPane,
      rootEpoch,
      openNewChat: () => {
        run(() => {
          setActiveSession(null);
          setCenterPane('new-chat');
        });
      },
      openHome: () => {
        const target = spaces.find((space) => space.isDefault) ?? spaces[0];
        if (!target) return;
        run(() => {
          setActiveSession(null);
          setActiveId(target.id);
          setCenterPane('workspace-files');
          setRootEpoch((current) => current + 1);
        });
      },
      openSpace: (id: string) => {
        if (!spaces.some((space) => space.id === id)) return;
        run(() => {
          setActiveSession(null);
          setActiveId(id);
          setCenterPane('workspace-files');
        });
      },
      updateFiles: (id: string, files: SkillFile[]) => {
        setSpaces((current) =>
          current.map((space) => (space.id === id ? { ...space, files } : space)),
        );
      },
      createSpace: (draft: SpaceDraft) => {
        const error = validateSpaceName(draft.name, spaces);
        if (error) return error;
        const description = draft.description.trim();
        setSpaces((current) => [
          ...current,
          {
            id: createSpaceId(),
            name: draft.name.trim(),
            description,
            isDefault: false,
            files: [],
            conversations: [],
          },
        ]);
        return null;
      },
      updateSpace: (id: string, draft: SpaceDraft) => {
        const error = validateSpaceName(draft.name, spaces, id);
        if (error) return error;
        const description = draft.description.trim();
        setSpaces((current) =>
          current.map((space) =>
            space.id === id ? { ...space, name: draft.name.trim(), description } : space,
          ),
        );
        return null;
      },
      deleteSpace: (id: string) => {
        const target = spaces.find((space) => space.id === id);
        if (!target) return "找不到这个空间";
        if (target.isDefault) return "默认空间不能删除";
        run(() => {
          setSpaces((current) => current.filter((space) => space.id !== id));
          setActiveId((current) => {
            if (current !== id) return current;
            const remaining = spaces.filter((space) => space.id !== id);
            return remaining.find((space) => space.isDefault)?.id ?? remaining[0]?.id ?? null;
          });
        });
        return null;
      },
      prompt,
      askCreate: () => setPrompt({ mode: "create" }),
      askEdit: (id: string) => setPrompt({ mode: "edit", id }),
      askDelete: (id: string) => {
        const target = spaces.find((space) => space.id === id);
        if (!target || target.isDefault) return;
        setPrompt({ mode: "delete", id });
      },
      closePrompt: () => setPrompt(null),
      registerGuard: (guard) => {
        guardRef.current = guard;
      },
      runGuarded: (action) => run(action),
    };
  }, [activeId, centerPane, prompt, rootEpoch, setActiveSession, spaces]);

  return <WorkspaceCatalogContext.Provider value={value}>{children}</WorkspaceCatalogContext.Provider>;
}

export function useWorkspaceCatalog() {
  return useContext(WorkspaceCatalogContext);
}

export const useOptionalWorkspaceCatalog = useWorkspaceCatalog;

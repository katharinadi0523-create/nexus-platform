"use client";

import { Folder, MoreHorizontal, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { summarizeSpaceFiles, type DriveSpace } from "./workspaceDriveData";
import "./workspaceDrive.css";

const CARD_TONES = ["#2773ff", "#0f8a5f", "#b86b1a", "#7a3e9d"];
const CARD_WASHES = ["#e8f0fb", "#e7f6ef", "#f8efe3", "#f3e8fb"];

export function WorkspaceHome({
  spaces,
  onOpen,
  onCreate,
  onRename,
  onDelete,
}: {
  spaces: DriveSpace[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="workspace-home">
      <div className="workspace-home__bar">
        <div>
          <h1 className="workspace-home__title">工作空间</h1>
          <p className="workspace-home__lead">先选一个空间。点进去之后再看里面的目录和文件。</p>
        </div>
        <button type="button" className="workspace-home__create" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          新建工作空间
        </button>
      </div>
      <div className="workspace-home__grid">
        {spaces.map((space, index) => {
          const summary = summarizeSpaceFiles(space.files);
          const tone = CARD_TONES[index % CARD_TONES.length];
          const wash = CARD_WASHES[index % CARD_WASHES.length];
          return (
            <article key={space.id} className="workspace-card">
              <button type="button" className="workspace-card__open" onClick={() => onOpen(space.id)}>
                <span className="workspace-card__mark" style={{ background: wash, color: tone }}>
                  <Folder className="h-5 w-5" />
                </span>
                <span className="workspace-card__name">
                  {space.name}
                  {space.isDefault ? <span className="workspace-card__badge">默认</span> : null}
                </span>
                <span className="workspace-card__desc">{space.description || "还没有介绍"}</span>
                <span className="workspace-card__meta">
                  {summary.fileCount} 个文件 · {summary.folderCount} 个文件夹
                </span>
              </button>
              <div className="workspace-card__menu">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="workspace-card__more" aria-label={`${space.name} 的操作`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onSelect={() => onRename(space.id)}>重命名</DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={space.isDefault}
                      onSelect={() => onDelete(space.id)}
                    >
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

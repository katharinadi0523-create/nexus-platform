"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  Copy,
  Download,
  FilePlus,
  FolderPlus,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Quote,
  Save,
  Scissors,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FileGlyph, getPreferredSkillFilePath, isRootSkillMarkdown } from "./shared";
import {
  isSkillFilePreviewable,
  isSkillFileTextEditable,
  SkillFilePreview,
} from "./skill-file-preview";
import {
  buildNestedFileTree,
  canMoveTo,
  canPasteTo,
  createFileEntry,
  createFolderEntry,
  deleteEntry,
  entryName,
  isFolderPlaceholder,
  joinPath,
  listFolderPaths,
  moveEntry,
  parentDir,
  isProtectedEntry,
  isWorkspaceMemoryFile,
  isWorkspaceTrashPath,
  pasteEntry,
  permanentDeleteEntry,
  realFiles,
  renameEntry,
  restoreTrashEntry,
  siblingNames,
  stampNow,
  trimFolderMark,
  uniqueName,
  validateEntryName,
  type NestedTreeNode,
} from "./skill-file-ops";
import type { SkillFile } from "./types";
import "@/components/workspace-1/workspaceDrive.css";
import { ClawTextSelectionMenu } from "@/components/workspace-1/ClawSelectionMenu";
import { useWorkspacePreviewQuote } from "@/components/workspace-1/useWorkspacePreviewQuote";
import { isWorkspaceHtmlFile } from "@/components/workspace-1/workspaceFileQuote";

export interface SkillFilesTabHandle {
  dirty: boolean;
  save: () => boolean;
  discard: () => void;
  /** 工作空间：定位到路径并打开预览 */
  revealPath: (path: string) => void;
  /** 工作空间：回到根目录列表，保留已打开的预览 tab */
  hidePreview: () => void;
  openTab: (path: string) => void;
  closeFileTab: (path: string) => void;
  toggleTree: () => void;
}

interface SkillFilesTabProps {
  files: SkillFile[];
  canEdit: boolean;
  onFilesChange: (files: SkillFile[]) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onEditingChange?: (editing: boolean) => void;
  onGuard?: (action: () => void) => void;
  initialEditing?: boolean;
  /** 为 false 时，根目录 SKILL.md 也可以重命名、删除和移动 */
  protectSkillMarkdown?: boolean;
  /** 撑满父级高度，用于工作空间整页 */
  fill?: boolean;
  /**
   * 工作空间：左侧目录树默认收起，主区是当前目录列表，
   * 打开文件后在右侧预览，关闭后回到列表。
   */
  workspaceLayout?: boolean;
  /** 工作空间文件视图里，目录根的面包屑名称 */
  workspaceRootLabel?: string;
  /** 从文件视图回到工作空间卡片页 */
  onLeaveWorkspace?: () => void;
  /** 引用工作空间文件；对话页 / 工作空间底栏插入输入框 */
  onQuoteFile?: (quote: { path: string; name: string; excerpt?: string }) => string | undefined;
  /** 底栏仍存在的引用/附件 id，用于同步预览区引用标记 */
  previewQuoteBindings?: string[];
  /** 预览标记与底栏片段的引用标号（1、2…） */
  previewQuoteNumbers?: Record<string, number>;
  /** 预览页提问；对话页侧栏用来发到当前会话 */
  /** 对话侧栏：只保留文件引用，不提供下拉操作 */
  quoteOnly?: boolean;
  /** 离开沉浸式全屏，回到对话 + 右侧空间 */
  onExitFullscreen?: () => void;
  fullscreen?: boolean;
  /** 对话侧栏：文件 tab 由外层顶栏渲染 */
  embedTabs?: boolean;
  onTabsChange?: (tabs: string[], activePath: string | null) => void;
  onTreeVisibleChange?: (visible: boolean) => void;
}

type Composer = {
  mode: "create-file" | "create-folder" | "rename";
  dir: string;
  targetPath?: string;
  isFolder?: boolean;
};

type TreeClipboard = {
  mode: "copy" | "cut";
  path: string;
  isFolder: boolean;
};

type FocusedEntry = {
  path: string;
  isFolder: boolean;
};

function firstEditableFilePath(files: SkillFile[]) {
  return files.find((file) => !file.path.endsWith("/"))?.path ?? "";
}

const EMPTY_PREVIEW_QUOTE_BINDINGS: string[] = [];
const EMPTY_PREVIEW_QUOTE_NUMBERS: Record<string, number> = {};

export const SkillFilesTab = forwardRef<SkillFilesTabHandle, SkillFilesTabProps>(
  function SkillFilesTab(
    {
      files,
      canEdit,
      onFilesChange,
      onDirtyChange,
      onEditingChange,
      onGuard,
      initialEditing = false,
      protectSkillMarkdown = true,
      fill = false,
      workspaceLayout = false,
      workspaceRootLabel,
      onLeaveWorkspace,
      onQuoteFile,
      previewQuoteBindings = EMPTY_PREVIEW_QUOTE_BINDINGS,
      previewQuoteNumbers = EMPTY_PREVIEW_QUOTE_NUMBERS,
      quoteOnly = false,
      onExitFullscreen,
      fullscreen = false,
      embedTabs = false,
      onTabsChange,
      onTreeVisibleChange,
    },
    ref
  ) {
    const preferredPath = (source: SkillFile[]) =>
      protectSkillMarkdown ? getPreferredSkillFilePath(source) : firstEditableFilePath(source);
    const [selectedPath, setSelectedPath] = useState(() =>
      workspaceLayout ? "" : preferredPath(files),
    );
    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
      if (workspaceLayout) return {};
      const next: Record<string, boolean> = {};
      listFolderPaths(files).forEach((path) => {
        next[path] = true;
      });
      return next;
    });
    const [treeVisible, setTreeVisible] = useState(false);
    const [currentDir, setCurrentDir] = useState("");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [openTabs, setOpenTabs] = useState<string[]>([]);
    const [editing, setEditing] = useState(initialEditing && canEdit);
    const [draftContent, setDraftContent] = useState("");
    const [composer, setComposer] = useState<Composer | null>(null);
    const [composerValue, setComposerValue] = useState("");
    const [composerError, setComposerError] = useState("");
    const [deleteTargets, setDeleteTargets] = useState<Array<{
      path: string;
      isFolder: boolean;
    }> | null>(null);
    const [picked, setPicked] = useState<Array<{ path: string; isFolder: boolean }>>([]);
    const [fileQuery, setFileQuery] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const composerRef = useRef<HTMLInputElement>(null);
    const previewRootRef = useRef<HTMLDivElement>(null);
    const composerLockRef = useRef(false);
    const blankMenuRef = useRef<HTMLDivElement | null>(null);
    const [blankMenu, setBlankMenu] = useState<{ x: number; y: number } | null>(null);
    const [dragItem, setDragItem] = useState<{ path: string; isFolder: boolean } | null>(null);
    const [dropDir, setDropDir] = useState<string | null>(null);
    const [clipboard, setClipboard] = useState<TreeClipboard | null>(null);
    const [focusedEntry, setFocusedEntry] = useState<FocusedEntry | null>(() => {
      const path = preferredPath(files);
      return path ? { path, isFolder: false } : null;
    });

    const tree = useMemo(
      () => buildNestedFileTree(files, protectSkillMarkdown),
      [files, protectSkillMarkdown],
    );
    const workspaceTree = useMemo(
      () =>
        workspaceLayout
          ? tree.filter((node) => !isWorkspaceTrashPath(node.path))
          : tree,
      [tree, workspaceLayout],
    );
    const directoryEntries = useMemo(() => {
      const dir = trimFolderMark(currentDir);
      const source = dir ? tree : workspaceTree;
      if (!dir) return source;
      const stack = [...tree];
      while (stack.length > 0) {
        const node = stack.shift();
        if (!node || node.type !== "folder") continue;
        if (node.path === dir) return node.children;
        stack.push(...node.children);
      }
      return [];
    }, [currentDir, tree, workspaceTree]);
    const selectedFile = realFiles(files).find((file) => file.path === selectedPath);
    const textEditable = Boolean(selectedFile && isSkillFileTextEditable(selectedFile.path));
    const viewOnly = Boolean(
      selectedFile && isSkillFilePreviewable(selectedFile.path) && !textEditable,
    );
    const dirty = editing && textEditable && (selectedFile?.content ?? "") !== draftContent;

    useEffect(() => {
      onDirtyChange?.(dirty);
    }, [dirty, onDirtyChange]);

    useEffect(() => {
      onEditingChange?.(editing && textEditable);
    }, [editing, textEditable, onEditingChange]);

    useEffect(() => {
      if (!fullscreen) return;
      setTreeVisible(false);
      if (selectedPath) setPreviewOpen(true);
    }, [fullscreen, selectedPath]);

    useEffect(() => {
      if (!embedTabs || !previewOpen) return;
      setTreeVisible(false);
    }, [embedTabs, previewOpen]);

    useEffect(() => {
      if (composer) {
        composerRef.current?.focus();
        composerRef.current?.select();
      }
    }, [composer]);

    useEffect(() => {
      setPicked([]);
      setFileQuery("");
    }, [currentDir]);

    useEffect(() => {
      if (workspaceLayout) return;
      if (!selectedFile && files.length) {
        setSelectedPath(preferredPath(files));
        setEditing(false);
      }
    }, [files, selectedFile, protectSkillMarkdown, workspaceLayout]);

    useEffect(() => {
      if (!canEdit) return;
      const onKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        if (!target?.closest("[data-skill-files]")) return;
        if (target.closest("input, textarea, [contenteditable='true']")) return;
        const meta = event.metaKey || event.ctrlKey;
        if (quoteOnly) {
          if (event.key === "Escape" && picked.length) {
            event.preventDefault();
            setPicked([]);
          }
          return;
        }
        if (event.key === "Escape") {
          if (target.closest("[data-radix-menu-content]")) return;
          if (picked.length) {
            event.preventDefault();
            setPicked([]);
            return;
          }
          if (clipboard?.mode === "cut") {
            event.preventDefault();
            setClipboard(null);
            toast.success("已取消剪切");
          }
          return;
        }
        if (!meta) return;
        const key = event.key.toLowerCase();
        if (key === "c") {
          if (workspaceLayout || !focusedEntry) return;
          event.preventDefault();
          handleCopy(focusedEntry.path, focusedEntry.isFolder);
        } else if (key === "x") {
          if (!focusedEntry) return;
          event.preventDefault();
          handleCut(focusedEntry.path, focusedEntry.isFolder);
        } else if (key === "v") {
          if (!clipboard) return;
          event.preventDefault();
          handlePaste(pasteTargetDir(focusedEntry));
        }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    });

    function openEditor(path = selectedPath) {
      const file = realFiles(files).find((item) => item.path === path);
      if (!file || !canEdit || !isSkillFileTextEditable(file.path)) return;
      setSelectedPath(path);
      setDraftContent(file.content);
      setEditing(true);
    }

    function saveEditor() {
      if (!selectedFile) return false;
      onFilesChange(
        files.map((file) =>
          file.path === selectedFile.path
            ? {
                ...file,
                content: draftContent,
                change: "modified",
                sizeLabel: formatByteSize(draftContent.length),
                updatedAt: stampNow(),
              }
            : file
        )
      );
      setEditing(false);
      toast.success("已保存文件");
      return true;
    }

    function discardEditor() {
      setDraftContent(selectedFile?.content ?? "");
      setEditing(false);
    }

    function runGuarded(action: () => void) {
      if (dirty && onGuard) {
        onGuard(action);
        return;
      }
      action();
    }

    function rememberTab(path: string) {
      if (!workspaceLayout) return;
      setOpenTabs((current) => (current.includes(path) ? current : [...current, path]));
    }

    const revealPath = useCallback(
      (path: string) => {
        const dir = parentDir(path);
        const apply = () => {
          expandDirectoryChain(dir);
          setCurrentDir(dir);
          setFocusedEntry({ path, isFolder: false });
          if (isSkillFilePreviewable(path)) {
            setSelectedPath(path);
            setPreviewOpen(true);
            setTreeVisible(!embedTabs);
            onTreeVisibleChange?.(!embedTabs);
            setEditing(false);
            rememberTab(path);
          } else {
            setSelectedPath(path);
            setPreviewOpen(false);
            setEditing(false);
            toast.error("不支持该文件的预览");
          }
        };
        runGuarded(apply);
      },
      [dirty, embedTabs, onGuard, workspaceLayout],
    );

    const hidePreview = useCallback(() => {
      runGuarded(() => {
        setCurrentDir("");
        setPreviewOpen(false);
        setEditing(false);
      });
    }, [dirty, onGuard]);

    function toggleTree() {
      const next = !treeVisible;
      setTreeVisible(next);
      onTreeVisibleChange?.(next);
    }

    useEffect(() => {
      onTabsChange?.(openTabs, previewOpen && selectedPath ? selectedPath : null);
    }, [openTabs, previewOpen, selectedPath, onTabsChange]);

    useEffect(() => {
      onTreeVisibleChange?.(treeVisible);
    }, [treeVisible, onTreeVisibleChange]);

    function selectFile(path: string) {
      if (!isSkillFilePreviewable(path)) {
        toast.error("不支持该文件的预览");
        setFocusedEntry({ path, isFolder: false });
        return;
      }
      setFocusedEntry({ path, isFolder: false });
      if (workspaceLayout) {
        expandDirectoryChain(parentDir(path));
        setCurrentDir(parentDir(path));
        setPreviewOpen(true);
        setTreeVisible(!embedTabs);
        onTreeVisibleChange?.(!embedTabs);
        rememberTab(path);
      }
      if (path === selectedPath) return;
      runGuarded(() => {
        setSelectedPath(path);
        setEditing(false);
      });
    }

    function toggleFolder(path: string) {
      setFocusedEntry({ path, isFolder: true });
      if (path) {
        setExpanded((current) => ({
          ...current,
          [path]: workspaceLayout ? current[path] !== true : !current[path],
        }));
      }
      if (workspaceLayout) {
        setCurrentDir(path);
      }
    }

    function openDirectory(dir: string) {
      runGuarded(() => {
        setCurrentDir(dir);
        setPreviewOpen(false);
        setEditing(false);
        if (dir) {
          setExpanded((current) => ({ ...current, [dir]: true }));
        }
      });
    }

    function closePreview() {
      runGuarded(() => {
        setPreviewOpen(false);
        setEditing(false);
        setOpenTabs([]);
      });
    }

    function closeFileTab(path: string) {
      runGuarded(() => {
        setOpenTabs((current) => {
          const next = current.filter((item) => item !== path);
          if (path === selectedPath) {
            const index = current.indexOf(path);
            const fallback = next[Math.min(index, Math.max(0, next.length - 1))] ?? "";
            if (fallback) {
              setSelectedPath(fallback);
              setPreviewOpen(true);
            } else {
              setPreviewOpen(false);
            }
          }
          return next;
        });
        setEditing(false);
      });
    }

    useImperativeHandle(
      ref,
      () => ({
        dirty,
        save: saveEditor,
        discard: discardEditor,
        revealPath,
        hidePreview,
        openTab: selectFile,
        closeFileTab,
        toggleTree,
      }),
      [dirty, revealPath, hidePreview, selectedFile, draftContent, files, openTabs, selectedPath, treeVisible],
    );

    function expandDirectoryChain(dir: string) {
      if (!dir) return;
      setExpanded((current) => {
        const next = { ...current };
        const parts = dir.split("/").filter(Boolean);
        for (let index = 1; index <= parts.length; index += 1) {
          next[parts.slice(0, index).join("/")] = true;
        }
        return next;
      });
    }

    function startCreate(mode: "create-file" | "create-folder", dir: string) {
      if (!canEdit) return;
      composerLockRef.current = false;
      expandDirectoryChain(dir);
      if (workspaceLayout) {
        setCurrentDir(dir);
        setPreviewOpen(false);
        setEditing(false);
      }
      setComposer({
        mode,
        dir,
      });
      setComposerValue(mode === "create-file" ? "新建文件.md" : "新建文件夹");
      setComposerError("");
    }

    function entryLocked(path: string, isFolder: boolean) {
      return isProtectedEntry(path, isFolder, protectSkillMarkdown, workspaceLayout);
    }

    function lockedActionToast(path: string, action: string) {
      toast.error(`${isWorkspaceMemoryFile(path) ? "memory.md" : "SKILL.md"} 不可${action}`);
    }

    function reservedRootNameError(dir: string, name: string, ignorePath?: string) {
      if (!workspaceLayout || dir || name.toLowerCase() !== "memory.md") return "";
      if (ignorePath && isWorkspaceMemoryFile(ignorePath)) return "";
      return "memory.md 为系统文件，不可占用该名称";
    }

    function startRename(path: string, isFolder: boolean) {
      if (!canEdit) return;
      if (entryLocked(path, isFolder)) {
        lockedActionToast(path, "重命名");
        return;
      }
      composerLockRef.current = false;
      expandDirectoryChain(parentDir(path));
      setComposer({
        mode: "rename",
        dir: parentDir(path),
        targetPath: path,
        isFolder,
      });
      setComposerValue(entryName(path));
      setComposerError("");
    }

    function commitComposer() {
      if (!composer || composerLockRef.current) return;
      const taken = siblingNames(
        files,
        composer.dir,
        composer.mode === "rename" ? composer.targetPath : undefined
      );
      const reserved = reservedRootNameError(
        composer.dir,
        composerValue.trim(),
        composer.mode === "rename" ? composer.targetPath : undefined,
      );
      const error = reserved || validateEntryName(
        composerValue,
        taken,
        composer.mode === "rename" ? entryName(composer.targetPath ?? "") : undefined
      );
      if (error) {
        setComposerError(error);
        return;
      }
      composerLockRef.current = true;
      const name = composerValue.trim();
      if (composer.mode === "create-file") {
        const apply = () => {
          const next = createFileEntry(files, composer.dir, name);
          const path = joinPath(composer.dir, name);
          onFilesChange(next);
          setComposer(null);
          if (workspaceLayout) {
            setCurrentDir(composer.dir);
            setPreviewOpen(false);
            setEditing(false);
          } else if (path) {
            setSelectedPath(path);
            if (isSkillFileTextEditable(path)) {
              setDraftContent("");
              setEditing(true);
            } else {
              setEditing(false);
            }
          }
          toast.success(
            path && !isSkillFileTextEditable(path)
              ? `已新建文件 ${name}，该类型不支持在线编辑`
              : `已新建文件 ${name}`
          );
        };
        runGuarded(apply);
        return;
      }
      if (composer.mode === "create-folder") {
        onFilesChange(createFolderEntry(files, composer.dir, name));
        setComposer(null);
        const folderPath = composer.dir ? `${composer.dir}/${name}` : name;
        setExpanded((current) => ({ ...current, [folderPath]: true }));
        toast.success(`已新建文件夹 ${name}`);
        return;
      }
      if (composer.targetPath) {
        if (entryLocked(composer.targetPath, Boolean(composer.isFolder))) {
          setComposer(null);
          lockedActionToast(composer.targetPath, "重命名");
          return;
        }
        const next = renameEntry(
          files,
          composer.targetPath,
          name,
          Boolean(composer.isFolder),
          protectSkillMarkdown,
          workspaceLayout,
        );
        onFilesChange(next);
        if (!composer.isFolder && selectedPath === composer.targetPath) {
          const nextPath = next.find(
            (file) => !isFolderPlaceholder(file.path) && entryName(file.path) === name
          )?.path;
          if (nextPath) {
            setSelectedPath(nextPath);
            if (!isSkillFileTextEditable(nextPath)) {
              setEditing(false);
              toast.info("该文件类型不支持在线编辑");
            }
          }
        }
        setComposer(null);
        toast.success("已重命名");
      }
    }

    function confirmDelete() {
      if (!deleteTargets?.length) return;
      const removable = deleteTargets.filter((item) => !entryLocked(item.path, item.isFolder));
      if (!removable.length) {
        setDeleteTargets(null);
        lockedActionToast(deleteTargets[0]?.path ?? "", "删除");
        return;
      }
      let next = files;
      for (const item of removable) {
        next = deleteEntry(next, item.path, item.isFolder);
      }
      onFilesChange(next);
      if (workspaceLayout) {
        if (removable.some((item) => !item.isFolder && selectedPath === item.path)) {
          setSelectedPath("");
          setPreviewOpen(false);
          setEditing(false);
        }
        const folderHits = removable.filter((item) => item.isFolder).map((item) => trimFolderMark(item.path));
        if (folderHits.some((from) => currentDir === from || currentDir.startsWith(`${from}/`))) {
          setCurrentDir("");
        }
        if (folderHits.some((from) => selectedPath === from || selectedPath.startsWith(`${from}/`))) {
          setSelectedPath("");
          setPreviewOpen(false);
          setEditing(false);
        }
      } else {
        const hitFile = removable.some((item) => !item.isFolder && selectedPath === item.path);
        const hitFolder = removable.some(
          (item) =>
            item.isFolder &&
            (selectedPath === item.path || selectedPath.startsWith(`${trimFolderMark(item.path)}/`)),
        );
        if (hitFile || hitFolder) {
          setSelectedPath(preferredPath(next));
          setEditing(false);
        }
      }
      setDeleteTargets(null);
      setPicked([]);
      if (
        clipboard &&
        removable.some(
          (item) =>
            clipboard.path === item.path ||
            (item.isFolder && clipboard.path.startsWith(`${trimFolderMark(item.path)}/`)),
        )
      ) {
        setClipboard(null);
      }
      toast.success(removable.length === 1
        ? removable[0].isFolder ? "已删除文件夹" : "已删除文件"
        : `已删除 ${removable.length} 项`);
    }

    function handleMove(path: string, targetDir: string, isFolder: boolean) {
      if (entryLocked(path, isFolder)) {
        lockedActionToast(path, "移动");
        return;
      }
      if (!canMoveTo(path, targetDir, isFolder, protectSkillMarkdown, workspaceLayout)) {
        if (isFolder && (targetDir === trimFolderMark(path) || targetDir.startsWith(`${trimFolderMark(path)}/`))) {
          toast.error("不能移动到自身或子文件夹");
        }
        return;
      }
      const taken = siblingNames(files, targetDir);
      if (taken.has(entryName(path).toLowerCase())) {
        toast.error("目标位置已有同名项");
        return;
      }
      const next = moveEntry(files, path, targetDir, isFolder, protectSkillMarkdown, workspaceLayout);
      onFilesChange(next);
      if (isFolder) {
        const from = trimFolderMark(path);
        const nextFolder = targetDir ? `${targetDir}/${entryName(path)}` : entryName(path);
        if (selectedPath === from || selectedPath.startsWith(`${from}/`)) {
          setSelectedPath(`${nextFolder}${selectedPath.slice(from.length)}`);
        }
      } else if (selectedPath === path) {
        const moved = next.find(
          (file) =>
            !isFolderPlaceholder(file.path) &&
            entryName(file.path) === entryName(path) &&
            parentDir(file.path) === targetDir
        );
        if (moved) setSelectedPath(moved.path);
      }
      if (targetDir) {
        setExpanded((current) => ({ ...current, [targetDir]: true }));
      }
      toast.success("已移动");
    }

    function finishDrag(targetDir: string | null) {
      if (dragItem && targetDir !== null) {
        handleMove(dragItem.path, targetDir, dragItem.isFolder);
      }
      setDragItem(null);
      setDropDir(null);
    }

    function handleQuote(path: string) {
      const name = entryName(path);
      onQuoteFile?.({ path, name });
      toast.success(`已引用 ${name}`);
    }

    function handleBatchQuote() {
      const filesOnly = picked.filter((item) => !item.isFolder);
      const hasFolder = picked.some((item) => item.isFolder);
      if (hasFolder && filesOnly.length) {
        toast.error("同时选中文件和文件夹时不支持引用");
        return;
      }
      if (!filesOnly.length) {
        toast.error("请选择文件后再引用");
        return;
      }
      for (const item of filesOnly) {
        onQuoteFile?.({ path: item.path, name: entryName(item.path) });
      }
      const names = filesOnly.map((item) => entryName(item.path));
      toast.success(names.length === 1 ? `已引用 ${names[0]}` : `已引用 ${names.length} 个文件`);
      setPicked([]);
    }

    function togglePick(path: string, isFolder: boolean) {
      setPicked((current) => {
        const exists = current.some((item) => item.path === path && item.isFolder === isFolder);
        return exists
          ? current.filter((item) => !(item.path === path && item.isFolder === isFolder))
          : [...current, { path, isFolder }];
      });
    }

    function togglePickAll() {
      const entries = visibleEntries.map((entry) => ({
        path: entry.path,
        isFolder: entry.type === "folder",
      }));
      const allOn =
        entries.length > 0 &&
        entries.every((entry) =>
          picked.some((item) => item.path === entry.path && item.isFolder === entry.isFolder),
        );
      setPicked(allOn ? [] : entries);
    }

    function downloadFileAtPath(path: string) {
      const file = files.find((item) => item.path === path);
      if (!file || isFolderPlaceholder(file.path)) return false;
      triggerBrowserDownload(entryName(path), file.content);
      return true;
    }

    function filesInsideFolder(folderPath: string) {
      const prefix = `${trimFolderMark(folderPath)}/`;
      return files.filter(
        (file) => !isFolderPlaceholder(file.path) && file.path.startsWith(prefix),
      );
    }

    function collectDownloadPaths(targets: Array<{ path: string; isFolder: boolean }>) {
      const seen = new Set<string>();
      const paths: string[] = [];
      for (const item of targets) {
        if (item.isFolder) {
          for (const file of filesInsideFolder(item.path)) {
            if (seen.has(file.path)) continue;
            seen.add(file.path);
            paths.push(file.path);
          }
          continue;
        }
        if (seen.has(item.path)) continue;
        seen.add(item.path);
        paths.push(item.path);
      }
      return paths;
    }

    function handleDownload(path: string, isFolder: boolean) {
      const paths = collectDownloadPaths([{ path, isFolder }]);
      if (!paths.length) {
        toast.error(isFolder ? "文件夹是空的" : "找不到文件");
        return;
      }
      let count = 0;
      for (const item of paths) {
        if (downloadFileAtPath(item)) count += 1;
      }
      if (!count) {
        toast.error("没有可下载的文件");
        return;
      }
      toast.success(
        isFolder
          ? `已开始下载「${entryName(path)}」中的 ${count} 个文件`
          : `已开始下载 ${entryName(path)}`,
      );
    }

    function handleBatchDownload() {
      const paths = collectDownloadPaths(picked);
      if (!paths.length) {
        toast.error("没有可下载的文件");
        return;
      }
      let count = 0;
      for (const path of paths) {
        if (downloadFileAtPath(path)) count += 1;
      }
      if (!count) {
        toast.error("没有可下载的文件");
        return;
      }
      toast.success(count === 1 ? `已开始下载 ${entryName(paths[0])}` : `已开始下载 ${count} 个文件`);
      setPicked([]);
    }

    async function readUploadContent(file: File) {
      const textLike =
        /\.(md|txt|csv|json|ts|tsx|js|jsx|css|html|xml|yml|yaml)$/i.test(file.name) ||
        /text|json|xml|markdown|csv/i.test(file.type);
      if (file.size > 0 && file.size < 200_000 && textLike) {
        try {
          return await file.text();
        } catch {
          return "";
        }
      }
      return file.size ? `（已上传 ${file.name}）` : "";
    }

    async function ingestUploads(list: FileList, folderMode: boolean) {
      const incoming = Array.from(list);
      if (!incoming.length) return;
      let next = files;
      if (!folderMode) {
        const taken = siblingNames(next, currentDir);
        for (const file of incoming) {
          const name = uniqueName(file.name, taken);
          taken.add(name.toLowerCase());
          const content = await readUploadContent(file);
          next = createFileEntry(next, currentDir, name);
          const path = joinPath(currentDir, name);
          next = next.map((item) => (item.path === path ? { ...item, content } : item));
        }
        onFilesChange(next);
        toast.success(incoming.length === 1 ? `已上传 ${incoming[0].name}` : `已上传 ${incoming.length} 个文件`);
        return;
      }
      const rootName = incoming[0]?.webkitRelativePath.split("/")[0] || "未命名文件夹";
      const taken = siblingNames(next, currentDir);
      const folderName = uniqueName(rootName, taken);
      next = createFolderEntry(next, currentDir, folderName);
      for (const file of incoming) {
        const rel = file.webkitRelativePath || file.name;
        const parts = rel.split("/").filter(Boolean);
        if (!parts.length) continue;
        parts[0] = folderName;
        const fileName = parts.pop();
        if (!fileName) continue;
        let dir = currentDir;
        for (const part of parts) {
          next = createFolderEntry(next, dir, part);
          dir = joinPath(dir, part);
        }
        const localTaken = siblingNames(next, dir);
        const name = uniqueName(fileName, localTaken);
        const content = await readUploadContent(file);
        next = createFileEntry(next, dir, name);
        const path = joinPath(dir, name);
        next = next.map((item) => (item.path === path ? { ...item, content } : item));
      }
      onFilesChange(next);
      toast.success(`已上传目录 ${folderName}`);
    }

    function handleCopy(path: string, isFolder: boolean) {
      if (!canEdit) return;
      if (workspaceLayout && isWorkspaceMemoryFile(path) && !isFolder) {
        lockedActionToast(path, "复制");
        return;
      }
      setClipboard({ mode: "copy", path, isFolder });
      setFocusedEntry({ path, isFolder });
      toast.success(isFolder ? "已复制文件夹" : "已复制文件");
    }

    function handleCut(path: string, isFolder: boolean) {
      if (!canEdit) return;
      if (entryLocked(path, isFolder)) {
        lockedActionToast(path, "剪切");
        return;
      }
      setClipboard({ mode: "cut", path, isFolder });
      setFocusedEntry({ path, isFolder });
      toast.success(isFolder ? "已剪切文件夹" : "已剪切文件");
    }

    function pasteTargetDir(entry: FocusedEntry | null) {
      if (!entry) return "";
      return entry.isFolder ? entry.path : parentDir(entry.path);
    }

    function handlePaste(targetDir: string) {
      if (!canEdit || !clipboard) return;
      if (
        !canPasteTo(
          clipboard.path,
          targetDir,
          clipboard.isFolder,
          clipboard.mode,
          protectSkillMarkdown,
          workspaceLayout,
        )
      ) {
        if (workspaceLayout && isWorkspaceMemoryFile(clipboard.path) && !clipboard.isFolder) {
          lockedActionToast(clipboard.path, clipboard.mode === "cut" ? "剪切" : "复制");
          return;
        }
        toast.error(
          clipboard.mode === "cut" && parentDir(clipboard.path) === targetDir
            ? "已在当前位置"
            : "不能粘贴到自身或子文件夹"
        );
        return;
      }
      const apply = () => {
        const result = pasteEntry(
          files,
          clipboard.path,
          clipboard.isFolder,
          targetDir,
          clipboard.mode,
          protectSkillMarkdown,
          workspaceLayout,
        );
        if (!result) {
          toast.error("剪贴板内容已失效");
          setClipboard(null);
          return;
        }
        onFilesChange(result.files);
        if (targetDir) {
          setExpanded((current) => ({ ...current, [targetDir]: true }));
        }
        if (clipboard.isFolder) {
          setExpanded((current) => ({ ...current, [result.pastedPath]: true }));
          setFocusedEntry({ path: result.pastedPath, isFolder: true });
        } else {
          setSelectedPath(result.pastedPath);
          setFocusedEntry({ path: result.pastedPath, isFolder: false });
          setEditing(false);
          if (workspaceLayout) setPreviewOpen(true);
        }
        if (workspaceLayout) setCurrentDir(targetDir);
        if (clipboard.mode === "cut") {
          setClipboard(null);
          toast.success("已移动");
        } else {
          toast.success("已粘贴");
        }
      };
      runGuarded(apply);
    }

    const crumbs = [
      ...(workspaceLayout && onLeaveWorkspace ? [{ label: "工作空间", dir: "__leave__" }] : []),
      { label: workspaceLayout ? workspaceRootLabel || "工作空间" : "全部文件", dir: "" },
    ];
    currentDir
      .split("/")
      .filter(Boolean)
      .forEach((part, index, parts) => {
        crumbs.push({ label: part, dir: parts.slice(0, index + 1).join("/") });
      });
    if (workspaceLayout && previewOpen && selectedFile) {
      const fileName = selectedFile.path.split("/").filter(Boolean).pop() || selectedFile.path;
      crumbs.push({ label: fileName, dir: `__file__:${selectedFile.path}` });
    }
    const showListComposer =
      composer &&
      composer.mode !== "rename" &&
      composer.dir === currentDir &&
      (workspaceLayout || !treeVisible);
    const visibleEntries = useMemo(() => {
      const query = fileQuery.trim().toLowerCase();
      if (!query) return directoryEntries;
      return directoryEntries.filter((entry) => entry.name.toLowerCase().includes(query));
    }, [directoryEntries, fileQuery]);
    const allPicked =
      visibleEntries.length > 0 &&
      visibleEntries.every((entry) =>
        picked.some((item) => item.path === entry.path && item.isFolder === (entry.type === "folder")),
      );
    const quoteableCount = picked.filter((item) => !item.isFolder).length;
    const pickedHasFolder = picked.some((item) => item.isFolder);
    const canBatchQuote = quoteableCount > 0 && !pickedHasFolder;
    const canPasteCurrentDir = Boolean(
      clipboard &&
        canPasteTo(
          clipboard.path,
          currentDir,
          clipboard.isFolder,
          clipboard.mode,
          protectSkillMarkdown,
          workspaceLayout,
        ),
    );
    const inTrashView =
      workspaceLayout &&
      (currentDir === "回收站" || currentDir.startsWith("回收站/"));

    function handleRestoreTrash(path: string) {
      const next = restoreTrashEntry(files, path);
      if (!next) {
        toast.error("无法还原，目标位置可能已有同名文件");
        return;
      }
      onFilesChange(next);
      toast.success("已还原");
    }

    function handlePermanentDelete(path: string, isFolder: boolean) {
      if (!isWorkspaceTrashPath(path)) return;
      onFilesChange(permanentDeleteEntry(files, path, isFolder));
      toast.success("已彻底删除");
    }

    useEffect(() => {
      if (!blankMenu) return;
      const close = (event: Event) => {
        const target = event.target;
        if (blankMenuRef.current && target instanceof Node && blankMenuRef.current.contains(target)) {
          return;
        }
        setBlankMenu(null);
      };
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") setBlankMenu(null);
      };
      window.addEventListener("pointerdown", close);
      window.addEventListener("scroll", close, true);
      window.addEventListener("keydown", onKey);
      return () => {
        window.removeEventListener("pointerdown", close);
        window.removeEventListener("scroll", close, true);
        window.removeEventListener("keydown", onKey);
      };
    }, [blankMenu]);
    const deleteCount = deleteTargets?.length ?? 0;
    const deleteSolo = deleteCount === 1 ? deleteTargets![0] : null;
    const deleteTitle = deleteSolo
      ? deleteSolo.isFolder
        ? "删除文件夹"
        : "删除文件"
      : "删除所选项目";
    const deleteDesc = deleteSolo
      ? deleteSolo.isFolder
        ? `将删除「${entryName(deleteSolo.path)}」及其全部内容，且不可恢复。确定删除？`
        : `将删除「${entryName(deleteSolo.path)}」，且不可恢复。确定删除？`
      : `将删除已选的 ${deleteCount} 项，且不可恢复。确定删除？`;

    const previewQuoteBaseEnabled = Boolean(
      onQuoteFile &&
        previewOpen &&
        selectedFile &&
        !editing &&
        isSkillFileTextEditable(selectedFile.path),
    );
    const selectedIsHtml = Boolean(selectedFile && isWorkspaceHtmlFile(selectedFile.path));
    const previewSelectionEnabled = previewQuoteBaseEnabled && !selectedIsHtml;
    const previewHtmlContextEnabled = previewQuoteBaseEnabled && selectedIsHtml;

    const handlePreviewQuoteExcerpt = useCallback(
      (excerpt: string) => {
        if (!selectedFile || !onQuoteFile) return undefined;
        return onQuoteFile({
          path: selectedFile.path,
          name: entryName(selectedFile.path),
          excerpt,
        });
      },
      [onQuoteFile, selectedFile],
    );

    const handlePreviewQuoteHtmlFile = useCallback(
      (snippet: string) => {
        if (!selectedFile || !onQuoteFile || !snippet.trim()) return undefined;
        return onQuoteFile({
          path: selectedFile.path,
          name: entryName(selectedFile.path),
          excerpt: snippet,
        });
      },
      [onQuoteFile, selectedFile],
    );

    const previewQuote = useWorkspacePreviewQuote({
      rootRef: previewRootRef,
      selectionEnabled: previewSelectionEnabled,
      htmlContextEnabled: previewHtmlContextEnabled,
      fileKey: selectedFile?.path ?? "",
      activeBindingIds: previewQuoteBindings,
      onQuoteExcerpt: handlePreviewQuoteExcerpt,
      onQuoteHtmlFile: handlePreviewQuoteHtmlFile,
    });

    if (workspaceLayout) {
      return (
        <div className="flex h-full min-h-0 bg-white" data-skill-files>
          {treeVisible && !fullscreen ? (
            <div
              className={cn(
                "flex h-full shrink-0 flex-col border-r border-[#e2e8f0]",
                quoteOnly ? "w-[168px]" : "w-[280px]",
              )}
            >
              {quoteOnly ? null : (
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2.5">
                <span className="text-sm font-semibold text-slate-900">目录</span>
                {canEdit ? (
                  <div className="flex items-center gap-1" data-unsaved-safe>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7 text-slate-500"
                      title="在根目录新建文件"
                      onClick={() => startCreate("create-file", "")}
                    >
                      <FilePlus className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7 text-slate-500"
                      title="在根目录新建文件夹"
                      onClick={() => startCreate("create-folder", "")}
                    >
                      <FolderPlus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </div>
              )}
              <div
                className={cn(
                  "min-h-0 flex-1 space-y-0.5 overflow-auto p-2",
                  dragItem && dropDir === "" && "rounded-md bg-blue-50/80 ring-1 ring-[#2773ff]",
                )}
                onDragOver={(event) => {
                  if (!canEdit) return;
                  event.preventDefault();
                  if (event.target === event.currentTarget) setDropDir("");
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (event.target === event.currentTarget) finishDrag("");
                }}
              >
                <TreeNodeRow
                  node={{
                    type: "folder",
                    name: workspaceRootLabel || "工作空间",
                    path: "",
                    children: workspaceTree,
                  }}
                  depth={0}
                  isRoot
                  selectedPath={previewOpen ? selectedPath : ""}
                  focusedEntry={
                    previewOpen || focusedEntry?.isFolder ? focusedEntry : null
                  }
                  expanded={expanded}
                  canEdit={canEdit}
                  composer={composer}
                  composerValue={composerValue}
                  composerError={composerError}
                  composerInputRef={composerRef}
                  dragItem={dragItem}
                  dropDir={dropDir}
                  clipboard={clipboard}
                  protectSkillMarkdown={protectSkillMarkdown}
                  protectWorkspaceMemory={workspaceLayout}
                  startCollapsed
                  quoteOnly={quoteOnly}
                  hideCopyMenu
                  hideRowMenu
                  suppressComposerDir={currentDir}
                  onSelectFile={selectFile}
                  onToggleFolder={toggleFolder}
                  onStartCreate={startCreate}
                  onStartRename={startRename}
                  onRequestDelete={(path, isFolder) => {
                    if (entryLocked(path, isFolder)) {
                      lockedActionToast(path, "删除");
                      return;
                    }
                    setDeleteTargets([{ path, isFolder }]);
                  }}
                  onQuote={handleQuote}
                  onCopy={handleCopy}
                  onCut={handleCut}
                  onPaste={(dir) => handlePaste(dir)}
                  onDragItem={setDragItem}
                  onDragOverDir={setDropDir}
                  onDropDir={(dir) => finishDrag(dir)}
                  onDragEnd={() => {
                    setDragItem(null);
                    setDropDir(null);
                  }}
                  onComposerChange={setComposerValue}
                  onComposerSubmit={commitComposer}
                  onComposerCancel={() => setComposer(null)}
                />
              </div>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col">
            {fullscreen && previewOpen && selectedFile ? null : workspaceLayout && previewOpen && selectedFile ? null : (
            <div className={cn("workspace-files-bar", quoteOnly && "is-stacked")}>
              {fullscreen || quoteOnly || embedTabs ? null : (
              <div className="workspace-files-bar__nav">
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#5a6779] hover:bg-slate-50"
                aria-label={treeVisible ? "折叠目录树" : "展开目录树"}
                aria-expanded={treeVisible}
                onClick={() => setTreeVisible((current) => !current)}
              >
                {treeVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </button>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-sm text-slate-500">
                {crumbs.map((crumb, index) => (
                  <div key={crumb.dir || "root"} className="inline-flex min-w-0 items-center gap-1">
                    {index > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" /> : null}
                    {index === crumbs.length - 1 ? (
                      <span className="truncate font-medium text-slate-900">{crumb.label}</span>
                    ) : (
                      <button
                        type="button"
                        className="truncate hover:text-slate-900"
                        onClick={() => {
                          if (crumb.dir === "__leave__") onLeaveWorkspace?.();
                          else openDirectory(crumb.dir);
                        }}
                      >
                        {crumb.label}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              </div>
              )}
              {previewOpen && selectedFile ? null : fullscreen ? null : (
                <label className="workspace-search">
                  <Search />
                  <input
                    type="search"
                    value={fileQuery}
                    placeholder="搜索文件"
                    onChange={(event) => setFileQuery(event.target.value)}
                  />
                </label>
              )}
              {fullscreen && onExitFullscreen ? (
                <button
                  type="button"
                  className="workspace-exit-full"
                  aria-label="返回对话"
                  data-unsaved-safe
                  onClick={onExitFullscreen}
                >
                  <ArrowLeft />
                  返回对话
                </button>
              ) : null}
              {canEdit && !quoteOnly && !fullscreen && !inTrashView && !(previewOpen && selectedFile) ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 text-slate-500"
                    title="粘贴到当前目录"
                    disabled={!canPasteCurrentDir}
                    onClick={() => handlePaste(currentDir)}
                  >
                    <ClipboardPaste className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7 text-slate-500"
                        title="上传"
                        aria-label="上传"
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                        <FilePlus className="h-4 w-4" />
                        上传文件
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => folderInputRef.current?.click()}>
                        <FolderPlus className="h-4 w-4" />
                        上传目录
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={(event) => {
                      const list = event.target.files;
                      event.target.value = "";
                      if (list?.length) void ingestUploads(list, false);
                    }}
                  />
                  <input
                    ref={(node) => {
                      folderInputRef.current = node;
                      if (node) node.setAttribute("webkitdirectory", "");
                    }}
                    type="file"
                    multiple
                    hidden
                    onChange={(event) => {
                      const list = event.target.files;
                      event.target.value = "";
                      if (list?.length) void ingestUploads(list, true);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 text-slate-500"
                    title="新建文件"
                    onClick={() => startCreate("create-file", currentDir)}
                  >
                    <FilePlus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 text-slate-500"
                    title="新建文件夹"
                    onClick={() => startCreate("create-folder", currentDir)}
                  >
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
            )}

            <div className="flex min-h-0 flex-1">
              {previewOpen && selectedFile ? null : (
              <div className="relative min-w-0 flex-1">
              <section
                className={cn(
                  "workspace-file-list absolute inset-0 overflow-auto",
                  picked.length > 0 && "is-picking",
                )}
                onDragOver={(event) => {
                  if (!canEdit) return;
                  event.preventDefault();
                  setDropDir(currentDir);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  finishDrag(currentDir);
                }}
                onContextMenu={(event) => {
                  if (!canEdit || quoteOnly || inTrashView) return;
                  const target = event.target;
                  if (!(target instanceof Element)) return;
                  if (target.closest("button, a, input, textarea, .workspace-batch")) return;
                  if (target.closest("thead")) return;
                  if (target.closest("tbody tr") && !target.closest("td[colspan]")) return;
                  event.preventDefault();
                  setBlankMenu({ x: event.clientX, y: event.clientY });
                }}
              >
                <table className="min-w-full table-fixed border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10 bg-[#f8f9fb]">
                    <tr className="text-left text-[13px] text-slate-600">
                      {canEdit ? (
                        <th className={cn("w-10 border-b border-[#e2e8f0] py-2.5", quoteOnly ? "px-2" : "px-3")}>
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={allPicked}
                            aria-label="全选"
                            className={cn("workspace-pick", allPicked && "is-on")}
                            onClick={togglePickAll}
                          />
                        </th>
                      ) : null}
                      <th className="border-b border-[#e2e8f0] px-4 py-2.5 font-medium">名称</th>
                      {quoteOnly ? null : (
                        <>
                          <th className="w-[110px] border-b border-[#e2e8f0] px-3 py-2.5 font-medium">文件类型</th>
                          <th className="w-[88px] border-b border-[#e2e8f0] px-3 py-2.5 font-medium">大小</th>
                          {inTrashView ? (
                            <th className="w-[96px] border-b border-[#e2e8f0] px-3 py-2.5 font-medium">
                              剩余天数
                            </th>
                          ) : (
                            <th className="w-[148px] border-b border-[#e2e8f0] px-3 py-2.5 font-medium">更新时间</th>
                          )}
                        </>
                      )}
                      <th className="w-14 border-b border-[#e2e8f0] px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {showListComposer ? (
                      <tr className="text-sm bg-white">
                        {canEdit ? (
                          <td
                            className={cn("border-b border-[#eef2f6] py-2.5", quoteOnly ? "px-2" : "px-3")}
                          />
                        ) : null}
                        <td className="border-b border-[#eef2f6] px-4 py-2.5">
                          <ComposerRow
                            ref={composerRef}
                            value={composerValue}
                            error={composerError}
                            folder={composer?.mode === "create-folder"}
                            flush
                            onChange={setComposerValue}
                            onSubmit={commitComposer}
                            onCancel={() => setComposer(null)}
                          />
                        </td>
                        {quoteOnly ? null : (
                          <>
                            <td className="border-b border-[#eef2f6] px-3 py-2.5" />
                            <td className="border-b border-[#eef2f6] px-3 py-2.5" />
                            <td className="border-b border-[#eef2f6] px-3 py-2.5" />
                          </>
                        )}
                        <td className="border-b border-[#eef2f6] px-2 py-2.5" />
                      </tr>
                    ) : null}
                    {visibleEntries.length === 0 && !showListComposer ? (
                      <tr>
                        <td
                          colSpan={quoteOnly ? 3 : canEdit ? 6 : 5}
                          className="px-4 py-16 text-center text-sm text-[#8b98a8]"
                        >
                          {fileQuery.trim() ? "没有匹配的文件" : "这个文件夹是空的"}
                        </td>
                      </tr>
                    ) : (
                      visibleEntries.map((entry) => {
                        const isFolder = entry.type === "folder";
                        const renaming =
                          !treeVisible &&
                          composer?.mode === "rename" &&
                          composer.targetPath === entry.path;
                        const active = previewOpen && !isFolder && selectedPath === entry.path;
                        const chosen = picked.some((item) => item.path === entry.path && item.isFolder === isFolder);
                        const dropHere = isFolder && dragItem && dropDir === entry.path;
                        return (
                          <tr
                            key={entry.path}
                            className={cn(
                              "text-sm",
                              chosen ? "is-picked" : active ? "bg-[#e8f0fb]" : "hover:bg-white",
                              dropHere && "bg-blue-50",
                            )}
                            onDragOver={(event) => {
                              if (!canEdit || quoteOnly || !isFolder) return;
                              event.preventDefault();
                              event.stopPropagation();
                              setDropDir(entry.path);
                            }}
                            onDrop={(event) => {
                              if (quoteOnly || !isFolder) return;
                              event.preventDefault();
                              event.stopPropagation();
                              finishDrag(entry.path);
                            }}
                          >
                            {canEdit ? (
                              <td className={cn("border-b border-[#eef2f6] py-2.5", quoteOnly ? "px-2" : "px-3")}>
                                <button
                                  type="button"
                                  role="checkbox"
                                  aria-checked={chosen}
                                  aria-label={`选择 ${entry.name}`}
                                  className={cn("workspace-pick", chosen && "is-on")}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    togglePick(entry.path, isFolder);
                                  }}
                                />
                              </td>
                            ) : null}
                            <td className="border-b border-[#eef2f6] px-4 py-2.5">
                              {renaming ? (
                                <ComposerRow
                                  ref={composerRef}
                                  value={composerValue}
                                  error={composerError}
                                  folder={isFolder}
                                  flush
                                  onChange={setComposerValue}
                                  onSubmit={commitComposer}
                                  onCancel={() => setComposer(null)}
                                />
                              ) : (
                                <button
                                  type="button"
                                  className="flex min-w-0 items-center gap-2 text-left text-slate-800"
                                  draggable={canEdit && !quoteOnly && !entryLocked(entry.path, isFolder)}
                                  onDragStart={(event) => {
                                    if (quoteOnly) return;
                                    event.dataTransfer.effectAllowed = "move";
                                    event.dataTransfer.setData("text/plain", entry.path);
                                    setDragItem({ path: entry.path, isFolder });
                                  }}
                                  onDragEnd={() => {
                                    setDragItem(null);
                                    setDropDir(null);
                                  }}
                                  onClick={() =>
                                    isFolder ? openDirectory(entry.path) : selectFile(entry.path)
                                  }
                                >
                                  <FileGlyph
                                    path={isFolder ? `${entry.path}/` : entry.path}
                                    folder={isFolder}
                                  />
                                  <span className="truncate">{entry.name}</span>
                                </button>
                              )}
                            </td>
                            {quoteOnly ? null : (
                              <>
                                <td className="border-b border-[#eef2f6] px-3 py-2.5 text-slate-500">
                                  {fileTypeLabel(entry.path, isFolder)}
                                </td>
                                <td className="border-b border-[#eef2f6] px-3 py-2.5 text-slate-500 tabular-nums">
                                  {entrySizeLabel(files, entry.path, isFolder)}
                                </td>
                                <td className="border-b border-[#eef2f6] px-3 py-2.5 text-slate-500 tabular-nums">
                                  {inTrashView && !isFolder
                                    ? entryTrashDays(files, entry.path)
                                    : entryUpdatedAt(files, entry.path, isFolder)}
                                </td>
                              </>
                            )}
                            <td className="border-b border-[#eef2f6] px-2 py-2.5 text-right">
                              {quoteOnly ? (
                                isFolder || renaming ? null : (
                                  <button
                                    type="button"
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                    aria-label={`引用 ${entry.name}`}
                                    title="引用"
                                    onClick={() => handleQuote(entry.path)}
                                  >
                                    <Quote className="h-4 w-4" />
                                  </button>
                                )
                              ) : canEdit && !renaming ? (
                                inTrashView && !isFolder ? (
                                  <WorkspaceTrashRowMenu
                                    name={entry.name}
                                    path={entry.path}
                                    onRestore={handleRestoreTrash}
                                    onPermanentDelete={handlePermanentDelete}
                                  />
                                ) : inTrashView && isFolder ? null : (
                                    <WorkspaceRowMenu
                                    name={entry.name}
                                    path={entry.path}
                                    isFolder={isFolder}
                                    onQuote={handleQuote}
                                    onCut={handleCut}
                                    onDownload={handleDownload}
                                    onStartRename={startRename}
                                    locked={entryLocked(entry.path, isFolder)}
                                    onRequestDelete={(path, folder) => {
                                      if (entryLocked(path, folder)) {
                                        lockedActionToast(path, "删除");
                                        return;
                                      }
                                      setDeleteTargets([{ path, isFolder: folder }]);
                                    }}
                                  />
                                )
                              ) : null}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </section>
              {picked.length > 0 && !fullscreen && !inTrashView ? (
                <div
                  className={cn("workspace-batch", quoteOnly && "is-side")}
                  role="toolbar"
                  aria-label="批量操作"
                >
                  <span>{quoteOnly ? picked.length : `已选择 ${picked.length} 个`}</span>
                  {onQuoteFile ? (
                    <button
                      type="button"
                      className="workspace-batch__chat"
                      disabled={!canBatchQuote}
                      title={
                        canBatchQuote
                          ? "引用"
                          : pickedHasFolder && quoteableCount
                            ? "同时选中文件和文件夹时不支持引用"
                            : "请选择文件后再引用"
                      }
                      onClick={handleBatchQuote}
                    >
                      <Quote />
                      引用
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="workspace-batch__ghost"
                    aria-label="下载"
                    title="下载"
                    onClick={handleBatchDownload}
                  >
                    <Download />
                    {quoteOnly ? null : "下载"}
                  </button>
                  <button
                    type="button"
                    className="workspace-batch__danger"
                    aria-label="删除"
                    title="删除"
                    onClick={() => setDeleteTargets(picked)}
                  >
                    <Trash2 />
                    {quoteOnly ? null : "删除"}
                  </button>
                  <button
                    type="button"
                    className="workspace-batch__icon"
                    aria-label="取消选择"
                    onClick={() => setPicked([])}
                  >
                    <X />
                  </button>
                </div>
              ) : null}
              </div>
              )}

              {previewOpen && selectedFile ? (
                <div className="relative flex min-w-0 flex-1 flex-col bg-white">
                  {fullscreen ? (
                    <div className="workspace-editor-chrome">
                      {onExitFullscreen ? (
                        <button
                          type="button"
                          className="workspace-exit-full"
                          aria-label="返回对话"
                          title="返回对话"
                          data-unsaved-safe
                          onClick={onExitFullscreen}
                        >
                          <ArrowLeft />
                          返回对话
                        </button>
                      ) : <span />}
                      {canEdit && textEditable ? (
                        <div className="flex shrink-0 items-center gap-1" data-unsaved-safe>
                          {editing ? (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-8 rounded-[8px] px-3 text-[13px]"
                                onClick={discardEditor}
                              >
                                取消
                              </Button>
                              <Button
                                type="button"
                                className="h-8 rounded-[8px] bg-[#2773ff] px-3 text-[13px] hover:bg-[#1f66f0]"
                                disabled={!dirty}
                                onClick={saveEditor}
                              >
                                <Save className="h-3.5 w-3.5" />
                                保存
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 rounded-[8px] px-3 text-[13px]"
                              onClick={() => openEditor()}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              编辑
                            </Button>
                          )}
                        </div>
                      ) : canEdit && viewOnly ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled
                          className="h-8 rounded-[8px] px-3 text-[13px]"
                          title="该文件类型不支持在线编辑"
                        >
                          仅支持查看
                        </Button>
                      ) : null}
                    </div>
                  ) : embedTabs ? (
                    <div className="flex shrink-0 items-center justify-end gap-1 border-b border-slate-200 bg-white px-2 py-1">
                      {canEdit && textEditable ? (
                        <div className="flex shrink-0 items-center gap-1" data-unsaved-safe>
                          {editing ? (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-7 rounded-[5px] px-2 text-xs"
                                onClick={discardEditor}
                              >
                                取消
                              </Button>
                              <Button
                                type="button"
                                className="h-7 rounded-[5px] bg-[#2773ff] px-2 text-xs hover:bg-[#1f66f0]"
                                disabled={!dirty}
                                onClick={saveEditor}
                              >
                                <Save className="h-3.5 w-3.5" />
                                保存
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-7 rounded-[5px] px-2 text-xs"
                              onClick={() => openEditor()}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              编辑
                            </Button>
                          )}
                        </div>
                      ) : canEdit && viewOnly ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled
                          className="h-7 rounded-[5px] px-2 text-xs"
                          title="该文件类型不支持在线编辑"
                        >
                          仅支持查看
                        </Button>
                      ) : null}
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                        aria-label="引用"
                        title="引用"
                        onClick={() => handleQuote(selectedFile.path)}
                      >
                        <Quote className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                  <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-1.5 py-0">
                    {workspaceLayout && openTabs.length > 0 ? (
                      <div className="workspace-preview-tabs" role="tablist" aria-label="已打开的文件">
                        {openTabs.map((path) => {
                          const active = path === selectedFile.path;
                          const name = entryName(path);
                          return (
                            <div
                              key={path}
                              className={cn("workspace-preview-tab", active && "is-active")}
                            >
                              <button
                                type="button"
                                role="tab"
                                aria-selected={active}
                                title={path}
                                onClick={() => selectFile(path)}
                              >
                                <FileGlyph path={path} />
                                <span>{name}</span>
                              </button>
                              <button
                                type="button"
                                className="workspace-preview-tab__close"
                                aria-label={`关闭 ${name}`}
                                title="关闭"
                                onClick={() => closeFileTab(path)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="min-w-0 flex-1 truncate px-2 font-mono text-xs text-slate-600">
                        {selectedFile.path}
                      </span>
                    )}
                    {canEdit && textEditable && !quoteOnly ? (
                      <div className="flex shrink-0 items-center gap-1" data-unsaved-safe>
                        {editing ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-7 rounded-[5px] px-2 text-xs"
                              onClick={discardEditor}
                            >
                              取消
                            </Button>
                            <Button
                              type="button"
                              className="h-7 rounded-[5px] bg-[#2773ff] px-2 text-xs hover:bg-[#1f66f0]"
                              disabled={!dirty}
                              onClick={saveEditor}
                            >
                              <Save className="h-3.5 w-3.5" />
                              保存
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-7 rounded-[5px] px-2 text-xs"
                            onClick={() => openEditor()}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            编辑
                          </Button>
                        )}
                      </div>
                    ) : canEdit && viewOnly ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled
                        className="h-7 rounded-[5px] px-2 text-xs"
                        title="该文件类型不支持在线编辑"
                      >
                        仅支持查看
                      </Button>
                    ) : null}
                    <div className="flex shrink-0 items-center gap-0.5 py-1 pr-1">
                    {quoteOnly ? (
                      <>
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                        aria-label="引用"
                        title="引用"
                        onClick={() => handleQuote(selectedFile.path)}
                      >
                        <Quote className="h-4 w-4" />
                      </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      aria-label="关闭预览"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                      onClick={closePreview}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    </div>
                  </div>
                  )}
                  {editing && textEditable ? (
                    <Textarea
                      data-unsaved-safe
                      value={draftContent}
                      onChange={(event) => setDraftContent(event.target.value)}
                      className="min-h-0 flex-1 resize-none rounded-none border-0 p-4 font-mono text-xs leading-6 shadow-none focus-visible:ring-0"
                    />
                  ) : (
                    <div
                      ref={previewRootRef}
                      className="workspace-preview-root min-h-0 flex-1 overflow-auto bg-white"
                      data-workspace-file-preview
                    >
                      <SkillFilePreview
                        path={selectedFile.path}
                        content={selectedFile.content}
                        htmlLivePreview={workspaceLayout}
                      />
                      {previewQuote.markers.map((marker) => {
                        const number = previewQuoteNumbers[marker.bindingId];
                        return (
                          <span
                            key={marker.id}
                            className="workspace-preview-quote-marker"
                            style={{ left: marker.x, top: marker.y }}
                            title={number ? `引用 ${number}` : "已引用"}
                            aria-hidden
                          >
                            {number ? (
                              number
                            ) : (
                              <Quote className="h-3 w-3" strokeWidth={2.25} />
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <ClawTextSelectionMenu
            rootRef={previewRootRef}
            withinSelector="[data-workspace-file-preview]"
            enabled={previewSelectionEnabled}
            onQuote={previewQuote.quoteFromSelection}
          />
          {previewQuote.contextMenuPortal}
          {blankMenu && typeof document !== "undefined"
            ? createPortal(
                <div
                  ref={blankMenuRef}
                  className="workspace-preview-context-menu"
                  style={{ top: blankMenu.y, left: blankMenu.x }}
                  role="menu"
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      startCreate("create-file", currentDir);
                      setBlankMenu(null);
                    }}
                  >
                    <FilePlus className="h-3.5 w-3.5" aria-hidden />
                    新建文件
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      startCreate("create-folder", currentDir);
                      setBlankMenu(null);
                    }}
                  >
                    <FolderPlus className="h-3.5 w-3.5" aria-hidden />
                    新建文件夹
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={!canPasteCurrentDir}
                    onClick={() => {
                      if (!canPasteCurrentDir) return;
                      handlePaste(currentDir);
                      setBlankMenu(null);
                    }}
                  >
                    <ClipboardPaste className="h-3.5 w-3.5" aria-hidden />
                    粘贴到目录
                  </button>
                </div>,
                document.body,
              )
            : null}

          <Dialog open={Boolean(deleteTargets?.length)} onOpenChange={(open) => !open && setDeleteTargets(null)}>
            <DialogContent className="sm:max-w-[420px]" data-unsaved-safe>
              <DialogHeader>
                <DialogTitle>{deleteTitle}</DialogTitle>
                <DialogDescription className="leading-6">{deleteDesc}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-[5px]" onClick={() => setDeleteTargets(null)}>
                  取消
                </Button>
                <Button
                  type="button"
                  className="rounded-[5px] bg-rose-600 hover:bg-rose-700"
                  onClick={confirmDelete}
                >
                  删除
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      );
    }

    return (
      <div
        className={cn(
          "grid overflow-hidden border-b border-slate-200 bg-white lg:grid-cols-[300px_minmax(0,1fr)]",
          fill ? "h-full min-h-0" : "min-h-[580px]",
        )}
        data-skill-files
      >
        <div className={cn("flex min-h-0 flex-col border-b border-slate-200 lg:border-b-0 lg:border-r", fill && "h-full")}>
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <span className="text-sm font-semibold text-slate-900">文件结构</span>
              {canEdit ? (
                <p className="mt-0.5 text-[11px] text-slate-400">
                  拖拽移动，或复制 / 剪切 / 粘贴
                </p>
              ) : null}
            </div>
            {canEdit ? (
              <div className="flex items-center gap-1" data-unsaved-safe>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-slate-500"
                  title="粘贴到根目录"
                  disabled={!clipboard}
                  onClick={() => handlePaste("")}
                >
                  <ClipboardPaste className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-slate-500"
                  title="在根目录新建文件"
                  onClick={() => startCreate("create-file", "")}
                >
                  <FilePlus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-slate-500"
                  title="在根目录新建文件夹"
                  onClick={() => startCreate("create-folder", "")}
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
          <div
            className={cn(
              "space-y-0.5 overflow-auto p-2",
              fill ? "min-h-0 flex-1" : "min-h-[240px]",
              dragItem && dropDir === "" && "rounded-md bg-blue-50/80 ring-1 ring-[#2773ff]"
            )}
            onDragOver={(event) => {
              if (!canEdit) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (event.target === event.currentTarget) {
                setDropDir("");
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (event.target === event.currentTarget) {
                finishDrag("");
              }
            }}
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node)) return;
              setDropDir(null);
            }}
          >
            {composer && composer.dir === "" && composer.mode !== "rename" ? (
              <ComposerRow
                ref={composerRef}
                value={composerValue}
                error={composerError}
                folder={composer.mode === "create-folder"}
                onChange={setComposerValue}
                onSubmit={commitComposer}
                onCancel={() => setComposer(null)}
              />
            ) : null}
            {tree.map((node) => (
              <TreeNodeRow
                key={node.path}
                node={node}
                depth={0}
                selectedPath={selectedPath}
                focusedEntry={focusedEntry}
                expanded={expanded}
                canEdit={canEdit}
                composer={composer}
                composerValue={composerValue}
                composerError={composerError}
                composerInputRef={composerRef}
                dragItem={dragItem}
                dropDir={dropDir}
                clipboard={clipboard}
                protectSkillMarkdown={protectSkillMarkdown}
                protectWorkspaceMemory={workspaceLayout}
                onSelectFile={selectFile}
                onToggleFolder={toggleFolder}
                onStartCreate={startCreate}
                onStartRename={startRename}
                onRequestDelete={(path, isFolder) => {
                  if (entryLocked(path, isFolder)) {
                    lockedActionToast(path, "删除");
                    return;
                  }
                  setDeleteTargets([{ path, isFolder }]);
                }}
                onCopy={handleCopy}
                onCut={handleCut}
                onPaste={(dir) => handlePaste(dir)}
                onDragItem={setDragItem}
                onDragOverDir={setDropDir}
                onDropDir={(dir) => finishDrag(dir)}
                onDragEnd={() => {
                  if (dragItem && entryLocked(dragItem.path, dragItem.isFolder)) {
                    lockedActionToast(dragItem.path, "移动");
                  }
                  setDragItem(null);
                  setDropDir(null);
                }}
                onComposerChange={setComposerValue}
                onComposerSubmit={commitComposer}
                onComposerCancel={() => setComposer(null)}
              />
            ))}
            {tree.length === 0 && !composer ? (
              <p className="px-2 py-6 text-center text-xs text-slate-400">还没有文件，先新建一个。</p>
            ) : null}
          </div>
        </div>

        <div className={cn("flex min-w-0 flex-col", fill && "h-full min-h-0")}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <span className="truncate font-mono text-xs text-slate-600">
              {selectedFile?.path ?? "未选择文件"}
            </span>
            {canEdit && selectedFile && textEditable ? (
              <div className="flex shrink-0 items-center gap-1.5" data-unsaved-safe>
                {editing ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 rounded-[5px] px-2.5 text-xs"
                      onClick={discardEditor}
                    >
                      <X className="h-3.5 w-3.5" />
                      取消
                    </Button>
                    <Button
                      type="button"
                      className="h-8 rounded-[5px] bg-[#2773ff] px-2.5 text-xs hover:bg-[#1f66f0]"
                      disabled={!dirty}
                      onClick={saveEditor}
                    >
                      <Save className="h-3.5 w-3.5" />
                      保存
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 rounded-[5px] px-2.5 text-xs"
                    onClick={() => openEditor()}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    编辑
                  </Button>
                )}
              </div>
            ) : canEdit && selectedFile && viewOnly ? (
              <Button
                type="button"
                variant="outline"
                disabled
                className="h-8 rounded-[5px] px-2.5 text-xs"
                title="该文件类型不支持在线编辑"
              >
                仅支持查看
              </Button>
            ) : null}
          </div>
          {selectedFile ? (
            editing ? (
              <Textarea
                data-unsaved-safe
                value={draftContent}
                onChange={(event) => setDraftContent(event.target.value)}
                className={cn(
                  "flex-1 resize-none rounded-none border-0 p-5 font-mono text-xs leading-6 shadow-none focus-visible:ring-0",
                  fill ? "min-h-0" : "min-h-[500px]",
                )}
              />
            ) : (
              <div className={cn("flex-1 overflow-auto bg-white", fill ? "min-h-0" : "max-h-[520px] min-h-[500px]")}>
                <SkillFilePreview path={selectedFile.path} content={selectedFile.content} />
              </div>
            )
          ) : (
            <div className={cn("flex flex-1 items-center justify-center text-sm text-slate-400", fill ? "min-h-0" : "min-h-[500px]")}>
              选择一个文件进行预览或编辑
            </div>
          )}
        </div>

        <Dialog open={Boolean(deleteTargets?.length)} onOpenChange={(open) => !open && setDeleteTargets(null)}>
          <DialogContent className="sm:max-w-[420px]" data-unsaved-safe>
            <DialogHeader>
              <DialogTitle>{deleteTitle}</DialogTitle>
              <DialogDescription className="leading-6">{deleteDesc}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-[5px]"
                onClick={() => setDeleteTargets(null)}
              >
                取消
              </Button>
              <Button
                type="button"
                className="rounded-[5px] bg-rose-600 hover:bg-rose-700"
                onClick={confirmDelete}
              >
                删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

const ComposerRow = forwardRef<
  HTMLInputElement,
  {
    value: string;
    error: string;
    folder?: boolean;
    depth?: number;
    flush?: boolean;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
  }
>(function ComposerRow(
  { value, error, folder = false, depth = 0, flush = false, onChange, onSubmit, onCancel },
  ref
) {
  return (
    <div
      className={cn("px-1 py-0.5", flush && "min-w-0 flex-1 px-0 py-0")}
      style={flush ? undefined : { paddingLeft: 8 + depth * 14 }}
      data-unsaved-safe
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <FileGlyph path={folder ? "folder/" : value || "新建文件.md"} folder={folder} />
        <Input
          ref={ref}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onCancel();
            }
          }}
          onBlur={onSubmit}
          className={cn("h-7 min-w-0 rounded-[4px] px-2 text-xs", flush && "flex-1")}
        />
      </div>
      {error ? <p className="mt-1 pl-6 text-[11px] text-rose-600">{error}</p> : null}
    </div>
  );
});

function TreeNodeRow({
  node,
  depth,
  selectedPath,
  focusedEntry,
  expanded,
  canEdit,
  composer,
  composerValue,
  composerError,
  composerInputRef,
  dragItem,
  dropDir,
  clipboard,
  protectSkillMarkdown,
  protectWorkspaceMemory = false,
  startCollapsed = false,
  quoteOnly = false,
  hideCopyMenu = false,
  hidePasteMenu = false,
  hideRowMenu = false,
  suppressComposerDir = null,
  isRoot = false,
  onSelectFile,
  onToggleFolder,
  onStartCreate,
  onStartRename,
  onRequestDelete,
  onQuote,
  onCopy,
  onCut,
  onPaste,
  onDragItem,
  onDragOverDir,
  onDropDir,
  onDragEnd,
  onComposerChange,
  onComposerSubmit,
  onComposerCancel,
}: {
  node: NestedTreeNode;
  depth: number;
  selectedPath: string;
  focusedEntry: FocusedEntry | null;
  expanded: Record<string, boolean>;
  canEdit: boolean;
  composer: Composer | null;
  composerValue: string;
  composerError: string;
  composerInputRef: React.RefObject<HTMLInputElement | null>;
  dragItem: { path: string; isFolder: boolean } | null;
  dropDir: string | null;
  clipboard: TreeClipboard | null;
  protectSkillMarkdown: boolean;
  protectWorkspaceMemory?: boolean;
  startCollapsed?: boolean;
  quoteOnly?: boolean;
  hideCopyMenu?: boolean;
  hidePasteMenu?: boolean;
  hideRowMenu?: boolean;
  suppressComposerDir?: string | null;
  isRoot?: boolean;
  onSelectFile: (path: string) => void;
  onToggleFolder: (path: string) => void;
  onStartCreate: (mode: "create-file" | "create-folder", dir: string) => void;
  onStartRename: (path: string, isFolder: boolean) => void;
  onRequestDelete: (path: string, isFolder: boolean) => void;
  onQuote?: (path: string) => void;
  onCopy: (path: string, isFolder: boolean) => void;
  onCut: (path: string, isFolder: boolean) => void;
  onPaste: (dir: string) => void;
  onDragItem: (item: { path: string; isFolder: boolean } | null) => void;
  onDragOverDir: (dir: string | null) => void;
  onDropDir: (dir: string) => void;
  onDragEnd: () => void;
  onComposerChange: (value: string) => void;
  onComposerSubmit: () => void;
  onComposerCancel: () => void;
}) {
  const isFolder = node.type === "folder";
  const open = isFolder
    ? isRoot
      ? true
      : startCollapsed
        ? expanded[node.path] === true
        : expanded[node.path] !== false
    : false;
  const renaming = composer?.mode === "rename" && composer.targetPath === node.path;
  const showChildComposer =
    isFolder &&
    open &&
    composer &&
    composer.dir === node.path &&
    composer.mode !== "rename" &&
    composer.dir !== suppressComposerDir;
  const dropTargetDir = isFolder ? node.path : parentDir(node.path);
  const draggingRootSkill =
    protectSkillMarkdown &&
    Boolean(dragItem) &&
    !dragItem!.isFolder &&
    isRootSkillMarkdown(dragItem!.path);
  const isDropTarget =
    Boolean(dragItem) &&
    dropDir === dropTargetDir &&
    (canMoveTo(
      dragItem!.path,
      dropTargetDir,
      dragItem!.isFolder,
      protectSkillMarkdown,
      protectWorkspaceMemory,
    ) ||
      (draggingRootSkill && parentDir(dragItem!.path) !== dropTargetDir));
  const isFocused = focusedEntry?.path === node.path && focusedEntry.isFolder === isFolder;
  const isCut =
    clipboard?.mode === "cut" &&
    clipboard.path === node.path &&
    clipboard.isFolder === isFolder;
  const canPasteHere = Boolean(
    clipboard &&
      canPasteTo(
        clipboard.path,
        dropTargetDir,
        clipboard.isFolder,
        clipboard.mode,
        protectSkillMarkdown,
        protectWorkspaceMemory,
      )
  );
  const memoryLocked =
    protectWorkspaceMemory && !isFolder && isWorkspaceMemoryFile(node.path);
  const locked =
    (protectSkillMarkdown && !isFolder && isRootSkillMarkdown(node.path)) || memoryLocked;
  const draggable = canEdit && !renaming && !locked && !isRoot;

  function handleDragStart(event: React.DragEvent) {
    if (!draggable) {
      event.preventDefault();
      return;
    }
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", node.path);
    onDragItem({ path: node.path, isFolder });
  }

  return (
    <div>
      <div
        className={cn(
          "group flex h-8 items-center gap-0.5 rounded px-1",
          draggable && "cursor-grab active:cursor-grabbing",
          isFocused || (!isFolder && selectedPath === node.path)
            ? "bg-blue-50 text-[#2773ff]"
            : "text-slate-600 hover:bg-slate-50",
          isCut && "opacity-50",
          isDropTarget && "bg-blue-50 ring-1 ring-[#2773ff]"
        )}
        style={{ paddingLeft: 4 + depth * 14 }}
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragOver={(event) => {
          if (!canEdit) return;
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = "move";
          onDragOverDir(dropTargetDir);
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDropDir(dropTargetDir);
        }}
        onDragEnd={onDragEnd}
      >
        {isFolder ? (
          isRoot ? (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-400">
              <ChevronDown className="h-3.5 w-3.5" />
            </span>
          ) : (
            <button
              type="button"
              className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-400"
              data-unsaved-safe
              onClick={() => onToggleFolder(node.path)}
              aria-label={open ? "折叠文件夹" : "展开文件夹"}
            >
              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          )
        ) : (
          <span className="w-6 shrink-0" />
        )}
        {renaming ? (
          <ComposerRow
            ref={composerInputRef}
            value={composerValue}
            error={composerError}
            folder={isFolder}
            flush
            onChange={onComposerChange}
            onSubmit={onComposerSubmit}
            onCancel={onComposerCancel}
          />
        ) : (
          <>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 text-left text-xs"
              {...(isFolder ? { "data-unsaved-safe": true } : {})}
              draggable={draggable}
              onDragStart={handleDragStart}
              onDragOver={(event) => {
                if (!canEdit) return;
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "move";
                onDragOverDir(dropTargetDir);
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDropDir(dropTargetDir);
              }}
              onDragEnd={onDragEnd}
              onClick={() => (isFolder ? onToggleFolder(node.path) : onSelectFile(node.path))}
            >
              <FileGlyph path={isFolder ? `${node.path}/` : node.path} folder={isFolder} open={open} />
              <span className="truncate">{node.name}</span>
            </button>
            {hideRowMenu ? null : quoteOnly && !isFolder ? (
              <button
                type="button"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label={`引用 ${node.name}`}
                title="引用"
                data-unsaved-safe
                draggable={false}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onQuote?.(node.path);
                }}
              >
                <Quote className="h-3.5 w-3.5" />
              </button>
            ) : canEdit && !quoteOnly ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 data-[state=open]:bg-slate-100"
                    aria-label={`${node.name} 的操作`}
                    data-unsaved-safe
                    draggable={false}
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-lg p-1" data-unsaved-safe>
                  {isFolder ? (
                    <>
                      <DropdownMenuItem onSelect={() => onStartCreate("create-file", node.path)}>
                        <FilePlus className="h-4 w-4" />
                        新建文件
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onStartCreate("create-folder", node.path)}>
                        <FolderPlus className="h-4 w-4" />
                        新建文件夹
                      </DropdownMenuItem>
                      {isRoot ? null : <DropdownMenuSeparator />}
                    </>
                  ) : onQuote ? (
                    <>
                      <DropdownMenuItem onSelect={() => onQuote(node.path)}>
                        <Quote className="h-4 w-4" />
                        引用
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  ) : null}
                  {isRoot ? (
                    hidePasteMenu ? null : (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={!canPasteHere}
                          onSelect={() => onPaste(node.path)}
                        >
                          <ClipboardPaste className="h-4 w-4" />
                          粘贴
                          <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                        </DropdownMenuItem>
                      </>
                    )
                  ) : (
                    <>
                      {hideCopyMenu ? null : (
                        <DropdownMenuItem
                          disabled={memoryLocked}
                          onSelect={() => onCopy(node.path, isFolder)}
                        >
                          <Copy className="h-4 w-4" />
                          复制
                          <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        disabled={locked}
                        onSelect={() => onCut(node.path, isFolder)}
                      >
                        <Scissors className="h-4 w-4" />
                        剪切
                        <DropdownMenuShortcut>⌘X</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      {hidePasteMenu ? null : (
                        <DropdownMenuItem
                          disabled={!canPasteHere}
                          onSelect={() => onPaste(dropTargetDir)}
                        >
                          <ClipboardPaste className="h-4 w-4" />
                          粘贴
                          <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={locked}
                        onSelect={() => onStartRename(node.path, isFolder)}
                      >
                        <Pencil className="h-4 w-4" />
                        重命名
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={locked}
                        onSelect={() => onRequestDelete(node.path, isFolder)}
                      >
                        <Trash2 className="h-4 w-4" />
                        删除
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </>
        )}
      </div>
      {isFolder && open ? (
        <div
          onDragOver={(event) => {
            if (!canEdit) return;
            event.preventDefault();
            event.stopPropagation();
            event.dataTransfer.dropEffect = "move";
            onDragOverDir(node.path);
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDropDir(node.path);
          }}
        >
          {showChildComposer ? (
            <ComposerRow
              ref={composerInputRef}
              value={composerValue}
              error={composerError}
              folder={composer?.mode === "create-folder"}
              depth={depth + 1}
              onChange={onComposerChange}
              onSubmit={onComposerSubmit}
              onCancel={onComposerCancel}
            />
          ) : null}
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              focusedEntry={focusedEntry}
              expanded={expanded}
              canEdit={canEdit}
              composer={composer}
              composerValue={composerValue}
              composerError={composerError}
              composerInputRef={composerInputRef}
              dragItem={dragItem}
              dropDir={dropDir}
              clipboard={clipboard}
              protectSkillMarkdown={protectSkillMarkdown}
              protectWorkspaceMemory={protectWorkspaceMemory}
              startCollapsed={startCollapsed}
              quoteOnly={quoteOnly}
              hideCopyMenu={hideCopyMenu}
              hidePasteMenu={hidePasteMenu}
              hideRowMenu={hideRowMenu}
              suppressComposerDir={suppressComposerDir}
              onSelectFile={onSelectFile}
              onToggleFolder={onToggleFolder}
              onStartCreate={onStartCreate}
              onStartRename={onStartRename}
              onRequestDelete={onRequestDelete}
              onQuote={onQuote}
              onCopy={onCopy}
              onCut={onCut}
              onPaste={onPaste}
              onDragItem={onDragItem}
              onDragOverDir={onDragOverDir}
              onDropDir={onDropDir}
              onDragEnd={onDragEnd}
              onComposerChange={onComposerChange}
              onComposerSubmit={onComposerSubmit}
              onComposerCancel={onComposerCancel}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

const FILE_TYPE_LABELS: Record<string, string> = {
  md: "Markdown",
  markdown: "Markdown",
  csv: "CSV",
  txt: "文本",
  json: "JSON",
  pdf: "PDF",
  png: "PNG 图片",
  jpg: "JPEG 图片",
  jpeg: "JPEG 图片",
  gif: "GIF 图片",
  webp: "WebP 图片",
  svg: "SVG 图片",
  docx: "Word",
  xlsx: "Excel",
};

function fileTypeLabel(path: string, isFolder: boolean) {
  if (isFolder) return "文件夹";
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (!ext || ext === path.toLowerCase()) return "文件";
  return FILE_TYPE_LABELS[ext] ?? `${ext.toUpperCase()} 文件`;
}

function formatByteSize(bytes: number) {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function entrySizeLabel(files: SkillFile[], path: string, isFolder: boolean) {
  if (isFolder) return "—";
  const file = files.find((item) => item.path === path);
  if (file?.sizeLabel) return file.sizeLabel;
  return formatByteSize(file?.content.length ?? 0);
}

function entryUpdatedAt(files: SkillFile[], path: string, isFolder: boolean) {
  if (isFolder) {
    const prefix = `${path}/`;
    const stamps = files
      .filter((item) => !item.path.endsWith("/") && item.path.startsWith(prefix) && item.updatedAt)
      .map((item) => item.updatedAt as string);
    if (!stamps.length) return "—";
    return stamps.sort().at(-1) ?? "—";
  }
  return files.find((item) => item.path === path)?.updatedAt ?? "—";
}

function entryTrashDays(files: SkillFile[], path: string) {
  const days = files.find((item) => item.path === path)?.trashDaysRemaining;
  if (days == null) return "—";
  return `${days} 天`;
}

function triggerBrowserDownload(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function WorkspaceRowMenu({
  name,
  path,
  isFolder,
  locked = false,
  onQuote,
  onCut,
  onDownload,
  onStartRename,
  onRequestDelete,
}: {
  name: string;
  path: string;
  isFolder: boolean;
  locked?: boolean;
  onQuote: (path: string) => void;
  onCut: (path: string, isFolder: boolean) => void;
  onDownload: (path: string, isFolder: boolean) => void;
  onStartRename: (path: string, isFolder: boolean) => void;
  onRequestDelete: (path: string, isFolder: boolean) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label={`${name} 的操作`}
          data-unsaved-safe
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {!isFolder ? (
          <>
            <DropdownMenuItem onSelect={() => onQuote(path)}>
              <Quote className="h-4 w-4" />
              引用
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem disabled={locked} onSelect={() => onCut(path, isFolder)}>
          <Scissors className="h-4 w-4" />
          剪切
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onDownload(path, isFolder)}>
          <Download className="h-4 w-4" />
          下载
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={locked} onSelect={() => onStartRename(path, isFolder)}>
          <Pencil className="h-4 w-4" />
          重命名
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={locked}
          onSelect={() => onRequestDelete(path, isFolder)}
        >
          <Trash2 className="h-4 w-4" />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WorkspaceTrashRowMenu({
  name,
  path,
  onRestore,
  onPermanentDelete,
}: {
  name: string;
  path: string;
  onRestore: (path: string) => void;
  onPermanentDelete: (path: string, isFolder: boolean) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label={`${name} 的操作`}
          data-unsaved-safe
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => onRestore(path)}>
          <ArchiveRestore className="h-4 w-4" />
          还原
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => onPermanentDelete(path, false)}>
          <Trash2 className="h-4 w-4" />
          彻底删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

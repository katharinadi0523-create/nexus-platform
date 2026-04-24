"use client";

import {
  ChangeEvent,
  type ReactNode,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowUp,
  ChevronDown,
  ChevronRight,
  FileCode2,
  FilePenLine,
  FilePlus2,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Mic,
  PanelLeft,
  Paperclip,
  Plus,
  Search,
  Sparkles,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type SkillFile = {
  id: string;
  path: string;
  content: string;
};

type TreeFileEntry = {
  fileId: string;
  path: string;
  skillId: string;
};

type FileTreeNode = {
  name: string;
  path: string;
  type: "folder" | "file";
  fileId?: string;
  skillId?: string;
  children: FileTreeNode[];
};

type FoundryDirectory = {
  id: string;
  name: string;
  templateId?: string;
  source: "preset" | "marketplace";
  files: SkillFile[];
};

export type SkillsFoundryTemplateSeed = {
  requestId: string;
  id: string;
  name: string;
  files: Array<Pick<SkillFile, "path" | "content">>;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function createFile(path: string, content: string, prefix: string): SkillFile {
  return {
    id: `${prefix}-${slugify(path)}-${Math.random().toString(36).slice(2, 7)}`,
    path,
    content,
  };
}

function createFoundryDirectory(input: {
  id: string;
  name: string;
  source: "preset" | "marketplace";
  templateId?: string;
  files: Array<{ path: string; content: string }>;
}) {
  return {
    id: input.id,
    name: input.name,
    source: input.source,
    templateId: input.templateId,
    files: input.files.map((file) => createFile(file.path, file.content, `foundry-${input.id}`)),
  } satisfies FoundryDirectory;
}

const INITIAL_FOUNDRY_DIRECTORIES: FoundryDirectory[] = [
  createFoundryDirectory({
    id: "skill-creator",
    name: "skill-creator",
    source: "preset",
    files: [
      {
        path: "SKILL.md",
        content: `---
name: skill-creator
description: "Create new skills, modify and improve existing skills."
---

# Skill Creator

Use this workspace to create or optimize a skill.
`,
      },
      { path: "agents/README.md", content: "# agents\n\nStore agent prompts and usage notes here.\n" },
      { path: "assets/README.md", content: "# assets\n\nStore examples, screenshots and snippets here.\n" },
      { path: "eval-viewer/README.md", content: "# eval-viewer\n\nStore evaluation views and review notes here.\n" },
      { path: "references/README.md", content: "# references\n\nStore reference materials here.\n" },
      { path: "scripts/bootstrap.ts", content: "export function bootstrapSkill() {\n  return 'skill-creator';\n}\n" },
    ],
  }),
  createFoundryDirectory({
    id: "xlsx",
    name: "xlsx",
    source: "preset",
    files: [
      {
        path: "SKILL.md",
        content: `---
name: xlsx
description: "Process spreadsheet-heavy tasks."
---

# xlsx

Use this skill when the task is centered on spreadsheet output.
`,
      },
      { path: "scripts/normalize-sheet.ts", content: "export function normalizeSheet() {\n  return 'normalized';\n}\n" },
    ],
  }),
  createFoundryDirectory({
    id: "theme-factory",
    name: "theme-factory",
    source: "preset",
    files: [
      {
        path: "SKILL.md",
        content: `---
name: theme-factory
description: "Apply a consistent theme across outputs."
---

# theme-factory

Use this skill to apply reusable presentation themes.
`,
      },
      { path: "assets/palette.md", content: "# palette\n\n- Primary\n- Secondary\n- Accent\n" },
      { path: "scripts/apply-theme.ts", content: "export function applyTheme() {\n  return 'theme-applied';\n}\n" },
    ],
  }),
];

function buildFileTree(files: TreeFileEntry[]) {
  const nodes: FileTreeNode[] = [];

  files.forEach((file) => {
    const segments = file.path.split("/").filter(Boolean);
    let currentLevel = nodes;
    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const existing = currentLevel.find((node) => node.path === currentPath);

      if (existing) {
        currentLevel = existing.children;
        return;
      }

      const node: FileTreeNode = {
        name: segment,
        path: currentPath,
        type: index === segments.length - 1 ? "file" : "folder",
        fileId: index === segments.length - 1 ? file.fileId : undefined,
        skillId: index === segments.length - 1 ? file.skillId : undefined,
        children: [],
      };

      currentLevel.push(node);
      currentLevel = node.children;
    });
  });

  const sortNodes = (tree: FileTreeNode[]): FileTreeNode[] =>
    [...tree]
      .sort((left, right) => {
        if (left.type !== right.type) {
          return left.type === "folder" ? -1 : 1;
        }
        return left.name.localeCompare(right.name, "zh-CN");
      })
      .map((node) => ({
        ...node,
        children: sortNodes(node.children),
      }));

  return sortNodes(nodes);
}

function fileIcon(path: string) {
  const lowerPath = path.toLowerCase();
  if (
    lowerPath.endsWith(".ts") ||
    lowerPath.endsWith(".tsx") ||
    lowerPath.endsWith(".js") ||
    lowerPath.endsWith(".jsx") ||
    lowerPath.endsWith(".json") ||
    lowerPath.endsWith(".css")
  ) {
    return FileCode2;
  }

  return FileText;
}

function normalizeImportedPath(path: string) {
  const segments = path.split("/").filter(Boolean);
  if (segments.length > 1) {
    return segments.slice(1).join("/");
  }

  return segments[0] ?? "SKILL.md";
}

export function SkillsFoundryTab({
  pendingTemplate,
  onPendingTemplateHandled,
}: {
  pendingTemplate: SkillsFoundryTemplateSeed | null;
  onPendingTemplateHandled?: () => void;
}) {
  const [foundryDirectories, setFoundryDirectories] = useState<FoundryDirectory[]>(
    INITIAL_FOUNDRY_DIRECTORIES
  );
  const [foundrySearch, setFoundrySearch] = useState("");
  const [selectedFoundryDirectoryId, setSelectedFoundryDirectoryId] = useState(
    INITIAL_FOUNDRY_DIRECTORIES[0]?.id ?? ""
  );
  const [foundryPrompt, setFoundryPrompt] = useState("");
  const [foundryAttachmentNames, setFoundryAttachmentNames] = useState<string[]>([]);
  const [foundryActiveFileId, setFoundryActiveFileId] = useState("");
  const [foundryExpandedFolders, setFoundryExpandedFolders] = useState<Record<string, boolean>>({});
  const [isFoundryTreeVisible, setIsFoundryTreeVisible] = useState(true);
  const [isFoundryEditorVisible, setIsFoundryEditorVisible] = useState(false);
  const [foundryCreateMenuOpen, setFoundryCreateMenuOpen] = useState(false);
  const foundryAttachmentInputRef = useRef<HTMLInputElement>(null);
  const foundryUploadFilesInputRef = useRef<HTMLInputElement>(null);
  const foundryUploadFolderInputRef = useRef<HTMLInputElement>(null);
  const handledPendingRequestIdRef = useRef<string | null>(null);

  const deferredFoundrySearch = useDeferredValue(foundrySearch);

  useEffect(() => {
    const folderInput = foundryUploadFolderInputRef.current;
    if (!folderInput) {
      return;
    }

    folderInput.setAttribute("webkitdirectory", "");
    folderInput.setAttribute("directory", "");
  }, []);

  useEffect(() => {
    if (!pendingTemplate || handledPendingRequestIdRef.current === pendingTemplate.requestId) {
      return;
    }

    handledPendingRequestIdRef.current = pendingTemplate.requestId;
    const timer = window.setTimeout(() => {
      const targetDirectoryId = `foundry-${pendingTemplate.id}`;
      const alreadyAdded = foundryDirectories.find((directory) => directory.id === targetDirectoryId);

      if (alreadyAdded) {
        setSelectedFoundryDirectoryId(targetDirectoryId);
        setIsFoundryTreeVisible(true);
        toast.info(`已在技能工场中：${pendingTemplate.name}`);
        onPendingTemplateHandled?.();
        return;
      }

      const nextDirectory = createFoundryDirectory({
        id: targetDirectoryId,
        name: pendingTemplate.name,
        templateId: pendingTemplate.id,
        source: "marketplace",
        files: pendingTemplate.files.map((file) => ({
          path: file.path,
          content: file.content,
        })),
      });

      setFoundryDirectories((current) => [nextDirectory, ...current]);
      setSelectedFoundryDirectoryId(targetDirectoryId);
      setFoundryActiveFileId(nextDirectory.files[0]?.id ?? "");
      setIsFoundryTreeVisible(true);
      setIsFoundryEditorVisible(false);
      toast.success(`已添加到技能工场：${pendingTemplate.name}`);
      onPendingTemplateHandled?.();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [foundryDirectories, onPendingTemplateHandled, pendingTemplate]);

  const selectedFoundryDirectory = useMemo(
    () =>
      foundryDirectories.find((directory) => directory.id === selectedFoundryDirectoryId) ??
      foundryDirectories[0] ??
      null,
    [foundryDirectories, selectedFoundryDirectoryId]
  );

  const effectiveFoundryActiveFileId = useMemo(() => {
    if (!selectedFoundryDirectory) {
      return "";
    }

    const fileStillExists = selectedFoundryDirectory.files.some(
      (file) => file.id === foundryActiveFileId
    );

    return fileStillExists ? foundryActiveFileId : (selectedFoundryDirectory.files[0]?.id ?? "");
  }, [foundryActiveFileId, selectedFoundryDirectory]);

  const selectedFoundryFile = useMemo(
    () =>
      selectedFoundryDirectory?.files.find((file) => file.id === effectiveFoundryActiveFileId) ?? null,
    [effectiveFoundryActiveFileId, selectedFoundryDirectory]
  );

  const foundryVisibleFiles = useMemo<TreeFileEntry[]>(() => {
    const query = deferredFoundrySearch.trim().toLowerCase();
    const files = foundryDirectories.flatMap((directory) =>
      directory.files.map((file) => ({
        fileId: file.id,
        skillId: directory.id,
        path: `${directory.name}/${file.path}`,
      }))
    );

    if (!query) {
      return files;
    }

    return files.filter((file) => file.path.toLowerCase().includes(query));
  }, [deferredFoundrySearch, foundryDirectories]);

  const foundryFileTree = useMemo(
    () => buildFileTree(foundryVisibleFiles),
    [foundryVisibleFiles]
  );

  const toggleFoundryFolder = (path: string) => {
    setFoundryExpandedFolders((current) => ({
      ...current,
      [path]: !(current[path] ?? true),
    }));
  };

  const handleCreateFoundryDirectory = () => {
    const nextId = `draft-space-${Date.now()}`;
    const nextName = `new-skill-space-${foundryDirectories.length + 1}`;
    const nextDirectory = createFoundryDirectory({
      id: nextId,
      name: nextName,
      source: "preset",
      files: [
        {
          path: "SKILL.md",
          content: `---\nname: ${nextName}\ndescription: \"\"\n---\n\n# ${nextName}\n`,
        },
      ],
    });

    setFoundryDirectories((current) => [nextDirectory, ...current]);
    setSelectedFoundryDirectoryId(nextId);
    setFoundryActiveFileId(nextDirectory.files[0]?.id ?? "");
    setFoundryExpandedFolders((current) => ({
      ...current,
      [nextName]: true,
    }));
    setIsFoundryTreeVisible(true);
    setIsFoundryEditorVisible(true);
    setFoundryPrompt("使用/create skills创建一个技能，要求如下：");
    toast.success(`已创建目录：${nextName}`);
  };

  const handleFoundryAttachments = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    setFoundryAttachmentNames(selectedFiles.map((file) => file.name));
    toast.success(`已添加 ${selectedFiles.length} 个附件`);
    event.target.value = "";
  };

  const handleApplyFoundryTemplate = (mode: "create" | "optimize") => {
    if (mode === "create") {
      setFoundryPrompt("使用/create skills创建一个技能，要求如下：");
      return;
    }

    const targetName = selectedFoundryDirectory?.name ?? "当前";
    setFoundryPrompt(`使用/create skills优化${targetName}技能，要求如下：`);
  };

  const handleFoundryVoiceInput = () => {
    toast.info("语音输入能力建设中，后续会接入实时语音转写。");
  };

  const handleSelectFoundryFile = (directoryId: string, fileId: string) => {
    setSelectedFoundryDirectoryId(directoryId);
    setFoundryActiveFileId(fileId);
    setIsFoundryEditorVisible(true);
  };

  const updateFoundryFileContent = (content: string) => {
    if (!selectedFoundryDirectory || !selectedFoundryFile) {
      return;
    }

    setFoundryDirectories((current) =>
      current.map((directory) =>
        directory.id !== selectedFoundryDirectory.id
          ? directory
          : {
              ...directory,
              files: directory.files.map((file) =>
                file.id === selectedFoundryFile.id ? { ...file, content } : file
              ),
            }
      )
    );
  };

  const handleCreateFoundryFile = () => {
    if (!selectedFoundryDirectory) {
      toast.error("请先选择一个目录");
      return;
    }

    const nextPath = window.prompt("请输入新文件名", "new-file.md")?.trim();
    if (!nextPath) {
      return;
    }

    const nextFile = createFile(nextPath, `# ${nextPath}\n`, `foundry-${selectedFoundryDirectory.id}`);

    setFoundryDirectories((current) =>
      current.map((directory) =>
        directory.id !== selectedFoundryDirectory.id
          ? directory
          : {
              ...directory,
              files: [...directory.files, nextFile],
            }
      )
    );
    setFoundryExpandedFolders((current) => ({
      ...current,
      [selectedFoundryDirectory.name]: true,
    }));
    setFoundryActiveFileId(nextFile.id);
    setIsFoundryEditorVisible(true);
    toast.success(`已新建文件：${nextPath}`);
  };

  const handleCreateFoundryFolder = () => {
    if (!selectedFoundryDirectory) {
      toast.error("请先选择一个目录");
      return;
    }

    const folderName = window.prompt("请输入新文件夹名", "new-folder")?.trim();
    if (!folderName) {
      return;
    }

    const nextFile = createFile(
      `${folderName}/README.md`,
      `# ${folderName}\n\n在这里补充目录说明。\n`,
      `foundry-${selectedFoundryDirectory.id}`
    );

    setFoundryDirectories((current) =>
      current.map((directory) =>
        directory.id !== selectedFoundryDirectory.id
          ? directory
          : {
              ...directory,
              files: [...directory.files, nextFile],
            }
      )
    );
    setFoundryExpandedFolders((current) => ({
      ...current,
      [selectedFoundryDirectory.name]: true,
      [`${selectedFoundryDirectory.name}/${folderName}`]: true,
    }));
    setFoundryActiveFileId(nextFile.id);
    setIsFoundryEditorVisible(true);
    toast.success(`已新建文件夹：${folderName}`);
  };

  const handleUploadFoundryFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (!selectedFoundryDirectory || selectedFiles.length === 0) {
      event.target.value = "";
      return;
    }

    const nextFiles = await Promise.all(
      selectedFiles.map(async (file, index) =>
        createFile(
          file.name || `file-${index + 1}.md`,
          await file.text(),
          `foundry-${selectedFoundryDirectory.id}`
        )
      )
    );

    setFoundryDirectories((current) =>
      current.map((directory) =>
        directory.id !== selectedFoundryDirectory.id
          ? directory
          : {
              ...directory,
              files: [...directory.files, ...nextFiles],
            }
      )
    );
    setFoundryExpandedFolders((current) => ({
      ...current,
      [selectedFoundryDirectory.name]: true,
    }));
    toast.success(`已上传 ${nextFiles.length} 个文件`);
    event.target.value = "";
  };

  const handleUploadFoundryFolder = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (!selectedFoundryDirectory || selectedFiles.length === 0) {
      event.target.value = "";
      return;
    }

    const nextFiles = await Promise.all(
      selectedFiles.map(async (file, index) =>
        createFile(
          normalizeImportedPath(file.webkitRelativePath || file.name || `file-${index + 1}.md`),
          await file.text(),
          `foundry-${selectedFoundryDirectory.id}`
        )
      )
    );

    setFoundryDirectories((current) =>
      current.map((directory) =>
        directory.id !== selectedFoundryDirectory.id
          ? directory
          : {
              ...directory,
              files: [...directory.files, ...nextFiles],
            }
      )
    );
    setFoundryExpandedFolders((current) => ({
      ...current,
      [selectedFoundryDirectory.name]: true,
    }));
    toast.success(`已上传文件夹，共 ${nextFiles.length} 个文件`);
    event.target.value = "";
  };

  const handleSendFoundryPrompt = () => {
    if (!foundryPrompt.trim() && foundryAttachmentNames.length === 0) {
      toast.error("请先输入需求或上传附件");
      return;
    }

    toast.success("已提交到技能工场，会基于你的要求开始创建或优化技能。");
    setFoundryPrompt("");
    setFoundryAttachmentNames([]);
  };

  const renderFoundryTree = (nodes: FileTreeNode[], depth = 0): ReactNode =>
    nodes.map((node) => {
      if (node.type === "folder") {
        const isRootDirectory = depth === 0;
        const isExpanded = foundryExpandedFolders[node.path] ?? !isRootDirectory;
        const rootDirectory = isRootDirectory
          ? foundryDirectories.find((directory) => directory.name === node.name) ?? null
          : null;
        const isSelectedRoot = rootDirectory?.id === selectedFoundryDirectory?.id;

        return (
          <div key={node.path}>
            <button
              type="button"
              onClick={() => {
                if (rootDirectory) {
                  setSelectedFoundryDirectoryId(rootDirectory.id);
                }
                toggleFoundryFolder(node.path);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                isRootDirectory
                  ? cn(
                      "text-[15px] font-medium text-slate-900 hover:bg-slate-100",
                      isSelectedRoot ? "bg-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]" : ""
                    )
                  : "text-sm text-slate-700 hover:bg-slate-100"
              )}
              style={{ paddingLeft: `${depth * 18 + 8}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
              {isExpanded ? (
                <FolderOpen
                  className={cn("h-4 w-4", isRootDirectory ? "text-blue-600" : "text-slate-500")}
                />
              ) : (
                <Folder
                  className={cn("h-4 w-4", isRootDirectory ? "text-blue-600" : "text-slate-500")}
                />
              )}
              <span className="truncate">{node.name}</span>
            </button>
            {isExpanded ? <div>{renderFoundryTree(node.children, depth + 1)}</div> : null}
          </div>
        );
      }

      const Icon = fileIcon(node.name);
      const isActive = node.fileId === effectiveFoundryActiveFileId;

      return (
        <button
          key={node.path}
          type="button"
          onClick={() => node.fileId && node.skillId && handleSelectFoundryFile(node.skillId, node.fileId)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
            isActive
              ? "bg-slate-100 text-slate-950"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
          style={{ paddingLeft: `${depth * 18 + 18}px` }}
        >
          <Icon className="h-4 w-4 text-sky-500" />
          <span className="truncate">{node.name}</span>
        </button>
      );
    });

  return (
    <>
      <input
        ref={foundryAttachmentInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFoundryAttachments}
      />
      <input
        ref={foundryUploadFilesInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleUploadFoundryFiles}
      />
      <input
        ref={foundryUploadFolderInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleUploadFoundryFolder}
      />

      <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,250,252,0.92))] shadow-[0_28px_60px_-46px_rgba(15,23,42,0.3)] backdrop-blur-sm">
        <div aria-hidden className="absolute inset-0">
          <div className="skills-ambient-orb absolute left-[-4rem] top-10 h-28 w-28 rounded-full bg-cyan-200/22 blur-3xl" />
          <div className="skills-ambient-orb skills-ambient-orb-delay absolute right-[8%] top-12 h-40 w-40 rounded-full bg-amber-200/18 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_24%),linear-gradient(135deg,rgba(15,23,42,0.02),transparent_36%,rgba(250,204,21,0.05)_100%)]" />
        </div>

        <div className="relative flex flex-col gap-4 p-4 xl:flex-row xl:items-stretch xl:p-5">
          {isFoundryTreeVisible ? (
            <aside className="overflow-hidden rounded-[28px] border border-white/85 bg-white/88 shadow-[0_22px_46px_-36px_rgba(15,23,42,0.2)] backdrop-blur-sm xl:w-[292px] xl:shrink-0">
              <div className="border-b border-slate-200/70 px-4 py-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                    技能目录
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    onClick={() => setIsFoundryTreeVisible(false)}
                    aria-label="收起目录"
                    title="收起目录"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={foundrySearch}
                      onChange={(event) => setFoundrySearch(event.target.value)}
                      placeholder="Search files..."
                      className="h-11 rounded-2xl border-white bg-slate-50/95 pl-10 pr-3 text-sm shadow-inner shadow-slate-200/55"
                    />
                  </div>
                  <Popover open={foundryCreateMenuOpen} onOpenChange={setFoundryCreateMenuOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        size="icon"
                        className="h-11 w-11 rounded-2xl bg-blue-600 text-white shadow-[0_16px_28px_-20px_rgba(37,99,235,0.72)] hover:bg-blue-500"
                        aria-label="新建或上传"
                        title="新建或上传"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      className="w-[268px] rounded-[26px] border border-white/90 bg-white/96 p-2 shadow-[0_24px_48px_-30px_rgba(15,23,42,0.28)]"
                    >
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setFoundryCreateMenuOpen(false);
                            handleCreateFoundryFile();
                          }}
                          className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
                        >
                          <FilePlus2 className="h-5 w-5 text-slate-500" />
                          <span>New file</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFoundryCreateMenuOpen(false);
                            handleCreateFoundryFolder();
                          }}
                          className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
                        >
                          <FolderPlus className="h-5 w-5 text-slate-500" />
                          <span>New folder...</span>
                        </button>
                        <div className="mx-2 border-t border-slate-100" />
                        <button
                          type="button"
                          onClick={() => {
                            setFoundryCreateMenuOpen(false);
                            foundryUploadFilesInputRef.current?.click();
                          }}
                          className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
                        >
                          <Upload className="h-5 w-5 text-slate-500" />
                          <span>Upload files...</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFoundryCreateMenuOpen(false);
                            foundryUploadFolderInputRef.current?.click();
                          }}
                          className="flex w-full items-center gap-3 rounded-[18px] px-4 py-3 text-left text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
                        >
                          <FolderOpen className="h-5 w-5 text-slate-500" />
                          <span>Upload Folder</span>
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="max-h-[760px] overflow-y-auto px-3 py-3">
                <div className="space-y-1.5">
                  {foundryFileTree.length > 0 ? (
                    renderFoundryTree(foundryFileTree)
                  ) : (
                    <div className="space-y-3 rounded-[20px] border border-dashed border-slate-200/80 px-4 py-8 text-center text-sm text-slate-500">
                      <div>没有匹配的文件或目录</div>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl border-slate-200/80 bg-white/88"
                        onClick={handleCreateFoundryDirectory}
                      >
                        <FolderPlus className="h-4 w-4" />
                        新建技能目录
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          ) : null}

          {isFoundryEditorVisible ? (
            <section className="overflow-hidden rounded-[28px] border border-white/85 bg-white/88 shadow-[0_22px_46px_-36px_rgba(15,23,42,0.18)] backdrop-blur-sm xl:w-[430px] xl:shrink-0">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    {selectedFoundryFile ? (
                      <>
                        {(() => {
                          const Icon = fileIcon(selectedFoundryFile.path);
                          return <Icon className="h-4 w-4 text-slate-500" />;
                        })()}
                        <span className="truncate">{selectedFoundryFile.path}</span>
                      </>
                    ) : (
                      <>
                        <FilePenLine className="h-4 w-4 text-slate-500" />
                        <span>编辑器</span>
                      </>
                    )}
                  </div>
                  <div className="mt-1 truncate text-[12px] text-slate-500">
                    {selectedFoundryDirectory?.name ?? "未选择目录"}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => setIsFoundryEditorVisible(false)}
                  aria-label="关闭编辑器"
                  title="关闭编辑器"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="px-4 py-4">
                {selectedFoundryFile ? (
                  <Textarea
                    value={selectedFoundryFile.content}
                    onChange={(event) => updateFoundryFileContent(event.target.value)}
                    placeholder="选择文件后可在这里编辑内容。"
                    className="min-h-[680px] resize-none rounded-[24px] border-slate-200/80 bg-slate-50/80 p-4 font-mono text-[13px] leading-6 text-slate-700 shadow-inner shadow-slate-200/55 focus-visible:ring-sky-100"
                  />
                ) : (
                  <div className="flex min-h-[680px] items-center justify-center rounded-[24px] border border-dashed border-slate-200/80 bg-slate-50/70 px-6 text-sm text-slate-500">
                    从左侧目录树选择一个文件后，即可在这里修改内容。
                  </div>
                )}
              </div>
            </section>
          ) : null}

          <div className="flex min-h-[680px] min-w-0 flex-1 flex-col justify-between rounded-[28px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.72))] px-6 py-6 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.2)] backdrop-blur-sm lg:px-8 lg:py-8">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1 text-[12px] font-semibold text-amber-700">
                <Sparkles className="h-3.5 w-3.5" />
                技能工场
              </div>
              <h2 className="skills-display text-[clamp(2.2rem,3.6vw,3.35rem)] leading-[1.05] text-slate-950">
                创建、试用、优化技能，构建AI提效飞轮。
              </h2>
            </div>

            <div className="flex flex-1 items-center justify-center py-8">
              <div className="w-full max-w-5xl">
                <div className="relative overflow-hidden rounded-[34px] border border-slate-200/80 bg-white/96 p-5 shadow-[0_34px_70px_-48px_rgba(15,23,42,0.38)]">
                  <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(15,23,42,0.15),transparent)]" />

                  <div className="relative space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-slate-700">
                          {selectedFoundryDirectory?.name ?? "未选择目录"}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {!isFoundryTreeVisible ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-full border-slate-200/80 bg-slate-50/80 text-slate-700 hover:bg-slate-100"
                              onClick={() => setIsFoundryTreeVisible(true)}
                            >
                              <PanelLeft className="h-4 w-4" />
                              显示目录
                            </Button>
                          ) : null}
                          {!isFoundryEditorVisible ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-full border-slate-200/80 bg-slate-50/80 text-slate-700 hover:bg-slate-100"
                              onClick={() => setIsFoundryEditorVisible(true)}
                              disabled={!selectedFoundryFile}
                            >
                              <FilePenLine className="h-4 w-4" />
                              显示编辑器
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full border-slate-200/80 bg-slate-50/80 text-slate-700 hover:bg-slate-100"
                          onClick={() => handleApplyFoundryTemplate("create")}
                        >
                          <Sparkles className="h-4 w-4" />
                          创建skill
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full border-slate-200/80 bg-slate-50/80 text-slate-700 hover:bg-slate-100"
                          onClick={() => handleApplyFoundryTemplate("optimize")}
                        >
                          <Wrench className="h-4 w-4" />
                          优化skills
                        </Button>
                      </div>
                    </div>

                    <div className="min-h-[248px] rounded-[28px] border border-slate-200/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,250,251,0.98))] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                      <Textarea
                        value={foundryPrompt}
                        onChange={(event) => setFoundryPrompt(event.target.value)}
                        placeholder="欢迎使用技能工场，可以在此输入你的要求。"
                        className="min-h-[190px] resize-none border-0 bg-transparent px-0 py-0 text-base leading-8 text-slate-700 shadow-none focus-visible:ring-0"
                      />

                      {foundryAttachmentNames.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {foundryAttachmentNames.map((name) => (
                            <div
                              key={name}
                              className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-sky-50/85 px-3 py-1.5 text-xs text-sky-700"
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                              <span className="max-w-[220px] truncate">{name}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-14 w-14 rounded-[20px] border-slate-200/80 bg-white text-slate-700 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.48)] hover:bg-slate-50"
                          onClick={() => foundryAttachmentInputRef.current?.click()}
                          aria-label="上传附件"
                          title="上传附件"
                        >
                          <Paperclip className="h-5 w-5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-14 w-14 rounded-[20px] border-slate-200/80 bg-white text-slate-700 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.48)] hover:bg-slate-50"
                          onClick={handleFoundryVoiceInput}
                          aria-label="语音输入"
                          title="语音输入"
                        >
                          <Mic className="h-5 w-5" />
                        </Button>
                      </div>

                      <Button
                        type="button"
                        size="icon"
                        className="h-14 w-14 rounded-[20px] bg-slate-500 text-white shadow-[0_16px_30px_-22px_rgba(15,23,42,0.7)] hover:bg-slate-700"
                        onClick={handleSendFoundryPrompt}
                        aria-label="发送"
                        title="发送"
                      >
                        <ArrowUp className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

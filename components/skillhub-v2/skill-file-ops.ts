import type { SkillFile } from "./types";
import { isRootSkillMarkdown } from "./shared";

export const FOLDER_MARK = "/";

export function isFolderPlaceholder(path: string) {
  return path.endsWith(FOLDER_MARK);
}

export const WORKSPACE_MEMORY_FILE = "memory.md";

export function isWorkspaceMemoryFile(path: string) {
  return path.toLowerCase() === WORKSPACE_MEMORY_FILE;
}

export function isProtectedEntry(
  path: string,
  isFolder: boolean,
  protectSkillMarkdown = true,
  protectWorkspaceMemory = false,
) {
  if (isFolder) return false;
  if (protectSkillMarkdown && isRootSkillMarkdown(path)) return true;
  if (protectWorkspaceMemory && isWorkspaceMemoryFile(path)) return true;
  return false;
}

export function folderPathOf(dir: string) {
  if (!dir) return "";
  return dir.endsWith(FOLDER_MARK) ? dir : `${dir}${FOLDER_MARK}`;
}

export function trimFolderMark(path: string) {
  return path.replace(/\/+$/, "");
}

export function parentDir(path: string) {
  const clean = trimFolderMark(path);
  const index = clean.lastIndexOf("/");
  return index === -1 ? "" : clean.slice(0, index);
}

export function entryName(path: string) {
  const clean = trimFolderMark(path);
  const index = clean.lastIndexOf("/");
  return index === -1 ? clean : clean.slice(index + 1);
}

export function stampNow() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function joinPath(dir: string, name: string) {
  const parent = trimFolderMark(dir);
  return parent ? `${parent}/${name}` : name;
}

export type NestedFolderNode = {
  type: "folder";
  name: string;
  path: string;
  children: NestedTreeNode[];
};

export type NestedTreeNode =
  | { type: "file"; name: string; path: string }
  | NestedFolderNode;

type AccFolder = {
  type: "folder";
  name: string;
  path: string;
  children: Map<string, AccNode>;
};
type AccFile = { type: "file"; name: string; path: string };
type AccNode = AccFolder | AccFile;

function sortTreeNodes(
  nodes: NestedTreeNode[],
  pinSkillMarkdown = true,
  files: SkillFile[] = [],
) {
  const addedIndex = new Map<string, number>();
  files.forEach((file, index) => {
    if (file.change === "added") addedIndex.set(trimFolderMark(file.path), index);
  });
  return [...nodes].sort((left, right) => {
    const leftAdded = addedIndex.get(trimFolderMark(left.path));
    const rightAdded = addedIndex.get(trimFolderMark(right.path));
    if (leftAdded !== undefined || rightAdded !== undefined) {
      if (leftAdded === undefined) return 1;
      if (rightAdded === undefined) return -1;
      return rightAdded - leftAdded;
    }
    if (isWorkspaceMemoryFile(left.path)) return -1;
    if (isWorkspaceMemoryFile(right.path)) return 1;
    if (left.type !== right.type) return left.type === "folder" ? -1 : 1;
    if (pinSkillMarkdown) {
      if (isRootSkillMarkdown(left.path)) return -1;
      if (isRootSkillMarkdown(right.path)) return 1;
    }
    return left.name.localeCompare(right.name, "zh");
  });
}

export function buildNestedFileTree(
  files: SkillFile[],
  pinSkillMarkdown = true,
): NestedTreeNode[] {
  const root = new Map<string, AccNode>();

  function ensureFolder(segments: string[]): AccFolder {
    let map = root;
    let folder: AccFolder | undefined;
    let currentPath = "";
    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      let node = map.get(segment);
      if (!node || node.type !== "folder") {
        node = {
          type: "folder",
          name: segment,
          path: currentPath,
          children: new Map(),
        };
        map.set(segment, node);
      }
      folder = node;
      map = node.children;
    }
    return folder!;
  }

  [...files]
    .sort((left, right) => left.path.localeCompare(right.path))
    .forEach((file) => {
      if (isFolderPlaceholder(file.path)) {
        const parts = trimFolderMark(file.path).split("/").filter(Boolean);
        if (parts.length) ensureFolder(parts);
        return;
      }
      const parts = file.path.split("/").filter(Boolean);
      const name = parts.pop();
      if (!name) return;
      const map = parts.length ? ensureFolder(parts).children : root;
      map.set(name, { type: "file", name, path: file.path });
    });

  function toList(map: Map<string, AccNode>): NestedTreeNode[] {
    const nodes: NestedTreeNode[] = [...map.values()].map((node) =>
      node.type === "folder"
        ? {
            type: "folder" as const,
            name: node.name,
            path: node.path,
            children: toList(node.children),
          }
        : { type: "file" as const, name: node.name, path: node.path }
    );
    return sortTreeNodes(nodes, pinSkillMarkdown, files);
  }

  return toList(root);
}

export function listFolderPaths(files: SkillFile[]): string[] {
  const folders = new Set<string>();
  files.forEach((file) => {
    const clean = trimFolderMark(file.path);
    const parts = clean.split("/").filter(Boolean);
    const depth = isFolderPlaceholder(file.path) ? parts.length : Math.max(0, parts.length - 1);
    let acc = "";
    for (let index = 0; index < depth; index += 1) {
      acc = acc ? `${acc}/${parts[index]}` : parts[index];
      folders.add(acc);
    }
  });
  return [...folders].sort((left, right) => left.localeCompare(right, "zh"));
}

function findFolderNode(nodes: NestedTreeNode[], path: string): NestedFolderNode | undefined {
  for (const node of nodes) {
    if (node.type !== "folder") continue;
    if (node.path === path) return node;
    const nested = findFolderNode(node.children, path);
    if (nested) return nested;
  }
  return undefined;
}

export function siblingNames(files: SkillFile[], dir: string, ignorePath?: string) {
  const parent = trimFolderMark(dir);
  const tree = buildNestedFileTree(files);
  const nodes = parent ? (findFolderNode(tree, parent)?.children ?? []) : tree;
  const names = new Set<string>();
  nodes.forEach((node) => {
    if (ignorePath && trimFolderMark(node.path) === trimFolderMark(ignorePath)) return;
    names.add(node.name.toLowerCase());
  });
  return names;
}

const ILLEGAL_NAME = /[\\/:*?"<>|\u0000-\u001f]/;

export function validateEntryName(
  rawName: string,
  taken: Set<string>,
  ignoreName?: string
): string {
  const name = rawName.trim();
  if (!name) return "请输入名称";
  if (name === "." || name === "..") return "名称不合法";
  if (ILLEGAL_NAME.test(name)) return "不能包含 \\ / : * ? \" < > |";
  if (name.length > 80) return "名称过长";
  if (name.toLowerCase() !== ignoreName?.toLowerCase() && taken.has(name.toLowerCase())) {
    return "同级目录下已有同名项";
  }
  return "";
}

function dropFolderPlaceholder(files: SkillFile[], dir: string) {
  if (!dir) return files;
  const mark = folderPathOf(dir);
  return files.filter((file) => file.path !== mark);
}

export function createFileEntry(files: SkillFile[], dir: string, name: string): SkillFile[] {
  const path = joinPath(dir, name);
  return [
    ...dropFolderPlaceholder(files, dir).filter((file) => file.path !== path),
    { path, content: "", change: "added", sizeLabel: "0 B", updatedAt: stampNow() },
  ];
}

export function createFolderEntry(files: SkillFile[], dir: string, name: string): SkillFile[] {
  const path = folderPathOf(joinPath(dir, name));
  const exists = files.some(
    (file) => file.path === path || trimFolderMark(file.path) === trimFolderMark(path)
  );
  if (exists) return files;
  return [...dropFolderPlaceholder(files, dir), { path, content: "" }];
}

export function renameEntry(
  files: SkillFile[],
  path: string,
  nextName: string,
  isFolder: boolean,
  protectSkillMarkdown = true,
  protectWorkspaceMemory = false,
): SkillFile[] {
  if (isProtectedEntry(path, isFolder, protectSkillMarkdown, protectWorkspaceMemory)) return files;
  const dir = parentDir(path);
  const nextBase = joinPath(dir, nextName);
  if (isFolder) {
    const from = trimFolderMark(path);
    return files.map((file) => {
      const current = file.path;
      if (current === from || current === `${from}/` || current.startsWith(`${from}/`)) {
        return { ...file, path: `${nextBase}${current.slice(from.length)}` };
      }
      return file;
    });
  }
  return files.map((file) => (file.path === path ? { ...file, path: nextBase } : file));
}

export function deleteEntry(files: SkillFile[], path: string, isFolder: boolean): SkillFile[] {
  if (!isFolder) {
    return files.filter((file) => file.path !== path);
  }
  const from = trimFolderMark(path);
  return files.filter((file) => {
    const current = file.path;
    return current !== from && current !== `${from}/` && !current.startsWith(`${from}/`);
  });
}

export function canMoveTo(
  path: string,
  targetDir: string,
  isFolder: boolean,
  protectSkillMarkdown = true,
  protectWorkspaceMemory = false,
) {
  if (isProtectedEntry(path, isFolder, protectSkillMarkdown, protectWorkspaceMemory)) return false;
  if (parentDir(path) === targetDir) return false;
  if (!isFolder) return true;
  const from = trimFolderMark(path);
  return targetDir !== from && !targetDir.startsWith(`${from}/`);
}

export function moveEntry(
  files: SkillFile[],
  path: string,
  targetDir: string,
  isFolder: boolean,
  protectSkillMarkdown = true,
  protectWorkspaceMemory = false,
): SkillFile[] {
  if (!canMoveTo(path, targetDir, isFolder, protectSkillMarkdown, protectWorkspaceMemory)) return files;
  const name = entryName(path);
  const nextBase = joinPath(targetDir, name);
  if (isFolder) {
    const from = trimFolderMark(path);
    return dropFolderPlaceholder(
      files.map((file) => {
        const current = file.path;
        if (current === from || current === `${from}/` || current.startsWith(`${from}/`)) {
          return { ...file, path: `${nextBase}${current.slice(from.length)}` };
        }
        return file;
      }),
      targetDir
    );
  }
  return dropFolderPlaceholder(
    files.map((file) => (file.path === path ? { ...file, path: nextBase } : file)),
    targetDir
  );
}

export function collectEntryFiles(files: SkillFile[], path: string, isFolder: boolean): SkillFile[] {
  if (!isFolder) {
    const file = files.find((item) => item.path === path);
    return file ? [{ ...file }] : [];
  }
  const from = trimFolderMark(path);
  return files
    .filter((file) => {
      const current = file.path;
      return current === from || current === `${from}/` || current.startsWith(`${from}/`);
    })
    .map((file) => ({ ...file }));
}

export function uniqueName(name: string, taken: Set<string>): string {
  if (!taken.has(name.toLowerCase())) return name;
  const extMatch = name.match(/^(.*?)(\.[A-Za-z0-9]{1,8})$/);
  const rawBase = extMatch ? extMatch[1] : name;
  const ext = extMatch ? extMatch[2] : "";
  const base = rawBase.replace(/（\d+）$/, "");
  let index = 1;
  let candidate = `${base}（${index}）${ext}`;
  while (taken.has(candidate.toLowerCase())) {
    index += 1;
    candidate = `${base}（${index}）${ext}`;
  }
  return candidate;
}

export function canPasteTo(
  path: string,
  targetDir: string,
  isFolder: boolean,
  mode: "copy" | "cut",
  protectSkillMarkdown = true,
  protectWorkspaceMemory = false,
) {
  if (mode === "copy" && isProtectedEntry(path, isFolder, false, protectWorkspaceMemory)) return false;
  if (mode === "cut" && isProtectedEntry(path, isFolder, protectSkillMarkdown, protectWorkspaceMemory)) {
    return false;
  }
  if (isFolder) {
    const from = trimFolderMark(path);
    if (targetDir === from || targetDir.startsWith(`${from}/`)) return false;
  }
  if (mode === "cut" && parentDir(path) === targetDir) return false;
  return true;
}

function remapEntryPaths(
  entries: SkillFile[],
  fromPath: string,
  nextBase: string,
  isFolder: boolean
): SkillFile[] {
  if (!isFolder) {
    return entries.map((file) =>
      file.path === fromPath ? { ...file, path: nextBase } : file
    );
  }
  const from = trimFolderMark(fromPath);
  return entries.map((file) => {
    const current = file.path;
    if (current === from || current === `${from}/` || current.startsWith(`${from}/`)) {
      return { ...file, path: `${nextBase}${current.slice(from.length)}` };
    }
    return file;
  });
}

export function pasteEntry(
  files: SkillFile[],
  sourcePath: string,
  isFolder: boolean,
  targetDir: string,
  mode: "copy" | "cut",
  protectSkillMarkdown = true,
  protectWorkspaceMemory = false,
): { files: SkillFile[]; pastedPath: string } | null {
  if (!canPasteTo(sourcePath, targetDir, isFolder, mode, protectSkillMarkdown, protectWorkspaceMemory)) {
    return null;
  }
  const sourceFiles = collectEntryFiles(files, sourcePath, isFolder);
  if (!sourceFiles.length) return null;

  if (mode === "cut") {
    const name = uniqueName(entryName(sourcePath), siblingNames(files, targetDir, sourcePath));
    const nextBase = joinPath(targetDir, name);
    return {
      files: dropFolderPlaceholder(
        remapEntryPaths(files, sourcePath, nextBase, isFolder),
        targetDir
      ),
      pastedPath: nextBase,
    };
  }

  const name = uniqueName(entryName(sourcePath), siblingNames(files, targetDir));
  const nextBase = joinPath(targetDir, name);
  const copied = remapEntryPaths(sourceFiles, sourcePath, nextBase, isFolder).map((file) => ({
    ...file,
    change: isFolderPlaceholder(file.path) ? file.change : ("added" as const),
  }));
  return {
    files: dropFolderPlaceholder([...files, ...copied], targetDir),
    pastedPath: nextBase,
  };
}

export function realFiles(files: SkillFile[]) {
  return files.filter((file) => !isFolderPlaceholder(file.path));
}

export const WORKSPACE_TRASH_DIR = "回收站";

export function isWorkspaceTrashPath(path: string) {
  const clean = trimFolderMark(path);
  return clean === WORKSPACE_TRASH_DIR || clean.startsWith(`${WORKSPACE_TRASH_DIR}/`);
}

export function restoreTrashEntry(files: SkillFile[], trashPath: string): SkillFile[] | null {
  const file = files.find((item) => item.path === trashPath && !isFolderPlaceholder(item.path));
  if (!file || !isWorkspaceTrashPath(trashPath)) return null;
  const target = file.trashedFrom?.trim() || joinPath("附件", entryName(trashPath));
  if (files.some((item) => item.path === target)) return null;
  const { trashDaysRemaining: _days, trashedFrom: _from, ...rest } = file;
  const restored: SkillFile = { ...rest, path: target, updatedAt: stampNow() };
  return files.filter((item) => item.path !== trashPath).concat(restored);
}

export function permanentDeleteEntry(
  files: SkillFile[],
  path: string,
  isFolder: boolean,
): SkillFile[] {
  if (!isWorkspaceTrashPath(path)) return files;
  if (isFolder) {
    const prefix = trimFolderMark(path);
    return files.filter((item) => {
      const current = trimFolderMark(item.path);
      return current !== prefix && !current.startsWith(`${prefix}/`);
    });
  }
  return files.filter((item) => item.path !== path);
}

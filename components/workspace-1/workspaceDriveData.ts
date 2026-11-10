import type { SkillFile } from "@/components/skillhub-v2/types";

export type DriveNode = {
  id: string;
  name: string;
  kind: "folder" | "file";
  sizeLabel?: string;
  updatedAt?: string;
  updatedBy?: string;
  preview?: string;
  trashDaysRemaining?: number;
  trashedFrom?: string;
  children?: DriveNode[];
};

export const WORKSPACE_ROOT_FOLDERS = ["附件", "对话产物", "回收站"] as const;

export const WORKSPACE_MEMORY_CONTENT = `# 工作空间记忆

## 当前空间
- 名称：我的空间
- 用途：用户上传的附件与对话中产生的文件

## 目录约定
- 附件：用户上传
- 对话产物：Claw 产出
- 回收站：删除后待清理

## 使用偏好
- 引用文件时优先结合原文片段
- HTML 预览按节点引用源码
`;

export const DRIVE_ROOTS: DriveNode[] = [
  {
    id: "attachments",
    name: "附件",
    kind: "folder",
    children: [
      {
        id: "upload-memo",
        name: "网盘使用备忘.md",
        kind: "file",
        sizeLabel: "6 KB",
        updatedAt: "2026-10-21 11:05",
        updatedBy: "周天野",
        preview:
          "# 备忘\n\n- 用户上传的文件放在「附件」\n- 对话中 Claw 生成的文件放在「对话产物」\n- 删除后的文件进入「回收站」，到期自动清理",
      },
      {
        id: "receipt-note",
        name: "票据说明.txt",
        kind: "file",
        sizeLabel: "1 KB",
        updatedAt: "2026-10-20 09:12",
        updatedBy: "邸若楠",
        preview: "示例：用户从对话或本地上传的附件会归档在此目录。",
      },
    ],
  },
  {
    id: "artifacts",
    name: "对话产物",
    kind: "folder",
    children: [
      {
        id: "inspection",
        name: "巡检摘要.md",
        kind: "file",
        sizeLabel: "22 KB",
        updatedAt: "2026-10-22 08:16",
        updatedBy: "系统任务",
        preview:
          "# 巡检摘要\n\n夜间巡检已完成。网关错误率回落，数据库连接数稳定。摘要已写入工作空间。",
      },
      {
        id: "meeting",
        name: "会议纪要.md",
        kind: "file",
        sizeLabel: "15 KB",
        updatedAt: "2026-10-17 19:04",
        updatedBy: "邸若楠",
        preview: "# 会议纪要\n\n工作空间仅保留附件、对话产物与回收站三个顶层目录。",
      },
      {
        id: "quote-demo-html",
        name: "引用示例.html",
        kind: "file",
        sizeLabel: "3 KB",
        updatedAt: "2026-10-22 14:30",
        updatedBy: "系统任务",
        preview: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>工作空间 HTML 引用示例</title>
</head>
<body>
  <header>
    <h1>HTML 引用示例</h1>
    <p>本文件放在「对话产物」目录，用于体验预览区右键引用整份 HTML。</p>
  </header>
  <main>
    <section>
      <h2>操作说明</h2>
      <ul>
        <li>在预览区任意位置右键，选择「引用文件」</li>
        <li>底栏会出现本文件附件，可继续输入问题后发送</li>
      </ul>
    </section>
  </main>
</body>
</html>`,
      },
    ],
  },
  {
    id: "trash",
    name: "回收站",
    kind: "folder",
    children: [
      {
        id: "old-draft",
        name: "旧草稿.md",
        kind: "file",
        sizeLabel: "3 KB",
        updatedAt: "2026-09-30 21:11",
        updatedBy: "周天野",
        trashDaysRemaining: 27,
        trashedFrom: "对话产物/旧草稿.md",
        preview: "这是一份已移入回收站的草稿，打开后只读预览。",
      },
      {
        id: "removed-upload",
        name: "临时导出.csv",
        kind: "file",
        sizeLabel: "4 KB",
        updatedAt: "2026-10-01 14:20",
        updatedBy: "周天野",
        trashDaysRemaining: 12,
        trashedFrom: "附件/临时导出.csv",
        preview: "事项,状态\n导出,已删除",
      },
    ],
  },
];

export const DRIVE_INITIAL_EXPANDED: string[] = [];

export function createDriveId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function findDrivePath(
  nodes: DriveNode[],
  id: string,
  trail: DriveNode[] = [],
): DriveNode[] | null {
  for (const node of nodes) {
    const next = [...trail, node];
    if (node.id === id) return next;
    if (node.children) {
      const found = findDrivePath(node.children, id, next);
      if (found) return found;
    }
  }
  return null;
}

export function mapDriveNodes(
  nodes: DriveNode[],
  id: string,
  updater: (node: DriveNode) => DriveNode,
): DriveNode[] {
  return nodes.map((node) => {
    if (node.id === id) return updater(node);
    if (!node.children) return node;
    return { ...node, children: mapDriveNodes(node.children, id, updater) };
  });
}

export function filterDriveTree(nodes: DriveNode[], query: string): DriveNode[] {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return nodes;

  const walk = (list: DriveNode[]): DriveNode[] => {
    const matched: DriveNode[] = [];
    for (const node of list) {
      const selfMatched = node.name.toLowerCase().includes(keyword);
      if (node.kind === "folder") {
        if (selfMatched) {
          matched.push(node);
          continue;
        }
        const children = walk(node.children ?? []);
        if (children.length > 0) matched.push({ ...node, children });
        continue;
      }
      if (selfMatched) matched.push(node);
    }
    return matched;
  };

  return walk(nodes);
}

export type DriveConversation = {
  id: string;
  title: string;
  updatedLabel: string;
};

export const WORKSPACE_CONVERSATION_PREVIEW = 5;

export type DriveSpace = {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  files: SkillFile[];
  conversations: DriveConversation[];
};

export function createInitialSpaces(): DriveSpace[] {
  return [
    {
      id: "space-default",
      name: "我的空间",
      description: "用户上传的附件与对话中产生的文件。",
      isDefault: true,
      files: workspaceDriveFiles(),
      conversations: [
        { id: "c-default-1", title: "整理工作空间说明", updatedLabel: "刚刚" },
        { id: "c-default-2", title: "网盘目录怎么分", updatedLabel: "11小时前" },
        { id: "c-default-3", title: "对话产物归档", updatedLabel: "1天前" },
        { id: "c-default-4", title: "引用 HTML 示例", updatedLabel: "2天前" },
        { id: "c-default-5", title: "回收站里的草稿", updatedLabel: "3天前" },
      ],
    },
  ];
}

export function summarizeSpaceFiles(files: SkillFile[]) {
  let fileCount = 0;
  const folders = new Set<string>();
  for (const file of files) {
    if (file.path.endsWith("/")) {
      const folder = file.path.slice(0, -1);
      if (folder) folders.add(folder);
      continue;
    }
    fileCount += 1;
    const slash = file.path.lastIndexOf("/");
    if (slash > 0) {
      const parts = file.path.slice(0, slash).split("/");
      for (let index = 1; index <= parts.length; index += 1) {
        folders.add(parts.slice(0, index).join("/"));
      }
    }
  }
  return { fileCount, folderCount: folders.size };
}

export function validateSpaceName(name: string, spaces: DriveSpace[], ignoreId?: string) {
  const trimmed = name.trim();
  if (!trimmed) return "请填写空间名称";
  if (trimmed.length > 32) return "名称不超过 32 个字";
  if (/[\\/]/.test(trimmed)) return "名称里不要用斜杠";
  if (spaces.some((space) => space.id !== ignoreId && space.name === trimmed)) return "已经有同名空间";
  return null;
}

export function createSpaceId() {
  return `space-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function workspaceDriveFiles(): SkillFile[] {
  const files: SkillFile[] = [
    {
      path: "memory.md",
      content: WORKSPACE_MEMORY_CONTENT,
      change: "unchanged",
      sizeLabel: "1 KB",
      updatedAt: "2026-10-27 14:20",
    },
  ];
  const walk = (nodes: DriveNode[], prefix: string) => {
    for (const node of nodes) {
      const path = prefix ? `${prefix}/${node.name}` : node.name;
      if (node.kind === "folder") {
        const children = node.children ?? [];
        if (children.length === 0) {
          files.push({ path: `${path}/`, content: "" });
        } else {
          walk(children, path);
        }
        continue;
      }
      files.push({
        path,
        content: node.preview ?? "",
        change: "unchanged",
        sizeLabel: node.sizeLabel,
        updatedAt: node.updatedAt,
        trashDaysRemaining: node.trashDaysRemaining,
        trashedFrom: node.trashedFrom,
      });
    }
  };
  walk(DRIVE_ROOTS, "");
  return files;
}

export function collectFolderIds(nodes: DriveNode[]): string[] {
  const ids: string[] = [];
  const walk = (list: DriveNode[]) => {
    for (const node of list) {
      if (node.kind !== "folder") continue;
      ids.push(node.id);
      if (node.children) walk(node.children);
    }
  };
  walk(nodes);
  return ids;
}

export type WorkspaceDeliverableKind = "artifact" | "attachment";

export type WorkspaceDeliverable = {
  id: string;
  name: string;
  path: string;
  kind: WorkspaceDeliverableKind;
  sizeLabel: string;
  updatedLabel: string;
};

/** 当前会话侧栏展示的产物与附件（原型静态数据，路径与工作空间一致） */
export function workspaceSessionDeliverables(): WorkspaceDeliverable[] {
  return [
    {
      id: "del-art-1",
      name: "巡检摘要.md",
      path: "对话产物/巡检摘要.md",
      kind: "artifact",
      sizeLabel: "22 KB",
      updatedLabel: "今天 08:16",
    },
    {
      id: "del-art-2",
      name: "引用示例.html",
      path: "对话产物/引用示例.html",
      kind: "artifact",
      sizeLabel: "3 KB",
      updatedLabel: "昨天",
    },
    {
      id: "del-att-1",
      name: "网盘使用备忘.md",
      path: "附件/网盘使用备忘.md",
      kind: "attachment",
      sizeLabel: "6 KB",
      updatedLabel: "2 天前",
    },
  ];
}

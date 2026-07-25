import type { LucideIcon } from "lucide-react";
import {
  Bot,
  FileText,
  FolderOpen,
  MessageSquarePlus,
  Puzzle,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";

export interface MyClawNavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export const MY_CLAW_PRIMARY_NAV: MyClawNavItem[] = [
  {
    key: "chat",
    label: "新建会话",
    href: "/my-claw",
    icon: MessageSquarePlus,
  },
  {
    key: "agents",
    label: "智能体广场",
    href: "/my-claw/agents",
    icon: Bot,
  },
  {
    key: "skills",
    label: "技能",
    href: "/my-claw/skills",
    icon: Sparkles,
  },
  {
    key: "plugins",
    label: "插件",
    href: "/my-claw/plugins",
    icon: Puzzle,
  },
  {
    key: "automation",
    label: "自动化任务",
    href: "/my-claw/automation",
    icon: Zap,
  },
];

export const MY_CLAW_SETTINGS_NAV: MyClawNavItem[] = [
  {
    key: "files",
    label: "文件",
    href: "/my-claw/files",
    icon: FolderOpen,
  },
  {
    key: "settings",
    label: "Claw配置",
    href: "/my-claw/settings",
    icon: Settings,
  },
  {
    key: "product",
    label: "产品说明",
    href: "/my-claw/product",
    icon: FileText,
  },
];

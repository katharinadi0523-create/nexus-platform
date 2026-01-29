"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Toaster } from "sonner";
import {
  Store,
  Database,
  FolderOpen,
  Brain,
  Notebook,
  Briefcase,
  Package,
  FileImage,
  HardDrive,
  HardDriveIcon,
  Key,
  Server,
  Cloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalHeader } from "@/components/layout/global-header";

interface MenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: "AI资产库",
    items: [
      {
        key: "ModelMarketplace",
        label: "模型广场",
        icon: Store,
        href: "/model-dev/model-marketplace",
      },
      {
        key: "DataManagement",
        label: "数据管理",
        icon: Database,
        href: "/model-dev/data-management",
      },
      {
        key: "MyDatasets",
        label: "我的数据集",
        icon: FolderOpen,
        href: "/model-dev/my-datasets",
      },
    ],
  },
  {
    title: "模型开发",
    items: [
      {
        key: "LargeModelTraining",
        label: "大模型训练",
        icon: Brain,
        href: "/model-dev/large-model-training",
      },
      {
        key: "NotebookModeling",
        label: "Notebook建模",
        icon: Notebook,
        href: "/model-dev/notebook-modeling",
      },
      {
        key: "JobModeling",
        label: "作业建模",
        icon: Briefcase,
        href: "/model-dev/job-modeling",
      },
    ],
  },
  {
    title: "模型管理",
    items: [
      {
        key: "MyModels",
        label: "我的模型",
        icon: Package,
        href: "/model-dev/my-models",
      },
      {
        key: "ModelEvaluation",
        label: "模型评估",
        icon: Brain,
        href: "/model-dev/model-evaluation",
      },
      {
        key: "EvaluationStrategy",
        label: "评估策略",
        icon: FileImage,
        href: "/model-dev/evaluation-strategy",
      },
    ],
  },
  {
    title: "服务管理",
    items: [
      {
        key: "OnlineServices",
        label: "在线服务",
        icon: Cloud,
        href: "/model-dev/online-services",
      },
    ],
  },
  {
    title: "镜像管理",
    items: [
      {
        key: "MyImages",
        label: "我的镜像",
        icon: FileImage,
        href: "/model-dev/my-images",
      },
    ],
  },
  {
    title: "运营中心",
    items: [
      {
        key: "ResourcePoolManagement",
        label: "资源池管理",
        icon: Server,
        href: "/model-dev/resource-pool-management",
      },
      {
        key: "StorageManagement",
        label: "存储管理",
        icon: HardDriveIcon,
        href: "/model-dev/storage-management",
      },
      {
        key: "ApiKey",
        label: "API-KEY",
        icon: Key,
        href: "/model-dev/api-key",
      },
    ],
  },
];

function Sidebar() {
  const pathname = usePathname();

  return (
      <div className="flex h-full flex-col">
        {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
          {menuGroups.map((group) => (
          <div key={group.title} className="mb-6">
            <div className="mb-2 px-3 text-xs font-medium text-gray-500 tracking-wider">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const linkClassName = cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                );
                
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                    className={linkClassName}
                    >
                    <Icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-gray-500")} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
    </div>
  );
}


export default function ModelDevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Redirect root /model-dev to /model-dev/online-services
  useEffect(() => {
    if (pathname === "/model-dev") {
      router.replace("/model-dev/online-services");
    }
  }, [pathname, router]);

  return (
    <>
      <GlobalHeader />
      <div className="flex h-screen overflow-hidden bg-slate-50 pt-[60px]">
        {/* 左侧侧边栏: 固定宽度 220px, z-50 */}
        <aside className="w-[220px] flex-none z-50 border-r bg-white h-[calc(100vh-60px)] hidden md:block">
        <Sidebar />
        </aside>
        {/* 右侧主体: 自动填满剩余空间 */}
        <main className="flex-1 flex flex-col h-[calc(100vh-60px)] overflow-hidden relative">
          {/* 页面内容滚动区 */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
        </div>
        </main>
      </div>
      <Toaster position="top-right" />
    </>
  );
}

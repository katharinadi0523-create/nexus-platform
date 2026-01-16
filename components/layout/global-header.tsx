"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Mock data for context switcher
interface Project {
  id: string;
  name: string;
}

interface Organization {
  id: string;
  name: string;
  projects: Project[];
}

const organizations: Organization[] = [
  {
    id: "app-dev",
    name: "应用开发平台",
    projects: [{ id: "app-dev-pm", name: "应用开发PM" }],
  },
  {
    id: "future",
    name: "未来事业部",
    projects: [
      { id: "research", name: "科研智能体研发" },
      { id: "gf", name: "GF项目" },
    ],
  },
  {
    id: "data-gov",
    name: "多模态数据治理平台",
    projects: [{ id: "military", name: "军工项目" }],
  },
  {
    id: "model",
    name: "模型平台",
    projects: [{ id: "model-train", name: "模型训练项目A" }],
  },
  {
    id: "base",
    name: "BASE",
    projects: [],
  },
];

// Current context (default to first project)
const defaultContext = {
  organization: organizations[0],
  project: organizations[0].projects[0],
};

// Platform navigation items
const platformNavItems = [
  { key: "app-dev", label: "应用开发平台", href: "/" },
  { key: "model-dev", label: "模型开发平台", href: "/model-dev" },
  { key: "data-gov", label: "多模态数据治理平台", href: "/data-gov" },
  { key: "vision", label: "视觉应用平台", href: "/vision" },
  { key: "office", label: "办公应用", href: "/office" },
  { key: "base-control", label: "基础管控平台", href: "/base-control" },
];

export function GlobalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(
    defaultContext.organization
  );
  const [selectedProject, setSelectedProject] = useState<Project | null>(
    defaultContext.project
  );
  const [isContextSwitcherOpen, setIsContextSwitcherOpen] = useState(false);

  // Determine active platform based on pathname
  const getActivePlatform = () => {
    if (
      pathname === "/" ||
      pathname.startsWith("/agent") ||
      pathname.startsWith("/agent-editor") ||
      pathname.startsWith("/app-marketplace") ||
      pathname.startsWith("/mcp-management") ||
      pathname.startsWith("/tool-marketplace") ||
      pathname.startsWith("/workflow") ||
      pathname.startsWith("/knowledge-base") ||
      pathname.startsWith("/database") ||
      pathname.startsWith("/term-bank") ||
      pathname.startsWith("/api-key") ||
      pathname.startsWith("/tag-management")
    ) {
      return "app-dev";
    }
    if (pathname.startsWith("/model-dev")) return "model-dev";
    if (pathname.startsWith("/data-gov")) return "data-gov";
    if (pathname.startsWith("/vision")) return "vision";
    if (pathname.startsWith("/office")) return "office";
    if (pathname.startsWith("/base-control")) return "base-control";
    return "app-dev";
  };

  const activePlatform = getActivePlatform();

  const handleProjectSelect = (org: Organization, project: Project) => {
    setSelectedOrg(org);
    setSelectedProject(project);
    setIsContextSwitcherOpen(false);
    // Here you could navigate or update context based on selection
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-white border-b border-gray-200">
      <div className="flex h-full items-center px-6 gap-6">
        {/* A. Branding Area */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-yellow-500" />
          <span className="text-lg font-bold text-gray-900">新星-AI平台</span>
        </div>

        {/* B. Context Switcher */}
        <Popover open={isContextSwitcherOpen} onOpenChange={setIsContextSwitcherOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-full hover:border-gray-400 transition-colors">
              <span className="text-sm text-gray-700">
                {selectedProject?.name || "选择项目"}
              </span>
              <Search className="h-4 w-4 text-gray-500" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[600px] p-0"
            align="start"
            sideOffset={8}
          >
            <div className="flex">
              {/* Left Pane - Organizations */}
              <div className="w-1/2 border-r border-gray-200">
                <div className="p-2">
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors",
                        selectedOrg?.id === org.id
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-gray-50 text-gray-700"
                      )}
                      onMouseEnter={() => setSelectedOrg(org)}
                    >
                      <span className="text-sm">{org.name}</span>
                      {org.projects.length > 0 && (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Pane - Projects */}
              <div className="w-1/2">
                <div className="p-2">
                  {selectedOrg && selectedOrg.projects.length > 0 ? (
                    selectedOrg.projects.map((project) => (
                      <div
                        key={project.id}
                        className={cn(
                          "px-3 py-2 rounded-md cursor-pointer transition-colors",
                          selectedProject?.id === project.id
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "hover:bg-gray-50 text-gray-700"
                        )}
                        onClick={() => handleProjectSelect(selectedOrg, project)}
                      >
                        <span className="text-sm">{project.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {selectedOrg?.name || "选择组织"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* C. Platform Navigation Menu */}
        <nav className="flex-1 flex items-center gap-1">
          {platformNavItems.map((item) => {
            const isActive = activePlatform === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors relative",
                  isActive
                    ? "text-blue-600 font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

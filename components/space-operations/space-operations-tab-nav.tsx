"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SPACE_OPERATIONS_TABS, spaceOperationsHref } from "@/lib/space-operations";
import { cn } from "@/lib/utils";

const linkClass =
  "inline-flex h-auto flex-none shrink-0 items-center whitespace-nowrap rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900";

const linkActiveClass = "border-blue-600 font-semibold text-blue-600";

function tabIsActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SpaceOperationsTabNav() {
  const pathname = usePathname();

  return (
    <div className="shrink-0 border-b border-slate-200/80 px-4 sm:px-6">
      <nav aria-label="空间运营" className="min-w-0 overflow-x-auto">
        <ul className="flex min-w-max list-none gap-1 p-0 m-0">
          {SPACE_OPERATIONS_TABS.map((tab) => {
            const href = spaceOperationsHref(tab.segment);
            const isActive = tabIsActive(pathname, href);

            return (
              <li key={tab.segment}>
                <Link href={href} className={cn(linkClass, isActive && linkActiveClass)} title={tab.label}>
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

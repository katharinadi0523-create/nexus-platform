"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function ManagementPageTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-[30px] font-semibold leading-none text-slate-950">{children}</h1>;
}

export function ManagementToolbar({
  searchValue,
  searchPlaceholder,
  onSearchChange,
  actions,
  className,
}: {
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", className)}>
      <div className="relative w-full max-w-[360px]">
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-8 rounded-[4px] border-slate-300 bg-white px-3 pr-9 text-sm shadow-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100"
        />
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>

      {actions ? <div className="flex items-center justify-end gap-2">{actions}</div> : null}
    </div>
  );
}

export function ManagementIconButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      className={cn(
        "h-8 w-8 rounded-[4px] border-slate-300 bg-white text-slate-600 shadow-none hover:bg-slate-50 hover:text-slate-900",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

export function ManagementPrimaryButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "h-8 rounded-[4px] bg-blue-600 px-4 text-sm font-medium text-white shadow-none hover:bg-blue-700",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

export function ManagementSecondaryButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      className={cn(
        "h-8 rounded-[4px] border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 shadow-none hover:bg-slate-50 hover:text-slate-900",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

export function ManagementTableFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-[6px] border border-slate-200 bg-white", className)}>
      {children}
    </section>
  );
}

export function ManagementTable({ children, className }: { children: ReactNode; className?: string }) {
  return <Table className={cn("min-w-[1120px]", className)}>{children}</Table>;
}

export function ManagementTableHeader({ children }: { children: ReactNode }) {
  return (
    <TableHeader className="bg-slate-50">
      <TableRow className="border-slate-200 hover:bg-slate-50">{children}</TableRow>
    </TableHeader>
  );
}

export function ManagementTableHead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <TableHead className={cn("h-10 px-4 text-left text-sm font-medium text-slate-700", className)}>
      {children}
    </TableHead>
  );
}

export function ManagementTableBody({ children }: { children: ReactNode }) {
  return <TableBody>{children}</TableBody>;
}

export function ManagementRow({
  children,
  selected,
}: {
  children: ReactNode;
  selected?: boolean;
}) {
  return (
    <TableRow className={cn("border-slate-200 bg-white hover:bg-slate-50/40", selected && "bg-blue-50/70 hover:bg-blue-50")}>
      {children}
    </TableRow>
  );
}

export function ManagementCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <TableCell className={cn("px-4 py-3 align-middle text-sm text-slate-800", className)}>{children}</TableCell>;
}

export function ManagementEmptyRow({
  colSpan,
  title = "暂无匹配结果",
  description,
}: {
  colSpan: number;
  title?: string;
  description: string;
}) {
  return (
    <TableRow className="border-0 hover:bg-transparent">
      <TableCell colSpan={colSpan} className="px-6 py-16 text-center">
        <div className="mx-auto max-w-md space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[6px] border border-slate-200 bg-slate-50 text-slate-500">
            <Search className="h-5 w-5" />
          </div>
          <div className="text-lg font-semibold text-slate-900">{title}</div>
          <p className="text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ManagementStatusDot({
  label,
  active,
  inactiveClassName,
}: {
  label: string;
  active: boolean;
  inactiveClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-slate-800">
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : inactiveClassName ?? "bg-slate-400")} />
      {label}
    </span>
  );
}

export function ManagementRowActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">{children}</div>;
}

export function ManagementTextAction({
  children,
  disabled,
  className,
  ...props
}: React.ComponentProps<"button"> & { disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "font-medium text-blue-600 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:text-slate-400",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

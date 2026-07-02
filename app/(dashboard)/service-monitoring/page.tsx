"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { MetricCardsGrid } from "@/components/service-monitoring/metric-card";
import { TimeRangeToolbar } from "@/components/service-monitoring/time-range-toolbar";
import {
  SERVICE_MONITORING_OVERVIEW,
  formatFailureRate,
  type AuthMethod,
  type ServiceType,
  type TimeRangePreset,
} from "@/lib/mock/service-monitoring";

const ITEMS_PER_PAGE = 10;

const ALL_SERVICE_TYPES: ServiceType[] = ["智能体", "工作流", "插件"];
const ALL_AUTH_METHODS: AuthMethod[] = ["Session", "ApiKey"];

export default function ServiceMonitoringPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = ITEMS_PER_PAGE;
  const [timePreset, setTimePreset] = useState<TimeRangePreset>("7d");
  const [selectedTypes, setSelectedTypes] = useState<ServiceType[]>([]);
  const [selectedAuthMethods, setSelectedAuthMethods] = useState<AuthMethod[]>([]);

  const filteredServices = useMemo(() => {
    return SERVICE_MONITORING_OVERVIEW.services.filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(service.type);
      const matchesAuth =
        selectedAuthMethods.length === 0 ||
        selectedAuthMethods.includes(service.authMethod);
      return matchesSearch && matchesType && matchesAuth;
    });
  }, [searchQuery, selectedAuthMethods, selectedTypes]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / itemsPerPage));
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleType = (type: ServiceType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
    setCurrentPage(1);
  };

  const toggleAuthMethod = (method: AuthMethod) => {
    setSelectedAuthMethods((prev) =>
      prev.includes(method)
        ? prev.filter((item) => item !== method)
        : [...prev, method]
    );
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">服务监控</h1>
        <TimeRangeToolbar preset={timePreset} onPresetChange={setTimePreset} />
      </div>

      <MetricCardsGrid metrics={SERVICE_MONITORING_OVERVIEW.metrics} />

      <div className="relative max-w-sm">
        <Input
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setCurrentPage(1);
          }}
          placeholder="搜索服务名称"
          className="pr-9"
        />
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>

      <div className="overflow-hidden rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">服务名称</TableHead>
              <TableHead className="min-w-[220px]">服务描述</TableHead>
              <TableHead className="min-w-[100px]">
                <div className="flex items-center gap-1">
                  类型
                  <ColumnFilter
                    label="类型"
                    options={ALL_SERVICE_TYPES}
                    selected={selectedTypes}
                    onToggle={(value) => toggleType(value as ServiceType)}
                  />
                </div>
              </TableHead>
              <TableHead className="min-w-[110px]">
                <div className="flex items-center gap-1">
                  鉴权方式
                  <ColumnFilter
                    label="鉴权方式"
                    options={ALL_AUTH_METHODS}
                    selected={selectedAuthMethods}
                    onToggle={(value) => toggleAuthMethod(value as AuthMethod)}
                  />
                </div>
              </TableHead>
              <TableHead className="min-w-[100px] text-right">总调用量</TableHead>
              <TableHead className="min-w-[120px] text-right">总消耗Token</TableHead>
              <TableHead className="min-w-[100px] text-right">调用成功量</TableHead>
              <TableHead className="min-w-[100px] text-right">调用失败量</TableHead>
              <TableHead className="min-w-[90px] text-right">失败率</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              paginatedServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <Link
                      href={`/service-monitoring/${service.id}`}
                      className="font-medium text-[#2773ff] hover:underline"
                    >
                      {service.name}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-slate-600">
                    {service.description}
                  </TableCell>
                  <TableCell>{service.type}</TableCell>
                  <TableCell>{service.authMethod}</TableCell>
                  <TableCell className="text-right">{service.totalCalls}</TableCell>
                  <TableCell className="text-right">
                    {service.totalTokens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{service.successCalls}</TableCell>
                  <TableCell className="text-right">{service.failedCalls}</TableCell>
                  <TableCell className="text-right">
                    {formatFailureRate(service.failureRate)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredServices.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">共 {filteredServices.length} 条</div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ‹
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = index + 1;
                } else if (currentPage <= 3) {
                  pageNum = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + index;
                } else {
                  pageNum = currentPage - 2 + index;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                ›
              </Button>
            </div>
            <Button variant="outline" size="sm" className="h-8">
              {itemsPerPage} 条/页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ColumnFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

function ColumnFilter({ label, options, selected, onToggle }: ColumnFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="rounded p-0.5 text-slate-400 hover:text-slate-600">
          <Filter className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-44 p-3">
        <div className="mb-2 text-sm font-medium text-slate-700">筛选{label}</div>
        <div className="space-y-2">
          {options.map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={selected.includes(option)}
                onCheckedChange={() => onToggle(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

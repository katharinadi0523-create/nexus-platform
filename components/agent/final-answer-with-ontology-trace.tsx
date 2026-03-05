"use client";

import React, { useMemo, useState } from "react";
import { Anchor, Box, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

type OntologyPropertyDef = {
  fieldName: string;
  displayName: string;
  fieldType: string;
};

type OntologyMetadata = {
  basicInfo: Record<string, string>;
  propertiesDef: OntologyPropertyDef[];
};

type OntologyInstance = {
  type: string;
  title: string;
  path: string | null;
  properties: Record<string, string>;
  metadata: OntologyMetadata;
};

type OntologyMap = Record<string, OntologyInstance>;

// ---------------------------------------------------------------------------
// 模拟 Markdown 与本体数据（用于 Step 5 最终答案）
// ---------------------------------------------------------------------------
const mockMarkdown = `
### 研判报告
**1. 身份确认**
* 目标 I: USS John Finn (DDG-113) <onto_ref id="DDG-113"></onto_ref>
* 目标 II: USNS Bowditch (TAGS-62) <onto_ref id="TAGS-62"></onto_ref>
* 依据: 关联冲绳基地 HUMINT 情报 <onto_ref id="Report_Obj_088"></onto_ref>，经时空计算确认编队构成与离港时间完全匹配。

**2. 威胁评估: [高 - 常态化巡航]**
* 能力评估: DDG-113 具备区域防空能力，属于高能力平台。 <onto_ref id="DDG-113"></onto_ref>
`;

const mockOntologyData: OntologyMap = {
  "DDG-113": {
    type: "Ship",
    title: "USS John Finn (DDG-113)",
    path: "[情报 Report_088] ━━(包含主体)━━▶ [DDG-113]",
    properties: {
      航速: "13.5节",
      战术能力: "区域防空",
      武器状态: "主炮归零",
    },
    metadata: {
      basicInfo: {
        对象名称: "水面舰艇",
        对象类型唯一标识: "Ship",
        业务定义: "具备一定排水量，主要在水面执行作战、运输或测量任务的船只。",
        更新时间: "2026-02-27 08:00:00",
      },
      propertiesDef: [
        { fieldName: "hull_number", displayName: "弦号", fieldType: "String" },
        {
          fieldName: "combat_capability",
          displayName: "战术能力",
          fieldType: "Enum",
        },
        {
          fieldName: "weapon_status",
          displayName: "武器状态",
          fieldType: "String",
        },
      ],
    },
  },
  "TAGS-62": {
    type: "Ship",
    title: "USNS Bowditch (TAGS-62)",
    path: "[情报 Report_088] ━━(伴随目标)━━▶ [TAGS-62]",
    properties: {
      航速: "12.0节",
      战术能力: "测量与情报支援",
      舰种: "测量船",
    },
    metadata: {
      basicInfo: {
        对象名称: "测量船",
        对象类型唯一标识: "SurveyShip",
        业务定义:
          "主要用于水文测量、地质勘测或情报支援等任务的非作战主力舰艇。",
        更新时间: "2026-02-27 08:10:00",
      },
      propertiesDef: [
        {
          fieldName: "hull_number",
          displayName: "弦号",
          fieldType: "String",
        },
        {
          fieldName: "mission_type",
          displayName: "任务类型",
          fieldType: "Enum",
        },
        {
          fieldName: "support_role",
          displayName: "支援角色",
          fieldType: "String",
        },
      ],
    },
  },
  Report_Obj_088: {
    type: "IntelligenceReport",
    title: "冲绳基地视觉确认情报",
    path: null,
    properties: {
      地点: "Okinawa",
      置信度: "High",
      摘要: "Visual confirmation of DDG departure.",
    },
    metadata: {
      basicInfo: {
        对象名称: "情报报告",
        对象类型唯一标识: "IntelligenceReport",
        业务定义:
          "对特定事件、目标或区域的情报信息进行汇总、整理和结构化记录的报告实体。",
        更新时间: "2026-02-27 08:05:00",
      },
      propertiesDef: [
        {
          fieldName: "report_id",
          displayName: "报告编号",
          fieldType: "String",
        },
        {
          fieldName: "location",
          displayName: "地点",
          fieldType: "String",
        },
        {
          fieldName: "confidence",
          displayName: "置信度",
          fieldType: "Enum",
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// 内联引用角标 Badge
// ---------------------------------------------------------------------------
interface CitationBadgeProps {
  id: string;
  index: number;
  onClick: (id: string) => void;
}

function CitationBadge({ id, index, onClick }: CitationBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onClick(id)}
            className="inline-flex align-baseline ml-1 focus-visible:outline-none"
          >
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-1.5 py-0 text-[10px] font-semibold text-violet-700 shadow-[0_0_0_1px_rgba(124,58,237,0.06)] hover:bg-violet-100"
            >
              <Anchor className="w-2.5 h-2.5" />
              <span className="leading-none">{index}</span>
            </Badge>
            <span className="sr-only">跳转到本体溯源 {id}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="font-mono">
          {id}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** 态势感知智能体：本体图谱页（MDP 台海态势模拟） */
const ONTOLOGY_VIEW_URL =
  "https://mdp.mydemo.top/mdp/%E6%9C%AC%E4%BD%93%E5%9C%BA%E6%99%AF%E5%BA%93/%E6%BC%94%E7%A4%BA1-%E5%8F%B0%E6%B5%B7%E6%83%85%E5%8A%BF%E6%A8%A1%E6%8B%9F?tab=%E6%9C%AC%E4%BD%93%E5%9B%BE%E8%B0%B1";

// ---------------------------------------------------------------------------
// 本体溯源弹窗
// ---------------------------------------------------------------------------
interface OntologyTraceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string | null;
  ontologyMap?: OntologyMap;
}

function OntologyTraceModal({
  open,
  onOpenChange,
  entityId,
  ontologyMap,
}: OntologyTraceModalProps) {
  const dataSource = ontologyMap ?? mockOntologyData;
  const instance = entityId ? dataSource[entityId] : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Box className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-semibold text-slate-900">
              {instance?.type ?? "未知类型"}
            </span>
            {instance?.title && (
              <span className="text-sm text-slate-600 truncate">
                · {instance.title}
              </span>
            )}
          </DialogTitle>
          <a
            href={ONTOLOGY_VIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            查看本体
          </a>
        </DialogHeader>

        {!instance && (
          <div className="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            暂未找到 ID 为 <span className="font-mono">{entityId}</span> 的本体实例。
          </div>
        )}

        {instance && (
          <div className="mt-3 space-y-4">
            <Tabs defaultValue="instance" className="w-full">
              <TabsList>
                <TabsTrigger value="instance">溯源实例</TabsTrigger>
                <TabsTrigger value="metadata">元数据</TabsTrigger>
              </TabsList>

              <TabsContent value="instance" className="mt-3 space-y-3">
                {instance.path && (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 font-mono">
                    {instance.path}
                  </div>
                )}
                <KeyValueGrid
                  title="属性 (Properties)"
                  data={instance.properties}
                />
              </TabsContent>

              <TabsContent value="metadata" className="mt-3 space-y-4">
                <MetadataBasicInfo basicInfo={instance.metadata.basicInfo} />
                <MetadataPropertyList
                  properties={instance.metadata.propertiesDef}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface KeyValueGridProps {
  title: string;
  data: Record<string, string>;
}

function KeyValueGrid({ title, data }: KeyValueGridProps) {
  const entries = Object.entries(data ?? {});
  if (!entries.length) {
    return (
      <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        暂无 {title}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-slate-600">{title}</div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs text-slate-700 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex flex-col gap-0.5 rounded-md bg-slate-50 px-2 py-1.5"
          >
            <span className="text-[11px] font-medium text-slate-500">
              {key}
            </span>
            <span className="text-xs text-slate-800 break-words">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MetadataBasicInfoProps {
  basicInfo: Record<string, string>;
}

function MetadataBasicInfo({ basicInfo }: MetadataBasicInfoProps) {
  const entries = Object.entries(basicInfo ?? {});
  if (!entries.length) {
    return (
      <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        暂无基础信息
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-slate-700">基础信息</div>
      <div className="grid grid-cols-1 gap-3 text-xs text-slate-800 sm:grid-cols-2">
        {entries.map(([key, value]) => {
          const isLongText = key === "业务定义";
          return (
            <div
              key={key}
              className={`flex flex-col rounded-md bg-slate-50 px-3 py-2 ${
                isLongText ? "sm:col-span-2" : ""
              }`}
            >
              <span className="mb-0.5 text-[11px] font-medium text-slate-500">
                {key}
              </span>
              <span className="text-xs text-slate-800 leading-relaxed break-words">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MetadataPropertyListProps {
  properties: OntologyPropertyDef[];
}

function MetadataPropertyList({ properties }: MetadataPropertyListProps) {
  if (!properties || properties.length === 0) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-700">属性列表</div>
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          暂无属性定义
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-slate-700">属性列表</div>
      <div className="overflow-hidden rounded-md border border-slate-200">
        <div className="grid grid-cols-3 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-600">
          <div>字段名 (Field Name)</div>
          <div>字段显示名称 (Display Name)</div>
          <div>字段类型 (Field Type)</div>
        </div>
        <div className="divide-y divide-slate-200 bg-white text-xs text-slate-800">
          {properties.map((p) => (
            <div
              key={p.fieldName}
              className="grid grid-cols-3 px-3 py-2 hover:bg-slate-50"
            >
              <div className="font-mono text-[11px] text-slate-700">
                {p.fieldName}
              </div>
              <div>{p.displayName}</div>
              <div className="text-slate-600">{p.fieldType}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 简易 Markdown + 本体引用渲染
// ---------------------------------------------------------------------------
interface FinalAnswerWithOntologyTraceProps {
  markdown?: string;
  ontologyMap?: OntologyMap;
}

// 全局匹配 `<onto_ref id="XXX"></onto_ref>` 标签
const ONTO_REF_REGEX = /<onto_ref\s+id="([^"]+)"><\/onto_ref>/g;

export function FinalAnswerWithOntologyTrace({
  markdown,
  ontologyMap,
}: FinalAnswerWithOntologyTraceProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const content = typeof markdown === "string" && markdown.trim().length > 0
    ? markdown
    : mockMarkdown;

  // 计算每个 onto_ref id 对应的公共序号
  const citationIndex = useMemo(() => {
    const map = new Map<string, number>();
    let index = 1;
    let match: RegExpExecArray | null;
    const re = new RegExp(ONTO_REF_REGEX.source, "g");
    while ((match = re.exec(content)) !== null) {
      const id = match[1];
      if (!map.has(id)) {
        map.set(id, index++);
      }
    }
    return map;
  }, [content]);

  const handleBadgeClick = (id: string) => {
    setActiveId(id);
    setModalOpen(true);
  };

  const renderedBlocks = useMemo(
    () => renderMarkdownWithCitations(content, citationIndex, handleBadgeClick),
    [content, citationIndex]
  );

  return (
    <>
      <div className="prose prose-sm max-w-none text-slate-900 prose-headings:text-slate-900 prose-p:leading-relaxed prose-ul:my-2 prose-li:my-0.5">
        {renderedBlocks}
      </div>

      <OntologyTraceModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entityId={activeId}
        ontologyMap={ontologyMap}
      />
    </>
  );
}

function renderMarkdownWithCitations(
  text: string,
  citationIndex: Map<string, number>,
  onBadgeClick: (id: string) => void
): React.ReactNode[] {
  // 按换行拆分 Markdown 行（支持多段内容）
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) {
      blocks.push(<div key={`blank-${i}`} className="h-2" />);
      return;
    }

    if (trimmed.startsWith("### ")) {
      const headingText = trimmed.replace(/^###\\s+/, "");
      blocks.push(
        <h3
          key={`h3-${i}`}
          className="text-base font-semibold text-slate-900 mb-1 mt-2"
        >
          {renderInlineWithCitations(headingText, citationIndex, onBadgeClick, i)}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("* ")) {
      // 列表项
      const itemText = trimmed.replace(/^[*]\\s+/, "");
      blocks.push(
        <p
          key={`li-${i}`}
          className="flex items-start text-sm text-slate-800 leading-relaxed"
        >
          <span className="mr-2 mt-[3px] text-xs text-slate-400">•</span>
          <span className="flex-1">
            {renderInlineWithCitations(
              itemText,
              citationIndex,
              onBadgeClick,
              i
            )}
          </span>
        </p>
      );
      return;
    }

    // 普通段落
    blocks.push(
      <p key={`p-${i}`} className="text-sm text-slate-800 leading-relaxed">
        {renderInlineWithCitations(trimmed, citationIndex, onBadgeClick, i)}
      </p>
    );
  });

  return blocks;
}

function renderInlineWithCitations(
  text: string,
  citationIndex: Map<string, number>,
  onBadgeClick: (id: string) => void,
  lineKey: number
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const re = new RegExp(ONTO_REF_REGEX.source, "g");
  while ((match = re.exec(text)) !== null) {
    const [full, id] = match;
    const start = match.index;

    if (start > lastIndex) {
      const chunk = text.slice(lastIndex, start);
      nodes.push(
        <span key={`txt-${lineKey}-${lastIndex}`}>
          {renderBasicInlineMarkdown(chunk)}
        </span>
      );
    }

    const idx = citationIndex.get(id);
    if (idx != null) {
      nodes.push(
        <CitationBadge
          key={`ref-${lineKey}-${start}`}
          id={id}
          index={idx}
          onClick={onBadgeClick}
        />
      );
    }

    lastIndex = start + full.length;
  }

  if (lastIndex < text.length) {
    const tail = text.slice(lastIndex);
    nodes.push(
      <span key={`txt-${lineKey}-tail`}>
        {renderBasicInlineMarkdown(tail)}
      </span>
    );
  }

  if (nodes.length === 0) {
    return [text];
  }
  return nodes;
}

function renderBasicInlineMarkdown(text: string): React.ReactNode {
  // 只处理 **加粗**，其余直接输出
  const parts = text.split(/(\\*\\*[^*]+\\*\\*)/g);
  if (parts.length === 1) return text;

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return (
        <span key={idx} className="font-semibold text-slate-900">
          {inner}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}


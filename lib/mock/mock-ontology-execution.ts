/**
 * 本体检索执行节点 - 完整 Mock 数据源
 * 用于「本体检索执行节点」组件的渲染，结构为唯一数据源。
 */

export interface OntologyExecutionMeta {
  title: string;
  status: "success" | "running" | "failed";
  duration: string;
  startTime: string;
  endTime: string;
}

export interface OntologyExecutionRequestPayload {
  entry_point: {
    object_type: string;
    search_pattern: string;
    search_query: string;
    filters: Record<string, unknown>;
  };
  traversals?: Array<{
    edge: string;
    target_object: string;
    return_properties: string[];
  }>;
}

export interface EntryObject {
  object_type: string;
  object_id: string;
  score?: number;
  properties: Record<string, unknown>;
}

export interface TraversedNode {
  object_type: string;
  object_id: string;
  properties: Record<string, unknown>;
}

export interface ResponseDataItem {
  entry_object: EntryObject;
  traversed_paths?: Record<string, TraversedNode[]>;
}

export interface OntologyExecutionResponseData {
  status: string;
  data: ResponseDataItem[];
}

export interface OntologyExecutionData {
  meta: OntologyExecutionMeta;
  request_payload: OntologyExecutionRequestPayload;
  response_data: OntologyExecutionResponseData;
}

export const mockExecutionData: OntologyExecutionData = {
  meta: {
    title: "本体检索: IntelligenceReport",
    status: "success",
    duration: "2.50s",
    startTime: "3:14:50 AM",
    endTime: "3:14:53 AM",
  },
  request_payload: {
    entry_point: {
      object_type: "IntelligenceReport",
      search_pattern: "hybrid_search",
      search_query: "Destroyer departure",
      filters: {
        location: { $in: ["Okinawa", "Sasebo"] },
        time_window: { $gte: "now-72h" },
      },
    },
    traversals: [
      {
        edge: "has_event_subject",
        target_object: "Ship",
        return_properties: ["hull_number", "ship_class", "combat_capability"],
      },
    ],
  },
  response_data: {
    status: "success",
    data: [
      {
        entry_object: {
          object_type: "IntelligenceReport",
          object_id: "HUMINT2026030584",
          score: 0.96,
          properties: {
            location: "Okinawa",
            report_summary: "HUMINT visual confirmation of naval movements.",
            confidence_level: "High",
          },
        },
        traversed_paths: {
          has_event_subject: [
            {
              object_type: "Ship",
              object_id: "TAGS_62",
              properties: {
                hull_number: "TAGS-62",
                ship_class: "Training Ship",
                combat_capability: "Support",
              },
            },
          ],
        },
      },
      {
        entry_object: {
          object_type: "IntelligenceReport",
          object_id: "OSINT2026030588",
          score: 0.92,
          properties: {
            location: "Sasebo",
            report_summary: "Visual confirmation of DDG departure, heading 240.",
            confidence_level: "High",
          },
        },
        traversed_paths: {
          has_event_subject: [
            {
              object_type: "Ship",
              object_id: "DDG_13",
              properties: {
                hull_number: "DDG-113",
                ship_class: "Arleigh Burke",
                combat_capability: "Area Air Defense",
              },
            },
          ],
        },
      },
      {
        entry_object: {
          object_type: "IntelligenceReport",
          object_id: "HUMINT20260305105",
          score: 0.88,
          properties: {
            location: "Okinawa",
            report_summary: "Supplemental HUMINT on same formation.",
            confidence_level: "Medium",
          },
        },
        traversed_paths: {
          has_event_subject: [
            {
              object_type: "Ship",
              object_id: "TAGS_62",
              properties: {
                hull_number: "TAGS-62",
                ship_class: "Training Ship",
                combat_capability: "Support",
              },
            },
            {
              object_type: "Ship",
              object_id: "DDG_13",
              properties: {
                hull_number: "DDG-113",
                ship_class: "Arleigh Burke",
                combat_capability: "Area Air Defense",
              },
            },
          ],
        },
      },
    ],
  },
};

/**
 * 将 trace 步骤的 duration 格式化为 "X.XXs"
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * 从执行链路步骤 (ExecutionStep) 构建本体检索节点所需的数据结构。
 * 若 output 已是 response_data 形状则使用，否则用 mock 的 response_data 并尽量填入 output 内容。
 */
export function buildOntologyExecutionDataFromStep(step: {
  stepName: string;
  status: string;
  startTime: string;
  endTime: string;
  duration: number;
  input?: unknown;
  output?: unknown;
}): OntologyExecutionData {
  const meta: OntologyExecutionMeta = {
    title: step.stepName,
    status:
      step.status === "success"
        ? "success"
        : step.status === "failed"
          ? "failed"
          : "running",
    duration: formatDuration(step.duration),
    startTime: step.startTime,
    endTime: step.endTime,
  };

  const input = step.input as Record<string, unknown> | undefined;
  let request_payload: OntologyExecutionRequestPayload;

  if (
    input &&
    typeof input === "object" &&
    "entry_point" in input &&
    input.entry_point
  ) {
    request_payload = input as unknown as OntologyExecutionRequestPayload;
  } else {
    request_payload = {
      entry_point: {
        object_type:
          (input?.objectType as string) ?? mockExecutionData.request_payload.entry_point.object_type,
        search_pattern:
          mockExecutionData.request_payload.entry_point.search_pattern,
        search_query:
          mockExecutionData.request_payload.entry_point.search_query,
        filters: (input?.filter as Record<string, unknown>) ?? mockExecutionData.request_payload.entry_point.filters,
      },
      traversals: mockExecutionData.request_payload.traversals,
    };
  }

  const out = step.output as { status?: string; data?: ResponseDataItem[] } | undefined;
  let response_data: OntologyExecutionResponseData;

  if (out && typeof out === "object" && Array.isArray(out.data)) {
    response_data = {
      status: (out.status as string) ?? "success",
      data: out.data,
    };
  } else if (out && typeof out === "object" && out.matched && Array.isArray(out.matched)) {
    const matched = (out as { matched: Array<{ id?: string; content?: string; type?: string }> }).matched;
    response_data = {
      status: "success",
      data: matched.map((m) => ({
        entry_object: {
          object_type: (m as { type?: string }).type ?? (input?.objectType as string) ?? "IntelligenceReport",
          object_id: m.id ?? "unknown",
          properties: { summary: m.content ?? "" },
        },
        traversed_paths: mockExecutionData.response_data.data[0]?.traversed_paths,
      })),
    };
  } else if (out && typeof out === "object" && (out.object_id || out.objectId || out.id)) {
    const obj = out as { object_id?: string; objectId?: string; id?: string; type?: string; objectType?: string; properties?: Record<string, unknown> };
    response_data = {
      status: "success",
      data: [
        {
          entry_object: {
            object_type: obj.type ?? (obj.objectType as string) ?? "Unknown",
            object_id: obj.object_id ?? obj.objectId ?? (obj.id as string) ?? "unknown",
            properties: obj.properties ?? {},
          },
          traversed_paths: mockExecutionData.response_data.data[0]?.traversed_paths,
        },
      ]
    };
  } else {
    response_data = mockExecutionData.response_data;
  }

  return {
    meta,
    request_payload,
    response_data,
  };
}

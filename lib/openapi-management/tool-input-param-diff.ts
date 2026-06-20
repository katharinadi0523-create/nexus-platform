import {
  getOpenApiPluginMounts,
  type OpenApiPluginItem,
  type OpenApiPluginMountRef,
  type OpenApiToolInputParam,
} from "@/lib/mock/openapi-plugins";

export type OpenApiToolParamDiffKind = "added" | "removed" | "modified";

export type OpenApiToolParamDiffField = "name" | "description" | "type" | "required";

export interface OpenApiToolParamFieldChange {
  field: OpenApiToolParamDiffField;
  before: string;
  after: string;
}

export interface OpenApiToolParamDiffItem {
  kind: OpenApiToolParamDiffKind;
  paramName: string;
  fieldChanges?: OpenApiToolParamFieldChange[];
}

export type OpenApiToolParamImpactType = "智能体" | "Claw";

export interface OpenApiToolParamImpactItem {
  id: string;
  name: string;
  type: OpenApiToolParamImpactType;
  detail: string;
}

export interface OpenApiToolParamSavePreview {
  diffs: OpenApiToolParamDiffItem[];
  impactItems: OpenApiToolParamImpactItem[];
  hasChanges: boolean;
  pluginName: string;
}

const FIELD_LABELS: Record<OpenApiToolParamDiffField, string> = {
  name: "参数名称",
  description: "参数描述",
  type: "数据类型",
  required: "必填",
};

function formatRequiredValue(required: boolean) {
  return required ? "是" : "否";
}

function collectFieldChanges(before: OpenApiToolInputParam, after: OpenApiToolInputParam): OpenApiToolParamFieldChange[] {
  const changes: OpenApiToolParamFieldChange[] = [];

  if (before.name !== after.name) {
    changes.push({ field: "name", before: before.name, after: after.name });
  }

  if (before.description !== after.description) {
    changes.push({ field: "description", before: before.description, after: after.description });
  }

  if (before.type !== after.type) {
    changes.push({ field: "type", before: before.type, after: after.type });
  }

  if (before.required !== after.required) {
    changes.push({
      field: "required",
      before: formatRequiredValue(before.required),
      after: formatRequiredValue(after.required),
    });
  }

  return changes;
}

export function getOpenApiToolParamFieldLabel(field: OpenApiToolParamDiffField) {
  return FIELD_LABELS[field];
}

export function buildToolInputParamDiff(
  beforeParams: OpenApiToolInputParam[],
  afterParams: OpenApiToolInputParam[]
): OpenApiToolParamDiffItem[] {
  const beforeMap = new Map(beforeParams.map((param) => [param.id, param]));
  const afterMap = new Map(afterParams.map((param) => [param.id, param]));
  const diffs: OpenApiToolParamDiffItem[] = [];

  for (const [id, beforeParam] of beforeMap) {
    const afterParam = afterMap.get(id);
    if (!afterParam) {
      diffs.push({ kind: "removed", paramName: beforeParam.name || "未命名参数" });
      continue;
    }

    const fieldChanges = collectFieldChanges(beforeParam, afterParam);
    if (fieldChanges.length > 0) {
      diffs.push({
        kind: "modified",
        paramName: afterParam.name || beforeParam.name || "未命名参数",
        fieldChanges,
      });
    }
  }

  for (const [id, afterParam] of afterMap) {
    if (!beforeMap.has(id)) {
      diffs.push({ kind: "added", paramName: afterParam.name || "未命名参数" });
    }
  }

  return diffs;
}

function mapPluginMountToImpactItem(mount: OpenApiPluginMountRef, plugin: OpenApiPluginItem): OpenApiToolParamImpactItem {
  return {
    id: mount.id,
    name: mount.name,
    type: mount.type,
    detail: `已挂载插件「${plugin.name}」，工具 Schema 变更将影响其调用`,
  };
}

export function buildPluginMountImpactItems(plugin: OpenApiPluginItem): OpenApiToolParamImpactItem[] {
  return getOpenApiPluginMounts(plugin.id).map((mount) => mapPluginMountToImpactItem(mount, plugin));
}

export function buildToolInputParamSavePreview(
  beforeParams: OpenApiToolInputParam[],
  afterParams: OpenApiToolInputParam[],
  plugin: OpenApiPluginItem
): OpenApiToolParamSavePreview {
  const diffs = buildToolInputParamDiff(beforeParams, afterParams);
  const impactItems = diffs.length > 0 ? buildPluginMountImpactItems(plugin) : [];

  return {
    diffs,
    impactItems,
    hasChanges: diffs.length > 0,
    pluginName: plugin.name,
  };
}

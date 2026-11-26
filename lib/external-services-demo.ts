"use client";

import { useCallback, useEffect, useState } from "react";

export type ExternalServiceDefinition = {
  id: string;
  name: string;
  vendor: string;
  description: string;
  category: string;
  logoSrc: string;
  connectionMethod: string;
  capabilities: string[];
};

export type ExternalServiceConnection = {
  serviceId: string;
  workspaceId: string;
  ownerScope: "personal" | "workspace";
  enabled: boolean;
  credentialConfigured: boolean;
  maskedCredential: string;
  updatedAt: string;
};

export type ExternalServicesDemoState = {
  connections: ExternalServiceConnection[];
};

export const EXTERNAL_SERVICE_CATALOG: ExternalServiceDefinition[] = [
  {
    id: "bocha-search",
    name: "博查搜索",
    vendor: "@平台认证",
    description: "搜索全网网页、新闻、天气和百科，返回标题、摘要与来源链接。",
    category: "搜索",
    logoSrc: "/logos/third-party-plugins/bocha.ico",
    connectionMethod: "MCP · API Key",
    capabilities: ["搜索网页、新闻、天气与百科", "返回标题、摘要和来源链接"],
  },
  {
    id: "qichacha",
    name: "企查查",
    vendor: "@平台认证",
    description: "查询企业工商、经营、法律风险和知识产权信息，辅助尽调与供应商筛查。",
    category: "数据",
    logoSrc: "/logos/third-party-plugins/qichacha.ico",
    connectionMethod: "MCP · API Key",
    capabilities: ["查询企业工商与经营信息", "查询法律风险与知识产权信息"],
  },
  {
    id: "gamma",
    name: "Gamma",
    vendor: "@平台认证",
    description: "根据自然语言生成演示文稿、文档、网页或社交内容，并支持导出。",
    category: "内容创作",
    logoSrc: "/logos/third-party-plugins/gamma.ico",
    connectionMethod: "MCP · OAuth 2.0",
    capabilities: ["生成演示文稿、文档、网页和社交内容", "管理和导出有权限访问的内容"],
  },
  {
    id: "jinshuju",
    name: "金数据",
    vendor: "@平台认证",
    description: "通过对话查询表单和提交数据，也可创建表单、管理数据记录。",
    category: "数据",
    logoSrc: "/logos/third-party-plugins/jinshuju.ico",
    connectionMethod: "MCP · OAuth / Access Token",
    capabilities: ["查询表单和提交数据", "创建表单并管理数据记录"],
  },
  {
    id: "hengsheng-juyuan",
    name: "恒生聚源金融问数",
    vendor: "@平台认证",
    description: "用自然语言查询股票、基金、行情、财务、宏观和研报等专业金融数据。",
    category: "数据",
    logoSrc: "/logos/third-party-plugins/hengsheng.png",
    connectionMethod: "MCP · 订阅服务凭证",
    capabilities: ["查询股票、基金、行情与财务数据", "查询宏观、研报等专业金融数据"],
  },
  {
    id: "bazhuayu",
    name: "八爪鱼采集器",
    vendor: "@平台认证",
    description: "将采集需求转成云端任务，搜索模板、查看任务状态并导出结构化数据。",
    category: "数据采集",
    logoSrc: "/logos/third-party-plugins/bazhuayu.ico",
    connectionMethod: "MCP · OAuth / API Key",
    capabilities: ["查找采集模板", "运行云端任务并导出结构化数据"],
  },
];

export const EXTERNAL_SERVICE_WORKSPACES = [
  { id: "ws-purchase", name: "采购演示空间", owner: "李明" },
  { id: "ws-analytics", name: "数据分析空间", owner: "王宁" },
  { id: "ws-agentic", name: "AgenticKit", owner: "陈佳" },
  { id: "ws-standards", name: "国军标空间", owner: "周敏" },
];

const STORAGE_KEY = "af.external-services-demo.v1";
const ACTIVE_WORKSPACE_KEY = "af.external-services-demo.active-workspace.v1";
const EVENT_NAME = "af:external-services-demo-updated";
export const DEFAULT_ACTIVE_WORKSPACE_ID = "ws-purchase";

export const DEFAULT_EXTERNAL_SERVICES_STATE: ExternalServicesDemoState = {
  connections: [
    {
      serviceId: "bocha-search",
      workspaceId: "ws-purchase",
      ownerScope: "workspace",
      enabled: true,
      credentialConfigured: true,
      maskedCredential: "••••••••8A3F",
      updatedAt: "2026-11-19T09:00:00.000Z",
    },
  ],
};

function readState(): ExternalServicesDemoState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_EXTERNAL_SERVICES_STATE;
    const parsed = JSON.parse(raw) as { connections: Array<Partial<ExternalServiceConnection> & { scope?: string; authorizedWorkspaceIds?: string[] }> };
    if (!Array.isArray(parsed.connections)) return DEFAULT_EXTERNAL_SERVICES_STATE;
    const savedWorkspaceId = window.localStorage.getItem(ACTIVE_WORKSPACE_KEY);
    const currentWorkspaceId = EXTERNAL_SERVICE_WORKSPACES.some((workspace) => workspace.id === savedWorkspaceId)
      ? savedWorkspaceId!
      : DEFAULT_ACTIVE_WORKSPACE_ID;
    const validIds = new Set(EXTERNAL_SERVICE_CATALOG.map((service) => service.id));
    const connections = parsed.connections.flatMap((connection): ExternalServiceConnection[] => {
      const serviceId = connection.serviceId === "online-search" ? "bocha-search" : connection.serviceId;
      const workspaceId = connection.workspaceId ?? connection.authorizedWorkspaceIds?.[0] ?? currentWorkspaceId;
      const ownerScope = connection.ownerScope ?? (connection.scope === "personal" ? "personal" : "workspace");
      if (!serviceId || !validIds.has(serviceId)) return [];
      if (ownerScope === "workspace" && !EXTERNAL_SERVICE_WORKSPACES.some((workspace) => workspace.id === workspaceId)) return [];
      return [{
        serviceId,
        workspaceId,
        ownerScope,
        enabled: Boolean(connection.enabled),
        credentialConfigured: Boolean(connection.credentialConfigured),
        maskedCredential: connection.maskedCredential ?? "",
        updatedAt: connection.updatedAt ?? new Date().toISOString(),
      }];
    });
    return { connections };
  } catch {
    return DEFAULT_EXTERNAL_SERVICES_STATE;
  }
}

export function saveExternalServicesState(state: ExternalServicesDemoState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function useExternalServicesDemo() {
  const [state, setState] = useState(DEFAULT_EXTERNAL_SERVICES_STATE);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(DEFAULT_ACTIVE_WORKSPACE_ID);

  useEffect(() => {
    const sync = () => {
      setState(readState());
      const savedWorkspaceId = window.localStorage.getItem(ACTIVE_WORKSPACE_KEY);
      if (savedWorkspaceId && EXTERNAL_SERVICE_WORKSPACES.some((workspace) => workspace.id === savedWorkspaceId)) {
        setActiveWorkspaceIdState(savedWorkspaceId);
      }
    };
    sync();
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((nextState: ExternalServicesDemoState) => {
    setState(nextState);
    saveExternalServicesState(nextState);
  }, []);

  const setActiveWorkspaceId = useCallback((workspaceId: string) => {
    setActiveWorkspaceIdState(workspaceId);
    window.localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }, []);

  return { state, update, activeWorkspaceId, setActiveWorkspaceId };
}

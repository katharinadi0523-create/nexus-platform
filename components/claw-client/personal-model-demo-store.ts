"use client";

import { useSyncExternalStore } from "react";

export type PersonalModelType = "chat";

export type PersonalModel = {
  id: string;
  modelId: string;
  name: string;
  enabled: boolean;
  type: PersonalModelType;
  toolCalling?: boolean;
  imageInput?: boolean;
  contextWindowTokens?: number;
  outputLimitTokens?: number;
};

export type PersonalModelConnection = {
  id: string;
  providerId: string;
  providerName: string;
  baseUrl?: string;
  apiKey: string;
  keyHint: string;
  models: PersonalModel[];
  checkedAt: string;
};

const EXAMPLE_CONNECTIONS: PersonalModelConnection[] = [
  {
    id: "personal:example:deepseek",
    providerId: "deepseek",
    providerName: "DeepSeek 开放平台",
    apiKey: "sk-demo-deepseek-5678",
    keyHint: "5678",
    checkedAt: "",
    models: [{ id: "personal:example:deepseek-chat", modelId: "deepseek-chat", name: "deepseek-chat", enabled: true, type: "chat" }],
  },
  {
    id: "personal:example:qwen",
    providerId: "qwen",
    providerName: "阿里云百炼（通义千问）",
    apiKey: "sk-demo-bailian-9012",
    keyHint: "9012",
    checkedAt: "",
    models: [{ id: "personal:example:qwen-plus", modelId: "qwen-plus", name: "qwen-plus", enabled: true, type: "chat" }],
  },
];

let connections: PersonalModelConnection[] = EXAMPLE_CONNECTIONS;
const listeners = new Set<() => void>();

function publish(next: PersonalModelConnection[]) {
  connections = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return connections;
}

export function usePersonalModelConnections() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getPersonalModel(modelId: string) {
  for (const connection of connections) {
    const model = connection.models.find((item) => item.id === modelId);
    if (model) return { connection, model };
  }
  return null;
}

export function addPersonalModelConnection(input: {
  providerId: string;
  providerName: string;
  baseUrl?: string;
  apiKey: string;
  keyHint: string;
  modelId: string;
  name: string;
  modelType?: PersonalModelType;
  toolCalling?: boolean;
  imageInput?: boolean;
  contextWindowTokens?: number;
  outputLimitTokens?: number;
}) {
  const connectionId = crypto.randomUUID();
  const modelId = `personal:${crypto.randomUUID()}`;
  publish([
    ...connections,
    {
      id: connectionId,
      providerId: input.providerId,
      providerName: input.providerName,
      baseUrl: input.baseUrl,
      apiKey: input.apiKey,
      keyHint: input.keyHint,
      checkedAt: new Date().toISOString(),
      models: [{ id: modelId, modelId: input.modelId, name: input.name, enabled: true, type: input.modelType ?? "chat", toolCalling: input.toolCalling, imageInput: input.imageInput, contextWindowTokens: input.contextWindowTokens, outputLimitTokens: input.outputLimitTokens }],
    },
  ]);
  return modelId;
}

export function addModelToConnection(connectionId: string, modelId: string, name: string, modelType: PersonalModelType = "chat", settings?: Pick<PersonalModel, "toolCalling" | "imageInput" | "contextWindowTokens" | "outputLimitTokens">) {
  const id = `personal:${crypto.randomUUID()}`;
  publish(connections.map((connection) => connection.id === connectionId
    ? { ...connection, models: [...connection.models, { id, modelId, name, enabled: true, type: modelType, ...settings }] }
    : connection));
  return id;
}

export function updatePersonalModelConnection(connectionId: string, apiKey: string) {
  publish(connections.map((connection) => connection.id === connectionId
    ? { ...connection, apiKey, keyHint: apiKey.slice(-4), checkedAt: new Date().toISOString() }
    : connection));
}

export function updatePersonalModelConnectionSettings(connectionId: string, input: {
  providerId: string;
  providerName: string;
  baseUrl?: string;
  apiKey?: string;
}) {
  publish(connections.map((connection) => connection.id === connectionId
    ? {
      ...connection,
      providerId: input.providerId,
      providerName: input.providerName,
      baseUrl: input.baseUrl,
      apiKey: input.apiKey ?? connection.apiKey,
      keyHint: input.apiKey ? input.apiKey.slice(-4) : connection.keyHint,
    }
    : connection));
}

export function setPersonalModelEnabled(modelId: string, enabled: boolean) {
  publish(connections.map((connection) => ({
    ...connection,
    models: connection.models.map((model) => model.id === modelId ? { ...model, enabled } : model),
  })));
}

export function updatePersonalModel(modelId: string, nextModelId: string, name: string, settings?: Pick<PersonalModel, "toolCalling" | "imageInput" | "contextWindowTokens" | "outputLimitTokens">) {
  publish(connections.map((connection) => ({
    ...connection,
    models: connection.models.map((model) => model.id === modelId
      ? { ...model, modelId: nextModelId, name, ...settings }
      : model),
  })));
}

export function removePersonalModel(modelId: string) {
  publish(connections
    .map((connection) => ({ ...connection, models: connection.models.filter((model) => model.id !== modelId) }))
    .filter((connection) => connection.models.length > 0));
}

export function removePersonalModelConnection(connectionId: string) {
  publish(connections.filter((connection) => connection.id !== connectionId));
}

export const OPEN_PERSONAL_MODEL_SETTINGS_EVENT = "claw-client:open-personal-model-settings";

export function openPersonalModelSettings(view: "list" | "add" = "list", modelType: PersonalModelType = "chat") {
  window.dispatchEvent(new CustomEvent(OPEN_PERSONAL_MODEL_SETTINGS_EVENT, { detail: { view, modelType } }));
}

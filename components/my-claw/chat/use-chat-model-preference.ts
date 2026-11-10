"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { type ModelParams } from "@/components/agent-editor/ModelSelector";
import {
  getDefaultModelParams,
  PRESET_MODEL_IDS,
} from "@/lib/model-schemas";

const STORAGE_KEY = "claw-client.model-preferences.v1";
const DEFAULT_MODEL = PRESET_MODEL_IDS.includes("Qwen3-32B")
  ? "Qwen3-32B"
  : PRESET_MODEL_IDS[0] ?? "Qwen3-32B";

type SessionModelPreference = {
  model: string;
  params: ModelParams;
};

type ModelPreferenceStore = {
  lastSelectedModel: string;
  bySession: Record<string, SessionModelPreference>;
};

const EMPTY_STORE: ModelPreferenceStore = {
  lastSelectedModel: DEFAULT_MODEL,
  bySession: {},
};

const STORE_CHANGE_EVENT = "claw-client:model-preferences-changed";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(STORE_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORE_CHANGE_EVENT, callback);
  };
}

function getStoreSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function readStore() {
  const snapshot = getStoreSnapshot();
  if (!snapshot) return EMPTY_STORE;
  try {
    return normalizeStore(JSON.parse(snapshot));
  } catch {
    return EMPTY_STORE;
  }
}

function writeStore(next: ModelPreferenceStore) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(STORE_CHANGE_EVENT));
  } catch {
    // Keep the current selection in the UI if browser storage is unavailable.
  }
}

function normalizeStore(value: unknown): ModelPreferenceStore {
  if (!value || typeof value !== "object") return EMPTY_STORE;
  const candidate = value as Partial<ModelPreferenceStore>;
  const fallbackModel = PRESET_MODEL_IDS.includes(candidate.lastSelectedModel ?? "")
    ? candidate.lastSelectedModel!
    : DEFAULT_MODEL;
  const bySession: Record<string, SessionModelPreference> = {};

  if (candidate.bySession && typeof candidate.bySession === "object") {
    for (const [sessionId, saved] of Object.entries(candidate.bySession)) {
      if (!saved) continue;
      const model = PRESET_MODEL_IDS.includes(saved.model)
        ? saved.model
        : DEFAULT_MODEL;
      bySession[sessionId] = {
        model,
        params: {
          ...getDefaultModelParams(model),
          ...(model === saved.model ? saved.params ?? {} : {}),
        },
      };
    }
  }

  return { lastSelectedModel: fallbackModel, bySession };
}

export function useChatModelPreference(sessionKey: string) {
  const snapshot = useSyncExternalStore(subscribe, getStoreSnapshot, () => "");
  const store = useMemo(() => {
    if (!snapshot) return EMPTY_STORE;
    try {
      return normalizeStore(JSON.parse(snapshot));
    } catch {
      return EMPTY_STORE;
    }
  }, [snapshot]);
  const ready = true;

  const preference = useMemo(() => {
    if (!ready) {
      return { model: DEFAULT_MODEL, params: getDefaultModelParams(DEFAULT_MODEL) };
    }
    const sessionPreference = store.bySession[sessionKey];
    if (sessionPreference) return sessionPreference;
    const model = PRESET_MODEL_IDS.includes(store.lastSelectedModel)
      ? store.lastSelectedModel
      : DEFAULT_MODEL;
    return { model, params: getDefaultModelParams(model) };
  }, [ready, sessionKey, store]);

  const selectModel = useCallback(
    (model: string) => {
      if (!PRESET_MODEL_IDS.includes(model)) return;
      const current = readStore();
      writeStore({
        ...current,
        lastSelectedModel: model,
        bySession: {
          ...current.bySession,
          [sessionKey]: { model, params: getDefaultModelParams(model) },
        },
      });
    },
    [sessionKey]
  );

  const updateParams = useCallback(
    (params: ModelParams) => {
      const current = readStore();
      const currentPreference = current.bySession[sessionKey];
      const model = currentPreference?.model ?? current.lastSelectedModel;
      writeStore({
        ...current,
        bySession: {
          ...current.bySession,
          [sessionKey]: {
            model,
            params: { ...getDefaultModelParams(model), ...params },
          },
        },
      });
    },
    [sessionKey]
  );

  return { ...preference, ready, selectModel, updateParams };
}

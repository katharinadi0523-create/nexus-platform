"use client";

import { createContext, useContext } from "react";

export type WorkbenchEntityBranding = {
  /** 产品实体名：Claw 或 多智能体 */
  entityLabel: string;
  /** 如「Claw配置」/「多智能体配置」 */
  configLabel: string;
};

const DEFAULT_BRANDING: WorkbenchEntityBranding = {
  entityLabel: "Claw",
  configLabel: "Claw配置",
};

const WorkbenchEntityContext =
  createContext<WorkbenchEntityBranding>(DEFAULT_BRANDING);

export function WorkbenchEntityProvider({
  entityLabel,
  children,
}: {
  entityLabel: string;
  children: React.ReactNode;
}) {
  const value: WorkbenchEntityBranding = {
    entityLabel,
    configLabel: `${entityLabel}配置`,
  };
  return (
    <WorkbenchEntityContext.Provider value={value}>
      {children}
    </WorkbenchEntityContext.Provider>
  );
}

export function useWorkbenchEntity() {
  return useContext(WorkbenchEntityContext);
}

/** 将文案中的 Claw 替换为当前实体名（仅用于展示） */
export function replaceClawLabel(text: string, entityLabel: string): string {
  return text
    .replaceAll("Claw配置", `${entityLabel}配置`)
    .replaceAll("Claw", entityLabel);
}

"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ClawKnowledgeAssetsSection } from "@/components/claw-hub-next/detail/claw-knowledge-assets-section";
import { KnowledgeConfigDialog, type KnowledgeConfigSelection } from "@/components/claw-hub-next/knowledge-config-dialog";
import { WorkbenchEntityProvider } from "@/components/claw-hub-next/workbench-entity-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPersonalClawDetail } from "@/lib/mock/my-claw";
import {
  buildKnowledgeAssetsFromLegacy,
  type ClawKnowledgeAssets,
} from "@/lib/mock/claw-hub-next";
import type { KnowledgePanelKey } from "@/components/claw-hub-next/detail/constants";

type ExtraResourcePanel = Exclude<KnowledgePanelKey, "knowledge-base">;

function formatUpdatedAt() {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date()).replaceAll("/", "-");
}

function panelLabel(panel: ExtraResourcePanel) {
  if (panel === "database") return "数据库";
  if (panel === "ontology") return "本体对象";
  return "术语库";
}

export function ClawClientKnowledgePage() {
  const detail = useMemo(() => getPersonalClawDetail(), []);
  const [activePanel, setActivePanel] = useState<KnowledgePanelKey>("knowledge-base");
  const [assets, setAssets] = useState<ClawKnowledgeAssets>(
    () =>
      detail.knowledgeAssets ??
      buildKnowledgeAssetsFromLegacy(
        detail.capabilityConfig.knowledge,
        detail.overview.updatedBy || detail.overview.creator,
      ),
  );
  const [knowledgeDialogOpen, setKnowledgeDialogOpen] = useState(false);
  const [extraPanel, setExtraPanel] = useState<ExtraResourcePanel | null>(null);
  const [resourceName, setResourceName] = useState("");
  const [resourceDescription, setResourceDescription] = useState("");

  const remove = (key: keyof ClawKnowledgeAssets, id: string, label: string) => {
    setAssets((current) => ({
      ...current,
      [key]: current[key].filter((item) => item.id !== id),
    }));
    toast.success(`${label}已移除。`);
  };

  const handleConfirmKnowledge = (selections: KnowledgeConfigSelection[]) => {
    if (selections.length === 0) {
      setKnowledgeDialogOpen(false);
      return;
    }
    setAssets((current) => {
      const byId = new Map(current.knowledgeBases.map((item) => [item.id, item]));
      selections.forEach((selection) => {
        byId.set(selection.id, {
          id: selection.id,
          name: selection.name,
          type: byId.get(selection.id)?.type ?? "高级",
          description: selection.description,
          creator: detail.overview.updatedBy || detail.overview.creator,
          updatedAt: selection.updatedAt,
          enabled: true,
        });
      });
      return { ...current, knowledgeBases: Array.from(byId.values()) };
    });
    setKnowledgeDialogOpen(false);
    toast.success("知识库已接入当前 Claw。");
  };

  const closeExtraDialog = () => {
    setExtraPanel(null);
    setResourceName("");
    setResourceDescription("");
  };

  const saveExtraResource = () => {
    if (!extraPanel || !resourceName.trim()) {
      toast.error(`请填写${extraPanel ? panelLabel(extraPanel) : "资源"}名称。`);
      return;
    }
    const id = `${extraPanel}-${Date.now()}`;
    const updatedAt = formatUpdatedAt();
    const creator = detail.overview.updatedBy || detail.overview.creator;
    const name = resourceName.trim();
    const description = resourceDescription.trim() || "由当前 Claw 配置的知识资源。";

    setAssets((current) => {
      if (extraPanel === "database") {
        return {
          ...current,
          databases: [
            { id, name, dbType: "MySQL", description, creator, updatedAt, enabled: true },
            ...current.databases,
          ],
        };
      }
      if (extraPanel === "ontology") {
        return {
          ...current,
          ontologyObjects: [
            { id, name, scene: "通用", description, creator, updatedAt, enabled: true },
            ...current.ontologyObjects,
          ],
        };
      }
      return {
        ...current,
        termBanks: [
          { id, name, description, creator, updatedAt, enabled: true },
          ...current.termBanks,
        ],
      };
    });
    toast.success(`${panelLabel(extraPanel)}已配置。`);
    closeExtraDialog();
  };

  return (
    <WorkbenchEntityProvider entityLabel="Claw">
      <div className="h-full min-h-0 overflow-y-auto bg-white px-6 py-5 lg:px-8">
        <ClawKnowledgeAssetsSection
          activePanel={activePanel}
          onActivePanelChange={setActivePanel}
          assets={assets}
          onDeleteKnowledgeBase={(id) => remove("knowledgeBases", id, "知识库")}
          onDeleteDatabase={(id) => remove("databases", id, "数据库")}
          onDeleteOntology={(id) => remove("ontologyObjects", id, "本体对象")}
          onDeleteTermBank={(id) => remove("termBanks", id, "术语库")}
          onOpenKnowledgeBaseConfig={() => setKnowledgeDialogOpen(true)}
          onOpenDatabaseConfig={() => setExtraPanel("database")}
          onOpenOntologyConfig={() => setExtraPanel("ontology")}
          onOpenTermBankConfig={() => setExtraPanel("term-bank")}
        />
      </div>

      <KnowledgeConfigDialog
        open={knowledgeDialogOpen}
        onOpenChange={setKnowledgeDialogOpen}
        onConfirm={handleConfirmKnowledge}
      />

      <Dialog open={Boolean(extraPanel)} onOpenChange={(open) => !open && closeExtraDialog()}>
        <DialogContent className="rounded-md border-slate-200 sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>配置{extraPanel ? panelLabel(extraPanel) : "资源"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="client-resource-name">名称</Label>
              <Input id="client-resource-name" value={resourceName} onChange={(event) => setResourceName(event.target.value)} placeholder={`请输入${extraPanel ? panelLabel(extraPanel) : "资源"}名称`} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-resource-description">描述</Label>
              <Input id="client-resource-description" value={resourceDescription} onChange={(event) => setResourceDescription(event.target.value)} placeholder="说明该资源的用途和内容范围" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeExtraDialog}>取消</Button>
            <Button className="bg-[#2773ff] hover:bg-[#1f63e0]" onClick={saveExtraResource}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkbenchEntityProvider>
  );
}

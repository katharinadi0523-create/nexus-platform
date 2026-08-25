"use client";

import { ChevronDown, ChevronRight, Folder, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { toast } from "sonner";
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  SecurityLevelBadge,
} from "@/components/security/security-level-badge";
import { cn } from "@/lib/utils";
import {
  knowledgeBaseGroupsV2,
  knowledgeBasesV2,
  collectGroupNamesInSubtree,
  findGroupParentNode,
  getMaxChildGroupSecurityLevel,
  type KnowledgeBaseGroupNode,
} from "@/lib/mock-knowledge-base-v2";
import { loadCreatedKnowledgeBases } from "@/lib/mock/knowledge-base-list";
import {
  buildSecurityLevelOptions,
  getApprovalActionState,
  getSecurityLevelRank,
  isHighSecurityLevel,
  maxSecurityLevel,
  type ApprovalStatus,
  type SecurityLevel,
} from "@/lib/security-level";

export type KnowledgeBaseGroup = KnowledgeBaseGroupNode;

/** 最多 5 层：level 为 0 起算，第 5 层不可再新增子节点 */
export const MAX_KNOWLEDGE_BASE_GROUP_DEPTH = 5;

interface GroupTreeSidebarProps {
  selectedGroup: KnowledgeBaseGroup | null;
  onSelectGroup: (group: KnowledgeBaseGroup) => void;
}

type GroupFormMode = "create" | "edit";

function cloneGroups(groups: KnowledgeBaseGroupNode[]): KnowledgeBaseGroupNode[] {
  return groups.map((group) => ({
    ...group,
    securityLevel: group.securityLevel ?? "公开",
    approvalStatus: group.approvalStatus ?? "none",
    children: group.children ? cloneGroups(group.children) : undefined,
  }));
}

function insertChildById(
  groups: KnowledgeBaseGroupNode[],
  parentId: string,
  child: KnowledgeBaseGroupNode
): KnowledgeBaseGroupNode[] {
  return groups.map((group) => {
    if (group.id === parentId) {
      return {
        ...group,
        children: [...(group.children ?? []), child],
      };
    }
    if (group.children?.length) {
      return {
        ...group,
        children: insertChildById(group.children, parentId, child),
      };
    }
    return group;
  });
}

function updateGroupById(
  groups: KnowledgeBaseGroupNode[],
  groupId: string,
  patch: Partial<KnowledgeBaseGroupNode>
): KnowledgeBaseGroupNode[] {
  return groups.map((group) => {
    if (group.id === groupId) {
      return { ...group, ...patch };
    }
    if (group.children?.length) {
      return {
        ...group,
        children: updateGroupById(group.children, groupId, patch),
      };
    }
    return group;
  });
}

function removeGroupById(
  groups: KnowledgeBaseGroupNode[],
  groupId: string
): KnowledgeBaseGroupNode[] {
  return groups
    .filter((group) => group.id !== groupId)
    .map((group) => ({
      ...group,
      children: group.children
        ? removeGroupById(group.children, groupId)
        : undefined,
    }));
}

function getKnowledgeBasesForSecurityFloor() {
  return [
    ...knowledgeBasesV2,
    ...loadCreatedKnowledgeBases().map((item) => ({
      groupName: item.groupName ?? "全部群组",
      securityLevel: item.securityLevel ?? ("公开" as SecurityLevel),
    })),
  ];
}

/** 群组密级下限：子群组与子树内知识库的最高密级 */
function getGroupSecurityFloor(group: KnowledgeBaseGroupNode): SecurityLevel {
  const childGroupMax = getMaxChildGroupSecurityLevel(group);
  const names = new Set(collectGroupNamesInSubtree(group));
  let kbMax: SecurityLevel = "公开";
  for (const kb of getKnowledgeBasesForSecurityFloor()) {
    if (names.has(kb.groupName)) {
      kbMax = maxSecurityLevel(kbMax, kb.securityLevel ?? "公开");
    }
  }
  return maxSecurityLevel(childGroupMax, kbMax);
}

function GroupNode({
  group,
  level,
  selectedId,
  onSelect,
  onRequestAddChild,
  onRequestEdit,
  onRequestChangeSecurity,
  onRequestDelete,
}: {
  group: KnowledgeBaseGroup;
  level: number;
  selectedId: string | null;
  onSelect: (group: KnowledgeBaseGroup) => void;
  onRequestAddChild: (parent: KnowledgeBaseGroup, level: number) => void;
  onRequestEdit: (group: KnowledgeBaseGroup) => void;
  onRequestChangeSecurity: (group: KnowledgeBaseGroup) => void;
  onRequestDelete: (group: KnowledgeBaseGroup) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const depth = level + 1;
  const canAddChild = depth < MAX_KNOWLEDGE_BASE_GROUP_DEPTH;
  const hasChildren = Boolean(group.children?.length);
  const isSelected = selectedId === group.id;
  const securityLevel = group.securityLevel ?? "公开";
  const approvalStatus = (group.approvalStatus ?? "none") as ApprovalStatus;
  const resourceLocked = approvalStatus === "create";
  const deleteAction = getApprovalActionState(approvalStatus);
  const canDelete = group.id !== "all";

  function handleToggle(event: MouseEvent) {
    event.stopPropagation();
    setExpanded((value) => !value);
  }

  function handleAddChild(event: MouseEvent) {
    event.stopPropagation();
    if (!canAddChild) {
      toast.info(`知识库群组最多支持 ${MAX_KNOWLEDGE_BASE_GROUP_DEPTH} 层结构。`);
      return;
    }
    setExpanded(true);
    onRequestAddChild(group, level);
  }

  function handleEdit(event: MouseEvent) {
    event.stopPropagation();
    onRequestEdit(group);
  }

  return (
    <div>
      <div
        className={cn(
          "group flex h-10 w-full items-center gap-1 rounded px-1 text-sm text-slate-700 hover:bg-slate-50",
          isSelected && "bg-blue-50 font-medium text-blue-600",
          resourceLocked && "opacity-70"
        )}
        style={{ paddingLeft: 8 + level * 20 }}
      >
        <button
          type="button"
          onClick={() => {
            if (resourceLocked) {
              toast.info("资源审批中，暂无法进入。");
              return;
            }
            onSelect(group);
          }}
          disabled={resourceLocked}
          title={resourceLocked ? "资源审批中" : group.name}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left",
            resourceLocked && "cursor-not-allowed"
          )}
        >
          {hasChildren ? (
            <span
              onClick={handleToggle}
              className="flex h-4 w-4 shrink-0 items-center justify-center text-slate-500"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </span>
          ) : (
            <span className="h-4 w-4 shrink-0" />
          )}
          <Folder className="h-4 w-4 shrink-0 fill-amber-300 text-amber-500" />
          <span className="truncate">{group.name}</span>
          <SecurityLevelBadge level={securityLevel} className="shrink-0 scale-90" />
        </button>

        <button
          type="button"
          onClick={handleEdit}
          title="编辑群组基本信息"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 opacity-0 transition-opacity hover:bg-white hover:text-blue-600 group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`编辑「${group.name}」`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRequestChangeSecurity(group);
          }}
          disabled={approvalStatus === "securityChange"}
          title={
            approvalStatus === "securityChange" ? "密级修改审批中" : "修改密级"
          }
          className={cn(
            "mr-0.5 hidden h-6 shrink-0 items-center rounded px-1 text-[11px] font-medium opacity-0 transition-opacity group-hover:inline-flex group-hover:opacity-100 focus-visible:opacity-100",
            approvalStatus === "securityChange"
              ? "cursor-not-allowed text-slate-300"
              : "text-blue-600 hover:bg-white"
          )}
        >
          修改密级
        </button>
        <button
          type="button"
          onClick={handleAddChild}
          disabled={!canAddChild}
          title={
            canAddChild
              ? "新增子知识库群组"
              : `已达最大 ${MAX_KNOWLEDGE_BASE_GROUP_DEPTH} 层，无法继续新增`
          }
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 transition-opacity hover:bg-white hover:text-blue-600",
            canAddChild
              ? "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              : "cursor-not-allowed opacity-0 group-hover:opacity-40"
          )}
          aria-label={`在「${group.name}」下新增子群组`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        {canDelete ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRequestDelete(group);
            }}
            disabled={deleteAction.deleteLocked}
            title={deleteAction.deleteTitle ?? "删除群组"}
            className={cn(
              "mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
              deleteAction.deleteLocked
                ? "cursor-not-allowed text-slate-300"
                : "text-slate-400 hover:bg-white hover:text-red-600"
            )}
            aria-label={`删除「${group.name}」`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {expanded &&
        group.children?.map((child) => (
          <GroupNode
            key={child.id}
            group={child}
            level={level + 1}
            selectedId={selectedId}
            onSelect={onSelect}
            onRequestAddChild={onRequestAddChild}
            onRequestEdit={onRequestEdit}
            onRequestChangeSecurity={onRequestChangeSecurity}
            onRequestDelete={onRequestDelete}
          />
        ))}
    </div>
  );
}

export function GroupTreeSidebar({
  selectedGroup,
  onSelectGroup,
}: GroupTreeSidebarProps) {
  const [groups, setGroups] = useState<KnowledgeBaseGroupNode[]>(() =>
    cloneGroups(knowledgeBaseGroupsV2)
  );
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<GroupFormMode>("create");
  const [parentGroup, setParentGroup] = useState<KnowledgeBaseGroup | null>(null);
  const [editingGroup, setEditingGroup] = useState<KnowledgeBaseGroup | null>(null);
  const [parentLevel, setParentLevel] = useState(0);
  const [draftName, setDraftName] = useState("");
  const [draftSecurityLevel, setDraftSecurityLevel] = useState<SecurityLevel>("公开");

  const [securityChangeOpen, setSecurityChangeOpen] = useState(false);
  const [securityTarget, setSecurityTarget] = useState<KnowledgeBaseGroup | null>(null);
  const [securityDraft, setSecurityDraft] = useState({
    targetLevel: "公开" as SecurityLevel,
    reason: "",
  });

  function handleRequestAddChild(parent: KnowledgeBaseGroup, level: number) {
    const nextDepth = level + 2;
    if (nextDepth > MAX_KNOWLEDGE_BASE_GROUP_DEPTH) {
      toast.info(`知识库群组最多支持 ${MAX_KNOWLEDGE_BASE_GROUP_DEPTH} 层结构。`);
      return;
    }
    setFormMode("create");
    setParentGroup(parent);
    setEditingGroup(null);
    setParentLevel(level);
    setDraftName("");
    setDraftSecurityLevel("公开");
    setFormOpen(true);
  }

  function handleRequestEdit(group: KnowledgeBaseGroup) {
    setFormMode("edit");
    setEditingGroup(group);
    setParentGroup(findGroupParentNode(groups, group.id));
    setDraftName(group.name);
    setDraftSecurityLevel(group.securityLevel ?? "公开");
    setFormOpen(true);
  }

  function handleRequestChangeSecurity(group: KnowledgeBaseGroup) {
    if (group.approvalStatus === "securityChange") {
      toast.info("密级修改审批中，请等待审批结果。");
      return;
    }
    setSecurityTarget(group);
    setSecurityDraft({
      targetLevel: group.securityLevel ?? "公开",
      reason: "",
    });
    setSecurityChangeOpen(true);
  }

  const formMaxLevel = parentGroup?.securityLevel;
  const formMinLevel =
    formMode === "edit" && editingGroup
      ? getGroupSecurityFloor(editingGroup)
      : undefined;
  const formSecurityOptions = buildSecurityLevelOptions({
    maxLevel: formMaxLevel,
    minLevel: formMinLevel,
  });

  const securityChangeParent = securityTarget
    ? findGroupParentNode(groups, securityTarget.id)
    : null;
  const securityChangeFloor = securityTarget
    ? getGroupSecurityFloor(securityTarget)
    : "公开";
  const securityChangeOptions = buildSecurityLevelOptions({
    maxLevel: securityChangeParent?.securityLevel,
    minLevel: maxSecurityLevel(
      securityTarget?.securityLevel ?? "公开",
      securityChangeFloor
    ),
  });

  function handleRequestDelete(group: KnowledgeBaseGroup) {
    if (group.id === "all") {
      toast.info("根群组不可删除。");
      return;
    }
    const action = getApprovalActionState(group.approvalStatus);
    if (action.deleteLocked) {
      toast.info(action.deleteTitle ?? "审批中");
      return;
    }
    const level = group.securityLevel ?? "公开";
    if (isHighSecurityLevel(level)) {
      setGroups((current) =>
        updateGroupById(current, group.id, { approvalStatus: "delete" })
      );
      toast.success(
        `已提交删除审批：群组「${group.name}」，审批通过前仍按当前版本运行。`
      );
      return;
    }
    setGroups((current) => removeGroupById(current, group.id));
    if (selectedGroup?.id === group.id) {
      onSelectGroup({ id: "all", name: "全部群组", securityLevel: "机密" });
    }
    toast.success(`已删除群组「${group.name}」`);
  }

  function handleConfirmForm() {
    const name = draftName.trim();
    if (!name) {
      toast.error(formMode === "create" ? "请输入子群组名称。" : "请输入群组名称。");
      return;
    }

    if (formMode === "create") {
      if (!parentGroup) return;
      const parentLevelValue = parentGroup.securityLevel ?? "公开";
      if (getSecurityLevelRank(draftSecurityLevel) > getSecurityLevelRank(parentLevelValue)) {
        toast.error("子群组密级不可高于父级群组密级。");
        return;
      }
      const highSec = isHighSecurityLevel(draftSecurityLevel);
      const nextChild: KnowledgeBaseGroupNode = {
        id: `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        securityLevel: draftSecurityLevel,
        approvalStatus: highSec ? "create" : "none",
        children: [],
      };
      setGroups((current) => insertChildById(current, parentGroup.id, nextChild));
      setFormOpen(false);
      toast.success(
        highSec
          ? `已提交创建审批：子群组「${name}」，审批通过后方可生效。`
          : `已在「${parentGroup.name}」下新增子群组「${name}」`
      );
      return;
    }

    if (!editingGroup) return;
    const floor = getGroupSecurityFloor(editingGroup);
    if (getSecurityLevelRank(draftSecurityLevel) < getSecurityLevelRank(floor)) {
      toast.error(
        `父级群组密级不得低于子群组/子知识库密级（当前子级最高：${floor}）。`
      );
      return;
    }
    if (
      parentGroup &&
      getSecurityLevelRank(draftSecurityLevel) >
        getSecurityLevelRank(parentGroup.securityLevel ?? "公开")
    ) {
      toast.error("群组密级不可高于父级群组密级。");
      return;
    }
    const highSecUpgrade =
      isHighSecurityLevel(draftSecurityLevel) &&
      !isHighSecurityLevel(editingGroup.securityLevel ?? "公开") &&
      draftSecurityLevel !== (editingGroup.securityLevel ?? "公开");

    setGroups((current) =>
      updateGroupById(current, editingGroup.id, {
        name,
        securityLevel: draftSecurityLevel,
        ...(highSecUpgrade ? { approvalStatus: "create" as const } : {}),
      })
    );
    if (selectedGroup?.id === editingGroup.id) {
      onSelectGroup({
        ...editingGroup,
        name,
        securityLevel: draftSecurityLevel,
      });
    }
    setFormOpen(false);
    toast.success(
      highSecUpgrade
        ? `群组「${name}」密级变更已提交审批。`
        : `已更新群组「${name}」`
    );
  }

  function handleSubmitSecurityChange() {
    if (!securityTarget) return;
    const reason = securityDraft.reason.trim();
    if (!reason) {
      toast.error("请填写申请原因。");
      return;
    }
    if (securityDraft.targetLevel === (securityTarget.securityLevel ?? "公开")) {
      toast.error("请选择与当前不同的目标密级。");
      return;
    }
    const floor = getGroupSecurityFloor(securityTarget);
    if (getSecurityLevelRank(securityDraft.targetLevel) < getSecurityLevelRank(floor)) {
      toast.error(
        `父级群组密级不得低于子群组/子知识库密级（当前子级最高：${floor}）。`
      );
      return;
    }
    const parent = findGroupParentNode(groups, securityTarget.id);
    if (
      parent &&
      getSecurityLevelRank(securityDraft.targetLevel) >
        getSecurityLevelRank(parent.securityLevel ?? "公开")
    ) {
      toast.error("群组密级不可高于父级群组密级。");
      return;
    }
    setGroups((current) =>
      updateGroupById(current, securityTarget.id, {
        approvalStatus: "securityChange",
      })
    );
    setSecurityChangeOpen(false);
    toast.success("已提交密级修改审批，审批通过后方可生效。");
  }

  const parentDepth = parentLevel + 1;
  const childDepth = parentDepth + 1;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="px-6 py-7">
        <h2 className="text-lg font-semibold text-slate-950">知识库群组</h2>
        <p className="mt-1 text-xs text-slate-400">
          支持最多 {MAX_KNOWLEDGE_BASE_GROUP_DEPTH} 层子群组
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <GroupNode
            key={group.id}
            group={group}
            level={0}
            selectedId={selectedGroup?.id ?? "all"}
            onSelect={onSelectGroup}
            onRequestAddChild={handleRequestAddChild}
            onRequestEdit={handleRequestEdit}
            onRequestChangeSecurity={handleRequestChangeSecurity}
            onRequestDelete={handleRequestDelete}
          />
        ))}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create" ? "新增子知识库群组" : "编辑群组基本信息"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formMode === "create" ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                父级：
                <span className="font-medium text-slate-900">{parentGroup?.name}</span>
                <span className="ml-2 text-xs text-slate-400">
                  （第 {parentDepth} 层 → 新增第 {childDepth} 层）
                </span>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="kb-group-name">
                <span className="text-rose-500">*</span>
                {formMode === "create" ? "子群组名称" : "群组名称"}
              </Label>
              <Input
                id="kb-group-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="请输入群组名称"
                className="h-10 border-slate-200 bg-white shadow-none"
              />
            </div>
            <div className="space-y-2">
              <Label>
                <span className="text-rose-500">*</span>群组密级
              </Label>
              <Select
                value={draftSecurityLevel}
                onValueChange={(value) => setDraftSecurityLevel(value as SecurityLevel)}
                options={formSecurityOptions}
                className="h-10 max-w-xs border-slate-200 bg-white shadow-none focus:ring-0"
              />
              <p className="text-xs text-slate-400">
                父级群组密级不得低于子群组及子知识库密级；子级密级不可高于父级。可选范围同时受当前项目角色密级限制。
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleConfirmForm}
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={securityChangeOpen} onOpenChange={setSecurityChangeOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>申请修改密级</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
              审批通过后，将修改当前群组密级。若群组下已有知识库，请按组织规范同步处理关联资源密级。
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              当前群组密级：
              <span className="font-medium text-slate-900">
                {securityTarget?.securityLevel ?? "公开"}
              </span>
            </div>
            <div className="space-y-2">
              <Label>
                <span className="text-rose-500">*</span>目标密级
              </Label>
              <Select
                value={securityDraft.targetLevel}
                onValueChange={(value) =>
                  setSecurityDraft((current) => ({
                    ...current,
                    targetLevel: value as SecurityLevel,
                  }))
                }
                options={securityChangeOptions}
                className="h-10 max-w-xs"
              />
              <p className="text-xs text-slate-400">
                目标密级须不低于子群组/子知识库，且不高于父级群组。
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-group-security-reason">
                <span className="text-rose-500">*</span>申请原因
              </Label>
              <Textarea
                id="kb-group-security-reason"
                value={securityDraft.reason}
                onChange={(event) =>
                  setSecurityDraft((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                rows={4}
                placeholder="请说明修改密级的原因"
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSecurityChangeOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleSubmitSecurityChange}
            >
              提交审批
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

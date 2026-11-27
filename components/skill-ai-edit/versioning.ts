import type { SkillManualDraft, SkillRecord, SkillVersion } from "./types";

/** 详情页版本下拉的默认项：正在编辑的工作副本，不是某一条历史上线记录 */
export const DRAFT_VIEW_ID = "draft";

export function getSkillVersion(
  skill: Pick<SkillRecord, "versions">,
  versionId?: string
): SkillVersion | undefined {
  if (!versionId) return undefined;
  return skill.versions.find((version) => version.id === versionId);
}

export function getCurrentManagedVersion(
  skill: Pick<SkillRecord, "currentVersionId" | "versions">
): SkillVersion | undefined {
  return getSkillVersion(skill, skill.currentVersionId) ?? skill.versions[0];
}

export function getCurrentPublishedVersion(
  skill: Pick<SkillRecord, "publishedVersionId" | "versions">
): SkillVersion | undefined {
  return getSkillVersion(skill, skill.publishedVersionId);
}

export function hasUnpublishedChanges(
  skill: Pick<SkillRecord, "currentVersionId" | "publishedVersionId" | "savedDraft">
) {
  return Boolean(skill.savedDraft) || skill.currentVersionId !== skill.publishedVersionId;
}

/** 当前版本是尚未发布的草稿，保存时就地更新，不再另起一条版本 */
export function isUnpublishedDraftVersion(
  skill: Pick<SkillRecord, "publishedVersionId">,
  version: SkillVersion | undefined
) {
  return Boolean(
    version && version.status === "draft" && version.id !== skill.publishedVersionId
  );
}

export function formatViewedVersionLabel(
  version: SkillVersion,
  publishedVersionId?: string
) {
  if (version.id === publishedVersionId) return `${version.version} · 当前上线`;
  if (version.status === "offline") return `${version.version} · 已下线`;
  if (version.status === "draft") return `${version.version} · 草稿`;
  return version.version;
}

/**
 * 还没发布出新版本时，工作副本不带版本号，只显示「当前草稿」。
 * 当前版本就是线上版本、且没有未发布草稿时，只显示版本号和「当前版本」。
 */
export function formatCurrentDraftLabel(
  version: SkillVersion | undefined,
  publishedVersionId?: string,
  hasUnversionedDraft = false,
  reviewing = false
) {
  if (!version) return "当前草稿";
  const isPublishedCurrent = Boolean(publishedVersionId) && version.id === publishedVersionId;
  if (hasUnversionedDraft && isPublishedCurrent) return "当前草稿";
  if (!isPublishedCurrent) {
    return reviewing ? `${version.version} · 审核中` : "当前草稿";
  }
  return `${version.version} · 当前版本`;
}

/** 版本下拉里可回看的历史。草稿不是版本，不出现在这里。 */
export function listRecallableVersions(skill: SkillRecord) {
  const currentId = getCurrentManagedVersion(skill)?.id;
  return skill.versions.filter((version) => {
    if (version.status === "draft") return false;
    if (skill.savedDraft) return true;
    return version.id !== currentId;
  });
}

/** 只读查看某个已上线版本时，用该版本文件；概览优先取发布基线 */
export function buildVersionSnapshot(skill: SkillRecord, version: SkillVersion): SkillManualDraft {
  const baseline = version.id === skill.publishedVersionId ? skill.publishedBaseline : undefined;
  return {
    name: baseline?.name ?? skill.name,
    displayName: baseline?.displayName ?? skill.displayName,
    description: baseline?.description ?? skill.description,
    usageInstructions: baseline?.usageInstructions ?? skill.usageInstructions,
    iconUrl: baseline?.iconUrl ?? skill.iconUrl,
    files: version.files.map((file) => ({ ...file })),
    dependencies: (baseline?.dependencies ?? skill.dependencies).map((item) => ({ ...item })),
  };
}

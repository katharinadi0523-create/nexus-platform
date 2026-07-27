import type { SkillRecord, SkillVersion } from "./types";

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
  skill: Pick<SkillRecord, "currentVersionId" | "publishedVersionId">
) {
  return skill.currentVersionId !== skill.publishedVersionId;
}

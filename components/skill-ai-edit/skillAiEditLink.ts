/** Skills 文档预览 → Claw「AI 编辑」深链 */

export const SKILL_AI_EDIT_NEED_PLACEHOLDER = '【填入您的需求】';

export const SKILL_AI_EDIT_PROTO_PATH = '/cec/prototype/skill-ai-edit';

export function buildSkillAiEditPrompt(skillName: string): string {
  const name = skillName.trim() || '未命名技能';
  return `使用skill-creator工具，对该技能（${name}）进行修改。我的需求是：${SKILL_AI_EDIT_NEED_PLACEHOLDER}。`;
}

export function buildClawSkillAiEditHref(skillName: string): string {
  const prompt = buildSkillAiEditPrompt(skillName);
  return `/cec/prototype/claw-render-1?prompt=${encodeURIComponent(prompt)}`;
}

/** 方案2：跳转 claw-render-1 时预填的工作空间名 */
export const SKILL_AI_EDIT_V2_WORKSPACE_DEFAULT = '我的空间';

export function buildSkillAiEditV2Prompt(
  skillName: string,
  workspaceName = SKILL_AI_EDIT_V2_WORKSPACE_DEFAULT,
): string {
  const skill = skillName.trim() || '未命名技能';
  const workspace = workspaceName.trim() || SKILL_AI_EDIT_V2_WORKSPACE_DEFAULT;
  return `我要试用一下${workspace} workspace中的${skill} skill，要求是：`;
}

export function buildClawSkillAiEditV2Href(
  skillName: string,
  workspaceName = SKILL_AI_EDIT_V2_WORKSPACE_DEFAULT,
): string {
  const prompt = buildSkillAiEditV2Prompt(skillName, workspaceName);
  return `/cec/prototype/claw-render-1?prompt=${encodeURIComponent(prompt)}`;
}

/** 方案2：跳转 Claw 使用端创建技能 */
export function buildSkillAiCreateV2Prompt(
  workspaceName = SKILL_AI_EDIT_V2_WORKSPACE_DEFAULT,
): string {
  const workspace = workspaceName.trim() || SKILL_AI_EDIT_V2_WORKSPACE_DEFAULT;
  return `我要在一个${workspace} workspace中创建一个 skill，要求是：`;
}

export function buildClawSkillAiCreateV2Href(
  workspaceName = SKILL_AI_EDIT_V2_WORKSPACE_DEFAULT,
): string {
  const prompt = buildSkillAiCreateV2Prompt(workspaceName);
  return `/cec/prototype/claw-render-1?prompt=${encodeURIComponent(prompt)}`;
}

/** Skills AI 编辑侧栏：双槽位版本模型（原型示例数据） */

export type SkillZipSnapshot = {
  id: string;
  /** 技能管理目录中的记录名（原型） */
  catalogName: string;
  fileName: string;
  version: string;
  createdAt: string;
  sizeLabel: string;
  /** 技能管理主目录可见性：编辑过程中均为 false */
  visible: false;
  skillJson: string;
  readme: string;
  needNote: string;
  /** prev = 上一版本拷贝；new = 本轮修改产出 */
  slot: 'prev' | 'new';
};

export type AiEditRoundKind = 'modify' | 'test';

export type AiEditDecideKind = 'keep_new' | 'keep_prev';

export type AiEditMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
  roundKind?: AiEditRoundKind;
  /** 本轮关联的技能快照（修改=新版；测试=所选版本） */
  zip?: SkillZipSnapshot;
  /** 修改轮结束后展示定版操作；测试轮展示选版结果 */
  showDecide?: boolean;
};

/** 会话内隐式技能目录条目（visible=false，前台不可见） */
export type InvisibleSkillRecord = {
  id: string;
  name: string;
  visible: false;
  slot: 'prev' | 'new';
  zip: SkillZipSnapshot;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function formatAiEditTime(date = new Date()): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatAiEditStamp(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function makeZip(opts: {
  skillName: string;
  catalogSuffix: string;
  version: string;
  slot: 'prev' | 'new';
  needNote: string;
  skillJson: string;
  readme: string;
}): SkillZipSnapshot {
  const name = opts.skillName.trim() || 'skill';
  const catalogName = `${name}${opts.catalogSuffix}`;
  const bytes = new TextEncoder().encode(opts.skillJson + opts.readme).length;
  return {
    id: `zip-${opts.slot}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    catalogName,
    fileName: `${catalogName}.zip`,
    version: opts.version,
    createdAt: formatAiEditStamp(),
    sizeLabel: `${Math.max(1, Math.round(bytes / 1024))} KB`,
    visible: false,
    skillJson: opts.skillJson,
    readme: opts.readme,
    needNote: opts.needNote,
    slot: opts.slot,
  };
}

/** 打开侧栏时：拷贝原始 Skill → 上一版本槽（invisible） */
export function createPrevSlotFromOriginal(skillName: string): SkillZipSnapshot {
  const name = skillName.trim() || 'skill';
  const skillJson = `{
  "name": "${name}",
  "version": "0.1.0",
  "description": "Search scholarly works via OpenAlex",
  "runtime": "python3.11",
  "entry": "src/main.py",
  "permissions": ["network"],
  "visible": false,
  "_slot": "prev",
  "_note": "原始 Skill 拷贝（AI 编辑会话）"
}
`;
  const readme = `# ${name}（上一版本拷贝）

通过 OpenAlex 检索学术文献。本拷贝仅用于 AI 编辑会话，前台不可见。
`;
  return makeZip({
    skillName: name,
    catalogSuffix: '.ai-prev',
    version: '0.1.0',
    slot: 'prev',
    needNote: '原始 Skill 拷贝',
    skillJson,
    readme,
  });
}

function bumpVersion(v: string): string {
  const parts = v.split('.').map((x) => Number.parseInt(x, 10));
  if (parts.length >= 3 && parts.every((n) => !Number.isNaN(n))) {
    parts[2] += 1;
    return parts.join('.');
  }
  return `${v}.1`;
}

/** 修改轮：Skill Creator 产出新版本槽（invisible） */
export function createNewSlotFromCreator(
  skillName: string,
  prev: SkillZipSnapshot,
  needDisplay: string,
): SkillZipSnapshot {
  const name = skillName.trim() || 'skill';
  const version = bumpVersion(prev.version);
  const skillJson = `{
  "name": "${name}",
  "version": "${version}",
  "description": "Updated via skill-creator (prototype)",
  "runtime": "python3.11",
  "entry": "src/main.py",
  "permissions": ["network"],
  "visible": false,
  "_slot": "new",
  "changelog": "AI 编辑：${needDisplay.slice(0, 80).replace(/"/g, '\\"')}"
}
`;
  const readme = `# ${name}（新版本）

## AI 编辑更新（${version}）

${needDisplay}

通过 OpenAlex 检索 arXiv、会议、期刊与图书中的学术文献。本记录前台不可见。
`;
  return makeZip({
    skillName: name,
    catalogSuffix: '.ai-new',
    version,
    slot: 'new',
    needNote: needDisplay,
    skillJson,
    readme,
  });
}

export function toInvisibleRecord(zip: SkillZipSnapshot): InvisibleSkillRecord {
  return {
    id: zip.id,
    name: zip.catalogName,
    visible: false,
    slot: zip.slot,
    zip,
  };
}

export function downloadSkillZip(zip: SkillZipSnapshot) {
  const body = [
    `# ${zip.fileName} (prototype bundle)`,
    `# catalog: ${zip.catalogName}`,
    `# version: ${zip.version}`,
    `# visible: false`,
    `# slot: ${zip.slot}`,
    `# createdAt: ${zip.createdAt}`,
    '',
    '--- skill.json ---',
    zip.skillJson,
    '',
    '--- README.md ---',
    zip.readme,
  ].join('\n');
  const blob = new Blob([body], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zip.fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseModifyNeed(userText: string, placeholder: string): string {
  const needRaw = userText.match(/我的需求是[：:]\s*([\s\S]*)$/)?.[1]?.trim() ?? userText.trim();
  const cleaned = needRaw.replace(/[。.]\s*$/, '').trim();
  const isPlaceholder =
    !cleaned ||
    cleaned === placeholder ||
    cleaned === '填入您的需求' ||
    /^【\s*填入您的需求\s*】$/.test(cleaned);
  return isPlaceholder
    ? '（尚未填写具体需求，已按通用增强方案演示修改）'
    : cleaned;
}

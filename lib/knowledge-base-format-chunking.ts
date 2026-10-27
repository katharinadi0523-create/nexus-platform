export interface ChunkParameter {
  key: string;
  label: string;
  type: "number" | "text" | "boolean";
  defaultValue: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}
const length: ChunkParameter = { key: "length", label: "切片长度（字符）", type: "number", defaultValue: 800, min: 100, max: 10000 };
const overlap: ChunkParameter = { key: "overlap", label: "重叠长度（字符）", type: "number", defaultValue: 100, min: 0, max: 9999 };
const depth: ChunkParameter = { key: "depth", label: "层级深度", type: "number", defaultValue: 3, min: 1, max: 10 };
const keepTitle: ChunkParameter = { key: "keepTitle", label: "保留标题", type: "boolean", defaultValue: true };
export const GRAPH_SENTENCE_PARAMS: ChunkParameter[] = [length, { key: "overlapRatio", label: "重叠比例（%）", type: "number", defaultValue: 10, min: 0, max: 99, step: 1, hint: "相邻切片的重叠比例，范围 0%～99%" }];
export const CHUNK_METHODS: Record<string, { label: string; params: ChunkParameter[] }> = {
  smart: { label: "智能切片", params: [length, overlap] },
  markers: { label: "常见标识符", params: [{ key: "markers", label: "标识符（每行一个）", type: "text", defaultValue: "\\n\\n\n。\n；", hint: "可用 \\n 表示换行符" }, length] },
  regex: { label: "自定义正则", params: [{ key: "pattern", label: "正则表达式", type: "text", defaultValue: "\\n{2,}" }, { key: "flags", label: "匹配标志", type: "text", defaultValue: "m", hint: "支持 i、m、s、u，可留空" }, length] },
  hierarchy: { label: "层级切分", params: [depth, keepTitle, length] },
  semantic: { label: "语义切分", params: [{ key: "threshold", label: "语义相似度阈值", type: "number", defaultValue: 0.7, min: 0, max: 1, step: 0.01 }, length] },
  sentence: { label: "句子切分", params: [{ key: "sentences", label: "每片句子数", type: "number", defaultValue: 5, min: 1, max: 100 }, length] },
  length: { label: "长度切分", params: [length, overlap] },
  recursive: { label: "分隔符递归", params: [{ key: "separators", label: "分隔符（每行一个，按优先级排列）", type: "text", defaultValue: "\\n\\n\n\\n\n。", hint: "可用 \\n 表示换行符" }, length, overlap] },
  page: { label: "按页切分", params: [{ key: "pages", label: "每片页数", type: "number", defaultValue: 1, min: 1, max: 100 }] },
  ppt: { label: "PPT切片", params: [{ key: "slides", label: "每片幻灯片数", type: "number", defaultValue: 1, min: 1, max: 100 }, { key: "notes", label: "包含备注", type: "boolean", defaultValue: true }] },
  json: { label: "JSON/JSONL切片", params: [{ key: "records", label: "每片记录数", type: "number", defaultValue: 1, min: 1, max: 1000 }] },
  md: { label: "MD切片", params: [depth, keepTitle, length] },
  markup: { label: "HTML/XML切片", params: [{ key: "tags", label: "分块标签（每行一个）", type: "text", defaultValue: "h1\nh2\nh3\np\nsection" }, length] },
  xmind: { label: "XMind切片", params: [depth, { key: "path", label: "保留主题路径", type: "boolean", defaultValue: true }] },
};
export const FORMAT_GROUPS = [
  { id: "word", label: "Word文档", extensions: ["doc", "docx", "wps"], methods: ["smart", "markers", "regex", "hierarchy", "semantic", "sentence", "length", "recursive"] },
  { id: "pdf", label: "PDF", extensions: ["pdf"], methods: ["smart", "markers", "regex", "hierarchy", "semantic", "sentence", "page", "length", "recursive"] },
  { id: "txt", label: "TXT", extensions: ["txt"], methods: ["smart", "markers", "regex", "semantic", "sentence", "length", "recursive"] },
  { id: "ppt", label: "PPT演示文稿", extensions: ["ppt", "pptx"], methods: ["ppt"] },
  { id: "json", label: "JSON/JSONL", extensions: ["json", "jsonl"], methods: ["json"] },
  { id: "md", label: "Markdown", extensions: ["md"], methods: ["md"] },
  { id: "markup", label: "HTML/MHTML/XML", extensions: ["html", "mhtml", "xml"], methods: ["markup"] },
  { id: "log", label: "Log日志", extensions: ["log"], methods: ["markers", "regex"] },
  { id: "xmind", label: "XMind", extensions: ["xmind"], methods: ["xmind"] },
];
export interface FormatChunkConfig { methods: string[]; params: Record<string, Record<string, string | number | boolean>> }
export type RetrievalChunkGroup = "fulltextSemantic" | "pageindex" | "graph";
export const RETRIEVAL_CHUNK_GROUPS: { id: RetrievalChunkGroup; label: string; engines: string[] }[] = [
  { id: "fulltextSemantic", label: "全文&语义检索", engines: ["fulltext", "semantic"] },
  { id: "pageindex", label: "PageIndex检索", engines: ["pageindex"] },
  { id: "graph", label: "图谱检索", engines: ["graph"] },
];
export function enabledChunkGroups(engines: readonly string[]) {
  return RETRIEVAL_CHUNK_GROUPS.filter(group => group.engines.some(engine => engines.includes(engine)));
}
export function applicableChunkGroups(groupId: string, engines: readonly string[]) {
  const format = FORMAT_GROUPS.find(group => group.id === groupId);
  if (!format) return [];
  return enabledChunkGroups(engines);
}
export type FormatChunkConfigs = Record<string, Partial<Record<RetrievalChunkGroup, FormatChunkConfig>>>;
export interface DocumentChunkConfig {
  autoChunk: boolean;
  format: string;
  /** Legacy snapshots stored a single configuration per format. */
  config?: FormatChunkConfig;
  retrievalGroups?: Partial<Record<RetrievalChunkGroup, FormatChunkConfig>>;
}
export function getFormatGroup(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return FORMAT_GROUPS.find(group => group.extensions.includes(ext));
}
export function defaultFormatConfig(groupId: string): FormatChunkConfig {
  const group = FORMAT_GROUPS.find(item => item.id === groupId);
  if (!group) throw new Error("未知文件格式");
  return { methods: [group.methods[0]], params: Object.fromEntries(group.methods.map(method => [method, Object.fromEntries(CHUNK_METHODS[method].params.map(param => [param.key, param.defaultValue]))])) };
}
export function validateFormatConfig(groupId: string, config: FormatChunkConfig, retrieval?: RetrievalChunkGroup): string | null {
  const group = FORMAT_GROUPS.find(item => item.id === groupId);
  if (!group || !config.methods.length) return "请至少选择一种切片方式";
  const graphParameters = retrieval === "graph" && group.methods.length > 1;
  if (graphParameters && (config.methods.length !== 1 || config.methods[0] !== "sentence")) return "图谱检索仅支持句子切分";
  for (const method of config.methods) {
    if (!graphParameters && !(retrieval === "pageindex" && group.methods.length > 1 && method === "hierarchy") && !group.methods.includes(method)) return "存在不适用于此格式的切片方式";
    const values = config.params[method] ?? {};
    for (const param of (graphParameters ? GRAPH_SENTENCE_PARAMS : CHUNK_METHODS[method].params)) {
      const value = values[param.key];
      if (param.type === "number" && (typeof value !== "number" || !Number.isFinite(value) || value < (param.min ?? 0) || value > (param.max ?? Infinity) || (!param.step && !Number.isInteger(value)))) return `${CHUNK_METHODS[method].label}：${param.label}应在 ${param.min}～${param.max} 之间`;
      if (param.type === "text" && param.key !== "flags" && !String(value ?? "").trim()) return `${CHUNK_METHODS[method].label}：请填写${param.label}`;
    }
    if (typeof values.overlap === "number" && values.overlap >= Number(values.length)) return "重叠长度必须小于切片长度";
    if (method === "regex") {
      try { if (!/^[imsu]*$/.test(String(values.flags))) return "匹配标志仅支持 i、m、s、u"; new RegExp(String(values.pattern), String(values.flags)); } catch { return "请输入有效的正则表达式和匹配标志"; }
    }
  }
  return null;
}
export function resolveRetrievalChunkConfig(groupId: string, retrieval: RetrievalChunkGroup, saved?: FormatChunkConfig): FormatChunkConfig {
  const group = FORMAT_GROUPS.find(item => item.id === groupId);
  if (group?.methods.length === 1) return defaultFormatConfig(groupId);
  if (retrieval === "graph") {
    return { methods: ["sentence"], params: { sentence: Object.fromEntries(GRAPH_SENTENCE_PARAMS.map(param => [param.key, saved?.params.sentence?.[param.key] ?? param.defaultValue])) } };
  }
  if (retrieval === "pageindex") {
    const method = "hierarchy";
    return { methods: [method], params: { [method]: Object.fromEntries(CHUNK_METHODS[method].params.map(param => [param.key, param.defaultValue])) } };
  }
  return saved ?? defaultFormatConfig(groupId);
}
export function documentChunkConfig(name: string, configs: FormatChunkConfigs, autoChunk: boolean, engines: readonly string[]): DocumentChunkConfig | undefined {
  const group = getFormatGroup(name);
  if (!group) return undefined;
  const retrievalGroups = Object.fromEntries(applicableChunkGroups(group.id, engines).map(retrieval => {
    const config = resolveRetrievalChunkConfig(group.id, retrieval.id, configs[group.id]?.[retrieval.id]);
    return [retrieval.id, { methods: [...config.methods], params: Object.fromEntries(config.methods.map(method => [method, { ...config.params[method] }])) }];
  }));
  return { autoChunk, format: group.id, retrievalGroups };
}

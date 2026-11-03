import { browser, cmd, deliver, ev, file, say, think, type DemoEntry } from "./demo-scripts";
import type { RawItem, TurnState } from "./model";

/** 基础形态历史会话按新的执行过程展示重写后的记录。 */
export interface HistoryTranscript {
  user: string;
  attachments?: string[];
  items: RawItem[];
  state: TurnState;
  /** 运行中、等待确认时，正在进行的那一项。 */
  runningId?: string | null;
  elapsed: number;
}

const items = (entries: DemoEntry[]) => entries.map((entry) => entry.item);
const answer = (text: string): DemoEntry => ({ item: { kind: "answer", id: `answer-${text.length}-${text.slice(0, 4)}`, text } });
const clarify = (idValue: string, question: string, options: string[]): DemoEntry => ({
  item: { kind: "clarify", id: idValue, question, options: options.map((label, index) => ({ value: `o${index}`, label })) },
});
const skill = (name: string, at: number) =>
  ev("LoadSkillContent", "skill", `使用技能「${name}」`, `正在加载技能「${name}」`, at, { type: "raw", input: `skill: ${name}`, output: `# ${name}\n按技能说明的步骤执行。` });
const read = (path: string, content: string, at: number) => {
  const name = path.split("/").pop() ?? path;
  return ev("read_file", "read", `读取「${name}」`, `正在读取「${name}」`, at, file(path, content));
};
const write = (path: string, content: string, at: number) => {
  const name = path.split("/").pop() ?? path;
  return ev("write_file", "write", `写入「${name}」`, `正在写入「${name}」`, at, file(path, content), { preview: { file: name, content } });
};
const run = (name: string, runningName: string, command: string, output: string, at: number, ok = true, idValue?: string) =>
  ev("execute", "run", name, runningName, at, cmd(command, output, ok ? 0 : 1), { ok, id: idValue });

export const HISTORY_TRANSCRIPTS: Record<string, HistoryTranscript> = {
  "task-002": {
    user: "帮我做一版桌面助手的前端设计：先定信息架构，再拆关键界面组件。",
    items: items([
      think(8, "先读现有需求和页面目录，确认要覆盖的页面，再给信息架构的几种拆法让用户选。", 0),
      skill("快速原型", 8),
      say("我先看一下现有需求和页面结构，再给出信息架构方案。", 10),
      read("docs/桌面助手需求.md", "目标：常驻桌面的轻量助手。\n核心场景：快捷提问、剪贴板处理、文件拖入总结。", 12),
      ev("ls", "list", "查看「src/pages」文件夹", "正在查看「src/pages」文件夹", 15, cmd("ls src/pages", "home/\nchat/\nsettings/")),
      think(14, "三种拆法：按场景分 Tab、单输入框 + 指令、侧边栏 + 会话。各有取舍，需要用户定。", 16),
      write("design/信息架构草案.md", "方案 A：按场景分 Tab\n方案 B：单输入框 + 指令\n方案 C：侧边栏 + 会话列表", 31),
      say("信息架构有三种拆法，组件拆分会跟着变。先请你定一个方向。", 40),
      clarify("history-002-ia", "信息架构按哪种方式拆分？", ["按场景分 Tab", "单输入框 + 指令", "侧边栏 + 会话列表"]),
    ]),
    state: "waiting",
    elapsed: 42,
  },
  "task-003": {
    user: "把华东区这周的经营周报整理一下，异常波动要单独说明。",
    attachments: ["华东经营数据-第44周.xlsx"],
    items: items([
      think(6, "先读周报数据，按城市汇总，再找环比波动超过 10% 的指标。", 0),
      read("华东经营数据-第44周.xlsx", "城市 12 个；指标：销售额、毛利、客流、客单价", 6),
      run("运行脚本，按城市汇总", "正在运行脚本，按城市汇总", "python3 weekly_summary.py 华东经营数据-第44周.xlsx", "12 个城市汇总完成；环比波动 > 10% 的指标 5 项", 9),
      say("汇总完了，有 5 项指标环比波动超过 10%。我逐项查原因。", 15),
      ev("SearchConversationHistory", "history", "回顾之前的对话：「华东 异常」，找到 2 条", "正在回顾之前的对话", 17, { type: "search", query: "华东 异常", results: ["10-15 华东区异常波动说明", "10-22 苏州门店闭店装修"] }),
      run("运行脚本，汇总区域指标与异常说明", "正在运行脚本，汇总区域指标与异常说明", "python3 anomaly.py --region 华东", "", 20, true, "history-003-running"),
    ]),
    state: "running",
    runningId: "history-003-running",
    elapsed: 38,
  },
  "task-004": {
    user: "Q1 销售复盘报告：先把销售漏斗数据导进来。",
    attachments: ["Q1销售漏斗.xlsx"],
    items: items([
      think(5, "读漏斗数据，检查各阶段字段是否齐全。", 0),
      skill("内容策划", 5),
      read("Q1销售漏斗.xlsx", "阶段：线索 / 商机 / 报价 / 成交；共 3 个月", 7),
      run("运行 import_funnel.py", "正在运行 import_funnel.py", "python3 import_funnel.py Q1销售漏斗.xlsx", "已导入 4 个阶段、3 个月、6 个区域", 10),
      answer("销售漏斗数据已导入：4 个阶段、3 个月、6 个区域。复盘结构可以开始起草，需要的话我按“目标—结果—原因—动作”四段来写。"),
    ]),
    state: "done",
    elapsed: 16,
  },
  "task-005": {
    user: "把这份供应商合同的关键条款摘出来。",
    attachments: ["供应商合同-扫描件.pdf"],
    items: items([
      think(7, "扫描件，需要先 OCR 再抽取付款、交付、违约、保密四类条款。", 0),
      run("运行 ocr_extract.py", "正在运行 ocr_extract.py", "python3 ocr_extract.py 供应商合同-扫描件.pdf", "第 1–2 页识别完成\n第 3 页：识别置信度 0.31，低于阈值，跳过", 7, false),
      run("运行 ocr_extract.py", "正在运行 ocr_extract.py", "python3 ocr_extract.py 供应商合同-扫描件.pdf --page 3 --enhance", "第 3 页：识别置信度 0.38，仍低于阈值", 21, false),
      think(9, "第 3 页是付款和违约条款，识别不了就不能编。如实告诉用户，请他换清晰的扫描件。", 30),
      answer("第 1–2 页的交付和保密条款已摘出；第 3 页（付款、违约条款）扫描不清，两次识别都没通过，我没有猜测内容。请提供第 3 页更清晰的扫描件或原件照片，我再补全。"),
    ]),
    state: "done",
    elapsed: 41,
  },
  "task-006": {
    user: "按这份岗位清单批量生成 JD。",
    attachments: ["2026下半年招聘岗位清单.xlsx"],
    items: items([
      think(6, "先读岗位清单，再按统一模板生成。", 0),
      skill("内容策划", 6),
      read("2026下半年招聘岗位清单.xlsx", "岗位 8 个：产品经理 2、前端 3、算法 2、测试 1", 8),
      read("templates/JD模板.md", "岗位职责 / 任职要求 / 加分项", 9),
      answer("岗位清单已就绪：共 8 个岗位，模板已对齐。确认后我可以一次生成 8 份 JD 草稿。"),
    ]),
    state: "done",
    elapsed: 14,
  },
  "task-007": {
    user: "对比差旅制度 v3 和 v4，列出差异和影响范围。",
    attachments: ["差旅制度-v3.docx", "差旅制度-v4.docx"],
    items: items([
      think(11, "两份 Word 先转成文本，再按条款对齐比较，最后按影响人群整理。", 0),
      run("运行脚本，把两版制度转成文本", "正在运行脚本，把两版制度转成文本", "python3 docx2txt.py 差旅制度-v3.docx 差旅制度-v4.docx", "v3：42 条；v4：45 条", 13),
      run("运行脚本，按条款比较差异", "正在运行脚本，按条款比较差异", "python3 diff_clauses.py v3.txt v4.txt", "新增 3 条、修改 7 条、删除 0 条", 18),
      say("v4 新增 3 条、修改 7 条。我按影响人群整理成对照表。", 24),
      write("output/差旅制度差异对照.md", "| 条款 | v3 | v4 | 影响人群 |\n|---|---|---|---|\n| 住宿标准 | 一线城市 500 元 | 一线城市 600 元 | 全员 |", 26),
      run("运行脚本，导出差异对照表", "正在运行脚本，导出差异对照表", "python3 export_xlsx.py output/差旅制度差异对照.md", "已生成 output/差旅制度差异对照.xlsx", 44),
      deliver("CreateArtifact", { type: "file", title: "差旅制度差异对照.xlsx", meta: "36 KB" }, 47),
      deliver("CreateArtifact", { type: "file", title: "影响范围说明.md", meta: "8 KB" }, 48),
      answer("已输出 v3 与 v4 的差异对照表及影响范围说明：新增 3 条、修改 7 条，影响最大的是住宿标准和报销时限。"),
    ]),
    state: "done",
    elapsed: 49,
  },
  "task-008": {
    user: "把这几次客户拜访纪要归档，并关联到 CRM。",
    attachments: ["拜访纪要-10月.zip"],
    items: items([
      think(5, "先看压缩包里有几份纪要、字段是什么，再看归档目录和 CRM 字段。", 0),
      run("运行命令，解压纪要", "正在运行命令，解压纪要", "unzip 拜访纪要-10月.zip -d visits", "解压 6 个文件", 5),
      ev("ls", "list", "查看「客户资料」文件夹", "正在查看「客户资料」文件夹", 7, cmd("ls 客户资料", "华东大客户/\n华南渠道/\n2026归档/")),
      browser("navigate", "打开 crm.example.com", "正在打开 crm.example.com", "url: https://crm.example.com/fields", "CRM 字段页已打开", 9),
      browser("snapshot", "读取页面内容", "正在读取页面内容", "", "可关联字段：客户编号、商机编号、拜访类型", 11),
      say("纪要共 6 份。归档目录和 CRM 字段映射有两种做法，先请你确认。", 18),
      clarify("history-008-archive", "纪要归档到哪个目录？", ["按客户归档到「华东大客户」", "统一放到「2026归档」", "我来指定目录"]),
    ]),
    state: "waiting",
    elapsed: 20,
  },
};

export function getHistoryTranscript(sessionId: string): HistoryTranscript | undefined {
  return HISTORY_TRANSCRIPTS[sessionId];
}

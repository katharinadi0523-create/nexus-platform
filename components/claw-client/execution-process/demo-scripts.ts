import { createScheduledTaskDraft, type AutomationTask } from "@/lib/mock/my-claw/automation";
import type { DeliveryCard, EventCategory, EventDetail, RawItem, TurnState } from "./model";

/**
 * 演示会话脚本：每个非 silent 的条目对应一次“下一步”。
 * silent 条目（内部机制、连续浏览器操作）随相邻步骤一起出现。
 */
export interface DemoEntry {
  item: RawItem;
  silent?: boolean;
  /** 演示者看的说明，显示在演示控制条上。 */
  note?: string;
}

export interface DemoTurn {
  user: string;
  attachments?: string[];
  entries: DemoEntry[];
  end: { state: Exclude<TurnState, "running" | "waiting">; at: number; note: string };
}

export interface ProcessDemo {
  id: string;
  title: string;
  preview: string;
  turns: DemoTurn[];
}

let seq = 0;
const id = (prefix: string) => `${prefix}-${++seq}`;

export const think = (seconds: number, text: string, at: number, note?: string): DemoEntry => ({
  item: { kind: "thinking", id: id("think"), seconds, text, at },
  note,
});
export const say = (text: string, at: number, note?: string): DemoEntry => ({ item: { kind: "narration", id: id("say"), text, at }, note });
export const ev = (
  tool: string,
  category: EventCategory,
  name: string,
  runningName: string,
  at: number,
  detail?: EventDetail,
  options: { ok?: boolean; note?: string; preview?: { file: string; content: string }; silent?: boolean; id?: string } = {},
): DemoEntry => ({
  item: {
    kind: "event",
    id: options.id ?? id("ev"),
    tool,
    category,
    name,
    runningName,
    ok: options.ok ?? true,
    detail,
    preview: options.preview,
    at,
  },
  note: options.note,
  silent: options.silent,
});
export const cmd = (command: string, output: string, exitCode = 0): EventDetail => ({ type: "command", command, output, exitCode });
export const file = (path: string, content: string): EventDetail => ({ type: "file", path, content });
/** 网页操作：每一步一个 Event，名字写这一步做了什么。 */
export const browser = (tool: string, name: string, runningName: string, input: string, output: string, at: number, options: { note?: string } = {}) =>
  ev(tool, "browser", name, runningName, at, { type: "raw", input, output }, options);
export const deliver = (tool: string, card: DeliveryCard, at: number, options: { ok?: boolean; failName?: string; runningName?: string; detail?: EventDetail; note?: string } = {}): DemoEntry => ({
  item: { kind: "delivery", id: id("deliver"), tool, ok: options.ok ?? true, card, failName: options.failName, runningName: options.runningName, detail: options.detail, at },
  note: options.note,
});

/** 定时任务演示：创建出来的任务，点“查看”时在弹窗里打开。 */
const WEEKLY_SALES_TASK: AutomationTask = (() => {
  const draft = createScheduledTaskDraft();
  return {
    ...draft,
    id: "auto-demo-weekly-sales",
    name: "销售周报汇总",
    description: "每周一汇总上周销售数据并生成周报",
    instruction: "汇总上周各区域的销售数据，生成销售周报，发到这个对话。",
    trigger_summary: "每周一 09:00",
    delivery_channel: "AF平台",
    schedule_config: draft.schedule_config && { ...draft.schedule_config, frequency: "weekly", time: "09:00" },
  };
})();

const DASHBOARD_DATA = `export const dashboardData = {
  updatedAt: "2026-10-31",
  kpis: [
    { name: "销售额", value: 18264000, unit: "元" },
    { name: "毛利率", value: 0.326 },
    { name: "门店数", value: 214 },
    { name: "客单价", value: 186.4, unit: "元" },
    { name: "复购率", value: 0.418 },
    { name: "库存周转天数", value: 37 },
  ],
  charts: ["月度销售趋势", "区域销售占比", "门店毛利 Top 10"],
};`;

export const DASHBOARD_DEMO: ProcessDemo = {
  id: "process-demo-dashboard",
  title: "执行过程展示（演示）",
  preview: "表格转网页看板：从开头的思考到交付。",
  turns: [
    {
      user: "把这个台账 Excel 做成一个网页看板",
      attachments: ["台账.xlsx"],
      entries: [
        think(12, "用户要把台账做成网页看板。有现成的“表格转网页看板”技能，先加载技能，按技能流程走：解析表格 → 选模板 → 注入数据 → 验收。", 0, "开头的思考没有 Segment 归属，单独放一行；运行中显示“正在思考”"),
        { item: { kind: "hidden", id: id("hidden"), tool: "ListAvailableSkills", detail: { type: "raw", output: "table-data-prep-html, docx, xlsx, pptx …" } }, silent: true },
        ev("LoadSkillContent", "skill", "使用技能「表格转网页看板」", "正在加载技能「表格转网页看板」", 12, { type: "raw", input: "skill_id: table-data-prep-html", output: "# 表格转网页看板\n1. 解析表格并生成数据画像\n2. 按画像选择模板\n3. 注入数据并验收" }, { note: "技能加载是普通 Event。Segment 里只有它一个时，Segment Header 直接写它的名字" }),
        say("我来按照技能说明的流程操作，先解析表格，再根据数据画像选择模板制作看板。", 14, "Narration 原样显示，并在这里切一刀"),
        ev("execute", "run", "运行 read_table.py", "正在运行 read_table.py", 17, cmd("python3 read_table.py 台账.xlsx", "Traceback (most recent call last):\n  File \"read_table.py\", line 3, in <module>\n    import openpyxl\nModuleNotFoundError: No module named 'openpyxl'", 1), { ok: false, note: "这一步失败：只在这一步打 ✕，Segment Header 不变色、不挂标签；模型看到错误后自己处理" }),
        think(9, "缺少读表组件 openpyxl，先安装再重跑。", 18),
        ev("execute", "run", "安装所需组件", "正在安装所需组件", 27, cmd("pip install openpyxl -q", "Successfully installed et-xmlfile-1.1.0 openpyxl-3.1.5"), { note: "段内的思考不计入 Segment Header；超过 5 秒的在展开后单独一行，可看全文" }),
        ev("execute", "run", "运行 read_table.py", "正在运行 read_table.py", 33, cmd("python3 read_table.py 台账.xlsx", "共 1,204 行，12 列\n字段：日期、区域、门店、品类、销售额、毛利、客单数……\n时间范围：2026-01-01 至 2026-10-31")),
        ev("ls", "list", "查看「templates」文件夹", "正在查看「templates」文件夹", 39, cmd("ls templates", "tpl_kpi_grid/\ntpl_trend/\ntpl_region_map/")),
        think(21, "数据是“指标 + 时间序列 + 区域”的画像，tpl_kpi_grid 最合适。读一下模板的结构。", 40),
        ev("read_file", "read", "读取「index.html」", "正在读取「index.html」", 61, file("templates/tpl_kpi_grid/index.html", "<!doctype html>\n<html lang=\"zh-CN\">\n<head>\n  <meta charset=\"utf-8\" />\n  <title>{{title}}</title>\n  <link rel=\"stylesheet\" href=\"style.css\" />\n</head>\n<body>\n  <section id=\"kpis\"></section>\n  <section id=\"charts\"></section>\n  <script src=\"app.js\"></script>\n</body>\n</html>"), { id: "dash-read-index" }),
        { item: { kind: "merged", id: id("merged"), tool: "RestoreToolResult", target: "dash-read-index", detail: { type: "raw", input: "tool_call_id: call_0412 · start: 44000", output: "（index.html 余下部分）" } }, silent: true },
        ev("read_file", "read", "读取「app.js」", "正在读取「app.js」", 63, file("templates/tpl_kpi_grid/app.js", "import { dashboardData } from \"./dashboard_data.js\";\nrenderKpis(dashboardData.kpis);\nrenderCharts(dashboardData.charts);"), { note: "上一步结果过长被分段取回（RestoreToolResult），并入“读取「index.html」”，不单独成行；点开那一行时输出按顺序拼在一起" }),
        ev("read_file", "read", "读取「style.css」", "正在读取「style.css」", 64, file("templates/tpl_kpi_grid/style.css", ":root { --accent: #2773ff; }\n.kpi { border: 1px solid #e5e7eb; border-radius: 8px; }")),
        think(16, "模板读清楚了：6 个指标卡 + 3 张图表。生成数据配置，再跑构建脚本。", 65),
        say("模板结构已清楚：6 个指标卡和 3 张图表。现在写入数据配置并生成看板。", 81, "上一个 Segment 收起成一行：按类别计数，取前 3 类；思考不计入"),
        ev("write_file", "write", "写入「dashboard_data.js」", "正在写入「dashboard_data.js」", 84, file("output/dashboard_data.js", DASHBOARD_DATA), {
          preview: { file: "dashboard_data.js", content: DASHBOARD_DATA },
          note: "写入类：模型一开始写就出现“正在写入「文件名」”，不显示行数；写入完成前文件名不可点，写完后点文件名直接打开预览",
        }),
        ev("execute", "run", "运行脚本，生成看板网页", "正在运行脚本，生成看板网页", 101, cmd("python3 build_dashboard.py --data output/dashboard_data.js --out output/台账看板.html", "已生成 output/台账看板.html（38 KB）"), { note: "这一步的名字来自模型调用时填写的意图；没有意图时按模板写“运行 build_dashboard.py”" }),
        browser("navigate", "打开「台账看板.html」", "正在打开「台账看板.html」", "url: file:///workspace/output/台账看板.html", "页面已打开：台账看板", 108, { note: "网页操作每一步一个 Event，名字写这一步做了什么；Segment 默认收起，不会刷屏" }),
        browser("snapshot", "读取页面内容", "正在读取页面内容", "", "6 个指标卡、3 张图表均已渲染", 110),
        browser("click", "点击「区域销售占比」", "正在点击「区域销售占比」", "selector: ref=e12（区域销售占比）", "已切换到“区域销售占比”", 111),
        deliver("CreateArtifact", { type: "file", title: "台账看板.html", meta: "38 KB" }, 112, {
          ok: false,
          failName: "准备文件「台账看板.html」",
          detail: { type: "raw", input: "path: output/台账看板.html", output: "upload failed: connection reset" },
          note: "交付工具运行中，在 Segment 里显示“正在准备文件”；这次失败了，留下作为一个 Event 打 ✕",
        }),
        deliver("CreateArtifact", { type: "file", title: "台账看板.html", meta: "38 KB" }, 114, { note: "模型重新调用后成功，文件卡片放进 Delivery，不在过程区出现" }),
        { item: { kind: "answer", id: id("answer"), text: "看板已生成，包含 6 个指标卡和 3 张图表，数据截至 10 月 31 日。", at: 116 } },
      ],
      end: { state: "done", at: 116, note: "完成后整体收成状态行“已完成 · 用时”；点开看过程" },
    },
  ],
};

export const CLARIFY_STOP_DEMO: ProcessDemo = {
  id: "process-demo-clarify-stop",
  title: "确认卡片与停止（演示）",
  preview: "澄清卡片切段、计时暂停，用户中途停止。",
  turns: [
    {
      user: "把 Q3 销售复盘整理成一页纸，发给项目组",
      entries: [
        think(6, "一页纸的读者不确定，口径会不一样。先问清楚给谁看。", 0),
        say("我先确认一下这份一页纸给谁看，再开始整理。", 6),
        {
          item: {
            kind: "clarify",
            id: "clarify-audience",
            question: "这份一页纸主要给谁看？",
            options: [
              { value: "team", label: "项目组内部同步" },
              { value: "leader", label: "给管理层汇报" },
              { value: "client", label: "对外给客户" },
            ],
            at: 8,
          },
          note: "澄清卡片切段；状态行“等待你确认”。第一次点选项时计时停住，点“确认”后继续计时",
        },
        say("好，按项目组内部同步的口径整理，重点放在各区域的问题和下季度动作。", 8),
        ev("SearchConversationHistory", "history", "回顾之前的对话：「Q3 一页纸」，没有找到相关内容", "正在回顾之前的对话", 10, { type: "search", query: "Q3 一页纸", results: [] }, { note: "空结果算成功，照常打 ✓" }),
        ev("SearchConversationHistory", "history", "回顾之前的对话：「Q3 销售复盘」，找到 3 条", "正在回顾之前的对话", 11, { type: "search", query: "Q3 销售复盘", results: ["10-12 Q3 销售复盘会议纪要", "10-15 华东区异常波动说明", "10-20 下季度目标拆解"] }),
        ev("read_file", "read", "读取「Q3销售数据.xlsx」", "正在读取「Q3销售数据.xlsx」", 14, file("Q3销售数据.xlsx", "Sheet1：区域 / 目标 / 实际 / 完成率（共 6 个区域）")),
        ev("execute", "run", "运行脚本，汇总各区域指标", "正在运行脚本，汇总各区域指标", 18, cmd("python3 summarize.py Q3销售数据.xlsx", "华东 112%｜华南 96%｜华北 88%｜西南 103%｜西北 79%｜东北 91%")),
        think(5, "华北和西北没达标，一页纸里要单独写原因。", 24, "模型在思考时，用户点了停止"),
      ],
      end: { state: "stopped", at: 27, note: "用户点停止：状态行“已停止 · 用时”，已有的过程保留" },
    },
  ],
};

export const AUTOMATION_INTERRUPT_DEMO: ProcessDemo = {
  id: "process-demo-automation-interrupt",
  title: "定时任务与中断（演示）",
  preview: "设置类交付的结果卡；运行中被系统中断。",
  turns: [
    {
      user: "以后每周一早上 9 点，帮我汇总上周的销售周报",
      entries: [
        think(3, "用户要建一个每周执行的定时任务。", 0, "思考不到 5 秒，不显示"),
        deliver("CreateAutomationTask", { type: "automation", title: "销售周报汇总", meta: "每周一 9:00", task: WEEKLY_SALES_TASK }, 3, { runningName: "正在创建定时任务「销售周报汇总」", detail: { type: "raw", input: "name: 销售周报汇总 · scheduleType: weekly · schedule: [1] 09:00", output: "task_id: at_20261103_01" }, note: "定时任务属于交付类：运行中在 Segment 里显示“正在创建定时任务「…」”，完成后移进 Delivery 出定时任务卡片（任务名 + 执行时间），点“查看”打开定时任务弹窗；过程区不留" }),
        { item: { kind: "answer", id: id("answer"), text: "已设置好：每周一 9:00 自动汇总上周销售周报，结果会发到这个对话。", at: 5 } },
      ],
      end: { state: "done", at: 5, note: "这一轮没有工具段，只有交付结果卡" },
    },
    {
      user: "先按这个口径把上周的跑一遍",
      entries: [
        think(7, "先读第 44 周的周报，按区域汇总，再到 BI 看板核对一下数字。", 0),
        ev("read_file", "read", "读取「销售周报-第44周.xlsx」", "正在读取「销售周报-第44周.xlsx」", 7, file("销售周报-第44周.xlsx", "门店 214 家；字段：区域 / 门店 / 销售额 / 毛利")),
        ev("execute", "run", "运行脚本，按区域汇总", "正在运行脚本，按区域汇总", 10, cmd("python3 weekly.py 销售周报-第44周.xlsx", "6 个区域汇总完成")),
        browser("navigate", "打开 bi.example.com", "正在打开 bi.example.com", "url: https://bi.example.com/sales/weekly", "页面已打开：销售周报看板", 15, { note: "打开网页：名字写域名" }),
        { item: { kind: "interrupt", id: id("interrupt"), message: "当前响应已中断：模型服务响应超时。", at: 41 }, note: "系统中断（模型服务出错、超时）：状态行“已中断”，下方沿用现有的中断提示和重试" },
      ],
      end: { state: "interrupted", at: 41, note: "已中断：过程区不自动收起，停在中断时的位置" },
    },
  ],
};

export const PROCESS_DEMOS: ProcessDemo[] = [DASHBOARD_DEMO, CLARIFY_STOP_DEMO, AUTOMATION_INTERRUPT_DEMO];

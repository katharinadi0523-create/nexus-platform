import { cmd, ev, file, say, think, type DemoEntry, type DemoTurn, type ProcessDemo } from "./demo-scripts";

/** 打开即停在最后一帧的演示：整段历史一次性铺开，用来看对话导航。 */
export interface HistoryProcessDemo extends ProcessDemo {
  startAtEnd?: boolean;
}

let seq = 0;
const answer = (text: string, at: number): DemoEntry => ({ item: { kind: "answer", id: `nav-answer-${++seq}`, text, at } });

const turn = (user: string, entries: DemoEntry[], at: number, attachments?: string[]): DemoTurn => ({
  user,
  attachments,
  entries,
  end: { state: "done", at, note: "" },
});

const read = (path: string, content: string, at: number) => {
  const name = path.split("/").pop() ?? path;
  return ev("read_file", "read", `读取「${name}」`, `正在读取「${name}」`, at, file(path, content));
};
const run = (name: string, command: string, output: string, at: number) =>
  ev("execute", "run", name, `正在${name}`, at, cmd(command, output));

const TURNS: DemoTurn[] = [
  turn("帮我看一下华东区第 44 周的经营数据，先给个整体结论", [
    read("华东经营数据-第44周.xlsx", "城市 12 个；指标：销售额、毛利、客流、客单价", 2),
    run("运行脚本，按城市汇总", "python3 weekly_summary.py 华东经营数据-第44周.xlsx", "12 个城市汇总完成", 5),
    answer("第 44 周华东区销售额 1.82 亿，环比 +3.6%；毛利率 31.2%，持平。客流下降 2.1%，靠客单价拉回来。", 9),
  ], 9, ["华东经营数据-第44周.xlsx"]),
  turn("客流下降主要是哪几个城市？", [
    run("运行脚本，按城市拆客流", "python3 traffic.py --week 44", "苏州 -9.4%｜南通 -6.1%｜嘉兴 -4.8%", 3),
    answer("主要是苏州（-9.4%）、南通（-6.1%）和嘉兴（-4.8%），三城合计拖累整体客流 1.7 个点。", 6),
  ], 6),
  turn("苏州为什么掉这么多？是不是有门店关了", [
    ev("SearchConversationHistory", "history", "回顾之前的对话：「苏州 闭店」，找到 1 条", "正在回顾之前的对话", 2, { type: "search", query: "苏州 闭店", results: ["10-22 苏州门店闭店装修"] }),
    answer("是。苏州观前街店 10 月 22 日起闭店装修，这家店平时占苏州客流的 18%，扣掉它后苏州客流基本持平。", 5),
  ], 5),
  turn("那南通和嘉兴呢", [
    say("这两个城市没有闭店记录，我按日拆一下看是哪几天掉的。", 1),
    run("运行脚本，按日拆客流", "python3 traffic.py --city 南通,嘉兴 --daily", "两城周三、周四客流明显偏低", 4),
    answer("南通和嘉兴都集中在周三、周四掉量，对应 10 月 29—30 日的连续降雨。周末已回到正常水平。", 8),
  ], 8),
  turn("把天气影响单独写一段，后面周报要用", [
    answer("天气影响：10 月 29—30 日华东北部连续降雨，南通、嘉兴两天客流平均下降 14%，周末恢复。属于短期因素，不需要调整下周目标。", 4),
  ], 4),
  turn("客单价涨了多少？是哪个品类带起来的", [
    run("运行脚本，拆客单价", "python3 basket.py --week 44", "客单价 +5.8%；家电 +12.4%，生鲜 +1.1%", 4),
    answer("客单价 +5.8%。主要是家电品类，单品均价 +12.4%，和双十一预热活动有关；生鲜只涨了 1.1%。", 7),
  ], 7),
  turn("双十一预热是哪天开始的？对比去年同期看看", [
    read("营销日历-2026Q4.xlsx", "双十一预热：10-25 开始；去年：10-24 开始", 2),
    answer("今年 10 月 25 日开始预热，比去年晚一天。按预热第 1 周对齐，今年家电销售额同比 +8.3%。", 6),
  ], 6),
  turn("毛利率持平这个结论我有点怀疑，家电毛利不是更低吗？\n你再核一下品类结构", [
    think(6, "家电占比上升会拉低毛利率，但整体持平，说明其他品类毛利率在升。要拆品类结构和品类毛利。", 0),
    run("运行脚本，拆品类毛利", "python3 margin.py --week 44 --by category", "家电占比 +2.3pt；生鲜毛利率 +1.6pt", 7),
    answer("你说得对，家电占比上升 2.3 个点，拉低整体毛利率约 0.5 个点。被生鲜毛利率提升 1.6 个点抵消了，所以表面持平。", 11),
  ], 11),
  turn("生鲜毛利为什么能涨 1.6 个点", [
    answer("主要是损耗下降：第 43 周起华东生鲜试点按小时补货，损耗率从 4.1% 降到 2.7%。", 3),
  ], 3),
  turn("这个按小时补货的试点有哪些门店在做", [
    read("生鲜补货试点名单.xlsx", "试点门店 26 家，覆盖上海、杭州、南京", 2),
    answer("26 家门店，分布在上海、杭州、南京三个城市。名单我放在了工作空间里。", 4),
  ], 4),
  turn("试点门店和非试点门店的损耗率对比一下", [
    run("运行脚本，对比损耗率", "python3 loss.py --pilot", "试点 2.7%｜非试点 4.0%", 3),
    answer("试点门店损耗率 2.7%，非试点 4.0%，差 1.3 个点。试点前两组门店基本一样（4.1% vs 4.0%）。", 6),
  ], 6),
  turn("好，把这个也写进周报，作为亮点", [
    answer("已加到亮点部分：生鲜按小时补货试点使损耗率下降 1.3 个点，带动生鲜毛利率 +1.6 个点。", 3),
  ], 3),
  turn("周报的结构你先列一下给我看", [
    answer("一、整体结论；二、客流（闭店、天气）；三、客单价（双十一预热）；四、毛利（品类结构、生鲜试点）；五、下周关注。", 3),
  ], 3),
  turn("下周关注写三条就够了", [
    answer("1. 苏州观前街店 11 月 8 日复业后的客流恢复；2. 双十一正式期家电毛利；3. 生鲜试点是否扩到苏州。", 4),
  ], 4),
  turn("用公司周报模板出一版 Word", [
    read("templates/经营周报模板.docx", "封面 / 摘要 / 正文 / 附表", 2),
    ev("write_file", "write", "写入「华东经营周报-第44周.docx」", "正在写入「华东经营周报-第44周.docx」", 6, file("华东经营周报-第44周.docx", "按模板生成，共 4 页")),
    answer("Word 版已生成，4 页，按公司模板排版。", 9),
  ], 9),
  turn("摘要太长了，压到三句话以内", [
    answer("已压缩：华东第 44 周销售额 1.82 亿，环比 +3.6%。客流受闭店和降雨影响下降 2.1%，客单价 +5.8% 拉回。生鲜补货试点降低损耗，毛利率持平。", 4),
  ], 4),
  turn("附表里加上 12 个城市的明细", [
    run("运行脚本，生成城市明细表", "python3 city_table.py --week 44", "12 行 × 6 列", 3),
    answer("附表已加上 12 个城市的销售额、毛利率、客流、客单价、环比和同比。", 6),
  ], 6),
  turn("苏州那一行备注一下闭店", [
    answer("已在苏州一行加备注：观前街店 10-22 起闭店装修，预计 11-08 复业。", 2),
  ], 2),
  turn("帮我检查一下数字前后是否一致", [
    run("运行脚本，核对周报数字", "python3 check_report.py 华东经营周报-第44周.docx", "发现 1 处不一致：摘要客流 -2.1%，正文 -2.2%", 4),
    answer("有 1 处不一致：摘要写客流 -2.1%，正文写 -2.2%。按原始数据是 -2.13%，统一成 -2.1%。已改。", 7),
  ], 7),
  turn("再出一版一页纸，给区域总看", [
    ev("write_file", "write", "写入「华东经营一页纸-第44周.pdf」", "正在写入「华东经营一页纸-第44周.pdf」", 5, file("华东经营一页纸-第44周.pdf", "单页")),
    answer("一页纸已生成：上半页 4 个指标卡，下半页客流、客单价、毛利各一句结论加下周关注。", 8),
  ], 8),
  turn("指标卡里的环比用红绿色标一下", [
    answer("已加：上升用绿色，下降用红色。客流 -2.1% 显示为红色。", 3),
  ], 3),
  turn("区域总习惯看同比，环比放小一点", [
    answer("已调整：指标卡主数字下面先写同比，环比改成小字放在右侧。", 3),
  ], 3),
  turn("好的，周一早上 9 点发给华东区域群", [
    answer("我没有发群消息的权限。可以把一页纸和 Word 版放到工作空间，你转发；或者先接入飞书渠道。", 3),
  ], 3),
  turn("那先放工作空间吧，下周一提醒我", [
    answer("已放进工作空间「华东周报」目录，并设好提醒：11 月 9 日（周一）9:00 提醒你转发。", 3),
  ], 3),
];

export const NAV_HISTORY_DEMO: HistoryProcessDemo = {
  id: "process-demo-long-history",
  title: "华东经营周报（conversation map）",
  preview: "二十多轮来回修改的周报会话。",
  startAtEnd: true,
  turns: TURNS,
};

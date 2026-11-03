import type { ExpenseRenderNode } from "@/lib/mock/my-claw/expense-adapter";
import type { EventCategory, RawItem } from "./model";

/**
 * 报销历史会话：把旧的时间线节点换成原始事件，交给同一个投影函数。
 * 工具名字按展示规则重写：内置工具用模板，连接器类工具用模型写的意图（动作 + 对象）。
 */
function nameTool(tool: NonNullable<Extract<ExpenseRenderNode, { type: "action" }>["tool"]>): {
  category: EventCategory;
  name: string;
  runningName: string;
} {
  const target = tool.target ?? "";
  switch (tool.name) {
    case "文档解析":
    case "图像理解":
      return { category: "read", name: `读取「${target}」`, runningName: `正在读取「${target}」` };
    case "local.file.create":
    case "document.generate_docx":
      return { category: "write", name: `写入「${target}」`, runningName: `正在写入「${target}」` };
    case "local.file.delete":
      return { category: "other", name: `删除「${target}」`, runningName: `正在删除「${target}」` };
    case "shell.exec":
      return { category: "run", name: tool.action === "列出" ? `查看「${target}」` : "运行命令", runningName: "正在运行命令" };
    case "code.execute":
      return { category: "run", name: "运行脚本，核对报销金额", runningName: "正在运行脚本，核对报销金额" };
    case "browser.inspect":
      return { category: "browser", name: "操作浏览器", runningName: "正在操作浏览器" };
    default: {
      const intent = `${tool.action ?? ""}${target}`.replace(/\s+/g, "") || tool.name;
      return { category: "other", name: intent, runningName: `正在${intent}` };
    }
  }
}

function thinkingSeconds(text: string) {
  return Math.max(2, Math.min(24, Math.round(text.length / 10)));
}

export function expenseNodesToItems(
  nodes: ExpenseRenderNode[],
  renderCard: (node: ExpenseRenderNode) => React.ReactNode,
  finished: boolean,
): RawItem[] {
  const items: RawItem[] = [];
  nodes.forEach((node, index) => {
    const next = nodes[index + 1];
    switch (node.type) {
      case "thinking":
        items.push({ kind: "thinking", id: node.key, seconds: thinkingSeconds(node.timeline.message.content), text: node.timeline.message.content });
        break;
      case "output": {
        const isLast = finished && !nodes.slice(index + 1).some((rest) => rest.type === "output");
        items.push(isLast ? { kind: "answer", id: node.key, text: node.timeline.message.content } : { kind: "narration", id: node.key, text: node.timeline.message.content });
        break;
      }
      case "action": {
        // 同一次调用的“运行中”快照，后面紧跟它的结果，只保留结果。
        if (next?.type === "action" && next.tool && node.tool && next.tool.name === node.tool.name && next.tool.target === node.tool.target && node.tool.status.includes("running")) break;
        if (!node.tool) {
          const skill = node.timeline.title.replace(/^技能 · /, "");
          items.push({ kind: "event", id: node.key, tool: "LoadSkillContent", category: "skill", name: `使用技能「${skill}」`, runningName: `正在加载技能「${skill}」`, ok: true, detail: { type: "raw", output: node.timeline.logs.join("\n") } });
          break;
        }
        const named = nameTool(node.tool);
        items.push({
          kind: "event",
          id: node.key,
          tool: node.tool.name,
          ...named,
          ok: node.timeline.status !== "failed",
          detail: { type: "raw", input: [node.tool.action, node.tool.target].filter(Boolean).join(" "), output: node.timeline.logs.join("\n") },
        });
        break;
      }
      case "plan":
      case "todo":
        // 任务清单按“任务清单”需求放在对话框下方，不进过程区。
        items.push({ kind: "hidden", id: node.key, tool: "PlanList" });
        break;
      case "compression":
        items.push({ kind: "hidden", id: node.key, tool: "context_compression", detail: { type: "raw", output: `${node.title}\n${node.summary}` } });
        break;
      case "artifacts":
        node.artifacts.forEach((artifact, artifactIndex) => {
          items.push({ kind: "delivery", id: `${node.key}-${artifactIndex}`, tool: "CreateArtifact", ok: true, card: { type: "file", title: artifact.name, meta: artifact.size } });
        });
        break;
      case "user":
        break;
      case "destructive":
        // 需要用户确认的操作：卡片，切段；历史会话里已确认。
        items.push({
          kind: "card",
          id: node.key,
          tool: node.tool?.name ?? "confirmation",
          render: () => (
            <div className="my-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-[13px]">
              <p className="text-slate-700">{node.summary ?? node.timeline.logs[0]}</p>
              {node.impact.length ? (
                <ul className="mt-1.5 space-y-0.5 text-slate-500">
                  {node.impact.map((line) => (
                    <li key={line}>· {line}</li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-1.5 text-slate-500">你选择了：{node.confirmLabel}</p>
            </div>
          ),
        });
        break;
      default:
        items.push({ kind: "card", id: node.key, tool: node.type, render: () => renderCard(node) });
    }
  });
  return items;
}

# Design QA：Issue 唯一主会话入口

## Evidence

- Source visual truth: `/var/folders/yf/92b27ch521zbdlg6rtbpnhx80000gn/T/codex-clipboard-49ea9094-e12f-4caf-b268-0a6d759d2fa0.png`
- Implementation screenshot: `/Users/nanbunan/Dev-Projects/nexus-platform/.codex-issue-primary-conversation-qa.png`
- Combined comparison: `/Users/nanbunan/Dev-Projects/nexus-platform/.codex-issue-primary-conversation-comparison.png`
- Browser route: `http://localhost:3000/my-claw/projects/proj-claw-collab?view=issues&issue=issue-proto-mount`
- Browser viewport: `1280 × 720` CSS px
- State: Project 事项看板打开 `CLAW-22` 详情，Issue 已绑定且当前用户可访问唯一主会话

## Normalization

- Source image: `467 × 794` px，1x。
- Source normalized to: `460 × 782` px，保持原比例。
- Implementation drawer crop: `460 × 720` px，1x。
- 两图按相同的 460 px 抽屉宽度顶端对齐；高度差来自浏览器视口，目标比较区域是抽屉顶部至“主会话”后的连续内容。

## Full-view Comparison

合并对照图同时包含修改前和浏览器渲染后的抽屉。标题、状态、摘要、最新进展及后续验收字段在相同宽度下保持原有字体、颜色和对齐方式。唯一主会话区域由大块二级卡片收敛为单行入口，后续内容整体上移，没有引入横向溢出或遮挡。

## Focused Region Comparison

需要聚焦比较，因为本次目标仅为原截图红框中的主会话区域。

- 信息层级：保留“主会话”字段标签，唯一会话名称成为主文本。
- 跳转语义：辅助文案明确“定位到事项来源消息”，右侧使用轻量“打开”入口。
- 布局：整行可点击，图标、名称、辅助文案与操作在一个 58 px 左右的紧凑容器中。
- 视觉：沿用页面现有蓝色、灰色、圆角和 1 px 边框，不再出现抢占注意力的大蓝色按钮。

## Required Fidelity Surfaces

- Fonts and typography: 继续使用项目现有字体栈；字段标签、会话名称和辅助说明分别使用 11 px、12 px、11 px，权重层级清晰，无异常换行。
- Spacing and layout rhythm: 主会话区域显著减高；上下字段间距与抽屉其他字段一致，无溢出。
- Colors and visual tokens: 使用现有 `#2773ff` 品牌蓝、`#5a6779` / `#7a8798` 次级文字色和浅灰边框。
- Image quality and asset fidelity: 本区域无位图资产；图标使用项目现有图标体系，显示清晰。
- Copy and content: “主会话”“原型技术验证”“定位到事项来源消息”“打开”准确表达 1:1 关联与跳转行为。

## Findings

- 无 P0、P1、P2 问题。
- 未发现需要阻塞交付的视觉或交互差异。

## Interaction and Console Checks

- 点击唯一主会话行后，成功进入：
  `http://localhost:3000/my-claw/projects/proj-claw-collab/conversations/conv-proto-verify?message=msg-proto-3`
- 已确认路由同时携带 Conversation ID 与来源 Message ID。
- 交互后浏览器 console 无 error 或 warning。

## Comparison History

- Pass 1: 浏览器实渲染与源截图合并比较；未发现可执行的 P0、P1、P2 问题，无需二次视觉修复。

## Implementation Checklist

- [x] 已绑定主会话使用紧凑单行入口。
- [x] 整行可点击并定位来源消息。
- [x] 未绑定态采用轻量虚线容器。
- [x] 无权限时不展示整个主会话字段，不泄露受限会话的存在、名称或消息。
- [x] 目标组件 ESLint 通过。
- [x] 浏览器截图与点击链路验证完成。

final result: passed

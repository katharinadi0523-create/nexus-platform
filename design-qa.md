# Design QA — 排队与引导演示

## 对比对象与证据

- Source visual truth: `/var/folders/1d/hrv203t96_qcn3ql92lgwb480000gn/T/codex-clipboard-2ed648d1-210c-4910-85ad-830331eb3a50.png`（当前产品样式，1136 × 435 px）；另参考竞品图 `/var/folders/1d/hrv203t96_qcn3ql92lgwb480000gn/T/codex-clipboard-0abc5d56-9394-435d-875e-c6931067dd25.png`。
- Implementation: `http://localhost:3000/claw-client?sessionId=queue-steer-demo`；Chrome 中捕获了当前运行状态的整页截图（1920 × 1080 截图像素），但 CUA 截图未写入项目文件，无法提供可复查的截图路径。
- Viewport / density: 截图图像像素分别为 1136 × 435 和 1920 × 1080；CSS viewport 与 device-pixel-ratio 未读取，无法做密度归一化。
- State: 演示已重置为初始状态：当前响应进行中，队列中有两条消息。
- Full-view comparison evidence: 已查看实现的完整浏览器截图；参考图为内容区域裁图，未与实现图合并为同一比较输入，因此不据此判断完整页面的像素级差异。
- Focused-region evidence: 实现队列区与参考图的队列区均已查看；因缺少持久化实现截图和归一化的并排图，精确尺寸、间距和字体比较未完成。

## Fidelity surfaces

- Typography: 语义层级清楚；未完成字体、字号、行高和字重的归一化对比。
- Layout and spacing: 主工作区保留现有产品框架，队列容器、任务行和输入框可见；完整页面与内容裁图视口不同，间距精度待复核。
- Colors and tokens: 队列浅色底、描边与蓝色进行态沿用当前产品样式；未进行像素取样。
- Images and icons: 使用现有界面图标组件，没有新增需要还原的插画或品牌资产。
- Copy and content: 明确显示本地模拟提示、队列数、任务操作和响应状态；演示任务与参考图场景一致。

## Findings

- 当前交互验收未发现阻塞项。手动验证覆盖：队列引导、编辑、删除与置顶；暂停后点击引导会恢复被中断任务并从队列移除所选消息；队列不支持任意上下移动或拖动排序；停止后发送新消息会追加至暂停队列且不弹确认框；中断及两处继续入口；刷新后状态恢复；重置演示。
- 视觉验收证据不完整：实现截图没有保存到文件，且未用同一归一化比较输入检查全部视觉表面。需要持久化截图后再做严格的视觉对照。

## Implementation checklist

- [x] 浏览器中打开演示页面并检查初始状态。
- [x] 手动走查主要交互；验证空队列隐藏队列区块、停止后发送消息会追加到暂停队列、暂停后引导可恢复会话，以及置顶将消息移至队首。
- [x] 当前改动通过 targeted ESLint 和 `git diff --check`；production build 在本次发送行为调整前通过。
- [ ] 保存浏览器截图并与参考图做同视口 / 同区域比较。

final result: blocked

Blocker: 当前工具会话没有把浏览器截图保存到项目文件的能力，无法满足可复查的截图路径及归一化对照要求。功能和构建验证已完成；精细视觉验收仍待补充。

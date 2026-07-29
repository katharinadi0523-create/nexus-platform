# My Claw 农业科研协作原型故事线：冬小麦节水灌溉与产量响应研究

> 文档类型：农业科研场景故事线 / Mock 数据与演示规格  
> 日期：2026-07-29  
> 适用原型：My Claw Project 多会话、全局事项看板、多 Agent 协作、Skill 执行与科研数据血缘  
> 关联文档：`2026-07-29-my-claw-project-collaboration-prototype-release-note.md`

---

## 1. 文档目的

本故事线用于 Mock 一个从田间数据产生开始的完整农业科研协作过程。

它必须重点验证：

1. 数据首先由真实田间试验和传感器产生，而不是直接从一份整理好的 CSV 开始；
2. Human 将仪器产生的特殊格式文件带入 Conversation；
3. 专业 Agent 调用自己携带的解析 Skill；
4. Skill 将特殊格式解析为标准化数据，并记录确定性输入、处理和输出；
5. Human 负责确认设备、小区、时区、校准和异常事件等田间事实；
6. 多个专业 Agent 通过消息、Issue Brief 和 Project Artifact 接力；
7. 一个 Project 下至少包含两个 Conversation，并由一个全局事项看板汇总；
8. 数据血缘可以从报告反向追到模型结果、分析数据、解析结果和原始仪器文件；
9. Agent 回复、运行成功或 Human 已读都不会自动完成 Issue；
10. 只有 Human 明确验收后，稳定数据和报告才成为 Project 事实。

---

## 2. 农业科研 Project

### 2.1 Project 定义

```text
Project ID：proj-wheat-water-saving
Project 名称：冬小麦节水灌溉与产量响应研究

研究目标：
基于 24 个田间小区的连续土壤水分、冠层温度、气象、
灌溉事件、无人机 NDVI 和最终产量数据，
比较不同灌溉处理下冬小麦的水分响应，
形成可复核的节水灌溉阶段研究报告。
```

### 2.2 试验设计

```text
作物：冬小麦
品种：2 个
灌溉处理：充分灌溉、轻度亏缺、重度亏缺
重复：每个品种 × 处理 4 个重复
总计：24 个田间小区
试验周期：返青期至成熟期
```

每个小区持续采集：

- 20 cm 和 40 cm 土壤体积含水量；
- 冠层温度；
- 空气温湿度；
- 光合有效辐射；
- 降雨量；
- 灌溉流量；
- 关键生育期无人机 NDVI；
- 成熟期籽粒产量。

### 2.3 阶段交付

```text
1. 数据记录器文件解析结果
2. 设备与田间小区映射表
3. 传感器质量控制报告
4. 小区日尺度水分胁迫特征数据
5. 灌溉处理效应与模型诊断
6. 无人机 NDVI 一致性复核
7. 节水灌溉阶段研究报告
```

---

## 3. 故事起点：田间数据产生

### 3.1 数据产生过程

Day 0，田间技术员陈禾完成 24 个小区的传感器布设：

```text
土壤水分探头
+ 红外冠层温度传感器
+ 小型气象站
+ 灌溉流量计
→ Campbell Scientific CR1000X 数据记录器
```

数据记录器每 10 分钟写入一次观测记录，并按日导出：

```text
TOA5_WheatTrial_Soil_20260701.dat
TOA5_WheatTrial_Soil_20260702.dat
TOA5_WheatTrial_Met_20260701.dat
TOA5_WheatTrial_Irrigation_20260701.dat
```

这些 `.dat` 文件不是普通业务 CSV。TOA5 是带长表头的表格化 ASCII 格式，文件包含记录器环境信息、字段名、单位、处理类型以及后续数据记录；同一个 TOA5 文件只对应一个数据表。

格式依据：

- [Campbell Scientific：TOA5 文件格式](https://help.campbellsci.com/loggernet-manual/ln_manual/campbell_scientific_file_formats/toa5.htm)
- [Campbell Scientific：CR1000X 数据表说明](https://help.campbellsci.com/CR1000X/Content/shared/Details/Data/About_Data_Tables.htm)

### 3.2 同期产生的人工与辅助数据

除仪器原始文件外，Human 还产生：

```text
plot_layout_v1.csv
  田间小区 ID、品种、灌溉处理、重复编号

logger_channel_map_v1.xlsx
  记录器通道、传感器序列号、小区 ID、土层深度

irrigation_events.csv
  每次灌溉时间、处理、灌水量

sensor_calibration_2026.xlsx
  传感器校准系数和有效日期

field_events.md
  断电、探头更换、降雨、灌溉和人工巡田记录
```

这些文件不是附属说明，而是后续正确解释传感器数据所需的科研输入。

---

## 4. 特殊格式解析 Skill

### 4.1 Skill 定义

```text
Skill ID：skill-campbell-toa5-parser
Skill 名称：Campbell TOA5 农田数据解析
Skill 版本：1.3.0
所属 Agent：田间数据接入 Claw
```

该 Skill 是 Agent 默认 Capability，跟随“田间数据接入 Claw”，不作为 Project Shared Tool 自动赋予其他 Agent。

### 4.2 Skill 输入

```text
必需输入
  TOA5 *.dat 文件

可选输入
  logger_channel_map.xlsx
  plot_layout.csv
  sensor_calibration.xlsx

解析参数
  expectedStationName
  timezone
  timestampPolicy
  missingValuePolicy
```

### 4.3 Skill 的确定性处理

Skill 负责：

1. 验证首个字段是否为 `TOA5`；
2. 读取记录器型号、序列号、程序名、程序签名和数据表名；
3. 读取字段名、单位与记录器处理类型；
4. 解析 Timestamp 和 Record；
5. 检查记录号中断、时间倒退、重复记录和异常表头；
6. 根据 Human 提供的通道映射关联传感器和田间小区；
7. 将单位和字段映射到项目标准 Schema；
8. 输出机器可读数据与解析报告。

Skill 不负责猜测：

- 未知传感器属于哪个小区；
- 一次记录器重启是否属于有效田间事件；
- 缺失值应该插值还是保留；
- 异常值是否具有农艺学意义；
- 某个处理是否应从研究中排除。

这些问题必须由 Human 确认。

### 4.4 Skill 输出

```text
toa5_environment_manifest.json
  记录器、序列号、程序签名、表名和文件信息

sensor_observations_raw.parquet
  标准化长表数据

toa5_schema.json
  原始字段、单位、处理类型与标准字段映射

toa5_parse_report.md
  解析结果、告警、记录缺口和未映射通道

unmapped_channels.csv
  无法确定小区或传感器身份的通道
```

### 4.5 Skill 执行的血缘记录

```text
TOA5 *.dat
+ logger_channel_map.xlsx
+ plot_layout.csv
→ Campbell TOA5 农田数据解析 Skill
→ sensor_observations_raw.parquet
+ toa5_environment_manifest.json
+ toa5_schema.json
+ toa5_parse_report.md
+ unmapped_channels.csv
```

这条关系由 Invocation Builder、Skill Runtime 和 Artifact Service 记录，不由事项管家根据消息文字推断。

---

## 5. Human 与独立 Agent

### 5.1 Human

| ID | 姓名 | 角色 | 主要职责 |
|---|---|---|---|
| `user-ruonan` | 若楠 | Project Lead / 验收人 | 明确研究目标、处理 Inbox、验收阶段交付 |
| `user-chenhe` | 陈禾 | 田间技术员 | 采集数据、维护设备、确认田间事件和传感器映射 |
| `user-zhaoyan` | 赵妍 | 农业统计研究员 | 确认统计设计、异常处理和模型解释 |

### 5.2 Agent

| ID | Agent | 类型 | 主要职责 |
|---|---|---|---|
| `actor-ruonan-claw` | 若楠的 Claw | 个人 Agent | 整理决策、生成验收清单 |
| `actor-field-ingest` | 田间数据接入 Claw | 平台 Agent | 调用 TOA5 Skill、生成标准化数据和解析报告 |
| `actor-agri-stat` | 农业统计 Claw | 平台 Agent | 数据质控、特征构建、混合效应模型和诊断 |
| `actor-remote-sensing` | 农田遥感 Claw | 平台 Agent | 提取小区 NDVI、复核地面传感器结果 |
| `actor-agronomy-literature` | 农艺文献 Claw | 平台 Agent | 检索水分胁迫与产量响应证据 |
| `actor-research-writer` | 科研写作 Claw | 平台 Agent | 汇总方法、数据、结果、限制和报告 |
| `issue-steward` | 事项管家 | 隐形系统 Agent | 识别 Issue、建议状态、维护 Issue Brief |

所有专业 Agent 都以独立身份展示，不封装为统一 Agent 组。

---

## 6. Project 工具与 Conversation 增量工具

### 6.1 Project Work Sources

```text
GitHub Repository
  wheat-water-saving-analysis

Local Directory
  /research/wheat-water-saving-2026
```

### 6.2 Project Shared Tools

| 工具 | 用途 |
|---|---|
| Python / R 分析环境 | 数据清洗、统计分析和绘图 |
| GitHub Research Repo | 读取脚本、记录分析方法变更 |
| 田间气象查询 | 对照区域降雨与极端天气 |
| 项目文档生成 | 汇总 Markdown、图表和报告 |

### 6.3 Agent 默认 Capability

| Agent | 默认能力 |
|---|---|
| 田间数据接入 Claw | Campbell TOA5 农田数据解析 Skill |
| 农业统计 Claw | 农业试验统计 Skill、混合效应模型 Skill |
| 农田遥感 Claw | GeoTIFF 小区统计 Skill |
| 农艺文献 Claw | 农业文献检索 Skill |
| 科研写作 Claw | 科研报告编排 Skill |

### 6.4 Conversation 增量工具

| Conversation | 增量工具 |
|---|---|
| 田间数据接入与质量控制 | 传感器时间序列 QC Workflow |
| 灌溉响应建模与遥感复核 | 小区尺度统计 Workflow、模型诊断 Workflow |
| 结论审阅与阶段报告 | 阶段报告模板、图表排版 Workflow |

---

## 7. Project 下的三个 Conversation

### 7.1 Conversation A：田间数据接入与质量控制

```text
Conversation ID：conv-agri-data-ingest
Human：若楠、陈禾、赵妍
Agent：田间数据接入 Claw、农业统计 Claw、若楠的 Claw
默认文件归属：conversation
```

该 Conversation 保留：

- 仪器原始文件；
- 解析日志；
- 未映射通道；
- 临时清洗结果；
- 传感器异常诊断图。

产生：

- `AGR-101 确认设备、通道与田间小区映射`
- `AGR-102 解析 CR1000X TOA5 田间监测数据`
- `AGR-103 完成传感器质量控制与日尺度聚合`

### 7.2 Conversation B：灌溉响应建模与遥感复核

```text
Conversation ID：conv-agri-modeling
Human：若楠、赵妍
Agent：农业统计 Claw、农田遥感 Claw、农艺文献 Claw、若楠的 Claw
默认文件归属：project
```

该 Conversation 使用经过 Human 验收并发布到 Project 的标准化数据。

产生：

- `AGR-104 评估灌溉处理对水分胁迫与产量的影响`
- `AGR-105 使用无人机 NDVI 复核地面传感器结论`
- `AGR-107 评估热时间交互模型`

### 7.3 Conversation C：结论审阅与阶段报告

```text
Conversation ID：conv-agri-report
Human：若楠、赵妍
Agent：科研写作 Claw、农艺文献 Claw、若楠的 Claw
默认文件归属：project
```

产生：

- `AGR-106 形成节水灌溉阶段研究报告`

### 7.4 会话与 Issue 关系

```text
Conversation A
├── AGR-101
├── AGR-102
└── AGR-103

Conversation B
├── AGR-104
├── AGR-105
└── AGR-107

Conversation C
└── AGR-106
```

一个 Issue 只拥有一个主 Conversation。其他 Conversation 只能引用 Issue 或使用其已发布 Artifact。

---

## 8. 故事总览

```text
Day 0—Day 14
Human 在田间布设设备并持续产生 TOA5 文件

Day 15 上午
陈禾上传首批 TOA5、通道映射和小区布局
→ AGR-101、AGR-102 创建

Day 15 上午
田间数据接入 Claw 调用 TOA5 解析 Skill
→ 发现时区未确认和 4 个通道未映射
→ AGR-102 Waiting for Human

Day 15 下午
陈禾补充记录器时区和通道映射
→ 继续解析
→ 发现一个 .dat 实为 TOB1，TOA5 Skill 拒绝解析
→ AGR-102 Blocked

Day 15 晚上
陈禾从 LoggerNet 重新导出 TOA5 文件
→ 新 Invocation
→ 解析成功
→ AGR-102 In Review

Day 16 上午
赵妍发现记录器重启后的时间段未标注
→ AGR-102 Changes Requested
→ 陈禾补充 field_events.md
→ 重新解析并验收
→ AGR-102 Done
→ 标准化原始观测发布到 Project

Day 16 下午
农业统计 Claw 完成质量控制和日尺度聚合
→ AGR-103 Done

Day 17
农业统计 Claw 建模
→ 农田遥感 Claw 使用 NDVI 复核
→ 农艺文献 Claw 补充解释证据
→ AGR-104、AGR-105 Done

Day 18
科研写作 Claw 形成报告 v1
→ Human 要求降低结论强度并补充设备故障限制
→ 报告 v2
→ AGR-106 Done
```

---

## 9. 旗舰事项 AGR-102：从特殊格式到标准数据

### 9.1 Issue 创建：Clarifying

陈禾发送：

```text
@田间数据接入 Claw，
这是 7 月 1 日到 7 月 14 日从三个 CR1000X 导出的田间数据。
请解析土壤水分、冠层温度、气象和灌溉表，
并按 plot_layout_v1.csv 关联到 24 个田间小区。

附件：
- TOA5_WheatTrial_Soil_20260701_0714.dat
- TOA5_WheatTrial_Met_20260701_0714.dat
- TOA5_WheatTrial_Irrigation_20260701_0714.dat
- logger_channel_map_v1.xlsx
- plot_layout_v1.csv
```

事项管家建议：

```json
{
  "action": "create",
  "title": "解析 CR1000X TOA5 田间监测数据",
  "proposedStatus": "clarifying",
  "reason": "数据对象和目标明确，但记录器时区、缺失值策略和部分通道映射尚未确认"
}
```

结果：

```text
Issue：AGR-102
Primary Conversation：田间数据接入与质量控制
Human Assignee：陈禾
Agent Assignee：田间数据接入 Claw
Status：Clarifying
```

### 9.2 Human 补充解析标准：In Progress

若楠补充验收标准：

```text
- 时间统一转换为 Asia/Shanghai
- 保留原始 Timestamp 和 Record
- 缺失值不自动插值
- 无法映射到小区的通道单独输出
- 记录器重启和记录中断必须进入解析报告
- 标准化数据必须能反向追到原始文件和记录器
```

动作：

```text
Clarifying
→ Human 补齐验收标准
→ Invocation inv-toa5-parse-01
→ In Progress
```

### 9.3 Skill 首次检查：Waiting for Human

田间数据接入 Claw 调用 Skill 后回复：

```text
已读取三个文件的 TOA5 环境行和 Schema。

需要确认：
1. logger-03 的 station name 为 Wheat-West，但映射表写的是 Wheat-W；
2. SM_P17_40、SM_P18_40、IRT_P21、FLOW_W2 未映射到传感器序列号；
3. 文件 Timestamp 未携带时区信息。

在确认前不会自动猜测小区映射。
```

动作：

```text
In Progress
→ Agent 明确请求 Human 输入
→ Waiting for Human
→ Inbox：AGR-102 等待补充记录器与通道映射
```

Human 已读不会改变状态。

### 9.4 Human 提供田间事实：In Progress

陈禾回复：

```text
Wheat-West 和 Wheat-W 是同一台记录器，7 月 6 日改过站点名称。
已补充四个通道的传感器序列号和小区位置。
所有记录器使用北京时间。

附件：logger_channel_map_v2.xlsx
```

动作：

```text
Waiting for Human
→ Human 补齐信息
→ Invocation inv-toa5-parse-02
→ In Progress
```

### 9.5 特殊格式不匹配：Blocked

Skill 检查发现：

```text
TOA5_WheatTrial_Irrigation_20260701_0714.dat
首个格式标识不是 TOA5，而是 TOB1。
文件扩展名同为 .dat，但内容是二进制表格式。
```

田间数据接入 Claw 回复：

```text
灌溉数据文件不是 TOA5，当前 Skill 不会强行按文本解析。
请使用 LoggerNet / CardConvert 重新导出为带 Header、Timestamp 和 Record 的 TOA5。
```

动作：

```text
Invocation inv-toa5-parse-02 Failed
→ AGR-102 Blocked
→ Inbox：灌溉数据格式不兼容，需要重新导出
```

失败 Invocation、输入文件和错误报告全部保留，但不产生伪造的标准化灌溉数据。

### 9.6 Human 修复输入：In Progress

陈禾重新上传：

```text
TOA5_WheatTrial_Irrigation_20260701_0714_reexport.dat
```

并说明：

```text
已按 TOA5、包含 Header、Timestamp 和 Record 重新导出。
```

动作：

```text
Blocked
→ Human 提供可执行输入
→ Invocation inv-toa5-parse-03
→ In Progress
```

### 9.7 Agent 提交解析结果：In Review

Skill 输出：

```text
toa5_environment_manifest.json
sensor_observations_raw.parquet
toa5_schema.json
toa5_parse_report_v1.md
unmapped_channels.csv
```

田间数据接入 Claw 回复：

```text
已解析 3 个 TOA5 数据表，共 201,642 条记录。
24 个小区均已映射。

发现：
- logger-02 在 7 月 9 日 14:20 发生 Record 重置；
- P08 的 40 cm 土壤水分通道存在 3 小时缺口；
- 未进行自动插值；
- 原始文件、Schema、解析产物和告警已写入血缘。
```

动作：

```text
In Progress
→ Agent 提交可验收结果
→ In Review
→ Inbox：AGR-102 等待验收
```

### 9.8 Human 要求返工：Changes Requested

赵妍检查解析报告后发现：

```text
Record 重置发生在更换 logger-02 电池之后，
但 field_events.md 没有这条记录。

请：
1. 把 7 月 9 日电池更换登记为已知田间事件；
2. 将事件前后记录标为同一连续观测序列的两个采集段；
3. 不要自动补齐 P08 的 3 小时缺口。
```

赵妍点击“要求返工”。

```text
In Review
→ Changes Requested
```

陈禾上传：

```text
field_events_v2.md
```

### 9.9 新一轮解析：In Progress → In Review

田间数据接入 Claw 启动：

```text
Invocation inv-toa5-parse-rework
```

新增输出：

```text
toa5_parse_report_v2.md
sensor_observations_raw_v2.parquet
```

血缘必须保留：

- 初次输入；
- TOB1 失败输入；
- Human 重新导出的 TOA5；
- `logger_channel_map_v1 → v2`；
- `field_events.md → field_events_v2.md`；
- 第一轮解析结果；
- 返工意见；
- 第二轮解析结果。

### 9.10 Human 接受：Done

若楠验收：

```text
接受解析结果。
将 sensor_observations_raw_v2.parquet、
toa5_schema.json 和 toa5_parse_report_v2.md 发布到 Project。

原始 TOA5、失败文件、详细日志和 unmapped_channels.csv
继续留在当前 Conversation。
```

动作：

```text
In Review
→ Human Explicit Accept
→ AGR-102 Done
```

---

## 10. 其他 Issue

### 10.1 AGR-101：确认设备、通道与田间小区映射

```text
Clarifying
→ Waiting for Human
→ In Progress
→ In Review
→ Done
```

输出：

- `logger_channel_map_v2.xlsx`
- `plot_sensor_binding_report.md`

Human 是设备和田间布设事实的最终确认者，Agent 不得仅凭字段名猜测小区映射。

### 10.2 AGR-103：传感器质量控制与日尺度聚合

主 Conversation：田间数据接入与质量控制。

输入：

- `sensor_observations_raw_v2.parquet`
- `sensor_calibration_2026.xlsx`
- `field_events_v2.md`
- `irrigation_events.csv`

协作过程：

```text
若楠 @农业统计 Claw
→ 生成传感器漂移、缺失和范围检查
→ 赵妍确认异常处理策略
→ 陈禾确认 P08 缺口来自松动接头
→ 农业统计 Claw 不插值该时段
→ 生成清洗数据和日尺度特征
→ Human 验收
```

输出：

- `sensor_observations_clean.parquet`
- `plot_day_water_features.parquet`
- `sensor_qc_report.md`
- `sensor_gap_summary.csv`

### 10.3 AGR-104：灌溉处理效应分析

主 Conversation：灌溉响应建模与遥感复核。

输入：

- `plot_day_water_features.parquet`
- `irrigation_events.csv`
- `plot_layout_v1.csv`
- `final_yield.csv`

过程：

```text
农业统计 Claw
→ 构建品种、灌溉处理、重复和日期效应模型
→ 输出效应量、置信区间和模型诊断
→ 赵妍要求修改随机效应结构
→ 重新执行
→ Human 验收
```

输出：

- `irrigation_treatment_effects.csv`
- `mixed_model_diagnostics.md`
- `water_stress_yield_response.png`

### 10.4 AGR-105：无人机 NDVI 一致性复核

主 Conversation：灌溉响应建模与遥感复核。

输入：

- `uav_ndvi_heading.tif`
- `plot_boundaries.geojson`
- `plot_day_water_features.parquet`

协作过程：

```text
农业统计 Claw @农田遥感 Claw
→ 引用 AGR-104 的关键时间窗
→ 农田遥感 Claw 提取小区 NDVI
→ 输出 NDVI 与地面水分胁迫的一致性结果
→ 农艺文献 Claw 补充 NDVI 对水分胁迫响应的解释边界
```

输出：

- `plot_ndvi_features.csv`
- `ground_remote_consistency.csv`
- `ndvi_water_stress_comparison.png`
- `agronomy_evidence_summary.md`

### 10.5 AGR-106：形成阶段研究报告

主 Conversation：结论审阅与阶段报告。

科研写作 Claw 使用：

- 已验收的解析报告；
- 传感器 QC 报告；
- 灌溉处理效应；
- 遥感一致性结果；
- 农艺证据摘要；
- Project Brief。

第一轮输出：

```text
冬小麦节水灌溉阶段研究报告_v1.docx
```

若楠要求返工：

```text
当前报告把“重度亏缺降低产量”写成了普遍结论。
请限定为本试验年份、两个品种和当前土壤条件，
并补充 logger-02 重启、P08 数据缺口和无人机单期观测的限制。
```

最终输出：

- `冬小麦节水灌溉阶段研究报告_v2.docx`
- `节水灌溉阶段汇报图表包.zip`

### 10.6 AGR-107：评估热时间交互模型

这是被取消并归档的备选分析。

```text
Clarifying
→ In Progress
→ Cancelled
→ Archived
```

取消原因：

```text
当前只有一个试验季，热时间交互项无法支持稳定外推。
保留分析草稿，不作为本期报告结论。
```

---

## 11. Project 全局事项看板

### 11.1 中途快照

```text
待澄清或审批确认
  AGR-107 评估热时间交互模型

进行中
  AGR-103 完成传感器质量控制与日尺度聚合
  AGR-104 评估灌溉处理效应

等待反馈
  AGR-101 确认设备、通道与田间小区映射

待验收
  AGR-105 使用无人机 NDVI 复核地面结论

已完成
  暂无

执行失败
  AGR-102 解析 CR1000X TOA5 田间监测数据
```

三个 Conversation 的 Issue 汇总在同一个看板。

### 11.2 最终快照

```text
已完成
  AGR-101 确认设备、通道与田间小区映射
  AGR-102 解析 CR1000X TOA5 田间监测数据
  AGR-103 完成传感器质量控制与日尺度聚合
  AGR-104 评估灌溉处理效应
  AGR-105 使用无人机 NDVI 复核地面结论
  AGR-106 形成阶段研究报告

已取消 / 已归档
  AGR-107 评估热时间交互模型
```

---

## 12. 农业科研数据血缘

### 12.1 主链路

```text
田间传感器观测
        │
        ▼
TOA5 Soil / Met / Irrigation *.dat
+ logger_channel_map_v2.xlsx
+ plot_layout_v1.csv
        │
        │ 田间数据接入 Claw
        │ Campbell TOA5 农田数据解析 Skill
        ▼
sensor_observations_raw_v2.parquet
+ toa5_schema.json
+ toa5_parse_report_v2.md
        │
        │ Human 验收并发布到 Project
        ▼
sensor_observations_clean.parquet
+ plot_day_water_features.parquet
        │
        │ 农业统计 Claw
        │ 质量控制与日尺度聚合
        ▼
irrigation_treatment_effects.csv
+ water_stress_yield_response.png
        │
        ├──────────────┐
        │              │
        │              ▼
        │      UAV NDVI GeoTIFF
        │      + plot_boundaries.geojson
        │              │
        │              │ 农田遥感 Claw
        │              ▼
        │      ground_remote_consistency.csv
        │      + ndvi_water_stress_comparison.png
        │              │
        └──────┬───────┘
               │ 农艺文献 Claw 补充证据
               ▼
       agronomy_evidence_summary.md
               │
               │ 科研写作 Claw
               ▼
冬小麦节水灌溉阶段研究报告_v2.docx
```

### 12.2 Transformation Mock

| ID | 执行者 | 处理 | 输入 | 输出 |
|---|---|---|---|---|
| `xform-toa5-parse-v2` | 田间数据接入 Claw + TOA5 Skill | 特殊格式解析 | TOA5、通道映射、小区布局 | raw parquet、Schema、解析报告 |
| `xform-sensor-qc` | 农业统计 Claw | 质量控制 | raw parquet、校准、田间事件 | clean parquet、QC 报告 |
| `xform-daily-features` | 农业统计 Claw | 日尺度聚合 | clean parquet、灌溉事件 | plot-day features |
| `xform-irrigation-model` | 农业统计 Claw | 混合效应模型 | plot-day features、布局、产量 | 处理效应、诊断、图 |
| `xform-ndvi-zonal` | 农田遥感 Claw | 小区 NDVI 提取 | GeoTIFF、边界 | NDVI features |
| `xform-ground-remote` | 农田遥感 Claw | 一致性复核 | NDVI、地面特征 | 一致性表、对比图 |
| `xform-agronomy-evidence` | 农艺文献 Claw | 证据整理 | 模型结果、遥感结果 | 证据摘要 |
| `xform-agri-report-v2` | 科研写作 Claw | 报告编排 | 报告输入 Artifact | 阶段报告 v2 |

### 12.3 血缘事实来源

```text
Human 附件
→ Message Service 记录 explicitInputArtifactIds

Skill 输入参数
→ Invocation Builder 记录绑定输入

Skill / Tool I/O
→ Tool Gateway 记录输入与输出

Sandbox /inputs 与 /outputs
→ Runtime 记录实际读取与生成

文件创建
→ Artifact Service 分配稳定 Artifact ID
```

事项管家可以生成：

```text
“本次解析使用 3 个 TOA5 文件、1 份通道映射和 1 份小区布局，
生成标准化观测、Schema 和解析报告。”
```

但事项管家不能自行写入输入输出关系。

### 12.4 需要保留的失败与返工血缘

- TOB1 格式错误文件仍保留为外部上传 Artifact；
- 失败 Invocation 关联错误报告，但不产生有效标准观测；
- Human 重新导出的 TOA5 是新的 Artifact；
- `logger_channel_map_v1` 和 `v2` 是两个 Artifact；
- `sensor_observations_raw` 第一轮和返工后结果是两个 Artifact；
- 报告 v1 和 v2 是两个 Artifact；
- 前端可以只显示“此前版本”和“当前版本”，不建设完整版本管理。

### 12.5 用户反向追溯路径

```text
阶段研究报告 v2
→ 使用了哪些结论、图表和证据
→ 灌溉处理效应来自哪次模型
→ 模型使用哪一版 plot-day 数据
→ plot-day 数据来自哪次传感器 QC
→ QC 使用哪一版 TOA5 解析数据
→ 解析使用哪些原始 .dat、通道映射和小区布局
→ 哪个 Human 确认了记录器重启和通道映射
```

---

## 13. 文件归属

### 13.1 Conversation A Files

```text
scope = "conversation"
sourceConversationId = "conv-agri-data-ingest"
```

包括：

- 原始 TOA5 和 TOB1 文件；
- 解析日志；
- `unmapped_channels.csv`；
- 第一轮解析结果；
- 临时异常图；
- 失败 Invocation 日志。

### 13.2 Project Files

只展示 Human 验收后发布的稳定文件：

- `toa5_schema.json`
- `toa5_parse_report_v2.md`
- `sensor_observations_raw_v2.parquet`
- `sensor_observations_clean.parquet`
- `plot_day_water_features.parquet`
- `irrigation_treatment_effects.csv`
- `ground_remote_consistency.csv`
- `agronomy_evidence_summary.md`
- `冬小麦节水灌溉阶段研究报告_v2.docx`

不按 Human 聚合，不创建逐人文件权限。

---

## 14. 多 Agent 协作与 Session

### 14.1 Session

```text
conv-agri-data-ingest × actor-field-ingest
→ session-field-ingest

conv-agri-data-ingest × actor-agri-stat
→ session-stat-in-ingest

conv-agri-modeling × actor-agri-stat
→ session-stat-in-modeling

conv-agri-modeling × actor-remote-sensing
→ session-remote-in-modeling

conv-agri-modeling × actor-agronomy-literature
→ session-literature-in-modeling

conv-agri-report × actor-research-writer
→ session-writer-in-report

conv-agri-report × actor-agronomy-literature
→ session-literature-in-report
```

同一个农业统计 Claw 在 Conversation A 和 B 使用两个独立 Session。

### 14.2 Agent 交接

```text
田间数据接入 Claw
→ Project Artifact：标准化传感器数据

农业统计 Claw
→ Project Artifact：处理效应、模型诊断

农田遥感 Claw
→ Project Artifact：NDVI 一致性结果

农艺文献 Claw
→ Project Artifact：解释证据与限制

科研写作 Claw
→ Project Artifact：阶段研究报告
```

每一次交接都有 Human 可见的消息或 Issue Brief，不依赖 Agent 间不可见的私有对话。

### 14.3 Human 不可替代的判断

Human 负责：

- 确认记录器时区和站点改名；
- 确认通道、传感器与田间小区映射；
- 解释断电、换电池、探头松动和灌溉事件；
- 决定缺失数据是否插值；
- 修改统计模型结构；
- 限定科研结论的适用范围；
- 接受或要求返工。

Agent 负责提升处理效率和可追溯性，不替代田间事实和科研责任判断。

---

## 15. Inbox 与“我的工作与项目”

### 15.1 Inbox

| 时间 | 事件 |
|---|---|
| Day 15 10:30 | AGR-102 等待补充记录器时区与通道映射 |
| Day 15 15:20 | 灌溉数据不是 TOA5，解析执行失败 |
| Day 15 17:40 | AGR-102 已提交解析结果，等待验收 |
| Day 16 09:15 | AGR-102 已要求返工 |
| Day 16 11:30 | AGR-102 已完成 |
| Day 17 15:10 | AGR-104 等待验收 |
| Day 18 14:20 | AGR-106 等待验收 |

### 15.2 我的工作与项目

若楠看到：

```text
需要我处理
  AGR-104 灌溉处理效应待验收
  AGR-106 阶段研究报告待验收

进行中
  AGR-105 无人机 NDVI 一致性复核

最近交付
  AGR-102 TOA5 数据解析结果
  AGR-103 传感器 QC 与日尺度特征

参与的 Project
  冬小麦节水灌溉与产量响应研究
```

Inbox、“我的工作与项目”和 Project 看板共用同一 Issue 数据。

---

## 16. 建议 Mock ID

### 16.1 Project 与 Conversation

```text
proj-wheat-water-saving
conv-agri-data-ingest
conv-agri-modeling
conv-agri-report
```

### 16.2 Agent 与 Skill

```text
actor-ruonan-claw
actor-field-ingest
actor-agri-stat
actor-remote-sensing
actor-agronomy-literature
actor-research-writer
skill-campbell-toa5-parser
```

### 16.3 Issue

```text
issue-agr-101-device-map
issue-agr-102-toa5-parse
issue-agr-103-sensor-qc
issue-agr-104-irrigation-model
issue-agr-105-ndvi-validation
issue-agr-106-report
issue-agr-107-thermal-time
```

### 16.4 关键 Artifact

```text
art-toa5-soil
art-toa5-met
art-tob1-irrigation-failed
art-toa5-irrigation-reexport
art-channel-map-v1
art-channel-map-v2
art-plot-layout
art-field-events-v2
art-toa5-manifest
art-sensor-raw-v2
art-toa5-schema
art-toa5-report-v2
art-sensor-clean
art-plot-day-features
art-irrigation-effects
art-ndvi-features
art-ground-remote
art-agronomy-evidence
art-agri-report-v1
art-agri-report-v2
```

### 16.5 Invocation

```text
inv-toa5-parse-01
inv-toa5-parse-02
inv-toa5-parse-03
inv-toa5-parse-rework
inv-sensor-qc
inv-daily-features
inv-irrigation-model-v1
inv-irrigation-model-rework
inv-ndvi-zonal
inv-ground-remote
inv-agronomy-evidence
inv-agri-report-v1
inv-agri-report-rework
```

---

## 17. 原型演示顺序

1. 从“我的空间”进入“冬小麦节水灌溉与产量响应研究”；
2. 查看三个 Conversation 和 Project 全局事项看板；
3. 进入“田间数据接入与质量控制”；
4. 查看 Human 上传的 TOA5、通道映射和小区布局；
5. 查看田间数据接入 Claw 调用 TOA5 解析 Skill；
6. 查看 Skill 读取环境行、字段、单位和处理类型；
7. 查看未映射通道导致 Waiting for Human；
8. 查看 Human 补充设备和田间小区映射；
9. 查看 TOB1 文件导致解析失败和 Issue Blocked；
10. 查看 Human 重新导出 TOA5 后重试；
11. 查看解析产物、返工意见和最终验收；
12. 从 Project 看板打开 AGR-102，并跳回唯一主 Conversation 的来源消息；
13. 查看原始文件留在 Conversation，稳定解析结果发布到 Project；
14. 进入“灌溉响应建模与遥感复核”；
15. 查看农业统计、遥感和文献 Agent 的独立 Invocation 与 Artifact 交接；
16. 进入“结论审阅与阶段报告”并演示报告返工；
17. 从报告详情反向追溯到模型、日尺度特征、解析结果和原始 TOA5；
18. 查看 Inbox 和“我的工作与项目”的聚合结果。

---

## 18. 验收标准

- [ ] Project 至少包含三个 Conversation。
- [ ] 故事从田间数据产生开始。
- [ ] 原始输入包含真实特殊格式 TOA5 `.dat`。
- [ ] TOA5 解析 Skill 跟随田间数据接入 Claw，而不是配置为 Project 资源。
- [ ] Skill 展示输入、解析过程、Schema、告警和多输出 Artifact。
- [ ] Human 必须确认时区、设备、小区映射和田间异常事件。
- [ ] Skill 不猜测未知通道或田间事实。
- [ ] AGR-102 覆盖 Clarifying、In Progress、Waiting for Human、Blocked、In Review、Changes Requested 和 Done。
- [ ] 失败 TOB1 输入和失败 Invocation 被保留。
- [ ] Human 已读、Agent Reply 和 Invocation Success 都不会自动完成 Issue。
- [ ] Human 明确接受后稳定数据才发布到 Project。
- [ ] 一个 Issue 最多只有一个主 Conversation。
- [ ] Project 看板汇总三个 Conversation 的 Issue。
- [ ] 原始文件与调试日志留在 Conversation Files。
- [ ] Project Files 不展示未发布的 Conversation 文件。
- [ ] 文件不按 Human 聚合，不出现逐人 ACL。
- [ ] 各专业 Agent 分别展示责任、Session、Invocation 和产物。
- [ ] 同一个 Agent 在不同 Conversation 使用不同 Session。
- [ ] Agent 间通过消息、Issue Brief 和 Artifact 交接。
- [ ] 数据血缘包含多个输入、多个输出、失败、返工和跨 Agent 下游使用。
- [ ] 数据血缘由 Message、Skill Runtime、Tool Gateway、Sandbox 和 Artifact Service 确定性记录。
- [ ] 事项管家不作为数据血缘事实源。
- [ ] 可以从报告反向追到原始 TOA5、通道映射、小区布局和 Human 决策。
- [ ] Inbox、“我的工作与项目”和事项看板使用同一 Issue 数据源。

---

## 19. 最终故事摘要

> 陈禾在冬小麦田间试验中布设传感器，并由 CR1000X 数据记录器连续产生 TOA5 特殊格式文件。数据进入 My Claw 后，田间数据接入 Claw 调用自己携带的 Campbell TOA5 农田数据解析 Skill，读取记录器环境信息、字段、单位、处理类型、Timestamp 和 Record，并将数据解析为标准化 Artifact。Skill 遇到未知通道和 TOB1 格式错误时不会猜测或强行解析，而是通过 Issue 和 Inbox 请求 Human 补充设备映射、田间事件并重新导出数据。解析结果经 Human 返工和验收后发布到 Project，随后由农业统计 Claw、农田遥感 Claw、农艺文献 Claw 和科研写作 Claw 分别完成质量控制、处理效应分析、遥感复核、证据解释和阶段报告。每个 Agent 都保留独立 Session、Invocation 和产物，通过消息、Issue Brief 与有稳定 Artifact ID 的文件接力。最终，用户可以从 Project 全局事项看板掌握跨 Conversation 进展，也可以从阶段报告反向追溯到模型、清洗数据、Skill 解析记录、原始 TOA5 文件以及关键 Human 决策。

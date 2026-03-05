/**
 * 态势感知智能体 - 共享执行链路 Mock 数据
 * 供 agent-situational 预览与应用广场统一使用
 */

import type { ExecutionStep } from "@/lib/agent-data";

const SITUATIONAL_KEYWORDS = ["威胁", "态势", "身份", "评估", "分析", "海面", "目标"];

export function isSituationalQuery(msg: string): boolean {
  const lower = msg.toLowerCase();
  return SITUATIONAL_KEYWORDS.some((k) => lower.includes(k));
}

export function generateSituationalTraceSteps(userMsg: string): ExecutionStep[] {
  if (!isSituationalQuery(userMsg)) return [];

  const now = new Date();
  const baseTime = now.getTime();
  let stepIndex = 0;
  const steps: ExecutionStep[] = [];
  let currentTime = baseTime;

  // Step 1: 思考
  steps.push({
    id: `step-${++stepIndex}`,
    stepName: "Step 1: 场景分析与规划",
    stepType: "thought",
    status: "success",
    startTime: new Date(currentTime).toLocaleTimeString(),
    endTime: new Date(currentTime + 1500).toLocaleTimeString(),
    duration: 1500,
    input: "",
    output:
      "监测到台海区域出现不明目标组合 (1驱+1测，ID未知)。\n[常识] 目标在台海，则来源可能是冲绳或佐世保\n[规划] 在 MDP 中检索符合地点和舰型组合的情报对象。",
  });
  currentTime += 1500;

  // Step 2: 本体检索 IntelligenceReport
  steps.push({
    id: `step-${++stepIndex}`,
    stepName: "本体检索: IntelligenceReport",
    stepType: "ontology_query",
    status: "success",
    startTime: new Date(currentTime).toLocaleTimeString(),
    endTime: new Date(currentTime + 2500).toLocaleTimeString(),
    duration: 2500,
    input: {
      objectType: "IntelligenceReport",
      filter: {
        location: ["Okinawa"],
        keywords: ["Destroyer"],
        time: "-72h",
      },
    },
    output: {
      matched: [
        {
          id: "Report_Obj_088",
          content: "冲绳集结: 菲恩号(DDG-113), 鲍迪奇号(TAGS-62)",
        },
      ],
    },
  });
  currentTime += 2500;

  // Step 3: 时空融合与计算
  steps.push({
    id: `step-${++stepIndex}`,
    stepName: "Step 2: 时空融合与计算",
    stepType: "thought",
    status: "success",
    startTime: new Date(currentTime).toLocaleTimeString(),
    endTime: new Date(currentTime + 1500).toLocaleTimeString(),
    duration: 1500,
    input: "",
    output:
      "融合与计算：\n1. 距离：冲绳至台海约 600km，耗时 24h\n2. 航速：600 除以 24 等于 25km/h (13.5节)，符合驱逐舰经济航速\n3. 结论：观测对象即为 Report_Obj_088 中的编队",
  });
  currentTime += 1500;

  // Step 4: 更新事件身份
  steps.push({
    id: `step-${++stepIndex}`,
    stepName: "动作: 更新事件身份 (Link Identity)",
    stepType: "tool_call",
    status: "success",
    startTime: new Date(currentTime).toLocaleTimeString(),
    endTime: new Date(currentTime + 800).toLocaleTimeString(),
    duration: 800,
    input: {
      action: "Update_Entity",
      target: "TransitEvent_001",
      updates: {
        ship_ids: ["US-DDG-113", "US-TAGS-62"],
        Status: "Identified",
      },
    },
    output: {
      success: true,
      snapshot_id: "evt_v2",
      updated_fields: ["ship_ids", "Status"],
    },
  });
  currentTime += 800;

  // Step 5: 态势评估策略
  steps.push({
    id: `step-${++stepIndex}`,
    stepName: "Step 3: 态势评估策略",
    stepType: "thought",
    status: "success",
    startTime: new Date(currentTime).toLocaleTimeString(),
    endTime: new Date(currentTime + 1500).toLocaleTimeString(),
    duration: 1500,
    input: "",
    output: "身份已更新。需读取关联的图像对象，分析物理征候以评估威胁。",
  });
  currentTime += 1500;

  // Step 6: 读取对象 SensorData
  steps.push({
    id: `step-${++stepIndex}`,
    stepName: "读取对象: SensorData (Image)",
    stepType: "ontology_query",
    status: "success",
    startTime: new Date(currentTime).toLocaleTimeString(),
    endTime: new Date(currentTime + 1000).toLocaleTimeString(),
    duration: 1000,
    input: {
      objectType: "SensorData",
      filter: {
        linked_to: "TransitEvent_001",
        type: "Image",
      },
    },
    output: {
      matched: [
        {
          id: "Sensor_Img_001",
          type: "Image",
          linked_to: "TransitEvent_001",
          binary_data: "Image_Binary_Data",
        },
      ],
    },
  });
  currentTime += 1000;

  // Step 7: 视觉模型处理
  steps.push({
    id: `step-${++stepIndex}`,
    stepName: "视觉模型处理 (Internal Model)",
    stepType: "tool_call",
    status: "success",
    startTime: new Date(currentTime).toLocaleTimeString(),
    endTime: new Date(currentTime + 2000).toLocaleTimeString(),
    duration: 2000,
    input: {
      image_data: "Image_Binary_Data",
      targets: ["Main_Gun", "VLS_Hatch", "Deck"],
    },
    output: {
      Gun: "Stowed",
      VLS: "Closed",
      Deck: "Clear",
      Posture: "Non-Aggressive Posture",
    },
  });
  currentTime += 2000;

  // Step 8: 综合定级
  steps.push({
    id: `step-${++stepIndex}`,
    stepName: "Step 4: 综合定级",
    stepType: "thought",
    status: "success",
    startTime: new Date(currentTime).toLocaleTimeString(),
    endTime: new Date(currentTime + 1500).toLocaleTimeString(),
    duration: 1500,
    input: "",
    output:
      "综合定级：\n1. 高能力：DDG 具备区域防空能力\n2. 抵近：目标已进入台海区域\n>> 初步结论：高能力(DDG) + 抵近 = High Threat\n>> 虽然视觉分析显示主炮归零，但驱逐舰始终有攻击属性\n>> 最终结论：综合判定为 High Threat (常态化巡航)",
  });
  currentTime += 1500;

  // Step 9: 更新最终威胁评估
  steps.push({
    id: `step-${++stepIndex}`,
    stepName: "动作: 更新最终威胁评估 (Final Decision)",
    stepType: "tool_call",
    status: "success",
    startTime: new Date(currentTime).toLocaleTimeString(),
    endTime: new Date(currentTime + 1000).toLocaleTimeString(),
    duration: 1000,
    input: {
      action: "Update_Entity",
      target: "TransitEvent_001",
      updates: {
        Final_Threat_Assessment: "High",
        Reasoning:
          "经时空计算确认身份为菲恩号，高能力(DDG) + 抵近 = High Threat，虽然视觉分析显示主炮归零，但驱逐舰始终有攻击属性，判定为常态化巡航",
      },
    },
    output: {
      success: true,
      timestamp: new Date(currentTime + 1000).toLocaleTimeString(),
      final_assessment: "High",
      reasoning:
        "经时空计算确认身份为菲恩号，高能力(DDG) + 抵近 = High Threat，虽然视觉分析显示主炮归零，但驱逐舰始终有攻击属性，判定为常态化巡航",
    },
  });
  currentTime += 1000;

  // Step 10: 最终答案
  steps.push({
    id: `step-${++stepIndex}`,
    stepName: "Step 5: 生成研判报告",
    stepType: "final_answer",
    status: "success",
    startTime: new Date(currentTime).toLocaleTimeString(),
    endTime: new Date(currentTime + 2000).toLocaleTimeString(),
    duration: 2000,
    input: {
      intelligenceData: "已关联冲绳基地 HUMINT 情报 (Report_Obj_088)",
      spatiotemporalCheck: "距离 600km，航速 13.5节，符合经济航速，确认身份匹配",
      visualAnalysis:
        "主炮归零(Stowed)、垂发关闭(Closed)、甲板无异常(Clear)，姿态为非攻击性",
      threatLevel: "高 - 常态化巡航",
    },
    output:
      "### 研判报告\n\n**1. 身份确认**\n* 目标 I: USS John Finn (DDG-113) <onto_ref id=\"DDG-113\"></onto_ref>\n* 目标 II: USNS Bowditch (TAGS-62) <onto_ref id=\"TAGS-62\"></onto_ref>\n* 依据: 关联冲绳基地 HUMINT 情报 <onto_ref id=\"Report_Obj_088\"></onto_ref>，经时空计算确认编队构成与离港时间完全匹配。\n\n**2. 威胁评估: [高 - 常态化巡航]**\n* 能力评估: DDG-113 具备区域防空能力，属于高能力平台。 <onto_ref id=\"DDG-113\"></onto_ref>",
  });

  return steps;
}

/**
 * 本体配置数据源
 * 包含所有本体定义：本体名称 -> 对象类型 -> 属性列表
 */

/**
 * 属性字段元数据
 */
export interface PropertyMetadata {
  name: string;
  type: "string" | "number" | "array" | "object" | "boolean";
  isVector?: boolean; // 是否为向量字段（用于语义检索）
}

/**
 * 兼容旧版本的简单字符串数组类型
 */
export type OntologyData = Record<string, Record<string, string[]>>;

/**
 * 新版本：支持字段元数据的本体数据
 */
export type OntologyDataWithMetadata = Record<string, Record<string, PropertyMetadata[]>>;

/**
 * 三级级联选择数据：本体 -> 对象类型 -> 属性（兼容旧版本）
 */
export const ontologyData: OntologyData = {
  // ==========================================
  // 现有本体：海上态势感知
  // ==========================================
  "海上态势感知": {
    战斗机: ["驾驶员", "载重", "时速", "位置(经纬度)", "所属空军基地", "服役年限"],
    航空母舰: ["排水量", "舰载机数量", "最大航速", "服役年限"],
    海军陆战队: ["人数", "装备类型", "部署位置"],
    无人机: ["续航时间", "最大航程", "载重", "控制方式"],
    运输机: ["载重", "航程", "最大速度"],
    运输船: ["载重", "航速", "船型"],
    哨塔: ["位置", "高度", "装备"],
    战例: ["战舰", "航迹", "时间", "意图", "作战区域", "参战兵力", "作战结果", "战术类型"],
  },

  // ==========================================
  // 现有本体：装备维修检测
  // ==========================================
  "装备维修检测": {
    战斗机: ["驾驶员", "载重", "时速", "位置(经纬度)", "所属空军基地", "服役年限"],
    无人机: ["续航时间", "最大航程", "载重", "控制方式"],
    坦克: ["装甲厚度", "主炮口径", "越野速度"],
    "海底石油开采": ["开采深度", "日产量", "设备类型"],
    侦察机: ["侦察设备", "航程", "最大速度"],
  },

  // ==========================================
  // 新增本体：TH态势感知与情报快判
  // Domain: Maritime_Awareness
  // ==========================================
  "TH态势感知与情报快判": {
    // 过航事件 (TransitEvent)
    过航事件: [
      "event_id",
      "location",
      "status",
      "threat_level",
      "timestamp",
    ],
    // 情报报告 (IntelligenceReport)
    情报报告: [
      "report_id",
      "source_type",
      "content",
      "reliability",
    ],
    // 传感器数据 (SensorData)
    传感器数据: [
      "data_id",
      "sensor_type",
      "capture_time",
    ],
    // 舰船单元 (NavalUnit)
    舰船单元: [
      "unit_id",
      "name",
      "hull_number",
      "country",
    ],
    // 意图研判相关对象类型
    // 编队 (Formation)
    编队: [
      "formation_id",
      "name",
      "composition",
    ],
    // 编队战术模式 (FormationPattern)
    编队战术模式: [
      "pattern_id",
      "name",
      "description",
      "pattern_embedding",
    ],
    // 历史战例 (HistoricalCase)
    历史战例: [
      "case_id",
      "title",
      "summary",
      "date",
      "case_embedding",
    ],
    // 作战条令 (CombatRegulation)
    作战条令: [
      "rule_id",
      "title",
      "content",
      "trigger_condition",
    ],
    // 意图研判结果 (IntentAssessment)
    意图研判结果: [
      "assessment_id",
      "intent_type",
      "probability",
      "evidence",
    ],
    // 方案生成相关对象类型
    // 预案条款 (PreplanClause)
    预案条款: [
      "clause_id",
      "title",
      "content",
      "risk_level",
    ],
    // 作战席位 (OperationalPost)
    作战席位: [
      "post_id",
      "role_name",
      "current_assignee",
      "status",
    ],
    // 作战资产 (CombatAsset)
    作战资产: [
      "asset_id",
      "name",
      "type",
      "status",
    ],
  },
};

/**
 * 新版本：支持字段元数据的本体数据
 * 用于 OntologyConfigForm 组件
 */
export const ontologyDataWithMetadata: OntologyDataWithMetadata = {
  // ==========================================
  // 现有本体：海上态势感知
  // ==========================================
  "海上态势感知": {
    战斗机: [
      { name: "驾驶员", type: "string" },
      { name: "载重", type: "number" },
      { name: "时速", type: "number" },
      { name: "位置(经纬度)", type: "string" },
      { name: "所属空军基地", type: "string" },
      { name: "服役年限", type: "number" },
    ],
    航空母舰: [
      { name: "排水量", type: "number" },
      { name: "舰载机数量", type: "number" },
      { name: "最大航速", type: "number" },
      { name: "服役年限", type: "number" },
    ],
    海军陆战队: [
      { name: "人数", type: "number" },
      { name: "装备类型", type: "string" },
      { name: "部署位置", type: "string" },
    ],
    无人机: [
      { name: "续航时间", type: "number" },
      { name: "最大航程", type: "number" },
      { name: "载重", type: "number" },
      { name: "控制方式", type: "string" },
    ],
    运输机: [
      { name: "载重", type: "number" },
      { name: "航程", type: "number" },
      { name: "最大速度", type: "number" },
    ],
    运输船: [
      { name: "载重", type: "number" },
      { name: "航速", type: "number" },
      { name: "船型", type: "string" },
    ],
    哨塔: [
      { name: "位置", type: "string" },
      { name: "高度", type: "number" },
      { name: "装备", type: "string" },
    ],
    战例: [
      { name: "战舰", type: "string" },
      { name: "航迹", type: "string" },
      { name: "时间", type: "string" },
      { name: "意图", type: "string" },
      { name: "作战区域", type: "string" },
      { name: "参战兵力", type: "string" },
      { name: "作战结果", type: "string" },
      { name: "战术类型", type: "string" },
    ],
  },

  // ==========================================
  // 现有本体：装备维修检测
  // ==========================================
  "装备维修检测": {
    战斗机: [
      { name: "驾驶员", type: "string" },
      { name: "载重", type: "number" },
      { name: "时速", type: "number" },
      { name: "位置(经纬度)", type: "string" },
      { name: "所属空军基地", type: "string" },
      { name: "服役年限", type: "number" },
    ],
    无人机: [
      { name: "续航时间", type: "number" },
      { name: "最大航程", type: "number" },
      { name: "载重", type: "number" },
      { name: "控制方式", type: "string" },
    ],
    坦克: [
      { name: "装甲厚度", type: "number" },
      { name: "主炮口径", type: "number" },
      { name: "越野速度", type: "number" },
    ],
    "海底石油开采": [
      { name: "开采深度", type: "number" },
      { name: "日产量", type: "number" },
      { name: "设备类型", type: "string" },
    ],
    侦察机: [
      { name: "侦察设备", type: "string" },
      { name: "航程", type: "number" },
      { name: "最大速度", type: "number" },
    ],
  },

  // ==========================================
  // 新增本体：TH态势感知与情报快判
  // Domain: Maritime_Awareness
  // ==========================================
  "TH态势感知与情报快判": {
    // 过航事件 (TransitEvent) - 包含字段对
    过航事件: [
      { name: "event_id", type: "string" },
      { name: "location", type: "string" },
      { name: "status", type: "string" },
      { name: "threat_level", type: "string" },
      { name: "timestamp", type: "string" },
      // 字段对：文本字段（用于注入）
      { name: "route", type: "string", isVector: false },
      // 字段对：向量字段（用于语义检索）
      { name: "route_embedding", type: "array", isVector: true },
    ],
    // 情报报告 (IntelligenceReport)
    情报报告: [
      { name: "report_id", type: "string" },
      { name: "source_type", type: "string" },
      { name: "content", type: "string" },
      { name: "reliability", type: "string" },
    ],
    // 传感器数据 (SensorData)
    传感器数据: [
      { name: "data_id", type: "string" },
      { name: "sensor_type", type: "string" },
      { name: "capture_time", type: "string" },
    ],
    // 舰船单元 (NavalUnit)
    舰船单元: [
      { name: "unit_id", type: "string" },
      { name: "name", type: "string" },
      { name: "hull_number", type: "string" },
      { name: "country", type: "string" },
    ],
    // ==========================================
    // 意图研判相关对象类型 (Intent Analysis)
    // ==========================================
    // 编队 (Formation)
    编队: [
      { name: "formation_id", type: "string" },
      { name: "name", type: "string" },
      { name: "composition", type: "string" },
    ],
    // 编队战术模式 (FormationPattern)
    编队战术模式: [
      { name: "pattern_id", type: "string" },
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      // 向量字段（用于语义检索）
      { name: "pattern_embedding", type: "array", isVector: true },
    ],
    // 历史战例 (HistoricalCase)
    历史战例: [
      { name: "case_id", type: "string" },
      { name: "title", type: "string" },
      { name: "summary", type: "string" },
      { name: "date", type: "string" },
      // 向量字段（用于语义检索）
      { name: "case_embedding", type: "array", isVector: true },
    ],
    // 作战条令 (CombatRegulation)
    作战条令: [
      { name: "rule_id", type: "string" },
      { name: "title", type: "string" },
      { name: "content", type: "string" },
      { name: "trigger_condition", type: "string" },
    ],
    // 意图研判结果 (IntentAssessment)
    意图研判结果: [
      { name: "assessment_id", type: "string" },
      { name: "intent_type", type: "string" },
      { name: "probability", type: "number" },
      { name: "evidence", type: "string" },
    ],
    // ==========================================
    // 方案生成相关对象类型 (Plan Generation)
    // ==========================================
    // 预案条款 (PreplanClause)
    预案条款: [
      { name: "clause_id", type: "string" },
      { name: "title", type: "string" },
      { name: "content", type: "string" },
      { name: "risk_level", type: "string" },
    ],
    // 作战席位 (OperationalPost)
    作战席位: [
      { name: "post_id", type: "string" },
      { name: "role_name", type: "string" },
      { name: "current_assignee", type: "string" },
      { name: "status", type: "string" },
    ],
    // 作战资产 (CombatAsset)
    作战资产: [
      { name: "asset_id", type: "string" },
      { name: "name", type: "string" },
      { name: "type", type: "string" },
      { name: "status", type: "string" },
    ],
  },
};

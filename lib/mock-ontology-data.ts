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
  /** 中文显示名称，缺省时用 name */
  displayName?: string;
  /** 属性说明（可选） */
  description?: string;
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
      { name: "驾驶员", type: "string", displayName: "驾驶员", description: "飞行员或操作员" },
      { name: "载重", type: "number", displayName: "载重", description: "最大载重（吨）" },
      { name: "时速", type: "number", displayName: "时速", description: "最大飞行速度（km/h）" },
      { name: "位置(经纬度)", type: "string", displayName: "位置(经纬度)", description: "当前经纬度" },
      { name: "所属空军基地", type: "string", displayName: "所属空军基地", description: "所属基地名称" },
      { name: "服役年限", type: "number", displayName: "服役年限", description: "服役年数" },
    ],
    航空母舰: [
      { name: "排水量", type: "number", displayName: "排水量", description: "满载排水量（吨）" },
      { name: "舰载机数量", type: "number", displayName: "舰载机数量", description: "可搭载舰载机数量" },
      { name: "最大航速", type: "number", displayName: "最大航速", description: "最大航速（节）" },
      { name: "服役年限", type: "number", displayName: "服役年限", description: "服役年数" },
    ],
    海军陆战队: [
      { name: "人数", type: "number", displayName: "人数", description: "编制或当前人数" },
      { name: "装备类型", type: "string", displayName: "装备类型", description: "主要装备类型" },
      { name: "部署位置", type: "string", displayName: "部署位置", description: "当前部署地点" },
    ],
    无人机: [
      { name: "续航时间", type: "number", displayName: "续航时间", description: "续航时间（小时）" },
      { name: "最大航程", type: "number", displayName: "最大航程", description: "最大航程（km）" },
      { name: "载重", type: "number", displayName: "载重", description: "有效载重（kg）" },
      { name: "控制方式", type: "string", displayName: "控制方式", description: "遥控/自主等" },
    ],
    运输机: [
      { name: "载重", type: "number", displayName: "载重", description: "最大载重（吨）" },
      { name: "航程", type: "number", displayName: "航程", description: "最大航程（km）" },
      { name: "最大速度", type: "number", displayName: "最大速度", description: "最大速度（km/h）" },
    ],
    运输船: [
      { name: "载重", type: "number", displayName: "载重", description: "载重（吨）" },
      { name: "航速", type: "number", displayName: "航速", description: "航速（节）" },
      { name: "船型", type: "string", displayName: "船型", description: "船舶类型" },
    ],
    哨塔: [
      { name: "位置", type: "string", displayName: "位置", description: "哨塔位置" },
      { name: "高度", type: "number", displayName: "高度", description: "塔高（米）" },
      { name: "装备", type: "string", displayName: "装备", description: "配备的观测或通信装备" },
    ],
    战例: [
      { name: "战舰", type: "string", displayName: "战舰", description: "参战舰艇" },
      { name: "航迹", type: "string", displayName: "航迹", description: "航迹描述" },
      { name: "时间", type: "string", displayName: "时间", description: "战例时间" },
      { name: "意图", type: "string", displayName: "意图", description: "研判的作战意图" },
      { name: "作战区域", type: "string", displayName: "作战区域", description: "作战区域" },
      { name: "参战兵力", type: "string", displayName: "参战兵力", description: "参战兵力概要" },
      { name: "作战结果", type: "string", displayName: "作战结果", description: "作战结果" },
      { name: "战术类型", type: "string", displayName: "战术类型", description: "战术类型分类" },
    ],
  },

  "装备维修检测": {
    战斗机: [
      { name: "驾驶员", type: "string", displayName: "驾驶员", description: "飞行员或操作员" },
      { name: "载重", type: "number", displayName: "载重", description: "最大载重（吨）" },
      { name: "时速", type: "number", displayName: "时速", description: "最大飞行速度（km/h）" },
      { name: "位置(经纬度)", type: "string", displayName: "位置(经纬度)", description: "当前经纬度" },
      { name: "所属空军基地", type: "string", displayName: "所属空军基地", description: "所属基地名称" },
      { name: "服役年限", type: "number", displayName: "服役年限", description: "服役年数" },
    ],
    无人机: [
      { name: "续航时间", type: "number", displayName: "续航时间", description: "续航时间（小时）" },
      { name: "最大航程", type: "number", displayName: "最大航程", description: "最大航程（km）" },
      { name: "载重", type: "number", displayName: "载重", description: "有效载重（kg）" },
      { name: "控制方式", type: "string", displayName: "控制方式", description: "遥控/自主等" },
    ],
    坦克: [
      { name: "装甲厚度", type: "number", displayName: "装甲厚度", description: "装甲厚度（mm）" },
      { name: "主炮口径", type: "number", displayName: "主炮口径", description: "主炮口径（mm）" },
      { name: "越野速度", type: "number", displayName: "越野速度", description: "越野速度（km/h）" },
    ],
    "海底石油开采": [
      { name: "开采深度", type: "number", displayName: "开采深度", description: "开采深度（米）" },
      { name: "日产量", type: "number", displayName: "日产量", description: "日产量" },
      { name: "设备类型", type: "string", displayName: "设备类型", description: "开采设备类型" },
    ],
    侦察机: [
      { name: "侦察设备", type: "string", displayName: "侦察设备", description: "搭载的侦察设备" },
      { name: "航程", type: "number", displayName: "航程", description: "最大航程（km）" },
      { name: "最大速度", type: "number", displayName: "最大速度", description: "最大速度（km/h）" },
    ],
  },

  // ==========================================
  // 新增本体：TH态势感知与情报快判
  // Domain: Maritime_Awareness
  // ==========================================
  "TH态势感知与情报快判": {
    // 过航事件 (TransitEvent) - 包含字段对
    过航事件: [
      { name: "event_id", type: "string", displayName: "事件编号", description: "过航事件的唯一标识" },
      { name: "location", type: "string", displayName: "位置", description: "事件发生或目标所在的地理位置" },
      { name: "status", type: "string", displayName: "状态", description: "当前过航或处置状态" },
      { name: "threat_level", type: "string", displayName: "威胁等级", description: "综合研判后的威胁定级" },
      { name: "timestamp", type: "string", displayName: "时间戳", description: "事件记录或更新时间" },
      { name: "route", type: "string", isVector: false, displayName: "航迹", description: "文本描述的航迹或路线信息" },
      { name: "route_embedding", type: "array", isVector: true, displayName: "航迹向量", description: "用于语义检索的航迹向量" },
    ],
    情报报告: [
      { name: "report_id", type: "string", displayName: "报告编号", description: "情报报告的唯一标识" },
      { name: "source_type", type: "string", displayName: "来源类型", description: "情报来源类型（如 HUMINT、ELINT）" },
      { name: "content", type: "string", displayName: "内容", description: "报告正文或摘要" },
      { name: "reliability", type: "string", displayName: "可信度", description: "情报可信度等级" },
    ],
    传感器数据: [
      { name: "data_id", type: "string", displayName: "数据编号", description: "传感器数据唯一标识" },
      { name: "sensor_type", type: "string", displayName: "传感器类型", description: "雷达、AIS、光学等" },
      { name: "capture_time", type: "string", displayName: "采集时间", description: "数据采集时间" },
    ],
    舰船单元: [
      { name: "unit_id", type: "string", displayName: "单元编号", description: "舰船单元唯一标识" },
      { name: "name", type: "string", displayName: "名称", description: "舰船或单元名称" },
      { name: "hull_number", type: "string", displayName: "弦号", description: "舰艇弦号（如 DDG-113）" },
      { name: "country", type: "string", displayName: "所属国", description: "所属国家或地区" },
    ],
    编队: [
      { name: "formation_id", type: "string", displayName: "编队编号", description: "编队唯一标识" },
      { name: "name", type: "string", displayName: "编队名称", description: "编队名称或呼号" },
      { name: "composition", type: "string", displayName: "编成", description: "编队内舰艇或单位构成" },
    ],
    编队战术模式: [
      { name: "pattern_id", type: "string", displayName: "模式编号", description: "战术模式唯一标识" },
      { name: "name", type: "string", displayName: "模式名称", description: "战术模式名称" },
      { name: "description", type: "string", displayName: "描述", description: "模式说明或适用场景" },
      { name: "pattern_embedding", type: "array", isVector: true, displayName: "模式向量", description: "用于语义匹配的向量" },
    ],
    历史战例: [
      { name: "case_id", type: "string", displayName: "战例编号", description: "历史战例唯一标识" },
      { name: "title", type: "string", displayName: "标题", description: "战例标题" },
      { name: "summary", type: "string", displayName: "摘要", description: "战例概要" },
      { name: "date", type: "string", displayName: "日期", description: "战例发生或记录日期" },
      { name: "case_embedding", type: "array", isVector: true, displayName: "战例向量", description: "用于语义检索的向量" },
    ],
    作战条令: [
      { name: "rule_id", type: "string", displayName: "条令编号", description: "条令唯一标识" },
      { name: "title", type: "string", displayName: "标题", description: "条令标题" },
      { name: "content", type: "string", displayName: "内容", description: "条令正文" },
      { name: "trigger_condition", type: "string", displayName: "触发条件", description: "条令适用的触发条件描述" },
    ],
    意图研判结果: [
      { name: "assessment_id", type: "string", displayName: "研判编号", description: "意图研判结果唯一标识" },
      { name: "intent_type", type: "string", displayName: "意图类型", description: "研判的意图类型" },
      { name: "probability", type: "number", displayName: "概率", description: "意图成立的概率或置信度" },
      { name: "evidence", type: "string", displayName: "依据", description: "支撑研判的证据或引用" },
    ],
    预案条款: [
      { name: "clause_id", type: "string", displayName: "条款编号", description: "预案条款唯一标识" },
      { name: "title", type: "string", displayName: "标题", description: "条款标题" },
      { name: "content", type: "string", displayName: "内容", description: "条款正文" },
      { name: "risk_level", type: "string", displayName: "风险等级", description: "条款关联的风险等级" },
    ],
    作战席位: [
      { name: "post_id", type: "string", displayName: "席位编号", description: "作战席位唯一标识" },
      { name: "role_name", type: "string", displayName: "角色名称", description: "席位角色或职责名称" },
      { name: "current_assignee", type: "string", displayName: "当前负责人", description: "当前担任该席位的人员" },
      { name: "status", type: "string", displayName: "状态", description: "席位状态（在岗/离岗等）" },
    ],
    作战资产: [
      { name: "asset_id", type: "string", displayName: "资产编号", description: "作战资产唯一标识" },
      { name: "name", type: "string", displayName: "资产名称", description: "资产名称或型号" },
      { name: "type", type: "string", displayName: "类型", description: "资产类型分类" },
      { name: "status", type: "string", displayName: "状态", description: "资产当前状态" },
    ],
  },
};

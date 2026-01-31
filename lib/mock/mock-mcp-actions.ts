/**
 * 本体行动数据 (Ontology Actions)
 * 定义绑定在特定对象类型上的 CRUD 操作集合
 */

export interface OntologyAction {
  id: string;
  name: string;
  description: string;
  objectType: string; // 所属对象类型
}

export interface ObjectTypeActions {
  objectType: string;
  objectTypeName: string; // 显示名称
  description: string; // 对象类型描述
  actions: OntologyAction[];
}

/**
 * 本体行动数据集合
 */
export const ontologyActionsData: ObjectTypeActions[] = [
  {
    objectType: "TransitEvent",
    objectTypeName: "过航事件",
    description: "海上过航事件相关的操作",
    actions: [
      {
        id: "action-transit-update-identity",
        name: "Update_Identity",
        description: "关联并更新身份信息 (Link Identity)",
        objectType: "TransitEvent",
      },
      {
        id: "action-transit-update-threat",
        name: "Update_Threat_Level",
        description: "更新威胁等级 (Update Threat Level)",
        objectType: "TransitEvent",
      },
      {
        id: "action-transit-archive",
        name: "Archive_Event",
        description: "归档事件 (Archive)",
        objectType: "TransitEvent",
      },
    ],
  },
  {
    objectType: "IntelligenceReport",
    objectTypeName: "情报报告",
    description: "情报报告相关的操作",
    actions: [
      {
        id: "action-intel-verify",
        name: "Verify_Source",
        description: "验证情报源 (Verify Source)",
        objectType: "IntelligenceReport",
      },
      {
        id: "action-intel-link",
        name: "Link_to_Entity",
        description: "关联实体 (Link to Entity)",
        objectType: "IntelligenceReport",
      },
    ],
  },
  {
    objectType: "SensorData",
    objectTypeName: "传感器数据",
    description: "传感器数据相关的操作",
    actions: [
      {
        id: "action-sensor-annotate",
        name: "Annotate_Image",
        description: "图像标注 (Annotate)",
        objectType: "SensorData",
      },
    ],
  },
];

/**
 * 获取所有行动（扁平化）
 */
export function getAllActions(): OntologyAction[] {
  return ontologyActionsData.flatMap((group) => group.actions);
}

/**
 * 根据对象类型获取行动
 */
export function getActionsByObjectType(objectType: string): OntologyAction[] {
  const group = ontologyActionsData.find((g) => g.objectType === objectType);
  return group?.actions || [];
}

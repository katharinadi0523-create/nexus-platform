export interface MemoryVariable {
  id: string;
  name: string; // 变量名
  description: string; // 变量描述
  defaultValue?: string; // 默认值
  storageType: "user" | "session"; // 存储维度 (用户/会话)
  required: boolean; // 必填
  showInFrontend: boolean; // 前端展示
}

export interface AgentConfig {
  memory: {
    variables: MemoryVariable[];
  };
  // 其他配置字段...
}

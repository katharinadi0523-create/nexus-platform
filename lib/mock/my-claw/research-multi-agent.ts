/**
 * Research multi-agent demo script ported from 会话交互
 * `research-multi-agent-data.js` (+ snapshot merge from research-multi-agent-module.js).
 * Preserves all 14 critical-path steps, agents, tasks, sub-sessions, and artifacts.
 */

export const RESEARCH_SESSION_ID = "task-research-001";
export const RESEARCH_CLAW_ID = "research-claw";

export type ResearchTaskStatus = "pending" | "running" | "done" | "failed";
export type ResearchAgentKey =
  | "main"
  | "hypothesis"
  | "literature"
  | "viz"
  | "paper"
  | "review";

export interface ResearchResourceRef {
  id: string;
  name: string;
}

export interface ResearchAgentDef {
  id: string;
  name: string;
  primaryModel: string;
  resources: {
    skills?: ResearchResourceRef[];
    tools?: ResearchResourceRef[];
    knowledge?: ResearchResourceRef[];
  };
}

export interface ResearchTaskDef {
  id: string;
  name: string;
  agentKey: Exclude<ResearchAgentKey, "main">;
}

export interface ResearchClarifyOption {
  value: string;
  label: string;
}

export interface ResearchToolCall {
  type: "skill" | "tool";
  name: string;
}

export interface ResearchArtifact {
  id: string;
  name: string;
  size: string;
  taskId: string;
  replaces?: string;
}

export type ResearchMessageKind =
  | "thinking"
  | "skill"
  | "tool"
  | "knowledge"
  | "artifact"
  | "clarify"
  | "summon";

/** Source messages use optional `kind`; plain assistant text has no kind. */
export interface ResearchMessage {
  id: string;
  role: "user" | "assistant";
  text?: string;
  from?: "main";
  kind?: ResearchMessageKind;
  skillName?: string;
  toolName?: string;
  knowledgeName?: string;
  question?: string;
  options?: ResearchClarifyOption[];
  selected?: string | null;
  agentKey?: Exclude<ResearchAgentKey, "main">;
  taskId?: string;
  status?: "running" | "done" | "failed";
}

export interface ResearchStepTask {
  id: string;
  status: ResearchTaskStatus;
}

export interface ResearchDemoStep {
  id: string;
  label: string;
  showPlan: boolean;
  tasks: ResearchStepTask[];
  artifacts: ResearchArtifact[];
  activeAgents: ResearchAgentKey[];
  mainMessages?: ResearchMessage[] | null;
  appendMain?: ResearchMessage[];
  toolsByAgent?: Partial<Record<ResearchAgentKey, ResearchToolCall[]>>;
  summons: ResearchAgentKey[];
  subSessions?: Record<string, ResearchMessage[]>;
}

export interface ResearchResolvedTask {
  id: string;
  name: string;
  agentKey: Exclude<ResearchAgentKey, "main">;
  agentId: string;
  agentName: string;
  status: ResearchTaskStatus;
  summoned: boolean;
}

export interface ResearchSnapshot {
  showPlan: boolean;
  tasks: ResearchResolvedTask[];
  artifacts: ResearchArtifact[];
  activeAgents: ResearchAgentKey[];
  mainMessages: ResearchMessage[];
  toolsByAgent: Partial<Record<ResearchAgentKey, ResearchToolCall[]>>;
  summons: ResearchAgentKey[];
  subSessions: Record<string, ResearchMessage[]>;
  stepIndex: number;
  stepId: string;
  stepLabel: string;
}

export const RESEARCH_DEFAULT_QUERY = "请研究生成式 AI 对科研协作效率的影响，并形成带图表的论文。";

export const RESEARCH_AGENTS: Record<ResearchAgentKey, ResearchAgentDef> = {
  "main": {
    "id": "research-claw-main",
    "name": "科研智能体",
    "primaryModel": "Qwen3-32B",
    "resources": {
      "skills": [
        {
          "id": "skill-req-insight",
          "name": "需求洞察"
        }
      ],
      "tools": [
        {
          "id": "tool-scheduler",
          "name": "子智能体调度器"
        }
      ]
    }
  },
  "hypothesis": {
    "id": "ra-hypothesis",
    "name": "假设生成智能体",
    "primaryModel": "Qwen3-32B",
    "resources": {
      "skills": [
        {
          "id": "skill-hypothesis",
          "name": "科研假设验证"
        },
        {
          "id": "skill-stats",
          "name": "统计分析"
        }
      ],
      "tools": [
        {
          "id": "tool-python-stats",
          "name": "Python 统计分析工具"
        }
      ],
      "knowledge": [
        {
          "id": "kb-method-cards",
          "name": "研究方法卡片集"
        }
      ]
    }
  },
  "literature": {
    "id": "ra-literature",
    "name": "文献检索智能体",
    "primaryModel": "DeepSeek V3",
    "resources": {
      "skills": [
        {
          "id": "skill-lit-review",
          "name": "系统文献综述"
        }
      ],
      "tools": [
        {
          "id": "tool-scholar-search",
          "name": "学术文献检索工具"
        }
      ],
      "knowledge": [
        {
          "id": "kb-genai-collab",
          "name": "生成式 AI 协作研究语料"
        }
      ]
    }
  },
  "viz": {
    "id": "ra-viz",
    "name": "科研绘图智能体",
    "primaryModel": "Qwen3-32B",
    "resources": {
      "skills": [
        {
          "id": "skill-viz",
          "name": "科研绘图"
        }
      ],
      "tools": [
        {
          "id": "tool-python-plot",
          "name": "Python 绘图环境"
        }
      ],
      "knowledge": [
        {
          "id": "kb-viz-style",
          "name": "科研可视化样式指南"
        }
      ]
    }
  },
  "paper": {
    "id": "ra-paper",
    "name": "论文生成智能体",
    "primaryModel": "DeepSeek-R1",
    "resources": {
      "skills": [
        {
          "id": "skill-writing",
          "name": "学术写作"
        }
      ],
      "tools": [
        {
          "id": "tool-cite-check",
          "name": "引用校验工具"
        }
      ],
      "knowledge": [
        {
          "id": "kb-writing-guide",
          "name": "学术写作规范"
        },
        {
          "id": "kb-genai-collab",
          "name": "生成式 AI 协作研究语料"
        }
      ]
    }
  },
  "review": {
    "id": "ra-review",
    "name": "论文审核智能体",
    "primaryModel": "Qwen3-32B",
    "resources": {
      "skills": [
        {
          "id": "skill-review",
          "name": "同行评审"
        }
      ],
      "tools": [
        {
          "id": "tool-paper-lint",
          "name": "论文规范检查工具"
        }
      ],
      "knowledge": [
        {
          "id": "kb-writing-guide",
          "name": "学术写作规范"
        }
      ]
    }
  }
} as Record<ResearchAgentKey, ResearchAgentDef>;

export const RESEARCH_TASK_DEFS: ResearchTaskDef[] = [
  {
    "id": "task-hypothesis",
    "name": "生成可验证假设",
    "agentKey": "hypothesis"
  },
  {
    "id": "task-literature",
    "name": "构建文献证据矩阵",
    "agentKey": "literature"
  },
  {
    "id": "task-viz",
    "name": "制作科研图表包",
    "agentKey": "viz"
  },
  {
    "id": "task-paper",
    "name": "撰写研究论文",
    "agentKey": "paper"
  },
  {
    "id": "task-review",
    "name": "审核论文质量",
    "agentKey": "review"
  }
] as ResearchTaskDef[];

export const RESEARCH_DEMO_STEPS: ResearchDemoStep[] = [
  {
    "id": "idle",
    "label": "待命",
    "showPlan": false,
    "tasks": [],
    "artifacts": [],
    "activeAgents": [],
    "mainMessages": [],
    "summons": []
  },
  {
    "id": "user-ask",
    "label": "用户提出需求",
    "showPlan": false,
    "tasks": [],
    "artifacts": [],
    "activeAgents": [
      "main"
    ],
    "mainMessages": [
      {
        "id": "m-user-1",
        "role": "user",
        "text": "请研究生成式 AI 对科研协作效率的影响，并形成带图表的论文。"
      }
    ],
    "summons": []
  },
  {
    "id": "main-think",
    "label": "主智能体思考",
    "showPlan": false,
    "tasks": [],
    "artifacts": [],
    "activeAgents": [
      "main"
    ],
    "mainMessages": [
      {
        "id": "m-user-1",
        "role": "user",
        "text": "请研究生成式 AI 对科研协作效率的影响，并形成带图表的论文。"
      },
      {
        "id": "m-think-1",
        "role": "assistant",
        "kind": "thinking",
        "text": "先确认研究问题、协作效率指标与论文交付形态，再决定是否需要多子智能体并行。"
      }
    ],
    "summons": []
  },
  {
    "id": "req-insight",
    "label": "调用需求洞察",
    "showPlan": false,
    "tasks": [],
    "artifacts": [],
    "activeAgents": [
      "main"
    ],
    "mainMessages": [
      {
        "id": "m-user-1",
        "role": "user",
        "text": "请研究生成式 AI 对科研协作效率的影响，并形成带图表的论文。"
      },
      {
        "id": "m-think-1",
        "role": "assistant",
        "kind": "thinking",
        "text": "先确认研究问题、协作效率指标与论文交付形态，再决定是否需要多子智能体并行。"
      },
      {
        "id": "m-skill-1",
        "role": "assistant",
        "kind": "skill",
        "skillName": "需求洞察",
        "text": "已识别目标：生成式 AI × 科研协作效率；交付物需含图表论文。"
      }
    ],
    "toolsByAgent": {
      "main": [
        {
          "type": "skill",
          "name": "需求洞察"
        }
      ]
    },
    "summons": []
  },
  {
    "id": "clarify",
    "label": "澄清研究边界",
    "showPlan": false,
    "tasks": [],
    "artifacts": [],
    "activeAgents": [
      "main"
    ],
    "mainMessages": [
      {
        "id": "m-user-1",
        "role": "user",
        "text": "请研究生成式 AI 对科研协作效率的影响，并形成带图表的论文。"
      },
      {
        "id": "m-think-1",
        "role": "assistant",
        "kind": "thinking",
        "text": "先确认研究问题、协作效率指标与论文交付形态，再决定是否需要多子智能体并行。"
      },
      {
        "id": "m-skill-1",
        "role": "assistant",
        "kind": "skill",
        "skillName": "需求洞察",
        "text": "已识别目标：生成式 AI × 科研协作效率；交付物需含图表论文。"
      },
      {
        "id": "m-clarify-1",
        "role": "assistant",
        "kind": "clarify",
        "question": "请确认本次研究边界",
        "options": [
          {
            "value": "lab_collab",
            "label": "聚焦实验室协作效率（沟通、共写、评审）"
          },
          {
            "value": "org_rd",
            "label": "扩展到组织级研发协作全链路"
          }
        ],
        "selected": null
      }
    ],
    "toolsByAgent": {
      "main": [
        {
          "type": "skill",
          "name": "需求洞察"
        }
      ]
    },
    "summons": []
  },
  {
    "id": "clarify-done",
    "label": "用户确认",
    "showPlan": false,
    "tasks": [],
    "artifacts": [],
    "activeAgents": [
      "main"
    ],
    "mainMessages": [
      {
        "id": "m-user-1",
        "role": "user",
        "text": "请研究生成式 AI 对科研协作效率的影响，并形成带图表的论文。"
      },
      {
        "id": "m-think-1",
        "role": "assistant",
        "kind": "thinking",
        "text": "先确认研究问题、协作效率指标与论文交付形态，再决定是否需要多子智能体并行。"
      },
      {
        "id": "m-skill-1",
        "role": "assistant",
        "kind": "skill",
        "skillName": "需求洞察",
        "text": "已识别目标：生成式 AI × 科研协作效率；交付物需含图表论文。"
      },
      {
        "id": "m-clarify-1",
        "role": "assistant",
        "kind": "clarify",
        "question": "请确认本次研究边界",
        "options": [
          {
            "value": "lab_collab",
            "label": "聚焦实验室协作效率（沟通、共写、评审）"
          },
          {
            "value": "org_rd",
            "label": "扩展到组织级研发协作全链路"
          }
        ],
        "selected": "lab_collab"
      },
      {
        "id": "m-user-confirm",
        "role": "user",
        "text": "聚焦实验室协作效率（沟通、共写、评审）"
      }
    ],
    "toolsByAgent": {
      "main": [
        {
          "type": "skill",
          "name": "需求洞察"
        }
      ]
    },
    "summons": []
  },
  {
    "id": "plan-ready",
    "label": "任务规划完成",
    "showPlan": true,
    "tasks": [
      {
        "id": "task-hypothesis",
        "status": "pending"
      },
      {
        "id": "task-literature",
        "status": "pending"
      },
      {
        "id": "task-viz",
        "status": "pending"
      },
      {
        "id": "task-paper",
        "status": "pending"
      },
      {
        "id": "task-review",
        "status": "pending"
      }
    ],
    "artifacts": [],
    "activeAgents": [
      "main"
    ],
    "mainMessages": [
      {
        "id": "m-user-1",
        "role": "user",
        "text": "请研究生成式 AI 对科研协作效率的影响，并形成带图表的论文。"
      },
      {
        "id": "m-think-1",
        "role": "assistant",
        "kind": "thinking",
        "text": "先确认研究问题、协作效率指标与论文交付形态，再决定是否需要多子智能体并行。"
      },
      {
        "id": "m-skill-1",
        "role": "assistant",
        "kind": "skill",
        "skillName": "需求洞察",
        "text": "已识别目标：生成式 AI × 科研协作效率；交付物需含图表论文。"
      },
      {
        "id": "m-clarify-1",
        "role": "assistant",
        "kind": "clarify",
        "question": "请确认本次研究边界",
        "options": [
          {
            "value": "lab_collab",
            "label": "聚焦实验室协作效率（沟通、共写、评审）"
          },
          {
            "value": "org_rd",
            "label": "扩展到组织级研发协作全链路"
          }
        ],
        "selected": "lab_collab"
      },
      {
        "id": "m-user-confirm",
        "role": "user",
        "text": "聚焦实验室协作效率（沟通、共写、评审）"
      },
      {
        "id": "m-plan-1",
        "role": "assistant",
        "text": "已完成任务规划：将并行开展假设生成与文献检索，再推进绘图、论文撰写与审核。"
      }
    ],
    "toolsByAgent": {
      "main": [
        {
          "type": "skill",
          "name": "需求洞察"
        },
        {
          "type": "tool",
          "name": "子智能体调度器"
        }
      ]
    },
    "summons": []
  },
  {
    "id": "summon-wave-1",
    "label": "并行召唤假设与文献",
    "showPlan": true,
    "tasks": [
      {
        "id": "task-hypothesis",
        "status": "running"
      },
      {
        "id": "task-literature",
        "status": "running"
      },
      {
        "id": "task-viz",
        "status": "pending"
      },
      {
        "id": "task-paper",
        "status": "pending"
      },
      {
        "id": "task-review",
        "status": "pending"
      }
    ],
    "artifacts": [],
    "activeAgents": [
      "main",
      "hypothesis",
      "literature"
    ],
    "mainMessages": null,
    "appendMain": [
      {
        "id": "m-summon-h",
        "role": "assistant",
        "kind": "summon",
        "agentKey": "hypothesis",
        "taskId": "task-hypothesis",
        "status": "running"
      },
      {
        "id": "m-summon-l",
        "role": "assistant",
        "kind": "summon",
        "agentKey": "literature",
        "taskId": "task-literature",
        "status": "running"
      }
    ],
    "toolsByAgent": {
      "main": [
        {
          "type": "skill",
          "name": "需求洞察"
        },
        {
          "type": "tool",
          "name": "子智能体调度器"
        }
      ],
      "hypothesis": [
        {
          "type": "skill",
          "name": "科研假设验证"
        },
        {
          "type": "tool",
          "name": "Python 统计分析工具"
        }
      ],
      "literature": [
        {
          "type": "skill",
          "name": "系统文献综述"
        },
        {
          "type": "tool",
          "name": "学术文献检索工具"
        }
      ]
    },
    "summons": [
      "hypothesis",
      "literature"
    ],
    "subSessions": {
      "task-hypothesis": [
        {
          "id": "sh-0",
          "role": "user",
          "from": "main",
          "text": "请围绕「生成式 AI 对实验室科研协作效率的影响」生成一组可验证假设，并给出变量与检验路径。"
        },
        {
          "id": "sh-1",
          "role": "assistant",
          "kind": "thinking",
          "text": "梳理协作环节：沟通、共写、评审；分别提出机制假设与可测指标。"
        },
        {
          "id": "sh-2",
          "role": "assistant",
          "kind": "skill",
          "skillName": "科研假设验证",
          "text": "已形成 3 条主假设与对应操作化指标。"
        },
        {
          "id": "sh-3",
          "role": "assistant",
          "kind": "tool",
          "toolName": "Python 统计分析工具",
          "text": "完成基线统计框架与功效估算草稿。"
        }
      ],
      "task-literature": [
        {
          "id": "sl-0",
          "role": "user",
          "from": "main",
          "text": "请检索生成式 AI 与科研协作效率相关核心文献，输出证据矩阵。"
        },
        {
          "id": "sl-1",
          "role": "assistant",
          "kind": "thinking",
          "text": "按协作环节拆检索词，优先近五年实证与综述。"
        },
        {
          "id": "sl-2",
          "role": "assistant",
          "kind": "skill",
          "skillName": "系统文献综述",
          "text": "已筛选 28 篇核心文献进入证据矩阵。"
        },
        {
          "id": "sl-3",
          "role": "assistant",
          "kind": "tool",
          "toolName": "学术文献检索工具",
          "text": "完成跨库检索与去重。"
        },
        {
          "id": "sl-4",
          "role": "assistant",
          "kind": "knowledge",
          "knowledgeName": "生成式 AI 协作研究语料",
          "text": "补充组织内既有笔记中的协作效率指标定义。"
        }
      ]
    }
  },
  {
    "id": "deliver-wave-1",
    "label": "假设与文献交付",
    "showPlan": true,
    "tasks": [
      {
        "id": "task-hypothesis",
        "status": "done"
      },
      {
        "id": "task-literature",
        "status": "done"
      },
      {
        "id": "task-viz",
        "status": "pending"
      },
      {
        "id": "task-paper",
        "status": "pending"
      },
      {
        "id": "task-review",
        "status": "pending"
      }
    ],
    "artifacts": [
      {
        "id": "art-hyp",
        "name": "可验证假设报告.md",
        "size": "86 KB",
        "taskId": "task-hypothesis"
      },
      {
        "id": "art-lit",
        "name": "核心文献证据矩阵.xlsx",
        "size": "124 KB",
        "taskId": "task-literature"
      }
    ],
    "activeAgents": [
      "main",
      "hypothesis",
      "literature"
    ],
    "appendMain": [
      {
        "id": "m-summon-h",
        "role": "assistant",
        "kind": "summon",
        "agentKey": "hypothesis",
        "taskId": "task-hypothesis",
        "status": "done"
      },
      {
        "id": "m-summon-l",
        "role": "assistant",
        "kind": "summon",
        "agentKey": "literature",
        "taskId": "task-literature",
        "status": "done"
      },
      {
        "id": "m-recv-1",
        "role": "assistant",
        "text": "已收到《可验证假设报告》与《核心文献证据矩阵》，开始规划绘图与论文初稿。"
      }
    ],
    "toolsByAgent": {
      "main": [
        {
          "type": "skill",
          "name": "需求洞察"
        },
        {
          "type": "tool",
          "name": "子智能体调度器"
        }
      ],
      "hypothesis": [
        {
          "type": "skill",
          "name": "科研假设验证"
        },
        {
          "type": "tool",
          "name": "Python 统计分析工具"
        }
      ],
      "literature": [
        {
          "type": "skill",
          "name": "系统文献综述"
        },
        {
          "type": "tool",
          "name": "学术文献检索工具"
        }
      ]
    },
    "summons": [
      "hypothesis",
      "literature"
    ],
    "subSessions": {
      "task-hypothesis": [
        {
          "id": "sh-0",
          "role": "user",
          "from": "main",
          "text": "请围绕「生成式 AI 对实验室科研协作效率的影响」生成一组可验证假设，并给出变量与检验路径。"
        },
        {
          "id": "sh-1",
          "role": "assistant",
          "kind": "thinking",
          "text": "梳理协作环节：沟通、共写、评审；分别提出机制假设与可测指标。"
        },
        {
          "id": "sh-2",
          "role": "assistant",
          "kind": "skill",
          "skillName": "科研假设验证",
          "text": "已形成 3 条主假设与对应操作化指标。"
        },
        {
          "id": "sh-3",
          "role": "assistant",
          "kind": "tool",
          "toolName": "Python 统计分析工具",
          "text": "完成基线统计框架与功效估算草稿。"
        },
        {
          "id": "sh-4",
          "role": "assistant",
          "kind": "artifact",
          "text": "已交付：可验证假设报告.md"
        }
      ],
      "task-literature": [
        {
          "id": "sl-0",
          "role": "user",
          "from": "main",
          "text": "请检索生成式 AI 与科研协作效率相关核心文献，输出证据矩阵。"
        },
        {
          "id": "sl-1",
          "role": "assistant",
          "kind": "thinking",
          "text": "按协作环节拆检索词，优先近五年实证与综述。"
        },
        {
          "id": "sl-2",
          "role": "assistant",
          "kind": "skill",
          "skillName": "系统文献综述",
          "text": "已筛选 28 篇核心文献进入证据矩阵。"
        },
        {
          "id": "sl-3",
          "role": "assistant",
          "kind": "tool",
          "toolName": "学术文献检索工具",
          "text": "完成跨库检索与去重。"
        },
        {
          "id": "sl-4",
          "role": "assistant",
          "kind": "knowledge",
          "knowledgeName": "生成式 AI 协作研究语料",
          "text": "补充组织内既有笔记中的协作效率指标定义。"
        },
        {
          "id": "sl-5",
          "role": "assistant",
          "kind": "artifact",
          "text": "已交付：核心文献证据矩阵.xlsx"
        }
      ]
    }
  },
  {
    "id": "summon-wave-2",
    "label": "并行召唤绘图与论文",
    "showPlan": true,
    "tasks": [
      {
        "id": "task-hypothesis",
        "status": "done"
      },
      {
        "id": "task-literature",
        "status": "done"
      },
      {
        "id": "task-viz",
        "status": "running"
      },
      {
        "id": "task-paper",
        "status": "running"
      },
      {
        "id": "task-review",
        "status": "pending"
      }
    ],
    "artifacts": [
      {
        "id": "art-hyp",
        "name": "可验证假设报告.md",
        "size": "86 KB",
        "taskId": "task-hypothesis"
      },
      {
        "id": "art-lit",
        "name": "核心文献证据矩阵.xlsx",
        "size": "124 KB",
        "taskId": "task-literature"
      }
    ],
    "activeAgents": [
      "main",
      "hypothesis",
      "literature",
      "viz",
      "paper"
    ],
    "appendMain": [
      {
        "id": "m-summon-v",
        "role": "assistant",
        "kind": "summon",
        "agentKey": "viz",
        "taskId": "task-viz",
        "status": "running"
      },
      {
        "id": "m-summon-p",
        "role": "assistant",
        "kind": "summon",
        "agentKey": "paper",
        "taskId": "task-paper",
        "status": "running"
      }
    ],
    "toolsByAgent": {
      "main": [
        {
          "type": "skill",
          "name": "需求洞察"
        },
        {
          "type": "tool",
          "name": "子智能体调度器"
        }
      ],
      "hypothesis": [
        {
          "type": "skill",
          "name": "科研假设验证"
        },
        {
          "type": "tool",
          "name": "Python 统计分析工具"
        }
      ],
      "literature": [
        {
          "type": "skill",
          "name": "系统文献综述"
        },
        {
          "type": "tool",
          "name": "学术文献检索工具"
        }
      ],
      "viz": [
        {
          "type": "skill",
          "name": "科研绘图"
        },
        {
          "type": "tool",
          "name": "Python 绘图环境"
        }
      ],
      "paper": [
        {
          "type": "skill",
          "name": "学术写作"
        },
        {
          "type": "tool",
          "name": "引用校验工具"
        }
      ]
    },
    "summons": [
      "hypothesis",
      "literature",
      "viz",
      "paper"
    ],
    "subSessions": {
      "task-viz": [
        {
          "id": "sv-0",
          "role": "user",
          "from": "main",
          "text": "请基于假设报告与证据矩阵，制作可放入论文的科研图表包。"
        },
        {
          "id": "sv-1",
          "role": "assistant",
          "kind": "thinking",
          "text": "规划协作效率对比图、机制路径图与文献证据热力图。"
        },
        {
          "id": "sv-2",
          "role": "assistant",
          "kind": "skill",
          "skillName": "科研绘图",
          "text": "已确定图组结构与标注规范。"
        },
        {
          "id": "sv-3",
          "role": "assistant",
          "kind": "tool",
          "toolName": "Python 绘图环境",
          "text": "正在渲染矢量图并打包。"
        }
      ],
      "task-paper": [
        {
          "id": "sp-0",
          "role": "user",
          "from": "main",
          "text": "请基于假设与文献证据撰写带图表的论文初稿。"
        },
        {
          "id": "sp-1",
          "role": "assistant",
          "kind": "thinking",
          "text": "按引言—方法—结果—讨论组织论证，预留图表插入点。"
        },
        {
          "id": "sp-2",
          "role": "assistant",
          "kind": "skill",
          "skillName": "学术写作",
          "text": "已完成初稿章节骨架与核心论述。"
        },
        {
          "id": "sp-3",
          "role": "assistant",
          "kind": "tool",
          "toolName": "引用校验工具",
          "text": "完成引用格式初检。"
        }
      ]
    }
  },
  {
    "id": "deliver-wave-2",
    "label": "图表与初稿交付",
    "showPlan": true,
    "tasks": [
      {
        "id": "task-hypothesis",
        "status": "done"
      },
      {
        "id": "task-literature",
        "status": "done"
      },
      {
        "id": "task-viz",
        "status": "done"
      },
      {
        "id": "task-paper",
        "status": "running"
      },
      {
        "id": "task-review",
        "status": "pending"
      }
    ],
    "artifacts": [
      {
        "id": "art-hyp",
        "name": "可验证假设报告.md",
        "size": "86 KB",
        "taskId": "task-hypothesis"
      },
      {
        "id": "art-lit",
        "name": "核心文献证据矩阵.xlsx",
        "size": "124 KB",
        "taskId": "task-literature"
      },
      {
        "id": "art-viz",
        "name": "科研图表包.zip",
        "size": "2.4 MB",
        "taskId": "task-viz"
      },
      {
        "id": "art-paper-draft",
        "name": "研究论文初稿（待修订）.docx",
        "size": "318 KB",
        "taskId": "task-paper"
      }
    ],
    "activeAgents": [
      "main",
      "hypothesis",
      "literature",
      "viz",
      "paper"
    ],
    "appendMain": [
      {
        "id": "m-summon-v",
        "role": "assistant",
        "kind": "summon",
        "agentKey": "viz",
        "taskId": "task-viz",
        "status": "done"
      },
      {
        "id": "m-summon-p",
        "role": "assistant",
        "kind": "summon",
        "agentKey": "paper",
        "taskId": "task-paper",
        "status": "running"
      },
      {
        "id": "m-reject-1",
        "role": "assistant",
        "text": "图表包可用。论文初稿论证偏弱：缺少反例、研究局限与替代解释，已在原论文生成会话中追加修订要求。"
      }
    ],
    "toolsByAgent": {
      "main": [
        {
          "type": "skill",
          "name": "需求洞察"
        },
        {
          "type": "tool",
          "name": "子智能体调度器"
        }
      ],
      "hypothesis": [
        {
          "type": "skill",
          "name": "科研假设验证"
        },
        {
          "type": "tool",
          "name": "Python 统计分析工具"
        }
      ],
      "literature": [
        {
          "type": "skill",
          "name": "系统文献综述"
        },
        {
          "type": "tool",
          "name": "学术文献检索工具"
        }
      ],
      "viz": [
        {
          "type": "skill",
          "name": "科研绘图"
        },
        {
          "type": "tool",
          "name": "Python 绘图环境"
        }
      ],
      "paper": [
        {
          "type": "skill",
          "name": "学术写作"
        },
        {
          "type": "tool",
          "name": "引用校验工具"
        }
      ]
    },
    "summons": [
      "hypothesis",
      "literature",
      "viz",
      "paper"
    ],
    "subSessions": {
      "task-viz": [
        {
          "id": "sv-0",
          "role": "user",
          "from": "main",
          "text": "请基于假设报告与证据矩阵，制作可放入论文的科研图表包。"
        },
        {
          "id": "sv-1",
          "role": "assistant",
          "kind": "thinking",
          "text": "规划协作效率对比图、机制路径图与文献证据热力图。"
        },
        {
          "id": "sv-2",
          "role": "assistant",
          "kind": "skill",
          "skillName": "科研绘图",
          "text": "已确定图组结构与标注规范。"
        },
        {
          "id": "sv-3",
          "role": "assistant",
          "kind": "tool",
          "toolName": "Python 绘图环境",
          "text": "正在渲染矢量图并打包。"
        },
        {
          "id": "sv-4",
          "role": "assistant",
          "kind": "artifact",
          "text": "已交付：科研图表包.zip"
        }
      ],
      "task-paper": [
        {
          "id": "sp-0",
          "role": "user",
          "from": "main",
          "text": "请基于假设与文献证据撰写带图表的论文初稿。"
        },
        {
          "id": "sp-1",
          "role": "assistant",
          "kind": "thinking",
          "text": "按引言—方法—结果—讨论组织论证，预留图表插入点。"
        },
        {
          "id": "sp-2",
          "role": "assistant",
          "kind": "skill",
          "skillName": "学术写作",
          "text": "已完成初稿章节骨架与核心论述。"
        },
        {
          "id": "sp-3",
          "role": "assistant",
          "kind": "tool",
          "toolName": "引用校验工具",
          "text": "完成引用格式初检。"
        },
        {
          "id": "sp-4",
          "role": "assistant",
          "kind": "artifact",
          "text": "已交付：研究论文初稿（待修订）.docx"
        },
        {
          "id": "sp-5",
          "role": "user",
          "from": "main",
          "text": "请补充反例、研究局限与替代解释，并给出修订稿。"
        },
        {
          "id": "sp-6",
          "role": "assistant",
          "kind": "thinking",
          "text": "在讨论章扩展局限与替代解释，并回写方法边界。"
        }
      ]
    }
  },
  {
    "id": "paper-revised",
    "label": "论文修订交付",
    "showPlan": true,
    "tasks": [
      {
        "id": "task-hypothesis",
        "status": "done"
      },
      {
        "id": "task-literature",
        "status": "done"
      },
      {
        "id": "task-viz",
        "status": "done"
      },
      {
        "id": "task-paper",
        "status": "done"
      },
      {
        "id": "task-review",
        "status": "pending"
      }
    ],
    "artifacts": [
      {
        "id": "art-hyp",
        "name": "可验证假设报告.md",
        "size": "86 KB",
        "taskId": "task-hypothesis"
      },
      {
        "id": "art-lit",
        "name": "核心文献证据矩阵.xlsx",
        "size": "124 KB",
        "taskId": "task-literature"
      },
      {
        "id": "art-viz",
        "name": "科研图表包.zip",
        "size": "2.4 MB",
        "taskId": "task-viz"
      },
      {
        "id": "art-paper-final",
        "name": "研究论文修订稿.docx",
        "size": "342 KB",
        "taskId": "task-paper",
        "replaces": "art-paper-draft"
      }
    ],
    "activeAgents": [
      "main",
      "hypothesis",
      "literature",
      "viz",
      "paper"
    ],
    "appendMain": [
      {
        "id": "m-summon-p",
        "role": "assistant",
        "kind": "summon",
        "agentKey": "paper",
        "taskId": "task-paper",
        "status": "done"
      },
      {
        "id": "m-paper-ok",
        "role": "assistant",
        "text": "已收到论文修订稿，准备召唤论文审核智能体。"
      }
    ],
    "toolsByAgent": {
      "main": [
        {
          "type": "skill",
          "name": "需求洞察"
        },
        {
          "type": "tool",
          "name": "子智能体调度器"
        }
      ],
      "hypothesis": [
        {
          "type": "skill",
          "name": "科研假设验证"
        },
        {
          "type": "tool",
          "name": "Python 统计分析工具"
        }
      ],
      "literature": [
        {
          "type": "skill",
          "name": "系统文献综述"
        },
        {
          "type": "tool",
          "name": "学术文献检索工具"
        }
      ],
      "viz": [
        {
          "type": "skill",
          "name": "科研绘图"
        },
        {
          "type": "tool",
          "name": "Python 绘图环境"
        }
      ],
      "paper": [
        {
          "type": "skill",
          "name": "学术写作"
        },
        {
          "type": "tool",
          "name": "引用校验工具"
        }
      ]
    },
    "summons": [
      "hypothesis",
      "literature",
      "viz",
      "paper"
    ],
    "subSessions": {
      "task-paper": [
        {
          "id": "sp-0",
          "role": "user",
          "from": "main",
          "text": "请基于假设与文献证据撰写带图表的论文初稿。"
        },
        {
          "id": "sp-1",
          "role": "assistant",
          "kind": "thinking",
          "text": "按引言—方法—结果—讨论组织论证，预留图表插入点。"
        },
        {
          "id": "sp-2",
          "role": "assistant",
          "kind": "skill",
          "skillName": "学术写作",
          "text": "已完成初稿章节骨架与核心论述。"
        },
        {
          "id": "sp-3",
          "role": "assistant",
          "kind": "tool",
          "toolName": "引用校验工具",
          "text": "完成引用格式初检。"
        },
        {
          "id": "sp-4",
          "role": "assistant",
          "kind": "artifact",
          "text": "已交付：研究论文初稿（待修订）.docx"
        },
        {
          "id": "sp-5",
          "role": "user",
          "from": "main",
          "text": "请补充反例、研究局限与替代解释，并给出修订稿。"
        },
        {
          "id": "sp-6",
          "role": "assistant",
          "kind": "thinking",
          "text": "在讨论章扩展局限与替代解释，并回写方法边界。"
        },
        {
          "id": "sp-7",
          "role": "assistant",
          "kind": "skill",
          "skillName": "学术写作",
          "text": "已完成反例、局限与替代解释补强。"
        },
        {
          "id": "sp-8",
          "role": "assistant",
          "kind": "artifact",
          "text": "已交付：研究论文修订稿.docx"
        }
      ]
    }
  },
  {
    "id": "summon-review",
    "label": "召唤论文审核",
    "showPlan": true,
    "tasks": [
      {
        "id": "task-hypothesis",
        "status": "done"
      },
      {
        "id": "task-literature",
        "status": "done"
      },
      {
        "id": "task-viz",
        "status": "done"
      },
      {
        "id": "task-paper",
        "status": "done"
      },
      {
        "id": "task-review",
        "status": "running"
      }
    ],
    "artifacts": [
      {
        "id": "art-hyp",
        "name": "可验证假设报告.md",
        "size": "86 KB",
        "taskId": "task-hypothesis"
      },
      {
        "id": "art-lit",
        "name": "核心文献证据矩阵.xlsx",
        "size": "124 KB",
        "taskId": "task-literature"
      },
      {
        "id": "art-viz",
        "name": "科研图表包.zip",
        "size": "2.4 MB",
        "taskId": "task-viz"
      },
      {
        "id": "art-paper-final",
        "name": "研究论文修订稿.docx",
        "size": "342 KB",
        "taskId": "task-paper"
      }
    ],
    "activeAgents": [
      "main",
      "hypothesis",
      "literature",
      "viz",
      "paper",
      "review"
    ],
    "appendMain": [
      {
        "id": "m-summon-r",
        "role": "assistant",
        "kind": "summon",
        "agentKey": "review",
        "taskId": "task-review",
        "status": "running"
      }
    ],
    "toolsByAgent": {
      "main": [
        {
          "type": "skill",
          "name": "需求洞察"
        },
        {
          "type": "tool",
          "name": "子智能体调度器"
        }
      ],
      "hypothesis": [
        {
          "type": "skill",
          "name": "科研假设验证"
        },
        {
          "type": "tool",
          "name": "Python 统计分析工具"
        }
      ],
      "literature": [
        {
          "type": "skill",
          "name": "系统文献综述"
        },
        {
          "type": "tool",
          "name": "学术文献检索工具"
        }
      ],
      "viz": [
        {
          "type": "skill",
          "name": "科研绘图"
        },
        {
          "type": "tool",
          "name": "Python 绘图环境"
        }
      ],
      "paper": [
        {
          "type": "skill",
          "name": "学术写作"
        },
        {
          "type": "tool",
          "name": "引用校验工具"
        }
      ],
      "review": [
        {
          "type": "skill",
          "name": "同行评审"
        },
        {
          "type": "tool",
          "name": "论文规范检查工具"
        }
      ]
    },
    "summons": [
      "hypothesis",
      "literature",
      "viz",
      "paper",
      "review"
    ],
    "subSessions": {
      "task-review": [
        {
          "id": "sr-0",
          "role": "user",
          "from": "main",
          "text": "请审核《研究论文修订稿》，输出评审意见与规范检查结果。"
        },
        {
          "id": "sr-1",
          "role": "assistant",
          "kind": "thinking",
          "text": "从论证完整性、方法透明度与表述规范三线审核。"
        },
        {
          "id": "sr-2",
          "role": "assistant",
          "kind": "skill",
          "skillName": "同行评审",
          "text": "已完成主要审稿意见。"
        },
        {
          "id": "sr-3",
          "role": "assistant",
          "kind": "tool",
          "toolName": "论文规范检查工具",
          "text": "结构与引用规范检查通过，建议微调摘要措辞。"
        }
      ]
    }
  },
  {
    "id": "final",
    "label": "全部完成并汇总",
    "showPlan": true,
    "tasks": [
      {
        "id": "task-hypothesis",
        "status": "done"
      },
      {
        "id": "task-literature",
        "status": "done"
      },
      {
        "id": "task-viz",
        "status": "done"
      },
      {
        "id": "task-paper",
        "status": "done"
      },
      {
        "id": "task-review",
        "status": "done"
      }
    ],
    "artifacts": [
      {
        "id": "art-hyp",
        "name": "可验证假设报告.md",
        "size": "86 KB",
        "taskId": "task-hypothesis"
      },
      {
        "id": "art-lit",
        "name": "核心文献证据矩阵.xlsx",
        "size": "124 KB",
        "taskId": "task-literature"
      },
      {
        "id": "art-viz",
        "name": "科研图表包.zip",
        "size": "2.4 MB",
        "taskId": "task-viz"
      },
      {
        "id": "art-paper-final",
        "name": "研究论文修订稿.docx",
        "size": "342 KB",
        "taskId": "task-paper"
      },
      {
        "id": "art-review",
        "name": "论文审核报告.md",
        "size": "54 KB",
        "taskId": "task-review"
      }
    ],
    "activeAgents": [
      "main",
      "hypothesis",
      "literature",
      "viz",
      "paper",
      "review"
    ],
    "appendMain": [
      {
        "id": "m-summon-r",
        "role": "assistant",
        "kind": "summon",
        "agentKey": "review",
        "taskId": "task-review",
        "status": "done"
      },
      {
        "id": "m-final",
        "role": "assistant",
        "text": "全部任务已完成。已汇总最终论文修订稿、科研图表包与论文审核报告，可直接用于后续评审与分享。"
      }
    ],
    "toolsByAgent": {
      "main": [
        {
          "type": "skill",
          "name": "需求洞察"
        },
        {
          "type": "tool",
          "name": "子智能体调度器"
        }
      ],
      "hypothesis": [
        {
          "type": "skill",
          "name": "科研假设验证"
        },
        {
          "type": "tool",
          "name": "Python 统计分析工具"
        }
      ],
      "literature": [
        {
          "type": "skill",
          "name": "系统文献综述"
        },
        {
          "type": "tool",
          "name": "学术文献检索工具"
        }
      ],
      "viz": [
        {
          "type": "skill",
          "name": "科研绘图"
        },
        {
          "type": "tool",
          "name": "Python 绘图环境"
        }
      ],
      "paper": [
        {
          "type": "skill",
          "name": "学术写作"
        },
        {
          "type": "tool",
          "name": "引用校验工具"
        }
      ],
      "review": [
        {
          "type": "skill",
          "name": "同行评审"
        },
        {
          "type": "tool",
          "name": "论文规范检查工具"
        }
      ]
    },
    "summons": [
      "hypothesis",
      "literature",
      "viz",
      "paper",
      "review"
    ],
    "subSessions": {
      "task-review": [
        {
          "id": "sr-0",
          "role": "user",
          "from": "main",
          "text": "请审核《研究论文修订稿》，输出评审意见与规范检查结果。"
        },
        {
          "id": "sr-1",
          "role": "assistant",
          "kind": "thinking",
          "text": "从论证完整性、方法透明度与表述规范三线审核。"
        },
        {
          "id": "sr-2",
          "role": "assistant",
          "kind": "skill",
          "skillName": "同行评审",
          "text": "已完成主要审稿意见。"
        },
        {
          "id": "sr-3",
          "role": "assistant",
          "kind": "tool",
          "toolName": "论文规范检查工具",
          "text": "结构与引用规范检查通过，建议微调摘要措辞。"
        },
        {
          "id": "sr-4",
          "role": "assistant",
          "kind": "artifact",
          "text": "已交付：论文审核报告.md"
        }
      ]
    }
  }
] as ResearchDemoStep[];

export const RESEARCH_MAX_STEP = RESEARCH_DEMO_STEPS.length - 1;

/** Mid-flow default matching session preview (图表与初稿交付). */
export const RESEARCH_DEFAULT_STEP = RESEARCH_DEMO_STEPS.findIndex(
  (step) => step.id === "deliver-wave-2"
);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function mergeMessages(
  base: ResearchMessage[],
  append: ResearchMessage[]
): ResearchMessage[] {
  const map = new Map<string, ResearchMessage>();
  for (const item of base) map.set(item.id, item);
  for (const item of append) map.set(item.id, item);
  const order: ResearchMessage[] = [];
  const seen = new Set<string>();
  for (const item of [...base, ...append]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const merged = map.get(item.id);
    if (merged) order.push(merged);
  }
  return order;
}

function emptySnapshot(stepIndex = 0): ResearchSnapshot {
  const step = RESEARCH_DEMO_STEPS[stepIndex] ?? RESEARCH_DEMO_STEPS[0];
  return {
    showPlan: false,
    tasks: [],
    artifacts: [],
    activeAgents: [],
    mainMessages: [],
    toolsByAgent: {},
    summons: [],
    subSessions: {},
    stepIndex,
    stepId: step?.id ?? "idle",
    stepLabel: step?.label ?? "待命",
  };
}

/** Cumulative snapshot applied through `stepIndex` (source module semantics). */
export function buildResearchSnapshot(stepIndex: number): ResearchSnapshot {
  const safeStep = Math.max(0, Math.min(RESEARCH_MAX_STEP, stepIndex));
  let snap = emptySnapshot(safeStep);

  for (let i = 0; i <= safeStep; i += 1) {
    const step = RESEARCH_DEMO_STEPS[i];
    if (!step) continue;

    if (Array.isArray(step.mainMessages)) {
      snap.mainMessages = clone(step.mainMessages);
    }
    if (Array.isArray(step.appendMain)) {
      snap.mainMessages = mergeMessages(snap.mainMessages, step.appendMain);
    }
    if (step.showPlan != null) snap.showPlan = step.showPlan;
    if (Array.isArray(step.tasks)) {
      snap.tasks = step.tasks.map((task) => {
        const def = RESEARCH_TASK_DEFS.find((item) => item.id === task.id);
        const agentKey = (def?.agentKey ?? "hypothesis") as Exclude<
          ResearchAgentKey,
          "main"
        >;
        const agent = RESEARCH_AGENTS[agentKey];
        return {
          id: task.id,
          name: def?.name ?? task.id,
          agentKey,
          agentId: agent?.id ?? agentKey,
          agentName: agent?.name ?? agentKey,
          status: task.status,
          summoned: ["running", "done", "failed"].includes(task.status),
        };
      });
    }
    if (Array.isArray(step.artifacts)) snap.artifacts = clone(step.artifacts);
    if (Array.isArray(step.activeAgents)) {
      snap.activeAgents = clone(step.activeAgents);
    }
    if (step.toolsByAgent) snap.toolsByAgent = clone(step.toolsByAgent);
    if (Array.isArray(step.summons)) snap.summons = clone(step.summons);
    if (step.subSessions) {
      snap.subSessions = { ...snap.subSessions, ...clone(step.subSessions) };
    }
  }

  const current = RESEARCH_DEMO_STEPS[safeStep];
  snap.stepIndex = safeStep;
  snap.stepId = current?.id ?? "idle";
  snap.stepLabel = current?.label ?? "待命";
  return snap;
}

export function getResearchStepCount(): number {
  return RESEARCH_DEMO_STEPS.length;
}

export function researchStatusLabel(status: ResearchTaskStatus): string {
  if (status === "running") return "进行中";
  if (status === "done") return "已完成";
  if (status === "failed") return "失败";
  return "未开始";
}

export function getResearchAgentSummonIds(
  snapshot: ResearchSnapshot
): string[] {
  return snapshot.summons
    .filter((key) => key !== "main")
    .map((key) => RESEARCH_AGENTS[key]?.id)
    .filter((id): id is string => Boolean(id));
}

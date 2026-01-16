export interface FileItem {
  id: string;
  name: string;
  enabled: boolean;
}

export interface ChunkItem {
  id: string;
  index: number;
  total: number;
  charCount: number;
  content: string;
  enabled: boolean;
}

export interface KnowledgeBaseDetail {
  id: string;
  name: string;
  documentCount: number;
  totalSize: string;
  lastSaved: string;
  strategy: string;
  files: FileItem[];
  chunks: { [fileId: string]: ChunkItem[] };
  fullContent: { [fileId: string]: string };
}

// Knowledge base details data mapping
export const knowledgeBaseDetails: { [key: string]: KnowledgeBaseDetail } = {
  // AI Knowledge Bases
  ai_001: {
    id: "ai_001",
    name: "Transformer 架构详解",
    documentCount: 1,
    totalSize: "2.4 MB",
    lastSaved: "19:34",
    strategy: "自动切片",
    files: [
      {
        id: "doc_001",
        name: "Transformer 架构详解 (Attention Is All You Need).pdf",
        enabled: true,
      },
    ],
    chunks: {
      doc_001: [
        {
          id: "chk_101",
          index: 1,
          total: 15,
          charCount: 245,
          enabled: true,
          content:
            "Transformer 模型架构主要由编码器（Encoder）和解码器（Decoder）组成。编码器负责将输入序列映射为连续的表示序列，解码器则生成输出序列。不同于 RNN 的顺序计算，Transformer 利用自注意力（Self-Attention）机制来捕捉序列中长距离的依赖关系。",
        },
        {
          id: "chk_102",
          index: 2,
          total: 15,
          charCount: 315,
          enabled: true,
          content:
            "在 Self-Attention 机制中，输入向量被映射为 Query (Q)、Key (K) 和 Value (V) 三个向量。通过计算 Q 和 K 的点积（Scaled Dot-Product Attention），我们能得出不同位置之间的相关性权重，进而对 V 进行加权求和。这一过程允许模型在处理每个词时，都能关注到句子中其他相关的词。",
        },
        {
          id: "chk_103",
          index: 3,
          total: 15,
          charCount: 290,
          enabled: true,
          content:
            "多头注意力（Multi-Head Attention）通过并行运行多个注意力头，使得模型能够从不同的表示子空间学习信息。每个注意力头都有自己的 Q、K、V 权重矩阵，最终将多个头的输出拼接并通过线性变换得到最终结果。这种机制增强了模型的表达能力。",
        },
        {
          id: "chk_104",
          index: 4,
          total: 15,
          charCount: 276,
          enabled: true,
          content:
            "位置编码（Positional Encoding）解决了 Transformer 缺乏位置信息的问题。由于自注意力机制是位置无关的，模型需要通过位置编码来理解词序。常用的方法是使用正弦和余弦函数，为每个位置生成唯一的编码向量，这些向量与词嵌入相加后输入模型。",
        },
        {
          id: "chk_105",
          index: 5,
          total: 15,
          charCount: 264,
          enabled: true,
          content:
            "Layer Normalization 和残差连接（Residual Connection）是 Transformer 中稳定训练的关键组件。每个子层（注意力层和前馈网络）都应用了残差连接和层归一化，这有助于梯度流动，使得深层网络的训练成为可能。",
        },
      ],
    },
    fullContent: {
      doc_001:
        "Transformer 是一种完全基于注意力机制的神经网络架构，它摒弃了传统的循环神经网络（RNN）和卷积神经网络（CNN）结构。在机器翻译任务中，Transformer 展现了并行计算的优势，能够同时处理整个输入序列，而不需要像 RNN 那样逐步处理。这使得 Transformer 在训练速度上显著优于 RNN 架构。\n\nTransformer 的核心创新在于多头自注意力机制（Multi-Head Self-Attention）。通过将输入序列的每个位置都与其他所有位置建立直接连接，模型能够捕获长距离依赖关系。与 RNN 不同，Transformer 不依赖于序列的顺序计算，这使得它更适合并行化处理。\n\n位置编码（Positional Encoding）是 Transformer 的另一个关键组件。由于自注意力机制本身不包含位置信息，模型需要通过位置编码来理解序列中元素的相对或绝对位置。通常使用正弦和余弦函数来生成位置编码，这些编码与词嵌入相加后输入到编码器中。\n\n编码器-解码器架构使得 Transformer 在处理序列到序列的任务时非常有效。编码器负责理解输入序列的语义表示，而解码器则根据编码器的输出和已生成的部分输出序列来生成目标序列。这种设计使得 Transformer 在机器翻译、文本摘要等任务中都取得了优异的性能。",
    },
  },
  ai_002: {
    id: "ai_002",
    name: "RAG 检索增强生成技术",
    documentCount: 1,
    totalSize: "1.8 MB",
    lastSaved: "19:34",
    strategy: "段落清洗",
    files: [
      {
        id: "doc_002",
        name: "RAG 检索增强生成技术白皮书.pdf",
        enabled: true,
      },
    ],
    chunks: {
      doc_002: [
        {
          id: "chk_201",
          index: 1,
          total: 24,
          charCount: 280,
          enabled: true,
          content:
            "RAG 的核心工作流程包含三个阶段：检索（Retrieval）、增强（Augmentation）和生成（Generation）。首先，系统将用户的 Query 转化为向量，在向量数据库中检索最相关的内容块；然后，将检索到的内容作为 Context 拼接到 Prompt 中；最后，LLM 基于增强后的 Prompt 生成精准回答。",
        },
        {
          id: "chk_202",
          index: 2,
          total: 24,
          charCount: 270,
          enabled: false,
          content:
            "为了提高 RAG 的召回率，通常会采用混合检索（Hybrid Search）策略，即同时结合关键词检索（BM25）和语义向量检索（Dense Retrieval）。此外，重排序（Rerank）模型也是提升最终效果的关键组件，它能对初步检索回来的文档进行精细化的相关性打分。",
        },
        {
          id: "chk_203",
          index: 3,
          total: 24,
          charCount: 284,
          enabled: true,
          content:
            "向量数据库（Vector Database）是 RAG 系统的基础设施，用于存储文档的嵌入向量。当用户提出查询时，系统会将查询也转化为向量，然后使用相似度计算（如余弦相似度）在向量数据库中找到最相关的文档块。常用的向量数据库包括 Pinecone、Weaviate、Chroma 等。",
        },
        {
          id: "chk_204",
          index: 4,
          total: 24,
          charCount: 236,
          enabled: true,
          content:
            "RAG 的主要优势在于它能够为 LLM 提供外部知识来源，从而解决模型的知识局限性和时效性问题。通过检索相关文档，RAG 使得模型能够访问超出其训练数据范围的、最新的、特定领域的信息。",
        },
        {
          id: "chk_205",
          index: 5,
          total: 24,
          charCount: 272,
          enabled: true,
          content:
            "上下文窗口管理是 RAG 系统中的重要考量。由于 LLM 的上下文长度有限，需要精心设计如何选择和组合检索到的文档块。常见的策略包括：按相关性排序后取 Top-K、使用滑动窗口、或者通过摘要压缩来减少上下文长度。",
        },
      ],
    },
    fullContent: {
      doc_002:
        "检索增强生成（Retrieval-Augmented Generation, RAG）通过连接私有知识库，解决了大型语言模型（LLM）的幻觉问题和知识时效性问题。RAG 将外部知识检索与 LLM 的生成能力相结合，使得模型能够基于最新的、经过验证的信息来生成回答。\n\nRAG 的核心工作流程包含三个阶段：检索（Retrieval）、增强（Augmentation）和生成（Generation）。首先，系统将用户的 Query 转化为向量，在向量数据库中检索最相关的内容块；然后，将检索到的内容作为 Context 拼接到 Prompt 中；最后，LLM 基于增强后的 Prompt 生成精准回答。\n\n为了提高 RAG 的召回率，通常会采用混合检索（Hybrid Search）策略，即同时结合关键词检索（BM25）和语义向量检索（Dense Retrieval）。BM25 擅长精确匹配关键词，而语义检索则能够理解查询的语义意图，两者结合能够显著提升检索效果。\n\n重排序（Rerank）模型也是提升 RAG 效果的关键组件。它能够对初步检索回来的文档进行精细化的相关性打分，过滤掉低质量或不相关的文档，只保留最相关的上下文信息传递给 LLM。",
    },
  },
  ai_003: {
    id: "ai_003",
    name: "AI Agent 设计模式",
    documentCount: 1,
    totalSize: "850 KB",
    lastSaved: "19:34",
    strategy: "QA 拆分",
    files: [
      {
        id: "doc_003",
        name: "AI Agent 设计模式与工程实践.docx",
        enabled: true,
      },
    ],
    chunks: {
      doc_003: [
        {
          id: "chk_301",
          index: 1,
          total: 18,
          charCount: 245,
          enabled: true,
          content:
            "AI Agent 是指能够感知环境、进行推理并采取行动以实现目标的智能体。与传统的单一任务模型不同，Agent 具有自主性、反应性和目标导向性，能够根据环境反馈动态调整策略，完成复杂的多步骤任务。",
        },
        {
          id: "chk_302",
          index: 2,
          total: 18,
          charCount: 268,
          enabled: true,
          content:
            "ReAct（Reasoning + Acting）模式将推理和行动相结合，通过交替执行思考和行动来解决问题。Agent 首先思考下一步应该做什么，然后执行相应的行动，观察结果，再继续思考，形成迭代循环。这种模式使得 Agent 能够处理需要多步骤推理的复杂任务。",
        },
        {
          id: "chk_303",
          index: 3,
          total: 18,
          charCount: 252,
          enabled: true,
          content:
            "Plan-and-Solve 模式强调规划的重要性。Agent 首先制定一个详细的计划，将复杂任务分解为多个子任务，然后按照计划逐步执行。这种模式特别适合需要多步骤推理的复杂任务，能够提高任务完成的可靠性和效率。",
        },
        {
          id: "chk_304",
          index: 4,
          total: 18,
          charCount: 276,
          enabled: true,
          content:
            "工具调用（Tool Calling）是 AI Agent 的核心能力之一。通过为 LLM 提供外部工具（如 API、数据库、计算器等），Agent 能够执行超出纯文本生成范围的操作，实现真正的智能交互。常见的工具包括网络搜索、代码执行、文件操作等。",
        },
      ],
    },
    fullContent: {
      doc_003:
        "AI Agent 是指能够感知环境、进行推理并采取行动以实现目标的智能体。本文探讨了 ReAct、Plan-and-Solve 等主流 Agent 设计模式。\n\nReAct（Reasoning + Acting）模式将推理和行动相结合，通过交替执行思考和行动来解决问题。Agent 首先思考下一步应该做什么，然后执行相应的行动，观察结果，再继续思考，形成迭代循环。这种模式使得 Agent 能够处理需要多步骤推理的复杂任务。\n\nPlan-and-Solve 模式强调规划的重要性。Agent 首先制定一个详细的计划，将复杂任务分解为多个子任务，然后按照计划逐步执行。这种模式特别适合需要多步骤推理的复杂任务，能够提高任务完成的可靠性和效率。\n\n工具调用（Tool Calling）是 AI Agent 的核心能力之一。通过为 LLM 提供外部工具（如 API、数据库、计算器等），Agent 能够执行超出纯文本生成范围的操作，实现真正的智能交互。常见的工具包括网络搜索、代码执行、文件操作等。",
    },
  },
  ai_004: {
    id: "ai_004",
    name: "大语言模型原理与实践",
    documentCount: 3,
    totalSize: "5.2 MB",
    lastSaved: "19:34",
    strategy: "按层级切分",
    files: [
      {
        id: "doc_004_1",
        name: "大语言模型基础原理.pdf",
        enabled: true,
      },
      {
        id: "doc_004_2",
        name: "Transformer 架构深度解析.pdf",
        enabled: true,
      },
      {
        id: "doc_004_3",
        name: "LLM 微调与实践指南.pdf",
        enabled: true,
      },
    ],
    chunks: {
      doc_004_1: [
        {
          id: "chk_401",
          index: 1,
          total: 20,
          charCount: 256,
          enabled: true,
          content:
            "大语言模型（Large Language Model, LLM）是基于 Transformer 架构的深度学习模型，通过在大规模文本数据上进行预训练，学习语言的统计规律和语义表示。预训练阶段通常使用自回归或自编码任务，使模型能够理解和生成自然语言文本。",
        },
      ],
      doc_004_2: [
        {
          id: "chk_402",
          index: 1,
          total: 18,
          charCount: 248,
          enabled: true,
          content:
            "Transformer 架构是当前大语言模型的基础。其核心组件包括多头自注意力机制、位置编码、前馈网络和层归一化。这些组件共同工作，使得模型能够处理长序列并捕获复杂的语言模式。",
        },
      ],
      doc_004_3: [
        {
          id: "chk_403",
          index: 1,
          total: 22,
          charCount: 272,
          enabled: true,
          content:
            "LLM 微调是将预训练模型适配到特定任务的关键步骤。常见的微调方法包括全量微调、参数高效微调（如 LoRA）和提示学习（Prompt Tuning）。选择合适的微调策略能够平衡模型性能与训练成本。",
        },
      ],
    },
    fullContent: {
      doc_004_1: "大语言模型基础原理内容...",
      doc_004_2: "Transformer 架构深度解析内容...",
      doc_004_3: "LLM 微调与实践指南内容...",
    },
  },
  ai_005: {
    id: "ai_005",
    name: "向量数据库技术指南",
    documentCount: 2,
    totalSize: "1.5 MB",
    lastSaved: "19:34",
    strategy: "自动切片",
    files: [
      {
        id: "doc_005_1",
        name: "向量数据库原理与应用.pdf",
        enabled: true,
      },
      {
        id: "doc_005_2",
        name: "RAG 系统中的向量检索实践.pdf",
        enabled: true,
      },
    ],
    chunks: {
      doc_005_1: [
        {
          id: "chk_501",
          index: 1,
          total: 15,
          charCount: 264,
          enabled: true,
          content:
            "向量数据库是专门设计用于存储和检索高维向量的数据库系统。与传统的基于关键字的检索不同，向量数据库使用相似度计算（如余弦相似度、欧氏距离）来找到最相似的向量，这使得它在语义搜索、推荐系统等场景中非常有效。",
        },
      ],
      doc_005_2: [
        {
          id: "chk_502",
          index: 1,
          total: 16,
          charCount: 252,
          enabled: true,
          content:
            "在 RAG 系统中，向量数据库负责存储文档的嵌入向量。当用户提出查询时，系统会将查询也转化为向量，然后使用相似度计算在向量数据库中找到最相关的文档块。常用的向量数据库包括 Pinecone、Weaviate、Chroma、Milvus 等。",
        },
      ],
    },
    fullContent: {
      doc_005_1: "向量数据库原理与应用内容...",
      doc_005_2: "RAG 系统中的向量检索实践内容...",
    },
  },
  // Tianjin group knowledge bases
  tianjin_003: {
    id: "tianjin_003",
    name: "法律法规",
    documentCount: 3,
    totalSize: "422.4K",
    lastSaved: "19:34",
    strategy: "自动切片",
    files: [
      {
        id: "tianjin_doc_1",
        name: "2015中国共产党纪律处分条例(2015年修正)",
        enabled: true,
      },
      {
        id: "tianjin_doc_2",
        name: "2023中国共产党纪律处分条例(2023年修正)",
        enabled: true,
      },
      {
        id: "tianjin_doc_3",
        name: "2018中国共产党纪律处分条例(2018年修正)",
        enabled: true,
      },
    ],
    chunks: {
      tianjin_doc_1: [
        {
          id: "chk_tj_101",
          index: 1,
          total: 32,
          charCount: 245,
          enabled: true,
          content:
            "中国共产党纪律处分条例(2015年修正)(2015年10月21日中共中央公布)第一编总则第一章指导思想、原则和适用范围第一条为维护党的章程和其他党内法规，严肃党的纪律，纯洁党的组织，保障党员民主权利，教育党员遵纪守法，维护党的团结统一，保证党的路线、方针、政策、决议和国家法律法规的贯彻执行，根据《中国共产党章程》，制定本条例。",
        },
        {
          id: "chk_tj_102",
          index: 2,
          total: 32,
          charCount: 198,
          enabled: true,
          content:
            "第二条本条例以马克思列宁主义、毛泽东思想、邓小平理论、'三个代表'重要思想、科学发展观为指导，深入贯彻习近平总书记系列重要讲话精神，落实全面从严治党战略部署。",
        },
        {
          id: "chk_tj_103",
          index: 3,
          total: 32,
          charCount: 167,
          enabled: true,
          content:
            "第三条党章是最根本的党内法规，是管党治党的总规矩。党的纪律是党的各级组织和全体党员必须遵守的行为规则。党组织和党员必须自觉遵守党章，严格执行和维护党的纪律。",
        },
        {
          id: "chk_tj_104",
          index: 4,
          total: 32,
          charCount: 189,
          enabled: true,
          content:
            "第四条党的纪律处分工作应当坚持以下原则：(一)党要管党、从严治党。加强对党的各级组织和全体党员的教育、管理和监督，把纪律挺在前面，注重抓早抓小。",
        },
        {
          id: "chk_tj_105",
          index: 5,
          total: 32,
          charCount: 156,
          enabled: true,
          content:
            "第五条本条例适用于违反党纪应当受到党纪追究的党组织和党员。党组织和党员违反党章和其他党内法规，违反国家法律法规，违反党和国家政策，违反社会主义道德，危害党、国家和人民利益的行为，依照规定应当给予纪律处理或者处分的，都必须受到追究。",
        },
      ],
      tianjin_doc_2: [],
      tianjin_doc_3: [],
    },
    fullContent: {
      tianjin_doc_1:
        "中国共产党纪律处分条例(2015年修正)\n(2015年10月21日中共中央公布)\n\n第一编 总则\n\n第一章 指导思想、原则和适用范围\n\n第一条 为维护党的章程和其他党内法规，严肃党的纪律，纯洁党的组织，保障党员民主权利，教育党员遵纪守法，维护党的团结统一，保证党的路线、方针、政策、决议和国家法律法规的贯彻执行，根据《中国共产党章程》，制定本条例。\n\n第二条 本条例以马克思列宁主义、毛泽东思想、邓小平理论、'三个代表'重要思想、科学发展观为指导，深入贯彻习近平总书记系列重要讲话精神，落实全面从严治党战略部署。\n\n第三条 党章是最根本的党内法规，是管党治党的总规矩。党的纪律是党的各级组织和全体党员必须遵守的行为规则。党组织和党员必须自觉遵守党章，严格执行和维护党的纪律。",
      tianjin_doc_2: "2023年版本内容...",
      tianjin_doc_3: "2018年版本内容...",
    },
  },
  // Add more knowledge bases as needed...
  tianjin_001: {
    id: "tianjin_001",
    name: "笔录知识库",
    documentCount: 1,
    totalSize: "125K",
    lastSaved: "19:34",
    strategy: "自动切片",
    files: [{ id: "tianjin_lb_1", name: "笔录模板.docx", enabled: true }],
    chunks: {
      tianjin_lb_1: [],
    },
    fullContent: {
      tianjin_lb_1: "笔录知识库内容...",
    },
  },
  tianjin_002: {
    id: "tianjin_002",
    name: "自查清单",
    documentCount: 3,
    totalSize: "195K",
    lastSaved: "19:34",
    strategy: "自动切片",
    files: [
      { id: "tianjin_zc_1", name: "自查清单模板1.docx", enabled: true },
      { id: "tianjin_zc_2", name: "自查清单模板2.docx", enabled: true },
      { id: "tianjin_zc_3", name: "自查清单模板3.docx", enabled: true },
    ],
    chunks: {
      tianjin_zc_1: [],
      tianjin_zc_2: [],
      tianjin_zc_3: [],
    },
    fullContent: {
      tianjin_zc_1: "自查清单内容...",
      tianjin_zc_2: "自查清单内容...",
      tianjin_zc_3: "自查清单内容...",
    },
  },
  tianjin_004: {
    id: "tianjin_004",
    name: "初核报告模板",
    documentCount: 1,
    totalSize: "85K",
    lastSaved: "19:34",
    strategy: "自动切片",
    files: [{ id: "tianjin_ch_1", name: "初核报告模板.docx", enabled: true }],
    chunks: { tianjin_ch_1: [] },
    fullContent: { tianjin_ch_1: "初核报告模板内容..." },
  },
  tianjin_005: {
    id: "tianjin_005",
    name: "领域映射关系知识库",
    documentCount: 2,
    totalSize: "156K",
    lastSaved: "19:34",
    strategy: "自动切片",
    files: [
      { id: "tianjin_ly_1", name: "领域映射关系文档1.pdf", enabled: true },
      { id: "tianjin_ly_2", name: "领域映射关系文档2.pdf", enabled: true },
    ],
    chunks: {
      tianjin_ly_1: [],
      tianjin_ly_2: [],
    },
    fullContent: {
      tianjin_ly_1: "领域映射关系内容...",
      tianjin_ly_2: "领域映射关系内容...",
    },
  },
  tianjin_006: {
    id: "tianjin_006",
    name: "纪检调查报告知识库",
    documentCount: 1,
    totalSize: "98K",
    lastSaved: "19:34",
    strategy: "自动切片",
    files: [{ id: "tianjin_dcbg_1", name: "纪检调查报告模板.docx", enabled: true }],
    chunks: { tianjin_dcbg_1: [] },
    fullContent: { tianjin_dcbg_1: "纪检调查报告内容..." },
  },
  tianjin_007: {
    id: "tianjin_007",
    name: "纪检初步核实报告知识库",
    documentCount: 1,
    totalSize: "112K",
    lastSaved: "19:34",
    strategy: "自动切片",
    files: [{ id: "tianjin_cbhs_1", name: "纪检初步核实报告模板.docx", enabled: true }],
    chunks: { tianjin_cbhs_1: [] },
    fullContent: { tianjin_cbhs_1: "纪检初步核实报告内容..." },
  },
  tianjin_008: {
    id: "tianjin_008",
    name: "纪检审查报告知识库",
    documentCount: 1,
    totalSize: "134K",
    lastSaved: "19:34",
    strategy: "自动切片",
    files: [{ id: "tianjin_scbg_1", name: "纪检审查报告模板.docx", enabled: true }],
    chunks: { tianjin_scbg_1: [] },
    fullContent: { tianjin_scbg_1: "纪检审查报告内容..." },
  },
  test_001: {
    id: "test_001",
    name: "测试知识库1",
    documentCount: 5,
    totalSize: "425K",
    lastSaved: "19:34",
    strategy: "自动切片",
    files: [
      { id: "test_1_doc1", name: "测试文档1.pdf", enabled: true },
      { id: "test_1_doc2", name: "测试文档2.docx", enabled: true },
      { id: "test_1_doc3", name: "测试文档3.pdf", enabled: true },
      { id: "test_1_doc4", name: "测试文档4.docx", enabled: true },
      { id: "test_1_doc5", name: "测试文档5.pdf", enabled: true },
    ],
    chunks: {
      test_1_doc1: [],
      test_1_doc2: [],
      test_1_doc3: [],
      test_1_doc4: [],
      test_1_doc5: [],
    },
    fullContent: {
      test_1_doc1: "测试文档1内容...",
      test_1_doc2: "测试文档2内容...",
      test_1_doc3: "测试文档3内容...",
      test_1_doc4: "测试文档4内容...",
      test_1_doc5: "测试文档5内容...",
    },
  },
  test_002: {
    id: "test_002",
    name: "测试知识库2",
    documentCount: 3,
    totalSize: "256K",
    lastSaved: "19:34",
    strategy: "自动切片",
    files: [
      { id: "test_2_doc1", name: "测试文档A.pdf", enabled: true },
      { id: "test_2_doc2", name: "测试文档B.docx", enabled: true },
      { id: "test_2_doc3", name: "测试文档C.pdf", enabled: true },
    ],
    chunks: {
      test_2_doc1: [],
      test_2_doc2: [],
      test_2_doc3: [],
    },
    fullContent: {
      test_2_doc1: "测试文档A内容...",
      test_2_doc2: "测试文档B内容...",
      test_2_doc3: "测试文档C内容...",
    },
  },
  migration_001: {
    id: "migration_001",
    name: "迁移知识库1",
    documentCount: 4,
    totalSize: "512K",
    lastSaved: "19:34",
    strategy: "自动切片",
    files: [
      { id: "migration_doc1", name: "迁移文档1.pdf", enabled: true },
      { id: "migration_doc2", name: "迁移文档2.docx", enabled: true },
      { id: "migration_doc3", name: "迁移文档3.pdf", enabled: true },
      { id: "migration_doc4", name: "迁移文档4.docx", enabled: true },
    ],
    chunks: {
      migration_doc1: [],
      migration_doc2: [],
      migration_doc3: [],
      migration_doc4: [],
    },
    fullContent: {
      migration_doc1: "迁移文档1内容...",
      migration_doc2: "迁移文档2内容...",
      migration_doc3: "迁移文档3内容...",
      migration_doc4: "迁移文档4内容...",
    },
  },
};

// Get knowledge base detail by ID
export function getKnowledgeBaseDetail(id: string): KnowledgeBaseDetail | null {
  return knowledgeBaseDetails[id] || null;
}

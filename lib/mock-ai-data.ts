export interface GroupInfo {
  id: string;
  name: string;
  description: string;
}

export interface Chunk {
  id: string;
  index: number;
  content: string;
  wordCount: number;
  status: boolean;
}

export interface Document {
  id: string;
  name: string;
  size: string;
  status: "active" | "parsing" | "inactive";
  uploadDate: string;
  strategy: string;
  chunkCount: number;
  fullContent: string;
  chunks: Chunk[];
}

export interface AIKnowledgeBaseMock {
  groupInfo: GroupInfo;
  documents: Document[];
}

export const AI_KNOWLEDGE_BASE_MOCK: AIKnowledgeBaseMock = {
  groupInfo: {
    id: "default_all",
    name: "全部群组",
    description: "系统默认分组，包含所有未分类的 AI 技术文档",
  },
  documents: [
    {
      id: "doc_001",
      name: "Transformer 架构详解 (Attention Is All You Need).pdf",
      size: "2.4 MB",
      status: "active", // 已启用
      uploadDate: "2023-12-10",
      strategy: "自动切片",
      chunkCount: 15,
      // 模拟原文件预览内容
      fullContent:
        "Transformer 是一种完全基于注意力机制的神经网络架构，它摒弃了传统的循环神经网络（RNN）和卷积神经网络（CNN）结构。在机器翻译任务中，Transformer 展现了并行计算的优势，能够同时处理整个输入序列，而不需要像 RNN 那样逐步处理。这使得 Transformer 在训练速度上显著优于 RNN 架构。\n\nTransformer 的核心创新在于多头自注意力机制（Multi-Head Self-Attention）。通过将输入序列的每个位置都与其他所有位置建立直接连接，模型能够捕获长距离依赖关系。与 RNN 不同，Transformer 不依赖于序列的顺序计算，这使得它更适合并行化处理。\n\n位置编码（Positional Encoding）是 Transformer 的另一个关键组件。由于自注意力机制本身不包含位置信息，模型需要通过位置编码来理解序列中元素的相对或绝对位置。通常使用正弦和余弦函数来生成位置编码，这些编码与词嵌入相加后输入到编码器中。\n\n编码器-解码器架构使得 Transformer 在处理序列到序列的任务时非常有效。编码器负责理解输入序列的语义表示，而解码器则根据编码器的输出和已生成的部分输出序列来生成目标序列。这种设计使得 Transformer 在机器翻译、文本摘要等任务中都取得了优异的性能。",
      chunks: [
        {
          id: "chk_101",
          index: 1,
          content:
            "Transformer 模型架构主要由编码器（Encoder）和解码器（Decoder）组成。编码器负责将输入序列映射为连续的表示序列，解码器则生成输出序列。不同于 RNN 的顺序计算，Transformer 利用自注意力（Self-Attention）机制来捕捉序列中长距离的依赖关系。",
          wordCount: 120,
          status: true,
        },
        {
          id: "chk_102",
          index: 2,
          content:
            "在 Self-Attention 机制中，输入向量被映射为 Query (Q)、Key (K) 和 Value (V) 三个向量。通过计算 Q 和 K 的点积（Scaled Dot-Product Attention），我们能得出不同位置之间的相关性权重，进而对 V 进行加权求和。这一过程允许模型在处理每个词时，都能关注到句子中其他相关的词。",
          wordCount: 158,
          status: true,
        },
        {
          id: "chk_103",
          index: 3,
          content:
            "多头注意力（Multi-Head Attention）通过并行运行多个注意力头，使得模型能够从不同的表示子空间学习信息。每个注意力头都有自己的 Q、K、V 权重矩阵，最终将多个头的输出拼接并通过线性变换得到最终结果。这种机制增强了模型的表达能力。",
          wordCount: 145,
          status: true,
        },
        {
          id: "chk_104",
          index: 4,
          content:
            "位置编码（Positional Encoding）解决了 Transformer 缺乏位置信息的问题。由于自注意力机制是位置无关的，模型需要通过位置编码来理解词序。常用的方法是使用正弦和余弦函数，为每个位置生成唯一的编码向量，这些向量与词嵌入相加后输入模型。",
          wordCount: 138,
          status: true,
        },
        {
          id: "chk_105",
          index: 5,
          content:
            "Layer Normalization 和残差连接（Residual Connection）是 Transformer 中稳定训练的关键组件。每个子层（注意力层和前馈网络）都应用了残差连接和层归一化，这有助于梯度流动，使得深层网络的训练成为可能。",
          wordCount: 132,
          status: true,
        },
      ],
    },
    {
      id: "doc_002",
      name: "RAG 检索增强生成技术白皮书.pdf",
      size: "1.8 MB",
      status: "active",
      uploadDate: "2024-01-05",
      strategy: "段落清洗",
      chunkCount: 24,
      fullContent:
        "检索增强生成（Retrieval-Augmented Generation, RAG）通过连接私有知识库，解决了大型语言模型（LLM）的幻觉问题和知识时效性问题。RAG 将外部知识检索与 LLM 的生成能力相结合，使得模型能够基于最新的、经过验证的信息来生成回答。\n\nRAG 的核心工作流程包含三个阶段：检索（Retrieval）、增强（Augmentation）和生成（Generation）。首先，系统将用户的 Query 转化为向量，在向量数据库中检索最相关的内容块；然后，将检索到的内容作为 Context 拼接到 Prompt 中；最后，LLM 基于增强后的 Prompt 生成精准回答。\n\n为了提高 RAG 的召回率，通常会采用混合检索（Hybrid Search）策略，即同时结合关键词检索（BM25）和语义向量检索（Dense Retrieval）。BM25 擅长精确匹配关键词，而语义检索则能够理解查询的语义意图，两者结合能够显著提升检索效果。\n\n重排序（Rerank）模型也是提升 RAG 效果的关键组件。它能够对初步检索回来的文档进行精细化的相关性打分，过滤掉低质量或不相关的文档，只保留最相关的上下文信息传递给 LLM。",
      chunks: [
        {
          id: "chk_201",
          index: 1,
          content:
            "RAG 的核心工作流程包含三个阶段：检索（Retrieval）、增强（Augmentation）和生成（Generation）。首先，系统将用户的 Query 转化为向量，在向量数据库中检索最相关的内容块；然后，将检索到的内容作为 Context 拼接到 Prompt 中；最后，LLM 基于增强后的 Prompt 生成精准回答。",
          wordCount: 140,
          status: true,
        },
        {
          id: "chk_202",
          index: 2,
          content:
            "为了提高 RAG 的召回率，通常会采用混合检索（Hybrid Search）策略，即同时结合关键词检索（BM25）和语义向量检索（Dense Retrieval）。此外，重排序（Rerank）模型也是提升最终效果的关键组件，它能对初步检索回来的文档进行精细化的相关性打分。",
          wordCount: 135,
          status: false, // 模拟一个被停用的切片
        },
        {
          id: "chk_203",
          index: 3,
          content:
            "向量数据库（Vector Database）是 RAG 系统的基础设施，用于存储文档的嵌入向量。当用户提出查询时，系统会将查询也转化为向量，然后使用相似度计算（如余弦相似度）在向量数据库中找到最相关的文档块。常用的向量数据库包括 Pinecone、Weaviate、Chroma 等。",
          wordCount: 142,
          status: true,
        },
        {
          id: "chk_204",
          index: 4,
          content:
            "RAG 的主要优势在于它能够为 LLM 提供外部知识来源，从而解决模型的知识局限性和时效性问题。通过检索相关文档，RAG 使得模型能够访问超出其训练数据范围的、最新的、特定领域的信息。",
          wordCount: 118,
          status: true,
        },
        {
          id: "chk_205",
          index: 5,
          content:
            "上下文窗口管理是 RAG 系统中的重要考量。由于 LLM 的上下文长度有限，需要精心设计如何选择和组合检索到的文档块。常见的策略包括：按相关性排序后取 Top-K、使用滑动窗口、或者通过摘要压缩来减少上下文长度。",
          wordCount: 136,
          status: true,
        },
      ],
    },
    {
      id: "doc_003",
      name: "AI Agent 设计模式与工程实践.docx",
      size: "850 KB",
      status: "parsing", // 模拟正在解析中
      uploadDate: "2024-01-14",
      strategy: "QA 拆分",
      chunkCount: 0,
      fullContent:
        "AI Agent 是指能够感知环境、进行推理并采取行动以实现目标的智能体。本文探讨了 ReAct、Plan-and-Solve 等主流 Agent 设计模式。\n\nReAct（Reasoning + Acting）模式将推理和行动相结合，通过交替执行思考和行动来解决问题。Agent 首先思考下一步应该做什么，然后执行相应的行动，观察结果，再继续思考，形成迭代循环。\n\nPlan-and-Solve 模式强调规划的重要性。Agent 首先制定一个详细的计划，将复杂任务分解为多个子任务，然后按照计划逐步执行。这种模式特别适合需要多步骤推理的复杂任务。\n\n工具调用（Tool Calling）是 AI Agent 的核心能力之一。通过为 LLM 提供外部工具（如 API、数据库、计算器等），Agent 能够执行超出纯文本生成范围的操作，实现真正的智能交互。",
      chunks: [], // 解析中，暂无切片
    },
  ],
};

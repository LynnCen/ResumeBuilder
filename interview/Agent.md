# Agent 面试深度指南

> 面试点拨：少谈「对话」，多谈「系统」。Agent 是以 LLM 为核心、具备**自主性（Autonomy）**的闭环系统。

---

## 一、Agent 的本质架构：大脑、感官与四肢

**核心公式：**

$$
Agent = LLM + Planning + Memory + Tool\ Use
$$

| 比喻 | 对应能力 | 说明 |
| ---- | -------- | ---- |
| **大脑 (Brain)** | LLM | 逻辑推理、意图识别、任务拆解 |
| **感官 (Perception)** | RAG | 实时、私域的外部知识输入 |
| **四肢 (Action)** | Tool Use / Function Calling | 调用外部 API 或物理设备 |

---

## 二、核心组件详解

### 1. 规划 (Planning)：思维链条

- **思维链 (CoT, Chain of Thought)**  
  引导模型显式展示推理步骤，适合复杂逻辑题。

- **ReAct 模式 (Reasoning + Acting)**  
  - **Thought**：分析当前状态与目标  
  - **Action**：决定调用哪个工具  
  - **Observation**：根据工具返回更新认知，进入下一轮 Thought

- **自反思 (Self-Reflection)**  
  生成结果后增加「评价节点」，检查逻辑错误并迭代修正。

- **思维树 (ToT, Tree of Thoughts)**  
  多路径探索与回溯，适合需要前瞻或全局最优的任务。

**三种范式详解：**

| 范式 | 核心理念 | 工作模式 | 特点 |
|------|----------|----------|------|
| **CoT** | 线性思考 | 输入 → 推理步骤 1 → 步骤 2 → … → 答案；Prompt 中常用 "Let's think step by step" | 纯静态推理、不与外部交互；提升逻辑/算术能力，但一步错易步步错 |
| **ReAct** | 边想边做 | **Thought** → **Action**（调用搜索/计算/DB 等）→ **Observation** → 根据结果再 Thought，循环直到完成 | 可纠错、可实时调整（如换搜索词重试）；LangGraph 等主流 Agent 的核心逻辑 |
| **ToT** | 多路径探索 | 每步生成多个思维分支 → 自评价 (Self-evaluation) 打分 → 用 BFS/DFS 寻优 → 不行则回溯 (Backtrack) | 适合创意写作、策略游戏、数学难题等需全局最优的场景 |

**CoT (Chain of Thought, 思维链)**  
核心理念：「线性思考」。通过在 Prompt 中加入 *Let's think step by step*，引导模型将复杂问题拆解为一系列中间推理步骤。  
工作模式：输入 → 推理步骤 1 → 步骤 2 → 步骤 3 → 最终答案。  
特点：纯静态推理，不与外部世界交互。它提升了模型处理逻辑、算术任务的能力，但无法修正推理过程中的错误（一旦第一步错了，后面全错）。

**ReAct (Reason + Act, 推理与行动)**  
核心理念：「边想边做」。将 CoT 的推理能力与外部工具的执行能力相结合。  
工作模式：是一个动态的循环——**Thought**：思考当前需要做什么；**Action**：调用外部工具（如搜索、计算、数据库查询）；**Observation**：观察工具返回的结果；**Repeat**：根据结果再次 Thought，直到完成任务。  
特点：具备纠错能力和实时性。如果搜索结果不理想，Agent 会调整搜索词重试。这是目前主流 Agent（如 LangGraph 实现的智能体）的核心逻辑。

**ToT (Tree of Thoughts, 思维树)**  
核心理念：「多路径探索与全局搜索」。CoT 是线性的，而 ToT 是树状的。  
工作模式：模型在每一步会生成多个思维分支（候选方案）；通过自评价（Self-evaluation）给每个分支打分；配合搜索算法（如广度优先搜索 BFS 或深度优先搜索 DFS）寻找最优路径；如果发现某条路径行不通，可以回溯（Backtrack）。  
特点：适用于需要前瞻性或全局最优解的复杂任务（如创意写作、策略游戏、数学难题）。

### 2. 记忆 (Memory)：突破上下文限制

**短期记忆**

- 依赖 **Context Window**。
- 优化：滑动窗口（保留近 N 轮）、摘要压缩 (Summarization)。

**长期记忆 (RAG)**

- **流程**：Chunking → Embedding → Vector DB → Retrieval → Generation  
- **高阶优化**：  
  - **Hybrid Search**：向量 + 关键词  
  - **Re-rank**：重排序提升召回精度  
  - **GraphRAG**：引入知识图谱，做复杂关联推理  

### 3. 工具调用 (Tool Use) 与 MCP 协议

**Function Calling**

- LLM 输出结构化 JSON，由宿主环境执行并回传结果。

**MCP (Model Context Protocol)**

- **提出方**：Anthropic  
- **目标**：统一 Agent 接入数据源（GitHub、Slack、DB 等）的标准  
- **价值**：工具提供方 (Server) 与调用方 (Client) 解耦，实现「一次编写，到处连接」

---

## 三、工程化框架：LangChain 与 LangGraph

| 维度 | LangChain | LangGraph |
| ---- | --------- | --------- |
| **定位** | 原子化封装，AI 界的「瑞士军刀」 | 复杂逻辑中控，有向图编排 |
| **适用** | 快速原型、线性流程 | 多步推理、循环、分支 |
| **抽象** | Chain / 文档加载器 / 模型封装 | Graph：节点 (Node) + 边 (Edge) + 状态 (State) |
| **循环** | 需自行拼装，易臃肿 | 原生支持 ReAct 等循环 |
| **持久化** | — | Checkpoints、断点恢复、Human-in-the-loop |

**LangGraph 要点**

- **状态 (State)**：全局共享，节点改状态，边决定流向  
- **Persistence**：支持会话中断恢复与人工审批节点  

---

## 四、Prompt 工程：Agent 的「操作系统指令」

- **System Prompt**：定义角色、边界、响应格式（如强制 JSON）  
- **Few-shot / Zero-shot**：用少量示例教会模型特定工具调用范式  
- **提示词注入防御**：在 Prompt 里划清「系统区」与「用户区」，避免用户指令覆盖核心设定  

---

## 五、高频面试挑战 Q&A

| 场景 | 对策 (Key Tactics) |
| ---- | ------------------ |
| **Agent 幻觉 / 乱调工具** | JSON Schema 校验；Few-shot 示例；强模型做规划（如 GPT-4o）、轻量模型做执行 |
| **任务死循环** | 设 `max_iterations`；监控 Action 历史，重复参数时触发反思并终止 |
| **响应延迟高** | 并行调用不相关工具；流式输出中间 Thought 提升体感 |
| **多 Agent 如何分工** | 层级架构 (Hierarchical)：Leader 负责拆解与质检，多个 Worker 负责垂直领域执行 |

---

## 六、总结陈述：如何体现资深感

> 「开发 Agent 的核心不在于调用 LLM，而在于构建一套**鲁棒的控制系统**。用确定的工程手段（LangGraph 状态机、MCP 协议、RAG 多级检索）去对冲大模型输出的不确定性，在业务里实现**可预测、可追踪**的智能闭环。」



# 面试准备 · 资料速查

> 前端 AI 对话 / 流式场景常见考点速查，便于面试前快速过一遍。

**目录**

| 主题 | 要点 |
| ---- | ---- |
| [SSE 主动终止](#sse-在前端如何主动终止) | EventSource.close / AbortController |
| [自动滚动到底部](#处理-ai-长消息如何实现自动滚动到底部) | 锚点、scrollTop、Smart Scroll、节流 |
| [流式输出](#ai-场景中如何实现流式输出) | SSE 选型、后端头与格式、fetch+ReadableStream |
| [Markdown 渲染](#大模型返回的-markdown含代码块与公式前端如何渲染) | Remark/Rehype、Shiki、KaTeX、流式优化 |
| [打字机效果](#如何实现打字机效果) | 光标 CSS、队列平滑、双缓冲、A11y |
| [万级 Token 对话](#如何处理万级-token-的超长对话) | 虚拟列表、IndexedDB、Token 估算 |
| [打断与多轮一致性](#如何实现打断与多轮对话的一致性) | AbortController、messageId 幂等、原子更新 |
| [断点续传](#流式连接断开后的断点续传) | Last-Event-ID、resume_from、Redis/Seed |

---

## SSE 在前端如何主动终止

### 1. 使用原生 EventSource API

若使用浏览器自带的 `EventSource`，直接调用实例的 `.close()` 方法即可。

```javascript
const source = new EventSource('/api/stream');
source.close(); // 主动关闭连接
```

### 2. 使用 fetch + AbortController

若使用 `fetch` 拉流，通过 `AbortController` 取消请求：将 `signal` 传入 `fetch`，需要终止时调用 `controller.abort()`。

```javascript
const controller = new AbortController();
const response = await fetch('/api/stream', {
    signal: controller.signal,
    headers: { 'Accept': 'text/event-stream' }
});
// 需要终止时
controller.abort();
```

## 处理 AI 长消息，如何实现自动滚动到底部

### 1. 基础实现：声明式 API 与锚点法

最快速且代码侵入性最小的方式是使用 `scrollIntoView`。

- **实现逻辑**：在消息列表最底部放置一个空 div，如 `<div id="anchor"></div>`。
- **执行时机**：每当 SSE 接收到新字符并渲染到 DOM 后，调用 `anchor.scrollIntoView({ behavior: 'smooth' })`。
- **优点**：简单直接，由浏览器原生处理滚动动画，兼容性良好。

### 2. 深度控制：手动计算 scrollTop

在嵌套滚动或需要精确控制滚动速度等复杂布局中，可采用手动计算位移的方式。

**核心公式：**

$$
scrollTop = scrollHeight - clientHeight
$$

**属性解析：**

| 属性         | 含义                                   |
| ------------ | -------------------------------------- |
| scrollHeight | 容器内容的实际总高度（含溢出未显示部分） |
| clientHeight | 容器可视区域的高度                     |
| scrollTop    | 当前滚动条距离顶部的距离               |

**实现细节**：通过 `container.scrollTop = container.scrollHeight` 强制触底。为平滑体验，可配合 CSS `scroll-behavior: smooth;`，或使用 `window.requestAnimationFrame` 编写自定义缓动算法。

### 3. 核心交互：用户意图识别（Smart Scroll）

这是区分高级开发者的关键点。AI 持续生成时，若用户向上滚动查看历史，强行「吸底」会严重影响体验。

**逻辑**：在执行滚动前，先判断用户是否处于「底部附近」。

```javascript
const threshold = 100; // 判定阈值（像素）
// 计算当前距离底部的剩余距离
const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

// 只有当距离小于阈值时，才认为用户想追踪新消息，执行自动滚动
if (distanceToBottom < threshold) {
    scrollToBottom();
}
```

**效果**：用户一旦手动向上滚动超过 100px，自动滚动暂停；当用户手动拉回底部时，自动滚动恢复。

### 4. 性能与框架优化

AI 输出（如 GPT-4）的速率可能很快，每秒产生几十个 chunk。如果每一个 chunk 都触发一次 DOM 滚动，会导致严重的重排（Reflow）和浏览器掉帧。

- **节流/防抖（Throttling）**：不在每个 chunk 到达时都滚动，而是用 `requestAnimationFrame` 将滚动限制在浏览器刷新频率内。
- **React/Vue 生命周期**：数据驱动 DOM 有延迟，应在 `updated` 钩子或 `useLayoutEffect` 中执行滚动，或用 `MutationObserver` 监听容器高度变化再触发滚动，确保拿到最新的 `scrollHeight`。
- **分批渲染**：如果 chunk 频率极高，可以考虑做一个微小的缓冲区，每 50ms-100ms 批量更新一次 DOM 并触发一次滚动。

## AI 场景中，如何实现流式输出？

可从 **技术选型、后端实现、前端解析、异常处理** 四方面回答。

### 1. 技术选型：为什么选 SSE？

AI 场景（如 ChatGPT）最常用的是 **SSE（Server-Sent Events）**。

| 对比对象       | 说明 |
| -------------- | ---- |
| **WebSocket**  | 全双工、协议较重；AI 多为「单次请求 → 单向流」，SSE 更轻量，基于 HTTP，支持自动重连。 |
| **Fetch Chunk**| 原生 fetch + ReadableStream 也能实现，但 SSE 有标准事件格式，更易维护。 |

### 2. 后端实现要点

需设置流式响应头并采用约定数据格式。

**响应头示例：**

- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`（禁用缓存，保证实时）
- `Connection: keep-alive`

**数据格式**：以 `data:` 开头，以 `\n\n` 结尾。示例：

```text
data: {"content": "你"}
data: {"content": "好"}
data: [DONE]
```

### 3. 前端解析逻辑

**方式 A：原生 EventSource（仅 GET、无自定义 Header）**

```javascript
const source = new EventSource('/api/chat');
source.onmessage = (event) => {
  const data = JSON.parse(event.data);
  appendMessage(data.content);
};
```

**方式 B：fetch + ReadableStream（主流，支持 POST / 自定义 Header）**

1. 发 POST 请求，取 `response.body`（ReadableStream）。
2. 用 `getReader()` 循环读取分片，`TextDecoder` 转字符串。
3. 按 SSE 格式解析每个 `data:` 行并更新 UI。

```javascript
const response = await fetch('/api/chat', { method: 'POST', body: ... });
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // 解析 chunk 中多个 data: 行并处理
}
```

### 4. 关键细节与优化

- **数据拼接**：一个 JSON 可能被拆成多个 chunk，需维护缓冲区（Buffer），拼完整再解析。
- **Markdown 实时渲染**：用 markdown-it / marked 等，流式更新内容，并配合前文的「自动滚动到底部」。
- **连接中断**：监听异常或用户点击「停止生成」，调用 `abortController.abort()` 关闭连接。

**小结**：工程上常用 **fetch + ReadableStream**，在请求灵活性（POST/Header）与流式能力之间平衡最好。


## 大模型返回的 Markdown（含代码块与公式），前端如何渲染？

可从 **渲染引擎、代码高亮、公式、流式优化** 四方面回答。

### 1. Markdown 解析引擎

**推荐：Remark + Rehype 生态**（Notion、GitHub 等常用）

- **Remark**：Markdown 文本 → Markdown AST  
- **Rehype**：Markdown AST → HTML AST → DOM  
- 插件化强，易接代码高亮、公式等。

**轻量替代**：**marked.js** — 解析快、配置简单，适合超长文本。

### 2. 代码块高亮

| 方案 | 特点 |
| ---- | ---- |
| **Prism.js / Highlight.js** | 经典方案，用 CSS 选择器对 `<pre><code>` 染色。 |
| **Shiki** | 使用 VS Code 同款 TextMate 引擎，效果接近编辑器，支持 Token 级语义高亮；Vercel 等产品常用。 |

### 3. 数学公式（LaTeX）

AI 常返回 `$...$` 或 `$$...$$` 形式的 LaTeX。

- **KaTeX（首选）**：Web 端渲染快，适合流式场景。
- **集成**：配合 `remark-math` + `rehype-katex`，自动识别 `$` 并转成 KaTeX DOM。

### 4. AI 流式场景的优化（加分项）

**A. 增量渲染与防抖**

- 不必每来一个字符就整树重渲染。
- 用 `requestAnimationFrame` 或短时间阈值节流。
- 仅在收到换行、反引号、`$` 或达到一定字数时触发一次完整 Markdown 重绘。

**B. 未闭合标签**

- 流式时代码块（\`\`\`）和公式（`$`）可能未闭合，导致解析错误、样式错乱。
- **对策**：解析前检查 Buffer，对未闭合的代码块/公式在末尾临时补全闭合符再交给解析器。

**C. 代码块 UI**

- 一键复制、语言标签、横向滚动，避免长代码撑破布局。

**小结**：常用组合 **Remark + Rehype + Shiki + KaTeX**，重点做好流式下的标签补全与高频渲染的节流。


## 如何实现「打字机」效果

分两类：**模拟字符匀速出现** 与 **流式数据 + 光标** 的平滑体验。

### 1. 基础：CSS 模拟光标

在最新文本后加一个闪烁光标，常用伪元素实现：

```css
.typing-effect::after {
  content: '|';
  display: inline-block;
  margin-left: 2px;
  color: #007bff;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```

### 2. 流式数据下的平滑：缓冲区队列

Chunk 到达不均匀，直接渲染会忽快忽慢。用 **生产者-消费者队列** 抹平：

- **生产者**：SSE 收到的字符串拆成字符入队。
- **消费者**：用 `setInterval` 或 `requestAnimationFrame` 按固定频率取字符并渲染；可根据队列长度动态调整速度（堆积多则加快）。

```javascript
let queue = [];
let displayDOM = document.getElementById('output');

function onMessageReceived(chunk) {
  queue.push(...chunk.split(''));
}

function startTyping() {
  if (queue.length > 0) {
    const char = queue.shift();
    displayDOM.innerText += char;
    scrollToBottom();
  }
  const speed = queue.length > 10 ? 20 : 50;
  setTimeout(startTyping, speed);
}
```

### 3. 与 Markdown 渲染的配合

逐字插入会拆散标签（如 `**重点**` 在打字中变成 `*` → `**` → `**重`），解析会反复出错。

**推荐：双缓冲 + 截断重渲染**

- 内存中维护**完整**的原始 Markdown 字符串。
- 每打出若干字符后，对**当前截断字符串**交给 Markdown 引擎重新解析一次（虚拟 DOM / 增量更新）。
- 解析前对未闭合的 \`\`\`、`**` 等做补全（同前文）。

### 4. 交互与体验（加分项）

- **自动加速**：队列堆积时缩短 `setTimeout` 间隔，避免 UI 严重落后于数据。
- **静默输出**：用户切到后台或上滑看历史时，可取消动画，一次性渲染已收内容，省性能。
- **无障碍**：使用 `aria-live="polite"`，让读屏在内容更新时适时提示。

**小结**：核心是「平滑度」与「格式完整」的权衡；用队列抹平网络波动，用标签补全保证渲染不崩。

## 如何处理「万级」Token 的超长对话

### 1. 渲染：虚拟列表（Virtual List）

对话条数多时，全量渲染会导致 DOM 过多、滚动卡顿、输入延迟。

- **方案**：虚拟滚动（如 react-window、vue-virtual-scroller），只渲染可视区消息，上下用占位（Offset）撑开。
- **难点**：AI 消息高度不固定。
- **应对**：动态高度缓存——首屏渲染后记录每条高度，滚动时更新偏移，保证滚动条顺滑。

### 2. 解析：分片与懒解析

Markdown（尤其含大量 LaTeX、Mermaid）解析耗 CPU。

- **分片**：不要每次 SSE 来一个字符就重解析整段万级 Token。
- **按需**：
  - 历史消息解析结果做缓存（Memoize）。
  - 超长代码块「点击展开」或「进入视口再高亮」，避免首屏一次性算完。

### 3. 数据与内存

- **数据裁剪**：区分「展示用 messages」和「上下文用 messages」，前端不必全量持有一份。
- **持久化**：万级 Token 不推荐全放内存（Redux/Vuex）；历史存 **IndexedDB**，内存只保留最近约 20 条，上滑时再异步拉取并填入虚拟列表。
- **GC**：流式结束后释放解析过程中的临时 Buffer，避免长时间占用。

### 4. 上下文与 Token 统计

大模型有上下文窗口上限，前端需配合后端管理。

- **Token 估算**：集成 tiktoken 等轻量库，发送前估算 Token 数。
- **自动总结**：接近阈值时提醒或触发总结；用 UI 分割线标明「以下内容已不在当前上下文」。

### 5. 交互（加分项）

- **快速定位**：「跳转到最新」「按日期/关键词搜索」，避免在万条消息里手动滚。
- **骨架屏**：从 IndexedDB 加载历史时用骨架占位，减少 Layout Shift。

**小结**：**分而治之**——DOM 靠虚拟化，存储靠 IndexedDB，计算靠缓存与节流，即使数万 Token 也能尽量保持 60fps。

## 如何实现「打断」与「多轮对话」的一致性

### 1. 物理打断：请求控制

真正打断 = 前端主动断开 HTTP + 后端停止计算。

- **手段**：`AbortController` — 创建实例，将 `controller.signal` 传给 `fetch`，用户点「停止」时调用 `controller.abort()`。
- **副作用**：在 `catch` 里识别 `AbortError`，仅更新 UI（如「已停止」），不弹出通用错误提示。

### 2. 逻辑打断：防竞态

用户快速连发两条，或第一条未生成完就点「重新生成」，可能出现两路流同时写 UI 的「串词」。

- **唯一请求锁**：维护 `currentRequest`，每次新请求前先 `abort()` 掉上一次。
- **幂等校验**：每轮对话一个 `messageId`；在 `reader.read()` 循环里，写 DOM 前检查当前 `messageId` 是否仍为当前轮，否则 `break` 并丢弃该流数据。

### 3. 多轮内容一致

- **原子化更新**：流式过程中不要边收边改全局 `history`；用临时变量（如 `streamingContent`）展示，等流结束（`done: true`）或用户停止后，再把**最终完整内容**写入 `history`。
- **残缺回复**：用户中途打断时，可选择「舍弃」或「保留现状」进上下文（后者便于追问）。

### 4. UI 状态同步

打断后要重置 UI 状态。

- **状态机**：`idle` | `loading` | `streaming` | `error`；打断时强制回到 `idle`。
- **表现**：「停止」按钮恢复为「发送/重新生成」，去掉打字机光标等。

**小结**：上行靠 AbortController，下行靠 messageId 幂等，状态靠原子化更新。

## 流式连接断开后的「断点续传」

### 1. 协议层：SSE 的 Last-Event-ID

SSE 自带简单重连机制。

- **原理**：服务端每条 `data` 可带 `id`；浏览器会记下最后收到的 `id`，断线重连时请求头自动带 `Last-Event-ID: <上次的 id>`。
- **局限**：原生 `EventSource` 只支持 GET；AI 场景多为 POST + 长上下文，往往需自建续传逻辑。

### 2. 工程方案：基于「已接收位移」的补发

**思路**：前端记进度，后端支持从某偏移量继续推流。

- **进度**：前端维护 `receivedCharsCount`（本轮已收字符数）。
- **断线**：在 `reader.read()` 中捕获异常断开（非正常 `done: true`）。
- **续传**：重发请求，body 里带 `resume_from: receivedCharsCount`；后端从缓存中取该会话已生成内容，截掉前 N 字符，从断点继续推流。

### 3. 后端状态（关键）

续传前提是后端能回溯「之前生成了什么」。

| 方案 | 说明 |
| ---- | ---- |
| **Redis 缓存** | 把当前回复暂存 Redis（短 TTL，如 5 分钟），续传时按 sessionId 取回并截断后继续推。 |
| **确定性 seed** | 若模型支持 seed，前端记下初始 seed；重连时带相同 seed + resume_from，后端重算但输出一致，前端丢弃 offset 之前的部分即可。 |

### 4. 前端体验

- **无感拼接**：续传后的首 chunk 紧接在旧内容末尾，无换行/重复。
- **状态**：重连期间保持「生成中」（如光标闪烁），不显示「连接中断」。
- **重试**：最大重试次数（如 3 次）+ 退避（Exponential Backoff），避免网络瘫痪时死循环。

### 5. 加分项：上下文丢失时

若后端宕机、缓存丢失无法续传：

- 退而求其次：**自动触发重新生成**；
- UI 上保留已收到的残缺内容，并提示：「网络中断，已自动尝试重新生成」，比白屏或粗暴报错更友好。

**小结**：简单重连用 Last-Event-ID；POST 流式用「进度 + Offset」；核心是「进度标记」与「后端可回溯」。
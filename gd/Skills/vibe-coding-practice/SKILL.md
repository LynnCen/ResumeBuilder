---
name: vibe-coding-practice
description: 按「需求到上线」的 AI 研发流水线协助执行 Vibe Coding 实践。在用户提到需求拉取、Cursor Rules/Command、Figma/浏览器/GitLab MCP、项目级知识库或全流程 AI 开发时使用。
---

# Vibe Coding 实践落地

基于 Cursor 的「需求到上线」AI 增强研发流水线，与简历项目二（稿定设计/花瓣网/AI 社区）中 Vibe Coding 实践落地对应。

## 流水线环节

1. **需求文档拉取与解析**：从需求源（如 GitLab Issue、文档库）拉取需求，解析为结构化任务与验收点。
2. **Cursor Rules / Command**：配置项目规范（Rules）与高频指令（Command），沉淀命名、目录、技术选型等约定。
3. **Figma MCP**：读取设计稿、标注与组件，支撑设计稿解析与页面还原。
4. **浏览器 MCP**：页面校验、联调与自动化检查。
5. **开发与 GitLab MCP**：编码、MR 创建、代码审查、描述生成与发布。
6. **项目级知识库**：维护架构说明、接口约定、最佳实践，供 AI 检索与上下文注入。

## 使用约定

- 需求优先从文档/Issue 拉取并解析，再进入开发。
- 变更或新模块需同步更新 Rules/Command 与知识库。
- MCP 工具链（Figma / 浏览器 / GitLab）按环节串联使用，避免跳过校验。

## 参考

- 简历项目二「Vibe Coding 实践落地」描述（需求拉取与解析、Rules/Command、Figma/浏览器 MCP、GitLab MCP、项目级知识库、可复用协作流程）。

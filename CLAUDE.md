@AGENTS.md

# AI Cafe

AI 群聊模拟器。用户输入人群描述 + 讨论目标，生成 8 个 AI 角色在咖啡厅自由讨论。

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4
- OpenRouter API (AI model gateway)
- reveal.js (report slide deck)
- localStorage (MVP storage)

## Conventions

- 中文注释，英文变量名
- OpenRouter API key 从环境变量 `OPENROUTER_API_KEY` 读取

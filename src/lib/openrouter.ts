// ========== Dual LLM Client ==========
// GPT (OpenAI protocol): 话题生成、人设生成（快、结构化输出好）
// Gemini (Vertex protocol): 聊天对话（流式、thinking）

const OPENAI_API_URL = process.env.OPENAI_API_URL || 'http://routify.alibaba-inc.com/protocol/openai/v1/chat/completions'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || ''
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'claude-haiku-4-5-20251001'

const GEMINI_API_BASE = process.env.LLM_API_URL || 'https://routify.alibaba-inc.com/protocol/vertex/v1beta'
const GEMINI_API_KEY = process.env.LLM_API_KEY || ''
const GEMINI_MODEL = process.env.LLM_MODEL || 'gemini-3-pro-preview'

const THINKING_OVERHEAD = 4096

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GeminiPart {
  text: string
}

interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

interface OpenRouterOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
  json?: boolean
}

// ========== OpenAI Protocol (GPT) ==========

export async function chatCompletion(
  messages: ChatMessage[],
  options: OpenRouterOptions = {}
): Promise<string> {
  const {
    model = OPENAI_MODEL,
    temperature = 0.7,
    maxTokens = 4096,
  } = options

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  }

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

export async function chatCompletionJSON<T>(
  messages: ChatMessage[],
  options: OpenRouterOptions = {}
): Promise<T> {
  const raw = await chatCompletion(messages, {
    ...options,
    temperature: options.temperature ?? 0.8,
  })

  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/)
  const jsonStr = jsonMatch ? jsonMatch[1] : raw

  return JSON.parse(jsonStr)
}

// ========== Gemini Vertex Protocol (Streaming Chat) ==========

function toGeminiContents(messages: ChatMessage[]): { contents: GeminiContent[]; systemInstruction?: { parts: GeminiPart[] } } {
  let systemInstruction: { parts: GeminiPart[] } | undefined
  const contents: GeminiContent[] = []

  for (const msg of messages) {
    if (msg.role === 'system') {
      if (!systemInstruction) {
        systemInstruction = { parts: [{ text: msg.content }] }
      } else {
        systemInstruction.parts.push({ text: msg.content })
      }
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })
    }
  }

  return { contents, systemInstruction }
}

export async function chatCompletionStream(
  messages: ChatMessage[],
  options: OpenRouterOptions = {},
  onToken?: (token: string) => void
): Promise<string> {
  const {
    model = GEMINI_MODEL,
    temperature = 0.7,
    maxTokens = 400,
  } = options

  const { contents, systemInstruction } = toGeminiContents(messages)

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: Math.min(temperature, 2.0),
      maxOutputTokens: maxTokens + THINKING_OVERHEAD,
    },
  }
  if (systemInstruction) body.systemInstruction = systemInstruction

  const url = `${GEMINI_API_BASE}/models/${model}:streamGenerateContent?alt=sse`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': `Bearer ${GEMINI_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const jsonStr = line.slice(6).trim()
      if (!jsonStr || jsonStr === '[DONE]') continue

      try {
        const chunk = JSON.parse(jsonStr)
        const parts = chunk.candidates?.[0]?.content?.parts
        if (parts) {
          for (const part of parts) {
            if (part.text) {
              fullText += part.text
              if (onToken) onToken(part.text)
            }
          }
        }
      } catch {
        // skip unparseable chunks
      }
    }
  }

  return fullText
}

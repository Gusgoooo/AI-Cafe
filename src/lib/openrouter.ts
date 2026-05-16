const API_URL = process.env.LLM_API_URL || 'https://openrouter.ai/api/v1/chat/completions'
const API_KEY = process.env.LLM_API_KEY || ''
const DEFAULT_MODEL = process.env.LLM_MODEL || 'gpt-5.4-2026-03-05'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: OpenRouterOptions = {}
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 4096,
  } = options

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LLM API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

export async function chatCompletionStream(
  messages: ChatMessage[],
  options: OpenRouterOptions = {}
): Promise<ReadableStream<Uint8Array>> {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 2048,
  } = options

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`LLM API error ${res.status}: ${err}`)
  }

  return res.body!
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

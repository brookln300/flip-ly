/**
 * Shared Claude Haiku API client for all AI features.
 * Single function, reused everywhere. Cost-optimized with Haiku 4.5.
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const MODEL = 'claude-haiku-4-5-20251001'

interface ClaudeOptions {
  system: string
  userMessage: string
  maxTokens?: number
}

interface ClaudeResult<T = any> {
  text: string
  parsed: T | null
  inputTokens: number
  outputTokens: number
}

export async function callHaiku<T = any>(options: ClaudeOptions): Promise<ClaudeResult<T>> {
  if (!ANTHROPIC_API_KEY) {
    console.log('[AI] No ANTHROPIC_API_KEY — skipping')
    return { text: '', parsed: null, inputTokens: 0, outputTokens: 0 }
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: options.maxTokens || 1500,
        system: options.system,
        messages: [{ role: 'user', content: options.userMessage }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[AI] API error ${res.status}:`, err.substring(0, 200))
      return { text: '', parsed: null, inputTokens: 0, outputTokens: 0 }
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const inputTokens = data.usage?.input_tokens || 0
    const outputTokens = data.usage?.output_tokens || 0

    // Try to parse as JSON
    let parsed: T | null = null
    try {
      const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(jsonStr)
    } catch {
      // Not JSON — that's fine for text responses
    }

    console.log(`[AI] ${inputTokens}in/${outputTokens}out tokens`)
    return { text, parsed, inputTokens, outputTokens }
  } catch (err: any) {
    console.error('[AI] Call failed:', err.message)
    return { text: '', parsed: null, inputTokens: 0, outputTokens: 0 }
  }
}

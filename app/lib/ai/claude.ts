/**
 * Shared Claude API client for all AI features.
 * Text (Haiku 4.5) + Vision (Sonnet 4.5) — single module, reused everywhere.
 *
 * callHaiku()  — text-only, cost-optimized (~$0.001/call)
 * callVision() — image + text, uses Sonnet for accuracy (~$0.01-0.03/call)
 */

import { readFileSync } from 'fs'
import { extname } from 'path'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const VISION_MODEL = 'claude-sonnet-4-5-20250514'

// ── Shared Types ──────────────────────────────────────────────

interface ClaudeOptions {
  system: string
  userMessage: string
  maxTokens?: number
}

interface VisionOptions {
  system: string
  prompt: string
  /** Base64-encoded image data OR a local file path OR a public URL */
  image: string
  /** Override if not auto-detected (e.g. 'image/png') */
  mediaType?: string
  maxTokens?: number
  /** Use Haiku instead of Sonnet for cheaper vision (lower accuracy) */
  useCheapModel?: boolean
}

interface ClaudeResult<T = any> {
  text: string
  parsed: T | null
  inputTokens: number
  outputTokens: number
  model: string
  estimatedCost: number
}

// ── Helpers ───────────────────────────────────────────────────

function detectMediaType(pathOrUrl: string): string {
  const ext = extname(pathOrUrl).toLowerCase()
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  }
  return types[ext] || 'image/jpeg'
}

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  // Per-million-token rates
  const rates: Record<string, { input: number; output: number }> = {
    [HAIKU_MODEL]: { input: 1, output: 5 },
    [VISION_MODEL]: { input: 3, output: 15 },
  }
  const rate = rates[model] || rates[HAIKU_MODEL]
  return (inputTokens * rate.input + outputTokens * rate.output) / 1_000_000
}

function parseResponse<T>(text: string): T | null {
  try {
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(jsonStr)
  } catch {
    return null
  }
}

// ── Core API Call ─────────────────────────────────────────────

async function callAnthropic(model: string, system: string, messages: any[], maxTokens: number): Promise<ClaudeResult> {
  if (!ANTHROPIC_API_KEY) {
    console.log('[AI] No ANTHROPIC_API_KEY — skipping')
    return { text: '', parsed: null, inputTokens: 0, outputTokens: 0, model, estimatedCost: 0 }
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
    })

    if (!res.ok) {
      const err = await res.text()
      // Parse structured error if possible for clearer logs
      let errorDetail = err.substring(0, 500)
      try {
        const parsed = JSON.parse(err)
        errorDetail = `${parsed.error?.type}: ${parsed.error?.message}`
      } catch {}
      console.error(`[AI] API error ${res.status} (${model}):`, errorDetail)
      return { text: '', parsed: null, inputTokens: 0, outputTokens: 0, model, estimatedCost: 0 }
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const inputTokens = data.usage?.input_tokens || 0
    const outputTokens = data.usage?.output_tokens || 0
    const cost = estimateCost(model, inputTokens, outputTokens)

    console.log(`[AI] ${model.split('-').slice(0, 2).join('-')} | ${inputTokens}in/${outputTokens}out | ~$${cost.toFixed(4)}`)
    return { text, parsed: parseResponse(text), inputTokens, outputTokens, model, estimatedCost: cost }
  } catch (err: any) {
    console.error('[AI] Call failed:', err.message)
    return { text: '', parsed: null, inputTokens: 0, outputTokens: 0, model, estimatedCost: 0 }
  }
}

// ── Public API ────────────────────────────────────────────────

/**
 * Text-only call using Haiku 4.5 (~$0.001/call).
 * Use for: listing enrichment, text analysis, JSON extraction.
 */
export async function callHaiku<T = any>(options: ClaudeOptions): Promise<ClaudeResult<T>> {
  return callAnthropic(
    HAIKU_MODEL,
    options.system,
    [{ role: 'user', content: options.userMessage }],
    options.maxTokens || 1500,
  ) as Promise<ClaudeResult<T>>
}

/**
 * Vision call using Sonnet 4.5 (~$0.01-0.03/call depending on image size).
 * Use for: screenshot analysis, image OCR, listing photo analysis, UI review.
 *
 * Accepts image as:
 *   - Base64 string (raw data)
 *   - Local file path (auto-reads and encodes)
 *   - Public URL (sent directly, no download needed)
 */
export async function callVision<T = any>(options: VisionOptions): Promise<ClaudeResult<T>> {
  const model = options.useCheapModel ? HAIKU_MODEL : VISION_MODEL
  let imageContent: any

  if (options.image.startsWith('http://') || options.image.startsWith('https://')) {
    // URL source — Anthropic fetches it directly
    imageContent = {
      type: 'image',
      source: { type: 'url', url: options.image },
    }
  } else if (options.image.length > 260 || options.image.includes('=')) {
    // Likely base64 data
    imageContent = {
      type: 'image',
      source: {
        type: 'base64',
        media_type: options.mediaType || 'image/jpeg',
        data: options.image,
      },
    }
  } else {
    // Local file path — read and encode
    try {
      const fileData = readFileSync(options.image)
      const base64 = fileData.toString('base64')
      imageContent = {
        type: 'image',
        source: {
          type: 'base64',
          media_type: options.mediaType || detectMediaType(options.image),
          data: base64,
        },
      }
    } catch (err: any) {
      console.error(`[AI] Could not read image file: ${err.message}`)
      return { text: '', parsed: null, inputTokens: 0, outputTokens: 0, model, estimatedCost: 0 }
    }
  }

  const messages = [{
    role: 'user',
    content: [
      imageContent,
      { type: 'text', text: options.prompt },
    ],
  }]

  return callAnthropic(
    model,
    options.system,
    messages,
    options.maxTokens || 1500,
  ) as Promise<ClaudeResult<T>>
}

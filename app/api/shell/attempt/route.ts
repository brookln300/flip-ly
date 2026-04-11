import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { supabase } from '../../../lib/supabase'
import { sendTelegramAlert } from '../../../lib/telegram'
import { getClientIp } from '../../../lib/get-ip'

export const dynamic = 'force-dynamic'

const LEVEL_PASSWORDS: Record<number, string> = {
  1: 'flipdeals',
  2: 'l0bst3r',
  3: 'cl4wgr4b',
  4: 'd33ps34',
  5: 'sh3llg4m3',
  6: 'cr4ck3dc0d3',
}

const LEVEL_PRIZES: Record<number, { title: string; prize: string; message: string }> = {
  1: { title: 'CLEARANCE GRANTED', prize: 'Free flip-ly account', message: 'Welcome aboard, rookie. You figured out what we do. Type "claim" to create your account.' },
  2: { title: 'LEVEL 2 CLEARED', prize: 'Free account + 1 week Pro trial', message: 'You cracked the hex. The Lobster Council nods approvingly.' },
  3: { title: 'LEVEL 3 CLEARED', prize: 'Free account + 2 weeks Pro trial', message: 'Base64 decoded. The Deep Sea Division acknowledges your skill.' },
  4: { title: 'LEVEL 4 CLEARED', prize: 'Free account + 1 month Pro', message: 'Morse code? In 2026? You absolute legend. One month of Pro, on the house.' },
  5: { title: 'LEVEL 5 CLEARED', prize: 'Free account + 3 months Pro', message: 'ROT13 master. Three months of Pro. The Cryptanalysis Unit salutes you.' },
  6: { title: 'LEVEL 6 CLEARED', prize: 'Free account + 6 months Power tier', message: 'You assembled the fragments. Six months of Power tier. The Supreme Lobster Command is impressed.' },
  7: { title: 'THE LOBSTER BOWS', prize: 'Lifetime Power tier + mystery prize', message: 'You cracked the uncrackable. Lifetime Power tier. A physical prize will be shipped to you. The Lobster Council is in shambles.' },
}

function getPartialReveal(password: string, attemptCount: number): string {
  const maxReveals = Math.min(attemptCount, password.length - 2)
  const positions = Array.from({ length: password.length }, (_, i) => i)
  const seed = password.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  for (let i = positions.length - 1; i > 0; i--) {
    const j = (seed * (i + 1) * 7) % (i + 1)
    ;[positions[i], positions[j]] = [positions[j], positions[i]]
  }
  const revealSet = new Set(positions.slice(0, maxReveals))
  return password.split('').map((c, i) => revealSet.has(i) ? c : '_').join(' ')
}

function hashSha256(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agent_name, password, level } = body

    // Validate inputs
    if (!agent_name || typeof agent_name !== 'string' || agent_name.trim().length === 0) {
      return NextResponse.json({ error: 'agent_name is required' }, { status: 400 })
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'password is required' }, { status: 400 })
    }
    if (!level || typeof level !== 'number' || level < 1 || level > 7 || !Number.isInteger(level)) {
      return NextResponse.json({ error: 'level must be an integer between 1 and 7' }, { status: 400 })
    }

    const ip = getClientIp(req)
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const normalizedPassword = password.toLowerCase().trim()
    const sanitizedAgentName = agent_name.trim().substring(0, 50)

    // Rate limit: max 30 attempts per IP per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('fliply_shell_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', oneHourAgo)

    if ((recentCount ?? 0) >= 30) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 30 attempts per hour. Try again later.' },
        { status: 429 }
      )
    }

    // Check password
    let isCorrect = false
    if (level >= 1 && level <= 6) {
      isCorrect = normalizedPassword === LEVEL_PASSWORDS[level]
    } else if (level === 7) {
      const hash = hashSha256(normalizedPassword)
      const envHash = process.env.SHELL_LEVEL7_HASH
      if (envHash) {
        isCorrect = hash === envHash.toLowerCase()
      }
    }

    const result = isCorrect ? 'cleared' : 'denied'

    // Count attempts at this specific level from this IP (for partial reveal)
    const { count: levelAttemptCount } = await supabase
      .from('fliply_shell_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .eq('level_attempted', level)
      .eq('result', 'denied')

    const attemptsAtLevel = (levelAttemptCount ?? 0) + (isCorrect ? 0 : 1)

    // Generate partial reveal for failed attempts (levels 1-6 only)
    let partialReveal: string | null = null
    if (!isCorrect && level >= 1 && level <= 6) {
      partialReveal = getPartialReveal(LEVEL_PASSWORDS[level], attemptsAtLevel)
    }

    // Log attempt to database
    await supabase.from('fliply_shell_attempts').insert({
      agent_name: sanitizedAgentName,
      level_attempted: level,
      password_tried: normalizedPassword,
      result,
      ip_address: ip,
      user_agent: userAgent,
      partial_reveal: partialReveal,
    })

    // Telegram alert for Level 7 clears
    if (isCorrect && level === 7) {
      sendTelegramAlert(
        [
          '<b>LOBSTER PROTOCOL: LEVEL 7 CLEARED</b>',
          `Agent: ${sanitizedAgentName}`,
          `IP: ${ip}`,
          'Someone cracked the uncrackable. Ship the mystery prize.',
        ].join('\n')
      ).catch(() => {})
    }

    if (isCorrect) {
      const prize = LEVEL_PRIZES[level]
      return NextResponse.json({
        result: 'cleared',
        level,
        title: prize.title,
        prize: prize.prize,
        message: prize.message,
      })
    }

    // Count total attempts from this IP
    const { count: totalCount } = await supabase
      .from('fliply_shell_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', ip)

    return NextResponse.json({
      result: 'denied',
      level,
      message: 'ACCESS DENIED',
      partial_reveal: partialReveal,
      attempts_at_level: attemptsAtLevel,
      total_attempts: totalCount ?? 0,
    })
  } catch (err) {
    console.error('[SHELL] Attempt error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

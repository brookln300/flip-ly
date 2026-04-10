import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../../lib/analytics'
import { sendTelegramAlert } from '../../../lib/telegram'
import { getClientIp } from '../../../lib/get-ip'
import { createHash } from 'crypto'
import { verifyProofOfWork } from '../../../lib/proof-of-work'
import {
  isHoneypotTriggered,
  getProgressiveDelay,
  isLikelyBot,
  hashFingerprint,
  sanitizeAgentName,
} from '../../../lib/contest-security'

/**
 * LOBSTER HUNT — Password Verification Engine
 *
 * 7 decoy passwords: each unlocks a unique "almost" prize screen with a gag prize
 * 1 real password: unlocks the true winner screen + lobster dinner
 *
 * The real password is SHA-256 hashed below. Even the boss doesn't know it.
 * It's derived from combining fragments across 3+ encoding types scattered
 * in the site source. No single clue reveals it. No AI paste-job cracks it.
 *
 * Good luck.
 */

function sha256(input: string): string {
  return createHash('sha256').update(input.toLowerCase().trim()).digest('hex')
}

// Winner hash loaded from env var ONLY — never hardcoded
function getWinnerHash(): string {
  if (!process.env.LOBSTER_HUNT_WINNER_HASH) {
    throw new Error('LOBSTER_HUNT_WINNER_HASH environment variable is required')
  }
  return process.env.LOBSTER_HUNT_WINNER_HASH
}

interface DecoyEntry {
  passphrase: string
  tier: number
  title: string
  subtitle: string
  message: string
  prize: string
  emoji: string
  roast: string
}

const DECOYS: DecoyEntry[] = [
  {
    passphrase: 'admin',
    tier: 1,
    title: 'ADMIN? SERIOUSLY?',
    subtitle: 'You tried the factory default.',
    message: "You walked up to the most chaotic website on the internet and typed 'admin'. That's like bringing a butter knife to a lightsaber fight. The Lobster Council has noted your lack of imagination.",
    prize: '🍴 A single fork (plastic, from Wendy\'s, 2019)',
    emoji: '🍴',
    roast: 'Effort Level: router password',
  },
  {
    passphrase: '12345',
    tier: 2,
    title: 'THAT\'S THE COMBINATION ON MY LUGGAGE!',
    subtitle: 'President Skroob would be proud.',
    message: "Congratulations, you've matched the security level of a Spaceballs gag. The air shield is now open. Your dignity has escaped through it.",
    prize: '🐕 A dog comb (gently used, missing 3 teeth)',
    emoji: '🧳',
    roast: 'Effort Level: Spaceballs',
  },
  {
    passphrase: 'lobster',
    tier: 3,
    title: 'YOU TYPED... LOBSTER.',
    subtitle: 'On the lobster website. Bold.',
    message: "The word 'lobster' appears 47 times on this website. In the morse code. In the hex. In the favicon probably. You decoded nothing. You just... typed the mascot's name. That's like going to Disney World and guessing the password is 'Mickey'.",
    prize: '📎 A rubber band (red, slightly stretched)',
    emoji: '🦞',
    roast: 'Effort Level: literally just the mascot name',
  },
  {
    passphrase: 'l0bst3r_k1ng',
    tier: 4,
    title: 'THE HEX WARRIOR APPROACHES',
    subtitle: 'You decoded the data-pid. Impressive.',
    message: "OK, real talk — you actually decoded a hex string embedded in a fake Windows 98 title bar attribute. That takes some skill. Or a hex decoder website and 4 seconds. Either way, this is a decoy. The Lobster Council respects your effort but questions your judgment.",
    prize: '🏆 A participation trophy (3 inches tall, says "I TRIED")',
    emoji: '👑',
    roast: 'Effort Level: hex decoder dot com',
  },
  {
    passphrase: 'flipth3l0bst3r',
    tier: 5,
    title: 'THE FOOTER HUNTER',
    subtitle: 'You found the hex in the footer. Respect.',
    message: "You scrolled ALL the way down, inspected the barely-visible footer hex, decoded it, and typed it in. That's genuinely more effort than most people put into their jobs. The Lobster Council is impressed. But you're still wrong. The real password isn't any single decoded string.",
    prize: '🕯️ A slightly used candle (lavender, burned for exactly 11 minutes)',
    emoji: '🔍',
    roast: 'Effort Level: actually read the source code',
  },
  {
    passphrase: 'lobster_hunter',
    tier: 6,
    title: 'THE ASCII ARCHAEOLOGIST',
    subtitle: 'You found the sprite z-index decimal code.',
    message: "76 111 98 115 116 101 114 95 72 117 110 116 101 114. You decoded that. From a CSS comment disguised as a z-index stack notation. You absolute nerd. The Lobster Council would like to offer you a position. Unfortunately, all positions are unpaid and require wearing a lobster costume.",
    prize: '🚬 An actual cigar (unlit, from a 2003 wedding, still in cellophane)',
    emoji: '🏛️',
    roast: 'Effort Level: ASCII table memorization',
  },
  {
    passphrase: 'notalamp',
    tier: 7,
    title: 'THE NATO PHONETIC SAVANT',
    subtitle: 'november-oscar-tango-alpha-lima-alpha-mike-papa.',
    message: "You decoded the NATO phonetic alphabet hidden in a fake data-render-order attribute, sorted the entries by their numeric values, and extracted the message. That is EXTREMELY specific nerd behavior and we are HERE for it. But the real password isn't a single decoded phrase. It's a combination. The breadcrumbs lead somewhere deeper.",
    prize: '💡 A lamp (broken, from the Forbidden Lamp Database, definitely cursed)',
    emoji: '🔤',
    roast: 'Effort Level: military-grade linguistics',
  },
]

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      agent_name, passphrase,
      pow_challenge, pow_nonce, pow_signature, pow_expires,
      website_url,    // Honeypot - should be empty
      fingerprint,
    } = body

    if (!agent_name || !passphrase) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    const cleanName = sanitizeAgentName(agent_name)
    const ip = getClientIp(req)
    const ua = req.headers.get('user-agent') || 'unknown'
    const normalizedPass = passphrase.toLowerCase().trim()

    // LAYER 1: BOT DETECTION
    if (isLikelyBot(ua)) {
      await sleep(5000)
      return NextResponse.json({
        result: 'denied',
        title: '⛔ ACCESS DENIED',
        message: 'The Lobster Council does not recognize this phrase. Try harder.',
      })
    }

    // LAYER 2: HONEYPOT CHECK
    if (isHoneypotTriggered(website_url)) {
      trackEvent('contest_honeypot_caught', { ip, ua })
      await sleep(3000)
      return NextResponse.json({
        result: 'denied',
        title: '⛔ ACCESS DENIED',
        message: 'The Lobster Council does not recognize this phrase. Try harder.',
      })
    }

    // LAYER 3: PROOF OF WORK
    if (!pow_challenge || !pow_nonce || !pow_signature || !pow_expires) {
      return NextResponse.json({
        error: 'Proof of work required. Get a challenge from /api/contest/challenge first.',
      }, { status: 400 })
    }

    const powResult = verifyProofOfWork(pow_challenge, pow_nonce, pow_signature, pow_expires)
    if (!powResult.valid) {
      console.error(`PoW verification failed: ${powResult.error} | challenge_age=${Date.now() - (pow_expires - 5 * 60 * 1000)}ms | expired=${Date.now() > pow_expires}`)
      return NextResponse.json({
        result: 'error',
        title: '⛔ SECURITY CHECK FAILED',
        message: powResult.error || 'Proof of work verification failed.',
      }, { status: 400 })
    }

    // LAYER 4: RATE LIMITING (IP + Fingerprint)
    const deviceHash = fingerprint ? hashFingerprint(fingerprint) : null
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { count: ipAttempts } = await supabase
      .from('fliply_contest_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('attempted_at', oneHourAgo)

    let fpAttempts = 0
    if (deviceHash) {
      const { count } = await supabase
        .from('fliply_contest_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('device_hash', deviceHash)
        .gte('attempted_at', oneHourAgo)
      fpAttempts = count || 0
    }

    const effectiveAttempts = Math.max(ipAttempts || 0, fpAttempts)

    if (effectiveAttempts >= 20) {
      return NextResponse.json({
        result: 'rate_limited',
        message: 'The Lobster Council has noticed excessive attempts from your location. Try again in an hour.',
      }, { status: 429 })
    }

    // LAYER 5: PROGRESSIVE DELAY
    const delay = getProgressiveDelay(effectiveAttempts)
    if (delay > 0) {
      await sleep(delay)
    }

    // Check: is it the REAL password?
    const inputHash = sha256(normalizedPass)
    const winnerHash = getWinnerHash()

    if (inputHash === winnerHash) {
      // 🦞 WE HAVE A WINNER 🦞
      await supabase.from('fliply_contest_attempts').insert({
        agent_name: cleanName,
        passphrase: '[REDACTED-WINNER]',  // Don't store the winning password
        result: 'winner',
        decoy_tier: null,
        ip_address: ip,
        user_agent: ua,
        device_hash: deviceHash,
      })

      await supabase.from('fliply_contest_winners').insert({
        agent_name: cleanName,
        ip_address: ip,
        user_agent: ua,
        device_hash: deviceHash,
      })

      // Telegram ALERT — someone won!
      await sendTelegramAlert([
        '🦞🦞🦞 <b>LOBSTER HUNT WINNER!</b> 🦞🦞🦞',
        '',
        `<b>Agent:</b> ${cleanName}`,
        `<b>Time:</b> ${new Date().toISOString()}`,
        `<b>IP:</b> ${ip}`,
        '',
        'Someone cracked the real password.',
        'The lobster dinner must be delivered.',
        'This is not a drill.',
      ].join('\n'))

      trackEvent('contest_winner', {
        agent_name: cleanName,
      })

      return NextResponse.json({
        result: 'winner',
        title: '🦞 THE LOBSTER BOWS TO YOU.',
        subtitle: 'You actually did it.',
        message: "Out of every hex string, base64 blob, NATO alphabet, morse code, and ASCII decimal scattered across this chaotic fever dream of a website — you found the fragments, understood the pattern, and assembled the real password. The Lobster Council is in shambles. The butler is weeping. Comic Sans is trembling. You didn't just find an easter egg. You found THE easter egg. The one our own boss doesn't know. The one we told Opus-tier AI models would be 'next to impossible.' And yet here you are.",
        prize: '🦞 A REAL LOBSTER DINNER — Delivered to your door. DM @fliplyalert_bot on Telegram with your agent name to claim.',
        note: 'Your name has been added to the Hall of Legends. The Lobster Council will contact you. This is real. We are serious. The lobster dinner is actually happening.',
      })
    }

    // Check: is it a decoy?
    const decoy = DECOYS.find(d => d.passphrase === normalizedPass)

    if (decoy) {
      await supabase.from('fliply_contest_attempts').insert({
        agent_name: cleanName,
        passphrase: normalizedPass,
        result: 'decoy',
        decoy_tier: decoy.tier,
        ip_address: ip,
        user_agent: ua,
        device_hash: deviceHash,
      })

      trackEvent('contest_decoy', {
        agent_name: cleanName,
        tier: decoy.tier,
        passphrase: normalizedPass,
      })

      // Telegram alert for high-tier decoys (someone's getting close)
      if (decoy.tier >= 6) {
        sendTelegramAlert([
          `🦞 <b>High-Tier Decoy Found!</b>`,
          `Agent: ${cleanName}`,
          `Tier: ${decoy.tier}/7 — ${decoy.title}`,
          `IP: ${ip}`,
          `Someone's getting close to the real one...`,
        ].join('\n'))
      }

      return NextResponse.json({
        result: 'decoy',
        ...decoy,
      })
    }

    // Not a recognized password at all
    await supabase.from('fliply_contest_attempts').insert({
      agent_name: cleanName,
      passphrase: normalizedPass.substring(0, 100), // truncate for safety
      result: 'denied',
      ip_address: ip,
      user_agent: ua,
      device_hash: deviceHash,
    })

    trackEvent('contest_denied', {
      agent_name: cleanName,
    })

    return NextResponse.json({
      result: 'denied',
      title: '⛔ ACCESS DENIED',
      message: "That's not even close. The Lobster Council has noted your attempt. The butler has been notified. Your IP has been forwarded to the Forbidden Lamp Database. Try harder. Or smarter. Preferably both.",
    })
  } catch (err: any) {
    console.error('Contest attempt error:', err)
    return NextResponse.json({ error: 'Contest system error' }, { status: 500 })
  }
}

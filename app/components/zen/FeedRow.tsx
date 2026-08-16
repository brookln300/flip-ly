'use client'

import { useState } from 'react'
import { useSignup } from '../SignupContext'
import {
  DealListing,
  fmtEstRange,
  parseClaim,
  sourceShort,
  timeAgoShort,
} from '../radar/types'

/**
 * One deal, one line — the craigslist-density row used by the home feed
 * and the /radar deep view:
 *
 *   [92] FREE teak credenza — est $250–450 · plano · fb · 14m · [reply] [claim] [open]
 *
 * [reply] copies the suggested reply, [claim] races the family for the
 * find (POST /api/hub/claim), [open] jumps to the original listing.
 * Optional verdict handlers ([good]/[bad]) feed the scorer's calibration
 * on the deep view.
 */
type ClaimState = { name: string; beaten?: boolean } | null

export default function FeedRow({
  listing: l,
  canClaim = true,
  verdict,
  onVerdict,
}: {
  listing: DealListing
  canClaim?: boolean
  verdict?: number
  onVerdict?: (value: 1 | -1) => void
}) {
  const { openSignup } = useSignup()
  const [copied, setCopied] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const serverClaim = l.status === 'claimed' ? parseClaim(l.reasoning) : null
  const [claim, setClaim] = useState<ClaimState>(serverClaim ? { name: serverClaim.name } : null)

  const copyReply = () => {
    if (!l.suggested_reply) return
    navigator.clipboard
      .writeText(l.suggested_reply)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      })
      .catch(() => {})
  }

  const doClaim = async () => {
    if (claiming || claim) return
    setClaiming(true)
    try {
      const res = await fetch('/api/hub/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: l.id }),
      })
      if (res.status === 401) {
        openSignup()
        return
      }
      const j = await res.json().catch(() => ({}))
      if (res.ok) setClaim({ name: j.claimed_by || 'you' })
      else if (res.status === 409) setClaim({ name: j.claimed_by || 'someone', beaten: true })
    } catch {
      /* leave the row as-is */
    } finally {
      setClaiming(false)
    }
  }

  const score = l.score
  const scoreCls =
    score != null && score >= 65
      ? 'border-zen-accent/30 bg-zen-accent/10 text-zen-accent'
      : 'border-zen-line text-zen-muted'
  const price =
    l.is_free ? null : l.price_listed != null ? `$${Math.round(l.price_listed).toLocaleString('en-US')}` : null
  const est = fmtEstRange(l)
  const bracket = 'shrink-0 text-[12px] text-zen-muted transition-colors hover:text-zen-accent'

  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 border-b border-zen-line px-3 py-1.5 last:border-b-0">
      <span className={`inline-block w-8 shrink-0 border text-center font-data text-[11.5px] leading-[18px] ${scoreCls}`}>
        {score ?? '–'}
      </span>
      {l.is_free && <span className="shrink-0 text-[13px] font-semibold text-zen-accent">FREE</span>}
      {price && <span className="shrink-0 font-data text-[13px] text-zen-text">{price}</span>}
      {l.external_url ? (
        <a
          href={l.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 text-[13.5px] text-zen-text underline decoration-zen-line underline-offset-2 hover:text-zen-accent hover:decoration-zen-accent"
        >
          {l.title || 'untitled listing'}
        </a>
      ) : (
        <span className="min-w-0 text-[13.5px] text-zen-text">{l.title || 'untitled listing'}</span>
      )}
      <span className="text-[12px] text-zen-muted">
        {est && <>— est <span className="font-data">{est}</span></>}
        {l.location_text && <> · {l.location_text}</>}
        {' · '}{sourceShort(l.source)}
        {' · '}{timeAgoShort(l.posted_at || l.ingested_at)}
      </span>

      <span className="ml-auto flex shrink-0 items-baseline gap-1.5 pl-2">
        {claim ? (
          <span className="text-[12px] text-zen-muted" title={claim.beaten ? 'beat you to it' : undefined}>
            ✋ claimed by <span className="text-zen-text">{claim.name}</span>
            {claim.beaten && <span> — beat you to it</span>}
          </span>
        ) : (
          <>
            {l.suggested_reply && (
              <button onClick={copyReply} className={copied ? 'shrink-0 text-[12px] text-zen-accent' : bracket}>
                {copied ? '[copied]' : '[reply]'}
              </button>
            )}
            {canClaim && (
              <button onClick={doClaim} disabled={claiming} className={bracket}>
                {claiming ? '[…]' : '[claim]'}
              </button>
            )}
            {l.external_url && (
              <a href={l.external_url} target="_blank" rel="noopener noreferrer" className={`${bracket} no-underline`}>
                [open]
              </a>
            )}
            {onVerdict && (
              <>
                <button
                  onClick={() => onVerdict(1)}
                  aria-pressed={verdict === 1}
                  className={verdict === 1 ? 'shrink-0 text-[12px] text-zen-accent' : bracket}
                >
                  [good]
                </button>
                <button
                  onClick={() => onVerdict(-1)}
                  aria-pressed={verdict === -1}
                  className={verdict === -1 ? 'shrink-0 text-[12px] text-red-400' : `${bracket} hover:text-red-400`}
                >
                  [bad]
                </button>
              </>
            )}
          </>
        )}
      </span>
    </div>
  )
}

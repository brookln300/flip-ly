'use client'

import { useState } from 'react'
import { useSignup } from '../SignupContext'
import {
  DealListing,
  extractAddress,
  fmtEstRange,
  fmtPostTime,
  mapsUrl,
  milesFromHome,
  parseClaim,
  sourceLabel,
  stripClaim,
  timeAgoShort,
} from '../radar/types'

/**
 * One deal, one post — X.com-style card in zen monochrome, used by the
 * home feed and the /radar deep view:
 *
 *   [72]  FB group · McKinney · 🚗 4.2 mi           10:42 pm · Aug 16
 *         FREE Radio flyer wagon — est $40–80
 *         [reply] [claim] [map] [open]           [👍 good] [👎 pass]
 *
 * Soft-clicking anywhere on the card (not a link/button) expands the
 * detail panel: everything the pipeline grabbed — full post text, the
 * scorer's reasoning, detected address, exact timestamps, the drafted
 * reply. [map] opens Google-Maps directions from home; the byline shows
 * straight-line distance when the pipeline geocoded the post. A 🚫 gone
 * badge appears once the bot's watch loop spots a gone/pending marker.
 * Every row takes 👍/👎 feedback plus an optional "teach the scorer" note.
 */
type ClaimState = { name: string; beaten?: boolean } | null

export default function FeedRow({
  listing: l,
  canClaim = true,
  verdict: verdictProp,
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
  const [localVerdict, setLocalVerdict] = useState<number | null>(l.outcome_feedback ?? null)
  const [askNote, setAskNote] = useState(false)
  const [note, setNote] = useState('')
  const [noteState, setNoteState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showDetails, setShowDetails] = useState(false)
  const [imgDead, setImgDead] = useState(false)

  const verdict = onVerdict ? verdictProp : localVerdict
  const reasoning = stripClaim(l.reasoning)
  const miles = milesFromHome(l)
  const map = mapsUrl(l)
  const address = extractAddress(l)
  const gone = !!l.gone_at

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

  const sendVerdict = async (value: 1 | -1) => {
    if (onVerdict) {
      onVerdict(value)
      setAskNote(true)
      return
    }
    const next = localVerdict === value ? 0 : value
    setLocalVerdict(next === 0 ? null : next)
    setAskNote(next !== 0)
    try {
      const res = await fetch('/api/hub/radar-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: l.id, value: next }),
      })
      if (res.status === 401) {
        setLocalVerdict(l.outcome_feedback ?? null)
        setAskNote(false)
        openSignup()
      }
    } catch {
      setLocalVerdict(l.outcome_feedback ?? null)
    }
  }

  const sendNote = async () => {
    const t = note.trim()
    if (!t || noteState === 'saving') return
    setNoteState('saving')
    try {
      const res = await fetch('/api/hub/radar-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: l.id, note: t }),
      })
      if (res.status === 401) {
        setNoteState('idle')
        openSignup()
        return
      }
      if (res.ok) {
        setNoteState('saved')
        setTimeout(() => setAskNote(false), 1600)
      } else setNoteState('idle')
    } catch {
      setNoteState('idle')
    }
  }

  const softClick = (e: React.MouseEvent) => {
    const el = e.target as HTMLElement
    if (el.closest('a,button,input')) return
    setShowDetails(d => !d)
  }

  const score = l.score
  const scoreCls =
    score != null && score >= 65
      ? 'border-zen-accent/30 bg-zen-accent/10 text-zen-accent'
      : 'border-zen-line text-zen-muted'
  const price =
    l.is_free ? null : l.price_listed != null ? `$${Math.round(l.price_listed).toLocaleString('en-US')}` : null
  const est = fmtEstRange(l)
  const when = l.posted_at || l.ingested_at
  const bracket = 'shrink-0 text-[12px] text-zen-muted transition-colors hover:text-zen-accent'

  return (
    <div
      onClick={softClick}
      className={`cursor-pointer border-b border-zen-line px-3 py-2 last:border-b-0 ${gone ? 'opacity-60' : ''}`}
      title={showDetails ? undefined : 'click for details'}
    >
      <div className="flex gap-2.5">
        <span
          className={`mt-0.5 inline-block h-[20px] w-8 shrink-0 border text-center font-data text-[11.5px] leading-[18px] ${scoreCls}`}
          title="deal score 0–100"
        >
          {score ?? '–'}
        </span>

        <div className="min-w-0 flex-1">
          {/* byline: source · location · distance · gone?      exact time */}
          <div className="flex items-baseline gap-x-1.5 text-[12px] text-zen-muted">
            <span className="shrink-0 font-semibold text-zen-text/80">{sourceLabel(l.source)}</span>
            {l.location_text && <span className="truncate">· {l.location_text}</span>}
            {miles != null && (
              <span className="shrink-0" title="straight-line distance from home">
                · 🚗 <span className="font-data">{miles} mi</span>
              </span>
            )}
            {gone && (
              <span className="shrink-0 font-semibold text-red-400" title={`marked gone ${timeAgoShort(l.gone_at)} ago`}>
                · 🚫 gone
              </span>
            )}
            <span
              className="ml-auto shrink-0 pl-2 font-data text-[11.5px]"
              title={when ? `${timeAgoShort(when)} ago` : undefined}
            >
              {fmtPostTime(when)}
            </span>
          </div>

          {/* title line */}
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
            {l.is_free && <span className="shrink-0 text-[13px] font-semibold text-zen-accent">FREE</span>}
            {price && <span className="shrink-0 font-data text-[13px] text-zen-text">{price}</span>}
            {l.external_url ? (
              <a
                href={l.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`min-w-0 text-[13.5px] text-zen-text underline decoration-zen-line underline-offset-2 hover:text-zen-accent hover:decoration-zen-accent ${gone ? 'line-through' : ''}`}
              >
                {l.title || 'untitled listing'}
              </a>
            ) : (
              <span className={`min-w-0 text-[13.5px] text-zen-text ${gone ? 'line-through' : ''}`}>
                {l.title || 'untitled listing'}
              </span>
            )}
            {est && (
              <span className="text-[12px] text-zen-muted">
                — est <span className="font-data">{est}</span>
              </span>
            )}
          </div>

          {/* detail panel — everything the pipeline grabbed */}
          {showDetails && (
            <div className="mt-1.5 space-y-1.5 border-l-2 border-zen-line pl-2.5 text-[12.5px] leading-snug">
              {l.image_url && !imgDead && (
                <a href={l.external_url || l.image_url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.image_url}
                    alt=""
                    onError={() => setImgDead(true)}
                    className="max-h-64 rounded border border-zen-line object-contain"
                  />
                </a>
              )}
              {l.body && (
                <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-zen-text/90">{l.body}</p>
              )}
              {reasoning && (
                <p className="italic text-zen-muted">
                  <span className="not-italic text-zen-text/70">scorer:</span> {reasoning}
                </p>
              )}
              <p className="text-zen-muted">
                {address && <>📍 {address} · </>}
                {l.category && <>{l.category} · </>}
                {l.flip_type && <>{l.flip_type} · </>}
                posted {fmtPostTime(l.posted_at)}{l.ingested_at && <> · seen by radar {fmtPostTime(l.ingested_at)}</>}
                {gone && <> · 🚫 marked gone {fmtPostTime(l.gone_at)}</>}
              </p>
              {l.suggested_reply && (
                <p className="text-zen-muted">
                  ✉️ drafted reply: <span className="text-zen-text/80">“{l.suggested_reply}”</span>
                </p>
              )}
              {!l.body && !reasoning && !address && !l.suggested_reply && (
                <p className="text-zen-muted">no extra details captured for this one — the link’s the best bet.</p>
              )}
            </div>
          )}

          {/* action bar */}
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
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
                {canClaim && !gone && (
                  <button onClick={doClaim} disabled={claiming} className={bracket}>
                    {claiming ? '[…]' : '[claim]'}
                  </button>
                )}
                {map && (
                  <a
                    href={map}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`directions from home${miles != null ? ` · ~${miles} mi straight-line` : ''}`}
                    className={`${bracket} no-underline`}
                  >
                    [map{miles != null ? ` ${miles}mi` : ''}]
                  </a>
                )}
                {l.external_url && (
                  <a href={l.external_url} target="_blank" rel="noopener noreferrer" className={`${bracket} no-underline`}>
                    [open]
                  </a>
                )}
                <button
                  onClick={() => setShowDetails(d => !d)}
                  className={showDetails ? 'shrink-0 text-[12px] text-zen-accent' : bracket}
                >
                  [details]
                </button>
              </>
            )}

            <span className="ml-auto flex shrink-0 items-baseline gap-3">
              <button
                onClick={() => sendVerdict(1)}
                aria-pressed={verdict === 1}
                title="good find — teaches the scorer"
                className={verdict === 1 ? 'shrink-0 text-[12px] text-zen-accent' : bracket}
              >
                {verdict === 1 ? '[👍 good ✓]' : '[👍 good]'}
              </button>
              <button
                onClick={() => sendVerdict(-1)}
                aria-pressed={verdict === -1}
                title="bad call — teaches the scorer"
                className={verdict === -1 ? 'shrink-0 text-[12px] text-red-400' : `${bracket} hover:text-red-400`}
              >
                {verdict === -1 ? '[👎 pass ✓]' : '[👎 pass]'}
              </button>
            </span>
          </div>

          {/* optional reason — the scorer reads these verbatim */}
          {askNote && (
            <div className="mt-1.5 flex items-center gap-2">
              {noteState === 'saved' ? (
                <span className="text-[12px] text-zen-accent">✓ noted — the scorer will learn from that</span>
              ) : (
                <>
                  <input
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendNote()}
                    placeholder="why? e.g. “too far for a wagon” (optional — teaches the scorer)"
                    maxLength={300}
                    className="min-w-0 flex-1 border border-zen-line bg-transparent px-2 py-1 text-[12.5px] text-zen-text outline-none placeholder:text-zen-muted focus:border-zen-accent/50"
                  />
                  <button onClick={sendNote} disabled={!note.trim() || noteState === 'saving'} className={bracket}>
                    {noteState === 'saving' ? '[…]' : '[send]'}
                  </button>
                  <button onClick={() => setAskNote(false)} className={bracket}>
                    [skip]
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* X-style thumbnail — collapses when expanded (big copy shows in details) */}
        {l.image_url && !imgDead && !showDetails && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={l.image_url}
            alt=""
            loading="lazy"
            onError={() => setImgDead(true)}
            className={`mt-0.5 h-16 w-16 shrink-0 rounded border border-zen-line object-cover ${gone ? 'grayscale' : ''}`}
          />
        )}
      </div>
    </div>
  )
}

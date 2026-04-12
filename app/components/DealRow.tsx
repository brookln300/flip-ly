'use client'

import React, { memo } from 'react'
import { Lock } from 'lucide-react'
import { useSignup } from './SignupContext'

const scoreColor = (score: number) => {
  if (score >= 9) return 'var(--score-excellent)'
  if (score >= 7) return 'var(--score-good)'
  if (score >= 5) return 'var(--score-average)'
  return 'var(--score-low)'
}

function DealRow({ deal, i, showExpand, expandedDeal, setExpandedDeal, loggedInUser }: {
  deal: any
  i: number
  showExpand?: boolean
  expandedDeal: number | null
  setExpandedDeal: (v: number | null) => void
  loggedInUser: any
}) {
  const { openSignup, openSourceGate } = useSignup()
  const hasRealScore = deal.deal_score && deal.deal_score !== 'gated'
  const isScoreGated = deal.deal_score === 'gated'
  const hasReason = !!deal.deal_reason
  const canExpand = showExpand && (hasReason || isScoreGated)
  const isEstate = deal.event_type === 'estate_sale'

  const handleTitleClick = (e: React.MouseEvent) => {
    if (deal.source_url) return
    e.preventDefault()
    e.stopPropagation()
    openSourceGate()
  }

  // Format event type for display (only for non-listing types)
  const eventLabel = deal.event_type && deal.event_type !== 'listing'
    ? (deal.event_type as string).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    : null

  return (
    <div>
      <div
        className="deal-row"
        role={canExpand ? 'button' : undefined}
        tabIndex={canExpand ? 0 : undefined}
        onKeyDown={canExpand ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedDeal(expandedDeal === i ? null : i) } } : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 0',
          borderBottom: '1px solid var(--border-subtle)',
          cursor: canExpand ? 'pointer' : 'default',
        }}
        onClick={() => canExpand && setExpandedDeal(expandedDeal === i ? null : i)}
      >
        {/* Score */}
        {hasRealScore ? (
          <div className="deal-score" style={{
            width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
            background: `${scoreColor(deal.deal_score)}15`,
            border: `1px solid ${scoreColor(deal.deal_score)}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
              color: scoreColor(deal.deal_score),
            }}>{deal.deal_score}</span>
          </div>
        ) : isScoreGated ? (
          <div
            className="deal-score"
            onClick={(e) => { e.stopPropagation(); openSignup() }}
            style={{
              width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
              background: 'linear-gradient(135deg, #f0fdf4, #f8f8f8)',
              border: '1px solid rgba(22,163,74,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Sign up free for full scores on every result"
          >
            <Lock size={14} color="var(--accent-green)" strokeWidth={2} />
          </div>
        ) : (
          <div className="deal-score" style={{
            width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>--</span>
          </div>
        )}

        {/* Title + type + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
            {eventLabel && (
              <span style={{
                padding: '1px 6px', fontSize: '9px', fontWeight: 600, borderRadius: '3px',
                letterSpacing: '0.02em', whiteSpace: 'nowrap', flexShrink: 0,
                background: isEstate ? 'rgba(124,58,237,0.08)' : 'var(--bg-surface)',
                color: isEstate ? 'var(--accent-purple)' : 'var(--text-muted)',
                border: `1px solid ${isEstate ? 'rgba(124,58,237,0.12)' : 'var(--border-subtle)'}`,
              }}>
                {eventLabel}
              </span>
            )}
            <span
              onClick={handleTitleClick}
              style={{
                fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                cursor: 'pointer',
              }}
            >
              {deal.source_url ? (
                <a href={deal.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>{deal.title}</a>
              ) : deal.title}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {deal.date && (() => {
              const d = new Date(deal.date + 'T12:00:00')
              if (isNaN(d.getTime())) return null
              const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
              const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
              const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
              const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : diff > 0 && diff <= 6 ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const isSoon = diff === 0 || diff === 1
              return (
                <span style={{
                  fontSize: '11px', fontWeight: 500,
                  color: isSoon ? 'var(--accent-green)' : 'var(--text-muted)',
                }}>
                  {label}{deal.time ? ` · ${deal.time}` : ''}
                </span>
              )
            })()}
            {deal.date && deal.city && <span style={{ color: 'var(--text-dim)' }}>·</span>}
            {deal.city && <span style={{ fontSize: '11px' }}>{deal.city}</span>}
            {deal.posted_at && (() => {
              const posted = new Date(deal.posted_at)
              if (isNaN(posted.getTime())) return null
              const diffMs = Date.now() - posted.getTime()
              const diffMin = Math.floor(diffMs / 60000)
              const diffHr = Math.floor(diffMs / 3600000)
              const diffDay = Math.floor(diffMs / 86400000)
              const label = diffMin < 60 ? `${diffMin}m ago` : diffHr < 24 ? `${diffHr}h ago` : diffDay < 7 ? `${diffDay}d ago` : null
              if (!label) return null
              return (
                <>
                  <span style={{ color: 'var(--text-dim)' }}>·</span>
                  <span style={{ fontSize: '10px', color: diffMin < 120 ? 'var(--accent-green)' : 'var(--text-dim)' }}>
                    {label}
                  </span>
                </>
              )
            })()}
            {/* Pro-only: price context badge */}
            {deal.price_context && deal.price_context.vsMedian < 0 && (
              <>
                <span style={{ color: 'var(--text-dim)' }}>·</span>
                <span style={{
                  fontSize: '10px', fontWeight: 600, color: 'var(--accent-green)',
                  background: 'rgba(22,163,74,0.06)', padding: '1px 5px', borderRadius: '3px',
                  border: '1px solid rgba(22,163,74,0.12)',
                }}>
                  {Math.abs(deal.price_context.vsMedian)}% below typical
                </span>
              </>
            )}
            {/* Pro-only: resale flag */}
            {deal.resale_flag && deal.deal_score >= 7 && (
              <>
                <span style={{ color: 'var(--text-dim)' }}>·</span>
                <span style={{
                  fontSize: '10px', fontWeight: 600, color: 'var(--accent-amber)',
                  background: 'rgba(217,119,6,0.06)', padding: '1px 5px', borderRadius: '3px',
                  border: '1px solid rgba(217,119,6,0.12)',
                }}>
                  Flip potential
                </span>
              </>
            )}
          </div>
        </div>

        {/* Price */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', flexShrink: 0,
          color: deal.price === 'FREE' ? 'var(--accent-green)' : deal.price === 'Not listed' ? 'var(--text-dim)' : 'var(--text-primary)',
        }}>
          {deal.price === 'FREE' ? 'FREE' : deal.price === 'Not listed' ? '--' : deal.price || '--'}
        </div>
      </div>

      {showExpand && expandedDeal === i && hasReason && (
        <div className="deal-expanded" style={{
          padding: '8px 0 12px 48px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>AI insight:</span> {deal.deal_reason}
          </p>
          {!deal.source_url && !loggedInUser && (
            <button onClick={(e) => { e.stopPropagation(); openSignup() }} style={{
              marginTop: '8px', padding: '6px 14px', background: 'var(--accent-green)', color: '#fff',
              border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>
              Sign up free for scores + source links
            </button>
          )}
        </div>
      )}

      {showExpand && expandedDeal === i && isScoreGated && !hasReason && (
        <div style={{
          padding: '10px 0 14px 48px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px' }}>
            AI score and analysis available with a free account.
          </p>
          <button onClick={(e) => { e.stopPropagation(); openSignup() }} style={{
            padding: '6px 14px', background: 'var(--accent-green)', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}>
            Sign up free for full scores and direct links on top deals
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(DealRow)

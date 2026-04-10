'use client'

import React, { memo } from 'react'
import { useSignup } from './SignupContext'

const scoreColor = (score: number) => {
  if (score >= 9) return 'var(--score-excellent)'
  if (score >= 7) return 'var(--score-good)'
  if (score >= 5) return 'var(--score-average)'
  return 'var(--score-low)'
}

const categoryIcon = (title: string) => {
  const t = (title || '').toLowerCase()
  if (/drill|saw|tool|wrench|hammer|milwaukee|dewalt|makita/.test(t)) return '\u{1F527}'
  if (/chair|table|desk|couch|sofa|dresser|shelf|furniture|bookcase/.test(t)) return '\u{1FA91}'
  if (/kitchen|mixer|oven|blender|pot|pan|kitchenaid|instant pot/.test(t)) return '\u{1F373}'
  if (/tv|monitor|speaker|headphone|electronic|laptop|phone|ipad|xbox|playstation/.test(t)) return '\u{1F4FA}'
  if (/vintage|antique|retro|mid.century|mcm/.test(t)) return '\u{1F3FA}'
  if (/bike|bicycle|trek|schwinn/.test(t)) return '\u{1F6B2}'
  if (/free|curb/.test(t)) return '\u{1F193}'
  if (/kid|toy|baby|stroller|crib/.test(t)) return '\u{1F9F8}'
  if (/yard|garden|mower|lawn/.test(t)) return '\u{1F33F}'
  if (/car|auto|truck|motor/.test(t)) return '\u{1F697}'
  return '\u{1F4E6}'
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

  const handleTitleClick = (e: React.MouseEvent) => {
    if (deal.source_url) return
    e.preventDefault()
    e.stopPropagation()
    openSourceGate()
  }

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
        <div className="deal-icon" style={{
          width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0,
          background: 'var(--bg-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px',
        }}>
          {categoryIcon(deal.title)}
        </div>

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
              cursor: 'pointer', position: 'relative',
            }}
            title="Sign up free for full scores on every result"
          >
            <span style={{ fontSize: '14px' }}>🔒</span>
          </div>
        ) : (
          <div className="deal-score" style={{
            width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>--</span>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
            {deal.hot && (
              <span style={{ background: '#fef2f2', color: '#dc2626', padding: '1px 5px', fontSize: '9px', fontWeight: 700, borderRadius: '3px', letterSpacing: '0.04em', flexShrink: 0 }}>HOT</span>
            )}
            {deal.event_type && deal.event_type !== 'listing' && (
              <span style={{
                padding: '1px 6px', fontSize: '9px', fontWeight: 600, borderRadius: '3px',
                letterSpacing: '0.02em', whiteSpace: 'nowrap', flexShrink: 0,
                background: deal.event_type === 'estate_sale' ? 'rgba(168,85,247,0.08)' : deal.event_type === 'garage_sale' ? 'rgba(59,130,246,0.08)' : deal.event_type === 'flea_market' ? 'rgba(236,72,153,0.08)' : deal.event_type === 'moving_sale' ? 'rgba(249,115,22,0.08)' : deal.event_type === 'auction' ? 'rgba(239,68,68,0.08)' : 'rgba(99,102,241,0.08)',
                color: deal.event_type === 'estate_sale' ? '#A855F7' : deal.event_type === 'garage_sale' ? '#3B82F6' : deal.event_type === 'flea_market' ? '#EC4899' : deal.event_type === 'moving_sale' ? '#F97316' : deal.event_type === 'auction' ? '#EF4444' : '#6366F1',
              }}>
                {(deal.event_type || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
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
              const isHot = diff === 0 || diff === 1
              return (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  padding: '1px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 600,
                  background: isHot ? 'rgba(22,163,74,0.08)' : 'var(--bg-surface)',
                  color: isHot ? 'var(--accent-green)' : 'var(--text-muted)',
                  border: `1px solid ${isHot ? 'rgba(22,163,74,0.15)' : 'var(--border-subtle)'}`,
                }}>
                  {label}{deal.time ? ` · ${deal.time}` : ''}
                </span>
              )
            })()}
            {deal.city && <span>{deal.city}</span>}
            <span style={{
              textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px',
              color: 'var(--text-dim)', background: 'var(--bg-surface)',
              padding: '1px 6px', borderRadius: '3px',
            }}>{deal.source}</span>
          </div>
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', flexShrink: 0,
          color: deal.price === 'FREE' ? 'var(--accent-green)' : deal.price === 'Not listed' ? 'var(--text-dim)' : 'var(--text-primary)',
        }}>
          {deal.price === 'FREE' ? 'FREE' : deal.price === 'Not listed' ? '--' : deal.price || '--'}
        </div>
      </div>

      {showExpand && expandedDeal === i && hasReason && (
        <div className="deal-expanded" style={{
          padding: '8px 0 12px 52px',
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
          padding: '10px 0 14px 52px',
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

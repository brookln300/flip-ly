'use client'

import { useState } from 'react'

export default function FeedbackWidget() {
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [feedbackCat, setFeedbackCat] = useState('general')
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)

  return (
    <>
      <button onClick={() => { setShowFeedback(true); setFeedbackSent(false); setFeedbackMsg(''); setFeedbackCat('general') }}
        className="fixed z-[50]" style={{
          bottom: '16px', left: '16px',
          background: 'var(--bg-surface-hover)', border: '1px solid var(--border-active)',
          borderRadius: '8px', padding: '8px 14px', cursor: 'pointer',
          fontSize: '12px', color: 'var(--text-muted)',
        }}>Feedback</button>

      {showFeedback && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4"
          role="dialog" aria-modal="true" aria-label="Send feedback"
          onClick={() => setShowFeedback(false)} style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: '420px',
            background: 'var(--bg-card)', border: '1px solid var(--border-default)',
            borderRadius: '16px', padding: 'var(--space-6)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {feedbackSent ? 'Thanks' : 'Send Feedback'}
              </h4>
              <button onClick={() => setShowFeedback(false)} aria-label="Close dialog" style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '18px' }}>&#10005;</button>
            </div>
            {feedbackSent ? (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Your feedback has been recorded.</p>
                <p style={{ color: 'var(--accent-green)', fontSize: '13px' }}>If we implement your idea, you get a free month of Pro.</p>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault()
                if (!feedbackMsg.trim()) return
                setFeedbackSending(true)
                try {
                  await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: feedbackMsg, category: feedbackCat, page: '/' }),
                  })
                  setFeedbackSent(true)
                } catch {} finally { setFeedbackSending(false) }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <select value={feedbackCat} onChange={e => setFeedbackCat(e.target.value)} className="cl-input" aria-label="Feedback category" style={{ cursor: 'pointer' }}>
                  <option value="general">General</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="source">Source Suggestion</option>
                </select>
                <textarea value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)} placeholder="What would make Flip-ly better?"
                  className="cl-input" rows={4} aria-label="Feedback message" style={{ resize: 'vertical' }} />
                <button type="submit" disabled={feedbackSending || !feedbackMsg.trim()} style={{
                  padding: '10px 24px', fontWeight: 700, fontSize: '14px',
                  background: feedbackSending ? 'var(--border-active)' : 'var(--accent-green)', color: '#fff',
                  border: 'none', borderRadius: '6px',
                  cursor: feedbackSending ? 'wait' : 'pointer',
                }}>{feedbackSending ? 'Sending...' : 'Send Feedback'}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

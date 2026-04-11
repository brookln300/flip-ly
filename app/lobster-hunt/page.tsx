import { supabase } from '../lib/supabase'

export const dynamic = 'force-dynamic'

/* ══════════════════════════════════════════════════════════
   Relative time formatting — computed server-side
   ══════════════════════════════════════════════════════════ */

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  if (diffMs < 0) return 'just now'

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

/* ══════════════════════════════════════════════════════════
   Server-side data fetching
   ══════════════════════════════════════════════════════════ */

async function getLeaderboardData() {
  const [
    uniqueAgentsRes,
    totalAttemptsRes,
    clearsByLevelRes,
    level7ClearsRes,
    recentClearsRes,
    topAgentsRes,
  ] = await Promise.all([
    // 1. Total unique agents
    supabase
      .from('fliply_shell_attempts')
      .select('agent_name'),

    // 2. Total attempts
    supabase
      .from('fliply_shell_attempts')
      .select('id', { count: 'exact', head: true }),

    // 3. Clears by level
    supabase
      .from('fliply_shell_attempts')
      .select('level_attempted')
      .eq('result', 'cleared'),

    // 4. Level 7 clears count
    supabase
      .from('fliply_shell_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('result', 'cleared')
      .eq('level_attempted', 7),

    // 5. Recent clears (last 20)
    supabase
      .from('fliply_shell_attempts')
      .select('agent_name, level_attempted, created_at')
      .eq('result', 'cleared')
      .order('created_at', { ascending: false })
      .limit(20),

    // 6. Top agents — all clears to compute max level per agent
    supabase
      .from('fliply_shell_attempts')
      .select('agent_name, level_attempted, created_at')
      .eq('result', 'cleared')
      .order('created_at', { ascending: true }),
  ])

  // Compute unique agents
  const agentNames = new Set((uniqueAgentsRes.data || []).map((r: any) => r.agent_name))
  const uniqueAgents = agentNames.size

  // Total attempts
  const totalAttempts = totalAttemptsRes.count || 0

  // Clears by level — aggregate
  const clearsByLevelMap: Record<number, number> = {}
  for (const row of clearsByLevelRes.data || []) {
    const lvl = row.level_attempted
    clearsByLevelMap[lvl] = (clearsByLevelMap[lvl] || 0) + 1
  }
  const clearsByLevel = Array.from({ length: 7 }, (_, i) => ({
    level: i + 1,
    clears: clearsByLevelMap[i + 1] || 0,
  }))

  // Level 7 remaining
  const level7Clears = level7ClearsRes.count || 0
  const level7Remaining = Math.max(0, 5 - level7Clears)

  // Recent clears
  const recentClears = (recentClearsRes.data || []).map((r: any) => ({
    agent_name: r.agent_name,
    level: r.level_attempted,
    time_ago: relativeTime(r.created_at),
  }))

  // Top agents — find max cleared level per agent, with earliest clear time at that level
  const agentMap: Record<string, { maxLevel: number; earliestClearAt: string }> = {}
  for (const row of topAgentsRes.data || []) {
    const name = row.agent_name
    const level = row.level_attempted
    const time = row.created_at
    if (!agentMap[name] || level > agentMap[name].maxLevel) {
      agentMap[name] = { maxLevel: level, earliestClearAt: time }
    } else if (level === agentMap[name].maxLevel && time < agentMap[name].earliestClearAt) {
      agentMap[name].earliestClearAt = time
    }
  }
  const topAgents = Object.entries(agentMap)
    .map(([name, data]) => ({
      agent_name: name,
      highest_level: data.maxLevel,
      time_ago: relativeTime(data.earliestClearAt),
    }))
    .sort((a, b) => {
      if (b.highest_level !== a.highest_level) return b.highest_level - a.highest_level
      return 0 // already sorted by earliest clear in the query
    })
    .slice(0, 25)

  // Find max clears for bar chart scaling
  const maxClears = Math.max(...clearsByLevel.map(c => c.clears), 1)

  return {
    uniqueAgents,
    totalAttempts,
    clearsByLevel,
    level7Remaining,
    level7Clears,
    recentClears,
    topAgents,
    maxClears,
  }
}

/* ══════════════════════════════════════════════════════════
   Page Component (Server)
   ══════════════════════════════════════════════════════════ */

export default async function LobsterHuntPage() {
  const data = await getLeaderboardData()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#33ff33',
      fontFamily: 'var(--font-mono), "JetBrains Mono", "SF Mono", "Fira Code", monospace',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* CRT scanline overlay */}
      <style dangerouslySetInnerHTML={{ __html: `
        .crt-overlay {
          pointer-events: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15) 0px,
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 3px
          );
        }
        @keyframes pulse-live {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes flicker {
          0% { opacity: 0.97; }
          5% { opacity: 0.95; }
          10% { opacity: 0.98; }
          15% { opacity: 0.96; }
          20% { opacity: 0.99; }
          100% { opacity: 0.97; }
        }
        .terminal-body {
          animation: flicker 4s infinite;
        }
        .bar-fill {
          transition: width 0.6s ease;
        }
      ` }} />

      <div className="crt-overlay" />

      <div className="terminal-body" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header style={{
          borderBottom: '1px solid #1a3a1a',
          padding: 'var(--space-6, 24px) var(--space-4, 16px)',
        }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <a href="/" style={{
              color: '#33ff33',
              textDecoration: 'none',
              fontSize: '14px',
              letterSpacing: '0.15em',
              fontWeight: 700,
              opacity: 0.7,
            }}>
              FLIP-LY
            </a>
          </div>
        </header>

        {/* Title */}
        <div style={{
          padding: 'var(--space-10, 40px) var(--space-4, 16px) var(--space-6, 24px)',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontSize: 'clamp(20px, 4vw, 32px)',
            fontWeight: 700,
            color: '#33ff33',
            letterSpacing: '0.05em',
            marginBottom: 'var(--space-2, 8px)',
            lineHeight: 1.2,
          }}>
            The Lobster Protocol — Live Leaderboard
          </h1>
          <p style={{
            fontSize: '13px',
            color: '#1a8a1a',
            letterSpacing: '0.08em',
          }}>
            Every attempt is tracked. Every agent is watched.
          </p>
        </div>

        {/* LIVE indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2, 8px)',
          marginBottom: 'var(--space-6, 24px)',
        }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#33ff33',
            animation: 'pulse-live 2s ease-in-out infinite',
            boxShadow: '0 0 6px #33ff33',
          }} />
          <span style={{
            fontSize: '11px',
            color: '#33ff33',
            letterSpacing: '0.2em',
            fontWeight: 700,
          }}>
            LIVE
          </span>
        </div>

        {/* Stats bar */}
        <div style={{
          maxWidth: '960px',
          margin: '0 auto var(--space-8, 32px)',
          padding: '0 var(--space-4, 16px)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-8, 32px)',
            padding: 'var(--space-4, 16px) var(--space-6, 24px)',
            border: '1px solid #1a3a1a',
            borderRadius: '4px',
            background: '#0d120d',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#33ff33' }}>
                {data.uniqueAgents}
              </div>
              <div style={{ fontSize: '10px', color: '#1a8a1a', letterSpacing: '0.15em', marginTop: '2px' }}>
                TOTAL AGENTS
              </div>
            </div>
            <div style={{ width: '1px', background: '#1a3a1a', alignSelf: 'stretch' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#33ff33' }}>
                {data.totalAttempts}
              </div>
              <div style={{ fontSize: '10px', color: '#1a8a1a', letterSpacing: '0.15em', marginTop: '2px' }}>
                TOTAL ATTEMPTS
              </div>
            </div>
            <div style={{ width: '1px', background: '#1a3a1a', alignSelf: 'stretch' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '28px',
                fontWeight: 700,
                color: data.level7Remaining > 0 ? '#33ff33' : '#ff3333',
              }}>
                {data.level7Remaining}/5
              </div>
              <div style={{ fontSize: '10px', color: '#1a8a1a', letterSpacing: '0.15em', marginTop: '2px' }}>
                LEVEL 7 REMAINING
              </div>
            </div>
          </div>
        </div>

        {/* Main content: Two columns */}
        <div style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '0 var(--space-4, 16px)',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'var(--space-6, 24px)',
        }}>
          {/* On desktop, side by side */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
            gap: 'var(--space-6, 24px)',
            alignItems: 'start',
          }}>
            {/* Left: Top Agents */}
            <div style={{
              border: '1px solid #1a3a1a',
              borderRadius: '4px',
              background: '#0d120d',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: 'var(--space-3, 12px) var(--space-4, 16px)',
                borderBottom: '1px solid #1a3a1a',
                background: '#0a100a',
              }}>
                <h2 style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#33ff33',
                  letterSpacing: '0.15em',
                  margin: 0,
                }}>
                  TOP AGENTS
                </h2>
              </div>

              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr 80px 72px',
                padding: '8px 16px',
                fontSize: '10px',
                color: '#1a6a1a',
                letterSpacing: '0.1em',
                borderBottom: '1px solid #1a3a1a',
              }}>
                <span>#</span>
                <span>AGENT</span>
                <span style={{ textAlign: 'center' }}>LEVEL</span>
                <span style={{ textAlign: 'right' }}>TIME</span>
              </div>

              {data.topAgents.length === 0 ? (
                <div style={{
                  padding: 'var(--space-8, 32px) var(--space-4, 16px)',
                  textAlign: 'center',
                  color: '#1a5a1a',
                  fontSize: '12px',
                }}>
                  No agents have cleared any levels yet.
                  <br />
                  <span style={{ color: '#1a3a1a' }}>The terminal awaits its first challenger.</span>
                </div>
              ) : (
                data.topAgents.map((agent, i) => (
                  <div key={agent.agent_name} style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 1fr 80px 72px',
                    padding: '8px 16px',
                    borderBottom: i < data.topAgents.length - 1 ? '1px solid #0f1a0f' : 'none',
                    background: i % 2 === 0 ? 'transparent' : '#0b110b',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      color: i < 3 ? '#33ff33' : '#1a5a1a',
                      fontSize: '12px',
                      fontWeight: i < 3 ? 700 : 400,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{
                      color: agent.highest_level >= 7 ? '#ffcc00' : '#33ff33',
                      fontSize: '13px',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {agent.agent_name}
                      {agent.highest_level >= 7 && (
                        <span style={{
                          marginLeft: '6px',
                          fontSize: '9px',
                          color: '#ffcc00',
                          letterSpacing: '0.1em',
                        }}>
                          DEEP CLAW
                        </span>
                      )}
                    </span>
                    <span style={{
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: agent.highest_level >= 7 ? '#ffcc00'
                           : agent.highest_level >= 5 ? '#33ff33'
                           : agent.highest_level >= 3 ? '#1a8a1a'
                           : '#1a5a1a',
                    }}>
                      L{agent.highest_level}
                    </span>
                    <span style={{
                      textAlign: 'right',
                      fontSize: '11px',
                      color: '#1a5a1a',
                    }}>
                      {agent.time_ago}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Right: Recent Activity */}
            <div style={{
              border: '1px solid #1a3a1a',
              borderRadius: '4px',
              background: '#0d120d',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: 'var(--space-3, 12px) var(--space-4, 16px)',
                borderBottom: '1px solid #1a3a1a',
                background: '#0a100a',
              }}>
                <h2 style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#33ff33',
                  letterSpacing: '0.15em',
                  margin: 0,
                }}>
                  RECENT ACTIVITY
                </h2>
              </div>

              {data.recentClears.length === 0 ? (
                <div style={{
                  padding: 'var(--space-8, 32px) var(--space-4, 16px)',
                  textAlign: 'center',
                  color: '#1a5a1a',
                  fontSize: '12px',
                }}>
                  No activity recorded.
                  <br />
                  <span style={{ color: '#1a3a1a' }}>Silence on all channels.</span>
                </div>
              ) : (
                data.recentClears.map((entry, i) => (
                  <div key={`${entry.agent_name}-${entry.level}-${i}`} style={{
                    padding: '10px 16px',
                    borderBottom: i < data.recentClears.length - 1 ? '1px solid #0f1a0f' : 'none',
                    background: i % 2 === 0 ? 'transparent' : '#0b110b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <div style={{ fontSize: '12px', minWidth: 0 }}>
                      <span style={{
                        color: entry.level >= 7 ? '#ffcc00' : '#33ff33',
                        fontWeight: 600,
                      }}>
                        {entry.agent_name}
                      </span>
                      <span style={{ color: '#1a5a1a' }}> cleared </span>
                      <span style={{
                        color: entry.level >= 7 ? '#ffcc00'
                             : entry.level >= 5 ? '#33ff33'
                             : '#1a8a1a',
                        fontWeight: 700,
                      }}>
                        level {entry.level}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      color: '#1a5a1a',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      {entry.time_ago}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Clears by Level — bar chart */}
          <div style={{
            border: '1px solid #1a3a1a',
            borderRadius: '4px',
            background: '#0d120d',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: 'var(--space-3, 12px) var(--space-4, 16px)',
              borderBottom: '1px solid #1a3a1a',
              background: '#0a100a',
            }}>
              <h2 style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#33ff33',
                letterSpacing: '0.15em',
                margin: 0,
              }}>
                CLEARS BY LEVEL
              </h2>
            </div>

            <div style={{ padding: 'var(--space-4, 16px)' }}>
              {data.clearsByLevel.map((row) => {
                const pct = data.maxClears > 0 ? (row.clears / data.maxClears) * 100 : 0
                const barColor = row.level >= 7 ? '#ffcc00'
                               : row.level >= 5 ? '#33ff33'
                               : row.level >= 3 ? '#1a8a1a'
                               : '#1a5a1a'
                return (
                  <div key={row.level} style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 48px',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: row.level < 7 ? '8px' : 0,
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: '#1a8a1a',
                      textAlign: 'right',
                    }}>
                      Level {row.level}
                    </span>
                    <div style={{
                      height: '16px',
                      background: '#0a100a',
                      borderRadius: '2px',
                      border: '1px solid #1a3a1a',
                      overflow: 'hidden',
                    }}>
                      <div className="bar-fill" style={{
                        height: '100%',
                        width: row.clears > 0 ? `${Math.max(pct, 3)}%` : '0%',
                        background: barColor,
                        borderRadius: '1px',
                        opacity: 0.8,
                      }} />
                    </div>
                    <span style={{
                      fontSize: '12px',
                      color: row.clears > 0 ? '#33ff33' : '#1a3a1a',
                      fontWeight: 700,
                      textAlign: 'right',
                    }}>
                      {row.clears}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: 'var(--space-10, 40px) var(--space-4, 16px) var(--space-8, 32px)',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-6, 24px)',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-4, 16px)',
          }}>
            <a href="/" style={{
              color: '#1a8a1a',
              textDecoration: 'none',
              fontSize: '12px',
              letterSpacing: '0.1em',
            }}>
              flip-ly.net
            </a>
            <a href="/contest-rules" style={{
              color: '#1a8a1a',
              textDecoration: 'none',
              fontSize: '12px',
              letterSpacing: '0.1em',
            }}>
              contest rules
            </a>
          </div>
          <p style={{
            fontSize: '10px',
            color: '#1a3a1a',
            letterSpacing: '0.1em',
          }}>
            The clues are hidden in the source. The terminal remembers everything.
          </p>
        </footer>
      </div>
    </div>
  )
}

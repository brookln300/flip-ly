/**
 * Hearth primitive — deal score chip (0–100 scale from the radar pipeline).
 *   ≥90  ember gradient + subtle pulse (the "drop everything" tier)
 *   75–89 amber · 65–74 emerald · <65 slate · null = unscored slate dash
 * JetBrains Mono for the numeral, per the data-display convention.
 */
export default function ScoreChip({
  score,
  size = 'md',
}: {
  score: number | null
  size?: 'md' | 'lg'
}) {
  const dims =
    size === 'lg'
      ? 'min-w-[3rem] h-12 px-2 text-lg rounded-xl'
      : 'min-w-[2.5rem] h-9 px-1.5 text-sm rounded-lg'

  let tone = 'bg-slate-500/15 text-slate-300 border border-slate-400/20'
  if (score != null) {
    if (score >= 90)
      tone =
        'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white border border-orange-300/40 animate-ember-pulse'
    else if (score >= 75) tone = 'bg-amber-500/15 text-amber-300 border border-amber-400/30'
    else if (score >= 65) tone = 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
  }

  return (
    <span
      className={`inline-flex items-center justify-center font-data font-bold tracking-tight ${dims} ${tone}`}
      title={score != null ? `Deal score ${score}/100` : 'Not scored yet'}
    >
      {score != null ? score : '—'}
    </span>
  )
}

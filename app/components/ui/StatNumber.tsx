/**
 * Hearth primitive — oversized stat numeral with a quiet label underneath.
 * `ember` lights the numeral with the hearth gradient (use for the one
 * number that matters most on the surface, not every stat).
 */
export default function StatNumber({
  value,
  label,
  ember = false,
  className = '',
}: {
  value: string | number
  label: string
  ember?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <div
        className={`font-data text-5xl font-bold tracking-tight leading-none sm:text-6xl ${
          ember ? 'text-ember' : 'text-slate-50'
        }`}
      >
        {value}
      </div>
      <div className="mt-2 text-[13px] text-slate-400">{label}</div>
    </div>
  )
}

/**
 * Hearth primitive — card/section heading row: icon + title on the left,
 * optional "view all →" action on the right. Keeps every deck card's
 * header rhythm identical.
 */
export default function SectionHeader({
  icon,
  title,
  action,
  actionHref,
  className = '',
}: {
  icon?: React.ReactNode
  title: string
  action?: string
  actionHref?: string
  className?: string
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold tracking-wide text-slate-50">
        {icon && <span className="text-amber-400/90" aria-hidden="true">{icon}</span>}
        {title}
      </h2>
      {action && actionHref && (
        <a
          href={actionHref}
          className="text-xs font-medium text-slate-400 no-underline transition-colors hover:text-amber-300"
        >
          {action} →
        </a>
      )}
    </div>
  )
}

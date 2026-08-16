/**
 * Zen section — a plain bordered block with a lowercase label, the basic
 * building unit of the redesigned pages. `flush` drops the body padding
 * for row-based content (the feed) that draws its own separators.
 */
export default function ZenSection({
  label,
  action,
  actionHref,
  flush = false,
  className = '',
  children,
}: {
  label: string
  action?: string
  actionHref?: string
  flush?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={`border border-zen-line ${className}`}>
      <div className="flex items-baseline justify-between gap-3 border-b border-zen-line bg-zen-panel px-3 py-1.5">
        <h2 className="text-[12px] font-semibold lowercase tracking-wide text-zen-muted">{label}</h2>
        {action && actionHref && (
          <a
            href={actionHref}
            className="text-[12px] lowercase text-zen-muted no-underline hover:text-zen-accent hover:underline"
          >
            {action}
          </a>
        )}
      </div>
      <div className={flush ? '' : 'px-3 py-2'}>{children}</div>
    </section>
  )
}

/**
 * Hearth primitive — the primary CTA. Ember gradient, used sparingly:
 * one per viewport. Renders an <a> when `href` is given, else a <button>.
 */
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 ' +
  'px-6 py-3 text-[15px] font-semibold text-white no-underline shadow-[0_4px_24px_rgba(249,115,22,0.35)] ' +
  'transition-all hover:shadow-[0_6px_32px_rgba(249,115,22,0.5)] hover:brightness-110 active:scale-[0.98]'

export default function EmberButton({
  children,
  href,
  onClick,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit'
}) {
  if (href) {
    return (
      <a href={href} className={`${BASE} ${className}`}>
        {children}
      </a>
    )
  }
  return (
    <button type={type} onClick={onClick} className={`${BASE} ${className}`}>
      {children}
    </button>
  )
}

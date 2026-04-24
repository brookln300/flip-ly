import type { Metadata } from 'next'

// /color is an internal design/palette preview. It contains hardcoded
// pricing samples that will go stale — keep it out of the index so it
// can't compete with or contradict the real pricing surfaces.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function ColorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

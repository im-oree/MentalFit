import type { ReactNode } from 'react'

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <main className="app-height bg-ink sm:bg-[radial-gradient(circle_at_top,#262626_0,#050505_58%)]">
      <section className="relative mx-auto app-height w-full overflow-hidden bg-paper sm:max-w-[430px] sm:shadow-[var(--shadow-glow)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,.85),transparent_32%),radial-gradient(circle_at_90%_8%,rgba(0,0,0,.08),transparent_28%)]" />
        <div className="relative z-10 app-height">{children}</div>
      </section>
    </main>
  )
}

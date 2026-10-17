import type { ReactNode } from 'react'

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex items-center justify-between">
      <h2 className="text-xl font-black tracking-[-0.04em]">{children}</h2>
      {action}
    </div>
  )
}

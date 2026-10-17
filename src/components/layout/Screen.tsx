import type { ReactNode } from 'react'

export function Screen({ children, withTabs, className = '' }: { children: ReactNode; withTabs?: boolean; className?: string }) {
  return (
    <div className={`app-height overflow-y-auto overscroll-contain bg-transparent ${className}`}>
      {children}
      {withTabs && <div className="h-[128px]" aria-hidden />}
    </div>
  )
}

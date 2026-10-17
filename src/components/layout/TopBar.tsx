import type { ReactNode } from 'react'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  tall?: boolean
  compact?: boolean
  backgroundImage?: string
}

export function TopBar({ title, subtitle, actions, tall, compact, backgroundImage }: TopBarProps) {
  const height = compact ? 'min-h-[104px]' : tall ? 'min-h-[220px]' : 'min-h-[126px]'

  return (
    <header className={`safe-top relative overflow-hidden px-5 pb-5 ${height} bg-black text-white`}>
      {backgroundImage && (
        <>
          <img src={backgroundImage} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        </>
      )}
      {!backgroundImage && (
        <>
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
        </>
      )}
      <div className={`relative z-10 flex items-center justify-between gap-4 ${compact ? 'pt-3' : 'pt-5'}`}>
        <div className="min-w-0">
          {subtitle && (
            <p className="mb-1 text-sm font-black uppercase tracking-[.14em] text-white/65">{subtitle}</p>
          )}
          <h1 className={`truncate font-black leading-none tracking-[-0.055em] ${compact ? 'text-[27px]' : 'text-[34px]'}`}>
            {title}
          </h1>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2 [&>button]:bg-white/12 [&>button]:backdrop-blur-xl [&>svg]:h-6 [&>svg]:w-6">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}

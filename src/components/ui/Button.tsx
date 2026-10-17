import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'chip'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  shimmer?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-dark text-white shadow-[var(--shadow-soft)]',
  secondary: 'border border-white/65 bg-[#f7f4ee]/90 text-ink shadow-[var(--shadow-soft)]',
  ghost: 'bg-transparent text-ink',
  chip: 'border border-white/65 bg-[#f7f4ee]/85 text-ink shadow-[var(--shadow-soft)] backdrop-blur-xl',
}

const sizes: Record<Size, string> = {
  sm: 'h-10 rounded-full px-4 text-sm',
  md: 'h-12 rounded-2xl px-5 text-base',
  lg: 'h-[58px] rounded-2xl px-6 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  leftIcon,
  rightIcon,
  shimmer,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`tap inline-flex items-center justify-center gap-2 font-black tracking-[-0.01em] ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${shimmer ? 'shimmer-sweep' : ''} ${className}`}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-2">
        {leftIcon}
        {children}
        {rightIcon}
      </span>
    </button>
  )
}

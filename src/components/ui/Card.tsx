import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

type CardProps<T extends ElementType> = {
  children: ReactNode
  as?: T
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>

export function Card<T extends ElementType = 'div'>({ children, as, className = '', ...props }: CardProps<T>) {
  const Component = as ?? 'div'
  return (
    <Component className={`glass-card rounded-[24px] ${className}`} {...props}>
      {children}
    </Component>
  )
}

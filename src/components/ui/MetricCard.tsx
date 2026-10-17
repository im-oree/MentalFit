import { Card } from './Card'

export function MetricCard({ value, label, className = '' }: { value: string | number; label: string; className?: string }) {
  return (
    <Card className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <span className="text-3xl font-black tracking-[-0.04em]">{value}</span>
      <span className="mt-1 text-xs font-semibold text-muted">{label}</span>
    </Card>
  )
}

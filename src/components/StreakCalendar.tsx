import type { WorkoutSession } from '../types/workout'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function StreakCalendar({ workouts }: { workouts: WorkoutSession[] }) {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })

  const activeDays = new Set(
    workouts.map((w) => {
      const d = new Date(w.date)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }),
  )

  const streak = (() => {
    let count = 0
    const d = new Date(today)
    d.setHours(0, 0, 0, 0)
    while (activeDays.has(d.getTime())) {
      count++
      d.setDate(d.getDate() - 1)
    }
    return count
  })()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black uppercase tracking-[.18em] text-muted">This Week</p>
        {streak > 0 && (
          <span className="text-[11px] font-black uppercase tracking-[.14em] text-accent-gold">{streak} day streak</span>
        )}
      </div>
      <div className="flex justify-between">
        {days.map((d, i) => {
          const active = activeDays.has(d.getTime())
          const isToday = d.getTime() === new Date(new Date().setHours(0, 0, 0, 0)).getTime()
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-black text-muted">{DAY_LABELS[(d.getDay() + 6) % 7]}</span>
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                  active
                    ? 'bg-dark text-white shadow-[var(--shadow-soft)]'
                    : isToday
                      ? 'ring-1 ring-ink/20 text-ink'
                      : 'bg-ink/[0.06] text-muted'
                }`}
              >
                {d.getDate()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

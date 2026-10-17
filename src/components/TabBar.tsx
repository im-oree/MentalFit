import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Dumbbell, Clock, User } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/profile', icon: User, label: 'Profile' },
] as const

function Nav() {
  const location = useLocation()
  const activeIndex = tabs.findIndex((t) => location.pathname.startsWith(t.to))

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center pb-[max(10px,env(safe-area-inset-bottom))]">
      <motion.nav
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto w-[min(100vw-24px,398px)] rounded-[26px] border border-white/10 bg-dark-card/78 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,.45)] backdrop-blur-2xl"
        aria-label="Primary"
      >
        <div className="grid h-[58px] grid-cols-4 gap-0.5">
          {tabs.map((tab, i) => {
            const active = i === activeIndex
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className="tap relative isolate flex min-w-0 flex-col items-center justify-center gap-[3px] rounded-[20px] px-0.5"
              >
                {active && (
                  <motion.span
                    layoutId="active-tab-pill"
                    className="absolute inset-0 -z-10 rounded-[20px] bg-white/[0.22] shadow-[inset_0_1px_0_rgba(255,255,255,.25)]"
                    transition={{ type: 'spring', stiffness: 430, damping: 34 }}
                  />
                )}
                <motion.span
                  animate={{ y: active ? -1 : 0, scale: active ? 1.07 : 1 }}
                  transition={{ type: 'spring', stiffness: 480, damping: 26 }}
                  className={`text-white [&>svg]:h-[19px] [&>svg]:w-[19px] ${active ? 'opacity-100 drop-shadow-[0_1px_4px_rgba(0,0,0,.5)]' : 'opacity-70'}`}
                >
                  <tab.icon />
                </motion.span>
                <span className={`max-w-full truncate text-[9.5px] font-black leading-none text-white ${active ? 'opacity-100' : 'opacity-55'}`}>
                  {tab.label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </motion.nav>
    </div>
  )
}

export function TabBar() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(<Nav />, document.body)
}

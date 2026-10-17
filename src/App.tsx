import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StoreContext, useStoreProvider } from './data/store'
import { PhoneFrame } from './components/layout/PhoneFrame'
import { Layout } from './components/Layout'
import { OnboardingPage } from './pages/OnboardingPage'
import { HomePage } from './pages/HomePage'
import { WorkoutsPage } from './pages/WorkoutsPage'
import { SessionPage } from './pages/SessionPage'
import { RunPage } from './pages/RunPage'
import { HistoryPage } from './pages/HistoryPage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  const store = useStoreProvider()

  if (store.loading) {
    return (
      <PhoneFrame>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-dark border-t-transparent rounded-full animate-spin" />
        </div>
      </PhoneFrame>
    )
  }

  const onboarded = store.profile?.onboardingComplete

  return (
    <StoreContext.Provider value={store}>
      <BrowserRouter>
        <PhoneFrame>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route element={<Layout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/workouts" element={<WorkoutsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="/session/:exerciseId" element={<SessionPage />} />
            <Route path="/run" element={<RunPage />} />
            <Route path="*" element={<Navigate to={onboarded ? '/home' : '/onboarding'} replace />} />
          </Routes>
        </PhoneFrame>
      </BrowserRouter>
    </StoreContext.Provider>
  )
}

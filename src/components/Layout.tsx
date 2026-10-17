import { Outlet } from 'react-router-dom'
import { TabBar } from './TabBar'
import { Screen } from './layout/Screen'

export function Layout() {
  return (
    <Screen withTabs>
      <Outlet />
      <TabBar />
    </Screen>
  )
}

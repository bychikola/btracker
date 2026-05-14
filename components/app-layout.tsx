'use client'

import { Header } from './header'
import { BetSlip } from './bet-slip'
import { BottomNavigation } from './bottom-navigation'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--canvas-soft)]">
      <Header />
      <div className="flex-1 flex">
        <main className="flex-1 lg:max-w-[calc(100%-18rem)] pb-20 md:pb-0">{children}</main>
        <aside className="hidden lg:block w-72">
          <div className="sticky top-[73px] h-[calc(100vh-73px)]">
            <BetSlip />
          </div>
        </aside>
      </div>
      <BottomNavigation />
    </div>
  )
}

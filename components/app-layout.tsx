'use client'

import { Header } from './header'
import { BetSlip } from './bet-slip'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        {/* Основной контент */}
        <main className="flex-1 lg:max-w-[calc(100%-20rem)]">{children}</main>
        {/* Купон справа на десктопе */}
        <aside className="hidden lg:block w-80">
          <div className="sticky top-16 h-[calc(100vh-4rem)]">
            <BetSlip />
          </div>
        </aside>
      </div>
    </div>
  )
}

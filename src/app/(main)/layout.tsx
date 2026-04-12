import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* pb-nav: 바텀 네비게이션 높이(3.5rem) + iOS safe area */}
      <main className="max-w-lg mx-auto pb-nav">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

import BottomNav from '@/components/layout/BottomNav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#FAFAFA' }}>
      <main className="max-w-[480px] mx-auto pb-nav">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

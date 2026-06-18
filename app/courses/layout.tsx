import Navbar from '@/components/Navbar'

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 64px)' }}>
        {children}
      </div>
    </div>
  )
}

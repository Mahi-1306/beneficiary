import { Outlet } from 'react-router-dom'
import Navbar from '@/components/Navbar'

export default function CitizenLayout() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}

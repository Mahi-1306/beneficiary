import { Outlet, NavLink, Link } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/schemes', label: 'Schemes', icon: '📋' },
  { to: '/admin/pending', label: 'Pending Review', icon: '⏳' },
  { to: '/admin/import', label: 'Bulk Import', icon: '📥' },
]

export default function ModeratorLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[var(--primary)] flex flex-col min-h-screen">
        <div className="p-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center">
              <span className="text-[var(--primary)] font-bold text-xs">DI</span>
            </div>
            <span className="text-white font-semibold text-sm">Admin Panel</span>
          </Link>
        </div>
        <nav className="p-3 flex-1 space-y-1" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link to="/" className="text-xs text-white/40 hover:text-white/70 transition-colors">
            ← Citizen Portal
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-[var(--background)] overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

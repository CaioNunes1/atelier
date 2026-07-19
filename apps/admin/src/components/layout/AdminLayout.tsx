import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tag, Ticket, ShoppingBag,
  LogOut, Scissors, Menu, X, ChevronRight,
} from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/admin',           label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { to: '/admin/produtos',  label: 'Produtos',   icon: Package },
  { to: '/admin/categorias',label: 'Categorias', icon: Tag },
  { to: '/admin/cupons',    label: 'Cupons',     icon: Ticket },
  { to: '/admin/pedidos',   label: 'Pedidos',    icon: ShoppingBag },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { mutate: doLogout, isPending } = useMutation({
    mutationFn: logout,
    onSuccess: () => { toast.success('Até logo!'); navigate('/admin/login') },
  })

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link to="/admin" className="flex items-center gap-3 px-6 py-7 border-b border-white/5">
        <span className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
          <Scissors size={14} className="text-brand" />
        </span>
        <div>
          <p className="font-display text-lg text-white leading-none tracking-wide">Atelier</p>
          <p className="font-body text-[9px] text-brand/60 uppercase tracking-[0.18em] mt-0.5">Admin</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm transition-all duration-150 group',
                isActive
                  ? 'bg-brand/15 text-white'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/5',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={cn('shrink-0 transition-colors', isActive ? 'text-brand' : 'group-hover:text-white/60')} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={12} className="text-brand/60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center text-brand font-body text-xs font-medium shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-xs text-white/70 truncate">{user?.name}</p>
            <p className="font-body text-[10px] text-white/30 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => doLogout()}
          disabled={isPending}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg font-body text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-150"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-56 xl:w-60 shrink-0 flex-col bg-admin-sidebar fixed top-0 left-0 h-full z-30"
        style={{ borderRight: '1px solid rgba(196,149,106,0.08)' }}>
        {sidebarContent}
      </aside>

      {/* Sidebar mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-50 w-56 bg-admin-sidebar flex flex-col animate-slide-in">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white p-1">
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-56 xl:ml-60 min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-admin-border sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)}
            className="p-2 text-admin-muted hover:text-admin-ink rounded-lg hover:bg-admin-surface transition-colors">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Scissors size={15} className="text-brand" />
            <span className="font-display text-lg text-admin-ink">Atelier</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// components/navigation.tsx
'use client'
import { useAuth } from '@/lib/auth-context'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Users, TrendingUp, Plus, LogOut, UserCircle } from 'lucide-react'

export function Navigation() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  if (!user || pathname === '/login') return null

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/tenants', icon: Users, label: 'Tenants' },
    { href: '/dashboard/maintenance/new', icon: Plus, label: 'New' },
    { href: '/dashboard/analytics', icon: TrendingUp, label: 'Analytics' },
  ]

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <>
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-white shadow-sm border-b z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600">Flats Pro</Link>
            <div className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}>
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <UserCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{user.email?.split('@')[0]}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{user.role}</span>
              </div>
              <button onClick={handleSignOut} className="p-2 hover:bg-red-100 text-red-600 rounded-lg">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex flex-col items-center gap-1 py-2 ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                  <Icon className="w-6 h-6" />
                  <span className="text-xs">{item.label}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="h-16 hidden md:block"></div>
      <div className="h-20 md:hidden"></div>
    </>
  )
}

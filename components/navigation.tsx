"use client"
import { useAuth } from '@/lib/auth-context'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Users, TrendingUp, Plus, LogOut, UserCircle, Menu, X, Bell, Settings, DollarSign } from 'lucide-react'
import { useState } from 'react'

export function Navigation() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!user || pathname === '/login') return null

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard', gradient: 'from-blue-500 to-cyan-500' },
    { href: '/dashboard/tenants', icon: Users, label: 'Tenants', gradient: 'from-purple-500 to-pink-500' },
    { href: '/dashboard/maintenance/new', icon: Plus, label: 'New Record', gradient: 'from-green-500 to-emerald-500' },
    { href: '/dashboard/analytics', icon: TrendingUp, label: 'Analytics', gradient: 'from-orange-500 to-red-500' },
  ]

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop Navigation - Premium Style */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg group-hover:shadow-2xl transition-all group-hover:scale-110">
                <Home className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Flats Pro
                </h1>
                <p className="text-xs text-gray-500 font-medium">Maintenance System</p>
              </div>
            </Link>

            {/* Navigation Items */}
            <div className="flex gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`relative flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg scale-105' 
                        : 'hover:bg-gray-100 text-gray-700 hover:scale-105'
                    }`}>
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold">{item.label}</span>
                      {isActive && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-3 hover:bg-gray-100 rounded-xl transition-all">
                <Bell className="w-6 h-6 text-gray-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              {/* Settings */}
              <button className="p-3 hover:bg-gray-100 rounded-xl transition-all">
                <Settings className="w-6 h-6 text-gray-600" />
              </button>

              {/* User Profile */}
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                  <UserCircle className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">{user.email?.split('@')[0]}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <button 
                onClick={handleSignOut} 
                className="p-3 hover:bg-red-50 text-red-600 rounded-xl transition-all hover:scale-110"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 z-50 shadow-2xl">
        <div className="grid grid-cols-4 gap-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-gradient-to-br ' + item.gradient + ' text-white scale-110 shadow-lg' 
                    : 'text-gray-600'
                }`}>
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-bold">{item.label}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 z-40 shadow-lg">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
              <Home className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Flats Pro
            </h1>
          </div>
          <button onClick={handleSignOut} className="p-2 hover:bg-red-50 text-red-600 rounded-lg">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="h-20 hidden md:block"></div>
      <div className="h-16 md:hidden"></div>
      <div className="h-24 md:hidden"></div>
    </>
  )
}

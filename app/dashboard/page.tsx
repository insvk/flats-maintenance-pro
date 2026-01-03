"use client"
import { useTenants, useMaintenanceRecords } from '@/lib/hooks'
import Link from 'next/link'
import { Users, DollarSign, Calendar, Home, TrendingUp, Plus, ArrowUp, ArrowDown, Activity } from 'lucide-react'
import { formatCurrency, getMonthYearString } from '@/lib/utils'

export default function DashboardPage() {
  const { data: tenants } = useTenants('active')
  const { data: records } = useMaintenanceRecords()

  const activeTenantCount = tenants?.filter(t => t.type !== 'owner').length || 0
  const totalCollected = records?.reduce((sum, r) => sum + r.grand_total, 0) || 0
  const latestRecord = records?.[0]
  const totalRecords = records?.length || 0

  // Smart Insights
  const avgMonthly = records && records.length > 0 ? totalCollected / records.length : 0
  const lastMonth = records?.[0]?.grand_total || 0
  const previousMonth = records?.[1]?.grand_total || 0
  const trend = lastMonth > previousMonth ? 'up' : 'down'
  const trendPercent = previousMonth > 0 ? Math.abs(((lastMonth - previousMonth) / previousMonth) * 100).toFixed(1) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black mb-2">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Welcome Back! 👋
                </span>
              </h1>
              <p className="text-gray-600 text-lg">Here's what's happening with your property today</p>
            </div>
            <Link href="/dashboard/maintenance/new">
              <button className="hidden md:flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-2xl hover:shadow-purple-300 transition-all hover:scale-105 group">
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                <span className="font-bold text-lg">New Record</span>
              </button>
            </Link>
          </div>
        </div>

        {records && records.length > 1 && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl text-white animate-scale-in">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-lg rounded-2xl">
                {trend === 'up' ? <ArrowUp className="w-8 h-8" /> : <ArrowDown className="w-8 h-8" />}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">💡 Smart Insight</h3>
                <p className="text-white/90 text-lg">
                  Expenses are <span className="font-black">{trend === 'up' ? '↑' : '↓'} {trendPercent}%</span> compared to last month.
                  {trend === 'up' ? ' Monitor spending closely.' : ' Great! You\'re saving money.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white shadow-2xl hover:shadow-blue-300 transition-all hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl">
                  <Users className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm font-semibold">Active Tenants</p>
                  <p className="text-4xl font-black">{activeTenantCount} <span className="text-2xl">/5</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex-1 bg-white/20 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full transition-all" style={{width: `${(activeTenantCount/5)*100}%`}}></div>
                </div>
                <span className="font-bold">{((activeTenantCount/5)*100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 to-emerald-500 p-6 text-white shadow-2xl hover:shadow-green-300 transition-all hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl">
                  <DollarSign className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm font-semibold">Total Collected</p>
                  <p className="text-4xl font-black">{formatCurrency(totalCollected).slice(0, -3)}</p>
                </div>
              </div>
              <p className="text-white/80 text-sm font-semibold">Avg: {formatCurrency(avgMonthly)}/month</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white shadow-2xl hover:shadow-purple-300 transition-all hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl">
                  <Calendar className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm font-semibold">Latest Period</p>
                  <p className="text-2xl font-black">
                    {latestRecord ? getMonthYearString(latestRecord.month, latestRecord.year) : 'N/A'}
                  </p>
                </div>
              </div>
              <p className="text-white/80 text-sm font-semibold">
                {latestRecord ? formatCurrency(latestRecord.grand_total) : '-'}
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 p-6 text-white shadow-2xl hover:shadow-orange-300 transition-all hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl">
                  <Activity className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm font-semibold">Total Records</p>
                  <p className="text-4xl font-black">{totalRecords}</p>
                </div>
              </div>
              <p className="text-white/80 text-sm font-semibold">Since inception</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/dashboard/tenants">
            <div className="group relative overflow-hidden bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 border-2 border-transparent hover:border-blue-300">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-20 -mt-20"></div>
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl inline-block mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Manage Tenants</h3>
                <p className="text-gray-600">Add, edit, or create accounts for tenants and owners</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/maintenance/new">
            <div className="group relative overflow-hidden bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 border-2 border-transparent hover:border-green-300">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -mr-20 -mt-20"></div>
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl inline-block mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">New Maintenance</h3>
                <p className="text-gray-600">Add monthly maintenance record with auto-split</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/analytics">
            <div className="group relative overflow-hidden bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 border-2 border-transparent hover:border-purple-300">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -mr-20 -mt-20"></div>
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl inline-block mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">View Analytics</h3>
                <p className="text-gray-600">Charts, reports, and export options</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                  <Home className="w-6 h-6 text-white" />
                </div>
                Recent Maintenance Records
              </h2>
              <Link href="/dashboard/analytics">
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105">
                  View All
                </button>
              </Link>
            </div>
          </div>
          {records && records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-bold text-gray-700">Period</th>
                    <th className="text-left py-4 px-6 font-bold text-gray-700">Collector</th>
                    <th className="text-right py-4 px-6 font-bold text-gray-700">Amount</th>
                    <th className="text-center py-4 px-6 font-bold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 5).map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all">
                      <td className="py-4 px-6">
                        <span className="font-semibold">{getMonthYearString(record.month, record.year)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {record.collector_name[0]}
                          </div>
                          <span>{record.collector_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {formatCurrency(record.grand_total)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Link href={`/dashboard/maintenance/${record.id}`}>
                          <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105">
                            View
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-block p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-4">
                <Home className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No records yet</h3>
              <p className="text-gray-600 mb-6">Start by creating your first maintenance record</p>
              <Link href="/dashboard/maintenance/new">
                <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-purple-300 transition-all hover:scale-105">
                  Create First Record
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

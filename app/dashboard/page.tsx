"use client"
import { useTenants, useMaintenanceRecords } from '@/lib/hooks'
import Link from 'next/link'
import { Users, DollarSign, Calendar, Home, TrendingUp, Plus } from 'lucide-react'
import { formatCurrency, getMonthYearString } from '@/lib/utils'

export default function DashboardPage() {
  const { data: tenants } = useTenants('active')
  const { data: records } = useMaintenanceRecords()

  const activeTenantCount = tenants?.length || 0
  const totalCollected = records?.reduce((sum, r) => sum + r.grand_total, 0) || 0
  const latestRecord = records?.[0]
  const totalRecords = records?.length || 0

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="page-header">Dashboard</h1>
          <Link href="/dashboard/maintenance/new">
            <button className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline">New Record</span>
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Tenants</p>
                <p className="text-3xl font-bold text-blue-600">{activeTenantCount} / 5</p>
              </div>
              <div className="p-4 bg-blue-100 rounded-xl">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Collected</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
              </div>
              <div className="p-4 bg-green-100 rounded-xl">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Latest Period</p>
                <p className="text-xl font-bold text-purple-600">
                  {latestRecord ? getMonthYearString(latestRecord.month, latestRecord.year) : 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-purple-100 rounded-xl">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Records</p>
                <p className="text-3xl font-bold text-orange-600">{totalRecords}</p>
              </div>
              <div className="p-4 bg-orange-100 rounded-xl">
                <Home className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/dashboard/tenants">
            <div className="card hover:shadow-xl cursor-pointer transition-all hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg">Manage Tenants</h3>
              </div>
              <p className="text-sm text-gray-600">Add, edit, or create accounts for tenants</p>
            </div>
          </Link>

          <Link href="/dashboard/maintenance/new">
            <div className="card hover:shadow-xl cursor-pointer transition-all hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">New Maintenance</h3>
              </div>
              <p className="text-sm text-gray-600">Add monthly maintenance record with payments</p>
            </div>
          </Link>

          <Link href="/dashboard/analytics">
            <div className="card hover:shadow-xl cursor-pointer transition-all hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg">View Analytics</h3>
              </div>
              <p className="text-sm text-gray-600">Charts, reports, and export options</p>
            </div>
          </Link>
        </div>

        {/* Recent Records */}
        <div className="card">
          <h2 className="section-header">Recent Maintenance Records</h2>
          {records && records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Period</th>
                    <th className="text-left py-3 px-4">Collector</th>
                    <th className="text-right py-3 px-4">Amount</th>
                    <th className="text-center py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 5).map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{getMonthYearString(record.month, record.year)}</td>
                      <td className="py-3 px-4">{record.collector_name}</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatCurrency(record.grand_total)}</td>
                      <td className="py-3 px-4 text-center">
                        <Link href={`/dashboard/maintenance/${record.id}`}>
                          <button className="text-blue-600 hover:underline text-sm">View Details</button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No maintenance records yet</p>
              <Link href="/dashboard/maintenance/new">
                <button className="btn-primary">Create First Record</button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

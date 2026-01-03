"use client"
import { useAnalytics } from '@/lib/hooks'
import { formatCurrency, getMonthYearString } from '@/lib/utils'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download } from 'lucide-react'
import { exportAllRecordsToPDF } from '@/lib/export'

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalytics()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const records = data?.records || []
  const tenants = data?.tenants || []

  // Prepare chart data
  const monthlyData = records.map(r => ({
    name: getMonthYearString(r.month, r.year),
    total: r.grand_total,
  })).reverse()

  const tenantPaymentData = tenants.map(tenant => {
    const totalPaid = records.reduce((sum, record) => {
      const payment = (record as any).tenant_payments?.find((p: any) => p.tenant_id === tenant.id)
      return sum + (payment?.amount || 0)
    }, 0)
    return {
      name: tenant.name,
      total: totalPaid
    }
  })

  const totalCollected = records.reduce((sum, r) => sum + r.grand_total, 0)
  const avgMonthly = records.length > 0 ? totalCollected / records.length : 0

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="page-header">Analytics & Reports</h1>
          <button 
            onClick={() => exportAllRecordsToPDF(records as any)}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export All
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Total Collected</p>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalCollected)}</p>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <p className="text-sm text-gray-600 mb-1">Average Monthly</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(avgMonthly)}</p>
          </div>

          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <p className="text-sm text-gray-600 mb-1">Total Records</p>
            <p className="text-3xl font-bold text-purple-600">{records.length}</p>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        {monthlyData.length > 0 && (
          <div className="card mb-8">
            <h2 className="section-header">Monthly Collection Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total Amount" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tenant-wise Payment Chart */}
        {tenantPaymentData.length > 0 && (
          <div className="card mb-8">
            <h2 className="section-header">Tenant-wise Total Payments</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tenantPaymentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="total" fill="#10b981" name="Total Paid" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Records Table */}
        <div className="card">
          <h2 className="section-header">All Maintenance Records</h2>
          {records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Period</th>
                    <th className="text-left py-3 px-4">Collector</th>
                    <th className="text-right py-3 px-4">Amount</th>
                    <th className="text-center py-3 px-4">Payments</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{getMonthYearString(record.month, record.year)}</td>
                      <td className="py-3 px-4">{record.collector_name}</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatCurrency(record.grand_total)}</td>
                      <td className="py-3 px-4 text-center">
                        {(record as any).tenant_payments?.length || 0} tenants
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No records available for analytics</p>
          )}
        </div>
      </div>
    </div>
  )
}

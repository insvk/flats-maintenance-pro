"use client"
import { useMaintenanceRecord } from '@/lib/hooks'
import { formatCurrency, getMonthYearString } from '@/lib/utils'
import { exportMaintenanceToWord, exportMaintenanceToPDF } from '@/lib/export'
import { Download, FileText, Printer } from 'lucide-react'
import Link from 'next/link'

export default function ViewMaintenancePage({ params }: { params: { id: string } }) {
  const { data: record, isLoading } = useMaintenanceRecord(params.id)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Record not found</p>
          <Link href="/dashboard">
            <button className="btn-primary">Back to Dashboard</button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="page-header">Maintenance Record</h1>
            <p className="text-gray-600">{getMonthYearString(record.month, record.year)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportMaintenanceToWord(record)} className="btn-secondary flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden md:inline">Word</span>
            </button>
            <button onClick={() => exportMaintenanceToPDF(record)} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="card mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Collector</p>
              <p className="text-xl font-bold">{record.collector_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Period</p>
              <p className="text-xl font-bold">{getMonthYearString(record.month, record.year)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Grand Total</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(record.grand_total)}</p>
            </div>
          </div>
        </div>

        {/* Tenant Payments */}
        <div className="card mb-6">
          <h2 className="section-header">Tenant Payments</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Tenant</th>
                  <th className="text-right py-3 px-4">Amount</th>
                  <th className="text-center py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {record.tenant_payments?.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="py-3 px-4">{payment.tenant?.name || '-'}</td>
                    <td className="py-3 px-4 text-right font-semibold">{formatCurrency(payment.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                        payment.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-bold">
                  <td className="py-3 px-4">Total from Tenants</td>
                  <td className="py-3 px-4 text-right">
                    {formatCurrency(record.tenant_payments?.reduce((sum, p) => sum + p.amount, 0) || 0)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Expense Particulars */}
        <div className="card">
          <h2 className="section-header">Expense Particulars</h2>
          {record.particulars && record.particulars.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Item</th>
                    <th className="text-center py-3 px-4">Type</th>
                    <th className="text-right py-3 px-4">Price</th>
                    <th className="text-center py-3 px-4">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {record.particulars.map((particular) => (
                    <tr key={particular.id} className="border-b">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold">{particular.item_name}</p>
                          {particular.description && (
                            <p className="text-sm text-gray-600">{particular.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          particular.type === 'service' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {particular.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">{formatCurrency(particular.price)}</td>
                      <td className="py-3 px-4 text-center">
                        {particular.receipt_url ? (
                          <a href={particular.receipt_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td className="py-3 px-4" colSpan={2}>Total Expenses</td>
                    <td className="py-3 px-4 text-right">
                      {formatCurrency(record.particulars.reduce((sum, p) => sum + p.price, 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No expense particulars recorded.</p>
          )}
        </div>

        <div className="mt-6">
          <Link href="/dashboard">
            <button className="btn-secondary">Back to Dashboard</button>
          </Link>
        </div>
      </div>
    </div>
  )
}

"use client"
import { useState, useEffect } from 'react'
import { useTenants, useCreateMaintenance, useUploadReceipt } from '@/lib/hooks'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { monthNames, getCurrentMonth, getCurrentYear, formatCurrency } from '@/lib/utils'
import { Plus, Trash2, Upload, Calculator, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewMaintenancePage() {
  const { data: tenants } = useTenants('active')
  const createMaintenance = useCreateMaintenance()
  const uploadReceipt = useUploadReceipt()
  const { user } = useAuth()
  const router = useRouter()

  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentYear())
  const [collectorName, setCollectorName] = useState('')
  const [payments, setPayments] = useState<any[]>([])
  const [particulars, setParticulars] = useState<any[]>([])
  const [autoSplit, setAutoSplit] = useState(true)

  // Calculate totals
  const expenseTotal = particulars.reduce((sum, p) => sum + Number(p.price || 0), 0)
  const manualPaymentTotal = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const grandTotal = autoSplit ? expenseTotal : manualPaymentTotal + expenseTotal
  const perTenantAmount = tenants && tenants.length > 0 ? expenseTotal / tenants.length : 0

  // Auto-update payments when auto-split is enabled
  useEffect(() => {
    if (tenants && autoSplit) {
      setPayments(tenants.map(t => ({
        tenant_id: t.id,
        amount: perTenantAmount,
        status: 'pending'
      })))
    } else if (tenants && !autoSplit && payments.length === 0) {
      setPayments(tenants.map(t => ({
        tenant_id: t.id,
        amount: 0,
        status: 'pending'
      })))
    }
  }, [tenants, autoSplit, perTenantAmount])

  function updatePayment(index: number, field: string, value: any) {
    const newPayments = [...payments]
    newPayments[index] = { ...newPayments[index], [field]: value }
    setPayments(newPayments)
  }

  function addParticular() {
    setParticulars([...particulars, {
      item_name: '',
      price: 0,
      type: 'service',
      description: '',
      receipt_url: ''
    }])
  }

  function updateParticular(index: number, field: string, value: any) {
    const newParticulars = [...particulars]
    newParticulars[index] = { ...newParticulars[index], [field]: value }
    setParticulars(newParticulars)
  }

  function removeParticular(index: number) {
    setParticulars(particulars.filter((_, i) => i !== index))
  }

  async function handleFileUpload(index: number, file: File) {
    try {
      const url = await uploadReceipt.mutateAsync(file)
      updateParticular(index, 'receipt_url', url)
      toast.success('Receipt uploaded!')
    } catch (error) {
      toast.error('Failed to upload receipt')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!collectorName) {
      toast.error('Enter collector name')
      return
    }

    await createMaintenance.mutateAsync({
      record: {
        month,
        year,
        grand_total: grandTotal,
        collector_name: collectorName,
        created_by: user?.id
      },
      payments: payments.filter(p => p.amount > 0),
      particulars: particulars.filter(p => p.item_name && p.price > 0)
    })

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8 animate-fade-in">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              New Maintenance Record
            </h1>
            <p className="text-gray-600">Create monthly maintenance with auto-split</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Period Selection - Enhanced */}
          <div className="card hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calculator className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="section-header mb-0">Period & Collector</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Month</label>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input-field">
                  {monthNames.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Year</label>
                <input 
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Collector Name</label>
                <input 
                  type="text"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Vanaja"
                  required
                />
              </div>
            </div>
          </div>

          {/* Expense Particulars - Enhanced */}
          <div className="card hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="section-header mb-0">Expense Particulars</h2>
              </div>
              <button type="button" onClick={addParticular} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {particulars.length > 0 ? (
              <div className="space-y-4">
                {particulars.map((particular, index) => (
                  <div key={index} className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 transition-all bg-gradient-to-r from-white to-purple-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="label">Item Name</label>
                        <input 
                          type="text"
                          value={particular.item_name}
                          onChange={(e) => updateParticular(index, 'item_name', e.target.value)}
                          className="input-field"
                          placeholder="e.g., Electricity Bill"
                          required
                        />
                      </div>

                      <div>
                        <label className="label">Price (₹)</label>
                        <input 
                          type="number"
                          value={particular.price}
                          onChange={(e) => updateParticular(index, 'price', Number(e.target.value))}
                          className="input-field"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="label">Type</label>
                        <select 
                          value={particular.type}
                          onChange={(e) => updateParticular(index, 'type', e.target.value)}
                          className="input-field"
                        >
                          <option value="service">Service</option>
                          <option value="product">Product</option>
                        </select>
                      </div>

                      <div>
                        <label className="label">Receipt (Optional)</label>
                        <label className="flex items-center gap-2 input-field cursor-pointer hover:bg-gray-50">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">{particular.receipt_url ? '✅ Uploaded' : 'Upload File'}</span>
                          <input 
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(index, e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="label">Description (Optional)</label>
                      <textarea 
                        value={particular.description}
                        onChange={(e) => updateParticular(index, 'description', e.target.value)}
                        className="input-field"
                        rows={2}
                        placeholder="Additional details..."
                      />
                    </div>

                    <button 
                      type="button"
                      onClick={() => removeParticular(index)}
                      className="btn-danger flex items-center gap-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove Item
                    </button>
                  </div>
                ))}

                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-800">Total Expenses:</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(expenseTotal)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No expense items yet</p>
                <button type="button" onClick={addParticular} className="btn-primary">Add First Item</button>
              </div>
            )}
          </div>

          {/* Auto-Split Toggle - NEW FEATURE */}
          <div className="card hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calculator className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Auto-Split Expenses</h3>
                  <p className="text-sm text-gray-600">Automatically divide expenses equally among all tenants</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoSplit(!autoSplit)}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                  autoSplit ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  autoSplit ? 'translate-x-9' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {autoSplit && tenants && tenants.length > 0 && (
              <div className="mt-4 p-4 bg-white rounded-xl">
                <p className="text-center text-sm text-gray-600 mb-2">
                  ₹{expenseTotal.toFixed(2)} ÷ {tenants.length} tenants = 
                </p>
                <p className="text-center text-3xl font-bold text-orange-600">
                  ₹{perTenantAmount.toFixed(2)} per tenant
                </p>
              </div>
            )}
          </div>

          {/* Tenant Payments - Enhanced with Auto-Split */}
          <div className="card hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calculator className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="section-header mb-0">Tenant Payments</h2>
              {autoSplit && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Auto-Split Active
                </span>
              )}
            </div>
            {tenants && tenants.length > 0 ? (
              <div className="space-y-3">
                {tenants.map((tenant, index) => (
                  <div key={tenant.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-white to-green-50 rounded-xl border-2 border-gray-200 hover:border-green-300 transition-all">
                    <div className="flex-1">
                      <p className="font-bold text-lg">{tenant.name}</p>
                      <p className="text-sm text-gray-600">{tenant.email || tenant.phone}</p>
                    </div>
                    <div className="w-32">
                      <input 
                        type="number"
                        value={payments[index]?.amount || 0}
                        onChange={(e) => updatePayment(index, 'amount', Number(e.target.value))}
                        className="input-field text-right font-bold"
                        placeholder="Amount"
                        disabled={autoSplit}
                        step="0.01"
                      />
                    </div>
                    <div className="w-32">
                      <select 
                        value={payments[index]?.status || 'pending'}
                        onChange={(e) => updatePayment(index, 'status', e.target.value)}
                        className="input-field"
                      >
                        <option value="paid">Paid ✅</option>
                        <option value="pending">Pending ⏳</option>
                        <option value="partial">Partial 🔶</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">No active tenants. Add tenants first.</p>
            )}
          </div>

          {/* Grand Total - Enhanced */}
          <div className="card bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-2xl animate-pulse-slow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-blue-100 mb-1">Grand Total</p>
                <p className="text-sm text-blue-100">
                  {autoSplit ? 'Expenses Only (Auto-Split)' : 'Expenses + Payments'}
                </p>
              </div>
              <p className="text-5xl font-bold">{formatCurrency(grandTotal)}</p>
            </div>
          </div>

          {/* Submit Button - Enhanced */}
          <div className="flex gap-4">
            <button 
              type="submit" 
              className="btn-primary flex-1 text-lg py-4 shadow-lg hover:shadow-2xl transition-all" 
              disabled={createMaintenance.isPending}
            >
              {createMaintenance.isPending ? '⏳ Creating...' : '✨ Create Record'}
            </button>
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="btn-secondary px-8 py-4"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

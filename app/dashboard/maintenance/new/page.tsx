"use client"
import { useState } from 'react'
import { useTenants, useCreateMaintenance, useUploadReceipt } from '@/lib/hooks'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { monthNames, getCurrentMonth, getCurrentYear } from '@/lib/utils'
import { Plus, Trash2, Upload } from 'lucide-react'
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

  // Initialize payments when tenants load
  useState(() => {
    if (tenants && tenants.length > 0 && payments.length === 0) {
      setPayments(tenants.map(t => ({
        tenant_id: t.id,
        amount: 0,
        status: 'pending'
      })))
    }
  })

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

  const grandTotal = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) + 
                     particulars.reduce((sum, p) => sum + Number(p.price || 0), 0)

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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="page-header">New Maintenance Record</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Period Selection */}
          <div className="card">
            <h2 className="section-header">Period</h2>
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

          {/* Tenant Payments */}
          <div className="card">
            <h2 className="section-header">Tenant Payments</h2>
            {tenants && tenants.length > 0 ? (
              <div className="space-y-3">
                {tenants.map((tenant, index) => (
                  <div key={tenant.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold">{tenant.name}</p>
                    </div>
                    <div className="w-32">
                      <input 
                        type="number"
                        value={payments[index]?.amount || 0}
                        onChange={(e) => updatePayment(index, 'amount', Number(e.target.value))}
                        className="input-field"
                        placeholder="Amount"
                      />
                    </div>
                    <div className="w-32">
                      <select 
                        value={payments[index]?.status || 'pending'}
                        onChange={(e) => updatePayment(index, 'status', e.target.value)}
                        className="input-field"
                      >
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="partial">Partial</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No active tenants. Add tenants first.</p>
            )}
          </div>

          {/* Expense Particulars */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="section-header mb-0">Expense Particulars</h2>
              <button type="button" onClick={addParticular} className="btn-secondary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {particulars.length > 0 ? (
              <div className="space-y-4">
                {particulars.map((particular, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="label">Item Name</label>
                        <input 
                          type="text"
                          value={particular.item_name}
                          onChange={(e) => updateParticular(index, 'item_name', e.target.value)}
                          className="input-field"
                          required
                        />
                      </div>

                      <div>
                        <label className="label">Price</label>
                        <input 
                          type="number"
                          value={particular.price}
                          onChange={(e) => updateParticular(index, 'price', Number(e.target.value))}
                          className="input-field"
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
                          <span className="text-sm">{particular.receipt_url ? 'Uploaded' : 'Upload'}</span>
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
                      />
                    </div>

                    <button 
                      type="button"
                      onClick={() => removeParticular(index)}
                      className="btn-danger flex items-center gap-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No expense items yet. Click "Add Item" to add.</p>
            )}
          </div>

          {/* Grand Total */}
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Grand Total</h2>
              <p className="text-3xl font-bold text-blue-600">₹{grandTotal.toFixed(2)}</p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button type="submit" className="btn-primary flex-1" disabled={createMaintenance.isPending}>
              {createMaintenance.isPending ? 'Creating...' : 'Create Record'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

"use client"
import { useState } from 'react'
import { useTenants, useCreateTenant, useUpdateTenant, useDeleteTenant, useCreateTenantAccount } from '@/lib/hooks'
import { Plus, Edit, Trash2, UserPlus, Mail, Phone, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TenantsPage() {
  const { data: tenants, isLoading } = useTenants()
  const createTenant = useCreateTenant()
  const updateTenant = useUpdateTenant()
  const deleteTenant = useDeleteTenant()
  const createAccount = useCreateTenantAccount()

  const [showModal, setShowModal] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', status: 'active' as 'active' | 'inactive' })
  const [accountData, setAccountData] = useState({ password: '', confirmPassword: '' })

  function handleAdd() {
    setSelectedTenant(null)
    setFormData({ name: '', phone: '', email: '', status: 'active' })
    setShowModal(true)
  }

  function handleEdit(tenant: any) {
    setSelectedTenant(tenant)
    setFormData({ name: tenant.name, phone: tenant.phone, email: tenant.email, status: tenant.status })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (selectedTenant) {
      await updateTenant.mutateAsync({ id: selectedTenant.id, updates: formData })
    } else {
      await createTenant.mutateAsync(formData)
    }

    setShowModal(false)
  }

  async function handleDelete(id: string) {
    if (confirm('Deactivate this tenant?')) {
      await deleteTenant.mutateAsync(id)
    }
  }

  function handleCreateAccount(tenant: any) {
    setSelectedTenant(tenant)
    setAccountData({ password: '', confirmPassword: '' })
    setShowAccountModal(true)
  }

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (accountData.password !== accountData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (accountData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    await createAccount.mutateAsync({
      tenantId: selectedTenant.id,
      email: selectedTenant.email,
      password: accountData.password
    })

    setShowAccountModal(false)
  }

  const activeTenants = tenants?.filter(t => t.status === 'active') || []
  const canAddMore = activeTenants.length < 5

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="page-header">Tenants Management</h1>
            <p className="text-gray-600">Active: {activeTenants.length} / 5 Maximum</p>
          </div>
          <button 
            onClick={handleAdd} 
            className="btn-primary flex items-center gap-2"
            disabled={!canAddMore}
          >
            <Plus className="w-5 h-5" />
            Add Tenant
          </button>
        </div>

        {!canAddMore && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">⚠️ Maximum 5 active tenants reached. Deactivate a tenant to add new ones.</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : tenants && tenants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tenants.map((tenant) => (
              <div key={tenant.id} className={`card ${tenant.status === 'inactive' ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{tenant.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {tenant.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(tenant)} className="p-2 hover:bg-blue-100 rounded-lg">
                      <Edit className="w-5 h-5 text-blue-600" />
                    </button>
                    {tenant.status === 'active' && (
                      <button onClick={() => handleDelete(tenant.id)} className="p-2 hover:bg-red-100 rounded-lg">
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {tenant.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{tenant.phone}</span>
                    </div>
                  )}
                  {tenant.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{tenant.email}</span>
                    </div>
                  )}
                </div>

                {tenant.email && tenant.status === 'active' && (
                  <button 
                    onClick={() => handleCreateAccount(tenant)}
                    className="w-full btn-secondary flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Create Login Account
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No tenants yet. Add your first tenant!</p>
            <button onClick={handleAdd} className="btn-primary">Add First Tenant</button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">{selectedTenant ? 'Edit Tenant' : 'Add Tenant'}</h2>
                  <button onClick={() => setShowModal(false)}>
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Name *</label>
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Phone</label>
                    <input 
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label">Email</label>
                    <input 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="label">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                      className="input-field"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1">
                      {selectedTenant ? 'Update' : 'Add'} Tenant
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Create Account Modal */}
        {showAccountModal && selectedTenant && (
          <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
            <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Create Login Account</h2>
                <p className="text-gray-600 mb-6">
                  Create permanent login for: <strong>{selectedTenant.name}</strong><br/>
                  Email: <strong>{selectedTenant.email}</strong>
                </p>

                <form onSubmit={handleAccountSubmit} className="space-y-4">
                  <div>
                    <label className="label">Password *</label>
                    <input 
                      type="password"
                      value={accountData.password}
                      onChange={(e) => setAccountData({...accountData, password: e.target.value})}
                      className="input-field"
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Confirm Password *</label>
                    <input 
                      type="password"
                      value={accountData.confirmPassword}
                      onChange={(e) => setAccountData({...accountData, confirmPassword: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      ℹ️ The tenant can login with their email and this password permanently.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1">Create Account</button>
                    <button type="button" onClick={() => setShowAccountModal(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

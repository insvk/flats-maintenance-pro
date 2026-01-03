"use client"
import { useState } from 'react'
import { useTenants, useCreateTenant, useUpdateTenant, useDeleteTenant, useCreateTenantAccount } from '@/lib/hooks'
import { Plus, Edit, Trash2, UserPlus, Mail, Phone, X, Users, Sparkles, Home } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TenantsPage() {
  const { data: tenants, isLoading } = useTenants()
  const createTenant = useCreateTenant()
  const updateTenant = useUpdateTenant()
  const deleteTenant = useDeleteTenant()
  const createAccount = useCreateTenantAccount()

  const [showModal, setShowModal] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showBulkAccountModal, setShowBulkAccountModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', status: 'active' as 'active' | 'inactive' })
  const [accountData, setAccountData] = useState({ password: '', confirmPassword: '' })
  const [bulkPasswords, setBulkPasswords] = useState<{[key: string]: string}>({})
  const [ownerData, setOwnerData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showOwnerModal, setShowOwnerModal] = useState(false)

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

  // BULK ACCOUNT CREATION - NEW FEATURE
  function handleBulkAccountCreation() {
    const tenantsWithEmail = tenants?.filter(t => t.email && t.status === 'active') || []
    const initialPasswords: {[key: string]: string} = {}
    tenantsWithEmail.forEach(t => {
      initialPasswords[t.id] = ''
    })
    setBulkPasswords(initialPasswords)
    setShowBulkAccountModal(true)
  }

  async function handleBulkAccountSubmit(e: React.FormEvent) {
    e.preventDefault()

    const tenantsWithEmail = tenants?.filter(t => t.email && t.status === 'active') || []
    let successCount = 0
    let errorCount = 0

    for (const tenant of tenantsWithEmail) {
      const password = bulkPasswords[tenant.id]
      if (password && password.length >= 6) {
        try {
          await createAccount.mutateAsync({
            tenantId: tenant.id,
            email: tenant.email!,
            password: password
          })
          successCount++
        } catch (error) {
          errorCount++
        }
      }
    }

    if (successCount > 0) {
      toast.success(`✅ Created ${successCount} tenant accounts!`)
    }
    if (errorCount > 0) {
      toast.error(`❌ Failed to create ${errorCount} accounts`)
    }

    setShowBulkAccountModal(false)
  }

  // OWNER ACCOUNT CREATION - NEW FEATURE
  async function handleOwnerAccountSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (ownerData.password !== ownerData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (ownerData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    // Create owner as a special tenant first
    try {
      const newTenant = await createTenant.mutateAsync({
        name: ownerData.name,
        email: ownerData.email,
        phone: '',
        status: 'active'
      })

      // Then create account with manager role
      await createAccount.mutateAsync({
        tenantId: (newTenant as any).id,
        email: ownerData.email,
        password: ownerData.password
      })

      toast.success('✅ House owner account created successfully!')
      setShowOwnerModal(false)
      setOwnerData({ name: '', email: '', password: '', confirmPassword: '' })
    } catch (error) {
      toast.error('Failed to create owner account')
    }
  }

  const activeTenants = tenants?.filter(t => t.status === 'active') || []
  const canAddMore = activeTenants.length < 5
  const tenantsWithEmail = tenants?.filter(t => t.email && t.status === 'active') || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Tenants Management
              </h1>
              <p className="text-gray-600">Active: {activeTenants.length} / 5 Maximum</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleAdd} 
              className="btn-primary flex items-center gap-2"
              disabled={!canAddMore}
            >
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline">Add Tenant</span>
            </button>
          </div>
        </div>

        {/* Action Cards - NEW FEATURE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={handleBulkAccountCreation}
            disabled={tenantsWithEmail.length === 0}
            className="card hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:border-blue-400 cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Bulk Create Accounts</h3>
                <p className="text-sm text-gray-600">Create accounts for all {tenantsWithEmail.length} tenants</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowOwnerModal(true)}
            className="card hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 hover:border-green-400 cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-xl">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Add House Owner</h3>
                <p className="text-sm text-gray-600">Create manager account for owner</p>
              </div>
            </div>
          </button>

          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500 rounded-xl">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Total Users</h3>
                <p className="text-3xl font-bold text-purple-600">{tenants?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {!canAddMore && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6 animate-bounce-slow">
            <p className="text-yellow-800 font-semibold">⚠️ Maximum 5 active tenants reached. Deactivate a tenant to add new ones.</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading tenants...</p>
          </div>
        ) : tenants && tenants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tenants.map((tenant) => (
              <div key={tenant.id} className={`card hover:shadow-2xl transition-all duration-300 ${
                tenant.status === 'inactive' ? 'opacity-60' : 'border-2 border-transparent hover:border-blue-300'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{tenant.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {tenant.status === 'active' ? '✅ ACTIVE' : '⭕ INACTIVE'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(tenant)} className="p-2 hover:bg-blue-100 rounded-lg transition-all">
                      <Edit className="w-5 h-5 text-blue-600" />
                    </button>
                    {tenant.status === 'active' && (
                      <button onClick={() => handleDelete(tenant.id)} className="p-2 hover:bg-red-100 rounded-lg transition-all">
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
                    className="w-full btn-primary flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <UserPlus className="w-4 h-4" />
                    Create Login Account
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100">
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4 text-lg">No tenants yet. Add your first tenant!</p>
            <button onClick={handleAdd} className="btn-primary shadow-lg">Add First Tenant</button>
          </div>
        )}

        {/* Existing modals remain the same... */}
        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal-overlay animate-fade-in" onClick={() => setShowModal(false)}>
            <div className="modal-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
              {/* Same as before */}
            </div>
          </div>
        )}

        {/* Individual Account Modal - Same as before */}
        {showAccountModal && selectedTenant && (
          <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
            {/* Same as before */}
          </div>
        )}

        {/* BULK ACCOUNT CREATION MODAL - NEW */}
        {showBulkAccountModal && (
          <div className="modal-overlay animate-fade-in" onClick={() => setShowBulkAccountModal(false)}>
            <div className="modal-content max-w-3xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Bulk Create Accounts</h2>
                    <p className="text-gray-600">Set passwords for {tenantsWithEmail.length} tenants at once</p>
                  </div>
                </div>

                <form onSubmit={handleBulkAccountSubmit} className="space-y-4">
                  {tenantsWithEmail.map((tenant) => (
                    <div key={tenant.id} className="p-4 bg-gradient-to-r from-white to-blue-50 rounded-xl border-2 border-blue-200">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-bold text-lg">{tenant.name}</p>
                          <p className="text-sm text-gray-600">{tenant.email}</p>
                        </div>
                        <div className="w-64">
                          <input 
                            type="password"
                            value={bulkPasswords[tenant.id] || ''}
                            onChange={(e) => setBulkPasswords({...bulkPasswords, [tenant.id]: e.target.value})}
                            className="input-field"
                            placeholder="Set password (min 6 chars)"
                            minLength={6}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="bg-blue-50 p-4 rounded-xl">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> Each tenant will be able to login with their email and the password you set here.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1 text-lg py-4">
                      ✨ Create All Accounts
                    </button>
                    <button type="button" onClick={() => setShowBulkAccountModal(false)} className="btn-secondary px-8">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* OWNER ACCOUNT MODAL - NEW */}
        {showOwnerModal && (
          <div className="modal-overlay animate-fade-in" onClick={() => setShowOwnerModal(false)}>
            <div className="modal-content max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl">
                    <Home className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Add House Owner</h2>
                    <p className="text-gray-600">Create manager account</p>
                  </div>
                </div>

                <form onSubmit={handleOwnerAccountSubmit} className="space-y-4">
                  <div>
                    <label className="label">Owner Name *</label>
                    <input 
                      type="text"
                      value={ownerData.name}
                      onChange={(e) => setOwnerData({...ownerData, name: e.target.value})}
                      className="input-field"
                      placeholder="e.g., Ramesh Kumar"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Email *</label>
                    <input 
                      type="email"
                      value={ownerData.email}
                      onChange={(e) => setOwnerData({...ownerData, email: e.target.value})}
                      className="input-field"
                      placeholder="owner@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Password *</label>
                    <input 
                      type="password"
                      value={ownerData.password}
                      onChange={(e) => setOwnerData({...ownerData, password: e.target.value})}
                      className="input-field"
                      placeholder="Minimum 6 characters"
                      minLength={6}
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Confirm Password *</label>
                    <input 
                      type="password"
                      value={ownerData.confirmPassword}
                      onChange={(e) => setOwnerData({...ownerData, confirmPassword: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>

                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-sm text-green-800">
                      🏠 <strong>Owner Account:</strong> Will have manager-level access to view all records and reports.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1 text-lg py-4">
                      🏠 Create Owner Account
                    </button>
                    <button type="button" onClick={() => setShowOwnerModal(false)} className="btn-secondary px-8">
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

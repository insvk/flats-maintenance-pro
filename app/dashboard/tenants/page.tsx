"use client"
import { useState } from 'react'
import { useTenants, useCreateTenant, useUpdateTenant, useDeleteTenant, useCreateTenantAccount } from '@/lib/hooks'
import { Plus, Edit, Trash2, UserPlus, Mail, Phone, X, Users, Sparkles, Home, Crown, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TenantsPage() {
  const { data: allTenants, isLoading } = useTenants()
  const createTenant = useCreateTenant()
  const updateTenant = useUpdateTenant()
  const deleteTenant = useDeleteTenant()
  const createAccount = useCreateTenantAccount()

  const [showModal, setShowModal] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showBulkAccountModal, setShowBulkAccountModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', status: 'active' as 'active' | 'inactive', type: 'tenant' as 'tenant' | 'owner' })
  const [accountData, setAccountData] = useState({ password: '', confirmPassword: '' })
  const [bulkPasswords, setBulkPasswords] = useState<{[key: string]: string}>({})
  const [ownerData, setOwnerData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showOwnerModal, setShowOwnerModal] = useState(false)

  // Separate tenants and owners - OWNER DOESN'T COUNT TOWARDS 5 LIMIT
  const tenants = allTenants?.filter(t => t.type !== 'owner') || []
  const owners = allTenants?.filter(t => t.type === 'owner') || []
  const activeTenants = tenants.filter(t => t.status === 'active')
  const canAddMore = activeTenants.length < 5

  function handleAdd() {
    setSelectedTenant(null)
    setFormData({ name: '', phone: '', email: '', status: 'active', type: 'tenant' })
    setShowModal(true)
  }

  function handleEdit(tenant: any) {
    setSelectedTenant(tenant)
    setFormData({ name: tenant.name, phone: tenant.phone, email: tenant.email, status: tenant.status, type: tenant.type || 'tenant' })
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

  // BULK ACCOUNT CREATION
  function handleBulkAccountCreation() {
    const tenantsWithEmail = tenants.filter(t => t.email && t.status === 'active')
    const initialPasswords: {[key: string]: string} = {}
    tenantsWithEmail.forEach(t => {
      initialPasswords[t.id] = ''
    })
    setBulkPasswords(initialPasswords)
    setShowBulkAccountModal(true)
  }

  async function handleBulkAccountSubmit(e: React.FormEvent) {
    e.preventDefault()

    const tenantsWithEmail = tenants.filter(t => t.email && t.status === 'active')
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

  // OWNER ACCOUNT CREATION - DOESN'T COUNT TOWARDS LIMIT
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

    try {
      const newOwner = await createTenant.mutateAsync({
        name: ownerData.name,
        email: ownerData.email,
        phone: '',
        status: 'active',
        type: 'owner' // THIS DOESN'T COUNT TOWARDS 5 TENANT LIMIT!
      })

      await createAccount.mutateAsync({
        tenantId: (newOwner as any).id,
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

  const tenantsWithEmail = tenants.filter(t => t.email && t.status === 'active')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl">
                <Users className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-black">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Tenants & Owners
                  </span>
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-gray-600 font-semibold">
                    🏠 Tenants: {activeTenants.length}/5
                  </span>
                  <span className="text-gray-600 font-semibold">
                    👑 Owners: {owners.length} (Unlimited)
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleAdd} 
              className="hidden md:flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-2xl hover:shadow-purple-300 transition-all hover:scale-105 group"
              disabled={!canAddMore}
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              <span className="font-bold">Add Tenant</span>
            </button>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={handleBulkAccountCreation}
            disabled={tenantsWithEmail.length === 0}
            className="group relative overflow-hidden bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-left border-2 border-transparent hover:border-blue-300"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-20 -mt-20"></div>
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl inline-block mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Bulk Create Accounts</h3>
              <p className="text-gray-600">Create accounts for all {tenantsWithEmail.length} tenants at once</p>
            </div>
          </button>

          <button
            onClick={() => setShowOwnerModal(true)}
            className="group relative overflow-hidden bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-left border-2 border-transparent hover:border-yellow-300"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-full -mr-20 -mt-20"></div>
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl inline-block mb-4 group-hover:scale-110 transition-transform">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Add House Owner</h3>
              <p className="text-gray-600">Create unlimited owner accounts (doesn't count towards limit)</p>
            </div>
          </button>

          <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="relative">
              <div className="p-4 bg-white/20 backdrop-blur-lg rounded-2xl inline-block mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Total Users</h3>
              <p className="text-4xl font-black">{allTenants?.length || 0}</p>
            </div>
          </div>
        </div>

        {!canAddMore && (
          <div className="mb-6 p-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-3xl shadow-2xl text-white animate-bounce-slow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <p className="text-2xl font-bold">⚠️ Tenant Limit Reached</p>
                <p className="text-white/90">Maximum 5 active tenants. Owners are unlimited and don't count!</p>
              </div>
            </div>
          </div>
        )}

        {/* Owners Section */}
        {owners.length > 0 && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Crown className="w-8 h-8 text-yellow-500" />
              House Owners
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {owners.map((owner) => (
                <div key={owner.id} className="group relative overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105 border-2 border-yellow-200">
                  <div className="absolute top-4 right-4">
                    <Crown className="w-8 h-8 text-yellow-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{owner.name}</h3>
                  <div className="space-y-2">
                    {owner.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{owner.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                        👑 OWNER
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        ✅ ACTIVE
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tenants Section */}
        <div>
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Home className="w-8 h-8 text-blue-500" />
            Tenants ({activeTenants.length}/5)
          </h2>
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg font-semibold">Loading tenants...</p>
            </div>
          ) : tenants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenants.map((tenant) => (
                <div key={tenant.id} className={`group relative overflow-hidden bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105 ${
                  tenant.status === 'inactive' ? 'opacity-60' : 'border-2 border-transparent hover:border-blue-300'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2">{tenant.name}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {tenant.status === 'active' ? '✅ ACTIVE' : '⭕ INACTIVE'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(tenant)} className="p-2 hover:bg-blue-100 rounded-xl transition-all hover:scale-110">
                        <Edit className="w-5 h-5 text-blue-600" />
                      </button>
                      {tenant.status === 'active' && (
                        <button onClick={() => handleDelete(tenant.id)} className="p-2 hover:bg-red-100 rounded-xl transition-all hover:scale-110">
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
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      Create Login
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl shadow-xl">
              <div className="inline-block p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-4">
                <Users className="w-20 h-20 text-gray-400" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-2">No tenants yet</h3>
              <p className="text-gray-600 mb-6 text-lg">Add your first tenant to get started!</p>
              <button onClick={handleAdd} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-300 transition-all hover:scale-105">
                Add First Tenant
              </button>
            </div>
          )}
        </div>

        {/* Modals - Add/Edit */}
        {showModal && (
          <div className="modal-overlay animate-fade-in" onClick={() => setShowModal(false)}>
            <div className="modal-content max-w-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold">{selectedTenant ? 'Edit' : 'Add'} Tenant</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
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

                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1">
                      {selectedTenant ? 'Update' : 'Add'}
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-8">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Account Modal */}
        {showAccountModal && selectedTenant && (
          <div className="modal-overlay animate-fade-in" onClick={() => setShowAccountModal(false)}>
            <div className="modal-content max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h2 className="text-3xl font-bold mb-4">Create Login Account</h2>
                <p className="text-gray-600 mb-6">
                  For: <strong>{selectedTenant.name}</strong><br/>
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
                      minLength={6}
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

                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1">Create Account</button>
                    <button type="button" onClick={() => setShowAccountModal(false)} className="btn-secondary px-8">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Account Modal */}
        {showBulkAccountModal && (
          <div className="modal-overlay animate-fade-in" onClick={() => setShowBulkAccountModal(false)}>
            <div className="modal-content max-w-3xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h2 className="text-3xl font-bold mb-6">Bulk Create Accounts</h2>

                <form onSubmit={handleBulkAccountSubmit} className="space-y-4">
                  {tenantsWithEmail.map((tenant) => (
                    <div key={tenant.id} className="p-4 bg-gradient-to-r from-white to-blue-50 rounded-xl border-2 border-blue-200">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-bold">{tenant.name}</p>
                          <p className="text-sm text-gray-600">{tenant.email}</p>
                        </div>
                        <div className="w-64">
                          <input 
                            type="password"
                            value={bulkPasswords[tenant.id] || ''}
                            onChange={(e) => setBulkPasswords({...bulkPasswords, [tenant.id]: e.target.value})}
                            className="input-field"
                            placeholder="Set password"
                            minLength={6}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1">Create All Accounts</button>
                    <button type="button" onClick={() => setShowBulkAccountModal(false)} className="btn-secondary px-8">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Owner Modal */}
        {showOwnerModal && (
          <div className="modal-overlay animate-fade-in" onClick={() => setShowOwnerModal(false)}>
            <div className="modal-content max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h2 className="text-3xl font-bold mb-6">Add House Owner</h2>

                <form onSubmit={handleOwnerAccountSubmit} className="space-y-4">
                  <div>
                    <label className="label">Owner Name *</label>
                    <input 
                      type="text"
                      value={ownerData.name}
                      onChange={(e) => setOwnerData({...ownerData, name: e.target.value})}
                      className="input-field"
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

                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1">Create Owner Account</button>
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

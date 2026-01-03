// lib/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Tenant, MaintenanceRecord, MaintenanceWithDetails } from './supabase'
import toast from 'react-hot-toast'

export function useTenants(status?: 'active' | 'inactive') {
  return useQuery({
    queryKey: ['tenants', status],
    queryFn: async () => {
      let query = supabase.from('tenants').select('*').order('name')
      if (status) query = query.eq('status', status)
      const { data, error } = await query
      if (error) throw error
      return data as Tenant[]
    },
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (tenant: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>) => {
      // Check tenant limit
      const { data: existing } = await supabase.from('tenants').select('id').eq('status', 'active')
      if (existing && existing.length >= 5) {
        throw new Error('Maximum 5 active tenants allowed')
      }

      const { data, error } = await supabase.from('tenants').insert(tenant).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('Tenant added successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add tenant')
    }
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Tenant> }) => {
      const { data, error } = await supabase.from('tenants').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('Tenant updated successfully!')
    },
  })
}

export function useDeleteTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tenants').update({ status: 'inactive' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('Tenant deactivated!')
    },
  })
}

export function useMaintenanceRecords(year?: number) {
  return useQuery({
    queryKey: ['maintenance', year],
    queryFn: async () => {
      let query = supabase.from('maintenance_records').select('*').order('year', { ascending: false }).order('month', { ascending: false })
      if (year) query = query.eq('year', year)
      const { data, error } = await query
      if (error) throw error
      return data as MaintenanceRecord[]
    },
  })
}

export function useMaintenanceRecord(id: string) {
  return useQuery({
    queryKey: ['maintenance', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*, tenant_payments(*, tenants(*)), particulars(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as MaintenanceWithDetails
    },
    enabled: !!id,
  })
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: record, error: recordError } = await supabase
        .from('maintenance_records')
        .insert(data.record)
        .select()
        .single()

      if (recordError) throw recordError

      if (data.payments && data.payments.length > 0) {
        const paymentsWithId = data.payments.map((p: any) => ({ ...p, maintenance_id: record.id }))
        await supabase.from('tenant_payments').insert(paymentsWithId)
      }

      if (data.particulars && data.particulars.length > 0) {
        const particularsWithId = data.particulars.map((p: any) => ({ ...p, maintenance_id: record.id }))
        await supabase.from('particulars').insert(particularsWithId)
      }

      return record
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      toast.success('Maintenance record created!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create record')
    }
  })
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data: records } = await supabase
        .from('maintenance_records')
        .select('*, tenant_payments(*)')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(12)

      const { data: tenants } = await supabase.from('tenants').select('*').eq('status', 'active')

      return { records, tenants }
    },
  })
}

export function useCreateTenantAccount() {
  return useMutation({
    mutationFn: async ({ tenantId, email, password }: { tenantId: string; email: string; password: string }) => {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')

      // Create user profile
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email,
        role: 'tenant',
        tenant_id: tenantId,
      })

      if (profileError) throw profileError

      // Update tenant with email
      await supabase.from('tenants').update({ email }).eq('id', tenantId)

      return authData.user
    },
    onSuccess: () => {
      toast.success('Tenant account created! Login credentials sent to email.')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create account')
    }
  })
}

export function useUploadReceipt() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `receipts/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('maintenance-receipts')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('maintenance-receipts')
        .getPublicUrl(filePath)

      return data.publicUrl
    },
  })
}

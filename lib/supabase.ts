// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Tenant {
  id: string
  name: string
  phone: string
  email: string
  status: 'active' | 'inactive'
  type?: 'tenant' | 'owner'  // ← ADDED THIS LINE FOR UNLIMITED OWNERS!
  created_at: string
  updated_at: string
}

export interface MaintenanceRecord {
  id: string
  month: number
  year: number
  grand_total: number
  collector_name: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface TenantPayment {
  id: string
  maintenance_id: string
  tenant_id: string
  amount: number
  status: 'paid' | 'pending' | 'partial'
  payment_date?: string
  created_at: string
  tenant?: Tenant
}

export interface Particular {
  id: string
  maintenance_id: string
  item_name: string
  price: number
  type: 'service' | 'product'
  receipt_url?: string
  description?: string
  created_at: string
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'manager' | 'tenant'
  tenant_id?: string
  created_at: string
}

export interface MaintenanceWithDetails extends MaintenanceRecord {
  tenant_payments: TenantPayment[]
  particulars: Particular[]
}

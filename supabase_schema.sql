-- Flats Maintenance Pro - Complete Database Schema
-- Run in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'manager', 'tenant')) DEFAULT 'tenant',
  tenant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month INTEGER CHECK (month BETWEEN 1 AND 12) NOT NULL,
  year INTEGER CHECK (year >= 2020) NOT NULL,
  grand_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  collector_name TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(month, year)
);

CREATE TABLE public.tenant_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maintenance_id UUID REFERENCES public.maintenance_records(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('paid', 'pending', 'partial')) DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(maintenance_id, tenant_id)
);

CREATE TABLE public.particulars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maintenance_id UUID REFERENCES public.maintenance_records(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  type TEXT CHECK (type IN ('service', 'product')) NOT NULL,
  receipt_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_maintenance_month_year ON public.maintenance_records(year DESC, month DESC);
CREATE INDEX idx_tenant_payments_maintenance ON public.tenant_payments(maintenance_id);
CREATE INDEX idx_particulars_maintenance ON public.particulars(maintenance_id);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.particulars ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read tenants" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "Admin manage tenants" ON public.tenants FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public read maintenance" ON public.maintenance_records FOR SELECT USING (true);
CREATE POLICY "Admin manage maintenance" ON public.maintenance_records FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Public read payments" ON public.tenant_payments FOR SELECT USING (true);
CREATE POLICY "Admin manage payments" ON public.tenant_payments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Public read particulars" ON public.particulars FOR SELECT USING (true);
CREATE POLICY "Admin manage particulars" ON public.particulars FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Create admin: UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';

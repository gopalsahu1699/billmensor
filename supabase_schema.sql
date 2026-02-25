-- ============================================================
-- BillMensor – Supabase Database Schema
-- Matches exact table & column names used in the application
-- Run this in Supabase SQL Editor (safe: uses IF NOT EXISTS)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES  (extends auth.users 1-to-1)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  company_name TEXT,
  full_name TEXT,
  designation TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  gstin TEXT,
  website TEXT,
  business_type TEXT,
  industry_type TEXT,
  place_of_supply TEXT,
  terms_and_conditions TEXT,
  logo_url TEXT,
  signature_url TEXT,

  -- Custom print fields
  custom_field_1_label TEXT,
  custom_field_1_value TEXT,
  custom_field_2_label TEXT,
  custom_field_2_value TEXT,
  custom_field_3_label TEXT,
  custom_field_3_value TEXT,

  -- Print / display settings
  print_template TEXT DEFAULT 'modern',
  show_transport BOOLEAN DEFAULT true,
  show_installation BOOLEAN DEFAULT true,
  show_bank_details BOOLEAN DEFAULT true,
  show_upi_qr BOOLEAN DEFAULT true,
  show_terms BOOLEAN DEFAULT true,
  show_signature BOOLEAN DEFAULT true,
  show_custom_fields BOOLEAN DEFAULT true,

  -- Branding items
  brand_color TEXT DEFAULT '#2563eb', -- blue-600
  accent_color TEXT DEFAULT '#1e293b', -- slate-800
  font_family TEXT DEFAULT 'Inter',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Subscription fields
  plan_type TEXT DEFAULT 'free', -- 'free' | 'monthly' | 'yearly'
  plan_status TEXT DEFAULT 'active', -- 'active' | 'expired' | 'canceled'
  plan_expiry TIMESTAMPTZ,
  razorpay_customer_id TEXT,
  last_payment_id TEXT
);

-- ─────────────────────────────────────────────────────────────
-- 2. COMPANY BANK DETAILS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_bank_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  account_number TEXT,
  account_holder_name TEXT,
  ifsc_code TEXT,
  bank_branch_name TEXT,
  upi_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 3. CUSTOMERS  (also used as suppliers via `type` field)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  supply_place TEXT,
  gstin TEXT,
  type TEXT DEFAULT 'customer',   -- 'customer' | 'supplier' | 'both'
  opening_balance DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 4. PRODUCTS / SERVICES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  hsn_code TEXT,
  description TEXT,
  price DECIMAL(15,2) DEFAULT 0,
  purchase_price DECIMAL(15,2) DEFAULT 0,
  wholesale_price DECIMAL(15,2) DEFAULT 0,
  mrp DECIMAL(15,2) DEFAULT 0,
  tax_rate DECIMAL(15,2) DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  item_type TEXT DEFAULT 'product',
  image_url TEXT,
  stock_quantity DECIMAL(15,2) DEFAULT 0,
  opening_stock_value DECIMAL(15,2) DEFAULT 0,
  min_stock_level DECIMAL(15,2) DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 5. INVOICES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT DEFAULT 'draft',          -- 'draft' | 'sent' | 'paid' | 'void'
  payment_status TEXT DEFAULT 'unpaid', -- 'unpaid' | 'partially_paid' | 'paid' | 'overdue'
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_total DECIMAL(15,2) DEFAULT 0,
  cgst_total DECIMAL(15,2) DEFAULT 0,
  sgst_total DECIMAL(15,2) DEFAULT 0,
  igst_total DECIMAL(15,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  round_off DECIMAL(15,2) DEFAULT 0,
  transport_charges DECIMAL(15,2) DEFAULT 0,
  installation_charges DECIMAL(15,2) DEFAULT 0,
  custom_charges JSONB DEFAULT '[]',
  gst_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  amount_paid DECIMAL(15,2) DEFAULT 0,
  balance_amount DECIMAL(15,2) DEFAULT 0,
  is_pos BOOLEAN DEFAULT false,
  billing_address TEXT,
  shipping_address TEXT,
  supply_place TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 6. INVOICE ITEMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.invoices ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products ON DELETE SET NULL,
  name TEXT NOT NULL,
  hsn_code TEXT,
  quantity DECIMAL(15,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(15,2) DEFAULT 0,
  cgst DECIMAL(15,2) DEFAULT 0,
  sgst DECIMAL(15,2) DEFAULT 0,
  igst DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 7. QUOTATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers ON DELETE SET NULL,
  quotation_number TEXT NOT NULL,
  quotation_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_total DECIMAL(15,2) DEFAULT 0,
  cgst_total DECIMAL(15,2) DEFAULT 0,
  sgst_total DECIMAL(15,2) DEFAULT 0,
  igst_total DECIMAL(15,2) DEFAULT 0,
  transport_charges DECIMAL(15,2) DEFAULT 0,
  installation_charges DECIMAL(15,2) DEFAULT 0,
  custom_charges JSONB DEFAULT '[]',
  discount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',  -- 'pending' | 'accepted' | 'rejected' | 'invoiced'
  billing_address TEXT,
  shipping_address TEXT,
  supply_place TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 8. QUOTATION ITEMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  quotation_id UUID REFERENCES public.quotations ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products ON DELETE SET NULL,
  name TEXT NOT NULL,
  hsn_code TEXT,
  quantity DECIMAL(15,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(15,2) DEFAULT 0,
  cgst DECIMAL(15,2) DEFAULT 0,
  sgst DECIMAL(15,2) DEFAULT 0,
  igst DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 9. PURCHASES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.customers ON DELETE SET NULL,
  purchase_number TEXT NOT NULL,
  purchase_date DATE DEFAULT CURRENT_DATE,
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_total DECIMAL(15,2) DEFAULT 0,
  cgst_total DECIMAL(15,2) DEFAULT 0,
  sgst_total DECIMAL(15,2) DEFAULT 0,
  igst_total DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid',
  status TEXT DEFAULT 'draft',
  billing_address TEXT,
  shipping_address TEXT,
  supply_place TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 10. PURCHASE ITEMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  purchase_id UUID REFERENCES public.purchases ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products ON DELETE SET NULL,
  name TEXT NOT NULL,
  hsn_code TEXT,
  quantity DECIMAL(15,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  cgst DECIMAL(15,2) DEFAULT 0,
  sgst DECIMAL(15,2) DEFAULT 0,
  igst DECIMAL(15,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 11. RETURNS  (sales returns & purchase returns)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers ON DELETE SET NULL,
  return_number TEXT NOT NULL,
  return_date DATE DEFAULT CURRENT_DATE,
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_total DECIMAL(15,2) DEFAULT 0,
  cgst_total DECIMAL(15,2) DEFAULT 0,
  sgst_total DECIMAL(15,2) DEFAULT 0,
  igst_total DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  type TEXT NOT NULL,  -- 'sales_return' | 'purchase_return'
  status TEXT DEFAULT 'draft',
  billing_address TEXT,
  shipping_address TEXT,
  supply_place TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 12. RETURN ITEMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.return_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  return_id UUID REFERENCES public.returns ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(15,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  cgst DECIMAL(15,2) DEFAULT 0,
  sgst DECIMAL(15,2) DEFAULT 0,
  igst DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 13. PAYMENTS  (payments-in and payments-out)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices ON DELETE SET NULL,
  payment_number TEXT NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  amount DECIMAL(15,2) DEFAULT 0,
  type TEXT NOT NULL,              -- 'payment_in' | 'payment_out'
  payment_mode TEXT DEFAULT 'cash', -- 'cash' | 'bank' | 'upi' | 'cheque'
  reference_number TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  supply_place TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 14. EXPENSES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  amount DECIMAL(15,2) DEFAULT 0,
  expense_date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 15. DELIVERY CHALLANS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.delivery_challans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers ON DELETE SET NULL,
  challan_number TEXT NOT NULL,
  challan_date DATE DEFAULT CURRENT_DATE,
  items JSONB DEFAULT '[]',
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_total DECIMAL(15,2) DEFAULT 0,
  cgst_total DECIMAL(15,2) DEFAULT 0,
  sgst_total DECIMAL(15,2) DEFAULT 0,
  igst_total DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',   -- 'pending' | 'delivered' | 'invoiced' | 'cancelled'
  billing_address TEXT,
  shipping_address TEXT,
  supply_place TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 16. STOCK ADJUSTMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products ON DELETE CASCADE NOT NULL,
  adjustment_type TEXT NOT NULL,  -- 'add' | 'reduce'
  quantity DECIMAL(15,2) NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 17. RPC FUNCTIONS  (stock management)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_stock(pid UUID, qty DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity + qty
  WHERE id = pid AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_stock(pid UUID, qty DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - qty
  WHERE id = pid AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 18. NEW USER TRIGGER  (auto-create profile on signup)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 19. ROW LEVEL SECURITY  (each user sees only their own data)
-- ─────────────────────────────────────────────────────────────

-- Profiles (uses `id` = user_id)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id);

-- All other tables (use `user_id`)
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'company_bank_details', 'customers', 'products',
    'invoices', 'invoice_items',
    'quotations', 'quotation_items',
    'purchases', 'purchase_items',
    'returns', 'return_items',
    'payments', 'expenses',
    'delivery_challans', 'stock_adjustments'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_own" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s_own" ON public.%I FOR ALL USING (auth.uid() = user_id)',
      t, t
    );
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 20. MIGRATION: add image_url to existing tables if missing
--     (safe to run on an existing database)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.invoice_items  ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Migration for payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS supply_place TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────
-- 21. MIGRATION: add GST fields missing from existing instances
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS cgst DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS sgst DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS igst DECIMAL(15,2) DEFAULT 0;

ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS cgst DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS sgst DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.quotation_items ADD COLUMN IF NOT EXISTS igst DECIMAL(15,2) DEFAULT 0;

ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS cgst DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS sgst DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS igst DECIMAL(15,2) DEFAULT 0;

ALTER TABLE public.return_items ADD COLUMN IF NOT EXISTS cgst DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.return_items ADD COLUMN IF NOT EXISTS sgst DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.return_items ADD COLUMN IF NOT EXISTS igst DECIMAL(15,2) DEFAULT 0;

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS cgst_total DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS sgst_total DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS igst_total DECIMAL(15,2) DEFAULT 0;

ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS cgst_total DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS sgst_total DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS igst_total DECIMAL(15,2) DEFAULT 0;

ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS cgst_total DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS sgst_total DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS igst_total DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS discount DECIMAL(15,2) DEFAULT 0;

ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS cgst_total DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS sgst_total DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS igst_total DECIMAL(15,2) DEFAULT 0;

ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- ─────────────────────────────────────────────────────────────
-- 22. STORAGE SETUP (manual run in SQL editor)
-- ─────────────────────────────────────────────────────────────
-- Create business-assets bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-assets', 'business-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow Public Select
DROP POLICY IF EXISTS "Public Viewable Assets" ON storage.objects;
CREATE POLICY "Public Viewable Assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'business-assets' );

-- Policy: Allow Authenticated Insert
DROP POLICY IF EXISTS "Users can upload their own assets" ON storage.objects;
CREATE POLICY "Users can upload their own assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-assets' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

-- Policy: Allow Authenticated Update
DROP POLICY IF EXISTS "Users can update their own assets" ON storage.objects;
CREATE POLICY "Users can update their own assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-assets' AND
  (auth.uid()::text = (storage.foldername(name))[1])
)
WITH CHECK (
  bucket_id = 'business-assets' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

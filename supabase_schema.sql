-- Supabase Database Schema for Khata App
-- Consolidated & Standardized version

-- 1. Profiles (Extends auth.users)
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
  
  -- Custom Print Fields
  custom_field_1_label TEXT,
  custom_field_1_value TEXT,
  custom_field_2_label TEXT,
  custom_field_2_value TEXT,
  custom_field_3_label TEXT,
  custom_field_3_value TEXT,
  
  -- Print Settings
  print_template TEXT DEFAULT 'modern',
  show_transport BOOLEAN DEFAULT true,
  show_installation BOOLEAN DEFAULT true,
  show_bank_details BOOLEAN DEFAULT true,
  show_upi_qr BOOLEAN DEFAULT true,
  show_terms BOOLEAN DEFAULT true,
  show_signature BOOLEAN DEFAULT true,
  show_custom_fields BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Customers/Suppliers (Parties)
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
  type TEXT DEFAULT 'customer', -- 'customer', 'supplier', 'both'
  opening_balance DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Products/Services
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  hsn_code TEXT,
  description TEXT,
  price DECIMAL(15,2) DEFAULT 0, -- Sales Price
  purchase_price DECIMAL(15,2) DEFAULT 0, -- Cost Price
  wholesale_price DECIMAL(15,2) DEFAULT 0,
  mrp DECIMAL(15,2) DEFAULT 0,
  tax_rate DECIMAL(15,2) DEFAULT 0, -- GST %
  unit TEXT DEFAULT 'pcs',
  item_type TEXT DEFAULT 'product',
  image_url TEXT,
  stock_quantity DECIMAL(15,2) DEFAULT 0,
  min_stock_level DECIMAL(15,2) DEFAULT 0,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'void'
  payment_status TEXT DEFAULT 'unpaid', -- 'unpaid', 'partially_paid', 'paid'
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_total DECIMAL(15,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  round_off DECIMAL(15,2) DEFAULT 0,
  transport_charges DECIMAL(15,2) DEFAULT 0,
  installation_charges DECIMAL(15,2) DEFAULT 0,
  custom_charges JSONB DEFAULT '[]'::jsonb,
  total_amount DECIMAL(15,2) DEFAULT 0,
  amount_paid DECIMAL(15,2) DEFAULT 0,
  balance_amount DECIMAL(15,2) DEFAULT 0,
  is_pos BOOLEAN DEFAULT false,
  billing_address TEXT,
  shipping_address TEXT,
  supply_place TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Invoice Items
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
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Purchases
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES public.customers ON DELETE SET NULL,
  purchase_number TEXT NOT NULL,
  purchase_date DATE DEFAULT CURRENT_DATE,
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_total DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid',
  billing_address TEXT,
  shipping_address TEXT,
  supply_place TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Purchase Items
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  purchase_id UUID REFERENCES public.purchases ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(15,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Quotations
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers ON DELETE SET NULL,
  quotation_number TEXT NOT NULL,
  quotation_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_total DECIMAL(15,2) DEFAULT 0,
  transport_charges DECIMAL(15,2) DEFAULT 0,
  installation_charges DECIMAL(15,2) DEFAULT 0,
  custom_charges JSONB DEFAULT '[]'::jsonb,
  total_amount DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  billing_address TEXT,
  shipping_address TEXT,
  supply_place TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Quotation Items
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
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Delivery Challans
CREATE TABLE IF NOT EXISTS public.delivery_challans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers ON DELETE SET NULL,
  challan_number TEXT NOT NULL,
  challan_date DATE DEFAULT CURRENT_DATE,
  items JSONB DEFAULT '[]'::jsonb,
  total_amount DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'delivered', 'invoiced', 'cancelled'
  billing_address TEXT,
  shipping_address TEXT,
  supply_place TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Returns
CREATE TABLE IF NOT EXISTS public.returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers ON DELETE SET NULL,
  return_number TEXT NOT NULL,
  return_date DATE DEFAULT CURRENT_DATE,
  total_amount DECIMAL(15,2) DEFAULT 0,
  type TEXT NOT NULL, -- 'sales_return', 'purchase_return'
  billing_address TEXT,
  shipping_address TEXT,
  supply_place TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure the foreign key constraint is correctly named and exists
ALTER TABLE public.returns DROP CONSTRAINT IF EXISTS returns_customer_id_fkey;
ALTER TABLE public.returns ADD CONSTRAINT returns_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

-- 12. Return Items
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
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  amount DECIMAL(15,2) DEFAULT 0,
  expense_date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Payments (Combined In/Out)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers ON DELETE SET NULL,
  payment_number TEXT NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  amount DECIMAL(15,2) DEFAULT 0,
  type TEXT NOT NULL, -- 'payment_in', 'payment_out'
  payment_mode TEXT DEFAULT 'cash', -- 'cash', 'bank', 'upi', 'cheque'
  reference_number TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  supply_place TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Stock Adjustments (Manual)
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products ON DELETE CASCADE NOT NULL,
  adjustment_type TEXT NOT NULL, -- 'add', 'reduce'
  quantity DECIMAL(15,2) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Company Bank Details
CREATE TABLE IF NOT EXISTS public.company_bank_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  account_number TEXT,
  account_holder_name TEXT,
  ifsc_code TEXT,
  bank_branch_name TEXT,
  upi_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. RPC Functions for Atomic Operations
CREATE OR REPLACE FUNCTION increment_stock(pid UUID, qty DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity + qty
  WHERE id = pid AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_stock(pid UUID, qty DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - qty
  WHERE id = pid AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. New User Hook
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 19. RLS Policies (Idempotent)
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name != 'profiles' -- Profiles uses 'id' instead of 'user_id'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage own %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Users can manage own %I" ON public.%I FOR ALL USING (auth.uid() = user_id)', t, t);
    END LOOP;
END $$;

-- Exception for profiles where ID is user_id
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

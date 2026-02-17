/* 
  SQL Schema for BillMensor New Modules
  Run this in your Supabase SQL Editor to support the new pages.
*/

-- 1. Delivery Challan
CREATE TABLE IF NOT EXISTS delivery_challans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  challan_no TEXT NOT NULL,
  challan_date DATE NOT NULL,
  party_id UUID REFERENCES parties(id),
  status TEXT DEFAULT 'Pending',
  remarks TEXT
);

CREATE TABLE IF NOT EXISTS delivery_challan_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_challan_id UUID REFERENCES delivery_challans(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT,
  description TEXT
);

-- 2. Sales Return
CREATE TABLE IF NOT EXISTS sales_returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  return_no TEXT NOT NULL,
  return_date DATE NOT NULL,
  party_id UUID REFERENCES parties(id),
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  remarks TEXT
);

CREATE TABLE IF NOT EXISTS sales_return_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_return_id UUID REFERENCES sales_returns(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT,
  rate NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  reason TEXT
);

-- 3. Payment In (Receipts)
CREATE TABLE IF NOT EXISTS payment_in (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  receipt_no TEXT NOT NULL,
  payment_date DATE NOT NULL,
  party_id UUID REFERENCES parties(id),
  amount NUMERIC DEFAULT 0,
  payment_mode TEXT,
  reference_no TEXT,
  remarks TEXT
);

-- 4. Purchase Bills
CREATE TABLE IF NOT EXISTS purchase_bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  bill_no TEXT NOT NULL,
  vendor_bill_no TEXT,
  bill_date DATE NOT NULL,
  party_id UUID REFERENCES parties(id),
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  remarks TEXT
);

CREATE TABLE IF NOT EXISTS purchase_bill_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_bill_id UUID REFERENCES purchase_bills(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT,
  rate NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0
);

-- 5. Purchase Return
CREATE TABLE IF NOT EXISTS purchase_returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  return_no TEXT NOT NULL,
  return_date DATE NOT NULL,
  party_id UUID REFERENCES parties(id),
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Pending',
  remarks TEXT
);

CREATE TABLE IF NOT EXISTS purchase_return_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_return_id UUID REFERENCES purchase_returns(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT,
  rate NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  reason TEXT
);

-- 6. Payment Out
CREATE TABLE IF NOT EXISTS payment_out (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  payment_no TEXT NOT NULL,
  payment_date DATE NOT NULL,
  party_id UUID REFERENCES parties(id),
  amount NUMERIC DEFAULT 0,
  payment_mode TEXT,
  reference_no TEXT,
  remarks TEXT
);

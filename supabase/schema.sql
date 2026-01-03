-- ============================================================================
-- GHAR LEKHA - SUPABASE DATABASE SCHEMA (MULTI-LANDLORD SUPPORT)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'tenant')) DEFAULT 'tenant',
  mobile_number TEXT,
  
  -- Multi-Landlord Fields
  landlord_code TEXT UNIQUE, -- 6-char unique code for Admins only
  linked_landlord_id UUID REFERENCES profiles(id), -- For tenants, points to their landlord
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_landlord_code ON profiles(landlord_code);
CREATE INDEX IF NOT EXISTS idx_profiles_linked_landlord ON profiles(linked_landlord_id);

-- ============================================================================
-- TENANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- The tenant's user account
  landlord_id UUID NOT NULL REFERENCES profiles(id), -- The landlord who owns this tenant record
  
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT NOT NULL,
  
  flat_number TEXT NOT NULL,
  floor_number INTEGER NOT NULL DEFAULT 0,
  bhk_type TEXT NOT NULL CHECK (bhk_type IN ('1BHK', '2BHK', '3BHK')),
  monthly_rent DECIMAL(10, 2) NOT NULL,
  rent_start_date DATE NOT NULL,
  
  aadhaar_encrypted TEXT NOT NULL,
  aadhaar_masked TEXT NOT NULL,
  total_occupants INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(landlord_id, flat_number, is_active) -- Unique active tenant per flat per landlord
);

CREATE INDEX IF NOT EXISTS idx_tenants_landlord ON tenants(landlord_id);
CREATE INDEX IF NOT EXISTS idx_tenants_user ON tenants(user_id);

-- ============================================================================
-- OCCUPANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS occupants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_occupants_tenant ON occupants(tenant_id);

-- ============================================================================
-- METER READINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS meter_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reading_value DECIMAL(10, 2) NOT NULL,
  reading_date DATE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  units_consumed DECIMAL(10, 2),
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, month, year)
);

-- ============================================================================
-- BILLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  meter_reading_id UUID REFERENCES meter_readings(id),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  
  rent_amount DECIMAL(10, 2) NOT NULL,
  electricity_units DECIMAL(10, 2) NOT NULL DEFAULT 0,
  electricity_rate DECIMAL(10, 2) NOT NULL,
  electricity_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  water_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  other_charges DECIMAL(10, 2) NOT NULL DEFAULT 0,
  other_charges_description TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_date DATE,
  payment_notes TEXT,
  
  bill_number TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by UUID NOT NULL REFERENCES profiles(id),
  pdf_url TEXT,
  line_items JSONB NOT NULL DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, month, year)
);

-- ============================================================================
-- EXPENSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID NOT NULL REFERENCES profiles(id), -- Isolates expenses by landlord
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  flat_number TEXT,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID NOT NULL REFERENCES profiles(id),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  flat_number TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_important BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SETTINGS TABLE (One per Landlord)
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID NOT NULL REFERENCES profiles(id),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  UNIQUE(landlord_id, key)
);

-- ============================================================================
-- RLS POLICIES (ISOLATION LAYER)
-- ============================================================================

-- Enable RLS everywhere
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES
-- Users see their own profile
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

-- Admins can view profiles of their linked tenants
CREATE POLICY "Admins can view their tenants" ON profiles
  FOR SELECT USING (linked_landlord_id = auth.uid());

-- 2. TENANTS
-- Admin: landlord_id = auth.uid()
CREATE POLICY "Landlord manages their own tenants" ON tenants
  FOR ALL USING (landlord_id = auth.uid());

-- Tenant: user_id = auth.uid()
CREATE POLICY "Tenants view their own record" ON tenants
  FOR SELECT USING (user_id = auth.uid());

-- 3. EXPENSES, NOTES, SETTINGS
CREATE POLICY "Landlord manages expenses" ON expenses
  FOR ALL USING (landlord_id = auth.uid());

CREATE POLICY "Landlord manages notes" ON notes
  FOR ALL USING (landlord_id = auth.uid());

CREATE POLICY "Landlord manages settings" ON settings
  FOR ALL USING (landlord_id = auth.uid());

-- 4. BILLS, METER READINGS (via tenants table)
CREATE POLICY "Landlord manages bills" ON bills
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE landlord_id = auth.uid())
  );

CREATE POLICY "Tenant views bills" ON bills
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid())
  );

CREATE POLICY "Landlord manages readings" ON meter_readings
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE landlord_id = auth.uid())
  );

CREATE POLICY "Tenant views readings" ON meter_readings
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid())
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Generate a random 6-char alphanumeric code
CREATE OR REPLACE FUNCTION generate_landlord_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function: Handle New User (Auto-mapping)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_role TEXT;
  new_full_name TEXT;
  new_mobile TEXT;
  user_landlord_code TEXT;
  found_landlord_id UUID;
  generated_code TEXT;
BEGIN
  new_role := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  new_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
  new_mobile := NEW.raw_user_meta_data->>'mobile_number';
  
  -- If Admin, generate code
  IF new_role = 'admin' THEN
    LOOP
      generated_code := generate_landlord_code();
      BEGIN
        INSERT INTO profiles (id, email, full_name, role, mobile_number, landlord_code)
        VALUES (NEW.id, NEW.email, new_full_name, new_role, new_mobile, generated_code);
        EXIT; -- Successful insert
      EXCEPTION WHEN unique_violation THEN
        -- Retry on collision (unlikely but safe)
      END;
    END LOOP;
    
  -- If Tenant, link to Admin via code
  ELSE
    user_landlord_code := NEW.raw_user_meta_data->>'landlord_code';
    
    -- Find landlord by code
    IF user_landlord_code IS NOT NULL THEN
      SELECT id INTO found_landlord_id FROM profiles WHERE landlord_code = user_landlord_code AND role = 'admin';
    END IF;
    
    INSERT INTO profiles (id, email, full_name, role, mobile_number, linked_landlord_id)
    VALUES (NEW.id, NEW.email, new_full_name, new_role, new_mobile, found_landlord_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Helper function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

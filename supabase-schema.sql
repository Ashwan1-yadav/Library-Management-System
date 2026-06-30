-- ============================================================
-- COMPLETE SUPABASE SCHEMA FOR LIBRARY MANAGEMENT SYSTEM
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================================

-- 1. TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL DEFAULT auth.uid() REFERENCES admin_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE,
  published_year INTEGER,
  genre TEXT,
  description TEXT,
  cover_image TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  available_quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_admin_id ON books(admin_id);

CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL DEFAULT auth.uid() REFERENCES admin_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  membership_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_members_admin_id ON members(admin_id);

CREATE TABLE IF NOT EXISTS borrows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL DEFAULT auth.uid() REFERENCES admin_profiles(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  borrow_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  status TEXT DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_borrows_admin_id ON borrows(admin_id);

CREATE TABLE IF NOT EXISTS fines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL DEFAULT auth.uid() REFERENCES admin_profiles(id) ON DELETE CASCADE,
  borrow_id UUID REFERENCES borrows(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  paid BOOLEAN DEFAULT false,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fines_admin_id ON fines(admin_id);

-- 2. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES
-- ============================================================

DROP POLICY IF EXISTS "Users can manage their own books" ON books;
CREATE POLICY "Users can manage their own books"
  ON books FOR ALL TO authenticated USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own members" ON members;
CREATE POLICY "Users can manage their own members"
  ON members FOR ALL TO authenticated USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own borrows" ON borrows;
CREATE POLICY "Users can manage their own borrows"
  ON borrows FOR ALL TO authenticated USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own fines" ON fines;
CREATE POLICY "Users can manage their own fines"
  ON fines FOR ALL TO authenticated USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own profile" ON admin_profiles;
CREATE POLICY "Users can manage own profile"
  ON admin_profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 4. TRIGGERS (auto-update book availability)
-- ============================================================

CREATE OR REPLACE FUNCTION decrease_book_quantity()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  UPDATE books SET available_quantity = available_quantity - 1 WHERE id = NEW.book_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_borrow_insert ON borrows;
CREATE TRIGGER after_borrow_insert
  AFTER INSERT ON borrows
  FOR EACH ROW
  EXECUTE FUNCTION decrease_book_quantity();

CREATE OR REPLACE FUNCTION increase_book_quantity()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'returned' AND OLD.status = 'borrowed' THEN
    UPDATE books SET available_quantity = available_quantity + 1 WHERE id = NEW.book_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_borrow_update ON borrows;
CREATE TRIGGER after_borrow_update
  AFTER UPDATE ON borrows
  FOR EACH ROW
  EXECUTE FUNCTION increase_book_quantity();

-- 5. MIGRATION for existing databases (safe to run on both fresh and existing installs)
-- ============================================================

ALTER TABLE books ADD COLUMN IF NOT EXISTS admin_id UUID;
UPDATE books SET admin_id = COALESCE((SELECT id FROM admin_profiles LIMIT 1), auth.uid()) WHERE admin_id IS NULL;
ALTER TABLE books ALTER COLUMN admin_id SET NOT NULL;
ALTER TABLE books ALTER COLUMN admin_id SET DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_books_admin_id ON books(admin_id);

ALTER TABLE members ADD COLUMN IF NOT EXISTS admin_id UUID;
UPDATE members SET admin_id = COALESCE((SELECT id FROM admin_profiles LIMIT 1), auth.uid()) WHERE admin_id IS NULL;
ALTER TABLE members ALTER COLUMN admin_id SET NOT NULL;
ALTER TABLE members ALTER COLUMN admin_id SET DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_members_admin_id ON members(admin_id);

ALTER TABLE borrows ADD COLUMN IF NOT EXISTS admin_id UUID;
UPDATE borrows SET admin_id = COALESCE((SELECT id FROM admin_profiles LIMIT 1), auth.uid()) WHERE admin_id IS NULL;
ALTER TABLE borrows ALTER COLUMN admin_id SET NOT NULL;
ALTER TABLE borrows ALTER COLUMN admin_id SET DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_borrows_admin_id ON borrows(admin_id);

ALTER TABLE fines ADD COLUMN IF NOT EXISTS admin_id UUID;
UPDATE fines SET admin_id = COALESCE((SELECT id FROM admin_profiles LIMIT 1), auth.uid()) WHERE admin_id IS NULL;
ALTER TABLE fines ALTER COLUMN admin_id SET NOT NULL;
ALTER TABLE fines ALTER COLUMN admin_id SET DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_fines_admin_id ON fines(admin_id);

-- 6. STORAGE BUCKET (for book cover images & avatars)
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Manage book-covers" ON storage.objects;
DROP POLICY IF EXISTS "View book-covers" ON storage.objects;

CREATE POLICY "Manage book-covers" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'book-covers'::text) WITH CHECK (bucket_id = 'book-covers'::text);

CREATE POLICY "View book-covers" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'book-covers'::text);

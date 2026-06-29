-- ============================================================
-- COMPLETE SUPABASE SCHEMA FOR LIBRARY MANAGEMENT SYSTEM
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================================

-- 1. TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  membership_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS borrows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  borrow_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  status TEXT DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  borrow_id UUID REFERENCES borrows(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  paid BOOLEAN DEFAULT false,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES
-- ============================================================

CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on books"
  ON books FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on members"
  ON members FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on borrows"
  ON borrows FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated users on fines"
  ON fines FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated on admin_profiles"
  ON admin_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. TRIGGERS (auto-update book availability)
-- ============================================================

CREATE OR REPLACE FUNCTION decrease_book_quantity()
RETURNS TRIGGER AS $$
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
RETURNS TRIGGER AS $$
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

-- 5. STORAGE BUCKET (for book cover images & avatars)
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Manage book-covers" ON storage.objects;
DROP POLICY IF EXISTS "View book-covers" ON storage.objects;

CREATE POLICY "Manage book-covers" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'book-covers'::text) WITH CHECK (bucket_id = 'book-covers'::text);

CREATE POLICY "View book-covers" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'book-covers'::text);

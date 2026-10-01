CREATE TABLE IF NOT EXISTS book_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  email TEXT NOT NULL,
  book_title TEXT NOT NULL,
  genre TEXT NOT NULL,
  book_link TEXT,
  website TEXT,
  why_fit TEXT NOT NULL,
  book_summary TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
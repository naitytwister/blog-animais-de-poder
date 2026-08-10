-- Sistema de avaliação Animo Tem (estrelas 1-5)
-- Banco D1 do Cloudflare. Aplicar com:
--   wrangler d1 execute animotem-ratings --local --file=./schema.sql
--   wrangler d1 execute animotem-ratings --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  ip_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ratings_slug ON ratings (slug);

-- Migration 001: Initial schema
-- Run this first to set up the database

BEGIN;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create produkty table
CREATE TABLE IF NOT EXISTS produkty (
  id SERIAL PRIMARY KEY,
  nazev VARCHAR(255) NOT NULL,
  kategorie VARCHAR(100),
  cena_aktualni DECIMAL(10,2),
  cena_min DECIMAL(10,2),
  cena_max DECIMAL(10,2),
  priorita VARCHAR(20) DEFAULT 'medium' CHECK (priorita IN ('high', 'medium', 'low')),
  status VARCHAR(50) DEFAULT 'hledám' CHECK (status IN ('hledám', 'našel', 'koupil', 'skip', 'jinak')),
  zdroj VARCHAR(100),
  url TEXT,
  parametry JSONB DEFAULT '{}',
  claude_score INT CHECK (claude_score >= 1 AND claude_score <= 10),
  claude_reason TEXT,
  datum_pridani TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  datum_aktualizace TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id VARCHAR(100),
  CONSTRAINT produkty_url_unique UNIQUE (url)
);

-- Create bazarove_nalezy table
CREATE TABLE IF NOT EXISTS bazarove_nalezy (
  id SERIAL PRIMARY KEY,
  nazev VARCHAR(255) NOT NULL,
  popis TEXT,
  cena DECIMAL(10,2),
  url TEXT,
  foto_url TEXT,
  zdroj VARCHAR(50) CHECK (zdroj IN ('sbazar', 'bazos', 'facebook', 'vinted', 'aukro', 'other')),
  matched_produkt_id INT REFERENCES produkty(id) ON DELETE SET NULL,
  claude_confidence INT CHECK (claude_confidence >= 1 AND claude_confidence <= 10),
  claude_why TEXT,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'interested', 'contacted', 'bought', 'skip')),
  datum_nalezeni TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT bazarove_nalezy_url_unique UNIQUE (url)
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id VARCHAR(100) PRIMARY KEY,
  notifikace_enabled BOOLEAN DEFAULT true,
  min_score INT DEFAULT 7 CHECK (min_score >= 1 AND min_score <= 10),
  kategorie_zajmu TEXT[] DEFAULT '{}',
  max_cena DECIMAL(10,2),
  preferovane_znacky TEXT[] DEFAULT '{}',
  discord_webhook_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_produkty_status ON produkty(status);
CREATE INDEX IF NOT EXISTS idx_produkty_kategorie ON produkty(kategorie);
CREATE INDEX IF NOT EXISTS idx_produkty_priorita ON produkty(priorita);
CREATE INDEX IF NOT EXISTS idx_produkty_user_id ON produkty(user_id);
CREATE INDEX IF NOT EXISTS idx_bazarove_nalezy_status ON bazarove_nalezy(status);
CREATE INDEX IF NOT EXISTS idx_bazarove_nalezy_zdroj ON bazarove_nalezy(zdroj);
CREATE INDEX IF NOT EXISTS idx_bazarove_nalezy_matched ON bazarove_nalezy(matched_produkt_id);

-- Record migration
CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO _migrations (name) VALUES ('001_initial');

COMMIT;

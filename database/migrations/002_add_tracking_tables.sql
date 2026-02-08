-- Migration 002: Add tracking and logging tables
-- Run after 001_initial.sql

BEGIN;

-- Check if migration already applied
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM _migrations WHERE name = '002_add_tracking_tables') THEN
    RAISE EXCEPTION 'Migration 002_add_tracking_tables already applied';
  END IF;
END $$;

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  produkt_id INT REFERENCES produkty(id) ON DELETE CASCADE,
  cena DECIMAL(10,2) NOT NULL,
  zdroj VARCHAR(100),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_produkt ON price_history(produkt_id, recorded_at DESC);

-- Search logs table
CREATE TABLE IF NOT EXISTS search_logs (
  id SERIAL PRIMARY KEY,
  search_query TEXT,
  source VARCHAR(50),
  user_id VARCHAR(100),
  results_count INT DEFAULT 0,
  duration_ms INT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_user ON search_logs(user_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100),
  type VARCHAR(50) CHECK (type IN ('discord', 'email', 'web_push')),
  title VARCHAR(255),
  body TEXT,
  related_produkt_id INT REFERENCES produkty(id) ON DELETE SET NULL,
  related_nalez_id INT REFERENCES bazarove_nalezy(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, sent_at DESC);

-- Record migration
INSERT INTO _migrations (name) VALUES ('002_add_tracking_tables');

COMMIT;

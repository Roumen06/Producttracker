-- Product Tracker Database Schema
-- PostgreSQL 14+

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABULKA: produkty
-- Hlavní tabulka pro sledované produkty
-- ============================================
CREATE TABLE IF NOT EXISTS produkty (
  id SERIAL PRIMARY KEY,
  nazev VARCHAR(255) NOT NULL,
  kategorie VARCHAR(100),
  cena_aktualni DECIMAL(10,2),
  cena_min DECIMAL(10,2),
  cena_max DECIMAL(10,2),
  priorita VARCHAR(20) DEFAULT 'medium' CHECK (priorita IN ('high', 'medium', 'low')),
  status VARCHAR(50) DEFAULT 'hledám' CHECK (status IN ('hledám', 'našel', 'koupil', 'skip', 'jinak')),
  zdroj VARCHAR(100), -- temu, heureka, sbazar, bazos, manual, discord
  url TEXT,
  parametry JSONB DEFAULT '{}', -- {barva, velikost, značka, atd}
  claude_score INT CHECK (claude_score >= 1 AND claude_score <= 10),
  claude_reason TEXT,
  datum_pridani TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  datum_aktualizace TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id VARCHAR(100), -- Discord user ID nebo jiný identifikátor
  
  -- Unikátní constraint na URL pro deduplikaci
  CONSTRAINT produkty_url_unique UNIQUE (url)
);

-- Indexy pro rychlé vyhledávání
CREATE INDEX IF NOT EXISTS idx_produkty_status ON produkty(status);
CREATE INDEX IF NOT EXISTS idx_produkty_kategorie ON produkty(kategorie);
CREATE INDEX IF NOT EXISTS idx_produkty_priorita ON produkty(priorita);
CREATE INDEX IF NOT EXISTS idx_produkty_user_id ON produkty(user_id);
CREATE INDEX IF NOT EXISTS idx_produkty_datum ON produkty(datum_pridani DESC);
CREATE INDEX IF NOT EXISTS idx_produkty_score ON produkty(claude_score DESC) WHERE claude_score IS NOT NULL;

-- ============================================
-- TABULKA: bazarove_nalezy
-- Nálezy z bazarových portálů
-- ============================================
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
  
  -- Unikátní constraint na URL pro deduplikaci
  CONSTRAINT bazarove_nalezy_url_unique UNIQUE (url)
);

-- Indexy
CREATE INDEX IF NOT EXISTS idx_bazarove_nalezy_status ON bazarove_nalezy(status);
CREATE INDEX IF NOT EXISTS idx_bazarove_nalezy_zdroj ON bazarove_nalezy(zdroj);
CREATE INDEX IF NOT EXISTS idx_bazarove_nalezy_datum ON bazarove_nalezy(datum_nalezeni DESC);
CREATE INDEX IF NOT EXISTS idx_bazarove_nalezy_confidence ON bazarove_nalezy(claude_confidence DESC);
CREATE INDEX IF NOT EXISTS idx_bazarove_nalezy_matched ON bazarove_nalezy(matched_produkt_id);

-- ============================================
-- TABULKA: user_preferences
-- Uživatelské preference a nastavení
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id VARCHAR(100) PRIMARY KEY,
  notifikace_enabled BOOLEAN DEFAULT true,
  min_score INT DEFAULT 7 CHECK (min_score >= 1 AND min_score <= 10),
  kategorie_zajmu TEXT[] DEFAULT '{}', -- {kuchyně, obývák, ložnice}
  max_cena DECIMAL(10,2),
  preferovane_znacky TEXT[] DEFAULT '{}',
  discord_webhook_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABULKA: price_history
-- Historie cen pro tracking změn
-- ============================================
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  produkt_id INT REFERENCES produkty(id) ON DELETE CASCADE,
  cena DECIMAL(10,2) NOT NULL,
  zdroj VARCHAR(100),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_produkt ON price_history(produkt_id, recorded_at DESC);

-- ============================================
-- TABULKA: search_logs
-- Log vyhledávání pro debugging a analytics
-- ============================================
CREATE TABLE IF NOT EXISTS search_logs (
  id SERIAL PRIMARY KEY,
  search_query TEXT,
  source VARCHAR(50), -- discord, web, n8n
  user_id VARCHAR(100),
  results_count INT DEFAULT 0,
  duration_ms INT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_user ON search_logs(user_id);

-- ============================================
-- TABULKA: notifications
-- Log odeslaných notifikací
-- ============================================
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

-- ============================================
-- VIEWS pro snadnější přístup k datům
-- ============================================

-- View: Aktivní hledané produkty s počtem nálezů
CREATE OR REPLACE VIEW v_aktivni_produkty AS
SELECT 
  p.*,
  COUNT(bn.id) as pocet_nalezu,
  MAX(bn.datum_nalezeni) as posledni_nalez
FROM produkty p
LEFT JOIN bazarove_nalezy bn ON bn.matched_produkt_id = p.id
WHERE p.status = 'hledám'
GROUP BY p.id
ORDER BY 
  CASE p.priorita WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
  p.datum_pridani DESC;

-- View: Nejlepší bazarové nálezy
CREATE OR REPLACE VIEW v_top_nalezy AS
SELECT 
  bn.*,
  p.nazev as hledany_produkt,
  p.cena_max as max_rozpocet,
  CASE 
    WHEN p.cena_max IS NOT NULL AND bn.cena < p.cena_max 
    THEN p.cena_max - bn.cena 
    ELSE 0 
  END as potencialni_uspora
FROM bazarove_nalezy bn
LEFT JOIN produkty p ON bn.matched_produkt_id = p.id
WHERE bn.status IN ('new', 'interested')
ORDER BY bn.claude_confidence DESC, bn.datum_nalezeni DESC;

-- View: Dashboard statistiky
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM produkty WHERE status = 'hledám') as aktivni_hledani,
  (SELECT COUNT(*) FROM produkty WHERE status = 'našel') as nalezeno,
  (SELECT COUNT(*) FROM produkty WHERE status = 'koupil') as koupeno,
  (SELECT COUNT(*) FROM bazarove_nalezy WHERE status = 'new') as nove_nalezy,
  (SELECT COALESCE(SUM(cena_max - cena_aktualni), 0) FROM produkty WHERE status = 'koupil' AND cena_aktualni < cena_max) as usetreno,
  (SELECT COUNT(DISTINCT kategorie) FROM produkty) as pocet_kategorii,
  (SELECT COUNT(DISTINCT user_id) FROM produkty WHERE user_id IS NOT NULL) as pocet_uzivatelu;

-- ============================================
-- FUNKCE A TRIGGERY
-- ============================================

-- Funkce pro automatickou aktualizaci datum_aktualizace
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.datum_aktualizace = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pro produkty
DROP TRIGGER IF EXISTS update_produkty_modtime ON produkty;
CREATE TRIGGER update_produkty_modtime
  BEFORE UPDATE ON produkty
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Funkce pro automatickou aktualizaci updated_at v user_preferences
CREATE OR REPLACE FUNCTION update_preferences_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_preferences_modtime ON user_preferences;
CREATE TRIGGER update_preferences_modtime
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_preferences_modified();

-- Funkce pro zaznamenání změny ceny
CREATE OR REPLACE FUNCTION record_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.cena_aktualni IS DISTINCT FROM NEW.cena_aktualni AND NEW.cena_aktualni IS NOT NULL THEN
    INSERT INTO price_history (produkt_id, cena, zdroj)
    VALUES (NEW.id, NEW.cena_aktualni, NEW.zdroj);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_price_changes ON produkty;
CREATE TRIGGER track_price_changes
  AFTER UPDATE ON produkty
  FOR EACH ROW
  EXECUTE FUNCTION record_price_change();

-- ============================================
-- SEED DATA (volitelné)
-- ============================================

-- Vložit demo uživatele
INSERT INTO user_preferences (user_id, notifikace_enabled, min_score, kategorie_zajmu)
VALUES ('demo_user', true, 7, ARRAY['kuchyně', 'elektronika'])
ON CONFLICT (user_id) DO NOTHING;

-- Vložit demo produkty
INSERT INTO produkty (nazev, kategorie, cena_min, cena_max, priorita, status, zdroj, user_id)
VALUES 
  ('Rychlovarná konvice Philips', 'kuchyně', 300, 800, 'high', 'hledám', 'manual', 'demo_user'),
  ('Pánev Tefal 28cm', 'kuchyně', 400, 1200, 'medium', 'hledám', 'manual', 'demo_user'),
  ('Bluetooth sluchátka', 'elektronika', 200, 500, 'low', 'hledám', 'manual', 'demo_user')
ON CONFLICT (url) DO NOTHING;

-- ============================================
-- GRANTS (upravit podle potřeby)
-- ============================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO product_tracker_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO product_tracker_user;

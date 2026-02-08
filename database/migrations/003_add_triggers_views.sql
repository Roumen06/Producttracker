-- Migration 003: Add triggers and views
-- Run after 002_add_tracking_tables.sql

BEGIN;

-- Check if migration already applied
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM _migrations WHERE name = '003_add_triggers_views') THEN
    RAISE EXCEPTION 'Migration 003_add_triggers_views already applied';
  END IF;
END $$;

-- Function for auto-updating datum_aktualizace
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.datum_aktualizace = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for produkty
DROP TRIGGER IF EXISTS update_produkty_modtime ON produkty;
CREATE TRIGGER update_produkty_modtime
  BEFORE UPDATE ON produkty
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Function for auto-updating updated_at in user_preferences
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

-- Function for recording price changes
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

-- View: Active searched products with find counts
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

-- View: Best bazaar finds
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

-- View: Dashboard statistics
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM produkty WHERE status = 'hledám') as aktivni_hledani,
  (SELECT COUNT(*) FROM produkty WHERE status = 'našel') as nalezeno,
  (SELECT COUNT(*) FROM produkty WHERE status = 'koupil') as koupeno,
  (SELECT COUNT(*) FROM bazarove_nalezy WHERE status = 'new') as nove_nalezy,
  (SELECT COALESCE(SUM(cena_max - cena_aktualni), 0) FROM produkty WHERE status = 'koupil' AND cena_aktualni < cena_max) as usetreno,
  (SELECT COUNT(DISTINCT kategorie) FROM produkty) as pocet_kategorii,
  (SELECT COUNT(DISTINCT user_id) FROM produkty WHERE user_id IS NOT NULL) as pocet_uzivatelu;

-- Record migration
INSERT INTO _migrations (name) VALUES ('003_add_triggers_views');

COMMIT;

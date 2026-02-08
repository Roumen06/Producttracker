# 🛒 Product Tracker

Kompletní systém pro automatické sledování produktů z e-shopů a bazarů s AI analýzou pomocí Claude.

## ✨ Funkce

- **Automatické sledování e-shopů** (Temu, Heureka) - denní scraping a AI analýza
- **Sledování bazarů** (Sbazar, Bazoš) - hodinová kontrola nových nabídek
- **AI hodnocení** - Claude analyzuje relevanci a kvalitu nabídek
- **Discord integrace** - příkazy a notifikace přímo do Discordu
- **Web Dashboard** - moderní Next.js aplikace pro správu
- **Automatické reporty** - HTML reporty s přehledem nálezů

## 🏗️ Architektura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Discord Bot   │────▶│      N8N        │────▶│   PostgreSQL    │
│   (Commands)    │     │   (Workflows)   │     │   (Database)    │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │                       ▲
                                 ▼                       │
                        ┌─────────────────┐              │
                        │   Claude API    │              │
                        │  (AI Analysis)  │              │
                        └─────────────────┘              │
                                                         │
┌─────────────────┐                                      │
│  Web Dashboard  │──────────────────────────────────────┘
│    (Next.js)    │
└─────────────────┘
```

## 📁 Struktura projektu

```
product-tracker/
├── n8n-workflows/           # N8N workflow JSON soubory
│   ├── workflow-a-eshop-tracking.json
│   ├── workflow-b-bazaar-tracking.json
│   ├── workflow-c-discord-commands.json
│   └── workflow-d-report-generator.json
├── database/                # SQL schema a migrace
│   ├── schema.sql
│   └── migrations/
├── web-dashboard/           # Next.js aplikace
│   ├── app/                 # App Router stránky
│   ├── components/          # React komponenty
│   ├── lib/                 # Utility funkce
│   └── prisma/              # Prisma schema
├── discord-bot/             # Discord bot
│   └── src/
├── docs/                    # Dokumentace
│   └── SETUP.md
├── docker-compose.yml       # Docker orchestrace
└── .env.example             # Vzorové env proměnné
```

## 🚀 Rychlý start

### Požadavky

- Node.js 18+
- Docker & Docker Compose
- Discord účet (pro bota)
- Anthropic API klíč (pro Claude)

### Instalace

```bash
# 1. Klonovat repo
git clone <repo-url>
cd product-tracker

# 2. Nastavit environment variables
cp .env.example .env
# Upravte .env soubor s vašimi credentials

# 3. Spustit s Dockerem
docker-compose up -d

# 4. Importovat N8N workflows
# Otevřete http://localhost:5678 a importujte JSON soubory
```

Detailní instrukce viz [docs/SETUP.md](docs/SETUP.md)

## 🎮 Discord příkazy

| Příkaz | Popis | Příklad |
|--------|-------|---------|
| `!search [dotaz]` | Prohledá e-shopy | `!search pánev tefal do 1000 Kč` |
| `!add [produkt]` | Přidá ke sledování | `!add Rychlovarná konvice, max 800 Kč` |
| `!list` | Seznam sledovaných | `!list` |
| `!report` | Vygeneruje report | `!report` |
| `!help` | Nápověda | `!help` |

## 🌐 Web Dashboard

Dostupný na `http://localhost:3000`

### Stránky

- **Dashboard** (`/`) - Přehled statistik a nejnovějších nálezů
- **Produkty** (`/products`) - Správa sledovaných produktů
- **Bazary** (`/bazary`) - Bazarové nálezy s akcemi
- **Nastavení** (`/nastaveni`) - Konfigurace a integrace

## ⚙️ N8N Workflows

| Workflow | Trigger | Popis |
|----------|---------|-------|
| A - E-shop Tracking | Denně 8:00 | Scraping Temu, Heureka + Claude analýza |
| B - Bazaar Tracking | Každou hodinu | Scraping Sbazar, Bazoš + notifikace |
| C - Discord Commands | Webhook | Handler pro Discord příkazy |
| D - Report Generator | Webhook | Generování HTML reportů |

## 🗄️ Databáze

### Hlavní tabulky

- `produkty` - Sledované produkty s kritérii
- `bazarove_nalezy` - Nalezené bazarové nabídky
- `user_preferences` - Uživatelské nastavení
- `price_history` - Historie cen

### Inicializace

```bash
# S Dockerem
docker-compose up postgres -d
docker-compose exec postgres psql -U producttracker -f /docker-entrypoint-initdb.d/01-schema.sql

# Manuálně
psql -U producttracker -d producttracker -f database/schema.sql
```

## 🔐 Environment Variables

| Proměnná | Popis | Příklad |
|----------|-------|---------|
| `CLAUDE_API_KEY` | Anthropic API klíč | `sk-ant-...` |
| `DISCORD_BOT_TOKEN` | Discord bot token | `MTI...` |
| `DISCORD_WEBHOOK_URL` | Discord webhook | `https://discord.com/api/webhooks/...` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |

## 📊 API Endpoints

| Endpoint | Metoda | Popis |
|----------|--------|-------|
| `/api/products` | GET, POST | Seznam/vytvoření produktů |
| `/api/products/:id` | GET, PATCH, DELETE | Operace s produktem |
| `/api/bazary/:id` | PATCH, DELETE | Operace s nálezem |
| `/api/stats` | GET | Dashboard statistiky |
| `/api/trigger-search` | POST | Manuální spuštění hledání |

## 🛠️ Vývoj

```bash
# Web Dashboard
cd web-dashboard
npm install
npm run dev

# Discord Bot
cd discord-bot
npm install
npm run dev

# Databáze
cd web-dashboard
npx prisma studio  # GUI pro databázi
```

## 📝 Licence

MIT

## 🤝 Přispívání

1. Fork repozitáře
2. Vytvořte feature branch (`git checkout -b feature/nova-funkce`)
3. Commit změn (`git commit -m 'Přidána nová funkce'`)
4. Push do branch (`git push origin feature/nova-funkce`)
5. Otevřete Pull Request

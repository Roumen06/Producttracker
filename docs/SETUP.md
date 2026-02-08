# Product Tracker - Instalační příručka

## Požadavky

- **Node.js** 18+ (doporučeno 20)
- **Docker** a **Docker Compose** (pro snadné spuštění)
- **PostgreSQL** 14+ (pokud nepoužíváte Docker)
- **N8N** instance (běží na Raspberry Pi nebo v Dockeru)
- **Discord účet** s právy pro vytvoření bota
- **Anthropic API klíč** (pro Claude AI)

---

## 🚀 Rychlý start s Dockerem

### 1. Klonování a konfigurace

```bash
# Přejít do projektu
cd product-tracker

# Zkopírovat a upravit environment variables
cp .env.example .env
nano .env  # nebo jiný editor
```

### 2. Nastavení .env souboru

Vyplňte tyto klíčové hodnoty:

```env
# PostgreSQL
POSTGRES_PASSWORD=silne_heslo_123

# Claude API
CLAUDE_API_KEY=sk-ant-váš-api-klíč

# Discord
DISCORD_BOT_TOKEN=váš-bot-token
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### 3. Spuštění

```bash
# Spustit všechny služby
docker-compose up -d

# Sledovat logy
docker-compose logs -f
```

### 4. Import N8N workflows

1. Otevřete N8N na `http://localhost:5678`
2. Přihlaste se (admin/admin nebo dle .env)
3. Pro každý workflow v `/n8n-workflows/`:
   - Klikněte na "Add workflow" → "Import from file"
   - Vyberte JSON soubor
   - Aktivujte workflow

---

## 📦 Manuální instalace (bez Dockeru)

### 1. PostgreSQL

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Vytvoření databáze
psql -U postgres
CREATE USER producttracker WITH PASSWORD 'heslo';
CREATE DATABASE producttracker OWNER producttracker;
\q

# Inicializace schématu
psql -U producttracker -d producttracker -f database/schema.sql
```

### 2. Web Dashboard

```bash
cd web-dashboard

# Instalace závislostí
npm install

# Konfigurace
cp ../.env.example .env.local
# Upravte DATABASE_URL a další

# Generování Prisma klienta
npx prisma generate

# Migrace databáze
npx prisma db push

# Spuštění (vývoj)
npm run dev

# Nebo build pro produkci
npm run build
npm start
```

### 3. Discord Bot

```bash
cd discord-bot

# Instalace
npm install

# Konfigurace
cp .env.example .env
# Vyplňte DISCORD_BOT_TOKEN

# Build
npm run build

# Spuštění
npm start

# Pro produkci s PM2
npm install -g pm2
pm2 start dist/index.js --name product-tracker-bot
pm2 save
```

### 4. N8N na Raspberry Pi

```bash
# Instalace N8N globálně
npm install -g n8n

# Spuštění
n8n start

# Nebo s PM2
pm2 start n8n --name n8n
pm2 save
pm2 startup
```

---

## 🔧 Konfigurace služeb

### Discord Bot

1. Jděte na [Discord Developer Portal](https://discord.com/developers/applications)
2. Vytvořte novou aplikaci
3. V sekci "Bot":
   - Klikněte "Add Bot"
   - Zkopírujte token → `DISCORD_BOT_TOKEN`
   - Povolte "Message Content Intent"
4. V sekci "OAuth2" → "URL Generator":
   - Scopes: `bot`
   - Bot Permissions: `Send Messages`, `Read Messages`, `Embed Links`
   - Zkopírujte URL a pozvěte bota na server

### Discord Webhook

1. Na vašem Discord serveru → Nastavení kanálu
2. Integrace → Webhooky → Nový webhook
3. Zkopírujte URL → `DISCORD_WEBHOOK_URL`

### Claude API

1. Jděte na [console.anthropic.com](https://console.anthropic.com)
2. Vytvořte API klíč
3. Zkopírujte → `CLAUDE_API_KEY`

---

## 📋 N8N Workflows

### Import workflows

Každý JSON soubor v `/n8n-workflows/` importujte do N8N:

| Soubor | Popis | Trigger |
|--------|-------|---------|
| `workflow-a-eshop-tracking.json` | Sledování e-shopů | Cron denně 8:00 |
| `workflow-b-bazaar-tracking.json` | Sledování bazarů | Cron každou hodinu |
| `workflow-c-discord-commands.json` | Discord příkazy | Webhook |
| `workflow-d-report-generator.json` | Generování reportů | Webhook |

### Nastavení credentials v N8N

Po importu nastavte credentials:

1. **PostgreSQL**: Host, Port, Database, User, Password
2. **HTTP Header Auth** (pro Claude): `x-api-key` = váš Claude API key

### Environment variables v N8N

Nastavte v Settings → Variables:
- `CLAUDE_API_KEY`
- `DISCORD_WEBHOOK_URL`
- `DATABASE_URL`

---

## 🌐 Deployment

### Web Dashboard na Cloudflare Pages

```bash
cd web-dashboard

# Build
npm run build

# Deploy přes Wrangler
npx wrangler pages deploy .next
```

Nebo přes Cloudflare Dashboard:
1. Připojte GitHub repo
2. Build command: `npm run build`
3. Output directory: `.next`

### Discord Bot na Railway

1. Vytvořte nový projekt na [railway.app](https://railway.app)
2. Připojte GitHub repo (složka `discord-bot`)
3. Nastavte environment variables
4. Deploy

### N8N na Raspberry Pi

```bash
# S PM2 pro automatický restart
pm2 start n8n --name n8n
pm2 startup
pm2 save
```

---

## 🔍 Troubleshooting

### Databáze se nepřipojuje

```bash
# Zkontrolujte, že PostgreSQL běží
docker-compose ps
# nebo
systemctl status postgresql

# Test připojení
psql -h localhost -U producttracker -d producttracker
```

### N8N workflow nefunguje

1. Zkontrolujte logy v N8N
2. Ověřte credentials
3. Zkontrolujte, že workflow je aktivní

### Discord bot neodpovídá

1. Zkontrolujte token v .env
2. Ověřte, že bot má správná oprávnění
3. Zkontrolujte logy: `docker-compose logs discord-bot`

### Claude API chyby

1. Ověřte platnost API klíče
2. Zkontrolujte billing na console.anthropic.com
3. Sledujte rate limits (max ~60 req/min)

---

## 📊 Monitoring

### Logy

```bash
# Všechny služby
docker-compose logs -f

# Konkrétní služba
docker-compose logs -f web-dashboard
docker-compose logs -f n8n
```

### Healthchecks

- **Web Dashboard**: `http://localhost:3000`
- **N8N**: `http://localhost:5678`
- **PostgreSQL**: `pg_isready -h localhost -p 5432`

---

## 🔄 Aktualizace

```bash
# Stáhnout nejnovější verzi
git pull

# Rebuild a restart
docker-compose build
docker-compose up -d

# Migrace databáze (pokud potřeba)
cd web-dashboard
npx prisma db push
```

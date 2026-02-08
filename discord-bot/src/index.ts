import { Client, GatewayIntentBits, Events, Message, EmbedBuilder } from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook/discord-command";
const PREFIX = "!";

interface CommandHandler {
  execute: (message: Message, args: string[]) => Promise<void>;
  description: string;
}

const commands: Record<string, CommandHandler> = {
  search: {
    description: "Prohledá e-shopy podle dotazu",
    execute: async (message: Message, args: string[]) => {
      if (args.length === 0) {
        await message.reply("❌ Použití: `!search [dotaz]`\nPříklad: `!search pánev tefal do 1000 Kč`");
        return;
      }

      const query = args.join(" ");
      await message.reply(`🔍 Hledám: **${query}**...`);

      try {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: "search",
            user_query: query,
            user_id: message.author.id,
            channel_id: message.channelId,
          }),
        });

        if (!response.ok) {
          throw new Error(`N8N responded with ${response.status}`);
        }

        console.log(`Search command executed for user ${message.author.tag}: ${query}`);
      } catch (error) {
        console.error("Search command error:", error);
        await message.reply("❌ Chyba při vyhledávání. Zkuste to znovu později.");
      }
    },
  },

  add: {
    description: "Přidá produkt ke sledování",
    execute: async (message: Message, args: string[]) => {
      if (args.length === 0) {
        await message.reply(
          "❌ Použití: `!add [produkt]`\nPříklad: `!add Rychlovarná konvice Philips, max 800 Kč, nerez`"
        );
        return;
      }

      const query = args.join(" ");

      try {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: "add",
            user_query: query,
            user_id: message.author.id,
            channel_id: message.channelId,
          }),
        });

        if (!response.ok) {
          throw new Error(`N8N responded with ${response.status}`);
        }

        await message.reply(`✅ Přidávám ke sledování: **${query}**`);
        console.log(`Add command executed for user ${message.author.tag}: ${query}`);
      } catch (error) {
        console.error("Add command error:", error);
        await message.reply("❌ Chyba při přidávání produktu. Zkuste to znovu později.");
      }
    },
  },

  list: {
    description: "Zobrazí tvoje sledované produkty",
    execute: async (message: Message) => {
      try {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: "list",
            user_query: "",
            user_id: message.author.id,
            channel_id: message.channelId,
          }),
        });

        if (!response.ok) {
          throw new Error(`N8N responded with ${response.status}`);
        }

        console.log(`List command executed for user ${message.author.tag}`);
      } catch (error) {
        console.error("List command error:", error);
        await message.reply("❌ Chyba při načítání seznamu. Zkuste to znovu později.");
      }
    },
  },

  report: {
    description: "Vygeneruje kompletní report",
    execute: async (message: Message) => {
      await message.reply("📊 Generuji report...");

      try {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: "report",
            user_query: "",
            user_id: message.author.id,
            channel_id: message.channelId,
          }),
        });

        if (!response.ok) {
          throw new Error(`N8N responded with ${response.status}`);
        }

        console.log(`Report command executed for user ${message.author.tag}`);
      } catch (error) {
        console.error("Report command error:", error);
        await message.reply("❌ Chyba při generování reportu. Zkuste to znovu později.");
      }
    },
  },

  settings: {
    description: "Odkaz na web dashboard",
    execute: async (message: Message) => {
      const dashboardUrl = process.env.DASHBOARD_URL || "http://localhost:3000";

      const embed = new EmbedBuilder()
        .setTitle("⚙️ Nastavení")
        .setDescription("Pro úpravu nastavení navštiv web dashboard:")
        .setColor(0x00ff88)
        .addFields({ name: "🌐 Dashboard URL", value: dashboardUrl })
        .setFooter({ text: "Product Tracker" });

      await message.reply({ embeds: [embed] });
    },
  },

  help: {
    description: "Zobrazí nápovědu",
    execute: async (message: Message) => {
      const embed = new EmbedBuilder()
        .setTitle("❓ Product Tracker - Nápověda")
        .setDescription("Dostupné příkazy:")
        .setColor(0x3498db)
        .addFields(
          {
            name: "🔍 !search [dotaz]",
            value: "Prohledá e-shopy\nPříklad: `!search pánev tefal do 1000 Kč`",
            inline: false,
          },
          {
            name: "➕ !add [produkt]",
            value: "Přidá produkt ke sledování\nPříklad: `!add Rychlovarná konvice Philips, max 800 Kč`",
            inline: false,
          },
          {
            name: "📋 !list",
            value: "Zobrazí tvoje sledované produkty",
            inline: true,
          },
          {
            name: "📊 !report",
            value: "Vygeneruje kompletní report",
            inline: true,
          },
          {
            name: "⚙️ !settings",
            value: "Odkaz na web dashboard",
            inline: true,
          }
        )
        .setFooter({ text: "Product Tracker v1.0" });

      await message.reply({ embeds: [embed] });
    },
  },
};

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Discord bot logged in as ${readyClient.user.tag}`);
  console.log(`📡 Connected to ${readyClient.guilds.cache.size} server(s)`);
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) return;

  const command = commands[commandName];
  if (!command) {
    await message.reply(`❌ Neznámý příkaz. Použij \`!help\` pro seznam příkazů.`);
    return;
  }

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
    await message.reply("❌ Došlo k chybě při provádění příkazu.");
  }
});

client.on(Events.Error, (error) => {
  console.error("Discord client error:", error);
});

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("❌ DISCORD_BOT_TOKEN is not set in environment variables");
  process.exit(1);
}

client.login(token).catch((error) => {
  console.error("❌ Failed to login to Discord:", error);
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("Shutting down...");
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down...");
  client.destroy();
  process.exit(0);
});

const { Client, GatewayIntentBits } = require("discord.js");
const db = require("quick.db");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const TOKEN = process.env.BOT_TOKEN;
const EGGS_PER_BATCH = 13; // adjust this if your batch size changes

client.on("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// when message from webhook appears
client.on("messageCreate", async (msg) => {
  if (!msg.embeds.length) return;
  const embed = msg.embeds[0];
  if (!embed.description && !embed.title) return;

  // detect "Hatched From: X Egg"
  const match = msg.content.match(/Hatched From:\s*(.+?) Egg/i);
  if (!match) return;

  const eggType = match[1].trim();
  const eggs = EGGS_PER_BATCH;

  const now = new Date();
  const day = now.toISOString().split("T")[0];
  const week = `${now.getFullYear()}-W${Math.ceil(((now - new Date(now.getFullYear(),0,1)) / 86400000 + now.getDay()+1) / 7)}`;

  db.add(`totalHatched`, eggs);
  db.add(`daily_${day}`, eggs);
  db.add(`weekly_${week}`, eggs);
  db.add(`type_${eggType}`, eggs);
  db.push("history", { date: day, count: eggs, egg: eggType });

  console.log(`Counted ${eggs} from ${eggType}`);
});

// stats command
client.on("messageCreate", (msg) => {
  if (!msg.content.startsWith("!stat")) return;
  const args = msg.content.split(" ");
  const filterDays = parseInt(args[1]);

  const today = new Date().toISOString().split("T")[0];
  const history = db.get("history") || [];
  const todayCount = db.get(`daily_${today}`) || 0;

  let customCount = 0;
  if (!isNaN(filterDays)) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filterDays);
    history.forEach(h => {
      if (new Date(h.date) >= cutoff) customCount += h.count;
    });
  }

  let reply = `📊 **Egg Stats**\n`;
  reply += `• Today: ${todayCount}\n`;
  if (!isNaN(filterDays)) reply += `• Last ${filterDays} Days: ${customCount}\n`;
  reply += `• Lifetime: ${db.get("totalHatched") || 0}`;

  msg.reply(reply);
});

client.login(TOKEN);
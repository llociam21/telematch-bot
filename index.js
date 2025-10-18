import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";
import http from "http";

dotenv.config();

// --- Config ---
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("Falta BOT_TOKEN en variables de entorno.");
  process.exit(1);
}
const bot = new Telegraf(BOT_TOKEN);

// --- UI: teclado principal ---
const mainKeyboard = Markup.keyboard([
  ["Iniciar reto 🎮"],
  ["Ver reglas 📜"]
]).resize();

// --- Comandos y acciones ---
bot.start((ctx) => {
  return ctx.reply("¡Hola! Soy MatchBot. ¿Qué quieres hacer?", mainKeyboard);
});

bot.hears("Iniciar reto 🎮", (ctx) => {
  return ctx.reply("¡Genial! Empezaremos pronto. (demo)");
});

bot.hears("Ver reglas 📜", (ctx) => {
  return ctx.reply("Reglas: 1) Diviértete 2) Respeta 3) ¡Juega!");
});

bot.command("ping", (ctx) => ctx.reply("pong"));

// Respuesta general (eco) para cualquier otro texto
bot.on("text", async (ctx) => {
  const text = ctx.message.text;
  await ctx.reply(`Recibí: ${text}`);
});

// --- Arranque del bot ---
bot.launch();
console.log("Bot corriendo en modo polling...");

// --- Servidor HTTP keep-alive para Render ---
const PORT = process.env.PORT || 10000;
const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot activo y corriendo correctamente.\n");
});
server.listen(PORT, () => {
  console.log(`HTTP keep-alive escuchando en puerto ${PORT}`);
});

// --- Apagado limpio ---
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
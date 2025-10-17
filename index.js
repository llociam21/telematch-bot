import { Telegraf } from "telegraf";
import http from "http";

// Bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// /start
bot.start((ctx) => {
  ctx.reply("¡Hola! Soy MatchBot 🤖\nPulsa un botón para empezar.");
});

// Texto genérico (sin comillas invertidas para evitar el error)
bot.on("text", (ctx) => {
  try {
    ctx.reply("Recibi: " + (ctx.message?.text ?? ""));
  } catch (e) {
    console.error("Error enviando eco:", e);
  }
});

// Errores del bot
bot.catch((err) => console.error("Error del bot:", err));

// Lanzar
bot.launch();
console.log("🤖 Bot corriendo en polling…");

// Paradas limpias
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// Keep-alive HTTP para Render
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("OK");
});
server.listen(PORT, () => {
  console.log("HTTP keep-alive en puerto " + PORT);
});
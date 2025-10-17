import { Telegraf } from "telegraf";
import http from "http";

// Inicialización del bot con el token del archivo .env
const bot = new Telegraf(process.env.BOT_TOKEN);

// --- COMANDOS DEL BOT ---

// Comando /start
bot.start((ctx) => {
  ctx.reply("¡Hola! Soy MatchBot 🤖\n\nPulsa uno de los botones para comenzar.");
});

// Respuesta a cualquier texto
bot.on("text", (ctx) => {
  ctx.reply(Recibí: ${ctx.message.text});
});

// Manejo de errores
bot.catch((err) => {
  console.error("Error del bot:", err);
});

// Lanzamiento del bot
bot.launch();
console.log("🤖 Bot corriendo en modo local (polling)...");

// Finalización correcta al detener el servicio
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// --- Keep-alive HTTP server para Render ---
const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("OK");
});

server.listen(PORT, () => {
  console.log(HTTP keep-alive escuchando en puerto ${PORT});
});
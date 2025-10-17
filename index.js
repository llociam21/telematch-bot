import { Telegraf } from "telegraf";
import http from "http";

// Inicialización del bot con tu token del archivo .env
const bot = new Telegraf(process.env.BOT_TOKEN);

// --- COMANDOS DEL BOT ---

// Mensaje de bienvenida al iniciar el bot
bot.start((ctx) => {
  ctx.reply(
    "¡Hola! Soy MatchBot 🤖\n\nPulsa uno de los botones para comenzar:"
  );
});

// Respuesta básica a cualquier texto
bot.on("text", (ctx) => {
  ctx.reply(Recibí: ${ctx.message.text});
});

// Manejo de errores del bot
bot.catch((err) => {
  console.error("Error del bot:", err);
});

// Lanzamiento del bot (modo polling)
bot.launch();
console.log("🤖 Bot corriendo en modo local (polling)...");

// Cierre ordenado cuando el servidor se detiene
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
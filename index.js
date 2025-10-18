// 🧩 Importamos las librerías necesarias
import { Telegraf, Markup } from "telegraf";
import http from "http";
import dotenv from "dotenv";

// 🔐 Cargamos las variables de entorno (.env)
dotenv.config();

// 🚀 Inicializamos el bot con el token de Telegram
const bot = new Telegraf(process.env.BOT_TOKEN);

// 🟢 Comando /start: muestra el teclado con opciones
bot.start(async (ctx) => {
  await ctx.reply(
    "¡Hola! Soy MatchBot 🤖\nPulsa un botón para empezar.",
    Markup.keyboard([
      ["🎮 Iniciar reto"],
      ["📜 Ver reglas"]
    ])
      .resize()
      .oneTime()
  );
});

// 🕹️ Acción al pulsar "Iniciar reto"
bot.hears("🎮 Iniciar reto", async (ctx) => {
  await ctx.reply("¡Vamos a jugar! 🎯 (demo)");
});

// 📜 Acción al pulsar "Ver reglas"
bot.hears("📜 Ver reglas", async (ctx) => {
  await ctx.reply(
    "📘 Reglas básicas de TeleMatch × Retos\n\n" +
    "1️⃣ Mantén siempre respeto y consentimiento.\n" +
    "2️⃣ Cada reto se juega en rondas, con preguntas o desafíos.\n" +
    "3️⃣ Gana quien cumpla más objetivos o empate con creatividad.\n\n" +
    "⚡ Diviértete y juega con responsabilidad.",
    { parse_mode: "Markdown" }
  );
});

// 💬 Respuesta general a cualquier otro mensaje
bot.on("text", async (ctx) => {
  const text = ctx.message.text;
  await ctx.reply(📩 Recibí: ${text});
});

// 🚦 Lanzamos el bot
bot.launch();
console.log("🤖 Bot corriendo en modo polling...");

// ⚙️ Servidor HTTP necesario para mantener vivo el bot en Render
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot activo ✅");
});
server.listen(PORT, () => {
  console.log(🌐 HTTP keep-alive escuchando en puerto ${PORT});
});

// 🧹 Manejo de señales (para apagado limpio)
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
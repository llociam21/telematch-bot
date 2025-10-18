// index.js (CommonJS, ASCII puro)
require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const retos = require("./retos");
const scores = require("./scores");
const http = require("http");

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("Falta BOT_TOKEN en variables de entorno.");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Estado simple en memoria: userId -> { retoActual }
const sesiones = new Map();

// --- UI común ---
function tecladoInicio() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("Iniciar reto", "start_game")],
    [Markup.button.callback("Ver reglas", "rules")],
    [Markup.button.callback("Mi puntaje", "stats")],
    [Markup.button.callback("Top 5", "top")]
  ]);
}

function tecladoNiveles() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("Fácil", "nivel:facil"),
      Markup.button.callback("Medio", "nivel:medio"),
      Markup.button.callback("Difícil", "nivel:dificil")
    ],
    [Markup.button.callback("Volver", "home")]
  ]);
}

function tecladoOpciones(opciones) {
  // Cada opción se envía como payload ans:<texto>
  const filas = opciones.map((op) => [Markup.button.callback(op.trim(), `ans:${op.trim()}`)]);
  filas.push([Markup.button.callback("Cancelar", "home")]);
  return Markup.inlineKeyboard(filas);
}

// --- /start y home ---
bot.start(async (ctx) => {
  await ctx.reply(
    "Hola, soy MatchBot. ¿Qué quieres hacer?",
    tecladoInicio()
  );
});

bot.action("home", async (ctx) => {
  await ctx.editMessageText("Menú principal", tecladoInicio());
});

// --- reglas ---
bot.action("rules", async (ctx) => {
  const texto =
    "Reglas:\n" +
    "- Elige un nivel y responde.\n" +
    "- Acierto = +10 puntos.\n" +
    "- Puedes ver tu puntaje en 'Mi puntaje' y el 'Top 5'.";
  // Intentar editar si venía de un mensaje con inline keyboard; si falla, manda nuevo
  try {
    await ctx.editMessageText(texto, tecladoInicio());
  } catch {
    await ctx.reply(texto, tecladoInicio());
  }
});

// --- stats y top ---
bot.action("stats", async (ctx) => {
  const u = ctx.from;
  const s = scores.getStats(u.id);
  const texto =
    `Tus estadísticas:\n` +
    `- Nombre: ${u.first_name || "Desconocido"}\n` +
    `- Puntos: ${s.points}\n` +
    `- Aciertos: ${s.wins}\n` +
    `- Partidas jugadas: ${s.played}`;
  try {
    await ctx.editMessageText(texto, tecladoInicio());
  } catch {
    await ctx.reply(texto, tecladoInicio());
  }
});

bot.action("top", async (ctx) => {
  const top = scores.getTop(5);
  if (top.length === 0) {
    try {
      await ctx.editMessageText("Aún no hay jugadores en el ranking.", tecladoInicio());
    } catch {
      await ctx.reply("Aún no hay jugadores en el ranking.", tecladoInicio());
    }
    return;
  }
  const texto =
    "Top 5:\n" +
    top
      .map((p, i) => `${i + 1}. ${p.name || "Anónimo"} - ${p.points} pts (aciertos: ${p.wins})`)
      .join("\n");
  try {
    await ctx.editMessageText(texto, tecladoInicio());
  } catch {
    await ctx.reply(texto, tecladoInicio());
  }
});

// --- iniciar juego ---
bot.action("start_game", async (ctx) => {
  try {
    await ctx.editMessageText("Elige un nivel:", tecladoNiveles());
  } catch {
    await ctx.reply("Elige un nivel:", tecladoNiveles());
  }
});

// --- elegir nivel ---
bot.action(/^nivel:(facil|medio|dificil)$/, async (ctx) => {
  const nivel = ctx.match[1];
  const reto = retos.getReto(nivel); // {id, pregunta, opciones, explicacion}
  const userId = ctx.from.id;

  sesiones.set(userId, { retoActual: reto });

  const texto = `Nivel: ${nivel}\n\n${reto.pregunta}`;
  try {
    await ctx.editMessageText(texto, tecladoOpciones(reto.opciones));
  } catch {
    await ctx.reply(texto, tecladoOpciones(reto.opciones));
  }
});

// --- responder ---
bot.action(/^ans:(.+)$/s, async (ctx) => {
  const userId = ctx.from.id;
  const name = ctx.from.first_name || "Jugador";
  const ses = sesiones.get(userId);
  if (!ses || !ses.retoActual) {
    await ctx.answerCbQuery("No hay un reto activo. Inicia uno.");
    return;
  }

  const elegido = ctx.match[1];
  const ok = retos.checkRespuesta(ses.retoActual, elegido);

  let texto;
  if (ok) {
    scores.addWin(userId, name);
    texto =
      "Respuesta correcta.\n" +
      (ses.retoActual.explicacion ? `Explicación: ${ses.retoActual.explicacion}\n` : "") +
      "\n¿Quieres jugar otra vez?";
  } else {
    scores.addLoss(userId, name);
    texto =
      "Respuesta incorrecta.\n" +
      (ses.retoActual.explicacion ? `Explicación: ${ses.retoActual.explicacion}\n` : "") +
      "\nInténtalo de nuevo o vuelve al menú.";
  }

  // limpiar reto
  sesiones.set(userId, { retoActual: null });

  const teclado = Markup.inlineKeyboard([
    [Markup.button.callback("Otro reto", "start_game")],
    [Markup.button.callback("Mi puntaje", "stats")],
    [Markup.button.callback("Menú", "home")]
  ]);

  try {
    await ctx.editMessageText(texto, teclado);
  } catch {
    await ctx.reply(texto, teclado);
  }
});

// --- fallback de texto: redirige a menú ---
bot.on("text", async (ctx) => {
  await ctx.reply("Usa los botones para jugar.", tecladoInicio());
});

// --- Lanzar bot ---
bot.launch().then(() => {
  console.log("Bot corriendo en modo polling...");
});

// --- HTTP keep-alive para Render ---
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("bot ok\n");
});
server.listen(PORT, () => {
  console.log(`HTTP keep-alive escuchando en puerto ${PORT}`);
});

// Manejo de señales
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
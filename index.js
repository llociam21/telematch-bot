// index.js (CommonJS) — Telegraf + servidor keep-alive para Render
require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const http = require("http");

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error("Falta BOT_TOKEN en variables de entorno.");
}
const bot = new Telegraf(BOT_TOKEN);

// === Estado en memoria por usuario ===
const sesiones = new Map(); // userId -> { nivel, reto, esperandoRespuesta: boolean }

const { niveles, getReto, verificarRespuesta } = require("./retos");

// ==== UI Helpers ====
function menuPrincipal() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("🎮 Iniciar reto", "INICIAR_RETO")],
    [Markup.button.callback("📜 Ver reglas", "VER_REGLAS")],
  ]);
}

function tecladoNiveles() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("🟢 Fácil", "NIVEL_fácil")],
    [Markup.button.callback("🟡 Medio", "NIVEL_medio")],
    [Markup.button.callback("🔴 Difícil", "NIVEL_difícil")],
    [Markup.button.callback("⬅️ Volver", "VOLVER_MENU")],
  ]);
}

function tecladoOpciones(opciones) {
  // crea botones de opciones como callbacks O_
  const filas = opciones.map((op) => [Markup.button.callback(op, `O_${op}`)]);
  filas.push([Markup.button.callback("❌ Cancelar", "CANCELAR_RETO")]);
  return Markup.inlineKeyboard(filas);
}

// ==== /start ====
bot.start(async (ctx) => {
  await ctx.reply("¡Hola! Soy MatchBot 🤖\nPulsa un botón para empezar.", menuPrincipal());
});

// ==== Reglas ====
bot.action("VER_REGLAS", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText(
    "📜 *Reglas*\n1) Elige un nivel.\n2) Responde seleccionando la opción correcta.\n3) ¡Suma aciertos! 🎯",
    { parse_mode: "Markdown", ...menuPrincipal() }
  );
});

// ==== Volver al menú ====
bot.action("VOLVER_MENU", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageText("Menú principal:", menuPrincipal());
});

// ==== Iniciar flujo de reto ====
bot.action("INICIAR_RETO", async (ctx) => {
  await ctx.answerCbQuery();
  // mostramos selección de nivel
  await ctx.editMessageText("Elige un nivel para comenzar:", tecladoNiveles());
});

// ==== Selección de nivel ====
niveles.forEach((nivel) => {
  bot.action(`NIVEL_${nivel}`, async (ctx) => {
    await ctx.answerCbQuery();
    const uid = String(ctx.from.id);
    const reto = getReto(nivel);
    sesiones.set(uid, { nivel, reto, esperandoRespuesta: true });

    await ctx.editMessageText(
      `Nivel: *${nivel}*\n\n❓ ${reto.pregunta}`,
      { parse_mode: "Markdown", ...tecladoOpciones(reto.opciones) }
    );
  });
});

// ==== Cancelar reto ====
bot.action("CANCELAR_RETO", async (ctx) => {
  await ctx.answerCbQuery("Reto cancelado.");
  const uid = String(ctx.from.id);
  sesiones.delete(uid);
  await ctx.editMessageText("Reto cancelado. ¿Hacemos otra cosa?", menuPrincipal());
});

// ==== Recepción de respuesta por botones (opciones) ====
bot.action(/O_(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const seleccion = ctx.match[1];
  const uid = String(ctx.from.id);
  const ses = sesiones.get(uid);

  if (!ses || !ses.esperandoRespuesta) {
    return ctx.reply("No hay un reto activo. Pulsa *Iniciar reto*.", {
      parse_mode: "Markdown",
      ...menuPrincipal(),
    });
  }

  const resultado = verificarRespuesta(ses.reto, seleccion);
  const explicacion = ses.reto.explicacion ? `\n📝 ${ses.reto.explicacion}` : "";
  await ctx.editMessageText(
    `${resultado.correcta ? "✅" : "❌"} ${resultado.detalle}${explicacion}\n\n¿Otro reto?`,
    menuPrincipal()
  );
  sesiones.delete(uid);
});

// ==== Fallback: si el usuario escribe texto durante un reto, también lo evaluamos ====
bot.on("text", async (ctx) => {
  const uid = String(ctx.from.id);
  const ses = sesiones.get(uid);
  if (!ses || !ses.esperandoRespuesta) return; // ignoramos, está en menú

  const txt = ctx.message.text;
  const resultado = verificarRespuesta(ses.reto, txt);
  const explicacion = ses.reto.explicacion ? `\n📝 ${ses.reto.explicacion}` : "";
  await ctx.reply(
    `${resultado.correcta ? "✅" : "❌"} ${resultado.detalle}${explicacion}\n\n¿Otro reto?`,
    menuPrincipal()
  );
  sesiones.delete(uid);
});

// ==== Lanzamos el bot (polling) ====
bot.launch();
console.log("🤖 Bot corriendo en modo polling...");

// ==== Servidor HTTP keep-alive para Render ====
const PORT = process.env.PORT || 10000;
const server = http.createServer((_, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("bot activo\n");
});
server.listen(PORT, () => {
  console.log(`HTTP keep-alive escuchando en puerto ${PORT}`);
});

// ==== Manejo de señales (apagado limpio) ====
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
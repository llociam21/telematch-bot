// index.js — Telematch Bot (CommonJS)

// 1) Cargas base
require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('Falta BOT_TOKEN en variables de entorno');
}

const bot = new Telegraf(BOT_TOKEN);

// 2) Textos (ES/EN)
const i18n = {
  es: {
    welcomeTitle: '¡Hola! Soy MatchBot 🤖',
    welcomeBody:
      'Te ayudo a jugar *retos rápidos* para romper el hielo y conectar con otras personas.\n\n' +
      'Elige una opción para comenzar:',
    btnStart: '🎮 Iniciar reto',
    btnRules: '📜 Ver reglas',
    btnLang: '🌍 Cambiar a Inglés',
    btnContact: '💌 Contacto / Feedback',
    rules:
      '📜 *Reglas rápidas*\n' +
      '1) Elige un nivel y recibe un reto.\n' +
      '2) Responde y avanza al siguiente.\n' +
      '3) Juega con respeto y sentido del humor 😄',
    contact:
      '💌 *Contacto / Feedback*\n' +
      '¿Ideas o problemas? Escríbeme por aquí y ¡gracias por mejorar el juego!',
    pickLevel: 'Elige tu nivel de reto:',
    level1: 'Nivel 1 (suave) 🟢',
    level2: 'Nivel 2 (medio) 🟠',
    level3: 'Nivel 3 (picante) 🔴',
    back: '⬅️ Volver al menú',
    pong: '🏓 ¡Pong!',
    switchedTo: 'Idioma cambiado a *Español* 🇪🇸'
  },
  en: {
    welcomeTitle: 'Hi! I’m MatchBot 🤖',
    welcomeBody:
      'I help you play *quick challenges* to break the ice and connect with people.\n\n' +
      'Pick an option to start:',
    btnStart: '🎮 Start challenge',
    btnRules: '📜 View rules',
    btnLang: '🌍 Switch to Spanish',
    btnContact: '💌 Contact / Feedback',
    rules:
      '📜 *Quick rules*\n' +
      '1) Pick a level and get a challenge.\n' +
      '2) Reply and move to the next.\n' +
      '3) Play respectfully and have fun 😄',
    contact:
      '💌 *Contact / Feedback*\n' +
      'Got ideas or issues? Send me a message here—thanks for making the game better!',
    pickLevel: 'Choose your challenge level:',
    level1: 'Level 1 (easy) 🟢',
    level2: 'Level 2 (medium) 🟠',
    level3: 'Level 3 (spicy) 🔴',
    back: '⬅️ Back to menu',
    pong: '🏓 Pong!',
    switchedTo: 'Language switched to *English* 🇬🇧'
  }
};

// 3) Preferencias por usuario (en memoria)
const userPrefs = new Map(); // key: userId, value: { lang: 'es' | 'en' }
const getLang = (id) => userPrefs.get(id)?.lang || 'es';
const setLang = (id, lang) => {
  const current = userPrefs.get(id) || {};
  userPrefs.set(id, { ...current, lang });
};
const t = (id, key) => i18n[getLang(id)][key];

// 4) Teclados
const menuKeyboard = (lang) => {
  const dict = i18n[lang];
  return Markup.inlineKeyboard([
    [Markup.button.callback(dict.btnStart, 'start_challenge')],
    [Markup.button.callback(dict.btnRules, 'show_rules')],
    [
      Markup.button.callback(
        lang === 'es' ? i18n.es.btnLang : i18n.en.btnLang,
        lang === 'es' ? 'lang_en' : 'lang_es'
      )
    ],
    [Markup.button.callback(dict.btnContact, 'contact')]
  ]);
};

const backKeyboard = (lang) =>
  Markup.inlineKeyboard([[Markup.button.callback(i18n[lang].back, 'go_menu')]]);

const levelKeyboard = (lang) =>
  Markup.inlineKeyboard([
    [Markup.button.callback(i18n[lang].level1, 'lvl_1')],
    [Markup.button.callback(i18n[lang].level2, 'lvl_2')],
    [Markup.button.callback(i18n[lang].level3, 'lvl_3')],
    [Markup.button.callback(i18n[lang].back, 'go_menu')]
  ]);

// 5) Respuesta de bienvenida / menú
async function sendMenu(ctx) {
  const uid = ctx.from.id;
  const lang = getLang(uid);
  await ctx.replyWithMarkdown(
    `*${i18n[lang].welcomeTitle}*\n\n${i18n[lang].welcomeBody}`,
    menuKeyboard(lang)
  );
}

// 6) Comandos
bot.start(async (ctx) => {
  const uid = ctx.from.id;
  if (!userPrefs.has(uid)) setLang(uid, 'es'); // idioma por defecto
  await sendMenu(ctx);
});

bot.command('menu', async (ctx) => sendMenu(ctx));
bot.command('ping', async (ctx) => ctx.reply(i18n[getLang(ctx.from.id)].pong));

// 7) Acciones de los botones
bot.action('go_menu', async (ctx) => {
  await ctx.answerCbQuery();
  // Reemplazamos el mensaje del botón por el menú actual
  const uid = ctx.from.id;
  const lang = getLang(uid);
  await ctx.editMessageText(
    `*${i18n[lang].welcomeTitle}*\n\n${i18n[lang].welcomeBody}`,
    { ...menuKeyboard(lang), parse_mode: 'Markdown' }
  ).catch(async () => {
    // Si no se puede editar (por antigüedad), enviamos uno nuevo
    await sendMenu(ctx);
  });
});

bot.action('show_rules', async (ctx) => {
  await ctx.answerCbQuery();
  const lang = getLang(ctx.from.id);
  await ctx.editMessageText(i18n[lang].rules, {
    ...backKeyboard(lang),
    parse_mode: 'Markdown'
  }).catch(async () => {
    await ctx.replyWithMarkdown(i18n[lang].rules, backKeyboard(lang));
  });
});

bot.action('contact', async (ctx) => {
  await ctx.answerCbQuery();
  const lang = getLang(ctx.from.id);
  await ctx.editMessageText(i18n[lang].contact, {
    ...backKeyboard(lang),
    parse_mode: 'Markdown'
  }).catch(async () => {
    await ctx.replyWithMarkdown(i18n[lang].contact, backKeyboard(lang));
  });
});

bot.action('start_challenge', async (ctx) => {
  await ctx.answerCbQuery();
  const lang = getLang(ctx.from.id);
  await ctx.editMessageText(i18n[lang].pickLevel, levelKeyboard(lang))
    .catch(async () => {
      await ctx.reply(i18n[lang].pickLevel, levelKeyboard(lang));
    });
});

// Cambio de idioma
bot.action('lang_es', async (ctx) => {
  await ctx.answerCbQuery();
  setLang(ctx.from.id, 'es');
  await ctx.replyWithMarkdown(i18n.es.switchedTo);
  await sendMenu(ctx);
});

bot.action('lang_en', async (ctx) => {
  await ctx.answerCbQuery();
  setLang(ctx.from.id, 'en');
  await ctx.replyWithMarkdown(i18n.en.switchedTo);
  await sendMenu(ctx);
});

// Niveles (placeholder: por ahora solo confirmamos selección)
bot.action(['lvl_1', 'lvl_2', 'lvl_3'], async (ctx) => {
  await ctx.answerCbQuery();
  const lang = getLang(ctx.from.id);
  const map = {
    lvl_1: i18n[lang].level1,
    lvl_2: i18n[lang].level2,
    lvl_3: i18n[lang].level3
  };
  await ctx.reply(`✅ ${map[ctx.match[0]]}\n(Pronto: retos reales por nivel 😉)`, backKeyboard(lang));
});

// 8) Respuesta genérica simple (eco) — útil mientras probamos
bot.on('text', async (ctx) => {
  const text = ctx.message.text || '';
  // Si el usuario escribe algo que no sea comando, solo hacemos eco
  if (!text.startsWith('/')) {
    await ctx.reply(`Recibí: “${text}”`);
  }
});

// 9) Logs y errores
bot.catch((err, ctx) => {
  console.error('❌ Error del bot:', err);
  if (ctx && ctx.reply) {
    ctx.reply('Ups, algo se rompió. Intenta de nuevo en unos segundos 🙏');
  }
});

// 🔌 Lanzamos el bot (polling)
bot.launch();
console.log('🤖 Bot corriendo en modo polling…');

// 🌐 Servidor HTTP keep-alive para Render
const PORT = process.env.PORT || 10000;
const server = http.createServer((_req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Bot activo ✅\n');
});
server.listen(PORT, () => {
  console.log(`HTTP keep-alive escuchando en puerto ${PORT}`);
});

// 🧹 Apagado limpio
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
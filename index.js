import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

// Identidad + asegurar que no haya webhook (necesario para polling)
const me = await bot.telegram.getMe();
console.log('Iniciando como @' + me.username);
await bot.telegram.deleteWebhook().catch(() => {});
console.log('Webhook borrado si existia');

// Menú de comandos (aparece al escribir /)
await bot.telegram.setMyCommands([
  { command: 'start', description: 'Iniciar' },
  { command: 'help',  description: 'Ayuda' },
  { command: 'ping',  description: 'Comprobar estado' }
]);

// Respuesta a /start con botones
bot.start((ctx) => {
  return ctx.reply(
    '¡Hola! Soy MatchBot. ¿Qué quieres hacer?',
    Markup.inlineKeyboard([
      [Markup.button.callback('🎮 Iniciar reto', 'init_reto')],
      [Markup.button.callback('📜 Ver reglas', 'ver_reglas')]
    ])
  );
});

bot.command('help', (ctx) =>
  ctx.reply('Comandos: /start, /help, /ping. Usa los botones para navegar.')
);

bot.command('ping', (ctx) => ctx.reply('Pong ✅'));

// Callbacks de los botones
bot.action('init_reto', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.editMessageText('Cargando… (aquí luego conectamos el flujo de retos)');
});

bot.action('ver_reglas', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.reply('Reglas: respeto, consentimiento y diversión. (Luego pondremos /reglas completo)');
});

// Eco para cualquier texto
bot.on('text', (ctx) => ctx.reply('Recibí: "' + ctx.message.text + '"'));

// Manejo de errores
bot.catch((err) => console.error('Error del bot:', err));

// Lanzar
await bot.launch();
console.log('Bot corriendo en modo local (polling)...');

// Apagado limpio
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
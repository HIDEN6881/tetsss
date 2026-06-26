const config = require('./config');
const Database = require('./database');
const TelegramClient = require('./telegram');

const database = new Database(config);

function getChatId(update) {
  if (update.message && update.message.chat) return update.message.chat.id;
  if (update.callback_query && update.callback_query.message && update.callback_query.message.chat) {
    return update.callback_query.message.chat.id;
  }
  return null;
}

function getUserId(update) {
  if (update.message && update.message.from) return update.message.from.id;
  if (update.callback_query && update.callback_query.from) return update.callback_query.from.id;
  return null;
}

function isAllowed(chatId) {
  if (!config.ALLOWED_CHAT_IDS.length) return true;
  return config.ALLOWED_CHAT_IDS.includes(String(chatId));
}

async function handleUpdate(update, client) {
  const message = update.message;
  if (!message || !message.text) {
    return;
  }

  const chatId = getChatId(update);
  const userId = getUserId(update);
  const text = message.text.trim();
  const command = text.split(' ')[0].toLowerCase();

  if (chatId && !isAllowed(chatId)) {
    await client.sendMessage(chatId, 'This bot is not authorized for your chat.');
    return;
  }

  const session = database.getSession(chatId) || {};
  session.lastCommand = command;
  session.userId = String(userId);
  database.saveSession(chatId, session);

  switch (command) {
    case '/start':
    case '/help':
      await client.sendMessage(chatId, config.HELP_TEXT);
      break;
    case '/getnumber': {
      const existing = database.getNumberByUser(userId);
      if (existing) {
        await client.sendMessage(chatId, `You already have number ${existing}.`);
      } else {
        const phoneNumber = database.assignNumber(chatId, userId);
        await client.sendMessage(chatId, `Assigned number: ${phoneNumber}`);
      }
      break;
    }
    case '/mynumber': {
      const existing = database.getNumberByUser(userId);
      if (existing) {
        await client.sendMessage(chatId, `Your number is ${existing}.`);
      } else {
        await client.sendMessage(chatId, 'You do not currently have a number. Use /getnumber.');
      }
      break;
    }
    case '/release': {
      const released = database.releaseNumberByUser(userId);
      if (released) {
        await client.sendMessage(chatId, `Released number ${released}.`);
      } else {
        await client.sendMessage(chatId, 'You do not currently have a number to release.');
      }
      break;
    }
    case '/status': {
      const status = database.getStatus();
      await client.sendMessage(chatId, `Active assignments: ${status.totalNumbers}\nActive sessions: ${status.sessions}`);
      break;
    }
    default:
      await client.sendMessage(chatId, config.HELP_TEXT);
  }
}

async function start() {
  const client = new TelegramClient(config, (update) => handleUpdate(update, client));
  await client.start();
}

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { start, handleUpdate, database };

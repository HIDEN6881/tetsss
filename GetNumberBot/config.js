const path = require('path');

function parseList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

module.exports = {
  APP_NAME: process.env.GETNUMBER_APP_NAME || 'GetNumberBot',
  TELEGRAM_BOT_TOKEN: process.env.GETNUMBER_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '',
  POLL_INTERVAL_MS: Number(process.env.GETNUMBER_POLL_INTERVAL_MS || 2000),
  NUMBER_PREFIX: process.env.GETNUMBER_NUMBER_PREFIX || '+1',
  INITIAL_NUMBER: Number(process.env.GETNUMBER_INITIAL_NUMBER || 1000000),
  NUMBER_STEP: Number(process.env.GETNUMBER_NUMBER_STEP || 1),
  ALLOWED_CHAT_IDS: parseList(process.env.GETNUMBER_ALLOWED_CHAT_IDS || ''),
  SESSIONS_FILE: path.join(__dirname, 'sessions.json'),
  SHARED_OWNER_FILE: path.join(__dirname, '..', 'number_owner.json'),
  HELP_TEXT: [
    'GetNumberBot commands:',
    '/start - show the help menu',
    '/help - show the help menu',
    '/getnumber - assign an available phone number',
    '/mynumber - show your current number',
    '/release - release your current number',
    '/status - show allocation statistics'
  ].join('\n')
};

const path = require('path');

function parseList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

module.exports = {
  APP_NAME: process.env.OTPMONITOR_APP_NAME || 'OTPMonitor',
  POLL_INTERVAL_MS: Number(process.env.OTPMONITOR_POLL_INTERVAL_MS || 4000),
  PANEL_CONFIGS: parseList(process.env.OTPMONITOR_PANELS || ''),
  GROUP_CHAT_IDS: parseList(process.env.OTPMONITOR_GROUP_CHAT_IDS || ''),
  TELEGRAM_BOT_TOKEN: process.env.OTPMONITOR_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '',
  OWNERS_FILE: path.join(__dirname, '..', 'number_owner.json'),
  LOG_FILE: path.join(__dirname, 'otp.log'),
  HELP_TEXT: [
    'OTPMonitor commands:',
    '/start - show monitor status',
    '/help - show help',
    '/status - show worker status'
  ].join('\n')
};

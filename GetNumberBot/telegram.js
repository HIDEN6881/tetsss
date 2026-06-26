const https = require('https');
const querystring = require('querystring');

class TelegramClient {
  constructor(config, updateHandler) {
    this.config = config;
    this.updateHandler = updateHandler;
    this.offset = 0;
  }

  async request(method, payload = {}) {
    if (!this.config.TELEGRAM_BOT_TOKEN) {
      return { ok: false, reason: 'missing-token' };
    }

    const data = JSON.stringify(payload);
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${this.config.TELEGRAM_BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            resolve({ ok: false, error: String(error) });
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  async sendMessage(chatId, text) {
    return this.request('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' });
  }

  async getMe() {
    return this.request('getMe');
  }

  async start() {
    const me = await this.getMe();
    if (!me.ok) {
      console.warn('Telegram is not configured or the token is invalid.');
      return;
    }

    console.log(`Telegram bot ready: ${me.result.username}`);
    this.loop = setInterval(() => this.pollUpdates(), this.config.POLL_INTERVAL_MS);
    await this.pollUpdates();
  }

  async pollUpdates() {
    const result = await this.request('getUpdates', { offset: this.offset, timeout: 10 });
    if (!result.ok) {
      return;
    }

    for (const update of result.result || []) {
      this.offset = update.update_id + 1;
      if (this.updateHandler) {
        await this.updateHandler(update);
      }
    }
  }
}

module.exports = TelegramClient;

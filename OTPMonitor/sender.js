const https = require('https');

class Sender {
  constructor(config) {
    this.config = config;
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

  async sendToGroups(chatIds, text) {
    for (const chatId of chatIds) {
      await this.request('sendMessage', { chat_id: chatId, text });
    }
  }

  async sendToUser(userId, text) {
    await this.request('sendMessage', { chat_id: userId, text });
  }
}

module.exports = Sender;

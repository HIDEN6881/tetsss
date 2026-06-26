const config = require('./config');
const Sender = require('./sender');
const Worker = require('./worker');
const https = require('https');

class TelegramBridge {
  constructor(config, worker) {
    this.config = config;
    this.worker = worker;
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

  async handleUpdate(update) {
    const message = update.message;
    if (!message || !message.text) {
      return;
    }

    const text = message.text.trim();
    const chatId = message.chat && message.chat.id;
    const command = text.split(' ')[0].toLowerCase();

    switch (command) {
      case '/start':
      case '/help':
        await this.sendMessage(chatId, this.config.HELP_TEXT);
        break;
      case '/status':
        await this.sendMessage(chatId, this.worker.running ? 'OTPMonitor is running.' : 'OTPMonitor is stopped.');
        break;
      default:
        await this.sendMessage(chatId, this.config.HELP_TEXT);
    }
  }

  async sendMessage(chatId, text) {
    return this.request('sendMessage', { chat_id: chatId, text });
  }

  async start() {
    await this.worker.start();
    console.log('OTPMonitor ready');
  }
}

async function start() {
  const sender = new Sender(config);
  const worker = new Worker(config, sender);
  const bridge = new TelegramBridge(config, worker);
  await bridge.start();
}

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { start, TelegramBridge };

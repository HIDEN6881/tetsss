const fs = require('fs');
const path = require('path');
const Panel = require('./panel');
const Sender = require('./sender');

class Worker {
  constructor(config, sender, ownersFile = config.OWNERS_FILE) {
    this.config = config;
    this.sender = sender;
    this.ownersFile = ownersFile;
    this.panels = [];
    this.running = false;
  }

  loadOwners() {
    if (!fs.existsSync(this.ownersFile)) {
      return {};
    }
    try {
      return JSON.parse(fs.readFileSync(this.ownersFile, 'utf8'));
    } catch (error) {
      return {};
    }
  }

  initializePanels() {
    const panels = [];
    for (const entry of this.config.PANEL_CONFIGS) {
      const [name, url] = entry.split('|');
      panels.push(new Panel(name || `panel-${panels.length + 1}`, { url: url || '' }));
    }
    this.panels = panels;
    return panels;
  }

  async start() {
    this.running = true;
    this.initializePanels();
    await Promise.all(this.panels.map((panel) => panel.login()));
    this.log('Workers started');
    this.loop = setInterval(() => this.poll(), this.config.POLL_INTERVAL_MS);
    await this.poll();
  }

  async stop() {
    this.running = false;
    if (this.loop) clearInterval(this.loop);
    this.log('Workers stopped');
  }

  async poll() {
    if (!this.running) return;
    const owners = this.loadOwners();
    for (const panel of this.panels) {
      try {
        const messages = await panel.getMessages();
        for (const message of messages) {
          await this.handleMessage(panel, message, owners);
        }
      } catch (error) {
        this.log(`Panel ${panel.name} error: ${error.message}`);
      }
    }
  }

  async handleMessage(panel, message, owners) {
    const phone = message.phone || message.phoneNumber || message.number || null;
    const otp = message.code || message.otp || message.sms || null;
    if (!phone || !otp) {
      return;
    }

    const normalizedPhone = String(phone).trim();
    const ownerEntry = owners[normalizedPhone];
    const ownerId = ownerEntry && ownerEntry.ownerId ? ownerEntry.ownerId : null;

    const text = `[${panel.name}] OTP for ${normalizedPhone}: ${otp}`;
    this.log(text);

    await this.sender.sendToGroups(this.config.GROUP_CHAT_IDS, text);
    if (ownerId) {
      await this.sender.sendToUser(ownerId, text);
    }
  }

  log(message) {
    const entry = `[${new Date().toISOString()}] ${message}`;
    console.log(entry);
    try {
      fs.appendFileSync(this.config.LOG_FILE, `${entry}\n`);
    } catch (error) {
      // ignore log failures
    }
  }
}

module.exports = Worker;

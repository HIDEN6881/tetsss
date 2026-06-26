const fs = require('fs');

class Database {
  constructor(config) {
    this.config = config;
    this.ensureFile(this.config.SESSIONS_FILE, {});
    this.ensureFile(this.config.SHARED_OWNER_FILE, {});
  }

  ensureFile(filePath, fallback) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
    }
  }

  readJson(filePath, fallback = {}) {
    if (!fs.existsSync(filePath)) return fallback;
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      return fallback;
    }
  }

  writeJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  getSessions() {
    return this.readJson(this.config.SESSIONS_FILE, {});
  }

  saveSessions(sessions) {
    this.writeJson(this.config.SESSIONS_FILE, sessions);
  }

  getSession(chatId) {
    const sessions = this.getSessions();
    return sessions[String(chatId)] || null;
  }

  saveSession(chatId, session) {
    const sessions = this.getSessions();
    sessions[String(chatId)] = session;
    this.saveSessions(sessions);
  }

  getOwnerMap() {
    return this.readJson(this.config.SHARED_OWNER_FILE, {});
  }

  saveOwnerMap(ownerMap) {
    this.writeJson(this.config.SHARED_OWNER_FILE, ownerMap);
  }

  formatPhoneNumber(value) {
    return `${this.config.NUMBER_PREFIX}${value}`;
  }

  getNextAvailableNumber(ownerMap = this.getOwnerMap()) {
    let value = this.config.INITIAL_NUMBER;
    while (ownerMap[this.formatPhoneNumber(value)]) {
      value += this.config.NUMBER_STEP;
    }
    return this.formatPhoneNumber(value);
  }

  getNumberByUser(userId) {
    const owners = this.getOwnerMap();
    const normalizedUserId = String(userId);
    for (const [phone, entry] of Object.entries(owners)) {
      if (String(entry.ownerId) === normalizedUserId) {
        return phone;
      }
    }
    return null;
  }

  getOwnerByPhone(phone) {
    return this.getOwnerMap()[phone] || null;
  }

  assignNumber(chatId, userId) {
    const existing = this.getNumberByUser(userId);
    if (existing) {
      return existing;
    }

    const ownerMap = this.getOwnerMap();
    const phoneNumber = this.getNextAvailableNumber(ownerMap);
    ownerMap[phoneNumber] = {
      ownerId: String(userId),
      chatId: String(chatId),
      assignedAt: new Date().toISOString()
    };
    this.saveOwnerMap(ownerMap);

    const session = this.getSession(chatId) || {};
    session.userId = String(userId);
    session.phoneNumber = phoneNumber;
    session.lastCommand = 'getnumber';
    this.saveSession(chatId, session);
    return phoneNumber;
  }

  releaseNumberByUser(userId) {
    const ownerMap = this.getOwnerMap();
    const normalizedUserId = String(userId);
    let releasedPhone = null;

    for (const [phone, entry] of Object.entries(ownerMap)) {
      if (String(entry.ownerId) === normalizedUserId) {
        releasedPhone = phone;
        delete ownerMap[phone];
        break;
      }
    }

    if (releasedPhone) {
      this.saveOwnerMap(ownerMap);
      const session = this.getSession(userId) || {};
      delete session.phoneNumber;
      this.saveSession(userId, session);
    }

    return releasedPhone;
  }

  getStatus() {
    const owners = this.getOwnerMap();
    return {
      totalNumbers: Object.keys(owners).length,
      sessions: Object.keys(this.getSessions()).length
    };
  }
}

module.exports = Database;

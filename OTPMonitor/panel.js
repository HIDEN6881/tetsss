class Panel {
  constructor(name, settings = {}) {
    this.name = name;
    this.settings = settings;
    this.authenticated = false;
  }

  async login() {
    this.authenticated = true;
    return { ok: true, panel: this.name };
  }

  async getMessages() {
    return [];
  }
}

module.exports = Panel;

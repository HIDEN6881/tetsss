/************************************************************
 * OTP BOT - SIMPLE & CLEAN - DYNAMIC PANEL FROM BOT ONLY
 * 200+ COUNTRIES SUPPORT
 ************************************************************/

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const database = require("./database");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");

const {
  BOT_TOKEN,
  OWNER_IDS,
  GRUP_OTP_LINK,
  GET_NUMBER_BOT,
  CHECK_INTERVAL,
  AUTO_DELETE_MS,
  COOLDOWN_MS,
  EMOJI
} = require("./config");

// ================= FILES =================
const NUMBERS_FILE = path.join(__dirname, "numbers_database.txt");
const SENT_FILE = path.join(__dirname, "sent_otp_prtn.json");
const USER_SESSION_FILE = path.join(__dirname, "user_sessions.json");
const USER_LIST_FILE = path.join(__dirname, "user_list.json");
const CHAT_IDS_FILE = path.join(__dirname, "chat_ids.json");
const PANELS_FILE = path.join(__dirname, "panels.json");

// ================= PANELS DYNAMIC =================
let WEB_PANELS = [];
let activeWorkers = {};

function loadPanels() {
  if (!fs.existsSync(PANELS_FILE)) {
    WEB_PANELS = [];
    savePanels();
    return;
  }
  try {
    WEB_PANELS = JSON.parse(fs.readFileSync(PANELS_FILE));
    if (!Array.isArray(WEB_PANELS)) WEB_PANELS = [];
  } catch {
    WEB_PANELS = [];
  }
}

function savePanels() {
  fs.writeFileSync(PANELS_FILE, JSON.stringify(WEB_PANELS, null, 2));
}

function buildPanelConfig(name, ip, user, pass) {
  const baseUrl = `http://${ip}/ints`;
  return {
    name: name.toUpperCase() + " PANEL",
    baseUrl: baseUrl,
    loginUrl: `${baseUrl}/login`,
    signinUrl: `${baseUrl}/signin`,
    smsApiUrl: `${baseUrl}/client/res/data_smscdr.php`,
    username: user,
    password: pass
  };
}

function stopWorker(name) {
  const fullName = name.toUpperCase().includes("PANEL") ? name.toUpperCase() : name.toUpperCase() + " PANEL";
  for (const key of Object.keys(activeWorkers)) {
    if (key.toUpperCase() === fullName) {
      activeWorkers[key].stopped = true;
      delete activeWorkers[key];
      log(`Worker stopped: ${key}`);
      return true;
    }
  }
  return false;
}

function startWorker(cfg) {
  const key = cfg.name;
  if (activeWorkers[key]) {
    activeWorkers[key].stopped = true;
    delete activeWorkers[key];
  }
  const worker = new Worker(cfg);
  worker.run();
  activeWorkers[key] = worker;
  log(`Worker started: ${cfg.name}`);
}

// ================= COUNTRY (200+ COUNTRIES) =================
const COUNTRY_PREFIXES = {
  "1": "🇺🇸🇨🇦",
  "1242": "🇧🇸",
  "1246": "🇧🇧",
  "1264": "🇦🇮",
  "1268": "🇦🇬",
  "1284": "🇻🇬",
  "1340": "🇻🇮",
  "1345": "🇰🇾",
  "1441": "🇧🇲",
  "1473": "🇬🇩",
  "1649": "🇹🇨",
  "1658": "🇯🇲",
  "1664": "🇲🇸",
  "1670": "🇲🇵",
  "1671": "🇬🇺",
  "1684": "🇦🇸",
  "1721": "🇸🇽",
  "1758": "🇱🇨",
  "1767": "🇩🇲",
  "1784": "🇻🇨",
  "1787": "🇵🇷",
  "1809": "🇩🇴",
  "1829": "🇩🇴",
  "1849": "🇩🇴",
  "1868": "🇹🇹",
  "1869": "🇰🇳",
  "1876": "🇯🇲",
  "52": "🇲🇽",
  "53": "🇨🇺",
  "54": "🇦🇷",
  "55": "🇧🇷",
  "56": "🇨🇱",
  "57": "🇨🇴",
  "58": "🇻🇪",
  "500": "🇫🇰",
  "501": "🇧🇿",
  "502": "🇬🇹",
  "503": "🇸🇻",
  "504": "🇭🇳",
  "505": "🇳🇮",
  "506": "🇨🇷",
  "507": "🇵🇦",
  "509": "🇭🇹",
  "591": "🇧🇴",
  "592": "🇬🇾",
  "593": "🇪🇨",
  "594": "🇬🇫",
  "595": "🇵🇾",
  "597": "🇸🇷",
  "598": "🇺🇾",
  "30": "🇬🇷",
  "31": "🇳🇱",
  "32": "🇧🇪",
  "33": "🇫🇷",
  "34": "🇪🇸",
  "350": "🇬🇮",
  "351": "🇵🇹",
  "352": "🇱🇺",
  "353": "🇮🇪",
  "354": "🇮🇸",
  "355": "🇦🇱",
  "356": "🇲🇹",
  "357": "🇨🇾",
  "358": "🇫🇮",
  "359": "🇧🇬",
  "36": "🇭🇺",
  "370": "🇱🇹",
  "371": "🇱🇻",
  "372": "🇪🇪",
  "373": "🇲🇩",
  "374": "🇦🇲",
  "375": "🇧🇾",
  "376": "🇦🇩",
  "377": "🇲🇨",
  "378": "🇸🇲",
  "379": "🇻🇦",
  "380": "🇺🇦",
  "381": "🇷🇸",
  "382": "🇲🇪",
  "383": "🇽🇰",
  "385": "🇭🇷",
  "386": "🇸🇮",
  "387": "🇧🇦",
  "389": "🇲🇰",
  "39": "🇮🇹",
  "40": "🇷🇴",
  "41": "🇨🇭",
  "420": "🇨🇿",
  "421": "🇸🇰",
  "423": "🇱🇮",
  "43": "🇦🇹",
  "44": "🇬🇧",
  "45": "🇩🇰",
  "46": "🇸🇪",
  "47": "🇳🇴",
  "48": "🇵🇱",
  "49": "🇩🇪",
  "7": "🇷🇺🇰🇿",
  "73": "🇷🇺",
  "74": "🇷🇺",
  "75": "🇷🇺",
  "76": "🇰🇿",
  "77": "🇰🇿",
  "78": "🇷🇺",
  "79": "🇷🇺",
  "81": "🇯🇵",
  "82": "🇰🇷",
  "84": "🇻🇳",
  "850": "🇰🇵",
  "852": "🇭🇰",
  "853": "🇲🇴",
  "855": "🇰🇭",
  "856": "🇱🇦",
  "86": "🇨🇳",
  "880": "🇧🇩",
  "886": "🇹🇼",
  "60": "🇲🇾",
  "61": "🇦🇺",
  "62": "🇮🇩",
  "63": "🇵🇭",
  "64": "🇳🇿",
  "65": "🇸🇬",
  "66": "🇹🇭",
  "670": "🇹🇱",
  "673": "🇧🇳",
  "674": "🇳🇷",
  "675": "🇵🇬",
  "676": "🇹🇴",
  "677": "🇸🇧",
  "678": "🇻🇺",
  "679": "🇫🇯",
  "680": "🇵🇼",
  "681": "🇼🇫",
  "682": "🇨🇰",
  "683": "🇳🇺",
  "685": "🇼🇸",
  "686": "🇰🇮",
  "687": "🇳🇨",
  "688": "🇹🇻",
  "689": "🇵🇫",
  "690": "🇹🇰",
  "691": "🇫🇲",
  "692": "🇲🇭",
  "91": "🇮🇳",
  "92": "🇵🇰",
  "93": "🇦🇫",
  "94": "🇱🇰",
  "95": "🇲🇲",
  "960": "🇲🇻",
  "961": "🇱🇧",
  "962": "🇯🇴",
  "963": "🇸🇾",
  "964": "🇮🇶",
  "965": "🇰🇼",
  "966": "🇸🇦",
  "967": "🇾🇪",
  "968": "🇴🇲",
  "970": "🇵🇸",
  "971": "🇦🇪",
  "972": "🇮🇱",
  "973": "🇧🇭",
  "974": "🇶🇦",
  "975": "🇧🇹",
  "976": "🇲🇳",
  "977": "🇳🇵",
  "992": "🇹🇯",
  "993": "🇹🇲",
  "994": "🇦🇿",
  "995": "🇬🇪",
  "996": "🇰🇬",
  "998": "🇺🇿",
  "20": "🇪🇬",
  "211": "🇸🇸",
  "212": "🇲🇦",
  "213": "🇩🇿",
  "216": "🇹🇳",
  "218": "🇱🇾",
  "220": "🇬🇲",
  "221": "🇸🇳",
  "222": "🇲🇷",
  "223": "🇲🇱",
  "224": "🇬🇳",
  "225": "🇨🇮",
  "226": "🇧🇫",
  "227": "🇳🇪",
  "228": "🇹🇬",
  "229": "🇧🇯",
  "230": "🇲🇺",
  "231": "🇱🇷",
  "232": "🇸🇱",
  "233": "🇬🇭",
  "234": "🇳🇬",
  "235": "🇹🇩",
  "236": "🇨🇫",
  "237": "🇨🇲",
  "238": "🇨🇻",
  "239": "🇸🇹",
  "240": "🇬🇶",
  "241": "🇬🇦",
  "242": "🇨🇬",
  "243": "🇨🇩",
  "244": "🇦🇴",
  "245": "🇬🇼",
  "246": "🇮🇴",
  "247": "🇦🇨",
  "248": "🇸🇨",
  "249": "🇸🇩",
  "250": "🇷🇼",
  "251": "🇪🇹",
  "252": "🇸🇴",
  "253": "🇩🇯",
  "254": "🇰🇪",
  "255": "🇹🇿",
  "256": "🇺🇬",
  "257": "🇧🇮",
  "258": "🇲🇿",
  "259": "🇲🇼",
  "260": "🇿🇲",
  "261": "🇲🇬",
  "262": "🇷🇪",
  "263": "🇿🇼",
  "264": "🇳🇦",
  "265": "🇲🇼",
  "266": "🇱🇸",
  "267": "🇧🇼",
  "268": "🇸🇿",
  "269": "🇰🇲",
  "27": "🇿🇦",
  "290": "🇸🇭",
  "291": "🇪🇷",
  "297": "🇦🇼",
  "298": "🇫🇴",
  "299": "🇬🇱"
};

const CLI_MAP = {
  WHATSAPP: "WS", TELEGRAM: "TG", FACEBOOK: "FB", INSTAGRAM: "IG",
  TIKTOK: "TT", VIBER: "VB", WECHAT: "WT", LINE: "LINE",
  SIGNAL: "SG", SNAPCHAT: "SC", MESSENGER: "MS", IMO: "IMO"
};

// ================= SESSION =================
let userSessions = {};
let userList = new Set();

function loadUserSessions() {
  if (!fs.existsSync(USER_SESSION_FILE)) { fs.writeFileSync(USER_SESSION_FILE, "{}"); return; }
  try { userSessions = JSON.parse(fs.readFileSync(USER_SESSION_FILE)); } catch { userSessions = {}; }
}

function saveUserSessions() {
  fs.writeFileSync(USER_SESSION_FILE, JSON.stringify(userSessions, null, 2));
}

function loadUserList() {
  if (!fs.existsSync(USER_LIST_FILE)) { fs.writeFileSync(USER_LIST_FILE, "[]"); return; }
  try { userList = new Set(JSON.parse(fs.readFileSync(USER_LIST_FILE))); } catch { userList = new Set(); }
}

function saveUserList() {
  fs.writeFileSync(USER_LIST_FILE, JSON.stringify([...userList]));
}

function addUser(uid) {
  userList.add(uid);
  saveUserList();
}

// ================= HELPERS =================
function log(msg) {
  console.log(`[${new Date().toLocaleTimeString("id-ID", { hour12: false })}] ${msg}`);
}

function maskNumber(num) {
  if (!num) return "XXXX";
  const s = String(num).replace(/\D/g, "");
  return s.length > 6 ? s.slice(0, 4) + "***" + s.slice(-3) : s;
}

function extractOTP(msg) {
  if (!msg) return "CODE";
  const m = msg.match(/\b(\d{4,8})\b/);
  if (m) return m[1];
  const m2 = msg.match(/\b(\d{3}-\d{3})\b/);
  if (m2) return m2[1].replace("-", "");
  return "MSG";
}

function getCountry(num) {
  if (!num) return "";
  const clean = num.replace(/\D/g, "");
  for (let len of [3, 2, 1]) {
    const p = clean.substring(0, len);
    if (COUNTRY_PREFIXES[p]) return COUNTRY_PREFIXES[p];
  }
  return "";
}

function isGroup(chatId) {
  return String(chatId).startsWith("-");
}

// ================= DATABASE =================
function loadNumbers() {
  if (!fs.existsSync(NUMBERS_FILE)) {
    fs.writeFileSync(NUMBERS_FILE, "62881010428254\n62881010499797\n62881010579383\n");
    return ["62881010428254", "62881010499797", "62881010579383"];
  }
  return fs.readFileSync(NUMBERS_FILE, "utf8").split("\n").map(n => n.trim()).filter(n => n);
}

function saveNumbers(arr) {
  fs.writeFileSync(NUMBERS_FILE, arr.join("\n"));
}

function clearNumbers() {
  fs.writeFileSync(NUMBERS_FILE, "");
  log("Database nomor dikosongkan");
}

let sentOTP = new Set();

function loadSent() {
  if (!fs.existsSync(SENT_FILE)) fs.writeFileSync(SENT_FILE, "[]");
  try { sentOTP = new Set(JSON.parse(fs.readFileSync(SENT_FILE))); } catch { sentOTP = new Set(); }
}

function saveSent() {
  fs.writeFileSync(SENT_FILE, JSON.stringify([...sentOTP]));
}

// ================= TELEGRAM API =================
async function delMsg(chatId, msgId) {
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
      chat_id: chatId, message_id: msgId
    });
  } catch {}
}

async function sendMsg(chatId, text, del = false, extra = {}) {
  try {
    const res = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...extra
    });
    if (del && res.data?.ok && res.data?.result) {
      setTimeout(() => delMsg(chatId, res.data.result.message_id), AUTO_DELETE_MS);
    }
    return res;
  } catch (e) {
    return null;
  }
}

async function sendDocument(chatId, filePath, caption = "") {
  try {
    const FormData = require("form-data");
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("document", fs.createReadStream(filePath));
    if (caption) form.append("caption", caption);
    const res = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, form, {
      headers: form.getHeaders(),
      timeout: 60000
    });
    return res;
  } catch (e) {
    return null;
  }
}

async function editMsg(chatId, msgId, text, extra = {}) {
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
      chat_id: chatId,
      message_id: msgId,
      text: text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...extra
    });
  } catch {}
}

async function answerCb(cbId, text, alert = false) {
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      callback_query_id: cbId, text: text, show_alert: alert
    });
  } catch {}
}

// ================= BROADCAST =================
async function broadcastToAll(msgText, del = false) {
  const users = [...userList];
  log(`Broadcast ke ${users.length} user`);
  let success = 0, fail = 0;
  for (const uid of users) {
    try {
      const res = await sendMsg(uid, msgText, del);
      if (res && res.data?.ok) success++;
      else fail++;
      await new Promise(r => setTimeout(r, 50));
    } catch { fail++; }
  }
  return { success, fail, total: users.length };
}

// ================= COOLDOWN =================
function isCooldown(uid) {
  if (!userSessions[uid] || !userSessions[uid].lastGet) return false;
  const sisa = COOLDOWN_MS - (Date.now() - userSessions[uid].lastGet);
  return sisa > 0 ? Math.ceil(sisa / 1000) : false;
}

// ================= HANDLER =================
async function startPolling() {
  let offset = 0;
  while (true) {
    try {
      const res = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`, {
        params: { offset: offset + 1, timeout: 30, allowed_updates: ["message", "callback_query"] }
      });
      if (res.data?.result) {
        for (const u of res.data.result) {
          offset = u.update_id;
          if (u.callback_query) await handleCb(u.callback_query);
          if (u.message) await handleMsg(u.message);
        }
      }
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
}

async function handleCb(q) {
  const uid = String(q.from.id);
  const cid = String(q.message.chat.id);
  const data = q.data;

  if (data === "getnum") {
    if (isGroup(cid)) {
      await answerCb(q.id, "Get number cuma bisa di chat bot!", true);
      return;
    }
    await getNumbers(cid, uid, q.id);
    return;
  }

  if (data === "panel") {
    await panelStatus(cid, q.id);
    return;
  }

  if (data === "confirm_clear") {
    await executeClear(cid, uid, q.message.message_id, q.id);
    return;
  }

  if (data === "cancel_clear") {
    await answerCb(q.id, "Dibatalkan");
    await delMsg(cid, q.message.message_id);
    return;
  }
}

async function handleMsg(msg) {
  const cid = String(msg.chat.id);
  const uid = String(msg.from.id);
  const txt = (msg.text || msg.caption || "").trim();
  const isGrp = isGroup(cid);

  if (!isGrp) addUser(uid);

  // UPLOAD
  if (msg.reply_to_message && msg.reply_to_message.document && txt === "/upload") {
    await uploadFile(msg, cid);
    return;
  }

  // /start
  if (txt === "/start") {
    if (isGrp) {
      await sendMsg(cid, "<b>Get Number</b>\n\nKlik tombol buat dapetin nomor.\n\nGet number cuma bisa di chat bot (PM), bukan di grup.", true);
      return;
    }
    await sendStartMenu(cid, uid);
    return;
  }

  // /getnumber
  if (txt === "/getnumber") {
    if (isGrp) {
      await sendMsg(cid, `Get number cuma bisa di chat bot (PM). Klik <a href="${GET_NUMBER_BOT}">@MAKLOMATEKOTP_BOT</a> buat mulai.`, true);
      return;
    }
    await getNumbers(cid, uid);
    return;
  }

  // /getfile
  if (txt === "/getfile") {
    if (!fs.existsSync(NUMBERS_FILE)) {
      await sendMsg(cid, "File database belum ada.", true);
      return;
    }
    const stats = fs.statSync(NUMBERS_FILE);
    if (stats.size === 0) {
      await sendMsg(cid, "Database kosong.", true);
      return;
    }
    await sendDocument(cid, NUMBERS_FILE, "numbers_database.txt");
    return;
  }

  if (!OWNER_IDS.includes(uid)) return;

  // /setpanel NAMA:IP:USER:PASS
  if (txt.startsWith("/setpanel")) {
    const parts = txt.split(/\s+/);
    if (parts.length < 2) {
      await sendMsg(cid, "<b>Format:</b>\n<code>/setpanel NAMA:IP:USER:PASS</code>\n\nContoh:\n<code>/setpanel GAZA:11.234.211:admin:pass123</code>", true);
      return;
    }
    const args = parts[1].split(":");
    if (args.length !== 4) {
      await sendMsg(cid, "<b>Format salah!</b>\n\nGunakan:\n<code>/setpanel NAMA:IP:USER:PASS</code>", true);
      return;
    }
    const [name, ip, user, pass] = args;
    const panelName = name.toUpperCase() + " PANEL";
    const existingIdx = WEB_PANELS.findIndex(p => p.name === panelName);
    const cfg = buildPanelConfig(name, ip, user, pass);
    
    if (existingIdx !== -1) {
      WEB_PANELS[existingIdx] = cfg;
      stopWorker(panelName);
      startWorker(cfg);
      savePanels();
      await sendMsg(cid, `<b>Panel diupdate!</b>\n\nNama: ${panelName}\nIP: ${ip}\nUser: ${user}\n\nWorker di-restart.`, true);
      log(`Panel updated: ${panelName}`);
    } else {
      WEB_PANELS.push(cfg);
      startWorker(cfg);
      savePanels();
      await sendMsg(cid, `<b>Panel ditambah!</b>\n\nNama: ${panelName}\nIP: ${ip}\nUser: ${user}\n\nTotal panel: ${WEB_PANELS.length}`, true);
      log(`Panel added: ${panelName}`);
    }
    return;
  }

  // /delpanel NAMA
  if (txt.startsWith("/delpanel")) {
    const parts = txt.split(/\s+/);
    if (parts.length < 2) {
      await sendMsg(cid, "<b>Format:</b>\n<code>/delpanel NAMA</code>\n\nContoh:\n<code>/delpanel GAZA</code>", true);
      return;
    }
    const name = parts[1].toUpperCase();
    const panelName = name.includes("PANEL") ? name : name + " PANEL";
    const idx = WEB_PANELS.findIndex(p => p.name.toUpperCase() === panelName);
    
    if (idx === -1) {
      await sendMsg(cid, `<b>Panel "${panelName}" tidak ditemukan!</b>\n\nGunakan /listpanel untuk lihat daftar.`, true);
      return;
    }
    
    const deleted = WEB_PANELS.splice(idx, 1)[0];
    stopWorker(deleted.name);
    savePanels();
    await sendMsg(cid, `<b>Panel dihapus!</b>\n\nNama: ${deleted.name}\nIP: ${deleted.baseUrl}\n\nSisa panel: ${WEB_PANELS.length}`, true);
    log(`Panel deleted: ${deleted.name}`);
    return;
  }

  // /listpanel
  if (txt === "/listpanel") {
    if (WEB_PANELS.length === 0) {
      await sendMsg(cid, "<b>Belum ada panel terdaftar.</b>\n\nGunakan /setpanel buat nambah.", true);
      return;
    }
    let listText = `<b>DAFTAR PANEL</b>\n\n`;
    for (let i = 0; i < WEB_PANELS.length; i++) {
      const p = WEB_PANELS[i];
      const ip = p.baseUrl.replace("http://", "").replace("/ints", "");
      listText += `${i + 1}. <b>${p.name}</b>\n   IP: <code>${ip}</code>\n   User: <code>${p.username}</code>\n\n`;
    }
    listText += `Total: <b>${WEB_PANELS.length}</b> panel`;
    await sendMsg(cid, listText, true);
    return;
  }

  // /panel
  if (txt === "/panel") {
    await panelStatus(cid);
    return;
  }

  // /hapus
  if (txt === "/hapus") {
    const numCount = loadNumbers().length;
    if (numCount === 0) {
      await sendMsg(cid, "Database sudah kosong.", true);
      return;
    }
    const text = `<b>KONFIRMASI HAPUS</b>\n\nJumlah nomor: <b>${numCount}</b>\nUser: <b>${userList.size}</b>\n\nYakin hapus? Broadcast akan dikirim.`;
    const kb = { inline_keyboard: [[
      { text: "YA, HAPUS & BROADCAST", callback_data: "confirm_clear", style: "danger" },
      { text: "BATAL", callback_data: "cancel_clear", style: "secondary" }
    ]]};
    await sendMsg(cid, text, false, { reply_markup: kb });
    return;
  }

  // /broadcast
  if (txt === "/broadcast") {
    await sendMsg(cid, "<b>Broadcast</b>\n\nReply pesan yang mau di broadcast terus ketik /send", true);
    return;
  }

  // /send
  if (msg.reply_to_message && !msg.reply_to_message.document && txt === "/send") {
    const bcText = msg.reply_to_message.text || msg.reply_to_message.caption || "";
    if (!bcText) { await sendMsg(cid, "Reply pesan text dulu.", true); return; }
    await sendMsg(cid, `Broadcast ke <b>${userList.size}</b> user...`, true);
    const result = await broadcastToAll(bcText, true);
    await sendMsg(cid, `<b>Broadcast selesai</b>\n\nBerhasil: ${result.success}\nGagal: ${result.fail}\nTotal: ${result.total}`, true);
    return;
  }

  // /addgrub
  if (txt.startsWith("/addgrub")) {
    const parts = txt.split(/\s+/);
    if (parts.length < 2) { await sendMsg(cid, "<code>/addgrub -1001234567890</code>", true); return; }
    const grubId = parts[1];
    if (!grubId.startsWith("-100")) { await sendMsg(cid, "ID grup harus -100", true); return; }
    if (CHAT_IDS.includes(grubId)) { await sendMsg(cid, "Udah ada di list.", true); return; }
    try {
      const test = await sendMsg(grubId, "Bot terhubung. OTP akan otomatis masuk.", true);
      if (!test || !test.data?.ok) { await sendMsg(cid, "Bot ga bisa kirim. Jadiin admin dulu.", true); return; }
    } catch { await sendMsg(cid, "Gagal kirim pesan.", true); return; }
    CHAT_IDS.push(grubId);
    saveChatIds();
    await sendMsg(cid, `<b>Grup ditambah!</b>\nID: <code>${grubId}</code>\nTotal: <b>${CHAT_IDS.length}</b>`, true);
    log(`Grup ditambah: ${grubId}`);
    return;
  }

  // /listgrub
  if (txt === "/listgrub") {
    let listText = `<b>Daftar Grup OTP</b>\n\n`;
    for (let i = 0; i < CHAT_IDS.length; i++) listText += `${i + 1}. <code>${CHAT_IDS[i]}</code>\n`;
    listText += `\nTotal: <b>${CHAT_IDS.length}</b>`;
    await sendMsg(cid, listText, true);
    return;
  }

  // /delgrub
  if (txt.startsWith("/delgrub")) {
    const parts = txt.split(/\s+/);
    if (parts.length < 2) { await sendMsg(cid, "<code>/delgrub -1001234567890</code>", true); return; }
    const grubId = parts[1];
    const idx = CHAT_IDS.indexOf(grubId);
    if (idx === -1) { await sendMsg(cid, "Ga ada di list.", true); return; }
    CHAT_IDS.splice(idx, 1);
    saveChatIds();
    await sendMsg(cid, `<b>Grup dihapus!</b>\nSisa: <b>${CHAT_IDS.length}</b>`, true);
    log(`Grup dihapus: ${grubId}`);
    return;
  }
}

// ================= START MENU - FULL BUTTON =================
async function sendStartMenu(cid, uid) {
  const isOwner = OWNER_IDS.includes(uid);
  
  let text = `🌟 <b>SELAMAT DATANG DI SMSHADI OTP BOT</b> 🌟\n\n`;
  text += `🔹 Dapatkan nomor virtual dari berbagai negara\n`;
  text += `🔹 OTP masuk otomatis ke bot & grup\n`;
  text += `🔹 Cooldown 3 detik\n\n`;
  text += `Total Nomor: <b>${loadNumbers().length}</b> ✅`;

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "🚀 GET NUMBER", 
          callback_data: "getnum",
          // icon_custom_emoji_id: EMOJI.GET_NUMBER 
        }
      ],
      [
        { 
          text: "📋 GRUP OTP", 
          url: GRUP_OTP_LINK 
        }
      ],
      [
        { 
          text: "📥 DOWNLOAD DATABASE", 
          callback_data: "getfile" 
        }
      ]
    ]
  };

  // Menu Owner
  if (isOwner) {
    text += `\n\n👑 <b>OWNER MENU</b>`;
    
    keyboard.inline_keyboard.push(
      [{ text: "🔄 STATUS PANEL", callback_data: "panel" }],
      [
        { text: "🗑️ HAPUS SEMUA NOMOR", callback_data: "confirm_clear" }
      ],
      [
        { text: "📢 BROADCAST", callback_data: "broadcast_menu" },
        { text: "📊 LIST PANEL", callback_data: "listpanel_menu" }
      ]
    );
  }

  await sendMsg(cid, text, true, { 
    reply_markup: keyboard,
    parse_mode: "HTML"
  });
}

// ================= GET NUMBERS =================
async function getNumbers(cid, uid, cbId = null) {
  if (isGroup(cid)) {
    if (cbId) await answerCb(cbId, "Get number cuma bisa di chat bot!", true);
    return;
  }

  const cd = isCooldown(uid);
  if (cd) {
    const t = `Tunggu ${cd} detik lagi`;
    if (cbId) await answerCb(cbId, t, true);
    else await sendMsg(cid, t, true);
    return;
  }

  const all = loadNumbers();
  if (!all.length) {
    if (cbId) await answerCb(cbId, "Belum ada nomor", true);
    await sendMsg(cid, "Belum ada nomor tersedia.", true);
    return;
  }

  if (!userSessions[uid]) userSessions[uid] = { idx: 0, cid, lastMsgId: null };
  const s = userSessions[uid];
  let idx = s.idx || 0;
  if (idx >= all.length) idx = 0;

  const nums = [];
  for (let i = 0; i < 3; i++) nums.push(all[(idx + i) % all.length]);

  s.idx = (idx + 3) % all.length;
  s.lastGet = Date.now();
  s.active = nums;
  s.cid = cid;

  let list = "";
  for (const n of nums) list += `${getCountry(n)} <code>${n}</code>\n`;

  const sisa = all.length - idx - 3;
  const info = sisa > 0 ? `\n+${sisa} nomor lainnya` : "";

  const text = `<b>NOMOR TERSEDIA</b>\n\n${list}\nTotal: <b>${all.length}</b> nomor${info}`;

  const kb = { inline_keyboard: [
    [{ text: "GET NUMBER", callback_data: "getnum", icon_custom_emoji_id: EMOJI.GET_NUMBER, style: "success" }],
    [{ text: "GRUP OTP", url: GRUP_OTP_LINK, icon_custom_emoji_id: EMOJI.GRUP_OTP, style: "success" }]
  ]};

  if (s.lastMsgId) await delMsg(cid, s.lastMsgId);

  const res = await sendMsg(cid, text, true, { reply_markup: kb });
  if (res && res.data?.ok && res.data?.result) s.lastMsgId = res.data.result.message_id;
  saveUserSessions();

  if (cbId) await answerCb(cbId, "3 nomor diambil");
  log(`User ${uid} get number`);
}

// ================= PANEL STATUS =================
async function panelStatus(cid, cbId = null) {
  if (WEB_PANELS.length === 0) {
    await sendMsg(cid, "<b>Tidak ada panel terdaftar.</b>\n\nGunakan /setpanel buat nambah.", true);
    if (cbId) await answerCb(cbId, "Belum ada panel");
    return;
  }
  
  let txt = "<b>Status Panel</b>\n\n";
  for (const p of WEB_PANELS) {
    try {
      await axios.get(p.baseUrl, { timeout: 5000 });
      txt += `${p.name} - ONLINE\n`;
    } catch {
      txt += `${p.name} - OFFLINE\n`;
    }
  }
  txt += `\nGrup OTP: ${CHAT_IDS.length}\nUser: ${userList.size}`;
  
  const kb = { inline_keyboard: [
    [{ text: "REFRESH", callback_data: "panel", icon_custom_emoji_id: EMOJI.REFRESH, style: "success" }],
    [{ text: "GET NUMBER", url: GET_NUMBER_BOT, icon_custom_emoji_id: EMOJI.GET_NUMBER, style: "success" }]
  ]};
  await sendMsg(cid, txt, true, { reply_markup: kb });
  if (cbId) await answerCb(cbId, "Status dicek");
}

// ================= EXECUTE CLEAR =================
async function executeClear(cid, uid, msgId, cbId = null) {
  const numCount = loadNumbers().length;
  clearNumbers();
  for (const k of Object.keys(userSessions)) {
    userSessions[k].idx = 0;
    userSessions[k].active = [];
    userSessions[k].lastMsgId = null;
  }
  saveUserSessions();

  await sendMsg(cid, `${numCount} nomor dihapus.\nBroadcast ke ${userList.size} user...`, true);
  const bcText = "<b>INFO</b>\n\nDatabase nomor dikosongin.\n\nCek lagi nanti kalo udah update.\n/start buat info.";
  const result = await broadcastToAll(bcText, true);
  await sendMsg(cid, `<b>Selesai</b>\n\nNomor dihapus: ${numCount}\nBroadcast ok: ${result.success}\nGagal: ${result.fail}`, true);

  if (msgId) await delMsg(cid, msgId);
  if (cbId) await answerCb(cbId, "Dihapus & broadcast");
  log(`Owner ${uid} hapus ${numCount} nomor`);
}

// ================= UPLOAD FILE =================
async function uploadFile(msg, cid) {
  let statusMsg = null;
  try {
    const loading = await sendMsg(cid, `Memproses file...`, false);
    if (loading && loading.data?.ok) statusMsg = loading.data.result.message_id;

    const doc = msg.reply_to_message.document;
    const fid = doc.file_id;
    const fn = doc.file_name || "file.txt";

    if (statusMsg) await editMsg(cid, statusMsg, `Download file...`);

    const fr = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getFile`, {
      params: { file_id: fid },
      timeout: 30000
    });

    if (!fr.data?.ok) {
      if (statusMsg) await editMsg(cid, statusMsg, "Gagal baca file.");
      return;
    }

    const durl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fr.data.result.file_path}`;

    const fc = await axios.get(durl, {
      responseType: "text",
      timeout: 120000,
      maxContentLength: 50 * 1024 * 1024,
    });

    if (statusMsg) await editMsg(cid, statusMsg, `Parsing nomor...`);

    const lines = fc.data.split(/[\n\r]+/);
    const nums = [];
    for (const line of lines) {
      const cleaned = line.replace(/[^0-9]/g, "").trim();
      if (cleaned.length >= 4 && cleaned.length <= 16) nums.push(cleaned);
    }

    if (!nums.length) {
      if (statusMsg) await editMsg(cid, statusMsg, "File kosong / format salah.");
      return;
    }

    const uniq = [...new Set(nums)];
    saveNumbers(uniq);

    for (const k of Object.keys(userSessions)) {
      userSessions[k].idx = 0;
      userSessions[k].active = [];
      userSessions[k].lastMsgId = null;
    }
    saveUserSessions();

    let prev = uniq.slice(0, 5).map(n => `${getCountry(n)} <code>${n}</code>`).join("\n");
    if (uniq.length > 5) prev += `\n... dan ${uniq.length - 5} lainnya`;

    if (statusMsg) await delMsg(cid, statusMsg);

    const text = `<b>Upload berhasil</b>\n\nFile: ${fn}\nTotal: <b>${uniq.length}</b> nomor\n\n${prev}`;
    const kb = { inline_keyboard: [
      [{ text: "GET NUMBER", callback_data: "getnum", icon_custom_emoji_id: EMOJI.GET_NUMBER, style: "success" }],
      [{ text: "GRUP OTP", url: GRUP_OTP_LINK, icon_custom_emoji_id: EMOJI.GRUP_OTP, style: "success" }]
    ]};
    await sendMsg(cid, text, true, { reply_markup: kb });

    const bcText = `<b>UPDATE</b>\n\nDatabase baru!\nTotal: <b>${uniq.length}</b> nomor.\n\n/getnumber sekarang.\n/getfile buat download.`;
    broadcastToAll(bcText, true);

    log(`Upload ${fn}: ${uniq.length} nomor`);

  } catch (e) {
    log(`Error upload: ${e.message}`);
    if (statusMsg) await editMsg(cid, statusMsg, "Upload gagal.");
    else await sendMsg(cid, "Upload gagal.", true);
  }
}

// ================= SEND OTP =================
async function sendOTP(num, otp, cli, date, panel) {
  try {
    const flag = getCountry(num);
    const cs = CLI_MAP[cli?.toUpperCase()] || cli || "?";
    const masked = maskNumber(num);

    const text = `<b>RECEIVED SMS</b>\n\n${flag} <code>${masked}</code>\n<b>KODE OTP :</b> <code>${otp}</code>\n<b>SERVICE :</b> ${cs}`;

    const kb = { inline_keyboard: [
      [{ text: ` ${otp}`, copy_text: { text: String(otp) }, icon_custom_emoji_id: EMOJI.OTP, style: "primary" }],
      [
        { text: "NUMBER", url: GET_NUMBER_BOT, icon_custom_emoji_id: EMOJI.OTP, style: "success" },
        { text: "OTP", url: GRUP_OTP_LINK, icon_custom_emoji_id: EMOJI.GRUP_OTP, style: "success" }
      ]
    ]};

    for (const cid of CHAT_IDS) {
      await sendMsg(cid, text, true, { reply_markup: kb });
    }

    for (const [uid, s] of Object.entries(userSessions)) {
      if (s.active && s.active.includes(num) && s.cid) {
        const ut = `<b>RECEIVED SMS</b>\n\n${flag} <code>${masked}</code>\n<b>KODE OTP :</b> <code>${otp}</code>\n<b>SERVICE :</b> ${cs}`;
        const ukb = { inline_keyboard: [
          [{ text: ` ${otp}`, copy_text: { text: String(otp) }, icon_custom_emoji_id: EMOJI.OTP, style: "primary" }],
          [{ text: "GET NUMBER LAGI", callback_data: "getnum", icon_custom_emoji_id: EMOJI.GET_NUMBER, style: "success" }]
        ]};
        await sendMsg(s.cid, ut, true, { reply_markup: ukb });
        log(`OTP ke user ${uid}`);
      }
    }

    log(`OTP: ${masked} - ${otp}`);
    return true;
  } catch (e) {
    log(`Error sendOTP: ${e.message}`);
    return false;
  }
}

// ================= WORKER =================
class Worker {
  constructor(cfg) {
    this.name = cfg.name;
    this.base = cfg.baseUrl;
    this.loginUrl = cfg.loginUrl;
    this.signinUrl = cfg.signinUrl;
    this.smsUrl = cfg.smsApiUrl;
    this.user = cfg.username;
    this.pass = cfg.password;
    this.logged = false;
    this.stopped = false;
    this.jar = new CookieJar();
    this.ax = wrapper(axios.create({
      jar: this.jar, withCredentials: true, timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": this.base,
        "Referer": this.loginUrl
      }
    }));
  }

  solveCap(html) {
    try {
      const $ = cheerio.load(html);
      const t = $("input[name='capt']").parent().text().trim();
      const m = t.match(/(\d+)\s*([\+\-])\s*(\d+)\s*=\s*\?/);
      if (m) return m[2] === "+" ? +m[1] + +m[3] : +m[1] - +m[3];
      return 5;
    } catch { return 5; }
  }

  async login() {
    try {
      const p = await this.ax.get(this.loginUrl);
      const cap = this.solveCap(p.data);
      const r = await this.ax.post(this.signinUrl, new URLSearchParams({
        username: this.user, password: this.pass, capt: cap
      }).toString());
      if (r.data && (r.data.includes("dashboard") || r.data.includes("logout"))) {
        log(`${this.name} login OK`);
        this.logged = true;
        return true;
      }
      return false;
    } catch { return false; }
  }

  async cek() {
    try {
      const now = new Date();
      const today = now.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const ys = yest.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
      const p = new URLSearchParams();
      p.append("draw", "1"); p.append("start", "0"); p.append("length", "20");
      p.append("fdate1", `${ys} 00:00:00`); p.append("fdate2", `${today} 23:59:59`);
      p.append("fg", "0");
      const r = await this.ax.post(this.smsUrl, p.toString(), {
        headers: { "X-Requested-With": "XMLHttpRequest" }
      });
      let data;
      try { data = typeof r.data === "string" ? JSON.parse(r.data) : r.data; }
      catch { this.logged = false; return false; }
      const rows = data.aaData || data.data || [];
      for (const row of rows) {
        let sms = "", num = "", cli = "", date = "";
        if (Array.isArray(row)) {
          date = row[0]; num = row[2]; cli = row[3]; sms = row[4];
        } else {
          date = row.date || row.calldate; num = row.number || row.num;
          sms = row.sms || row.message || row.msg; cli = row.cli || row.service;
        }
        if (!sms || sms === "N/A" || !num) continue;
        const otp = extractOTP(sms);
        const key = `${num}-${otp}-${date}`;
        if (!sentOTP.has(key)) {
          log(`SMS: ${num} | ${otp}`);
          const ok = await sendOTP(num, otp, cli, date, this.name);
          if (ok) { sentOTP.add(key); saveSent(); }
        }
      }
      return true;
    } catch { this.logged = false; return false; }
  }

  async run() {
    while (!this.stopped) {
      if (!this.logged) {
        await this.login();
        if (!this.logged) await new Promise(r => setTimeout(r, 5000));
      } else {
        await this.cek();
      }
      await new Promise(r => setTimeout(r, CHECK_INTERVAL));
    }
    log(`${this.name} worker stopped`);
  }
}

// ================= SETUP COMMANDS =================
async function setupCmds() {
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`, {
      commands: [
        { command: "start", description: "Menu utama" },
        { command: "getnumber", description: "Dapatkan 3 nomor (PM only)" },
        { command: "getfile", description: "Download file database nomor" },
        { command: "setpanel", description: "Tambah panel (owner)" },
        { command: "delpanel", description: "Hapus panel (owner)" },
        { command: "listpanel", description: "List panel (owner)" },
        { command: "panel", description: "Status panel (owner)" },
        { command: "hapus", description: "Hapus nomor + broadcast (owner)" },
        { command: "broadcast", description: "Broadcast pesan (owner)" },
        { command: "addgrub", description: "Tambah grup OTP (owner)" },
        { command: "listgrub", description: "List grup OTP (owner)" },
        { command: "delgrub", description: "Hapus grup OTP (owner)" }
      ]
    });
  } catch {}
}

// ================= MAIN =================
async function main() {
  loadChatIds();
  loadSent();
  loadNumbers();
  loadUserSessions();
  loadUserList();
  loadPanels();
  await setupCmds();
  startPolling();
  
  for (const cfg of WEB_PANELS) {
    startWorker(cfg);
  }
  
  log(`Bot jalan... ${WEB_PANELS.length} panel aktif | ${Object.keys(COUNTRY_PREFIXES).length} negara`);
}

process.on('SIGINT', () => {
  for (const key of Object.keys(activeWorkers)) {
    activeWorkers[key].stopped = true;
  }
  saveSent();
  saveUserSessions();
  saveUserList();
  saveChatIds();
  savePanels();
  process.exit();
});

main();

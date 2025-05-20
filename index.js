const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
let config;
try {
  config = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8')
  );
} catch (error) {
  console.error(
    'FATAL ERROR: Could not read config.json. Make sure it exists and is valid JSON.',
    error
  );
  process.exit(1);
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || config.botToken;
if (!BOT_TOKEN) {
  console.error(
    'FATAL ERROR: Telegram Bot Token is not set. Please set it in config.json or as TELEGRAM_BOT_TOKEN environment variable.'
  );
  process.exit(1);
}

const RENDER_APP_URL = process.env.RENDER_APP_URL || config.renderAppUrl;
const {
  readData,
  writeData,
  initializeDataFiles,
} = require('./utils/fileHelper');
const {
  setUserState,
  getUserState,
  clearUserState,
} = require('./utils/stateManager');

initializeDataFiles();

let ADMIN_USER_IDS = [];
try {
  const adminData = readData('admins.json', { adminUserIds: [] });
  ADMIN_USER_IDS = adminData.adminUserIds || [];
} catch (error) {
  console.error(
    'Warning: Could not load admin IDs from admins.json. No users will have admin privileges.',
    error
  );
  ADMIN_USER_IDS = [];
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('🤖 University Bot has started successfully!');
console.log(
  `Loaded ${ADMIN_USER_IDS.length} admin(s): ${ADMIN_USER_IDS.join(', ')}`
);

function isAdmin(userId) {
  return ADMIN_USER_IDS.includes(userId);
}

if (RENDER_APP_URL && RENDER_APP_URL.includes('onrender.com')) {
  setInterval(async () => {
    try {
      const res = await fetch(RENDER_APP_URL);
      console.log(`[Self-ping] ${new Date().toISOString()} → ${res.status}`);
    } catch (err) {
      console.error(
        `[Self-ping error] ${new Date().toISOString()} → ${err.message}`
      );
    }
  }, 5 * 60 * 1000);
  console.log(`Self-ping activated → ${RENDER_APP_URL}`);
} else {
  console.warn(
    'RENDER_APP_URL is not configured correctly or missing. Self-ping disabled.'
  );
}

const sharedDependencies = {
  bot,
  isAdmin,
  readData,
  writeData,
  uuidv4,
  setUserState,
  getUserState,
  clearUserState,
  config,
};

require('./modules/generalHandler')(sharedDependencies);
require('./modules/adminHandler')(sharedDependencies);
require('./modules/newsHandler')(sharedDependencies);
require('./modules/faqHandler')(sharedDependencies);
require('./modules/studentAssistant')(sharedDependencies);
require('./modules/menuHandler')(sharedDependencies);
require('./modules/votingHandler')(sharedDependencies);

bot.on('message', msg => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) {
    if (
      msg.document &&
      getUserState(chatId)?.action.includes('awaiting_file_')
    ) {
    } else {
      return;
    }
  }

  const userState = getUserState(chatId);
  if (!userState) return;
});

bot.on('polling_error', error => {
  console.error(`Polling error: ${error.code} - ${error.message}`);
  if (
    error.message &&
    error.message.includes('ETELEGRAM') &&
    error.message.includes('bot was blocked')
  ) {
    console.warn(
      `Bot was blocked by a user. Chat ID involved (if available in error): ${
        error.message.match(/chat_id: (\d+)/)?.[1] || 'N/A'
      }`
    );
  } else if (error.code === 'EFATAL') {
    console.error(
      'Fatal polling error. The bot might need to be restarted or the issue investigated.'
    );
  }
});

bot.on('webhook_error', error => {
  console.error(`Webhook error: ${error.code} - ${error.message}`);
});

console.log('Event handlers and modules are being set up...');

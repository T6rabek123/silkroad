// index.js
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs

// --- Configuration and Data Loading ---
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

const RENDER_APP_URL = config.renderAppUrl; // Used for self-ping

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

// Initialize data files (creates them with default structure if they don't exist)
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

// --- Bot Initialization ---
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('🤖 University Bot has started successfully!');
console.log(
  `Loaded ${ADMIN_USER_IDS.length} admin(s): ${ADMIN_USER_IDS.join(', ')}`
);

// --- Helper Functions ---
function isAdmin(userId) {
  return ADMIN_USER_IDS.includes(userId);
}

// --- Self-pinging mechanism for Render ---
if (
  RENDER_APP_URL &&
  RENDER_APP_URL !== 'https://YOUR-RENDER-APP-NAME.onrender.com'
) {
  setInterval(async () => {
    try {
      const response = await fetch(RENDER_APP_URL);
      if (response.ok) {
        console.log(
          `Self-ping to ${RENDER_APP_URL} successful at ${new Date().toISOString()}`
        );
      } else {
        console.warn(
          `Self-ping to ${RENDER_APP_URL} failed with status: ${
            response.status
          } at ${new Date().toISOString()}`
        );
      }
    } catch (error) {
      console.error(`Self-ping to ${RENDER_APP_URL} error:`, error.message);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
  console.log(`Self-ping mechanism activated for ${RENDER_APP_URL}`);
} else {
  console.warn(
    'RENDER_APP_URL is not configured or is default. Self-pinging is disabled. Bot may idle on free Render hosting.'
  );
}

// --- Importing Module Handlers ---
// These files will contain the logic for specific features.
// We pass `bot`, `isAdmin`, data helpers, and state helpers to them.
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
// Note: contactAdmin functionality is integrated into generalHandler and adminHandler (for replies)

// --- Global Message Handler (for state-based inputs) ---
bot.on('message', msg => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (!text || text.startsWith('/')) {
    // Ignore commands if already handled, or non-text messages unless specifically handled by a state
    if (
      msg.document &&
      getUserState(chatId)?.action.includes('awaiting_file_')
    ) {
      // File uploads will be handled by specific state handlers in modules
    } else {
      return;
    }
  }

  const userState = getUserState(chatId);
  if (!userState) return; // No active state for this user

  // Delegate to module handlers based on userState.action
  // This is a simplified router; more complex scenarios might need more robust routing.
  // Each module's message handler part should check userState.action.
  // For example, in newsHandler.js:
  // if (userState.action === 'awaiting_news_title' && isAdmin(userId)) { /* handle news title */ }

  // This global handler is a fallback. Specific handlers in modules should ideally capture messages
  // when a state is active. If a message arrives here and a state is active, it might mean
  // a module didn't clear the state or didn't handle the input.
  // console.log(`Global message handler processing for state: ${userState.action} by user ${userId}`);

  // Example: if a module set a state like 'awaiting_generic_input'
  // if (userState.action === 'awaiting_generic_input') {
  //    bot.sendMessage(chatId, `You said: ${text}. Processing...`);
  //    clearUserState(chatId);
  // }
});

// --- Global Error Handling ---
bot.on('polling_error', error => {
  console.error(`Polling error: ${error.code} - ${error.message}`);
  // ETELEGRAM: Forbidden: bot was blocked by the user - common, can be logged less verbosely
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
// Modules will attach their own listeners for commands and callback_queries.

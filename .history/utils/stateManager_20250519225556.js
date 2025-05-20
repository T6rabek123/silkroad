// utils/stateManager.js

/**
 * Manages user states for multi-step operations.
 * Example state: { action: 'awaiting_faq_question', data: {} }
 */
const userStates = {};

/**
 * Sets the state for a given chat ID.
 * @param {number} chatId The chat ID.
 * @param {string | null} action The current action (e.g., 'awaiting_news_title'). Null to clear state.
 * @param {object} data Any temporary data associated with the state.
 */
function setUserState(chatId, action, data = {}) {
  if (action === null) {
    delete userStates[chatId];
  } else {
    userStates[chatId] = { action, data };
  }
  // console.log(`State for ${chatId}:`, userStates[chatId]); // For debugging
}

/**
 * Gets the state for a given chat ID.
 * @param {number} chatId The chat ID.
 * @returns {object | undefined} The user's current state object or undefined if no state.
 */
function getUserState(chatId) {
  return userStates[chatId];
}

/**
 * Clears the state for a given chat ID.
 * @param {number} chatId The chat ID.
 */
function clearUserState(chatId) {
  delete userStates[chatId];
  // console.log(`Cleared state for ${chatId}`); // For debugging
}

module.exports = {
  setUserState,
  getUserState,
  clearUserState,
};

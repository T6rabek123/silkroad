const userStates = {};

function setUserState(chatId, action, data = {}) {
  if (action === null) {
    delete userStates[chatId];
  } else {
    userStates[chatId] = { action, data };
  }
}

function getUserState(chatId) {
  return userStates[chatId];
}

function clearUserState(chatId) {
  delete userStates[chatId];
}

module.exports = {
  setUserState,
  getUserState,
  clearUserState,
};

const { v4: uuidv4 } = require('uuid');

module.exports = ({
  bot,
  isAdmin,
  readData,
  writeData,
  setUserState,
  getUserState,
  clearUserState,
}) => {
  // --- User: View Menu ---
  bot.on('callback_query', callbackQuery => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    if (data === 'view_menu') {
      const menuData = readData('menu.json');
      let responseText = `🍽 **Menu**\n\n`;
      const items = menuData.food_items || [];

      if (items.length > 0) {
        items.forEach(item => {
          responseText += `🔹 **${item.name}** - ${item.price} UZS\n`;
          if (item.image) responseText += `📸 Image: ${item.image}\n`;
          if (item.ratings && item.ratings.length > 0) {
            const avg = (
              item.ratings.reduce((a, b) => a + b, 0) / item.ratings.length
            ).toFixed(1);
            responseText += `⭐ Average Rating: ${avg} (${item.ratings.length} ratings)\n`;
          }
          responseText += '\n';
        });
      } else {
        responseText += 'No food items available.';
      }

      bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'add_food') {
      setUserState(chatId, 'awaiting_food_name');
      bot.sendMessage(chatId, '🍲 Please enter the name of the food:');
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'rate_food') {
      const menuData = readData('menu.json');
      const items = menuData.food_items || [];

      if (items.length === 0) {
        bot.sendMessage(chatId, '😕 No food items to rate.');
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      const inline_keyboard = items.map(item => [
        {
          text: item.name,
          callback_data: `rate_${item.id}`,
        },
      ]);

      bot.sendMessage(chatId, '⭐ Which food would you like to rate?', {
        reply_markup: { inline_keyboard },
      });
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('rate_')) {
      const itemId = data.replace('rate_', '');
      setUserState(chatId, 'awaiting_rating', { itemId });
      bot.sendMessage(chatId, 'Please enter a rating between 1 and 5:');
      bot.answerCallbackQuery(callbackQuery.id);
    }
  });

  bot.on('message', msg => {
    const chatId = msg.chat.id;
    const state = getUserState(chatId);

    if (!state) return;

    const menuData = readData('menu.json');

    if (state.state === 'awaiting_food_name') {
      const name = msg.text;
      setUserState(chatId, 'awaiting_food_image', { name });
      bot.sendMessage(
        chatId,
        '📸 (Optional) Please send an image URL for the food or type "skip":'
      );
    } else if (state.state === 'awaiting_food_image') {
      const image = msg.text.toLowerCase() === 'skip' ? null : msg.text;
      setUserState(chatId, 'awaiting_food_price', {
        name: state.data.name,
        image,
      });
      bot.sendMessage(chatId, '💰 Please enter the price of the food:');
    } else if (state.state === 'awaiting_food_price') {
      const price = parseInt(msg.text);
      if (isNaN(price)) {
        bot.sendMessage(
          chatId,
          '❗ Invalid price. Please enter a valid number:'
        );
        return;
      }
      const { name, image } = state.data;
      const newItem = {
        id: uuidv4(),
        name,
        image,
        price,
        ratings: [],
      };
      menuData.food_items = menuData.food_items || [];
      menuData.food_items.push(newItem);
      writeData('menu.json', menuData);
      clearUserState(chatId);
      bot.sendMessage(chatId, `✅ "${name}" has been added to the menu.`);
    } else if (state.state === 'awaiting_rating') {
      const rating = parseInt(msg.text);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        bot.sendMessage(chatId, '❗ Please enter a number between 1 and 5:');
        return;
      }
      const itemId = state.data.itemId;
      const item = (menuData.food_items || []).find(i => i.id === itemId);
      if (!item) {
        bot.sendMessage(chatId, '❗ Food item not found.');
        clearUserState(chatId);
        return;
      }
      item.ratings = item.ratings || [];
      item.ratings.push(rating);
      writeData('menu.json', menuData);
      clearUserState(chatId);
      bot.sendMessage(
        chatId,
        `✅ Thanks! You rated "${item.name}" with a ${rating}.`
      );
    }
  });
};

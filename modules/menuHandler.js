// modules/menuHandler.js
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
  // Helper to initialize menu data if file is empty or new
  const getMenuData = () => {
    const data = readData('menu.json');
    if (!data.food_items) {
      data.food_items = [];
    }
    return data;
  };

  // --- Main Menu Setup (Example - Trigger this from your bot's /start or main command) ---
  // This function is a placeholder for how you might trigger the main menu.
  // You would call this from your main bot file.
  const sendMainMenu = (chatId, userId) => {
    const keyboard = [[{ text: '🍽️ Menu', callback_data: 'view_all_menu' }]];
    if (isAdmin(userId)) {
      keyboard.push([
        { text: '➕ Add New Food', callback_data: 'admin_add_food_start' },
      ]);
      // You could add a "Delete Food" button here too if needed
      // keyboard.push([{ text: '🗑️ Manage Food Items', callback_data: 'admin_manage_food_items_overview' }]);
    }
    keyboard.push([
      {
        text: '↩️ Back to Main Bot Menu',
        callback_data: 'go_to_main_bot_start',
      },
    ]);

    bot.sendMessage(
      chatId,
      'Welcome to the Food Menu Bot! How can I help you?',
      {
        reply_markup: {
          inline_keyboard: keyboard,
        },
      }
    );
  };

  // --- Callback Query Handler ---
  bot.on('callback_query', async callbackQuery => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    // --- User: View Full Menu ---
    if (data === 'view_all_menu') {
      const menuData = getMenuData();
      let responseText = '🍽️ **Our Full Menu**\n\n';
      const inline_keyboard = [];

      if (menuData.food_items && menuData.food_items.length > 0) {
        menuData.food_items.forEach(item => {
          let totalRating = 0;
          let reviewCount = 0;
          if (item.reviews && item.reviews.length > 0) {
            reviewCount = item.reviews.length;
            item.reviews.forEach(r => (totalRating += r.rating));
          }
          const avgRating =
            reviewCount > 0
              ? (totalRating / reviewCount).toFixed(1)
              : 'No ratings yet';

          responseText += `🔹 **${item.name}** - ${item.price}\n`;
          responseText += `   ⭐ Avg Rating: ${avgRating} (${reviewCount} reviews)\n`;
          // Add button to rate this specific item
          inline_keyboard.push([
            {
              text: `🌟 Rate "${item.name.substring(0, 20)}"`,
              callback_data: `rate_food_init_${item.id}`,
            },
          ]);
          if (item.image_file_id) {
            // To send images, you'd ideally send them one by one, or provide a "view details" button.
            // For simplicity in a single message, we'll just list them.
            // responseText += `   (Image available)\n`;
          }
          responseText += '\n';
        });
        bot.sendMessage(chatId, responseText, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard:
              inline_keyboard.length > 0 ? inline_keyboard : undefined,
          },
        });
      } else {
        responseText += '😕 The menu is currently empty.';
        bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
      }
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- User: Initiate Rating for a Food Item ---
    else if (data.startsWith('rate_food_init_')) {
      const itemId = data.replace('rate_food_init_', '');
      const menuData = getMenuData();
      const foodItem = menuData.food_items.find(item => item.id === itemId);

      if (!foodItem) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'Error: Food item not found.',
          show_alert: true,
        });
        return;
      }
      setUserState(chatId, 'user_awaiting_food_rating', {
        itemId: itemId,
        itemName: foodItem.name,
      });
      bot.sendMessage(
        chatId,
        `How many stars (1-5) would you give to "${foodItem.name}"? Please enter a number.`
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- Admin: Start Adding a New Food Item ---
    else if (data === 'admin_add_food_start' && isAdmin(userId)) {
      setUserState(chatId, 'admin_awaiting_new_food_name');
      bot.sendMessage(chatId, '📝 Enter the name for the new food item:');
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- Admin: Go Back to Admin Panel (Example) or Main Menu ---
    else if (data === 'admin_panel_back' && isAdmin(userId)) {
      bot.answerCallbackQuery(callbackQuery.id);
      // This should ideally trigger your main admin panel display logic
      // For now, let's assume it goes back to the bot's main menu or a general admin message
      sendMainMenu(chatId, userId); // Or your specific admin panel function
    } else if (data === 'go_to_main_bot_start') {
      bot.answerCallbackQuery(callbackQuery.id, { text: 'Returning...' });
      // This should emit an event or call a function that shows your *absolute* main menu of the bot
      // For example, if '/start' in your main bot.js shows the very first menu:
      // bot.emit('text', { chat: { id: chatId }, from: { id: userId, first_name: callbackQuery.from.first_name }, text: '/start' });
      // Or, if you have a function in your main bot file:
      // mainBotInstance.showStartMenu(chatId);
      // For now, just acknowledge.
      bot.sendMessage(chatId, 'Please use the main bot commands to navigate.');
    }

    // --- (Optional) Admin: Manage Food Items Overview ---
    // This part can be expanded if you want a separate screen for managing food
    else if (data === 'admin_manage_food_items_overview' && isAdmin(userId)) {
      const menuData = getMenuData();
      let responseText = '🍲 **Manage Food Items:**\n\n';
      const inline_keyboard = [
        [
          {
            text: '➕ Add New Food Item',
            callback_data: 'admin_add_food_start',
          },
        ],
      ];

      if (menuData.food_items && menuData.food_items.length > 0) {
        responseText += 'Current items:\n';
        menuData.food_items.forEach(item => {
          responseText += `🔹 ${item.name} (${
            item.price
          }) - ID: ${item.id.substring(0, 8)}\n`;
          // Add delete button for each item
          inline_keyboard.push([
            {
              text: `🗑 Delete: ${item.name.substring(0, 15)}`,
              callback_data: `admin_delete_food_item_confirm_${item.id}`,
            },
          ]);
        });
      } else {
        responseText += 'No food items yet.\n';
      }
      inline_keyboard.push([
        { text: '◀️ Back to Admin Menu', callback_data: 'admin_panel_back' },
      ]); // Or main menu

      bot
        .editMessageText(responseText, {
          chat_id: chatId,
          message_id: msg.message_id,
          reply_markup: { inline_keyboard },
          parse_mode: 'Markdown',
        })
        .catch(() =>
          bot.sendMessage(chatId, responseText, {
            // Fallback if edit fails
            reply_markup: { inline_keyboard },
            parse_mode: 'Markdown',
          })
        );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- Admin: Confirm Deletion of a Food Item ---
    else if (
      data.startsWith('admin_delete_food_item_confirm_') &&
      isAdmin(userId)
    ) {
      const itemId = data.replace('admin_delete_food_item_confirm_', '');
      const menuData = getMenuData();
      const itemToDelete = menuData.food_items.find(item => item.id === itemId);

      if (!itemToDelete) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'Error: Item not found.',
          show_alert: true,
        });
        return;
      }

      bot.sendMessage(
        chatId,
        `Are you sure you want to delete "${itemToDelete.name}"? This cannot be undone.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Yes, Delete It',
                  callback_data: `admin_delete_food_item_execute_${itemId}`,
                },
              ],
              [
                {
                  text: '❌ No, Cancel',
                  callback_data: `admin_manage_food_items_overview`,
                },
              ], // Go back to manage screen
            ],
          },
        }
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- Admin: Execute Deletion of a Food Item ---
    else if (
      data.startsWith('admin_delete_food_item_execute_') &&
      isAdmin(userId)
    ) {
      const itemId = data.replace('admin_delete_food_item_execute_', '');
      let menuData = getMenuData();
      const initialLength = menuData.food_items.length;
      menuData.food_items = menuData.food_items.filter(
        item => item.id !== itemId
      );

      if (menuData.food_items.length < initialLength) {
        writeData('menu.json', menuData);
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'Food item deleted!',
        });
        bot
          .deleteMessage(chatId, msg.message_id)
          .catch(e => console.error('Error deleting message:', e));
        // Refresh the manage food items view by faking a callback
        process.nextTick(() => {
          bot.emit('callback_query', {
            ...callbackQuery,
            data: 'admin_manage_food_items_overview',
          });
        });
      } else {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'Error: Could not delete item or item not found.',
          show_alert: true,
        });
      }
    }
  });

  // --- Message Handler for Inputs (User Rating & Admin Adding Food) ---
  bot.on('message', async msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    const photo = msg.photo;

    const userState = getUserState(chatId);
    if (!userState) return;

    // --- Admin: Adding New Food - Name Step ---
    if (
      isAdmin(userId) &&
      userState.action === 'admin_awaiting_new_food_name'
    ) {
      if (!text || text.trim().length < 2) {
        bot.sendMessage(
          chatId,
          '⚠️ Food name is too short. Please enter a valid name, or type /cancel to stop.'
        );
        return;
      }
      if (text.toLowerCase() === '/cancel') {
        clearUserState(chatId);
        bot.sendMessage(chatId, 'Food adding process cancelled.');
        return;
      }
      setUserState(chatId, 'admin_awaiting_new_food_price', {
        name: text.trim(),
      });
      bot.sendMessage(
        chatId,
        `✅ Name set: "${text.trim()}". Now, please enter the price for this item (e.g., "10 USD" or "25000 SUM"):`
      );
    }

    // --- Admin: Adding New Food - Price Step ---
    else if (
      isAdmin(userId) &&
      userState.action === 'admin_awaiting_new_food_price'
    ) {
      if (!text || text.trim().length === 0) {
        bot.sendMessage(
          chatId,
          '⚠️ Price cannot be empty. Please enter a valid price, or type /cancel.'
        );
        return;
      }
      if (text.toLowerCase() === '/cancel') {
        clearUserState(chatId);
        bot.sendMessage(chatId, 'Food adding process cancelled.');
        return;
      }
      setUserState(chatId, 'admin_awaiting_new_food_image', {
        ...userState.data,
        price: text.trim(),
      });
      bot.sendMessage(
        chatId,
        `💰 Price set: "${text.trim()}". Now, please send an image for the food item, or type /skip if you don't want to add an image.`
      );
    }

    // --- Admin: Adding New Food - Image Step ---
    else if (
      isAdmin(userId) &&
      userState.action === 'admin_awaiting_new_food_image'
    ) {
      let imageFileId = null;
      if (photo && photo.length > 0) {
        imageFileId = photo[photo.length - 1].file_id; // Get the largest available photo
      } else if (text && text.toLowerCase() === '/skip') {
        // imageFileId remains null, which is fine
      } else if (text && text.toLowerCase() === '/cancel') {
        clearUserState(chatId);
        bot.sendMessage(chatId, 'Food adding process cancelled.');
        return;
      } else {
        bot.sendMessage(
          chatId,
          '⚠️ Invalid input. Please send a photo, or type /skip to skip adding an image, or /cancel to stop.'
        );
        return;
      }

      const { name, price } = userState.data;
      const menuData = getMenuData();
      const newFoodItem = {
        id: uuidv4(),
        name: name,
        price: price,
        image_file_id: imageFileId,
        reviews: [], // Initialize with empty reviews
      };
      menuData.food_items.push(newFoodItem);
      writeData('menu.json', menuData);

      bot.sendMessage(
        chatId,
        `✅ Success! "${name}" has been added to the menu ${
          imageFileId ? 'with an image' : 'without an image'
        }.`
      );
      clearUserState(chatId);
    }

    // --- User: Food Rating - Rating Step ---
    else if (userState.action === 'user_awaiting_food_rating') {
      const rating = parseInt(text);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        bot.sendMessage(
          chatId,
          '⚠️ Invalid rating. Please enter a number between 1 and 5, or type /cancel to stop.'
        );
        return;
      }
      if (text && text.toLowerCase() === '/cancel') {
        clearUserState(chatId);
        bot.sendMessage(chatId, 'Rating process cancelled.');
        return;
      }
      setUserState(chatId, 'user_awaiting_food_rating_comment', {
        ...userState.data,
        rating: rating,
      });
      bot.sendMessage(
        chatId,
        `⭐ You gave ${rating} star(s) to "${userState.data.itemName}". Now, please add a short comment (optional), or type /skip to submit without a comment.`
      );
    }

    // --- User: Food Rating - Comment Step ---
    else if (userState.action === 'user_awaiting_food_rating_comment') {
      let comment = '';
      if (text && text.toLowerCase() === '/skip') {
        // comment remains empty
      } else if (text && text.toLowerCase() === '/cancel') {
        clearUserState(chatId);
        bot.sendMessage(chatId, 'Rating process cancelled.');
        return;
      } else if (text) {
        comment = text.trim();
      }

      const { itemId, itemName, rating } = userState.data;
      const menuData = getMenuData();
      const foodItemIndex = menuData.food_items.findIndex(
        item => item.id === itemId
      );

      if (foodItemIndex === -1) {
        bot.sendMessage(
          chatId,
          '⚠️ Error: Could not find the food item to save your review. Please try again.'
        );
        clearUserState(chatId);
        return;
      }

      const newReview = {
        reviewId: uuidv4(),
        userId: userId,
        userName:
          `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() ||
          msg.from.username ||
          'Anonymous User',
        rating: rating,
        comment: comment,
        timestamp: new Date().toISOString(),
      };

      if (!menuData.food_items[foodItemIndex].reviews) {
        menuData.food_items[foodItemIndex].reviews = [];
      }
      menuData.food_items[foodItemIndex].reviews.push(newReview);
      writeData('menu.json', menuData);

      bot.sendMessage(
        chatId,
        `✅ Thank you! Your ${rating}-star review for "${itemName}" ${
          comment ? 'with your comment ' : ''
        }has been submitted.`
      );
      clearUserState(chatId);
    }
  });

  // Expose the function to send the main menu if needed by the main bot file
  // This is just an example; adapt to your bot's structure.
  return {
    sendMenuBotMainMenu: sendMainMenu, // You can call this from your main bot file
    // You might not need to return anything if all is handled via bot events
  };
};

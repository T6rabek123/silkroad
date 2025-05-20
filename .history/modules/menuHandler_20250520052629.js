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
  const getDayName = (date = new Date()) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  };

  // --- User: View Menu ---
  bot.on('callback_query', callbackQuery => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    if (data === 'view_menu_today' || data === 'view_menu_weekly') {
      const menuData = readData('menu.json');
      let responseText = '';
      let dayToDisplay = getDayName();

      if (data === 'view_menu_today') {
        responseText = `🍽 **Bugungi Menyu (${
          dayToDisplay.charAt(0).toUpperCase() + dayToDisplay.slice(1)
        })**\n\n`;
        const dailyItems = menuData.daily_menu[dayToDisplay];
        if (dailyItems && dailyItems.length > 0) {
          dailyItems.forEach(item => {
            responseText += `🔹 **${item.name}** - ${item.price} so'm\n${
              item.description ? `   _${item.description}_\n` : ''
            }\n`;
          });
        } else {
          responseText +=
            '😕 Bugun uchun menyu hali kiritilmagan yoki mavjud emas.';
        }
      } else {
        // view_menu_weekly
        responseText = `🗒 **Haftalik Menyu**\n\n`;
        let weeklyMenuEmpty = true;
        const daysOrder = [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ];
        daysOrder.forEach(day => {
          const dailyItems = menuData.daily_menu[day];
          if (dailyItems && dailyItems.length > 0) {
            weeklyMenuEmpty = false;
            responseText += `🗓️ **${
              day.charAt(0).toUpperCase() + day.slice(1)
            }:**\n`;
            dailyItems.forEach(item => {
              responseText += `  🔹 **${item.name}** - ${item.price} so'm\n${
                item.description ? `     _${item.description}_\n` : ''
              }`;
            });
            responseText += '\n';
          }
        });
        if (weeklyMenuEmpty) {
          responseText +=
            "😕 Ushbu hafta uchun menyu hali to'liq kiritilmagan.";
        }
      }
      bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- User: Suggest Food Item ---
    else if (data === 'suggest_food_item') {
      setUserState(chatId, 'user_awaiting_food_suggestion_name');
      bot.sendMessage(
        chatId,
        "🍲 Qanday yangi taomni menyuga qo'shishni taklif qilasiz? Taom nomini yozing:"
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- User: Review Food Item (Start) ---
    else if (data === 'review_food_item') {
      const menuData = readData('menu.json');
      const allItems = new Set(); // Use Set to store unique item names
      Object.values(menuData.daily_menu).forEach(dayItems => {
        dayItems.forEach(item => allItems.add(item.name));
      });
      menuData.food_items.forEach(item => allItems.add(item.name)); // Add from master list too

      if (allItems.size === 0) {
        bot.sendMessage(
          chatId,
          '😕 Hozircha baho berish uchun taomlar mavjud emas.'
        );
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }
      const inline_keyboard = Array.from(allItems).map(itemName => [
        {
          text: itemName,
          callback_data: `review_select_item_${itemName.replace(/\s+/g, '_')}`,
        },
      ]); // Create unique callback data
      inline_keyboard.push([
        { text: '◀️ Orqaga', callback_data: 'main_menu_from_menu' },
      ]);

      bot.sendMessage(chatId, '⭐ Qaysi taomga baho bermoqchisiz?', {
        reply_markup: { inline_keyboard },
      });
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('review_select_item_')) {
      const itemName = data
        .replace('review_select_item_', '')
        .replace(/_/g, ' '); // Restore item name
      setUserState(chatId, 'user_awaiting_food_review_rating', {
        itemName: itemName,
      });
      bot.sendMessage(
        chatId,
        `"${itemName}" taomiga necha baho berasiz (1 dan 5 gacha)? Raqamni yozing:`
      );
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'main_menu_from_menu') {
      // Similar to main_menu_from_faq, send main menu
      bot.answerCallbackQuery(callbackQuery.id);
      // Trigger /start or send main menu message again
      bot.emit('text', {
        chat: { id: chatId },
        from: { id: userId, first_name: callbackQuery.from.first_name },
        text: '/start',
      });
    }

    // --- Admin: Update Daily Menu (Start) ---
    else if (data === 'admin_update_daily_menu' && isAdmin(userId)) {
      const daysKeyboard = [
        ['monday', 'tuesday', 'wednesday'],
        ['thursday', 'friday', 'saturday'],
        ['sunday', '◀️ Admin Panel'],
      ].map(row =>
        row.map(day => {
          if (day === '◀️ Admin Panel')
            return { text: day, callback_data: 'admin_panel_back' };
          return {
            text: day.charAt(0).toUpperCase() + day.slice(1),
            callback_data: `admin_select_day_menu_${day}`,
          };
        })
      );

      bot.sendMessage(chatId, '📅 Qaysi kun uchun menyuni yangilamoqchisiz?', {
        reply_markup: { inline_keyboard: daysKeyboard },
      });
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('admin_select_day_menu_') && isAdmin(userId)) {
      const day = data.replace('admin_select_day_menu_', '');
      setUserState(chatId, 'admin_awaiting_daily_menu_items', {
        day: day,
        items: [],
      });
      bot.sendMessage(
        chatId,
        `📝 **${
          day.charAt(0).toUpperCase() + day.slice(1)
        }** uchun taomlarni kiriting.\nHar bir taomni yangi qatordan quyidagi formatda yozing:\n` +
          '`Taom nomi,Narxi,Qisqacha tavsifi (ixtiyoriy)`\n' +
          "Masalan:\n`Osh,25000,Bayramona osh`\n`Mastava,15000`\n\nBarcha taomlarni kiritib bo'lgach, `/save_menu` deb yozing."
      );
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'admin_panel_back' && isAdmin(userId)) {
      bot.answerCallbackQuery(callbackQuery.id);
      bot.emit('text', {
        chat: { id: chatId },
        from: { id: userId },
        text: '/admin',
      }); // Simulate /admin command
    }
    // --- Admin: Manage Food Items (Master List) ---
    else if (data === 'admin_manage_food_items' && isAdmin(userId)) {
      // Show current food items with options to add new or delete existing
      const menuData = readData('menu.json');
      let responseText = "🍲 **Umumiy Taomlar Ro'yxati:**\n\n";
      const inline_keyboard = [];

      if (menuData.food_items && menuData.food_items.length > 0) {
        menuData.food_items.forEach(item => {
          responseText += `🔹 ${item.name} (${item.category || 'N/A'})${
            item.description
              ? ' - ' + item.description.substring(0, 30) + '...'
              : ''
          }\n`;
          inline_keyboard.push([
            {
              text: `🗑 O'chirish: ${item.name.substring(0, 20)}`,
              callback_data: `admin_delete_food_item_${item.id}`,
            },
          ]);
        });
      } else {
        responseText += "Ro'yxat bo'sh.\n";
      }
      inline_keyboard.push([
        {
          text: "➕ Yangi Taom Qo'shish (Ro'yxatga)",
          callback_data: 'admin_add_master_food_item',
        },
      ]);
      inline_keyboard.push([
        { text: '◀️ Admin Panel', callback_data: 'admin_panel_back' },
      ]);

      bot.sendMessage(chatId, responseText, {
        reply_markup: { inline_keyboard },
        parse_mode: 'Markdown',
      });
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'admin_add_master_food_item' && isAdmin(userId)) {
      setUserState(chatId, 'admin_awaiting_master_food_name');
      bot.sendMessage(
        chatId,
        "🏷 Yangi taom nomini kiriting (umumiy ro'yxat uchun):"
      );
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('admin_delete_food_item_') && isAdmin(userId)) {
      const itemId = data.replace('admin_delete_food_item_', '');
      const menuData = readData('menu.json');
      const initialLength = menuData.food_items.length;
      menuData.food_items = menuData.food_items.filter(
        item => item.id !== itemId
      );
      if (menuData.food_items.length < initialLength) {
        writeData('menu.json', menuData);
        bot.answerCallbackQuery(callbackQuery.id, { text: "Taom o'chirildi!" });
        // Refresh the list:
        bot.deleteMessage(chatId, msg.message_id).catch(e => console.error(e));
        this.handleCallbackQuery({
          message: msg,
          from: { id: userId },
          data: 'admin_manage_food_items',
        }); // 'this' might be an issue, call directly
        // Simulating the call again:
        const self = this; // Or pass the module reference
        setTimeout(
          () =>
            bot.emit('callback_query', {
              message: msg,
              from: { id: userId },
              data: 'admin_manage_food_items',
            }),
          100
        );
      } else {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'Xatolik: Taom topilmadi.',
          show_alert: true,
        });
      }
    }
  });

  // --- Message Handler for Menu Inputs (User and Admin) ---
  bot.on('message', msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    const userState = getUserState(chatId);
    if (!userState) return;

    // --- User Food Suggestion ---
    if (userState.action === 'user_awaiting_food_suggestion_name') {
      if (!text || text.length < 3) {
        bot.sendMessage(
          chatId,
          '⚠️ Taom nomi juda qisqa. Iltimos, qaytadan kiriting yoki /cancel bilan bekor qiling.'
        );
        return;
      }
      setUserState(chatId, 'user_awaiting_food_suggestion_price', {
        name: text,
      });
      bot.sendMessage(
        chatId,
        `✅ Taom nomi: "${text}". Endi uning taxminiy narxini kiriting (masalan, "20000 so'm" yoki "20k"):`
      );
    } else if (userState.action === 'user_awaiting_food_suggestion_price') {
      if (!text) {
        bot.sendMessage(
          chatId,
          '⚠️ Narxni kiriting. Iltimos, qaytadan kiriting yoki /cancel bilan bekor qiling.'
        );
        return;
      }
      const { name } = userState.data;
      const menuData = readData('menu.json');
      const newSuggestion = {
        id: uuidv4(),
        name: name,
        price_suggestion: text,
        userId: userId,
        userName:
          `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() ||
          msg.from.username,
        status: 'pending',
        timestamp: new Date().toISOString(),
      };
      menuData.user_food_suggestions.push(newSuggestion);
      writeData('menu.json', menuData);
      bot.sendMessage(
        chatId,
        `✅ Rahmat! "${name}" (${text}) taomi bo'yicha taklifingiz qabul qilindi va adminlarga ko'rib chiqish uchun yuborildi.`
      );
      clearUserState(chatId);
      // Notify admins (optional)
    }

    // --- User Food Review ---
    else if (userState.action === 'user_awaiting_food_review_rating') {
      const rating = parseInt(text);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        bot.sendMessage(
          chatId,
          "⚠️ Baho 1 dan 5 gacha bo'lgan raqam bo'lishi kerak. Qaytadan kiriting yoki /cancel bilan bekor qiling."
        );
        return;
      }
      setUserState(chatId, 'user_awaiting_food_review_comment', {
        ...userState.data,
        rating: rating,
      });
      bot.sendMessage(
        chatId,
        `⭐ ${rating} baho qabul qilindi. Endi "${userState.data.itemName}" uchun qisqacha izoh (sharh) yozishingiz mumkin (ixtiyoriy, ` /
          skip` yozib o'tkazib yuboring):`
      );
    } else if (userState.action === 'user_awaiting_food_review_comment') {
      const comment = text && text.toLowerCase() !== '/skip' ? text : '';
      const { itemName, rating } = userState.data;

      const menuData = readData('menu.json');
      // Find food_id if possible, or just use name
      let foodId = null;
      const masterItem = menuData.food_items.find(fi => fi.name === itemName);
      if (masterItem) foodId = masterItem.id;
      // If not in master, could be from daily menu only, store by name or create temp ID
      if (!foodId) foodId = `temp_${itemName.replace(/\s+/g, '_')}`;

      const newReview = {
        id: uuidv4(),
        food_id: foodId, // Link to food_items if possible
        foodName: itemName, // Store name for easier display
        userId: userId,
        userName:
          `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() ||
          msg.from.username,
        rating: rating,
        comment: comment,
        timestamp: new Date().toISOString(),
      };
      menuData.reviews.push(newReview);
      writeData('menu.json', menuData);
      bot.sendMessage(
        chatId,
        `✅ Rahmat! "${itemName}" uchun ${rating} yulduzli bahoingiz va izohingiz qabul qilindi.`
      );
      clearUserState(chatId);
    }

    // --- Admin: Daily Menu Items ---
    if (
      isAdmin(userId) &&
      userState.action === 'admin_awaiting_daily_menu_items'
    ) {
      if (text.toLowerCase() === '/save_menu') {
        const { day, items } = userState.data;
        if (items.length === 0) {
          bot.sendMessage(
            chatId,
            `⚠️ ${day} uchun hech qanday taom kiritilmadi. Menyuni saqlash uchun kamida bitta taom kiriting yoki /cancel_admin_op bilan bekor qiling.`
          );
          return;
        }
        const menuData = readData('menu.json');
        menuData.daily_menu[day] = items;
        writeData('menu.json', menuData);
        bot.sendMessage(
          chatId,
          `✅ ${
            day.charAt(0).toUpperCase() + day.slice(1)
          } uchun menyu muvaffaqiyatli saqlandi!`
        );
        clearUserState(chatId);
      } else {
        // Parse item: Name,Price,Description
        const parts = text.split(',');
        if (parts.length < 2 || parts.length > 3) {
          bot.sendMessage(
            chatId,
            "⚠️ Noto'g'ri format. `Taom nomi,Narxi,Tavsifi (ixtiyoriy)` formatida kiriting. Yoki /save_menu bilan saqlang."
          );
          return;
        }
        const newItem = {
          name: parts[0].trim(),
          price: parts[1].trim(),
          description: parts[2] ? parts[2].trim() : '',
        };
        if (!newItem.name || !newItem.price) {
          bot.sendMessage(
            chatId,
            '⚠️ Taom nomi va narxi majburiy. Qaytadan kiriting.'
          );
          return;
        }
        const currentItems = userState.data.items || [];
        currentItems.push(newItem);
        setUserState(chatId, 'admin_awaiting_daily_menu_items', {
          ...userState.data,
          items: currentItems,
        });
        bot.sendMessage(
          chatId,
          `➕ "${newItem.name}" qo'shildi. Yana qo'shing yoki /save_menu bilan saqlang.`
        );
      }
    }

    // --- Admin: Master Food Item ---
    else if (
      isAdmin(userId) &&
      userState.action === 'admin_awaiting_master_food_name'
    ) {
      if (!text || text.length < 3) {
        bot.sendMessage(
          chatId,
          '⚠️ Taom nomi juda qisqa. Qaytadan kiriting yoki /cancel_admin_op bilan bekor qiling.'
        );
        return;
      }
      setUserState(chatId, 'admin_awaiting_master_food_category', {
        name: text,
      });
      bot.sendMessage(
        chatId,
        `✅ Taom nomi: "${text}". Endi uning kategoriyasini kiriting (masalan, "Asosiy taom", "Salat", "Ichimlik", "Desert"):`
      );
    } else if (
      isAdmin(userId) &&
      userState.action === 'admin_awaiting_master_food_category'
    ) {
      if (!text) {
        bot.sendMessage(
          chatId,
          '⚠️ Kategoriyani kiriting. Qaytadan kiriting yoki /cancel_admin_op bilan bekor qiling.'
        );
        return;
      }
      setUserState(chatId, 'admin_awaiting_master_food_description', {
        ...userState.data,
        category: text,
      });
      bot.sendMessage(
        chatId,
        `✅ Kategoriya: "${text}". Endi taom uchun qisqacha tavsif kiriting (ixtiyoriy, ` /
          skip` yozib o'tkazib yuboring):`
      );
    } else if (
      isAdmin(userId) &&
      userState.action === 'admin_awaiting_master_food_description'
    ) {
      const description = text && text.toLowerCase() !== '/skip' ? text : '';
      const { name, category } = userState.data;

      const menuData = readData('menu.json');
      const newMasterFood = {
        id: uuidv4(),
        name: name,
        category: category,
        description: description,
        addedBy: userId,
        addedAt: new Date().toISOString(),
      };
      menuData.food_items.push(newMasterFood);
      writeData('menu.json', menuData);
      bot.sendMessage(
        chatId,
        `✅ Yangi taom "${name}" umumiy ro'yxatga muvaffaqiyatli qo'shildi!`
      );
      clearUserState(chatId);
    }
  });
};

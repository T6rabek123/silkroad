// modules/generalHandler.js
module.exports = ({
  bot,
  isAdmin,
  readData,
  writeData,
  setUserState,
  getUserState,
  clearUserState,
}) => {
  // --- /start command ---
  bot.onText(/\/start/, msg => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name;

    const welcomeMessage = `Assalomu alaykum, ${userName}! 👋\nSilk Road International University of Tourism and Cultural Heritage (@silkroaduni) botiga xush kelibsiz!\n\nQuyidagi menyudan foydalanishingiz mumkin:`;

    const mainKeyboard = {
      reply_markup: {
        keyboard: [
          [
            { text: '📚 Talaba Yordamchisi' },
            { text: '🤔 FAQ (Abituriyentlar)' },
          ],
          [
            { text: '🍽 Oshxona Menyusi' },
            { text: '🗳 Ovoz Berish / Fikr Bildirish' },
          ],
          [{ text: "📰 Yangiliklar va E'lonlar" }],
          [
            {
              text: '🌐 Silkroad Rasmiy Sayti',
              web_app: { url: 'https://www.univ-silkroad.uz/en/' },
            },
          ],
          [{ text: "💬 Admin Bilan Bog'lanish" }],
        ],
        resize_keyboard: true,
        one_time_keyboard: false, // Keep keyboard open
      },
    };

    if (isAdmin(msg.from.id)) {
      mainKeyboard.reply_markup.keyboard.push([{ text: '🛠 Admin Panel' }]);
    }

    bot.sendMessage(chatId, welcomeMessage, {
      ...mainKeyboard,
      parse_mode: 'Markdown',
    });
    clearUserState(chatId); // Clear any previous state
  });

  // --- /help command ---
  bot.onText(/\/help/, msg => {
    const chatId = msg.chat.id;
    const helpMessage =
      `🤖 **Bot Yordam Menyusi** 🤖\n\n` +
      `Ushbu bot Silk Road universiteti talabalari va abituriyentlari uchun mo'ljallangan.\n\n` +
      `**Asosiy bo'limlar:**\n` +
      `📚 **Talaba Yordamchisi:** Dars jadvali, imtihonlar, GPA kalkulyatori, foydali fayllar.\n` +
      `🤔 **FAQ (Abituriyentlar):** Abituriyentlar uchun tez-tez so'raladigan savollar.\n` +
      `🍽 **Oshxona Menyusi:** Kundalik va haftalik taomnoma.\n` +
      `🗳 **Ovoz Berish / Fikr Bildirish:** So'rovnomalarda qatnashing va fikr qoldiring.\n``📰 **Yangiliklar va E'lonlar:** Universitet hayotidagi so'nggi yangiliklar.\n` +
      `🌐 **Silkroad Rasmiy Sayti:** Universitetning rasmiy veb-saytini ochish.\n` +
      `💬 **Admin Bilan Bog'lanish:** Adminlarga o'z murojaatingizni yuboring.\n\n` +
      (isAdmin(msg.from.id)
        ? `🛠 **Admin Panel:** Botni boshqarish uchun maxsus panel (faqat adminlar uchun).\n\n`
        : `\n`) +
      `Boshlash uchun /start buyrug'ini yuboring yoki menyudagi tugmalardan foydalaning.`;

    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  });

  // --- Handling Main Menu Text Inputs ---
  bot.on('message', msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return; // Ignore commands or non-text

    // Clear any pending states if user clicks a main menu button
    const mainMenuItems = [
      '📚 Talaba Yordamchisi',
      '🤔 FAQ (Abituriyentlar)',
      '🍽 Oshxona Menyusi',
      '🗳 Ovoz Berish / Fikr Bildirish',
      "📰 Yangiliklar va E'lonlar",
      "💬 Admin Bilan Bog'lanish",
      '🛠 Admin Panel',
    ];
    if (mainMenuItems.includes(text)) {
      clearUserState(chatId);
    }

    switch (text) {
      case '📚 Talaba Yordamchisi':
        // This will be handled by studentAssistant.js via a command or callback
        bot.sendMessage(chatId, "📚 Talaba Yordamchisi bo'limi. Tanlang:", {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📅 Dars Jadvali', callback_data: 'view_timetable' }],
              [
                {
                  text: '📊 GPA Kalkulyatori',
                  callback_data: 'gpa_calculator',
                },
              ],
              [
                {
                  text: '📎 Foydali Fayllar',
                  callback_data: 'view_useful_files',
                },
              ],
              [
                {
                  text: '✍️ Imtihonlar Jadvali (Tez Kunda)',
                  callback_data: 'view_exams_soon',
                },
              ],
            ],
          },
        });
        break;
      case '🤔 FAQ (Abituriyentlar)':
        // This will be handled by faqHandler.js
        bot.sendMessage(
          chatId,
          "🤔 Abituriyentlar uchun FAQ bo'limi. Savollarni ko'rish uchun tugmani bosing:",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "❓ Savollarni Ko'rish", callback_data: 'view_faqs' }],
              ],
            },
          }
        );
        break;
      case '🍽 Oshxona Menyusi':
        // This will be handled by menuHandler.js
        bot.sendMessage(chatId, '🍽 Oshxona Menyusi. Tanlang:', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📅 Bugungi Menyu', callback_data: 'view_menu_today' }],
              [{ text: '🗒 Haftalik Menyu', callback_data: 'view_menu_weekly' }],
              [
                {
                  text: '➕ Taom Taklif Qilish',
                  callback_data: 'suggest_food_item',
                },
              ],
              [
                {
                  text: '⭐ Taomga Baho Berish',
                  callback_data: 'review_food_item',
                },
              ],
            ],
          },
        });
        break;
      case '🗳 Ovoz Berish / Fikr Bildirish':
        bot.sendMessage(
          chatId,
          "🗳 Ovoz Berish / Fikr Bildirish bo'limi. Tanlang:",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📋 Mavjud So'rovnomalar",
                    callback_data: 'view_polls',
                  },
                ],
                [
                  {
                    text: '✍️ Fikr Bildirish (Adminlarga)',
                    callback_data: 'send_feedback_user',
                  },
                ],
              ],
            },
          }
        );
        break;
      case "📰 Yangiliklar va E'lonlar":
        // This will be handled by newsHandler.js
        bot.sendMessage(
          chatId,
          "📰 Yangiliklar va E'lonlar. So'nggi yangiliklarni ko'rish uchun tugmani bosing:",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📄 Yangiliklarni Ko'rish",
                    callback_data: 'view_news',
                  },
                ],
              ],
            },
          }
        );
        break;
      case "💬 Admin Bilan Bog'lanish":
        setUserState(chatId, 'awaiting_feedback_message');
        bot.sendMessage(
          chatId,
          "✍️ Adminlarga yubormoqchi bo'lgan xabaringizni yozing. Bekor qilish uchun /cancel yozing."
        );
        break;
      case '🛠 Admin Panel':
        if (isAdmin(userId)) {
          // This will be handled by adminHandler.js via a command or callback
          // For direct text click:
          const adminPanelMessage = '🛠 Admin Paneliga Xush Kelibsiz!';
          const adminKeyboard = {
            inline_keyboard: [
              [
                {
                  text: "➕ Yangilik Qo'shish",
                  callback_data: 'admin_add_news',
                },
                { text: "➕ FAQ Qo'shish", callback_data: 'admin_add_faq' },
              ],
              [
                {
                  text: '📅 Jadval Yuklash',
                  callback_data: 'admin_upload_timetable',
                },
                { text: '📎 Fayl Yuklash', callback_data: 'admin_upload_file' },
              ],
              [
                {
                  text: '🍔 Menyu Yangilash',
                  callback_data: 'admin_update_menu',
                },
                {
                  text: "📊 So'rovnoma Yaratish",
                  callback_data: 'admin_create_poll',
                },
              ],
              [
                {
                  text: "📬 Fikrlarni Ko'rish",
                  callback_data: 'admin_view_feedback',
                },
                {
                  text: '⚙️ Foydalanuvchilar (Tez Kunda)',
                  callback_data: 'admin_view_users_soon',
                },
              ],
              [
                {
                  text: '📢 Xabar Yuborish (Barchaga)',
                  callback_data: 'admin_broadcast_message',
                },
              ],
            ],
          };
          bot.sendMessage(chatId, adminPanelMessage, {
            reply_markup: adminKeyboard,
          });
        } else {
          bot.sendMessage(
            chatId,
            "⛔️ Sizda ushbu bo'limga kirish huquqi yo'q."
          );
        }
        break;
    }
  });

  // --- /cancel command for multi-step operations ---
  bot.onText(/\/cancel/, msg => {
    const chatId = msg.chat.id;
    if (getUserState(chatId)) {
      clearUserState(chatId);
      bot.sendMessage(chatId, '🚫 Joriy amal bekor qilindi.');
    } else {
      bot.sendMessage(chatId, '🤷‍♀️ Bekor qilinadigan faol amal mavjud emas.');
    }
  });

  // --- Handling feedback message from user ---
  bot.on('message', msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return; // Ignore commands

    const userState = getUserState(chatId);
    if (userState && userState.action === 'awaiting_feedback_message') {
      if (!text || text.length < 10) {
        bot.sendMessage(
          chatId,
          '⚠️ Xabaringiz juda qisqa. Iltimos, batafsilroq yozing.'
        );
        return;
      }

      const feedbackData = readData('feedback.json', { feedbacks: [] });
      const newFeedback = {
        id: `fb-${Date.now()}-${userId}`, // More robust ID
        userId: userId,
        userName:
          `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() ||
          msg.from.username ||
          'N/A',
        message: text,
        timestamp: new Date().toISOString(),
        status: 'new', // 'new', 'seen', 'replied'
        adminReply: null,
      };
      feedbackData.feedbacks.push(newFeedback);
      writeData('feedback.json', feedbackData);

      bot.sendMessage(
        chatId,
        '✅ Xabaringiz adminlarga yuborildi. Tez orada javob berishga harakat qilamiz. Rahmat!'
      );
      clearUserState(chatId);

      // Notify admins (optional, can be done via admin panel view)
      const adminNotification = `📬 Yangi Fikr Bildirildi!\n\n👤 Foydalanuvchi: ${newFeedback.userName} (ID: ${userId})\n📝 Xabar: ${newFeedback.message}\n\nKo'rish uchun Admin Paneliga o'ting.`;
      const { adminUserIds } = readData('admins.json', { adminUserIds: [] });
      adminUserIds.forEach(adminId => {
        bot
          .sendMessage(adminId, adminNotification)
          .catch(err =>
            console.error(
              `Error sending feedback notification to admin ${adminId}: ${err.message}`
            )
          );
      });
      // Or send to a specific admin channel if configured
      if (global.config && global.config.adminChannelId) {
        bot
          .sendMessage(global.config.adminChannelId, adminNotification)
          .catch(err =>
            console.error(
              `Error sending feedback to admin channel: ${err.message}`
            )
          );
      }
    }
  });
};

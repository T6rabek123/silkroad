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

    const welcomeMessage = `Hello, ${userName}! 👋\nWelcome to the Silk Road International University of Tourism and Cultural Heritage (@silkroaduni) bot!\n\nYou can use the menu below:`;

    const mainKeyboard = {
      reply_markup: {
        keyboard: [
          [{ text: '📚 Student Assistant' }, { text: '🤔 FAQ (Applicants)' }],
          [{ text: '🍽 Canteen Menu' }, { text: '🗳 Voting / Feedback' }],
          [{ text: '📰 News and Announcements' }],
          [
            {
              text: '🌐 Silkroad Official Website',
              web_app: { url: 'https://www.univ-silkroad.uz/en/' },
            },
          ],
          [{ text: '💬 Contact Admin' }],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
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
      `🤖 **Bot Help Menu** 🤖\n\n` +
      `This bot is designed for students and applicants of Silk Road University.\n\n` +
      `**Main sections:**\n` +
      `📚 **Student Assistant:** Timetable, exams, GPA calculator, useful files.\n` +
      `🤔 **FAQ (Applicants):** Frequently asked questions for applicants.\n` +
      `🍽 **Canteen Menu:** Daily and weekly menu.\n` +
      `🗳 **Voting / Feedback:** Participate in polls and leave feedback.\n` +
      `📰 **News and Announcements:** Latest news from university life.\n` +
      `🌐 **Silkroad Official Website:** Open the official university website.\n` +
      `💬 **Contact Admin:** Send your message to the admins.\n\n` +
      (isAdmin(msg.from.id)
        ? `🛠 **Admin Panel:** Special panel for managing the bot (admins only).\n\n`
        : `\n`) +
      `To get started, send the /start command or use the menu buttons.`;

    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  });

  // --- /cancel command ---
  bot.onText(/\/cancel/, msg => {
    const chatId = msg.chat.id;
    clearUserState(chatId);
    bot.sendMessage(chatId, '❌ Operation cancelled. You can use the menu below to start again.');
  });

  // --- Handling Main Menu Text Inputs and Feedback ---
  bot.on('message', msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return; // Ignore commands or non-text

    // Feedback state handling
    const userState = getUserState(chatId);
    if (userState && userState.action === 'awaiting_feedback_message') {
      if (!text || text.length < 10) {
        bot.sendMessage(
          chatId,
          '⚠️ Your message is too short. Please write in more detail.'
        );
        return;
      }

      const feedbackData = readData('feedback.json', { feedbacks: [] });
      const newFeedback = {
        id: `fb-${Date.now()}-${userId}`,
        userId: userId,
        userName:
          `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() ||
          msg.from.username ||
          'N/A',
        message: text,
        timestamp: new Date().toISOString(),
        status: 'new',
        adminReply: null,
      };
      feedbackData.feedbacks.push(newFeedback);
      writeData('feedback.json', feedbackData);

      bot.sendMessage(
        chatId,
        '✅ Your message has been sent to the admins. We will try to respond as soon as possible. Thank you!'
      );
      clearUserState(chatId);

      // Notify admins
      const adminNotification = `📬 New Feedback Received!\n\n👤 User: ${newFeedback.userName} (ID: ${userId})\n📝 Message: ${newFeedback.message}\n\nGo to the Admin Panel to view.`;
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
      return; // Stop further processing
    }

    // Clear any pending states if user clicks a main menu button
    const mainMenuItems = [
      '📚 Student Assistant',
      '🤔 FAQ (Applicants)',
      '🍽 Canteen Menu',
      '🗳 Voting / Feedback',
      '📰 News and Announcements',
      '💬 Contact Admin',
      '🛠 Admin Panel',
    ];
    if (mainMenuItems.includes(text)) {
      clearUserState(chatId);
    }

    switch (text) {
      case '📚 Student Assistant':
        bot.sendMessage(
          chatId,
          '📚 Student Assistant section. Please choose:',
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '📅 Timetable', callback_data: 'view_timetable' }],
                [
                  {
                    text: '📊 GPA Calculator',
                    callback_data: 'gpa_calculator',
                  },
                ],
                [
                  {
                    text: '📎 Useful Files',
                    callback_data: 'view_useful_files',
                  },
                ],
                [
                  {
                    text: '✍️ Exam Schedule (Coming Soon)',
                    callback_data: 'view_exams_soon',
                  },
                ],
              ],
            },
          }
        );
        break;
      case '🤔 FAQ (Applicants)':
        bot.sendMessage(
          chatId,
          '🤔 FAQ section for applicants. Click the button below to view questions:',
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '❓ View Questions', callback_data: 'view_faqs' }],
              ],
            },
          }
        );
        break;
      case '🍽 Canteen Menu':
        bot.sendMessage(chatId, '🍽 Canteen Menu. Please choose:', {
          reply_markup: {
            inline_keyboard: [
              [{ text: "📅 Today's Menu", callback_data: 'view_menu_today' }],
              [{ text: '🗒 Weekly Menu', callback_data: 'view_menu_weekly' }],
              [
                {
                  text: '➕ Suggest a Dish',
                  callback_data: 'suggest_food_item',
                },
              ],
              [
                {
                  text: '⭐ Rate a Dish',
                  callback_data: 'review_food_item',
                },
              ],
            ],
          },
        });
        break;
      case '🗳 Voting / Feedback':
        bot.sendMessage(chatId, '🗳 Voting / Feedback section. Please choose:', {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '📋 Available Polls',
                  callback_data: 'view_polls',
                },
              ],
              [
                {
                  text: '✍️ Send Feedback (to Admins)',
                  callback_data: 'send_feedback_user',
                },
              ],
            ],
          },
        });
        break;
      case '📰 News and Announcements':
        bot.sendMessage(
          chatId,
          '📰 News and Announcements. Click the button below to view the latest news:',
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '📄 View News',
                    callback_data: 'view_news',
                  },
                ],
              ],
            },
          }
        );
        break;
      case '💬 Contact Admin':
        setUserState(chatId, { action: 'awaiting_feedback_message' });
        bot.sendMessage(
          chatId,
          '✍️ Please write the message you want to send to the admins. Type /cancel to cancel.'
        );
        break;
      case '🛠 Admin Panel':
        if (isAdmin(userId)) {
          const adminPanelMessage = '🛠 Welcome to the Admin Panel!';
          const adminKeyboard = {
            inline_keyboard: [
              [
                {
                  text: '➕ Add News',
                  callback_data: 'admin_add_news',
                },
                { text: '➕ Add FAQ', callback_data: 'admin_add_faq' },
              ],
              // You can add more admin panel buttons here
            ],
          };
          bot.sendMessage(chatId, adminPanelMessage, {
            reply_markup: adminKeyboard,
          });
        } else {
          bot.sendMessage(
            chatId,
            '❌ You do not have access to the Admin Panel.'
          );
        }
        break;

      }
      })
/*
  All bot responses and menu texts have been translated from Uzbek to English.
*/
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
  // --- Callback Query for Viewing FAQs ---
  bot.on('callback_query', callbackQuery => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;

    if (data === 'view_faqs') {
      const faqData = readData('faqs.json', { faqs: [] });
      if (!faqData.faqs || faqData.faqs.length === 0) {
        bot.sendMessage(
          chatId,
          "😕 There are currently no FAQs (frequently asked questions) available."
        );
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      let responseText =
        "🤔 **Frequently Asked Questions (FAQ) for Applicants:**\n\n";
      // For simplicity, show all FAQs. For many FAQs, pagination would be needed.
      faqData.faqs.forEach((faq, index) => {
        responseText += `**${index + 1}. ${faq.question}**\n`;
        responseText += `💡 _Answer:_ ${faq.answer}\n\n`;
        if (isAdmin(callbackQuery.from.id)) {
          responseText += `✏️ [Edit](tg://btn/edit_faq_${faq.id}) | 🗑 [Delete](tg://btn/delete_faq_${faq.id})\n\n`;
          }
        });
      };

      const inline_keyboard = [];
      if (isAdmin(callbackQuery.from.id)) {
        faqData.faqs.forEach(faq => {
          inline_keyboard.push([
            {
              text: `✏️ Edit: ${faq.question.substring(0, 15)}...`,
              callback_data: `admin_edit_faq_start_${faq.id}`,
            },
            {
              text: `🗑 Delete: ${faq.question.substring(0, 15)}...`,              // ...existing code...
                    let responseText =
                      "🤔 **Frequently Asked Questions (FAQ) for Applicants:**\n\n";
                    // For simplicity, show all FAQs. For many FAQs, pagination would be needed.
                    faqData.faqs.forEach((faq, index) => {
                      responseText += `**${index + 1}. ${faq.question}**\n`;
                      responseText += `💡 _Answer:_ ${faq.answer}\n\n`;
                      if (isAdmin(callbackQuery.from.id)) {
                        responseText += `✏️ [Edit](tg://btn/edit_faq_${faq.id}) | 🗑 [Delete](tg://btn/delete_faq_${faq.id})\n\n`;
                      }
                    });
              
                    const inline_keyboard = [];
                    if (isAdmin(callbackQuery.from.id)) {
                      faqData.faqs.forEach(faq => {
                        inline_keyboard.push([
                          {
                            text: `✏️ Edit: ${faq.question.substring(0, 15)}...`,
                            callback_data: `admin_edit_faq_start_${faq.id}`,
                          },
                          {
                            text: `🗑 Delete: ${faq.question.substring(0, 15)}...`,
                            callback_data: `admin_delete_faq_confirm_${faq.id}`,
                          },
                        ]);
                      });
                      inline_keyboard.push([
                        { text: "➕ Add New FAQ", callback_data: 'admin_add_faq' },
                      ]);
                    }
                    inline_keyboard.push([
                      { text: '◀️ Main Menu', callback_data: 'main_menu_from_faq' },
                    ]);
              // ...existing code...
                    const userName = callbackQuery.from.first_name;
                    const welcomeMessage = `Main menu, ${userName}! 👋`;
                    const mainKeyboardObj = {
                      // Reconstruct or import main keyboard
                      keyboard: [
                        [
                          { text: '📚 Student Assistant' },
                          { text: '🤔 FAQ (Applicants)' },
                        ],
                        [
                          { text: '🍽 Canteen Menu' },
                          { text: '🗳 Voting / Feedback' },
                        ],
                        [{ text: "📰 News and Announcements" }],
                        [
                          {
                            text: '🌐 Silkroad Official Website',
                            web_app: { url: 'https://www.univ-silkroad.uz/en/' },
                          },
                        ],
                        [{ text: "💬 Contact Admin" }],
                      ],
                      resize_keyboard: true,
                      one_time_keyboard: false,
                    };
                    if (isAdmin(callbackQuery.from.id)) {
                      mainKeyboardObj.keyboard.push([{ text: '🛠 Admin Panel' }]);
                    }
                    bot.sendMessage(chatId, welcomeMessage, {
                      reply_markup: mainKeyboardObj,
                      parse_mode: 'Markdown',
                    });
              // ...existing code...
                    if (!isAdmin(callbackQuery.from.id)) {
                      bot.answerCallbackQuery(callbackQuery.id, {
                        text: "No permission!",
                        show_alert: true,
                      });
                      return;
                    }
                    const faqId = data.replace('admin_delete_faq_confirm_', '');
                    const faqData = readData('faqs.json');
                    const faqToDelete = faqData.faqs.find(f => f.id === faqId);
                    if (faqToDelete) {
                      bot.sendMessage(
                        chatId,
                        `🗑 Are you sure you want to delete this FAQ?\n\nQuestion: "${faqToDelete.question}"`,
                        {
                          reply_markup: {
                            inline_keyboard: [
                              [
                                {
                                  text: "✅ Yes, Delete",
                                  callback_data: `admin_delete_faq_execute_${faqId}`,
                                },
                              ],
                              [{ text: "❌ No, Cancel", callback_data: 'view_faqs' }],
                            ],
                          },
                        }
                      );
                    }
                    bot.answerCallbackQuery(callbackQuery.id);
              // ...existing code...
                    if (!isAdmin(callbackQuery.from.id)) {
                      bot.answerCallbackQuery(callbackQuery.id, {
                        text: "No permission!",
                        show_alert: true,
                      });
                      return;
                    }
                    const faqId = data.replace('admin_delete_faq_execute_', '');
                    let faqData = readData('faqs.json');
                    const initialLength = faqData.faqs.length;
                    faqData.faqs = faqData.faqs.filter(f => f.id !== faqId);
                    if (faqData.faqs.length < initialLength) {
                      writeData('faqs.json', faqData);
                      bot.editMessageText("🗑 FAQ successfully deleted.", {
                        chat_id: chatId,
                        message_id: msg.message_id,
                      });
                      // Optionally, resend the FAQ list:
                      // setTimeout(() => this.handleCallbackQuery({ message: msg, from: {id: callbackQuery.from.id}, data: 'view_faqs' }), 200);
                    } else {
                      bot.editMessageText("⚠️ Error deleting FAQ.", {
                        chat_id: chatId,
                        message_id: msg.message_id,
                      });
                    }
                    bot.answerCallbackQuery(callbackQuery.id);
              // ...existing code...
                  if (userState.action === 'admin_awaiting_faq_question') {
                    if (!text || text.length < 5) {
                      bot.sendMessage(
                        chatId,
                        "⚠️ The question is too short. It must be at least 5 characters. Please re-enter or cancel with /cancel_admin_op."
                      );
                      return;
                    }
                    setUserState(chatId, 'admin_awaiting_faq_answer', { question: text });
                    bot.sendMessage(
                      chatId,
                      `✅ Question accepted: "${text}".\n\nNow enter the answer for this question:`
                    );
                  } else if (userState.action === 'admin_awaiting_faq_answer') {
                    if (!text || text.length < 10) {
                      bot.sendMessage(
                        chatId,
                        "⚠️ The answer is too short. It must be at least 10 characters. Please re-enter or cancel with /cancel_admin_op."
                      );
                      return;
                    }
                    const { question } = userState.data;
                    const faqData = readData('faqs.json', { faqs: [] });
                    const newFaq = {
                      id: uuidv4(),
                      question: question,
                      answer: text,
                      createdBy: userId,
                      createdAt: new Date().toISOString(),
                    };
                    faqData.faqs.push(newFaq);
                    writeData('faqs.json', faqData);
              
                    bot.sendMessage(
                      chatId,
                      `✅ New FAQ successfully added:\nQuestion: ${question}\nAnswer: ${text}`
                    );
                    clearUserState(chatId);
                  }
              // ...existing code...
              callback_data: `admin_delete_faq_confirm_${faq.id}`,
            },
          ]);
        });
        inline_keyboard.push([
          { text: "➕ Add New FAQ", callback_data: 'admin_add_faq' },
        ]);
      }
      inline_keyboard.push([
        { text: '◀️ Main Menu', callback_data: 'main_menu_from_faq' },
      ]);

      bot.sendMessage(chatId, responseText, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'main_menu_from_faq') {
      // Send main menu (could be a helper function if used often)
      const userName = callbackQuery.from.first_name;
      const welcomeMessage = `Main menu, ${userName}! 👋`;
      const mainKeyboardObj = {
        // Reconstruct or import main keyboard
        keyboard: [
          [
            { text: '📚 Student Assistant' },
            { text: '🤔 FAQ (Applicants)' },
          ],
          [
            { text: '🍽 Canteen Menu' },
            { text: '🗳 Voting / Feedback' },
          ],
          [{ text: "📰 News and Announcements" }],
          [
            {
              text: '🌐 Silkroad Official Website',
              web_app: { url: 'https://www.univ-silkroad.uz/en/' },
            },
          ],
          [{ text: "💬 Contact Admin" }],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      };
      if (isAdmin(callbackQuery.from.id)) {
        mainKeyboardObj.keyboard.push([{ text: '🛠 Admin Panel' }]);
      }
      bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: mainKeyboardObj,
        parse_mode: 'Markdown',
      });
      bot.answerCallbackQuery(callbackQuery.id);
    }
    // Admin actions for FAQ from inline buttons
    else if (data.startsWith('admin_delete_faq_confirm_')) {
      if (!isAdmin(callbackQuery.from.id)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "No permission!",
          show_alert: true,
        });
        return;
      }
      const faqId = data.replace('admin_delete_faq_confirm_', '');
      const faqData = readData('faqs.json');
      const faqToDelete = faqData.faqs.find(f => f.id === faqId);
      if (faqToDelete) {
        bot.sendMessage(
          chatId,
          `🗑 Are you sure you want to delete this FAQ?\n\nQuestion: "${faqToDelete.question}"`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "✅ Yes, Delete",
                    callback_data: `admin_delete_faq_execute_${faqId}`,
                  },
                ],
                [{ text: "❌ No, Cancel", callback_data: 'view_faqs' }],
              },
            },
          }
        );
      }
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('admin_delete_faq_execute_')) {
      if (!isAdmin(callbackQuery.from.id)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "No permission!",
          show_alert: true,
        });
        return;
      }
      const faqId = data.replace('admin_delete_faq_execute_', '');
      let faqData = readData('faqs.json');
      const initialLength = faqData.faqs.length;
      faqData.faqs = faqData.faqs.filter(f => f.id !== faqId);
      if (faqData.faqs.length < initialLength) {
        writeData('faqs.json', faqData);
        bot.editMessageText("🗑 FAQ successfully deleted.", {
          chat_id: chatId,
          message_id: msg.message_id,
        });
        // Optionally, resend the FAQ list:
        // setTimeout(() => this.handleCallbackQuery({ message: msg, from: {id: callbackQuery.from.id}, data: 'view_faqs' }), 200);
      } else {
        bot.editMessageText("⚠️ Error deleting FAQ.", {
          chat_id: chatId,
          message_id: msg.message_id,
        });
      }
      bot.answerCallbackQuery(callbackQuery.id);
    }
    // Edit FAQ handlers would be similar, setting states for question then answer
  });

  // --- Admin: Adding/Editing FAQ (State Machine) ---
  bot.on('message', msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (!isAdmin(userId)) return;

    const userState = getUserState(chatId);
    if (!userState || !userState.action.startsWith('admin_awaiting_faq_'))
      return;

    if (userState.action === 'admin_awaiting_faq_question') {
      if (!text || text.length < 5) {
        bot.sendMessage(
          chatId,
          "⚠️ The question is too short. It must be at least 5 characters. Please re-enter or cancel with /cancel_admin_op."
        );
        return;
      }
      setUserState(chatId, 'admin_awaiting_faq_answer', { question: text });
      bot.sendMessage(
        chatId,
        `✅ Question accepted: "${text}".\n\nNow enter the answer for this question:`
      );
    } else if (userState.action === 'admin_awaiting_faq_answer') {
      if (!text || text.length < 10) {
        bot.sendMessage(
          chatId,
          "⚠️ The answer is too short. It must be at least 10 characters. Please re-enter or cancel with /cancel_admin_op."
        );
        return;
      }
      const { question } = userState.data;
      const faqData = readData('faqs.json', { faqs: [] });
      const newFaq = {
        id: uuidv4(),
        question: question,
        answer: text,
        createdBy: userId,
        createdAt: new Date().toISOString(),
      };
      faqData.faqs.push(newFaq);
      writeData('faqs.json', faqData);

      bot.sendMessage(
        chatId,
        `✅ New FAQ successfully added:\nQuestion: ${question}\nAnswer: ${text}`
      );
      clearUserState(chatId);
    }
});

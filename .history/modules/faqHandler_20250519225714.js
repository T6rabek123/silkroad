// modules/faqHandler.js
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
          "😕 Hozircha FAQ (tez-tez so'raladigan savollar) mavjud emas."
        );
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      let responseText =
        "🤔 **Abituriyentlar uchun Tez-Tez So'raladigan Savollar (FAQ):**\n\n";
      // For simplicity, show all FAQs. For many FAQs, pagination would be needed.
      faqData.faqs.forEach((faq, index) => {
        responseText += `**${index + 1}. ${faq.question}**\n`;
        responseText += `💡 _Javob:_ ${faq.answer}\n\n`;
        if (isAdmin(callbackQuery.from.id)) {
          responseText += `✏️ [Tahrirlash](tg://btn/edit_faq_${faq.id}) | 🗑 [O'chirish](tg://btn/delete_faq_${faq.id})\n\n`;
        }
      });

      const inline_keyboard = [];
      if (isAdmin(callbackQuery.from.id)) {
        faqData.faqs.forEach(faq => {
          inline_keyboard.push([
            {
              text: `✏️ Tahrirlash: ${faq.question.substring(0, 15)}...`,
              callback_data: `admin_edit_faq_start_${faq.id}`,
            },
            {
              text: `🗑 O'chirish: ${faq.question.substring(0, 15)}...`,
              callback_data: `admin_delete_faq_confirm_${faq.id}`,
            },
          ]);
        });
        inline_keyboard.push([
          { text: "➕ Yangi FAQ Qo'shish", callback_data: 'admin_add_faq' },
        ]);
      }
      inline_keyboard.push([
        { text: '◀️ Bosh Menyu', callback_data: 'main_menu_from_faq' },
      ]);

      bot.sendMessage(chatId, responseText, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'main_menu_from_faq') {
      // Send main menu (could be a helper function if used often)
      const userName = callbackQuery.from.first_name;
      const welcomeMessage = `Bosh menyu, ${userName}! 👋`;
      const mainKeyboardObj = {
        // Reconstruct or import main keyboard
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
          text: "Ruxsat yo'q!",
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
          `🗑 Haqiqatan ham ushbu FAQni o'chirmoqchimisiz?\n\nSavol: "${faqToDelete.question}"`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "✅ Ha, O'chirish",
                    callback_data: `admin_delete_faq_execute_${faqId}`,
                  },
                ],
                [{ text: "❌ Yo'q, Bekor Qilish", callback_data: 'view_faqs' }],
              ],
            },
          }
        );
      }
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('admin_delete_faq_execute_')) {
      if (!isAdmin(callbackQuery.from.id)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ruxsat yo'q!",
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
        bot.editMessageText("🗑 FAQ muvaffaqiyatli o'chirildi.", {
          chat_id: chatId,
          message_id: msg.message_id,
        });
        // Optionally, resend the FAQ list:
        // setTimeout(() => this.handleCallbackQuery({ message: msg, from: {id: callbackQuery.from.id}, data: 'view_faqs' }), 200);
      } else {
        bot.editMessageText("⚠️ FAQ o'chirishda xatolik.", {
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
          "⚠️ Savol juda qisqa. Kamida 5 belgi bo'lishi kerak. Qaytadan kiriting yoki /cancel_admin_op bilan bekor qiling."
        );
        return;
      }
      setUserState(chatId, 'admin_awaiting_faq_answer', { question: text });
      bot.sendMessage(
        chatId,
        `✅ Savol qabul qilindi: "${text}".\n\nEndi ushbu savol uchun javobni kiriting:`
      );
    } else if (userState.action === 'admin_awaiting_faq_answer') {
      if (!text || text.length < 10) {
        bot.sendMessage(
          chatId,
          "⚠️ Javob juda qisqa. Kamida 10 belgi bo'lishi kerak. Qaytadan kiriting yoki /cancel_admin_op bilan bekor qiling."
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
        `✅ Yangi FAQ muvaffaqiyatli qo'shildi:\nSavol: ${question}\nJavob: ${text}`
      );
      clearUserState(chatId);
    }
  });
};
s;

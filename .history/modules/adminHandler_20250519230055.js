// modules/adminHandler.js
const { v4: uuidv4 } = require('uuid'); // Already in sharedDependencies, but good to note

module.exports = ({
  bot,
  isAdmin,
  readData,
  writeData,
  setUserState,
  getUserState,
  clearUserState,
  config,
}) => {
  // --- /admin command ---
  bot.onText(/\/admin/, msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isAdmin(userId)) {
      bot.sendMessage(chatId, "⛔️ Sizda admin paneliga kirish huquqi yo'q.");
      return;
    }

    const adminPanelMessage =
      '🛠 Admin Paneliga Xush Kelibsiz! Quyidagi amallardan birini tanlang:';
    const adminKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "➕ Yangilik Qo'shish", callback_data: 'admin_add_news' },
            { text: "➕ FAQ Qo'shish", callback_data: 'admin_add_faq' },
          ],
          [
            {
              text: '📝 Yangiliklarni Boshqarish',
              callback_data: 'admin_manage_news',
            },
            {
              text: '📝 FAQlarni Boshqarish',
              callback_data: 'admin_manage_faqs',
            },
          ],
          [
            {
              text: '📅 Jadval Yuklash/Yangilash',
              callback_data: 'admin_upload_timetable',
            },
            {
              text: '📎 Foydali Fayl Yuklash',
              callback_data: 'admin_upload_file',
            },
          ],
          [
            {
              text: '🍔 Menyu Yangilash (Kunlik)',
              callback_data: 'admin_update_daily_menu',
            },
            {
              text: "🍲 Taomlar Ro'yxatini Boshqarish",
              callback_data: 'admin_manage_food_items',
            },
          ],
          [
            {
              text: "📊 So'rovnoma Yaratish",
              callback_data: 'admin_create_poll',
            },
            {
              text: "📋 So'rovnomalarni Boshqarish",
              callback_data: 'admin_manage_polls',
            },
          ],
          [
            {
              text: "📬 Fikrlarni Ko'rish",
              callback_data: 'admin_view_feedback',
            },
          ],
          [
            {
              text: '📢 Xabar Yuborish (Barchaga)',
              callback_data: 'admin_broadcast_message',
            },
          ],
          // [{ text: "⚙️ Bot Sozlamalari (Tez Kunda)", callback_data: "admin_bot_settings_soon" }]
        ],
      },
    };
    bot.sendMessage(chatId, adminPanelMessage, {
      reply_markup: adminKeyboard,
      parse_mode: 'Markdown',
    });
  });

  // --- Callback Query Handler for Admin Panel ---
  bot.on('callback_query', callbackQuery => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    if (!isAdmin(userId)) {
      // Check if the callback is for non-admin actions that might be in this handler
      if (data.startsWith('admin_')) {
        // Only restrict if it's an admin-specific callback
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "⛔️ Sizda bu amalni bajarishga ruxsat yo'q!",
          show_alert: true,
        });
        return;
      }
    }

    // Acknowledge the callback query if it's an admin action
    // Do this inside specific handlers if needed, or once at the start if it's definitely an admin action.
    // if (data.startsWith('admin_')) {
    //     bot.answerCallbackQuery(callbackQuery.id);
    // }

    // --- News Management ---
    if (data === 'admin_add_news') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ruxsat yo'q!",
          show_alert: true,
        });
        return;
      }
      setUserState(chatId, 'admin_awaiting_news_title');
      bot.sendMessage(chatId, '📰 Yangilik sarlavhasini kiriting:');
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'admin_manage_news') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ruxsat yo'q!",
          show_alert: true,
        });
        return;
      }
      // Logic to show existing news with delete/edit options
      // This will be expanded in newsHandler.js or here
      bot.sendMessage(
        chatId,
        "Yangiliklarni boshqarish (bu funksiya newsHandler.js da to'ldiriladi)."
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- FAQ Management ---
    else if (data === 'admin_add_faq') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ruxsat yo'q!",
          show_alert: true,
        });
        return;
      }
      setUserState(chatId, 'admin_awaiting_faq_question');
      bot.sendMessage(chatId, '❓ FAQ savolini kiriting:');
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'admin_manage_faqs') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ruxsat yo'q!",
          show_alert: true,
        });
        return;
      }
      // Logic to show existing FAQs with delete/edit options
      bot.sendMessage(
        chatId,
        "FAQlarni boshqarish (bu funksiya faqHandler.js da to'ldiriladi)."
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- Timetable Management ---
    else if (data === 'admin_upload_timetable') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ruxsat yo'q!",
          show_alert: true,
        });
        return;
      }
      setUserState(chatId, 'admin_awaiting_timetable_text'); // Or 'admin_awaiting_timetable_file' if you expect a file
      bot.sendMessage(
        chatId,
        "📅 Dars jadvalini matn formatida yuboring yoki fayl sifatida yuklang.\nNamunaviy format:\nKUN (Dushanba):\n1. 08:30 - Matematika (Xona 101)\n2. 10:00 - Fizika (Xona 202)\n\nYoki umumiy ma'lumotni kiriting."
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- Useful Files Management ---
    else if (data === 'admin_upload_file') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ruxsat yo'q!",
          show_alert: true,
        });
        return;
      }
      setUserState(chatId, 'admin_awaiting_file_upload');
      bot.sendMessage(
        chatId,
        "📎 Foydali faylni (PDF, DOCX, rasm va hokazo) yuklang. Keyin fayl tavsifini so'rayman."
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- Menu Management ---
    else if (data === 'admin_update_daily_menu') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ruxsat yo'q!",
          show_alert: true,
        });
        return;
      }
      // This will be handled in menuHandler.js, but the callback originates here
      bot.emit('callback_query', {
        ...callbackQuery,
        data: 'admin_update_daily_menu_forward_to_menu_handler',
      }); // Forwarding example
      // Or directly call a function from menuHandler if structured for it.
      // For now, menuHandler should also listen for 'admin_update_daily_menu' if it's the primary handler.
      // The current structure assumes menuHandler picks this up directly.
      bot.sendMessage(
        chatId,
        "Menyuni yangilash (bu funksiya menuHandler.js da to'ldiriladi)."
      ); // Placeholder if not handled
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'admin_manage_food_items') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ruxsat yo'q!",
          show_alert: true,
        });
        return;
      }
      bot.sendMessage(
        chatId,
        "Taomlar ro'yxatini boshqarish (bu funksiya menuHandler.js da to'ldiriladi)."
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- Poll Management ---
    else if (data === 'admin_create_poll') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ruxsat yo'q!",
          show_alert: true,
        });
        return;
      }
      setUserState(chatId, 'admin_awaiting_poll_question');
      bot.sendMessage(chatId, "📊 Yangi so'rovnoma uchun savolni kiriting:");
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'admin_manage_polls') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ruxsat yo'q!",
          show_alert: true,
        });
        return;
      }
      bot.sendMessage(
        chatId,
        "So'rovnomalarni boshqarish (bu funksiya votingHandler.js da to'ldiriladi)."
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- Feedback Management ---
    else if (data === 'admin_view_feedback') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ruxsat yo'q!",
          show_alert: true,
        });
        return;
      }
      const feedbackData = readData('feedback.json', { feedbacks: [] });
      const newFeedbacks = feedbackData.feedbacks.filter(
        f => f.status === 'new'
      );

      if (newFeedbacks.length === 0) {
        bot.sendMessage(
          chatId,
          '📬 Hozircha yangi fikr-mulohazalar mavjud emas.'
        );
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      let responseText = `📬 Yangi Fikr-Mulohazalar (${newFeedbacks.length} ta):\n\n`;
      const inline_keyboard = [];

      newFeedbacks.slice(0, 5).forEach(fb => {
        // Show first 5 to keep message shorter
        responseText += `👤 ${fb.userName} (ID: ${
          fb.userId
        })\n📝 "${fb.message.substring(0, 70)}..."\n🆔: ${fb.id}\n🗓 ${new Date(
          fb.timestamp
        ).toLocaleString('uz-UZ')}\n\n`;
        inline_keyboard.push([
          {
            text: `💬 Javob Berish (ID: ${fb.id.substring(0, 8)})`,
            callback_data: `admin_reply_feedback_${fb.id}`,
          },
        ]);
        inline_keyboard.push([
          {
            text: `👁 Ko'rildi Deb Belgilash (ID: ${fb.id.substring(0, 8)})`,
            callback_data: `admin_mark_feedback_seen_${fb.id}`,
          },
        ]);
      });

      if (newFeedbacks.length > 5) {
        responseText += `\nKo'proq fikrlar mavjud... Hammasini ko'rish uchun /all_feedback (admin buyrug'i).`; // Suggest a command for all
      }

      bot.sendMessage(chatId, responseText, {
        reply_markup: { inline_keyboard },
      });
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('admin_reply_feedback_')) {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ruxsat yo'q!",
          show_alert: true,
        });
        return;
      }
      const feedbackId = data.replace('admin_reply_feedback_', '');
      const feedbackData = readData('feedback.json', { feedbacks: [] });
      const feedbackItem = feedbackData.feedbacks.find(
        f => f.id === feedbackId
      );

      if (feedbackItem) {
        setUserState(chatId, 'admin_awaiting_feedback_reply', {
          feedbackId: feedbackItem.id,
          originalUserId: feedbackItem.userId,
          originalMessage: feedbackItem.message,
        });
        bot.sendMessage(
          chatId,
          `✍️ Foydalanuvchi ${feedbackItem.userName} (ID: ${feedbackItem.userId}) uchun javobingizni yozing.\n\nOriginal xabar: "${feedbackItem.message}"`
        );
      } else {
        bot.sendMessage(chatId, '⚠️ Fikr topilmadi.');
      }
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('admin_mark_feedback_seen_')) {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ruxsat yo'q!",
          show_alert: true,
        });
        return;
      }
      const feedbackId = data.replace('admin_mark_feedback_seen_', '');
      const feedbackData = readData('feedback.json', { feedbacks: [] });
      const feedbackItemIndex = feedbackData.feedbacks.findIndex(
        f => f.id === feedbackId
      );

      if (
        feedbackItemIndex !== -1 &&
        feedbackData.feedbacks[feedbackItemIndex].status === 'new'
      ) {
        feedbackData.feedbacks[feedbackItemIndex].status = 'seen';
        writeData('feedback.json', feedbackData);
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ko'rildi deb belgilandi",
        });
        // Optionally update the message or refresh the feedback list by re-sending it
        bot
          .editMessageText(msg.text + "\n✅ Status: Ko'rildi", {
            // Simple update to existing message
            chat_id: chatId,
            message_id: msg.message_id,
            reply_markup: msg.reply_markup, // Keep existing buttons but they might be stale
          })
          .catch(e =>
            console.warn(
              "Couldn't edit feedback message after marking seen:",
              e.message
            )
          );
      } else {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Fikr topilmadi yoki allaqachon ko'rilgan.",
          show_alert: true,
        });
      }
    }
    // --- Broadcast Message ---
    else if (data === 'admin_broadcast_message') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Ruxsat yo'q!",
          show_alert: true,
        });
        return;
      }
      setUserState(chatId, 'admin_awaiting_broadcast_message');
      bot.sendMessage(
        chatId,
        "📢 Barcha foydalanuvchilarga yuboriladigan xabarni kiriting. Bu xabar botdan foydalangan barcha aktiv foydalanuvchilarga yuboriladi. Ehtiyot bo'ling!\n\nBekor qilish uchun /cancel_broadcast yozing."
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }
  });

  // --- Message Handler for Admin Inputs ---
  bot.on('message', async msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    // For file uploads, msg.document, msg.photo, msg.audio, msg.video etc. will be populated.
    const file =
      msg.document ||
      (msg.photo && msg.photo.length > 0
        ? msg.photo[msg.photo.length - 1]
        : null) ||
      msg.audio ||
      msg.video;
    const fileId = file ? file.file_id : null;
    const fileName = file
      ? file.file_name ||
        `file_${Date.now()}.${
          file.mime_type ? file.mime_type.split('/')[1] : 'dat'
        }`
      : null;

    if (!isAdmin(userId)) return; // Only admins can interact with these states

    const userState = getUserState(chatId);
    if (!userState) return;

    // Cancel broadcast
    if (
      text === '/cancel_broadcast' &&
      userState.action === 'admin_awaiting_broadcast_message'
    ) {
      clearUserState(chatId);
      bot.sendMessage(chatId, '📢 Xabar yuborish bekor qilindi.');
      return;
    }

    // --- Handle Feedback Reply ---
    if (userState.action === 'admin_awaiting_feedback_reply') {
      if (!text) {
        bot.sendMessage(
          chatId,
          "⚠️ Javob matni bo'sh bo'lishi mumkin emas. Qaytadan urinib ko'ring yoki /cancel_admin_op buyrug'i bilan bekor qiling."
        );
        return;
      }
      const { feedbackId, originalUserId, originalMessage } = userState.data;
      const feedbackData = readData('feedback.json', { feedbacks: [] });
      const feedbackItemIndex = feedbackData.feedbacks.findIndex(
        f => f.id === feedbackId
      );

      if (feedbackItemIndex !== -1) {
        feedbackData.feedbacks[feedbackItemIndex].status = 'replied';
        feedbackData.feedbacks[feedbackItemIndex].adminReply = {
          text: text,
          adminId: userId,
          adminName:
            `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim() ||
            msg.from.username,
          timestamp: new Date().toISOString(),
        };
        writeData('feedback.json', feedbackData);

        bot.sendMessage(
          chatId,
          `✅ Javobingiz foydalanuvchiga (ID: ${originalUserId}) yuborildi.`
        );

        // Send reply to the original user
        try {
          await bot.sendMessage(
            originalUserId,
            `📬 **Admin Javobi**:\n\n${text}\n\n---\n_Sizning oldingi xabaringiz: "${originalMessage.substring(
              0,
              100
            )}..."_`,
            { parse_mode: 'Markdown' }
          );
        } catch (error) {
          console.error(
            `Error sending reply to user ${originalUserId}:`,
            error.message
          );
          bot.sendMessage(
            chatId,
            `⚠️ Foydalanuvchiga (ID: ${originalUserId}) javob yuborishda xatolik yuz berdi. Ehtimol, foydalanuvchi botni bloklagan.`
          );
        }
      } else {
        bot.sendMessage(chatId, '⚠️ Fikr topilmadi. Javob yuborilmadi.');
      }
      clearUserState(chatId);
    }

    // --- Handle File Upload ---
    else if (userState.action === 'admin_awaiting_file_upload') {
      if (fileId) {
        // fileId is extracted from msg.document or msg.photo etc.
        setUserState(chatId, 'admin_awaiting_file_description', {
          file_id: fileId,
          file_name: fileName,
        });
        bot.sendMessage(
          chatId,
          `✅ Fayl qabul qilindi (${
            fileName || 'nomsiz fayl'
          }). Endi ushbu fayl uchun qisqacha tavsif yozing (masalan, "1-kurs Matematika syllabusi").`
        );
      } else if (text && !text.startsWith('/')) {
        // User sent text instead of file
        bot.sendMessage(
          chatId,
          '⚠️ Iltimos, fayl (dokument, rasm, audio, video) yuboring, matn emas. Yoki /cancel_admin_op bilan bekor qiling.'
        );
      }
      // If no file and no text, user might be thinking. Do nothing, wait for file or cancel.
    } else if (userState.action === 'admin_awaiting_file_description') {
      if (text && text.length > 3) {
        const { file_id, file_name } = userState.data;
        const filesData = readData('files.json', { files: [] });
        const newFileEntry = {
          id: uuidv4(),
          file_id: file_id, // Telegram's file_id
          fileName: file_name, // Original file name
          description: text, // Admin's description
          uploadedBy: userId,
          uploadDate: new Date().toISOString(),
        };
        filesData.files.push(newFileEntry);
        writeData('files.json', filesData);
        bot.sendMessage(
          chatId,
          `✅ Fayl "${text}" tavsifi bilan muvaffaqiyatli saqlandi! Foydalanuvchilar endi uni "Foydali Fayllar" bo'limida ko'rishlari mumkin.`
        );
        clearUserState(chatId);
      } else {
        bot.sendMessage(
          chatId,
          '⚠️ Tavsif juda qisqa. Iltimos, mazmunliroq tavsif yozing yoki /cancel_admin_op bilan bekor qiling.'
        );
      }
    }
    // --- Handle Broadcast Message ---
    else if (userState.action === 'admin_awaiting_broadcast_message') {
      if (!text || text.length < 5) {
        bot.sendMessage(
          chatId,
          '⚠️ Xabar matni juda qisqa. Iltimos, qaytadan kiriting yoki /cancel_broadcast bilan bekor qiling.'
        );
        return;
      }

      // Confirmation step
      setUserState(chatId, 'admin_confirm_broadcast', { messageText: text });
      bot.sendMessage(
        chatId,
        `📢 Siz quyidagi xabarni BARCHA ma'lum foydalanuvchilarga yubormoqchisiz:\n\n"${text}"\n\nDavom etish uchun **HA YUBORILSIN** deb yozing (aynan shunday katta harflarda) yoki /cancel_broadcast bilan bekor qiling. BU AMALNI ORTQAGA QAYTARIB BO'LMAYDI.`,
        { parse_mode: 'Markdown' }
      );
    } else if (userState.action === 'admin_confirm_broadcast') {
      if (text && text === 'HA YUBORILSIN') {
        // Exact match for confirmation
        const { messageText } = userState.data;
        bot.sendMessage(
          chatId,
          `⏳ Xabar yuborish boshlandi... Bu biroz vaqt olishi mumkin.`
        );
        clearUserState(chatId);

        // Fetch all unique user IDs.
        // This requires a strategy to collect user IDs.
        // For this example, we'll use IDs from feedback and admins.
        // In a production bot, you'd typically store user IDs in a separate `users.json`
        // when they first interact with the bot (e.g., on /start).
        const feedbackData = readData('feedback.json', { feedbacks: [] });
        const adminData = readData('admins.json', { adminUserIds: [] });

        const knownUserIds = new Set();
        feedbackData.feedbacks.forEach(f => knownUserIds.add(f.userId));
        adminData.adminUserIds.forEach(id => knownUserIds.add(id));

        // Add other sources if you collect user IDs elsewhere (e.g., from votes.json voters)
        const voteData = readData('votes.json', { polls: [] });
        voteData.polls.forEach(poll => {
          poll.options.forEach(option => {
            if (option.voters) {
              option.voters.forEach(voterId => knownUserIds.add(voterId));
            }
          });
        });

        if (knownUserIds.size === 0) {
          bot.sendMessage(
            chatId,
            '⚠️ Tarqatish uchun foydalanuvchilar topilmadi. Hech kimga xabar yuborilmadi.'
          );
          return;
        }

        let successCount = 0;
        let failCount = 0;
        const totalUsers = knownUserIds.size;

        // Convert Set to Array to iterate with index for progress update
        const userIdsArray = Array.from(knownUserIds);

        for (let i = 0; i < userIdsArray.length; i++) {
          const targetUserId = userIdsArray[i];
          try {
            // Add a small intro to the broadcast message
            const finalMessage = `📢 **Muhim Xabarnoma Universitet Botidan:**\n\n${messageText}\n\n---\n© ${new Date().getFullYear()} Silk Road University Bot`;
            await bot.sendMessage(targetUserId, finalMessage, {
              parse_mode: 'Markdown',
            });
            successCount++;
            // Avoid hitting rate limits: pause briefly every 20-30 messages
            if ((i + 1) % 25 === 0) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second pause
            } else {
              await new Promise(resolve => setTimeout(resolve, 50)); // 50ms pause
            }
          } catch (error) {
            failCount++;
            console.warn(
              `Failed to send broadcast to ${targetUserId}: ${error.message} (Code: ${error.code})`
            );
            // Common errors: 403 (blocked by user), 400 (chat not found)
          }
        }
        bot.sendMessage(
          chatId,
          `✅ Xabar yuborish yakunlandi.\n${successCount} ta foydalanuvchiga muvaffaqiyatli yuborildi.\n${failCount} ta foydalanuvchiga yuborishda xatolik yuz berdi (jami ${totalUsers} ta urinish).`
        );
      } else {
        bot.sendMessage(
          chatId,
          "📢 Xabar yuborish bekor qilindi. Tasdiqlash uchun 'HA YUBORILSIN' deb yozishingiz kerak edi."
        );
        clearUserState(chatId);
      }
    }

    // Generic cancel for admin operations (if user types /cancel_admin_op)
    if (text === '/cancel_admin_op') {
      if (userState.action && userState.action.startsWith('admin_awaiting_')) {
        clearUserState(chatId);
        bot.sendMessage(chatId, '🚫 Admin amali bekor qilindi.');
      }
    }
  });

  // Helper for /cancel_admin_op command
  bot.onText(/\/cancel_admin_op/, msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (!isAdmin(userId)) return; // Should not happen if state is admin-specific

    const userState = getUserState(chatId);
    if (
      userState &&
      userState.action &&
      userState.action.startsWith('admin_awaiting_')
    ) {
      clearUserState(chatId);
      bot.sendMessage(chatId, '🚫 Admin amali bekor qilindi.');
    } else {
      bot.sendMessage(
        chatId,
        '🤷‍♀️ Bekor qilinadigan faol admin amali mavjud emas.'
      );
    }
  });

  // Command to view all feedback for admins (example of an admin-only command)
  bot.onText(/\/all_feedback/, msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isAdmin(userId)) {
      bot.sendMessage(chatId, '⛔️ Bu buyruq faqat adminlar uchun.');
      return;
    }

    const feedbackData = readData('feedback.json', { feedbacks: [] });
    if (feedbackData.feedbacks.length === 0) {
      bot.sendMessage(
        chatId,
        '📬 Hozircha hech qanday fikr-mulohaza mavjud emas.'
      );
      return;
    }

    // Sort by date, newest first
    const sortedFeedbacks = feedbackData.feedbacks.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    let responseText = '📬 **Barcha Fikr-Mulohazalar:**\n\n';
    sortedFeedbacks.forEach(fb => {
      responseText += `🆔: ${fb.id}\n`;
      responseText += `👤: ${fb.userName} (ID: ${fb.userId})\n`;
      responseText += `📝: "${fb.message}"\n`;
      responseText += `🗓: ${new Date(fb.timestamp).toLocaleString('uz-UZ')}\n`;
      responseText += `Status: ${fb.status}`;
      if (fb.adminReply) {
        responseText += ` (Javob berilgan ✅)\n`;
        responseText += `↪️ Admin javobi: "${fb.adminReply.text}" (_by ${fb.adminReply.adminName}_)\n`;
      } else {
        responseText += ` (Javob kutilmoqda ⏳)\n`;
      }
      responseText += '---\n';

      // Telegram message length limit is 4096 characters. Send in chunks if too long.
      if (responseText.length > 3800) {
        bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
        responseText = ''; // Reset for next chunk
      }
    });
    if (responseText) {
      // Send any remaining part
      bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
    }
  });
};

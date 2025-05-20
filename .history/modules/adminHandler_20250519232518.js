// modules/adminHandler.js
const { v4: uuidv4 } = require('uuid');

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
    const adminKeyboardStructure = {
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
            text: '📅 Jadvalni Yangilash',
            callback_data: 'admin_update_timetable_options',
          },
          {
            text: '📎 Foydali Fayl Yuklash',
            callback_data: 'admin_upload_useful_file',
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
      ],
    };
    bot.sendMessage(chatId, adminPanelMessage, {
      reply_markup: adminKeyboardStructure,
      parse_mode: 'Markdown',
    });
  });

  // --- Callback Query Handler for Admin Panel ---
  bot.on('callback_query', callbackQuery => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    // Admin check for admin-specific callbacks
    if (data.startsWith('admin_') && !isAdmin(userId)) {
      bot.answerCallbackQuery(callbackQuery.id, {
        text: "⛔️ Sizda bu amalni bajarishga ruxsat yo'q!",
        show_alert: true,
      });
      return;
    }

    // --- News Management ---
    if (data === 'admin_add_news') {
      setUserState(chatId, 'admin_awaiting_news_title');
      bot.sendMessage(chatId, '📰 Yangilik sarlavhasini kiriting:');
      bot.answerCallbackQuery(callbackQuery.id);
    }
    // ... (other admin_ news/faq handlers remain similar) ...

    // --- Timetable Management Options ---
    else if (data === 'admin_update_timetable_options') {
      bot.sendMessage(chatId, '📅 Dars jadvalini qanday yangilamoqchisiz?', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📝 Matn Orqali Kiritish',
                callback_data: 'admin_upload_timetable_text',
              },
            ],
            [
              {
                text: '📄 Fayl Yuklash (Excel, PDF, Rasm)',
                callback_data: 'admin_upload_timetable_file',
              },
            ],
            [
              {
                text: '◀️ Admin Panelga Qaytish',
                callback_data: 'admin_panel_main',
              },
            ],
          ],
        },
      });
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'admin_panel_main') {
      // Go back to main admin panel
      bot.answerCallbackQuery(callbackQuery.id);
      // Simulate /admin command to show panel again
      bot.emit('text', {
        chat: { id: chatId },
        from: { id: userId },
        text: '/admin',
      });
    } else if (data === 'admin_upload_timetable_text') {
      setUserState(chatId, 'admin_awaiting_timetable_text_input');
      bot.sendMessage(
        chatId,
        "📅 Dars jadvalini matn formatida yuboring.\nNamunaviy format:\nKUN (Dushanba):\n1. 08:30 - Matematika (Xona 101)\n2. 10:00 - Fizika (Xona 202)\n\nYoki umumiy ma'lumotni kiriting."
      );
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'admin_upload_timetable_file') {
      setUserState(chatId, 'admin_awaiting_timetable_file_upload');
      bot.sendMessage(
        chatId,
        "📄 Dars jadvali faylini (Excel, PDF, DOCX, Rasm) yuklang. Keyin fayl uchun qisqacha sarlavha (caption) so'rayman."
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- Useful Files Management ---
    else if (data === 'admin_upload_useful_file') {
      setUserState(chatId, 'admin_awaiting_useful_file_upload');
      bot.sendMessage(
        chatId,
        "📎 Foydali faylni (PDF, DOCX, rasm, audio, video va hokazo) yuklang. Keyin fayl tavsifini so'rayman."
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // ... (other handlers like menu, poll, feedback remain similar) ...
    // Ensure isAdmin checks are present for all admin actions.
    // For example, in existing feedback handlers:
    else if (data === 'admin_view_feedback') {
      // ... (existing code)
      bot.answerCallbackQuery(callbackQuery.id); // Acknowledge
    } else if (data.startsWith('admin_reply_feedback_')) {
      // ... (existing code)
      bot.answerCallbackQuery(callbackQuery.id); // Acknowledge
    } else if (data.startsWith('admin_mark_feedback_seen_')) {
      // ... (existing code)
      // bot.answerCallbackQuery already called inside if/else
    } else if (data === 'admin_broadcast_message') {
      // ... (existing code)
      bot.answerCallbackQuery(callbackQuery.id); // Acknowledge
    }
  });

  // --- Message Handler for Admin Inputs ---
  bot.on('message', async msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    // Determine file type and ID
    let fileId = null;
    let fileName = null;
    let fileType = null; // 'document', 'photo', 'audio', 'video'

    if (msg.document) {
      fileId = msg.document.file_id;
      fileName = msg.document.file_name;
      fileType = 'document';
    } else if (msg.photo && msg.photo.length > 0) {
      fileId = msg.photo[msg.photo.length - 1].file_id; // Highest resolution
      fileName = `photo_${Date.now()}.jpg`; // Telegram photos don't have file_name
      fileType = 'photo';
    } else if (msg.audio) {
      fileId = msg.audio.file_id;
      fileName =
        msg.audio.file_name ||
        `audio_${Date.now()}.${
          msg.audio.mime_type ? msg.audio.mime_type.split('/')[1] : 'mp3'
        }`;
      fileType = 'audio';
    } else if (msg.video) {
      fileId = msg.video.file_id;
      fileName =
        msg.video.file_name ||
        `video_${Date.now()}.${
          msg.video.mime_type ? msg.video.mime_type.split('/')[1] : 'mp4'
        }`;
      fileType = 'video';
    }

    if (!isAdmin(userId)) return;

    const userState = getUserState(chatId);
    if (!userState) return;

    // --- Handle Timetable Text Input ---
    if (userState.action === 'admin_awaiting_timetable_text_input') {
      if (!text || text.length < 10) {
        bot.sendMessage(
          chatId,
          "⚠️ Jadval matni juda qisqa. Iltimos, batafsilroq ma'lumot kiriting yoki /cancel_admin_op bilan bekor qiling."
        );
        return;
      }
      const timetableData = readData('timetable.json');
      // Basic parsing attempt (example)
      const newSchedules = {};
      let currentDay = null;
      const lines = text.split('\n');
      const dayRegex =
        /^(Dushanba|Seshanba|Chorshanba|Payshanba|Juma|Shanba|Yakshanba)\s*:/i;
      const itemRegex =
        /^\s*(?:[0-9]+\.|-)\s*([0-9]{1,2}:[0-9]{2})\s*-\s*(.+?)(?:\s+\((.+?)\))?$/i;
      let parsedSomething = false;

      for (const line of lines) {
        const dayMatch = line.match(dayRegex);
        if (dayMatch) {
          currentDay = dayMatch[1]
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Normalize for consistency
          newSchedules[currentDay] = [];
          parsedSomething = true;
          continue;
        }
        if (currentDay) {
          const itemMatch = line.match(itemRegex);
          if (itemMatch) {
            newSchedules[currentDay].push({
              time: itemMatch[1],
              subject: itemMatch[2].trim(),
              location: itemMatch[3] ? itemMatch[3].trim() : "Noma'lum",
            });
            parsedSomething = true;
          }
        }
      }
      if (parsedSomething) {
        timetableData.schedules = newSchedules;
        timetableData.generalInfo = 'Jadval matn orqali yangilandi.';
      } else {
        timetableData.generalInfo = text; // Store as general info if parsing fails
        timetableData.schedules = {}; // Clear old parsed schedule
      }
      timetableData.uploadedFile = {
        file_id: null,
        file_name: null,
        file_type: null,
        caption: null,
      }; // Clear any previous file
      writeData('timetable.json', timetableData);
      bot.sendMessage(
        chatId,
        '✅ Dars jadvali matn orqali muvaffaqiyatli saqlandi!'
      );
      clearUserState(chatId);
    }
    // --- Handle Timetable File Upload ---
    else if (userState.action === 'admin_awaiting_timetable_file_upload') {
      if (fileId && fileType) {
        // Check if a file was actually sent
        setUserState(chatId, 'admin_awaiting_timetable_file_caption', {
          file_id: fileId,
          file_name: fileName,
          file_type: fileType,
        });
        bot.sendMessage(
          chatId,
          `✅ Jadval fayli (${fileName}) qabul qilindi. Endi ushbu fayl uchun qisqacha sarlavha (caption) yozing (masalan, "Barcha kurslar uchun 2025 Bahorgi semestr jadvali"). Bu sarlavha fayl bilan birga ko'rsatiladi.`
        );
      } else if (text && !text.startsWith('/')) {
        bot.sendMessage(
          chatId,
          '⚠️ Iltimos, fayl (Excel, PDF, Rasm) yuboring, matn emas. Yoki /cancel_admin_op bilan bekor qiling.'
        );
      }
    } else if (userState.action === 'admin_awaiting_timetable_file_caption') {
      if (text && text.length > 3) {
        const { file_id, file_name, file_type } = userState.data;
        const timetableData = readData('timetable.json');
        timetableData.uploadedFile = {
          file_id: file_id,
          file_name: file_name,
          file_type: file_type,
          caption: text, // User provided caption
          uploadedBy: userId,
          uploadDate: new Date().toISOString(),
        };
        timetableData.schedules = {}; // Clear text-based schedule
        timetableData.generalInfo = `Jadval fayl orqali yangilandi: ${file_name}.`;
        writeData('timetable.json', timetableData);
        bot.sendMessage(
          chatId,
          `✅ Jadval fayli "${file_name}" sarlavhasi bilan muvaffaqiyatli saqlandi! Foydalanuvchilar endi uni "Dars Jadvali" bo'limida ko'rishlari mumkin.`
        );
        clearUserState(chatId);
      } else {
        bot.sendMessage(
          chatId,
          '⚠️ Sarlavha juda qisqa. Iltimos, mazmunliroq sarlavha yozing yoki /cancel_admin_op bilan bekor qiling.'
        );
      }
    }

    // --- Handle Useful File Upload ---
    else if (userState.action === 'admin_awaiting_useful_file_upload') {
      if (fileId && fileType) {
        setUserState(chatId, 'admin_awaiting_useful_file_description', {
          file_id: fileId,
          file_name: fileName,
          file_type: fileType,
        });
        bot.sendMessage(
          chatId,
          `✅ Fayl qabul qilindi (${
            fileName || 'nomsiz fayl'
          }). Endi ushbu fayl uchun qisqacha tavsif yozing (masalan, "1-kurs Matematika syllabusi").`
        );
      } else if (text && !text.startsWith('/')) {
        bot.sendMessage(
          chatId,
          '⚠️ Iltimos, fayl (dokument, rasm, audio, video) yuboring, matn emas. Yoki /cancel_admin_op bilan bekor qiling.'
        );
      }
    } else if (userState.action === 'admin_awaiting_useful_file_description') {
      if (text && text.length > 3) {
        const { file_id, file_name, file_type } = userState.data;
        const filesData = readData('files.json', { files: [] });
        const newFileEntry = {
          id: uuidv4(),
          file_id: file_id,
          fileName: file_name,
          file_type: file_type, // Save the determined file type
          description: text,
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

    // ... (other message handlers like feedback reply, broadcast, news, faq, poll creation remain similar) ...
    // Ensure they are correctly placed and userState actions are unique.
    // For example, the feedback reply part:
    else if (userState.action === 'admin_awaiting_feedback_reply') {
      // ... (existing code)
    }
    // Broadcast message part:
    else if (userState.action === 'admin_awaiting_broadcast_message') {
      // ... (existing code)
    } else if (userState.action === 'admin_confirm_broadcast') {
      // ... (existing code)
    }

    // Generic cancel for admin operations
    if (text === '/cancel_admin_op') {
      if (userState.action && userState.action.startsWith('admin_awaiting_')) {
        clearUserState(chatId);
        bot.sendMessage(chatId, '🚫 Admin amali bekor qilindi.');
      }
    }
  });

  // --- Helper for /cancel_admin_op command ---
  bot.onText(/\/cancel_admin_op/, msg => {
    // ... (existing code)
  });

  // --- Command to view all feedback for admins ---
  bot.onText(/\/all_feedback/, msg => {
    // ... (existing code)
  });
};

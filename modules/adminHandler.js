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
      bot.sendMessage(chatId, '⛔️ You do not have access to the admin panel.');
      return;
    }

    const adminPanelMessage =
      '🛠 Welcome to the Admin Panel! Please select one of the actions below:';
    const adminKeyboardStructure = {
      inline_keyboard: [
        [
          { text: '➕ Add News', callback_data: 'admin_add_news' },
          { text: '➕ Add FAQ', callback_data: 'admin_add_faq' },
        ],
        [
          {
            text: '📝 Manage News',
            callback_data: 'admin_manage_news',
          },
          {
            text: '📝 Manage FAQs',
            callback_data: 'admin_manage_faqs',
          },
        ],
        [
          {
            text: '📅 Upload/Update Timetable',
            callback_data: 'admin_update_timetable_options',
          },
          {
            text: '📎 Upload Useful File',
            callback_data: 'admin_upload_file',
          },
        ],
        [
          {
            text: '🍔 Update Menu (Daily)',
            callback_data: 'admin_update_daily_menu',
          },
          {
            text: '🍲 Manage Dishes List',
            callback_data: 'admin_manage_food_items',
          },
        ],
        [
          {
            text: '📊 Create Poll',
            callback_data: 'admin_create_poll',
          },
          {
            text: '📋 Manage Polls',
            callback_data: 'admin_manage_polls',
          },
        ],
        [
          {
            text: '📬 View Feedback',
            callback_data: 'admin_view_feedback',
          },
        ],
        [
          {
            text: '📢 Broadcast Message (To All)',
            callback_data: 'admin_broadcast_message',
          },
        ],
      ],
    };

    // Corrected usage:
    bot.sendMessage(chatId, adminPanelMessage, {
      reply_markup: adminKeyboardStructure, // Pass the object containing inline_keyboard directly
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
          text: '⛔️ You do not have permission to perform this action!',
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
          text: 'No permission!',
          show_alert: true,
        });
        return;
      }
      setUserState(chatId, 'admin_awaiting_news_title');
      bot.sendMessage(chatId, '📰 Enter the news title:');
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'admin_manage_news') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'No permission!',
          show_alert: true,
        });
        return;
      }
      bot.sendMessage(
        chatId,
        'Manage news (this function is completed in newsHandler.js).'
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- FAQ Management ---
    else if (data === 'admin_add_faq') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'No permission!',
          show_alert: true,
        });
        return;
      }
      setUserState(chatId, 'admin_awaiting_faq_question');
      bot.sendMessage(chatId, '❓ Enter the FAQ question:');
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'admin_manage_faqs') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'No permission!',
          show_alert: true,
        });
        return;
      }
      bot.sendMessage(
        chatId,
        'Manage FAQs (this function is completed in faqHandler.js).'
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- Timetable Management ---
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
    else if (data === 'admin_upload_file') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'No permission!',
          show_alert: true,
        });
        return;
      }
      setUserState(chatId, 'admin_awaiting_file_upload');
      bot.sendMessage(
        chatId,
        '📎 Upload a useful file (PDF, DOCX, image, etc.). Then you will be asked for a description.'
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- Menu Management ---
    else if (data === 'admin_update_daily_menu') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'No permission!',
          show_alert: true,
        });
        return;
      }
      bot.sendMessage(
        chatId,
        'Update menu (this function is completed in menuHandler.js).'
      );
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'admin_manage_food_items') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'No permission!',
          show_alert: true,
        });
        return;
      }
      bot.sendMessage(
        chatId,
        'Manage dishes list (this function is completed in menuHandler.js).'
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- Poll Management ---
    else if (data === 'admin_create_poll') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'No permission!',
          show_alert: true,
        });
        return;
      }
      setUserState(chatId, 'admin_awaiting_poll_question');
      bot.sendMessage(chatId, '📊 Enter the question for the new poll:');
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'admin_manage_polls') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'No permission!',
          show_alert: true,
        });
        return;
      }
      bot.sendMessage(
        chatId,
        'Manage polls (this function is completed in votingHandler.js).'
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- Feedback Management ---
    else if (data === 'admin_view_feedback') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'No permission!',
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
          '📬 There are currently no new feedback messages.'
        );
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      let responseText = `📬 New Feedback (${newFeedbacks.length}):\n\n`;
      const inline_keyboard = [];

      newFeedbacks.slice(0, 5).forEach(fb => {
        responseText += `👤 ${fb.userName} (ID: ${
          fb.userId
        })\n📝 "${fb.message.substring(0, 70)}..."\n🆔: ${fb.id}\n🗓 ${new Date(
          fb.timestamp
        ).toLocaleString('en-US')}\n\n`;
        inline_keyboard.push([
          {
            text: `💬 Reply (ID: ${fb.id.substring(0, 8)})`,
            callback_data: `admin_reply_feedback_${fb.id}`,
          },
        ]);
        inline_keyboard.push([
          {
            text: `👁 Mark as Seen (ID: ${fb.id.substring(0, 8)})`,
            callback_data: `admin_mark_feedback_seen_${fb.id}`,
          },
        ]);
      });

      if (newFeedbacks.length > 5) {
        responseText += `\nMore feedback available... To view all, use /all_feedback (admin command).`;
      }

      bot.sendMessage(chatId, responseText, {
        reply_markup: { inline_keyboard },
      });
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('admin_reply_feedback_')) {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'No permission!',
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
          `✍️ Write your reply for user ${feedbackItem.userName} (ID: ${feedbackItem.userId}).\n\nOriginal message: "${feedbackItem.message}"`
        );
      } else {
        bot.sendMessage(chatId, '⚠️ Feedback not found.');
      }
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('admin_mark_feedback_seen_')) {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'No permission!',
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
          text: 'Marked as seen',
        });
        bot
          .editMessageText(msg.text + '\n✅ Status: Seen', {
            chat_id: chatId,
            message_id: msg.message_id,
            reply_markup: msg.reply_markup,
          })
          .catch(e =>
            console.warn(
              "Couldn't edit feedback message after marking seen:",
              e.message
            )
          );
      } else {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'Feedback not found or already marked as seen.',
          show_alert: true,
        });
      }
    }
    // --- Broadcast Message ---
    else if (data === 'admin_broadcast_message') {
      if (!isAdmin(userId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'No permission!',
          show_alert: true,
        });
        return;
      }
      setUserState(chatId, 'admin_awaiting_broadcast_message');
      bot.sendMessage(
        chatId,
        '📢 Enter the message to send to ALL users. This message will be sent to all active users who have used the bot. Be careful!\n\nType /cancel_broadcast to cancel.'
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
      bot.sendMessage(chatId, '📢 Broadcast cancelled.');
      return;
    }

    // --- Handle Feedback Reply ---
    if (userState.action === 'admin_awaiting_feedback_reply') {
      if (!text) {
        bot.sendMessage(
          chatId,
          '⚠️ Reply text cannot be empty. Please try again or cancel with /cancel_admin_op.'
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
          `✅ Your reply has been sent to the user (ID: ${originalUserId}).`
        );

        // Send reply to the original user
        try {
          await bot.sendMessage(
            originalUserId,
            `📬 **Admin Reply**:\n\n${text}\n\n---\n_Your previous message: "${originalMessage.substring(
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
            `⚠️ Error sending reply to user (ID: ${originalUserId}). The user may have blocked the bot.`
          );
        }
      } else {
        bot.sendMessage(chatId, '⚠️ Feedback not found. Reply not sent.');
      }
      clearUserState(chatId);
    }

    // --- Handle File Upload ---
    else if (userState.action === 'admin_awaiting_file_upload') {
      if (fileId) {
        setUserState(chatId, 'admin_awaiting_file_description', {
          file_id: fileId,
          file_name: fileName,
        });
        bot.sendMessage(
          chatId,
          `✅ File received (${
            fileName || 'unnamed file'
          }). Now enter a short description for this file (e.g., "1st year Mathematics syllabus").`
        );
      } else if (text && !text.startsWith('/')) {
        bot.sendMessage(
          chatId,
          '⚠️ Please send a file (document, image, audio, video), not text. Or cancel with /cancel_admin_op.'
        );
      }
    } else if (userState.action === 'admin_awaiting_file_description') {
      if (text && text.length > 3) {
        const { file_id, file_name } = userState.data;
        const filesData = readData('files.json', { files: [] });
        const newFileEntry = {
          id: uuidv4(),
          file_id: file_id,
          fileName: file_name,
          description: text,
          uploadedBy: userId,
          uploadDate: new Date().toISOString(),
        };
        filesData.files.push(newFileEntry);
        writeData('files.json', filesData);
        bot.sendMessage(
          chatId,
          `✅ File saved successfully with description "${text}"! Users can now see it in the "Useful Files" section.`
        );
        clearUserState(chatId);
      } else {
        bot.sendMessage(
          chatId,
          '⚠️ Description is too short. Please write a more meaningful description or cancel with /cancel_admin_op.'
        );
      }
    }
    // --- Handle Broadcast Message ---
    else if (userState.action === 'admin_awaiting_broadcast_message') {
      if (!text || text.length < 5) {
        bot.sendMessage(
          chatId,
          '⚠️ Message text is too short. Please re-enter or cancel with /cancel_broadcast.'
        );
        return;
      }

      setUserState(chatId, 'admin_confirm_broadcast', { messageText: text });
      bot.sendMessage(
        chatId,
        `📢 You are about to send the following message to ALL known users:\n\n"${text}"\n\nTo continue, type **YES SEND** (in all caps) or cancel with /cancel_broadcast. THIS ACTION CANNOT BE UNDONE.`,
        { parse_mode: 'Markdown' }
      );
    } else if (userState.action === 'admin_confirm_broadcast') {
      if (text && text === 'YES SEND') {
        const { messageText } = userState.data;
        bot.sendMessage(
          chatId,
          `⏳ Sending broadcast... This may take a while.`
        );
        clearUserState(chatId);

        const feedbackData = readData('feedback.json', { feedbacks: [] });
        const adminData = readData('admins.json', { adminUserIds: [] });

        const knownUserIds = new Set();
        feedbackData.feedbacks.forEach(f => knownUserIds.add(f.userId));
        adminData.adminUserIds.forEach(id => knownUserIds.add(id));

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
            '⚠️ No users found for broadcast. No messages were sent.'
          );
          return;
        }

        let successCount = 0;
        let failCount = 0;
        const totalUsers = knownUserIds.size;

        const userIdsArray = Array.from(knownUserIds);

        for (let i = 0; i < userIdsArray.length; i++) {
          const targetUserId = userIdsArray[i];
          try {
            const finalMessage = `📢 **Important Announcement from University Bot:**\n\n${messageText}\n\n---\n© ${new Date().getFullYear()} Silk Road University Bot`;
            await bot.sendMessage(targetUserId, finalMessage, {
              parse_mode: 'Markdown',
            });
            successCount++;
            if ((i + 1) % 25 === 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          } catch (error) {
            failCount++;
            console.warn(
              `Failed to send broadcast to ${targetUserId}: ${error.message} (Code: ${error.code})`
            );
          }
        }
        bot.sendMessage(
          chatId,
          `✅ Broadcast finished.\n${successCount} users received the message successfully.\n${failCount} failed (total ${totalUsers} attempts).`
        );
      } else {
        bot.sendMessage(
          chatId,
          "📢 Broadcast cancelled. You needed to type 'YES SEND' to confirm."
        );
        clearUserState(chatId);
      }
    }

    // Generic cancel for admin operations (if user types /cancel_admin_op)
    if (text === '/cancel_admin_op') {
      if (userState.action && userState.action.startsWith('admin_awaiting_')) {
        clearUserState(chatId);
        bot.sendMessage(chatId, '🚫 Admin operation cancelled.');
      }
    }
  });

  // Helper for /cancel_admin_op command
  bot.onText(/\/cancel_admin_op/, msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    if (!isAdmin(userId)) return;

    const userState = getUserState(chatId);
    if (
      userState &&
      userState.action &&
      userState.action.startsWith('admin_awaiting_')
    ) {
      clearUserState(chatId);
      bot.sendMessage(chatId, '🚫 Admin operation cancelled.');
    } else {
      bot.sendMessage(
        chatId,
        '🤷‍♀️ There is no active admin operation to cancel.'
      );
    }
  });

  // Command to view all feedback for admins (example of an admin-only command)
  bot.onText(/\/all_feedback/, msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!isAdmin(userId)) {
      bot.sendMessage(chatId, '⛔️ This command is for admins only.');
      return;
    }

    const feedbackData = readData('feedback.json', { feedbacks: [] });
    if (feedbackData.feedbacks.length === 0) {
      bot.sendMessage(chatId, '📬 There is currently no feedback.');
      return;
    }

    const sortedFeedbacks = feedbackData.feedbacks.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    let responseText = '📬 **All Feedback:**\n\n';
    sortedFeedbacks.forEach(fb => {
      responseText += `🆔: ${fb.id}\n`;
      responseText += `👤: ${fb.userName} (ID: ${fb.userId})\n`;
      responseText += `📝: "${fb.message}"\n`;
      responseText += `🗓: ${new Date(fb.timestamp).toLocaleString('en-US')}\n`;
      responseText += `Status: ${fb.status}`;
      if (fb.adminReply) {
        responseText += ` (Replied ✅)\n`;
        responseText += `↪️ Admin reply: "${fb.adminReply.text}" (_by ${fb.adminReply.adminName}_)\n`;
      } else {
        responseText += ` (Awaiting reply ⏳)\n`;
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

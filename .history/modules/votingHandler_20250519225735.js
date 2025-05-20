// modules/votingHandler.js
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
  // --- User: View Polls & Vote ---
  bot.on('callback_query', callbackQuery => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    if (data === 'view_polls') {
      const voteData = readData('votes.json', { polls: [] });
      const activePolls = voteData.polls.filter(p => p.isActive);

      if (activePolls.length === 0) {
        bot.sendMessage(chatId, "😕 Hozircha faol so'rovnomalar mavjud emas.");
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      // For simplicity, show one poll at a time or list them
      // Let's list them with an option to vote
      let responseText = "📋 **Mavjud Faol So'rovnomalar:**\n\n";
      const inline_keyboard = [];

      activePolls.forEach(poll => {
        responseText += `❓ **${poll.question}** (ID: ${poll.id.substring(
          0,
          6
        )})\n`;
        inline_keyboard.push([
          {
            text: `🗳 Ovoz Berish: ${poll.question.substring(0, 25)}...`,
            callback_data: `vote_in_poll_${poll.id}`,
          },
        ]);
        if (isAdmin(userId)) {
          inline_keyboard.push([
            {
              text: `📊 Natijalar (Admin): ${poll.id.substring(0, 6)}`,
              callback_data: `admin_view_poll_results_${poll.id}`,
            },
            {
              text: `🛑 To'xtatish (Admin): ${poll.id.substring(0, 6)}`,
              callback_data: `admin_deactivate_poll_${poll.id}`,
            },
          ]);
        }
      });

      bot.sendMessage(chatId, responseText, {
        reply_markup: { inline_keyboard },
        parse_mode: 'Markdown',
      });
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('vote_in_poll_')) {
      const pollId = data.replace('vote_in_poll_', '');
      const voteData = readData('votes.json', { polls: [] });
      const poll = voteData.polls.find(p => p.id === pollId && p.isActive);

      if (!poll) {
        bot.sendMessage(chatId, "⚠️ So'rovnoma topilmadi yoki faol emas.");
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "So'rovnoma topilmadi!",
          show_alert: true,
        });
        return;
      }

      // Check if user already voted
      const alreadyVoted = poll.options.some(
        opt => opt.voters && opt.voters.includes(userId)
      );
      if (alreadyVoted) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Siz bu so'rovnomada allaqachon ovoz bergansiz!",
          show_alert: true,
        });
        // Optionally show results directly
        displayPollResults(chatId, pollId, userId);
        return;
      }

      const optionButtons = poll.options.map((option, index) => [
        {
          text: `${option.text} (${option.votes} ovoz)`,
          callback_data: `poll_${poll.id}_option_${index}`,
        },
      ]);
      optionButtons.push([
        { text: "◀️ So'rovnomalar Ro'yxatiga", callback_data: 'view_polls' },
      ]);

      bot
        .editMessageText(
          `❓ **${poll.question}**\n\nO'z tanlovingizni belgilang:`,
          {
            chat_id: chatId,
            message_id: msg.message_id,
            reply_markup: { inline_keyboard: optionButtons },
            parse_mode: 'Markdown',
          }
        )
        .catch(e =>
          console.error('Error editing message for poll options:', e.message)
        ); // Catch if message not modified
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('poll_') && data.includes('_option_')) {
      const parts = data.split('_');
      const pollId = parts[1];
      const optionIndex = parseInt(parts[3]);

      const voteData = readData('votes.json', { polls: [] });
      const poll = voteData.polls.find(p => p.id === pollId && p.isActive);

      if (!poll) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "So'rovnoma topilmadi yoki faol emas!",
          show_alert: true,
        });
        return;
      }
      if (
        isNaN(optionIndex) ||
        optionIndex < 0 ||
        optionIndex >= poll.options.length
      ) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Noto'g'ri tanlov!",
          show_alert: true,
        });
        return;
      }

      // Check if user already voted (again, as a safeguard)
      const alreadyVoted = poll.options.some(
        opt => opt.voters && opt.voters.includes(userId)
      );
      if (alreadyVoted) {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Siz bu so'rovnomada allaqachon ovoz bergansiz!",
          show_alert: true,
        });
        displayPollResults(chatId, pollId, userId, msg.message_id); // Show results
        return;
      }

      poll.options[optionIndex].votes =
        (poll.options[optionIndex].votes || 0) + 1;
      if (!poll.options[optionIndex].voters) {
        poll.options[optionIndex].voters = [];
      }
      poll.options[optionIndex].voters.push(userId);
      writeData('votes.json', voteData);

      bot.answerCallbackQuery(callbackQuery.id, {
        text: '✅ Ovozingiz qabul qilindi!',
      });
      displayPollResults(chatId, pollId, userId, msg.message_id); // Show updated results
    }

    // --- Admin: View Poll Results ---
    else if (data.startsWith('admin_view_poll_results_') && isAdmin(userId)) {
      const pollId = data.replace('admin_view_poll_results_', '');
      displayPollResults(chatId, pollId, userId, msg.message_id, true); // isPrivilegedView = true
      bot.answerCallbackQuery(callbackQuery.id);
    }
    // --- Admin: Deactivate Poll ---
    else if (data.startsWith('admin_deactivate_poll_') && isAdmin(userId)) {
      const pollId = data.replace('admin_deactivate_poll_', '');
      const voteData = readData('votes.json', { polls: [] });
      const poll = voteData.polls.find(p => p.id === pollId);
      if (poll) {
        poll.isActive = false;
        writeData('votes.json', voteData);
        bot.answerCallbackQuery(callbackQuery.id, {
          text: `So'rovnoma (ID: ${pollId.substring(0, 6)}) to'xtatildi.`,
        });
        bot
          .editMessageText(
            `✅ So'rovnoma "${poll.question.substring(
              0,
              30
            )}..." to'xtatildi.\nNatijalarni ko'rish uchun: /pollresults_${
              poll.id
            }`,
            {
              chat_id: chatId,
              message_id: msg.message_id,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "◀️ So'rovnomalar Ro'yxatiga",
                      callback_data: 'view_polls',
                    },
                  ],
                ],
              },
            }
          )
          .catch(e => console.error(e));
      } else {
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "So'rovnoma topilmadi.",
          show_alert: true,
        });
      }
    }
  });

  function displayPollResults(
    chat_id,
    poll_id,
    user_id,
    message_id_to_edit = null,
    is_privileged_view = false
  ) {
    const voteData = readData('votes.json', { polls: [] });
    const poll = voteData.polls.find(p => p.id === poll_id);

    if (!poll) {
      bot.sendMessage(chat_id, "⚠️ So'rovnoma natijalari topilmadi.");
      return;
    }

    let resultsText = `📊 **So'rovnoma Natijalari: ${poll.question}**\n${
      !poll.isActive ? "(So'rovnoma Yakunlangan)\n" : ''
    }\n`;
    const totalVotes = poll.options.reduce(
      (sum, opt) => sum + (opt.votes || 0),
      0
    );

    poll.options.forEach(option => {
      const percentage =
        totalVotes > 0
          ? (((option.votes || 0) / totalVotes) * 100).toFixed(1)
          : 0;
      resultsText += `🔹 ${option.text}: ${
        option.votes || 0
      } ovoz (${percentage}%)\n`;
    });
    resultsText += `\nJami ovozlar: ${totalVotes}\n`;

    if (is_privileged_view && isAdmin(user_id)) {
      // Add more details for admin, e.g., list of voters if small, or export option
      resultsText += `\n(Admin ko'rinishi)\n`;
    }

    const keyboard = [
      [{ text: "◀️ So'rovnomalar Ro'yxatiga", callback_data: 'view_polls' }],
    ];
    if (
      poll.isActive &&
      !poll.options.some(opt => opt.voters && opt.voters.includes(user_id))
    ) {
      // If user hasn't voted yet and poll is active, give option to vote again
      keyboard.unshift([
        {
          text: "🗳 Qayta Ovoz Berish / O'zgartirish",
          callback_data: `vote_in_poll_${poll.id}`,
        },
      ]);
    }

    if (message_id_to_edit) {
      bot
        .editMessageText(resultsText, {
          chat_id: chat_id,
          message_id: message_id_to_edit,
          reply_markup: { inline_keyboard: keyboard },
          parse_mode: 'Markdown',
        })
        .catch(e => {
          // If message not modified or other error, send as new
          console.warn(
            'Could not edit message for poll results, sending new one. Error:',
            e.message
          );
          bot.sendMessage(chat_id, resultsText, {
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'Markdown',
          });
        });
    } else {
      bot.sendMessage(chat_id, resultsText, {
        reply_markup: { inline_keyboard: keyboard },
        parse_mode: 'Markdown',
      });
    }
  }

  // --- Admin: Create Poll (State Machine) ---
  bot.on('message', msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (!isAdmin(userId)) return;

    const userState = getUserState(chatId);
    if (!userState || !userState.action.startsWith('admin_awaiting_poll_'))
      return;

    if (userState.action === 'admin_awaiting_poll_question') {
      if (!text || text.length < 5) {
        bot.sendMessage(
          chatId,
          '⚠️ Savol juda qisqa. Qaytadan kiriting yoki /cancel_admin_op bilan bekor qiling.'
        );
        return;
      }
      setUserState(chatId, 'admin_awaiting_poll_options', {
        question: text,
        options: [],
      });
      bot.sendMessage(
        chatId,
        `✅ Savol: "${text}".\n\nEndi variantlarni kiriting (har birini yangi qatordan).\nMasalan:\nVariant A\nVariant B\nVariant C\n\nBarcha variantlarni kiritib bo'lgach, \`/save_poll\` deb yozing.`
      );
    } else if (userState.action === 'admin_awaiting_poll_options') {
      if (text.toLowerCase() === '/save_poll') {
        const { question, options } = userState.data;
        if (options.length < 2) {
          bot.sendMessage(
            chatId,
            "⚠️ So'rovnoma uchun kamida 2 ta variant kerak. Iltimos, yana variant qo'shing yoki /cancel_admin_op bilan bekor qiling."
          );
          return;
        }
        const voteData = readData('votes.json', { polls: [] });
        const newPoll = {
          id: uuidv4(),
          question: question,
          options: options.map(optText => ({
            text: optText,
            votes: 0,
            voters: [],
          })),
          isActive: true,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        };
        voteData.polls.push(newPoll);
        writeData('votes.json', voteData);
        bot.sendMessage(
          chatId,
          `✅ Yangi so'rovnoma "${question.substring(
            0,
            30
          )}..." muvaffaqiyatli yaratildi!`
        );
        clearUserState(chatId);
      } else {
        if (!text) {
          bot.sendMessage(
            chatId,
            "⚠️ Variant matni bo'sh bo'lishi mumkin emas. Qaytadan kiriting."
          );
          return;
        }
        const currentOptions = userState.data.options || [];
        currentOptions.push(text.trim());
        setUserState(chatId, 'admin_awaiting_poll_options', {
          ...userState.data,
          options: currentOptions,
        });
        bot.sendMessage(
          chatId,
          `➕ Variant "${text.trim()}" qo'shildi. Yana qo'shing yoki /save_poll bilan saqlang.`
        );
      }
    }
  });
};

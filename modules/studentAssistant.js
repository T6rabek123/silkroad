// modules/studentAssistant.js
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
  bot.on('callback_query', async callbackQuery => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    // --- View Timetable ---
    if (data === 'view_timetable') {
      const timetableData = readData('timetable.json'); // Default value handled by readData
      let responseText = '📅 **Dars Jadvali**\n\n';
      let hasTextSchedule = false;

      if (timetableData.generalInfo) {
        responseText += `📢 **Umumiy Ma'lumot:**\n${timetableData.generalInfo}\n\n`;
      }

      const daysOrder = [
        'dushanba',
        'seshanba',
        'chorshanba',
        'payshanba',
        'juma',
        'shanba',
        'yakshanba',
      ];
      if (
        timetableData.schedules &&
        Object.keys(timetableData.schedules).length > 0
      ) {
        daysOrder.forEach(dayKey => {
          const daySchedule = timetableData.schedules[dayKey];
          if (daySchedule && daySchedule.length > 0) {
            hasTextSchedule = true;
            responseText += `🗓️ **${
              dayKey.charAt(0).toUpperCase() + dayKey.slice(1)
            }:**\n`;
            daySchedule.forEach(item => {
              responseText += `  🕒 ${item.time} - ${item.subject} (${
                item.location || 'N/A'
              })\n`;
            });
            responseText += '\n';
          }
        });
      }

      const inline_keyboard = [];
      if (timetableData.uploadedFile && timetableData.uploadedFile.file_id) {
        responseText += `\n📄 Shuningdek, yuklangan jadval fayli mavjud.\n`;
        inline_keyboard.push([
          {
            text: `📥 Yuklangan Jadvalni Ochish (${
              timetableData.uploadedFile.file_name || 'Fayl'
            })`,
            callback_data: 'get_timetable_file',
          },
        ]);
      }

      if (
        !hasTextSchedule &&
        !timetableData.generalInfo &&
        !(timetableData.uploadedFile && timetableData.uploadedFile.file_id)
      ) {
        responseText =
          '😕 Hozircha dars jadvali kiritilmagan (na matn, na fayl).';
      } else if (
        !hasTextSchedule &&
        timetableData.uploadedFile &&
        timetableData.uploadedFile.file_id &&
        !timetableData.generalInfo
      ) {
        // If only file exists, make the message clearer
        responseText = `📅 **Dars Jadvali**\n\n📄 Jadval fayl shaklida yuklangan. Uni ochish uchun quyidagi tugmani bosing.`;
      }

      bot.sendMessage(chatId, responseText, {
        parse_mode: 'Markdown',
        reply_markup:
          inline_keyboard.length > 0 ? { inline_keyboard } : undefined,
      });
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data === 'get_timetable_file') {
      const timetableData = readData('timetable.json');
      if (timetableData.uploadedFile && timetableData.uploadedFile.file_id) {
        const { file_id, file_type, caption, file_name } =
          timetableData.uploadedFile;
        const sendOptions = caption ? { caption: caption } : {};
        try {
          switch (file_type) {
            case 'document':
              await bot.sendDocument(chatId, file_id, sendOptions);
              break;
            case 'photo':
              await bot.sendPhoto(chatId, file_id, sendOptions);
              break;
            // Add other types if you plan to support them for timetable (e.g. PDF as document)
            default: // Fallback to document if type is unknown or not specifically handled
              console.warn(
                `Unknown or unhandled file_type '${file_type}' for timetable. Sending as document.`
              );
              await bot.sendDocument(chatId, file_id, sendOptions);
          }
          bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Jadval fayli yuborilmoqda...',
          });
        } catch (err) {
          console.error(
            'Error sending timetable file:',
            err.message,
            'File ID:',
            file_id,
            'File Type:',
            file_type
          );
          bot.sendMessage(
            chatId,
            `⚠️ Jadval faylini (${
              file_name || "Noma'lum fayl"
            }) yuborishda xatolik yuz berdi. Admin bilan bog'laning.`
          );
          bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Faylni yuborishda xatolik!',
            show_alert: true,
          });
        }
      } else {
        bot.sendMessage(chatId, '⚠️ Yuklangan jadval fayli topilmadi.');
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'Fayl topilmadi!',
          show_alert: true,
        });
      }
    }

    // --- GPA Calculator ---
    else if (data === 'gpa_calculator') {
      setUserState(chatId, 'gpa_awaiting_grades');
      bot.sendMessage(
        chatId,
        "📊 **GPA Calculator**\n\nEnter your grades and their credits in the following format (each subject on a new line):\n`Grade,Credit` (Example: `A,3` or `87,4`)\n\nGrading system:\nA = 4.0 (90-100)\nB+ = 3.5 (85-89)\nB = 3.0 (80-84)\nC+ = 2.5 (75-79)\nC = 2.0 (70-74)\nD = 1.0 (60-69)\nF = 0.0 (<60)\n\nAfter entering all subjects, send the command `/calculate_gpa` or simply type 'calculate'."
      );
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- View Useful Files ---
    else if (data === 'view_useful_files') {
      const filesData = readData('files.json', { files: [] });
      if (!filesData.files || filesData.files.length === 0) {
        bot.sendMessage(
          chatId,
          '😕 There are currently no useful files available.'
        );
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      let responseText = '📎 **Useful Files:**\n\n';
      const inline_keyboard = [];
      filesData.files.forEach(file => {
        // Truncate description if too long for button text
        const shortDesc =
          file.description.length > 40
            ? file.description.substring(0, 37) + '...'
            : file.description;
        inline_keyboard.push([
          { text: `📄 ${shortDesc}`, callback_data: `get_file_${file.id}` },
        ]);
      });
      if (inline_keyboard.length === 0) {
        bot.sendMessage(
          chatId,
          '😕 There are currently no useful files available.'
        );
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      bot.sendMessage(chatId, responseText, {
        reply_markup: { inline_keyboard },
        parse_mode: 'Markdown',
      });
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('get_file_')) {
      const fileEntryId = data.replace('get_file_', '');
      const filesData = readData('files.json', { files: [] });
      const fileEntry = filesData.files.find(f => f.id === fileEntryId);

      if (fileEntry && fileEntry.file_id) {
        bot
          .sendDocument(chatId, fileEntry.file_id, {
            caption: `📄 File: ${fileEntry.description}\nUploaded: ${new Date(
              fileEntry.uploadDate
            ).toLocaleDateString('en-US')}`,
          })
          .then(() =>
            bot.answerCallbackQuery(callbackQuery.id, {
              text: 'Sending file...',
            })
          )
          .catch(err => {
            console.error('Error sending document:', err.message);
            bot.sendMessage(
              chatId,
              '⚠️ Error sending the file. The file may have been deleted from the server.'
            );
            bot.answerCallbackQuery(callbackQuery.id, {
              text: 'Error sending file!',
              show_alert: true,
            });
          });
      } else {
        bot.sendMessage(chatId, '⚠️ File not found or file ID is incorrect.');
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'File not found!',
          show_alert: true,
        });
      }
    } else if (data === 'view_exams_soon') {
      bot.answerCallbackQuery(callbackQuery.id, {
        text: 'This section will be launched soon!',
        show_alert: false,
      });
      bot.sendMessage(
        chatId,
        '✍️ The exam schedule section is currently under development and will be launched soon.'
      );
    }
  });

  // --- GPA Calculation Logic ---
  bot.on('message', msg => {
    const chatId = msg.chat.id;
    const text = msg.text;

    const userState = getUserState(chatId);
    if (!userState || userState.action !== 'gpa_awaiting_grades') return;

    if (
      text.toLowerCase() === '/calculate_gpa' ||
      text.toLowerCase() === 'hisobla'
    ) {
      const gradesInput = userState.data.rawInput || '';
      if (!gradesInput.trim()) {
        bot.sendMessage(
          chatId,
          "⚠️ You haven't entered any grades yet. Please enter grades in the `Grade,Credit` format."
        );
        return;
      }

      const lines = gradesInput.trim().split('\n');
      let totalPoints = 0;
      let totalCredits = 0;
      let parseError = false;
      let resultsText = '📊 **Calculated GPA Results:**\n\n';

      const gradeToPoint = grade => {
        grade = String(grade).toUpperCase();
        if (grade === 'A' || (Number(grade) >= 95 && Number(grade) <= 100))
          return 4.0;
        if (grade === 'A-' || (Number(grade) >= 90 && Number(grade) <= 94))
          if (grade === 'B+' || (Number(grade) >= 85 && Number(grade) <= 89))
            return 3.67;
        if (grade === 'B' || (Number(grade) >= 80 && Number(grade) <= 84))
          return 3.0;
        if (grade === 'B-' || (Number(grade) >= 75 && Number(grade) <= 79))
          return 2.67;
        if (grade === 'C+' || (Number(grade) >= 70 && Number(grade) <= 74))
          return 2.33;
        if (grade === 'C' || (Number(grade) >= 65 && Number(grade) <= 69))
          return 2.0;
        if (grade === 'C-' || (Number(grade) >= 60 && Number(grade) <= 64))
          return 1.67;
        if (grade === 'D+' || (Number(grade) >= 55 && Number(grade) <= 59))
          return 1.33;
        if (grade === 'D' || (Number(grade) >= 50 && Number(grade) <= 54))
          return 1.0;
        if (grade === 'F' || (Number(grade) >= 0 && Number(grade) <= 49))
          return 0.0;
        return null;
      };

      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length !== 2) {
          parseError = true;
          resultsText += `❗️ Error in line: "${line}" - Incorrect format.\n`;
          return;
        }
        const gradeStr = parts[0].trim();
        const creditStr = parts[1].trim();
        const points = gradeToPoint(gradeStr);
        const credits = parseFloat(creditStr);

        if (points === null || isNaN(credits) || credits <= 0) {
          parseError = true;
          resultsText += `❗️ Error in line: "${line}" - Invalid grade or credit.\n`;
          return;
        }
        totalPoints += points * credits;
        totalCredits += credits;
        resultsText += `✅ ${gradeStr} (${points.toFixed(
          1
        )}) - ${credits} credit(s)\n`;
      });

      if (totalCredits > 0) {
        const gpa = totalPoints / totalCredits;
        resultsText += `\n🎓 **Total GPA: ${gpa.toFixed(
          2
        )}** (${totalPoints.toFixed(1)} points / ${totalCredits} credits)`;
      } else if (!parseError) {
        resultsText +=
          '\n🤷‍♀️ No credits entered or credits equal to 0. GPA not calculated.';
      }
      if (parseError) {
        resultsText +=
          '\n\n⚠️ There are errors in some lines. Please correct them and try again.';
      }

      bot.sendMessage(chatId, resultsText, { parse_mode: 'Markdown' });
      clearUserState(chatId);
    } else {
      const currentRawInput = userState.data.rawInput || '';
      setUserState(chatId, 'gpa_awaiting_grades', {
        rawInput: currentRawInput + text + '\n',
      });
    }
  });

  bot.on('message', msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (!isAdmin(userId)) return;
    const userState = getUserState(chatId);
    if (!userState || userState.action !== 'admin_awaiting_timetable_text')
      return;

    if (!text || text.length < 20) {
      bot.sendMessage(
        chatId,
        '⚠️ The timetable text is too short. Please enter more detailed information or cancel with /cancel_admin_op.'
      );
      return;
    }

    const timetableData = readData('timetable.json', {
      schedules: {},
      generalInfo: '',
    });

    const newSchedules = {};
    let currentDay = null;
    const lines = text.split('\n');
    const dayRegex =
      /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*:/i;
    const itemRegex =
      /^\s*(?:[0-9]\.|-)\s*([0-9]{2}:[0-9]{2})\s*-\s*(.+?)(?:\s+\((.+?)\))?$/i;

    let parsedSomething = false;
    for (const line of lines) {
      const dayMatch = line.match(dayRegex);
      if (dayMatch) {
        currentDay = dayMatch[1].toLowerCase();
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
            location: itemMatch[3] ? itemMatch[3].trim() : 'Unknown',
          });
          parsedSomething = true;
        }
      }
    }

    if (parsedSomething) {
      timetableData.schedules = newSchedules;
      timetableData.generalInfo = 'Timetable updated (automatically parsed).';
      bot.sendMessage(
        chatId,
        '✅ Timetable (partially parsed) saved successfully!'
      );
    } else {
      timetableData.generalInfo = text;
      bot.sendMessage(
        chatId,
        '✅ Timetable saved successfully as general information!'
      );
    }

    writeData('timetable.json', timetableData);
    clearUserState(chatId);
  });
};

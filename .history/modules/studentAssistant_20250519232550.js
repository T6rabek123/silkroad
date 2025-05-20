// modules/studentAssistant.js
// const { v4: uuidv4 } = require('uuid'); // Not directly used here but good practice if adding IDs

module.exports = ({
  bot,
  isAdmin,
  readData,
  writeData,
  setUserState,
  getUserState,
  clearUserState,
}) => {
  const getDayKey = (date = new Date()) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  };

  bot.on('callback_query', async callbackQuery => {
    // Added async for await
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
      // ... (existing GPA code)
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- View Useful Files ---
    else if (data === 'view_useful_files') {
      const filesData = readData('files.json', { files: [] });
      if (!filesData.files || filesData.files.length === 0) {
        bot.sendMessage(chatId, '😕 Hozircha foydali fayllar mavjud emas.');
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      let responseText = '📎 **Foydali Fayllar:**\n\n'; // Will be sent if keyboard is not empty
      const inline_keyboard = [];
      filesData.files.forEach(file => {
        const shortDesc =
          file.description.length > 40
            ? file.description.substring(0, 37) + '...'
            : file.description;
        // Add an emoji based on file type if available
        let emoji = '📄'; // Default
        if (file.file_type === 'photo') emoji = '🖼️';
        else if (file.file_type === 'audio') emoji = '🎧';
        else if (file.file_type === 'video') emoji = '🎬';
        else if (file.fileName && file.fileName.toLowerCase().includes('.pdf'))
          emoji = '📕';
        else if (
          file.fileName &&
          (file.fileName.toLowerCase().includes('.doc') ||
            file.fileName.toLowerCase().includes('.docx'))
        )
          emoji = '📃';
        else if (
          file.fileName &&
          (file.fileName.toLowerCase().includes('.xls') ||
            file.fileName.toLowerCase().includes('.xlsx'))
        )
          emoji = '📊';

        inline_keyboard.push([
          {
            text: `${emoji} ${shortDesc}`,
            callback_data: `get_useful_file_${file.id}`,
          },
        ]);
      });
      if (inline_keyboard.length === 0) {
        bot.sendMessage(
          chatId,
          "😕 Hozircha foydali fayllar mavjud emas (ro'yxat bo'sh)."
        );
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      bot.sendMessage(chatId, responseText, {
        reply_markup: { inline_keyboard },
        parse_mode: 'Markdown',
      });
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('get_useful_file_')) {
      const fileEntryId = data.replace('get_useful_file_', '');
      const filesData = readData('files.json', { files: [] });
      const fileEntry = filesData.files.find(f => f.id === fileEntryId);

      if (fileEntry && fileEntry.file_id && fileEntry.file_type) {
        const sendOptions = {
          caption: `📄 Fayl: ${fileEntry.description}\nYuklandi: ${new Date(
            fileEntry.uploadDate
          ).toLocaleDateString('uz-UZ')}`,
        };
        try {
          switch (fileEntry.file_type) {
            case 'document':
              await bot.sendDocument(chatId, fileEntry.file_id, sendOptions);
              break;
            case 'photo':
              await bot.sendPhoto(chatId, fileEntry.file_id, sendOptions);
              break;
            case 'audio':
              await bot.sendAudio(chatId, fileEntry.file_id, sendOptions);
              break;
            case 'video':
              await bot.sendVideo(chatId, fileEntry.file_id, sendOptions);
              break;
            default:
              console.warn(
                `Unknown file_type '${fileEntry.file_type}' for useful file ID ${fileEntry.id}. Attempting to send as document.`
              );
              await bot.sendDocument(chatId, fileEntry.file_id, sendOptions); // Fallback
          }
          bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Fayl yuborilmoqda...',
          });
        } catch (err) {
          console.error(
            'Error sending useful file:',
            err.message,
            'File ID:',
            fileEntry.file_id,
            'File Type:',
            fileEntry.file_type
          );
          bot.sendMessage(
            chatId,
            `⚠️ Faylni (${
              fileEntry.fileName || fileEntry.description
            }) yuborishda xatolik yuz berdi. Fayl serverdan o'chirilgan yoki turi noto'g'ri bo'lishi mumkin.`
          );
          bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Fayl yuborishda xatolik!',
            show_alert: true,
          });
        }
      } else {
        bot.sendMessage(
          chatId,
          "⚠️ Fayl topilmadi, fayl ID si yoki turi noto'g'ri saqlangan."
        );
        bot.answerCallbackQuery(callbackQuery.id, {
          text: "Fayl ma'lumotlari topilmadi!",
          show_alert: true,
        });
      }
    } else if (data === 'view_exams_soon') {
      // ... (existing code)
      bot.answerCallbackQuery(callbackQuery.id);
    }
  });

  // --- GPA Calculation Logic ---
  bot.on('message', msg => {
    const chatId = msg.chat.id;
    const text = msg.text;

    const userState = getUserState(chatId);
    // This handler is now only for GPA. Timetable text input is in adminHandler.
    if (!userState || userState.action !== 'gpa_awaiting_grades') return;
    // ... (existing GPA calculation code from previous studentAssistant.js)
    if (
      text.toLowerCase() === '/calculate_gpa' ||
      text.toLowerCase() === 'hisobla'
    ) {
      const gradesInput = userState.data.rawInput || '';
      if (!gradesInput.trim()) {
        bot.sendMessage(
          chatId,
          '⚠️ Siz hali hech qanday baho kiritmadingiz. Iltimos, baholarni `Baho,Kredit` formatida kiriting.'
        );
        return;
      }

      const lines = gradesInput.trim().split('\n');
      let totalPoints = 0;
      let totalCredits = 0;
      let parseError = false;
      let resultsText = '📊 **Hisoblangan GPA Natijalari:**\n\n';

      const gradeToPoint = grade => {
        grade = String(grade).toUpperCase();
        if (grade === 'A' || (Number(grade) >= 90 && Number(grade) <= 100))
          return 4.0;
        if (grade === 'B+' || (Number(grade) >= 85 && Number(grade) <= 89))
          return 3.5;
        if (grade === 'B' || (Number(grade) >= 80 && Number(grade) <= 84))
          return 3.0;
        if (grade === 'C+' || (Number(grade) >= 75 && Number(grade) <= 79))
          return 2.5;
        if (grade === 'C' || (Number(grade) >= 70 && Number(grade) <= 74))
          return 2.0;
        if (grade === 'D' || (Number(grade) >= 60 && Number(grade) <= 69))
          return 1.0;
        if (grade === 'F' || (Number(grade) < 60 && Number(grade) >= 0))
          return 0.0;
        return null;
      };

      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length !== 2) {
          parseError = true;
          resultsText += `❗️ Xato qator: "${line}" - Format noto'g'ri.\n`;
          return;
        }
        const gradeStr = parts[0].trim();
        const creditStr = parts[1].trim();
        const points = gradeToPoint(gradeStr);
        const credits = parseFloat(creditStr);

        if (points === null || isNaN(credits) || credits <= 0) {
          parseError = true;
          resultsText += `❗️ Xato qator: "${line}" - Baho yoki kredit noto'g'ri.\n`;
          return;
        }
        totalPoints += points * credits;
        totalCredits += credits;
        resultsText += `✅ ${gradeStr} (${points.toFixed(
          1
        )}) - ${credits} kredit\n`;
      });

      if (totalCredits > 0) {
        const gpa = totalPoints / totalCredits;
        resultsText += `\n🎓 **Umumiy GPA: ${gpa.toFixed(
          2
        )}** (${totalPoints.toFixed(1)} ball / ${totalCredits} kredit)`;
      } else if (!parseError) {
        resultsText +=
          '\n🤷‍♀️ Kreditlar kiritilmagan yoki 0 ga teng. GPA hisoblanmadi.';
      }
      if (parseError) {
        resultsText +=
          "\n\n⚠️ Ba'zi qatorlarda xatoliklar bor. Iltimos, ularni to'g'rilab, qayta urinib ko'ring.";
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
};

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
  bot.on('callback_query', callbackQuery => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    // --- View Timetable ---
    if (data === 'view_timetable') {
      const timetableData = readData('timetable.json', {
        schedules: {},
        generalInfo: '',
      });
      let responseText = '📅 **Dars Jadvali**\n\n';

      if (timetableData.generalInfo) {
        responseText += `📢 **Umumiy Ma'lumot:**\n${timetableData.generalInfo}\n\n`;
      }

      const days = [
        'dushanba',
        'seshanba',
        'chorshanba',
        'payshanba',
        'juma',
        'shanba',
      ]; // Uzbek days
      let hasSchedule = false;
      days.forEach(dayKey => {
        const daySchedule = timetableData.schedules[dayKey.toLowerCase()]; // Assuming keys are lowercase
        if (daySchedule && daySchedule.length > 0) {
          hasSchedule = true;
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

      if (!hasSchedule && !timetableData.generalInfo) {
        responseText = '😕 Hozircha dars jadvali kiritilmagan.';
      }

      bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
      bot.answerCallbackQuery(callbackQuery.id);
    }

    // --- GPA Calculator ---
    else if (data === 'gpa_calculator') {
      setUserState(chatId, 'gpa_awaiting_grades');
      bot.sendMessage(
        chatId,
        "📊 **GPA Kalkulyatori**\n\nBaholaringizni va ularning kreditlarini quyidagi formatda kiriting (har bir fanni yangi qatordan):\n`Baho,Kredit` (Masalan: `A,3` yoki `87,4`)\n\nBaho tizimi:\nA = 4.0 (90-100)\nB+ = 3.5 (85-89)\nB = 3.0 (80-84)\nC+ = 2.5 (75-79)\nC = 2.0 (70-74)\nD = 1.0 (60-69)\nF = 0.0 (<60)\n\nBarcha fanlarni kiritib bo'lgach, `/calculate_gpa` buyrug'ini yuboring yoki shunchaki 'hisobla' deb yozing."
      );
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

      let responseText = '📎 **Foydali Fayllar:**\n\n';
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
        // Should be caught by above check
        bot.sendMessage(chatId, '😕 Hozircha foydali fayllar mavjud emas.');
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
            caption: `📄 Fayl: ${fileEntry.description}\nYuklandi: ${new Date(
              fileEntry.uploadDate
            ).toLocaleDateString('uz-UZ')}`,
          })
          .then(() =>
            bot.answerCallbackQuery(callbackQuery.id, {
              text: 'Fayl yuborilmoqda...',
            })
          )
          .catch(err => {
            console.error('Error sending document:', err.message);
            bot.sendMessage(
              chatId,
              "⚠️ Faylni yuborishda xatolik. Fayl serverdan o'chirilgan bo'lishi mumkin."
            );
            bot.answerCallbackQuery(callbackQuery.id, {
              text: 'Fayl yuborishda xatolik!',
              show_alert: true,
            });
          });
      } else {
        bot.sendMessage(chatId, "⚠️ Fayl topilmadi yoki fayl ID si noto'g'ri.");
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'Fayl topilmadi!',
          show_alert: true,
        });
      }
    } else if (data === 'view_exams_soon') {
      bot.answerCallbackQuery(callbackQuery.id, {
        text: "Bu bo'lim tez kunda ishga tushadi!",
        show_alert: false,
      });
      bot.sendMessage(
        chatId,
        "✍️ Imtihonlar jadvali bo'limi hozirda ishlab chiqilmoqda va tez kunda ishga tushadi."
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
          return 1.0; // Assuming D is passing
        if (grade === 'F' || (Number(grade) < 60 && Number(grade) >= 0))
          return 0.0;
        return null; // Invalid grade
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
      clearUserState(chatId); // Calculation done
    } else {
      // Accumulate input
      const currentRawInput = userState.data.rawInput || '';
      setUserState(chatId, 'gpa_awaiting_grades', {
        rawInput: currentRawInput + text + '\n',
      });
      // Optional: Acknowledge input, e.g., bot.sendMessage(chatId, `"${text}" qabul qilindi. Davom eting yoki 'hisobla' deb yozing.`);
    }
  });

  // --- Admin: Uploading Timetable (from adminHandler state) ---
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
        "⚠️ Jadval matni juda qisqa. Iltimos, batafsilroq ma'lumot kiriting yoki /cancel_admin_op bilan bekor qiling."
      );
      return;
    }

    // Simple approach: store the whole text as generalInfo or parse it.
    // For this version, let's store it as generalInfo.
    // A more complex parser could populate the 'schedules' object.
    const timetableData = readData('timetable.json', {
      schedules: {},
      generalInfo: '',
    });

    // Basic parsing attempt (example)
    const newSchedules = {};
    let currentDay = null;
    const lines = text.split('\n');
    const dayRegex =
      /^(Dushanba|Seshanba|Chorshanba|Payshanba|Juma|Shanba|Yakshanba)\s*:/i;
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
            location: itemMatch[3] ? itemMatch[3].trim() : "Noma'lum",
          });
          parsedSomething = true;
        }
      }
    }

    if (parsedSomething) {
      timetableData.schedules = newSchedules;
      timetableData.generalInfo =
        'Jadval yangilandi (avtomatik tahlil qilingan).'; // Or clear if fully parsed
      bot.sendMessage(
        chatId,
        '✅ Dars jadvali (qisman tahlil qilingan holda) muvaffaqiyatli saqlandi!'
      );
    } else {
      // If parsing fails or is not comprehensive, store as general info
      timetableData.generalInfo = text;
      bot.sendMessage(
        chatId,
        "✅ Dars jadvali umumiy ma'lumot sifatida muvaffaqiyatli saqlandi!"
      );
    }

    writeData('timetable.json', timetableData);
    clearUserState(chatId);
  });
};

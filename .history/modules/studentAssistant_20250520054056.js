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
      let responseText = '📅 **Class Timetable**\n\n';

      if (timetableData.generalInfo) {
        responseText += `📢 **General Information:**\n${timetableData.generalInfo}\n\n`;
      }

      const days = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ]; // English days
      let hasSchedule = false;
      days.forEach(dayKey => {
        const daySchedule = timetableData.schedules[dayKey.toLowerCase()];
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
        responseText = "😕 No timetable has been entered yet.";
      }

      bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
      bot.answerCallbackQuery(callbackQuery.id);
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
        bot.sendMessage(chatId, '😕 There are currently no useful files available.');
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
        bot.sendMessage(chatId, '😕 There are currently no useful files available.');
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
              "⚠️ Error sending the file. The file may have been deleted from the server."
            );
            bot.answerCallbackQuery(callbackQuery.id, {
              text: 'Error sending file!',
              show_alert: true,
            });
          });
      } else {
        bot.sendMessage(chatId, "⚠️ File not found or file ID is incorrect.");
        bot.answerCallbackQuery(callbackQuery.id, {
          text: 'File not found!',
          show_alert: true,
        });
      }
    } else if (data === 'view_exams_soon') {
      bot.answerCallbackQuery(callbackQuery.id, {
        text: "This section will be launched soon!",
        show_alert: false,
      });
      bot.sendMessage(
        chatId,
        "✍️ The exam schedule section is currently under development and will be launched soon."
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
          "\n\n⚠️ There are errors in some lines. Please correct them and try again.";
      }

      bot.sendMessage(chatId, resultsText, { parse_mode: 'Markdown' });
      clearUserState(chatId); // Calculation done
    } else {
      // Accumulate input
      const currentRawInput = userState.data.rawInput || '';
      setUserState(chatId, 'gpa_awaiting_grades', {
        rawInput: currentRawInput + text + '\n',
      });
      // Optional: Acknowledge input, e.g., bot.sendMessage(chatId, `"${text}" received. Continue or type 'calculate'.`);
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
        "⚠️ The timetable text is too short. Please enter more detailed information or cancel with /cancel_admin_op."
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
            location: itemMatch[3] ? itemMatch[3].trim() : "Unknown",
          });
          parsedSomething = true;
        }
      }
    }

    if (parsedSomething) {
      timetableData.schedules = newSchedules;
      timetableData.generalInfo =
        'Timetable updated (automatically parsed).';
      bot.sendMessage(
        chatId,
        '✅ Timetable (partially parsed) saved successfully!'
      );
    } else {
      // If parsing fails or is not comprehensive, store as general info
      timetableData.generalInfo = text;
      bot.sendMessage(
        chatId,
        "✅ Timetable saved successfully as general information!"
      );
    }

    writeData('timetable.json', timetableData);
    clearUserState(chatId);
  });
};

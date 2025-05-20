// modules/newsHandler.js
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
  // --- Callback Query for Viewing News ---
  bot.on('callback_query', callbackQuery => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    // const userId = callbackQuery.from.id; // Not strictly needed for viewing
    const data = callbackQuery.data;

    if (data === 'view_news') {
      const newsData = readData('news.json', { articles: [] });
      if (!newsData.articles || newsData.articles.length === 0) {
        bot.sendMessage(chatId, '😕 Hozircha yangiliklar mavjud emas.');
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      // Sort news by date, newest first
      const sortedNews = newsData.articles.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      let responseText = "📰 **So'nggi Yangiliklar va E'lonlar:**\n\n";
      const articlesToShow = sortedNews.slice(0, 5); // Show latest 5

      if (articlesToShow.length === 0) {
        // Should be caught by above check, but as a safeguard
        bot.sendMessage(chatId, '😕 Hozircha yangiliklar mavjud emas.');
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      articlesToShow.forEach(article => {
        responseText += `🔹 **${article.title}**\n`;
        responseText += `_${new Date(article.date).toLocaleDateString('uz-UZ', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}_\n`;
        responseText += `${article.content.substring(0, 150)}...\n`; // Show a snippet
        responseText += `[Batafsil o'qish](tg://btn/${article.id})\n\n`; // Placeholder, real navigation below
      });

      const inline_keyboard = articlesToShow.map(article => [
        {
          text: `➡️ ${article.title.substring(0, 30)}...`,
          callback_data: `view_news_article_${article.id}`,
        },
      ]);

      if (sortedNews.length > 5) {
        inline_keyboard.push([
          {
            text: " قدیمی تر اخبار (Ko'proq ko'rish)",
            callback_data: 'view_news_page_2',
          },
        ]); // Basic pagination start
      }

      bot.sendMessage(chatId, responseText, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard },
      });
      bot.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('view_news_article_')) {
      const articleId = data.replace('view_news_article_', '');
      const newsData = readData('news.json', { articles: [] });
      const article = newsData.articles.find(a => a.id === articleId);

      if (article) {
        const articleText =
          `📰 **${article.title}**\n` +
          `📅 _${new Date(article.date).toLocaleString('uz-UZ', {
            dateStyle: 'full',
            timeStyle: 'short',
          })}_\n\n` +
          `${article.content}\n\n` +
          (isAdmin(callbackQuery.from.id)
            ? `🗑 O'chirish uchun: /delete_news_${article.id}`
            : ''); // Admin delete option

        bot.sendMessage(chatId, articleText, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "◀️ Yangiliklar Ro'yxatiga Qaytish",
                  callback_data: 'view_news',
                },
              ],
            ],
          },
        });
      } else {
        bot.sendMessage(chatId, '⚠️ Yangilik topilmadi.');
      }
      bot.answerCallbackQuery(callbackQuery.id);
    }
    // Add pagination logic for 'view_news_page_' if needed
  });

  // --- Admin: Adding News (State Machine) ---
  bot.on('message', msg => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (!isAdmin(userId)) return;

    const userState = getUserState(chatId);
    if (!userState || !userState.action.startsWith('admin_awaiting_news_'))
      return;

    if (userState.action === 'admin_awaiting_news_title') {
      if (!text || text.length < 5) {
        bot.sendMessage(
          chatId,
          "⚠️ Sarlavha juda qisqa. Kamida 5 ta belgi bo'lishi kerak. Qaytadan kiriting yoki /cancel_admin_op bilan bekor qiling."
        );
        return;
      }
      setUserState(chatId, 'admin_awaiting_news_content', { title: text });
      bot.sendMessage(
        chatId,
        `✅ Sarlavha qabul qilindi: "${text}".\n\nEndi yangilik matnini (mazmunini) kiriting:`
      );
    } else if (userState.action === 'admin_awaiting_news_content') {
      if (!text || text.length < 20) {
        bot.sendMessage(
          chatId,
          "⚠️ Yangilik matni juda qisqa. Kamida 20 ta belgi bo'lishi kerak. Qaytadan kiriting yoki /cancel_admin_op bilan bekor qiling."
        );
        return;
      }
      const { title } = userState.data;
      const newsData = readData('news.json', { articles: [] });
      const newArticle = {
        id: uuidv4(),
        title: title,
        content: text,
        date: new Date().toISOString(),
        authorId: userId,
      };
      newsData.articles.push(newArticle);
      writeData('news.json', newsData);

      bot.sendMessage(
        chatId,
        `✅ Yangilik "${title}" muvaffaqiyatli qo'shildi!`
      );
      clearUserState(chatId);
    }
  });

  // --- Admin: Deleting News (Command based for simplicity with ID) ---
  bot.onText(/\/delete_news_([a-zA-Z0-9-]+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const articleIdToDelete = match[1];

    if (!isAdmin(userId)) {
      bot.sendMessage(chatId, "⛔️ Sizda bu amalni bajarishga ruxsat yo'q.");
      return;
    }

    const newsData = readData('news.json', { articles: [] });
    const initialLength = newsData.articles.length;
    newsData.articles = newsData.articles.filter(
      article => article.id !== articleIdToDelete
    );

    if (newsData.articles.length < initialLength) {
      writeData('news.json', newsData);
      bot.sendMessage(
        chatId,
        `🗑 Yangilik (ID: ${articleIdToDelete}) muvaffaqiyatli o'chirildi.`
      );
    } else {
      bot.sendMessage(
        chatId,
        `⚠️ Yangilik (ID: ${articleIdToDelete}) topilmadi yoki o'chirib bo'lmadi.`
      );
    }
  });
};

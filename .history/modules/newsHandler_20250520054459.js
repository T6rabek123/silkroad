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
        bot.sendMessage(chatId, '😕 There are currently no news articles.');
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      // Sort news by date, newest first
      const sortedNews = newsData.articles.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      let responseText = "📰 **Latest News and Announcements:**\n\n";
      const articlesToShow = sortedNews.slice(0, 5); // Show latest 5

      if (articlesToShow.length === 0) {
        // Should be caught by above check, but as a safeguard
        bot.sendMessage(chatId, '😕 There are currently no news articles.');
        bot.answerCallbackQuery(callbackQuery.id);
        return;
      }

      articlesToShow.forEach(article => {
        responseText += `🔹 **${article.title}**\n`;
        responseText += `_${new Date(article.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}_\n`;
        responseText += `${article.content.substring(0, 150)}...\n`; // Show a snippet
        responseText += `[Read more](tg://btn/${article.id})\n\n`; // Placeholder, real navigation below
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
            text: "Older News (View More)",
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
          `📅 _${new Date(article.date).toLocaleString('en-US', {
            dateStyle: 'full',
            timeStyle: 'short',
          })}_\n\n` +
          `${article.content}\n\n` +
          (isAdmin(callbackQuery.from.id)
            ? `🗑 To delete: /delete_news_${article.id}`
            : ''); // Admin delete option

        bot.sendMessage(chatId, articleText, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "◀️ Back to News List",
                  callback_data: 'view_news',
                },
              ],
            ],
          },
        });
      } else {
        bot.sendMessage(chatId, '⚠️ News article not found.');
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
          "⚠️ The title is too short. It must be at least 5 characters. Please re-enter or cancel with /cancel_admin_op."
        );
        return;
      }
      setUserState(chatId, 'admin_awaiting_news_content', { title: text });
      bot.sendMessage(
        chatId,
        `✅ Title accepted: "${text}".\n\nNow enter the news content:`
      );
    } else if (userState.action === 'admin_awaiting_news_content') {
      if (!text || text.length < 20) {
        bot.sendMessage(
          chatId,
          "⚠️ The news content is too short. It must be at least 20 characters. Please re-enter or cancel with /cancel_admin_op."
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
        `✅ News "${title}" added successfully!`
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
      bot.sendMessage(chatId, "⛔️ You do not have permission to perform this action.");
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
        `🗑 News (ID: ${articleIdToDelete}) deleted successfully.`
      );
    } else {
      bot.sendMessage(
        chatId,
        `⚠️ News (ID: ${articleIdToDelete}) not found or could not be deleted.`
      );
    }
  });
};

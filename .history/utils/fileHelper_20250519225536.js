// utils/fileHelper.js
const fs = require('fs');
const path = require('path');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Reads data from a JSON file synchronously.
 * @param {string} fileName - The name of the file (e.g., 'news.json').
 * @param {object} defaultValue - The default value to return if the file doesn't exist or is empty.
 * @returns {object} The parsed JSON data or the default value.
 */
function readData(fileName, defaultValue = {}) {
  const filePath = path.join(dataDir, fileName);
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }
    // If file doesn't exist, create it with default value
    writeData(fileName, defaultValue);
    return defaultValue;
  } catch (error) {
    console.error(`Error reading data from ${fileName}:`, error);
    // In case of parse error, try to write default value and return it
    try {
      writeData(fileName, defaultValue);
    } catch (writeError) {
      console.error(
        `Error writing default data to ${fileName} after read error:`,
        writeError
      );
    }
    return defaultValue;
  }
}

/**
 * Writes data to a JSON file synchronously.
 * @param {string} fileName - The name of the file (e.g., 'news.json').
 * @param {object} data - The data to write to the file.
 */
function writeData(fileName, data) {
  const filePath = path.join(dataDir, fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing data to ${fileName}:`, error);
  }
}

// Initialize data files if they don't exist
function initializeDataFiles() {
  const filesToInitialize = {
    'admins.json': { adminUserIds: [] },
    'timetable.json': { schedules: {}, generalInfo: '' }, // {schedules: {"monday": [{"time": "10:00", "subject": "Math"}]}}
    'news.json': { articles: [] }, // {articles: [{"id": "uuid", "title": "Title", "content": "...", "date": "ISO"}]}
    'menu.json': {
      daily_menu: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      },
      food_items: [], // [{"id": "uuid", "name": "Plov", "category": "Main", "description": "..."}]
      user_food_suggestions: [], // [{"id": "uuid", "name": "Manti", "price_suggestion": "20k", "userId": 123, "status": "pending"}]
      reviews: [], // [{"id": "uuid", "food_id": "uuid", "userId": 123, "rating": 5, "comment": "Great!"}]
    },
    'faqs.json': { faqs: [] }, // {faqs: [{"id": "uuid", "question": "Q?", "answer": "A."}]}
    'feedback.json': { feedbacks: [] }, // [{"id": "uuid", "userId": 123, "userName": "Test", "message": "Hi", "timestamp": "ISO", "status": "new", "adminReply": null}]
    'votes.json': { polls: [] }, // [{"id": "uuid", "question": "Q?", "options": [{"text": "A", "votes": 0, "voters": []}], "isActive": true}]
    'files.json': { files: [] }, // [{"id": "uuid", "file_id": "telegram_file_id", "description": "Math PDF", "fileName": "math.pdf", "uploadedBy": 123}]
  };

  for (const [fileName, defaultContent] of Object.entries(filesToInitialize)) {
    const filePath = path.join(dataDir, fileName);
    if (!fs.existsSync(filePath)) {
      writeData(fileName, defaultContent);
      console.log(`Initialized ${fileName}`);
    } else {
      // Optional: Check if existing file is valid JSON, if not, overwrite with default
      // This is a bit more robust but can lead to data loss if a file gets corrupted.
      // For now, we assume if it exists, it's mostly fine or will be handled by readData's error catch.
    }
  }
}

module.exports = {
  readData,
  writeData,
  initializeDataFiles,
};

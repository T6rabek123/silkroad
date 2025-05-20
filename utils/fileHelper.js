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
      // Add a check for empty file content to avoid JSON parse error on empty string
      if (fileContent.trim() === '') {
        writeData(fileName, defaultValue); // Write default if empty
        return defaultValue;
      }
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
    'timetable.json': {
      schedules: {},
      generalInfo: '',
      uploadedFile: {
        file_id: null,
        file_name: null,
        file_type: null,
        caption: null,
      }, // Added for file uploads
    },
    'news.json': { articles: [] },
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
      food_items: [],
      user_food_suggestions: [],
      reviews: [],
    },
    'faqs.json': { faqs: [] },
    'feedback.json': { feedbacks: [] },
    'votes.json': { polls: [] },
    'files.json': { files: [] }, // file entry: {id, file_id, file_name, file_type, description, uploadedBy, uploadDate}
  };

  for (const [fileName, defaultContent] of Object.entries(filesToInitialize)) {
    const filePath = path.join(dataDir, fileName);
    if (!fs.existsSync(filePath)) {
      writeData(fileName, defaultContent);
      console.log(`Initialized ${fileName}`);
    } else {
      // Optional: Check if existing file is valid JSON, if not, overwrite with default
      // This is a bit more robust but can lead to data loss if a file gets corrupted.
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        if (fileContent.trim() === '') {
          // If file exists but is empty
          console.log(
            `${fileName} exists but is empty. Initializing with default content.`
          );
          writeData(fileName, defaultContent);
        } else {
          JSON.parse(fileContent); // Try to parse to check validity
        }
      } catch (e) {
        console.warn(
          `${fileName} exists but is corrupted or not valid JSON. Overwriting with default content. Error: ${e.message}`
        );
        writeData(fileName, defaultContent);
      }
    }
  }
}

module.exports = {
  readData,
  writeData,
  initializeDataFiles,
};

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function readData(fileName, defaultValue = {}) {
  const filePath = path.join(dataDir, fileName);
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      if (fileContent.trim() === '') {
        writeData(fileName, defaultValue);
        return defaultValue;
      }
      return JSON.parse(fileContent);
    }
    writeData(fileName, defaultValue);
    return defaultValue;
  } catch (error) {
    console.error(`Error reading data from ${fileName}:`, error);
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

function writeData(fileName, data) {
  const filePath = path.join(dataDir, fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing data to ${fileName}:`, error);
  }
}

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
      },
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
    'files.json': { files: [] },
  };

  for (const [fileName, defaultContent] of Object.entries(filesToInitialize)) {
    const filePath = path.join(dataDir, fileName);
    if (!fs.existsSync(filePath)) {
      writeData(fileName, defaultContent);
      console.log(`Initialized ${fileName}`);
    } else {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        if (fileContent.trim() === '') {
          console.log(
            `${fileName} exists but is empty. Initializing with default content.`
          );
          writeData(fileName, defaultContent);
        } else {
          JSON.parse(fileContent);
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

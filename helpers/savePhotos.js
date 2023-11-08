// const fetch = require('node-fetch');
const fs = require("fs");
const axios = require("axios");
const botToken = "YOUR_BOT_TOKEN";
const savePath = "./downloads";

// Function to download and save a photo from Telegram
// Function to download and save a file from Telegram
async function downloadAndSaveFile(fileId) {
  try {
    const fileUrl = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getFile?file_id=${fileId}`;
    const response = await axios.get(fileUrl);
    const data = response.data;

    if (data.ok && data.result.file_path) {
      const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${data.result.file_path}`;
      const fileName = `${savePath}${fileId}_generic`;

      // Download the file and save it to your server
      const fileResponse = await axios({
        method: "get",
        url: fileUrl,
        responseType: "stream",
      });

      const fileExtension = path.extname(data.result.file_path);
      const fullFileName = `${fileName}${fileExtension}`;
      console.log("-----------");
      console.log(fileExtension);
      console.log(fullFileName);
      console.log("-----------");
      fileResponse.data.pipe(fs.createWriteStream(fullFileName));
      console.log(`Saved ${fullFileName}`);
    } else {
      console.error("Error downloading file");
    }
  } catch (error) {
    console.error(`Error downloading file: ${error.message}`);
  }
}

module.exports = downloadAndSaveFile;

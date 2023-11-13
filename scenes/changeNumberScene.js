const { Telegraf, Scenes, session, Markup } = require("telegraf");
const { enter, leave } = Scenes.Stage;
const pool = require("../db/pool");
const https = require("https");
const fs = require("fs");
const axios = require("axios");
const path = require("path");

const savePath = "../downloads/";
const userData = {};
const folderName = "img"; // Назва папки
const allPhoto = [];
const fullPath = path.join(__dirname, folderName); // Створення повного шляху

// console.log("Шлях до папки:", fullPath);
const rootPath = process.cwd();

const changeNumberScene = new Scenes.WizardScene(
  "changeNumberScene",
  async (ctx) => {
    const result = await pool.query(
      `select number from users_info where user_id = ${ctx.message.from.id}`
    );
   await ctx.reply(`Натисніть кнопку, щоб поділитися контактом:\n\nЦя інформація цілком таємна, та не буде передаватись третім особам.\n\nВаш номер телефону нам потрібен, для можливості зв'язатись з вами в разі проведення розіграшей або конкурсів. ` , Markup.inlineKeyboard([
        Markup.contactRequestButton('Поділитися контактом'),
      ]));
    if (ctx.message.text === "/myprofile") {
      return ctx.scene.leave();
    }
    return ctx.wizard.next();
  },
  async (ctx) => {
    const number = ctx.message.text
    const phoneRegex = /^\+\d{12}$/;
  
    const isValidPhoneNumber = (phoneNumber) => {
        return phoneRegex.test(phoneNumber);
      };
    if (isValidPhoneNumber(number)) {
        await ctx.reply('Номер успішно збережений')
    }
   
    if (ctx.message.text === "/start") {
      return ctx.scene.leave();
    }
if (result.rows > 0) {
    
    const updateQuery = "UPDATE users_info SET age = $1 WHERE user_id = $2";
    const values = [age, id]; // Adjust the values as needed

    // Execute the update query
    pool.query(updateQuery, values, (err, result) => {
      if (err) {
        console.error("Error executing query", err);
      } else {
        console.log("Update successful:", result.rowCount,result.rows[0], "rows updated");
      }
    });
    await ctx.reply(`Номер збережено ${number}`, {
      reply_markup: {
        keyboard: [
          [{ text: "🔸Змінити ім'я" }],
          [{ text: "🔸Змінити вік" }],
          [{ text: "🔸Змінити інфо про себе" }],
          [{ text: "🔸Змінити номер телефону" }],
          [{ text: "⬅️ Назад" }],
        ],
        resize_keyboard: true,
      },
    });
}else {
    await ctx.reply('Еееее....а номер ?)')
}
 
  


    return ctx.scene.leave();
  }
);

module.exports = changeNumberScene;

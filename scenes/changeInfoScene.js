const { Telegraf, Scenes, session } = require("telegraf");
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

const changeInfoScene = new Scenes.WizardScene(
  "changeInfoScene",
  async (ctx) => {
    const result = await pool.query(
      `select * from users_info where user_id = ${ctx.message.from.id}`
    );
    await ctx.reply(`Введіть основну інформацію своєї анкети:`,{reply_markup:{remove_keyboard:true}});
    if (ctx.message.text === "/start") {
      return ctx.scene.leave();
    }
    return ctx.wizard.next();
  },
  async (ctx) => {
    const info = ctx.message.text;
    const id = ctx.message.from.id
    if (ctx.message.text === "/start") {
      return ctx.scene.leave();
    }
    if (typeof info === "string") {
      userData.info = info;
      // Update query
      console.log(ctx.message);
      const updateQuery = "UPDATE users_info SET text = $1 WHERE user_id = $2";
      const values = [info, id]; // Adjust the values as needed

      // Execute the update query
      pool.query(updateQuery, values, (err, result) => {
        if (err) {
          console.error("Error executing query", err);
        } else {
          console.log("Update successful:", result.rowCount,result.rows[0], "rows updated");
        }
      });
      await ctx.reply(`Інфо змінено на ${info}`, {
        reply_markup: {
          keyboard: [
            [{ text: "🔸Змінити ім'я" }],
            [{ text: "🔸Змінити вік" }],
            [{ text: "🔸Змінити інфо про себе" }],
            [{ text: "⬅️ Назад" }],
          ],
          resize_keyboard: true,
        },
      });
    } else {
      await ctx.reply("Лише текстовий формат");
      return;
    }
    return ctx.scene.leave();
  }
);

module.exports = changeInfoScene;

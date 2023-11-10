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

const changeNameScene = new Scenes.WizardScene(
  "changeNameScene",
  async (ctx) => {
    const result = await pool.query(
      `select * from users_info where user_id = ${ctx.message.from.id}`
    );
    await ctx.reply(`Напишіть своє ім'я:`, {
      reply_markup: {
        keyboard: [[{ text: result.rows[0].name }]],
        resize_keyboard: true,
      },
    });
    if (ctx.message.text === "/start") {
      return ctx.scene.leave();
    }
    return ctx.wizard.next();
  },
  async (ctx) => {
    const name = ctx.message.text;
    const id = ctx.message.from.id
    if (ctx.message.text === "/start") {
      return ctx.scene.leave();
    }
    if (typeof name === "string") {
      userData.name = name;
      // Update query
      console.log(ctx.message);
      const updateQuery = "UPDATE users_info SET name = $1 WHERE user_id = $2";
      const values = [name, id]; // Adjust the values as needed

      // Execute the update query
      pool.query(updateQuery, values, (err, result) => {
        if (err) {
          console.error("Error executing query", err);
        } else {
          console.log("Update successful:", result.rowCount,result.rows[0], "rows updated");
        }
      });
      await ctx.reply(`Ім'я змінено на ${name}`, {
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

module.exports = changeNameScene;

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

const changeAgeScene = new Scenes.WizardScene(
  "changeAgeScene",
  async (ctx) => {
    const result = await pool.query(
      `select * from users_info where user_id = ${ctx.message.from.id}`
    );
    await ctx.reply(`Вкажіть ваш вік:`, {
      reply_markup: {
        keyboard: [[{ text: result.rows[0].age }]],
        resize_keyboard: true,
      },
    });
    if (ctx.message.text === "/start") {
      return ctx.scene.leave();
    }
    return ctx.wizard.next();
  },
  async (ctx) => {
    const age = parseInt(ctx.message.text);
    const id = ctx.message.from.id
    if (ctx.message.text === "/start") {
      return ctx.scene.leave();
    }



    if (isNaN(age)) {
      await ctx.reply("Тут лише цифри!)");
      return;
    }
    if (age < 16) {
      await ctx.reply("Реєстрація лише з 16 років!(((");
      return;
    }
    if (age > 50) {
      await ctx.reply("Реєстрація в боті лише до 60 років )");
      return;
    }
    if (typeof age !== 'number') {
      await ctx.reply("Лише цифри без тексту!");
      return;
    }
    if (typeof age === 'string') {
      await ctx.reply("Лише цифри без тексту!");
      return;
    }
userData.age = age

 
  
      // Update query
      console.log(ctx.message);
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
      await ctx.reply(`Вік змінено на ${age}`, {
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

    return ctx.scene.leave();
  }
);

module.exports = changeAgeScene;

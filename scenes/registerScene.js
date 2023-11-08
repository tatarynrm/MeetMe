const { Telegraf, Scenes, session } = require("telegraf");
const pool = require("../db/pool");
const https = require("https");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const downloadAndSaveFile = require("../helpers/savePhotos");
const savePath = "../downloads/";
const { enter, leave } = Scenes.Stage;
const userData = {};
const folderName = "img"; // Назва папки
const fullPath = path.join(__dirname, folderName); // Створення повного шляху

console.log("Шлях до папки:", fullPath);
const rootPath = process.cwd();

const registrationScene = new Scenes.WizardScene(
  "registrationScene",
  (ctx) => {
    console.log(fullPath);
    ctx.reply(`Напишіть своє ім'я:`, {
      reply_markup: { remove_keyboard: true },
    });
    return ctx.wizard.next();
  },
  (ctx) => {
    const name = ctx.message.text;
    userData.name = name;
    ctx.reply(`Чудово! Тепер вкажіть свій вік:`);
    return ctx.wizard.next();
  },

  async (ctx) => {
    const age = parseInt(ctx.message.text);
    if (isNaN(age)) {
      await ctx.reply("Тут лише цифри!)");
      return;
    }
    if (age < 16) {
      await ctx.reply("Реєстрація лише з 16 років!(((");
      return;
    }
    if (age > 50) {
      await ctx.reply("Реєстрація в боті лише до 49 років )");
      return;
    }
    userData.age = age;
    ctx.reply("Хто ви ?", {
      reply_markup: {
        keyboard: [[{ text: "Я хлопець" }, { text: "Я дівчина" }]],
        resize_keyboard: true,
      },
    });
    return ctx.wizard.next();
  },
  (ctx) => {
    const sex = ctx.message.text;
    if (sex === "Я хлопець") {
      userData.sex = "M";
    }
    if (sex === "Я дівчина") {
      userData.sex = "W";
    }
    ctx.reply(`Кого ви шукаєте?`, {
      reply_markup: {
        keyboard: [
          [{ text: "Хлопця" }, { text: "Дівчину" }, { text: "Без різниці" }],
        ],
        resize_keyboard: true,
      },
    });
    return ctx.wizard.next();
  },
  (ctx) => {
    const looking = ctx.message.text;
    if (looking === "Хлопця") {
      userData.looking = "M";
    }
    if (looking === "Дівчину") {
      userData.looking = "W";
    }
    if (looking === "Без різниці") {
      userData.looking = "ALL";
    }
    ctx.reply(`Опишіть себе!`, { reply_markup: { remove_keyboard: true } });
    return ctx.wizard.next();
  },
  (ctx) => {
    const bio = ctx.message.text;
    userData.bio = bio;
    ctx.reply(
      "Вандерфул! Ви також можете завантажити максимум 3 фото у свій профіль. Надішліть фото або натисніть кнопку Завершити реєстрацію 🤗, якщо хочете побути інкогніто 🥶...",
      {
        reply_markup: {
          keyboard: [[{ text: "Завершити реєстрацію 🤗" }]],
          resize_keyboard: true,
        },
      }
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.message.photo) {
      // Handle the uploaded photo (store or process it as needed)
      if (!userData.photos) {
        userData.photos = [];
      }

      if (userData.photos.length < 1) {
        const photo = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        const my = ctx.message.photo;
        console.log(my);
        //   userData.photos.push(photo);
        //  await ctx.reply(`Фото ${userData.photos.length} завантажено.`);
        const folderName = `${ctx.message.from.id}`; // Назва папки, яку потрібно створити
        const folderPath = path.join(rootPath, "img", folderName); // Шлях до папки
        if (!fs.existsSync(folderPath)) {
          // Якщо папки немає, створити її
          fs.mkdirSync(folderPath);
          console.log(`Папку '${folderName}' створено.`);
        } else {
          console.log(`Папка '${folderName}' вже існує.`);
        }
        let imageId = ctx.message.photo.pop().file_id;

        ctx.telegram.getFileLink(imageId).then((link) => {
          https.get(link, (response) => {
            console.log("IDXXXXXXXXXXXX", imageId);
            const filePath = path.join(
              folderPath,
              `${ctx.message.from.id}.jpeg`
            );
            console.log("FILEPATH!!!!!!!!!!!", filePath);
            const fileStream = fs.createWriteStream(filePath);
            response.pipe(fileStream);
          });
        });

        await ctx.reply("Супер!");
        console.log(userData);
      } else {
        ctx.reply("Ви перевищили ліміт фото (1).");
      }
    } else if (ctx.message.text === "Завершити реєстрацію 🤗") {
      // You can save the registration data and photos to your database or storage here.
      // For demonstration purposes, we're just showing the collected data.
      const registrationData = {
        name: userData.name,
        age: userData.age,
        sex: userData.sex,
        looking: userData.looking,
        bio: userData.bio,
        photos: userData.photos || [],
        id: ctx.message.from.id,
      };
      const existUserInfo = await pool.query(
        `select * from users_info where user_id = ${registrationData.id}`
      );
      console.log("EXISTING USERS_INFO", existUserInfo);
      if (existUserInfo.rows <= 0) {
        const res1 =
          await pool.query(`insert into users_info (name,age,text,user_id)
  values('${registrationData.name}',${registrationData.age},'${registrationData.bio}',${registrationData.id})
  `);
        console.log(res1);
      } else {
        const updateQuery =
          "UPDATE users_info SET name = $1, age = $2, text = $3 WHERE user_id = $4";

        const res = pool.query(
          updateQuery,
          [
            registrationData.name,
            registrationData.age,
            registrationData.bio,
            registrationData.id,
          ],
          (err, result) => {
            if (err) {
              console.error("Error executing the query", err);
            } else {
              console.log("Data updated successfully");
            }
          }
        );
        console.log("-eqw-eqwjkeqwkjeqwk", res);
      }

      // Perform database or storage operations here
      console.log("Registration Data:", registrationData);
      const existPhoto = await pool.query(
        `select * from users_photos where user_id = ${ctx.message.from.id}`
      );
      console.log(existPhoto.rows);
      if (existPhoto.rows <= 0) {
        await pool.query(
          `insert into users_photos (user_id,photo_url) values(${
            ctx.message.from.id
          },'${`https://api.noris.tech/img/${ctx.message.from.id}/${ctx.message.from.id}.jpeg`}') `
        );
      }
      // Clear user data
      delete userData;

      ctx.reply(
        "Дякуємо за реєстрацію.Тепер ви можете перейти до пошуку анкет.",
        {
          reply_markup: {
            keyboard: [
              [
                { text: "Мій аккаунт" },
                { text: "Дивитись анкети" },
                { text: "Заповнити анкету знову" },
              ],
            ],
            resize_keyboard: true,
          },
        }
      );
      ctx.scene.leave();
    } else {
      ctx.reply(
        // "You can send up to three photos or type /done when you are ready to complete the registration."
        "Ви можете надіслати максимум 1 фото (не відео і не гіф) або натиснути кнопку Завершити реєстрацію"
      );
    }
  }
);

module.exports = registrationScene;

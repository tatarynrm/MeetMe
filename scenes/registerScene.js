const { Telegraf, Scenes, session } = require("telegraf");
const { enter, leave } = Scenes.Stage;
const userData = {};
const registrationScene = new Scenes.WizardScene(
  "registrationScene",
  (ctx) => {
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
  (ctx) => {
    const age = ctx.message.text;
    userData.age = age;
    ctx.reply("А зараз,розкажіть трішки про себе:");
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
  (ctx) => {
    if (ctx.message.photo) {
      // Handle the uploaded photo (store or process it as needed)
      if (!userData.photos) {
        userData.photos = [];
      }

      if (userData.photos.length < 3) {
        const photo = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        userData.photos.push(photo);
        ctx.reply(`Фото ${userData.photos.length} завантажено.`);
        console.log(ctx.message.photo);
      } else {
        ctx.reply("Ви перевищили ліміт фото (3).");
      }
    } else if (ctx.message.text === "Завершити реєстрацію 🤗") {
      // You can save the registration data and photos to your database or storage here.
      // For demonstration purposes, we're just showing the collected data.
      const registrationData = {
        name: userData.name,
        age: userData.age,
        bio: userData.bio,
        photos: userData.photos || [],
      };
      console.log(registrationData);
      // Perform database or storage operations here
      console.log("Registration Data:", registrationData);

      // Clear user data
      delete userData;

      ctx.reply(
        "Дякуємо за реєстрацію.Тепер ви можете перейти до пошуку анкет.",
        {
          reply_markup: {
            keyboard: [
              [{ text: "Мій аккаунт" },{text:"Дивитись анкети"},{text:"Заповнити анкету знову"}]
            ],
            resize_keyboard: true,
          },
        }
      );
      ctx.scene.leave();
    } else {
      ctx.reply(
        // "You can send up to three photos or type /done when you are ready to complete the registration."
        "Ви можете надіслати максимум 3 фото або натиснути кнопку Завершити реєстрацію"
      );
    }
  }
);

module.exports = registrationScene;

require("dotenv").config();
const { Telegraf, Scenes, session, Markup } = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN, { handlerTimeout: 9_000_000 });
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const app = express();
const liqpayRouter = require("./routes/liqpay/liqpay");
const port = 5005;
const cron = require("node-cron");
const path = require("path");
var LiqPay = require("./my_modules/liqpay/liqpay");
const { v4: uuidv4 } = require("uuid");
const pool = require("./db/pool");
const geolib = require("geolib");
const iconv = require("iconv-lite");
const { createUser } = require("./controllers/users");
const moment = require("moment");
require("moment/locale/uk");
const registrationScene = require("./scenes/registerScene");
const likesScene = require("./scenes/likesScene");
const { default: axios } = require("axios");
const changeNameScene = require("./scenes/changeNameScene");
const changeAgeScene = require("./scenes/changeAgeScene");
const changeInfoScene = require("./scenes/changeInfoScene");
const reverseGeocode = require("./helpers/reverseGeocode");
const { botLikesValue } = require("./bot_functions/bot_likes");
const getDistanceString = require("./helpers/getKilomiters");
const updateLikes = require("./helpers/updateLikesCountEveryDay");
const updateLikesForEveryUser = require("./helpers/updateLikesCountEveryDay");
const buildTree = require("./helpers/referalsTree/referals");
const changeNumberScene = require("./scenes/changeNumberScene");
const public_key = "sandbox_i31110430124";
const private_key = "sandbox_HJjraXMdCLnz3ApcEJOYCjmSgRjhsjtuvFSVmVci";
var liqpay = new LiqPay(public_key, private_key);

// stage.register(registrationScene);
app.use(bodyParser.json({ limit: "60mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "60mb", extended: true }));
app.use(express.json());
app.use("/img", express.static("img"));
app.use("/downloads", express.static("downloads"));
app.use(
  cors({
    origin: "*",
    methods: ["POST", "GET"],
  })
);
app.use("/liqpay", liqpayRouter);

const stage = new Scenes.Stage([
  registrationScene,
  likesScene,
  changeNameScene,
  changeAgeScene,
  changeInfoScene,
  changeNumberScene
]);

bot.use(session());
bot.use(stage.middleware());
bot.use((ctx, next) => {
  ctx.session.myIndex = 0;
  return next();
});
global.currentProfileIndex = 0;
const getInvoice = async (amount, username, customer) => {
  try {
    const invoice = await liqpay.api(
      "request",
      {
        action: "invoice_send",
        version: "3",
        email: "tatarynrm@gmail.com",
        amount: amount,
        currency: "UAH",
        order_id: uuidv4(),
        description: `Поповнення балансу бота Чистокровнй українець ${
          username ? username : "."
        }`,
        server_url: "https://api.noris.tech/liqpay/callback",
        customer: customer,
        info: "Оплата преміум підписки Telegram Bot",
      },
      function (json) {
        console.log(json.result);
      }
    );
    return invoice;
  } catch (error) {
    console.log(error);
  }
};
let users = {};

bot.start(async (ctx) => {
  const user = ctx.message.from;
  try {
    await createUser(user);

    const userInfo = await pool.query(
      `select * from users_info where user_id = ${ctx.message.from.id}`
    );

    if (userInfo?.rows <= 0) {
      await ctx.replyWithHTML(`Вітаю!`, {
        reply_markup: {
          keyboard: [
            [{ text: "Створити анкету 📒" }],
            [{ text: "🌐 Відкрити сайт",web_app: { url: "https://enjoyhub.space" }  }],
          ],
          resize_keyboard: true,
        },
      });
    } else {
      await ctx.replyWithHTML(`Вітаю !`, {
        reply_markup: {
          keyboard: [
            [{ text: "👤 Мій профіль" }, { text: "👀 Дивитись анкети" }],
            [
              { text: "💰 Реферальне посилання" },
              { text: "🔄 Заповнити анкету знову" },
            ],
            [{ text: "🐣 Зв'язок з розробником" }],
            [{ text: "🌐 Відкрити сайт",web_app: { url: "https://enjoyhub.space" }  }],
          ],
          resize_keyboard: true,
        },
      });
    }
    const userId = ctx.from.id;
    const referrerId = ctx.message.text.split(" ")[1];

    if (referrerId) {
      users[userId] = { referrer: referrerId };
      const existReferalUsers = await pool.query(
        `select * from referrals where referrer_id = ${userId} and referee_id =${referrerId}`
      );

      if (existReferalUsers.rows > 0) {
        console.log("exist");
        return;
      }
      if (existReferalUsers.rows <= 0) {
        const res =
          await pool.query(`insert into referrals (referrer_id,referee_id) 
    values(${userId},${referrerId})
   `);
        await ctx.reply(
          `Вас запросив користувач ${referrerId}\n\nВам надано 2 додаткових ❤️\nКористуйтесь!`
        );
        await bot.telegram.sendMessage(
          referrerId,
          `Користувач ${userId} щойно вам надав 3 безкоштовних ❤️\nКористуйтесь!)`
        );

        const addLikesToSubscriber = await pool.query(`
  UPDATE users
  SET likes_per_day = likes_per_day + 2
  WHERE tg_id = ${userId}`);
        // ctx.sendMessage(referrerId,`Користувач ${userId} щойно вам надав 2 безкоштовних лайки.Користуйтесь!)`)

        const addLikesToReferer = await pool.query(`
      UPDATE users
      SET likes_per_day = likes_per_day + 3
      WHERE tg_id = ${referrerId}`);
      }
      users = {};
    } else {
      users[userId] = { referrer: null };
      users = {};
    }
  } catch (error) {
    console.log(error);
    // await ctx.reply('Щось пішло не так.\n\nНатисніть на /start')
  }
});

bot.hears("Преміум 1 тиждень", async (ctx) => {
  const res = await getInvoice(
    75,
    ctx.message.from.username,
    ctx.message.from.id
  );

  ctx.reply("Для оплати тарифного плану, натисніть на кнопку нижче", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Преміум аккаунт на 1 тиждень", url: res.href }],
      ],
      resize_keyboard: true,
    },
  });
});

// bot.hears("distance", (ctx) => {
//   // Координати першої точки (наприклад, Київ)
//   const pointA = { latitude: 50.4501, longitude: 30.5234 };

//   // Координати другої точки (наприклад, Львів)
//   const pointB = { latitude: 49.8383, longitude: 24.0232 };

//   // Обчислити відстань між точками в метрах
//   const distance = geolib.getDistance(pointA, pointB);
//   ctx.reply(
//     `Відстань між точкою A і точкою B: ${geolib
//       .convertDistance(distance, "km")
//       .toFixed(1)}км`
//   );
// });
let profiles = [];
let currentProfileIndex = 0;
let like = { user: null };

bot.hears("👀 Дивитись анкети", async (ctx) => {
  const likesPerDay = await pool.query(
    `select likes_per_day as likes from users where tg_id = ${ctx.message.from.id}`
  );
  const myParams = await pool.query(
    `select * from users_info where user_id = ${ctx.message.from.id}`
  );
if (likesPerDay || myParams.rows[0]?.looking ) {
  let profiles1 = [];
  const paramsSex = myParams?.rows[0]?.looking;
  const myLikes = likesPerDay?.rows[0]?.likes;
  if (myLikes > 0) {
    if (paramsSex === "M") {
      profiles1 = await pool.query(`
    SELECT a.*, b.photo_url, b.type, c.*
    FROM users_info AS a
    LEFT JOIN users_photos AS b ON a.user_id = b.user_id 
    LEFT JOIN users_location AS c ON a.user_id = c.user_id
    WHERE a.user_id != ${ctx.message.from.id} AND a.sex = 'M'
  `);
    } else if (paramsSex === "W") {
      profiles1 = await pool.query(`
    SELECT a.*, b.photo_url, b.type, c.*
    FROM users_info AS a
    LEFT JOIN users_photos AS b ON a.user_id = b.user_id 
    LEFT JOIN users_location AS c ON a.user_id = c.user_id
    WHERE a.user_id != ${ctx.message.from.id} AND a.sex = 'W'
  `);
    } else {
      profiles1 = await pool.query(`
    SELECT a.*, b.photo_url, b.type, c.*
    FROM users_info AS a
    LEFT JOIN users_photos AS b ON a.user_id = b.user_id 
    LEFT JOIN users_location AS c ON a.user_id = c.user_id
    WHERE a.user_id != ${ctx.message.from.id}
  `);
    }
    const usersProfile = profiles1.rows;
    if (usersProfile.length > 0) {
      profiles.push(...usersProfile);
      if (currentProfileIndex < profiles.length) {
        sendProfile(ctx);
      }
    } else {
      await ctx.reply("Анкет не знайдено.Змініть фільтри пошуку");
    }
  } else {
    ctx.reply("На сьогодні усі лайки завершились.");
  }
}else {
  await ctx.reply('Натисність /start')
}
});
async function sendProfile(ctx) {
  const myLocation = await pool.query(
    `select lat,long from users_location where user_id =${ctx.message.from.id}`
  );
  if (myLocation === undefined || myLocation === null || myLocation.rows.length <= 0) {
    await ctx.reply('Щось пішло не так.\n\nНатисніть на /start')
  }else {
    const myLoc = myLocation.rows[0];
    const currentProfile = profiles[currentProfileIndex];
    const keyboard = Markup.inlineKeyboard([
      Markup.button.callback("Option 1", "option1"),
      Markup.button.callback("Option 2", "option2"),
    ]);
  
    const myPoint = { latitude: myLoc.lat, longitude: myLoc.long };
    const userPoint = {
      latitude: currentProfile.lat,
      longitude: currentProfile.long,
    };
    let message = "";
    if (
      myPoint !== null ||
      userPoint !== null ||
      myPoint !== undefined ||
      userPoint !== undefined
    ) {
      message = `${currentProfile.sex === "M" ? "👦" : "👧"} ${
        currentProfile?.name ? currentProfile?.name : null
      }\n\n🕤 ${currentProfile.age ? currentProfile.age : null}р. 📍- ${
        getDistanceString(myPoint, userPoint)
          ? getDistanceString(myPoint, userPoint)
          : " "
      } \n\n📔 ${currentProfile?.text ? currentProfile?.text : null}`;
    } else if (
      myPoint === null ||
      userPoint === null ||
      myPoint === undefined ||
      userPoint === undefined
    ) {
      message = `${currentProfile.sex === "M" ? "👦" : "👧"} ${
        currentProfile?.name ? currentProfile?.name : null
      }\n\n🕤 ${currentProfile.age ? currentProfile.age : null}р. \n\n📔 ${
        currentProfile?.text ? currentProfile?.text : null
      }`;
    }
  
    if (currentProfile.type === "photo") {
      await ctx.replyWithPhoto(
        {
          url: currentProfile.photo_url,
        },
        {
          caption: message,
          reply_markup: {
            keyboard: [[{ text: "❤️" }, { text: "👎" }, { text: "✔️" }]],
            resize_keyboard: true,
          },
        }
      );
    } else {
      await ctx.replyWithVideo(
        {
          url: currentProfile.photo_url,
        },
        {
          caption: message,
          reply_markup: {
            keyboard: [[{ text: "❤️" }, { text: "👎" }, { text: "✔️" }]],
            resize_keyboard: true,
          },
        }
      );
    }
    // Інкрементуємо currentProfileIndex для відправки наступної анкети
    currentProfileIndex++;
  }
 

}

bot.hears("❤️", async (ctx) => {
  const likesCount = await pool.query(
    `select likes_per_day from users where tg_id = ${ctx.message.from.id}`
  );
  console.log(likesCount.rows[0]);
  const prevUser = profiles[currentProfileIndex - 1];
  // Оновіть інформацію в базі даних для поточної анкети як лайк
  const currentProfile = profiles[currentProfileIndex - 1];

  if (!prevUser?.user_id || prevUser.user_id === null) {
    return await ctx.reply("Немає такого варіанту відповіді.");
  } else {
    const res = await pool.query(`
    INSERT INTO users_likes (user_id1, user_id2, like_1, like_2, created_at)
    VALUES (${ctx.message.from.id}, ${prevUser.user_id}, 1, 0, NOW());
     `);
    ctx.telegram.sendMessage(
      prevUser.user_id,
      `Схоже вами хтось зацікавився 😎\n\n\nПодивіться хто вас лайкнув в меню:\n\n👤 Мій профіль -> 💌 Мої вподобайки`
    );
  }

  const updateLikesQuery = `
UPDATE users
SET likes_per_day = likes_per_day - 1
WHERE tg_id = ${ctx.message.from.id}`;
  const result = await pool.query(updateLikesQuery);

  //   Відправка наступної анкети
  if (
    currentProfileIndex < profiles.length &&
    likesCount.rows[0].likes_per_day > 0
  ) {
    sendProfile(ctx, (like = 1));
  } else if (likesCount.rows[0].likes_per_day === 0) {
    ctx.reply("Лайки на сьогодні закінчились", {
      reply_markup: {
        keyboard: [
          [{ text: "👤 Мій профіль" }, { text: "👀 Дивитись анкети" }],
          [
            { text: "💰 Реферальне посилання" },
            { text: "🔄 Заповнити анкету знову" },
          ],
          [{ text: "🐣 Зв'язок з розробником" }],
          [{ text: "🌐 Відкрити сайт",web_app: { url: "https://enjoyhub.space" }  }],
        ],
        resize_keyboard: true,
      },
    });
  } else {
    ctx.reply("Більше немає анкет для перегляду", {
      reply_markup: {
        keyboard: [
          [{ text: "👤 Мій профіль" }, { text: "👀 Дивитись анкети" }],
          [
            { text: "💰 Реферальне посилання" },
            { text: "🔄 Заповнити анкету знову" },
          ],
          [{ text: "🐣 Зв'язок з розробником" }],
          [{ text: "🌐 Відкрити сайт",web_app: { url: "https://enjoyhub.space" }  }],
        ],
        resize_keyboard: true,
      },
    });
  }
});

// bot.hears('Моя анкета')
bot.hears("👎", async (ctx) => {
  // Оновіть інформацію в базі даних для поточної анкети як дизлайк
  const currentProfile = profiles[currentProfileIndex - 1];
  // await ctx.reply(`You disliked ${currentProfile.name}'s profile.`);

  // Відправка наступної анкети
  if (currentProfileIndex < profiles.length) {
    sendProfile(ctx, (like = 0));
  } else {
    ctx.reply("Більше немає анкет для перегляду", {
      reply_markup: {
        keyboard: [
          [{ text: "👤 Мій профіль" }, { text: "👀 Дивитись анкети" }],
          [
            { text: "💰 Реферальне посилання" },
            { text: "🔄 Заповнити анкету знову" },
          ],
          [{ text: "🐣 Зв'язок з розробником" }],
          [{ text: "🌐 Відкрити сайт",web_app: { url: "https://enjoyhub.space" }  }],
        ],
        resize_keyboard: true,
      },
    });
  }
});

bot.hears("💰 Реферальне посилання", async (ctx) => {
  const photoPath = path.join(__dirname, "static_files", "referal.jpg");
  await ctx.replyWithPhoto(
    { source: photoPath },
    {
      caption: `\n<b>Ваше унікальне реферальне посилання:</b>\n\n<i>(Натисніть щоб скопіювати)</i>\n<code>https://t.me/EnjoyHubBot?start=${ctx.message.from.id}</code>\n\n
      💰 Реферальна Програма

Покликайте своїх друзів та отримайте винагороду за кожного нового учасника, які приєднається до нашої спільноти!

🌐 Запрошуйте Друзів: Поділіться своїм унікальним реферальним посиланням з друзями через Телеграм.

🎁 Отримуйте Винагороду: За кожного друга, який приєднується за вашим посиланням, ви отримуєте особливий бонус.

🚀 Збільшуйте Статус: Завдяки реферальним бонусам, ви розблокуєте високий рівень статусу та ексклюзивні переваги.

📈 Відстежуйте Статистику: Спостерігайте за кількістю запрошених друзів та ваших досягнень у панелі статистики.

💡 Ексклюзивні Бонуси: За досягнення певних мильників, отримуйте додаткові бонуси та подарунки.
      \n\n`,
      parse_mode: "HTML",
    }
    // `Ваше реферальне посилання:\nhttps://t.me/noris_chat_bot?start=${ctx.message.from.id}`
  );
});

bot.command("myprofile", async (ctx) => {
  const myAcc = await pool.query(`
  SELECT a.*, b.photo_url,b.type
  FROM users_info AS a
  LEFT JOIN users_photos AS b ON a.user_id = b.user_id
  WHERE a.user_id = ${ctx.message.from.id};
  `);
  const me = myAcc.rows[0];

if (me.photo_url & me.sex) {
  await ctx.reply(
    `Ти ${me?.sex === "M" ? "приєднався" : "приєдналась"} до нас\n📅${moment(
      me?.created_at
    ).format("LLL")} год.`
  );
  if (me === undefined || me === null || me.type === null) {
    await ctx.reply('Щось пішло не так.\n\nНатисніть на /start')
  } else {
    const message = `👤Ім'я: ${me?.name ? me?.name : "..."}\n\n🕐Вік: ${
      me?.age ? me?.age : 50
    }\n\n💁Інфа: ${me?.text ? me?.text : "Немає інфи"}`;
    if (me?.type === "photo") {
      await ctx.replyWithPhoto(
        {
          url: me.photo_url,
        },
        {
          caption: message,
          reply_markup: {
            keyboard: [
              [{ text: "⚙ Налаштування" }],
              [{ text: "🌟 Premium" }, { text: "💌 Мої вподобайки" }],
              [{ text: "👨‍👩‍👧‍👦 Мої реферали" }, { text: "Залишок ❤️" }],
              [{ text: "⬅️ Назад" }],
            ],
            resize_keyboard: true,
          },
        }
      );
    } else {
      await ctx.replyWithVideo(
        {
          url: me?.photo_url,
        },
        {
          caption: message,
          reply_markup: {
            keyboard: [
              [{ text: "⚙ Налаштування" }],
              [{ text: "🌟 Premium" }, { text: "💌 Мої вподобайки" }],
              [{ text: "👨‍👩‍👧‍👦 Мої реферали" }, { text: "Залишок ❤️" }],
              [{ text: "⬅️ Назад" }],
            ],
            resize_keyboard: true,
          },
        }
      );
    }
  }
}else {
  await ctx.reply('Щось пішло не так.\n\nНатисніть на /start')
}
});

bot.hears("⬅️ Назад", async (ctx) => {
  await ctx.reply("👤 Мій профіль", {
    reply_markup: {
      keyboard: [
        [{ text: "👤 Мій профіль" }, { text: "👀 Дивитись анкети" }],
        [
          { text: "💰 Реферальне посилання" },
          { text: "🔄 Заповнити анкету знову" },
        ],
        [{ text: "🐣 Зв'язок з розробником" }],
        [{ text: "🌐 Відкрити сайт",web_app: { url: "https://enjoyhub.space" }  }],
      ],
      resize_keyboard: true,
    },
  });
});
// bot.hears("👨‍👩‍👧‍👦 Мої реферали", async (ctx) => {
//   const message = `👥 Мої Реферали - У Розробці

//   Ми вже працюємо над впровадженням функціоналу "Мої Реферали", який дозволить вам бачити та керувати своїм реферальним командуванням. З цим інноваційним інструментом ви зможете:

//   📊 Відстежувати Динаміку: Переглядайте статистику та ефективність вашої реферальної команди.

//   🌐 Розширюйте Мережу: Запрошуйте нових користувачів та отримуйте бонуси за кожного нового учасника.

//   🎉 Спеціальні Переваги: Отримуйте ексклюзивні привілеї та бонуси за досягнення певних мильників.

//   Залишайтеся з нами, і найближчим часом ви зможете насолоджуватися усіма перевагами "Моїх Рефералів"! 👥✨`;
//   await ctx.reply(message, {
//     reply_markup: {
//       keyboard: [[{ text: "⬅️ Назад" }]],
//       resize_keyboard: true,
//     },
//   });
// });
bot.hears("⚙ Налаштування", async (ctx) => {
  await ctx.reply("⚙ Налаштування", {
    reply_markup: {
      keyboard: [
        [{ text: "🔸Змінити ім'я" }, { text: "🔸Змінити вік" }],
        [{ text: "🔸Змінити інфо про себе" }],
        [{ text: "⬅️ Назад" }],
      ],
      resize_keyboard: true,
    },
  });
});

bot.hears("🌟 Premium", async (ctx) => {
  const message = `
  🌟 Premium Access

Отримайте доступ до ексклюзивних можливостей та переваг з нашим преміум планом! Наші передплатники отримують:

🚀 Ранній Доступ: Будьте серед перших, хто випробовує нові функції та оновлення.

🎨 Ексклюзивні Теми: Оформлення та дизайн, доступні лише для підписників преміум-плану.

🤖 Покращені Команди Бота: Нові та потужні команди для зручного використання наших ботів.

📚 Ексклюзивні Віджети: Додайте стиль до свого додатку за допомогою унікальних віджетів для преміум-користувачів.

💬 Пріоритетна Підтримка: Швидка та ефективна підтримка від нашої команди для вас.

Обирайте наш преміум план та розблоковуйте найкращі можливості! 🌟
  `;
  await ctx.reply(message, {
    reply_markup: {
      keyboard: [[{ text: "Купити 🌟 Premium " }], [{ text: "⬅️ Назад" }]],
      resize_keyboard: true,
    },
  });
});

bot.hears("👤 Мій профіль", async (ctx) => {
  const myAcc = await pool.query(`
  SELECT a.*, b.photo_url,b.type
  FROM users_info AS a
  LEFT JOIN users_photos AS b ON a.user_id = b.user_id
  WHERE a.user_id = ${ctx.message.from.id};
  `);

  const me = myAcc.rows[0];

  if (me.sex & me.photo_url) {
    const message = `👤Ім'я: ${me?.name}\n\n🕐Вік: ${me?.age}\n\n💁Інфа: ${me?.text}`;
    if (me?.type === "photo") {
      await ctx.replyWithPhoto(
        {
          url: me?.photo_url,
        },
        {
          caption: message,
          reply_markup: {
            keyboard: [
              [{ text: "⚙ Налаштування" }],
              [{ text: "🌟 Premium" }, { text: "💌 Мої вподобайки" }],
              [{ text: "👨‍👩‍👧‍👦 Мої реферали" }, { text: "Залишок ❤️" }],
              [{ text: "⬅️ Назад" }],
            ],
            resize_keyboard: true,
          },
        }
      );
    } else {
      await ctx.replyWithVideo(
        {
          url: me?.photo_url,
        },
        {
          caption: message,
          reply_markup: {
            keyboard: [
              [{ text: "⚙ Налаштування" }],
              [{ text: "🌟 Premium" }, { text: "💌 Мої вподобайки" }],
              [{ text: "👨‍👩‍👧‍👦 Мої реферали" }, { text: "Залишок ❤️" }],
              [{ text: "Веб" }],
              [{ text: "⬅️ Назад" }],
            ],
            resize_keyboard: true,
          },
        }
      );
    }
  }else {
     await ctx.reply('Щось пішло не так.\n\nНатисніть на /start')
  }
 
});
bot.hears(`🐣 Зв'язок з розробником`, async (ctx) => {
  ctx.reply("@web_developer_Ukraine");
});
bot.hears(`✔️`, async (ctx) => {
  ctx.reply("Ви в головному меню", {
    reply_markup: {
      keyboard: [
        [{ text: "👤 Мій профіль" }, { text: "👀 Дивитись анкети" }],
        [
          { text: "💰 Реферальне посилання" },
          { text: "🔄 Заповнити анкету знову" },
        ],
        [{ text: "🐣 Зв'язок з розробником" }],
        [{ text: "🌐 Відкрити сайт",web_app: { url: "https://enjoyhub.space" }  }],
      ],
      resize_keyboard: true,
    },
  });
});
// bot.hears(`🌐 Відкрити сайт`, async (ctx) => {
//   ctx.reply("Наш веб сайт", {
//     reply_markup: {
//       keyboard: [
//         [{ text: "SITE", web_app: { url: "https://enjoyhub.space" } }],
//         [{ text: "✔️" }],
//       ],
//       resize_keyboard: true,
//     },
//   });
// });
bot.hears(`Купити 🌟 Premium`, async (ctx) => {
  ctx.reply(
    "Натисніть для перегляду тарифних планів",
    Markup.inlineKeyboard([
      Markup.button.callback("Переглянути тарифи", "premium_tarifs"),
    ])
  );
});
bot.hears(`🤖 Зв'язок з розробником`, (ctx) => {
  ctx.reply(
    "Напишіть свої побажання, щодо покращення , чи розширення функціоналу 🖐️ ",
    Markup.inlineKeyboard([
      Markup.button.callback("Написати розробнику", "all right"),
    ])
  );
});

// bot.action("more functions", (ctx) => {
//   ctx.editMessageText("Розробник --- @web_developer_Ukraine");
// });
bot.action("premium_tarifs", async (ctx) => {
  // ctx.editMessageText("🤖 Розробник: @web_developer_Ukraine");
  await ctx.editMessageText(
    `Доступні тарифні плани:
1.Тариф Light - 50 грн\n2.Тариф Medium - 250 грн\n3.Тариф Йобтвою мать - 400 грн\n4.Тариф "Ну його на...уй" - 700 грн
`,
    Markup.inlineKeyboard([
      Markup.button.callback("1", "first_tarif"),
      Markup.button.callback("2", "second_tarif"),
      Markup.button.callback(`3`, "third_taif"),
      Markup.button.callback(`4`, "omg_tarif"),
    ]).resize()
  );
});
bot.action("first_tarif", async (ctx) => {
  await ctx.reply("eqwlewqllewq", {
    reply_markup: {
      keyboard: [
        [{ text: "Оплатити Тариф Light" }],
        [{ text: "👤 Мій профіль" }],
      ],
      resize_keyboard: true,
    },
  });
});
bot.action("second_tarif", async (ctx) => {
  await ctx.reply("eqwlewqllewq", {
    reply_markup: {
      keyboard: [
        [{ text: "Оплатити Тариф Medium" }],
        [{ text: "👤 Мій профіль" }],
      ],
      resize_keyboard: true,
    },
  });
});
bot.action("third_taif", async (ctx) => {
  await ctx.reply("eqwlewqllewq", {
    reply_markup: {
      keyboard: [
        [{ text: "Оплатити Тариф Йобтвою мать" }],
        [{ text: "👤 Мій профіль" }],
      ],
      resize_keyboard: true,
    },
  });
});
bot.action("omg_tarif", async (ctx) => {
  await ctx.reply("eqwlewqllewq", {
    reply_markup: {
      keyboard: [
        [{ text: `Оплатити Тариф "Ну його на...уй"` }],
        [{ text: "👤 Мій профіль" }],
      ],
      resize_keyboard: true,
    },
  });
});

//

// const sendMessageToUsers = async ()=>{
//   try {
//     const result = await pool.query(`select * from users`);
//     for (let i = 0; i < result.rows.length; i++) {
//     const el = result.rows[i];
//     console.log(el.tg_id);
//     bot.telegram.sendMessage(el.tg_id,'Ми перїхали: @EnjoyHubBot')
//     // ctx.sendMessage('Додав нову фічуууууу.Сайт який відкривається прям в БОТІ....Гиии )',{chat_id:el.tg_id})
//   }
//   } catch (error) {
//     console.log(error);
//   }
// }
// sendMessageToUsers()

// SCENES ENTER

bot.hears("🔄 Заповнити анкету знову", async (ctx) => {
  ctx.scene.enter("registrationScene");
});
bot.hears("Створити анкету 📒", async (ctx) => {
  ctx.scene.enter("registrationScene");
});
bot.hears("🔸Змінити ім'я", async (ctx) => {
  ctx.scene.enter("changeNameScene");
});
bot.hears("🔸Змінити вік", async (ctx) => {
  ctx.scene.enter("changeAgeScene");
});
bot.hears("🔸Змінити інфо про себе", async (ctx) => {
  ctx.scene.enter("changeInfoScene");
});

bot.hears("Локація", (ctx) => {
  const chatId = ctx.chat.id;

  // Creating a button that requests geolocation
  const requestLocationButton = Markup.button.locationRequest(
    "Надіслати свою локацію 📍"
  );

  // Creating a keyboard with the location button
  const keyboard = Markup.keyboard([requestLocationButton]).resize();

  // Sending a message with the keyboard
  ctx.reply(
    "Натисніть на кнопку Надіслати свою локацію 📍,щоб ми могли підібрати анкети, які знаходяться якомога ближче до Вас",
    keyboard
  );
});
// https://maps.googleapis.com/maps/api/place/details/json?language=uk&key=AIzaSyCL4bmZk4wwWYECFCW2wqt7X-yjU9iPG2o&place_id=${zavInfo.value.place_id}
// Handling location updates
bot.on("location", async (ctx) => {
  const lattitude = ctx.message.location.latitude;
  const longitude = ctx.message.location.longitude;

  // Handle the received location
  const address = await reverseGeocode(lattitude, longitude);
  const userLocation = address.address_components;
  const cityFind = userLocation.filter((item) => {
    return item.types.includes("locality") & item.types.includes("political");
  });
  const streetFind = userLocation.filter((item) => {
    return item.types.includes("route");
  });
  const streetNumberFind = userLocation.filter((item) => {
    return item.types.includes("street_number");
  });
  const city = cityFind[0].long_name;
  const street = streetFind[0].long_name;
  const streetNumber = streetNumberFind[0].long_name;
  const lat = address.geometry.location.lat;
  const long = address.geometry.location.lng;

  console.log(city, street.substring(7), streetNumber);

  const userLoc = await pool.query(
    `select * from users_info where user_id =${ctx.message.from.id}`
  );

  console.log("addressss", address);
  if (userLoc.rows <= 0) {
    const insertQuery =
      "INSERT INTO users_info (city, street, street_number, lat, long) VALUES ($1, $2, $3, $4, $5)";
    const values = [
      city,
      street,
      streetNumber,
      parseFloat(lat),
      parseFloat(long),
    ];

    // Execute the insert query
    pool.query(insertQuery, values, (err, result) => {
      if (err) {
        console.error("Error executing query", err);
      } else {
        console.log("Insert successful:", result.rowCount, "row inserted");
      }
    });
  } else {
    const updateQuery =
      "UPDATE users_info SET city = $1, street = $2, street_number = $3, lat = $4, long = $5 WHERE user_id = $6";
    const values = [
      city,
      street,
      streetNumber,
      parseFloat(lat),
      parseFloat(long),
      ctx.message.from.id,
    ];

    // Execute the update query
    pool.query(updateQuery, values, (err, result) => {
      if (err) {
        console.error("Error executing query", err);
      } else {
        console.log("Update successful:", result.rowCount, "rows updated");
      }
    });
  }

  await ctx.reply(`Ваше місцезнаходження: ${city}`);
});

bot.hears("Залишок ❤️", async (ctx) => {
  botLikesValue(ctx);
});
let usersLikesIndex = 0;
let usersLikesProfiles = [];
bot.hears("💌 Мої вподобайки", async (ctx) => {
  const result = await pool.query(`
  select a.*,
         b.name,b.text,b.age,b.sex,b.looking,
         c.photo_url,c.type,
         d.city,d.street,d.street_number,d.lat,d.long,d.user_id,
         e.*
  from users_likes as a 
  left join users_info b on a.user_id1 = b.user_id
  left join users_photos c on a.user_id1 = c.user_id
  left join users_location d on a.user_id1 = d.user_id
  left join users e on a.user_id1 = e.tg_id
  where user_id2 = ${ctx.message.from.id} and is_show = 0`);
  const myLikes = result.rows;

  if (myLikes.length > 0) {
    usersLikesProfiles.push(...myLikes);
    if (usersLikesIndex < usersLikesProfiles.length) {
      sendLikeProfile(ctx);
    }
  } else {
    await ctx.reply(
      "Нажаль у вас ще немає симпатій 😪 \n\nЛайкайте анкети та чекайте відповіді 🤪"
    );
  }
});

async function sendLikeProfile(ctx) {
  const myLocation = await pool.query(
    `select lat,long from users_location where user_id =${ctx.message.from.id}`
  );
  const myLoc = myLocation.rows[0];
  const currentProfile = usersLikesProfiles[usersLikesIndex];
  const keyboard = Markup.inlineKeyboard([
    Markup.button.callback("Option 1", "option1"),
    Markup.button.callback("Option 2", "option2"),
  ]);

  const myPoint = { latitude: myLoc.lat, longitude: myLoc.long };
  const userPoint = {
    latitude: currentProfile.lat,
    longitude: currentProfile.long,
  };
  let message = "";
  if (
    myPoint !== null ||
    userPoint !== null ||
    myPoint !== undefined ||
    userPoint !== undefined
  ) {
    message = `${currentProfile.sex === "M" ? "👦" : "👧"} ${
      currentProfile?.name ? currentProfile?.name : null
    }\n\n🕤 ${currentProfile.age ? currentProfile.age : null}р. / 📍- ${
      getDistanceString(myPoint, userPoint)
        ? getDistanceString(myPoint, userPoint)
        : " "
    } \n\n📔 ${currentProfile?.text ? currentProfile?.text : null}`;
  } else if (
    myPoint === null ||
    userPoint === null ||
    myPoint === undefined ||
    userPoint === undefined
  ) {
    message = `${currentProfile.sex === "M" ? "👦" : "👧"} ${
      currentProfile?.name ? currentProfile?.name : null
    }\n\n🕤 ${currentProfile.age ? currentProfile.age : null}р. \n\n📔 ${
      currentProfile?.text ? currentProfile?.text : null
    }`;
  }

  if (currentProfile.type === "photo") {
    await ctx.replyWithPhoto(
      {
        url: currentProfile.photo_url,
      },
      {
        caption: message,
        reply_markup: {
          keyboard: [
            [{ text: "🫠 Взаємно" }, { text: "🙅 Точно ні" }, { text: "✔️" }],
          ],
          resize_keyboard: true,
        },
      }
    );
  } else {
    await ctx.replyWithVideo(
      {
        url: currentProfile.photo_url,
      },
      {
        caption: message,
        reply_markup: {
          keyboard: [
            [{ text: "🫠 Взаємно" }, { text: "🙅 Точно ні" }, { text: "✔️" }],
          ],
          resize_keyboard: true,
        },
      }
    );
  }

  // Інкрементуємо currentProfileIndex для відправки наступної анкети
  usersLikesIndex++;
}

bot.hears("🫠 Взаємно", async (ctx) => {
  // const setIsShow = await pool.query``
  const currentProfile = usersLikesProfiles[usersLikesIndex - 1];
  // const currentProfile = usersLikesProfiles;
  console.log(currentProfile);

  const updateLike = await pool.query(`
update users_likes 
set is_show = 1,like_2 = 1
where user_id2 = ${ctx.message.from.id}
`);

  await ctx.reply(`
Взаємна симпатія:\n
Напишіть @${currentProfile.username}
`);

  const result = await pool.query(`
select a.*
from users_likes as a 
where user_id2 = ${ctx.message.from.id} and is_show = 0`);

  if (ctx.message.from.username) {
    await bot.telegram.sendMessage(
      currentProfile.user_id1,
      `
У вас взємний лайк!\nНапишіть @${ctx.message.from.username}
`
    );
  } else {
    await bot.telegram.sendMessage(
      currentProfile.user_id1,
      `
  У вас взємний лайк!\nПроте користувач не відкрив своїх контактних даних.\nМи вже повідомили його, щоб відкрив свій профіль.\nОчікуйте на повідомлення.
  `
    );
  }
  if (result.rows.length <= 0) {
    await ctx.reply("Більше симпатій немає.", {
      reply_markup: {
        keyboard: [
          [{ text: "👤 Мій профіль" }, { text: "👀 Дивитись анкети" }],
          [
            { text: "💰 Реферальне посилання" },
            { text: "🔄 Заповнити анкету знову" },
          ],
          [{ text: "🐣 Зв'язок з розробником" }],
          [{ text: "🌐 Відкрити сайт",web_app: { url: "https://enjoyhub.space" }  }],
   
        ],
        resize_keyboard: true,
      },
    });
  }
});

bot.hears("🙅 Точно ні", async (ctx) => {
  const updateLike = await pool.query(`
  update users_likes 
  set is_show = 1,like_2 = 0
  where user_id2 = ${ctx.message.from.id}
  `);
  const result = await pool.query(`
select a.*
from users_likes as a 
where user_id2 = ${ctx.message.from.id} and is_show = 0`);

  if (result.rows.length <= 0) {
    await ctx.reply("Більше симпатій немає.", {
      reply_markup: {
        keyboard: [
          [{ text: "👤 Мій профіль" }, { text: "👀 Дивитись анкети" }],
          [
            { text: "💰 Реферальне посилання" },
            { text: "🔄 Заповнити анкету знову" },
          ],
          [{ text: "🐣 Зв'язок з розробником" }],
          [{ text: "🌐 Відкрити сайт",web_app: { url: "https://enjoyhub.space" }  }],
        ],
        resize_keyboard: true,
      },
    });
  }
});

bot.hears("👨‍👩‍👧‍👦 Мої реферали", async (ctx) => {
  const result = await pool.query(`
SELECT
    u.tg_id,
    u.username,
    ARRAY(
        SELECT c.username
        FROM referrals r
        JOIN users c ON r.referrer_id = c.tg_id
        WHERE r.referee_id = ${ctx.message.from.id}
    ) AS children
FROM
    users u
WHERE ARRAY_LENGTH(
        ARRAY(
            SELECT  r.referrer_id
            FROM referrals r
            WHERE r.referee_id = u.tg_id
        ), 1) IS NOT NULL
`);
  console.log(result.rows);
  let message = "";
  const mappedReferals = result.rows[0]?.children?.map((item, idx) => {
    message += `${idx + 1} - @${item}\n`;
  });

  if (result.rows[0]?.children?.length > 0) {
    await ctx.reply(`Список ваших рефералів:\n${message}`);
  } else if (result.rows[0]?.children?.length > 199) {
    await ctx.reply(
      `Список ваших рефералів:\nУ вас понад 200+ рефералів.Ми фізично не можемо вивести даний список.Ви зможете переглянути усіх рефералів на сайті.`
    );
  } else {
    await ctx.replyWithHTML(
      `У вас поки що немає рефералів.\nНадішліть ваше персональне посилання для того щоб запросити друзів та отримайте бонуси 🎁\n\n<code>https://t.me/EnjoyHubBot?start=${ctx.message.from.id}</code>`,
      { parse_mode: "HTML" }
    );
  }
});

// ЗАПЛАНОВАНІ ПОДІЇ
updateLikesForEveryUser(bot);
// ЗАПЛАНОВАНІ ПОДІЇ
// SCENES ENTER
bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
module.exports = {
  bot,
};

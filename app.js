require("dotenv").config();
const { Telegraf, Scenes, session, Markup } = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const app = express();
const liqpayRouter = require("./routes/liqpay/liqpay");
const port = 5005;
const path = require('path')
var LiqPay = require("./my_modules/liqpay/liqpay");
const { v4: uuidv4 } = require("uuid");
const pool = require("./db/pool");
const geolib = require("geolib");
const iconv = require("iconv-lite");
const { createUser } = require("./controllers/users");

const registrationScene = require("./scenes/registerScene");
const likesScene = require("./scenes/likesScene");
const public_key = "sandbox_i31110430124";
const private_key = "sandbox_HJjraXMdCLnz3ApcEJOYCjmSgRjhsjtuvFSVmVci";
var liqpay = new LiqPay(public_key, private_key);

// stage.register(registrationScene);
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
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

const stage = new Scenes.Stage([registrationScene, likesScene]);

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
          username ? username : null
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
const users = {};
bot.start(async (ctx) => {
  createUser(ctx.message.from);

  const userInfo = await pool.query(
    `select * from users_info where user_id = ${ctx.message.from.id}`
  );

  if (userInfo.rows <= 0) {
    ctx.replyWithHTML(
      `Вітаю в боті знайомств MeetMe.\nПерший повномасштабний український бот знайомств в телеграмі!`,
      {
        reply_markup: {
          keyboard: [
            [{ text: "Створити анкету 📒" }],
            [{ text: "Наше Comunity 👨‍👨‍👧‍👧" }],
          ],
          resize_keyboard: true,
        },
      }
    );
  } else {
    ctx.replyWithHTML(
      `Вітаю в боті знайомств MeetMe.\nПерший повномасштабний український бот знайомств в телеграмі!`,
      {
        reply_markup: {
          keyboard: [
            [{ text: "🔑 Мій аккаунт" },{ text: "👀 Дивитись анкети" }],
            [{ text: "💰 Реферальне посилання" },{ text: "🔄 Заповнити анкету знову" }],
          ],
          resize_keyboard: true,
        },
      }
    );
  }
  const userId = ctx.from.id;
  const referrerId = ctx.message.text.split(" ")[1];

  if (referrerId) {
    users[userId] = { referrer: referrerId };
    await ctx.reply(
      `Вас запросив користувач ${referrerId}\n\nВам надано 2 додаткових ❤️`
    );
    const existReferalUsers = await pool.query(
      `select * from referals where user_id = ${userId} and referer_id =${referrerId}`
    );
    if (existReferalUsers.rows > 0) {
      console.log("exist");
    }
    if (existReferalUsers.rows <= 0) {
      const res = await pool.query(`insert into referals (user_id,referer_id) 
    values(${userId},${referrerId})
   `);
      // ctx.sendMessage(referrerId,`Користувач ${userId} щойно вам надав 2 безкоштовних лайки.Користуйтесь!)`)
      bot.telegram.sendMessage(
        referrerId,
        `Користувач ${userId} щойно вам надав 5 безкоштовних ❤️.Користуйтесь!)`
      );
    }
  } else {
    users[userId] = { referrer: null };
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

bot.hears("distance", (ctx) => {
  // Координати першої точки (наприклад, Київ)
  const pointA = { latitude: 50.4501, longitude: 30.5234 };

  // Координати другої точки (наприклад, Львів)
  const pointB = { latitude: 49.8383, longitude: 24.0232 };

  // Обчислити відстань між точками в метрах
  const distance = geolib.getDistance(pointA, pointB);
  ctx.reply(
    `Відстань між точкою A і точкою B: ${geolib
      .convertDistance(distance, "km")
      .toFixed(1)}км`
  );
});
let profiles = [];
let currentProfileIndex = 0;
let like = { user: null };
bot.command("dev", (ctx) => ctx.scene.enter("registrationScene"));
bot.hears("🔄 Заповнити анкету знову", async (ctx) => {
  ctx.scene.enter("registrationScene");
});
bot.hears("Створити анкету 📒", async (ctx) => {
  ctx.scene.enter("registrationScene");
});

bot.hears("👀 Дивитись анкети", async (ctx) => {
  const profiles1 = await pool.query(`
 SELECT a.*, b.photo_url
 FROM users_info AS a
 LEFT JOIN users_photos AS b
 ON a.user_id = b.user_id 
 where a.user_id != ${ctx.message.from.id}
 `);

  const usersProfile = profiles1.rows;
  if (usersProfile.length > 0) {
    profiles.push(...usersProfile);
  }

  if (currentProfileIndex < profiles.length) {
    sendProfile(ctx);
  } else {
    ctx.reply("No more profiles available.");
  }
});
async function sendProfile(ctx, like) {
  const currentProfile = profiles[currentProfileIndex];
  const message = `Name: ${currentProfile.name}\nAge: ${currentProfile.age}`;
  // const message = `Na323`;
  // const replyMarkup = Markup.inlineKeyboard([
  //   Markup.button.callback("Like", "like"),
  //   Markup.button.callback("Dislike", "dislike"),
  // ]);

  const keyboard = Markup.inlineKeyboard([
    Markup.button.callback("Option 1", "option1"),
    Markup.button.callback("Option 2", "option2"),
  ]);

  const photoUrl =
    "https://static-ssl.businessinsider.com/image/5cc86f31768b3e05177244e3-2400/shutterstock1093218185.jp2";
  await ctx.replyWithPhoto(
    {
      url: currentProfile.photo_url,
    },
    {
      caption: message,
      reply_markup: {
        keyboard: [[{ text: "❤️" }, { text: "👎" }]],
        resize_keyboard: true,
      },
    }
  );

  // Інкрементуємо currentProfileIndex для відправки наступної анкети
  currentProfileIndex++;
}

bot.hears("❤️", async (ctx) => {
  const prevUser = profiles[currentProfileIndex - 1];
  // Оновіть інформацію в базі даних для поточної анкети як лайк
  const currentProfile = profiles[currentProfileIndex - 1];

  if (!prevUser?.user_id || prevUser.user_id === null) {
    return null;
  } else {
    const res = await pool.query(`
    INSERT INTO users_likes (user_id1, user_id2, like_1, like_2, created_at)
    VALUES (${ctx.message.from.id}, ${prevUser.user_id}, 1, 0, NOW());
     `);
    ctx.telegram.sendMessage(
      prevUser.user_id,
      "Схоже вами хтось зацікавився.Подивіться хто вас лайкнув!",
      {
        reply_markup: {
          keyboard: [[{ text: "Подивитись хто мене лайкнув" }]],
          resize_keyboard: true,
        },
      }
    );
  }

  //   Відправка наступної анкети
  if (currentProfileIndex < profiles.length) {
    sendProfile(ctx, (like = 1));
  } else {
    ctx.reply("Більше немає анкет для перегляду", {
      reply_markup: {
        keyboard: [
          [{ text: "🔑 Мій аккаунт" },{ text: "👀 Дивитись анкети" }],
          [{ text: "💰 Реферальне посилання" },{ text: "🔄 Заповнити анкету знову" }],
        ],
        resize_keyboard: true,
      },
    });
  }
});

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
          [{ text: "🔑 Мій аккаунт" },{ text: "👀 Дивитись анкети" }],
          [{ text: "💰 Реферальне посилання" },{ text: "🔄 Заповнити анкету знову" }],
        ],
        resize_keyboard: true,
      },
    });
  }
});

bot.hears("💰 Реферальне посилання", async (ctx) => {
  const photoPath = path.join(__dirname, 'static_files', 'referal.jpg');
  await ctx.replyWithPhoto(
    {source:photoPath},{caption:`\n<b>Ваше унікальне реферальне посилання:</b>\n\n<i>(Натисніть щоб скопіювати)</i>\n<code>https://t.me/noris_chat_bot?start=${ctx.message.from.id}</code>\n\nПросто скопіюйте його та перешліть друзям.\n\n`,parse_mode:"HTML"},
    // `Ваше реферальне посилання:\nhttps://t.me/noris_chat_bot?start=${ctx.message.from.id}`
  );
});

bot.hears("🔑 Мій аккаунт", async (ctx) => {
  const myAcc = await pool.query(`
  SELECT a.*, b.photo_url
  FROM users_info AS a
  LEFT JOIN users_photos AS b ON a.user_id = b.user_id
  WHERE a.user_id = ${ctx.message.from.id};
  `);
  const me = myAcc.rows[0];
  console.log(me);
  const message = `👤Ім'я: ${me.name}\n\n🕐Вік: ${me.age}\n\n💁Інфа: ${me.text}`;
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
          [{ text: "⬅️ Назад" }],
        ],
        resize_keyboard: true,
      },
    }
  );
});

bot.hears("⬅️ Назад", async (ctx) => {
  await ctx.reply("🔑 Мій аккаунт", {
    reply_markup: {
      keyboard: [
        [{ text: "🔑 Мій аккаунт" },{ text: "👀 Дивитись анкети" }],
        [{ text: "💰 Реферальне посилання" },{ text: "🔄 Заповнити анкету знову" }],
  
      ],
      resize_keyboard: true,
    },
  });
});
bot.hears("⚙ Налаштування", async (ctx) => {
  await ctx.reply("⚙ Налаштування", {
    reply_markup: {
      keyboard: [
        [{ text: "🔸Змінити ім'я" }],
        [{ text: "🔸Змінити вік" }],
        [{ text: "🔸Змінити інфо про себе"}],
        [{ text: "🔄 Заповнити анкету знову" }],
        [{ text: "⬅️ Назад" }],
      ],
      resize_keyboard: true,
    },
  });
});

bot.launch();
// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = {
  bot,
};

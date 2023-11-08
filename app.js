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
  console.log(userInfo);
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
            [{ text: "Мій аккаунт" }],
            [{ text: "Дивитись анкети 👀" }],
            // [{ text: "Пошук анкет" }],
            // [{ text: "Преміум 1 тиждень" }],
            [{ text: "Налаштування" }],
            [{ text: "Заповнити анкету знову" }],
          ],
          resize_keyboard: true,
        },
      }
    );
  }
  const userId = ctx.from.id;
  const referrerId = ctx.message.text.split(" ")[1];
  console.log(users);
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
    // ctx.reply("Welcome! You have not been referred by anyone.");
  }
  // if (userInfo.rows >= 0) {
  //   ctx.replyWithHTML(`Вітаю в боті знайомств MeetMe.\nПерший повномасштабний український бот знайомств в телеграмі!`, {
  //     reply_markup: {
  //       keyboard: [
  //         [{ text: "Мій аккаунт" }],
  //         [{ text: "Пошук анкет" }],
  //         [{ text: "Преміум 1 тиждень" }],
  //         [{ text: "Налаштування" }],
  //       ],
  //       resize_keyboard: true,
  //     },
  //   });
  // }
});

bot.hears("Преміум 1 тиждень", async (ctx) => {
  const res = await getInvoice(
    75,
    ctx.message.from.username,
    ctx.message.from.id
  );
  console.log(res);
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
bot.command("dev", (ctx) => ctx.scene.enter("registrationScene"));
bot.hears("Заповнити анкету знову", async (ctx) => {
  ctx.scene.enter("registrationScene");
});
bot.hears("Створити анкету 📒", async (ctx) => {
  ctx.scene.enter("registrationScene");
});
// bot.hears("Дивитись анкети 👀", async (ctx,next) => {
//   ctx.scene.enter("likesScene");
//   ctx.session.index = 0;
//   return next()
//   // const index = 0
//   // ctx.reply('dsadsa',{})
// });

// let profiles = [
//   { name: "Profile 1", age: 25 },
//   { name: "Profile 2", age: 30 },
//   { name: "Profile 3", age: 28 },
//   // Додайте інші анкети за потреби
// ];

bot.hears("Дивитись анкети 👀", async (ctx) => {
  const profiles1 = await pool.query(`
 SELECT a.*, b.photo_url
 FROM users_info AS a
 LEFT JOIN users_photos AS b
 ON a.user_id = b.user_id;`);
  console.log(profiles1.rows);
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
async function sendProfile(ctx) {
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
        keyboard: [[{ text: "❤️" },{text:"👎"}]],
        resize_keyboard: true,
      },
    }
  );

  // Інкрементуємо currentProfileIndex для відправки наступної анкети
  currentProfileIndex++;
}

bot.hears("❤️", async (ctx) => {
  // Оновіть інформацію в базі даних для поточної анкети як лайк
  const currentProfile = profiles[currentProfileIndex - 1];

  // Відправка наступної анкети
  if (currentProfileIndex < profiles.length) {
    sendProfile(ctx);
  } else {
    ctx.reply("Більше немає анкет для перегляду");
  }
});

bot.hears("👎", async (ctx) => {
  // Оновіть інформацію в базі даних для поточної анкети як дизлайк
  const currentProfile = profiles[currentProfileIndex - 1];
  await ctx.reply(`You disliked ${currentProfile.name}'s profile.`);

  // Відправка наступної анкети
  if (currentProfileIndex < profiles.length) {
    sendProfile(ctx);
  } else {
    ctx.reply("No more profiles available.");
  }
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

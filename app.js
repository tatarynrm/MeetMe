require("dotenv").config();
const { Telegraf, Scenes, session } = require("telegraf");
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
const public_key = "sandbox_i31110430124";
const private_key = "sandbox_HJjraXMdCLnz3ApcEJOYCjmSgRjhsjtuvFSVmVci";
var liqpay = new LiqPay(public_key, private_key);

// stage.register(registrationScene);
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["POST", "GET"],
  })
);
app.use("/liqpay", liqpayRouter);

const stage = new Scenes.Stage([registrationScene]);

bot.use(session());
bot.use(stage.middleware());

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

bot.start(async (ctx) => {
  const users = {};
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
            [{ text: "Пошук анкет" }],
            [{ text: "Преміум 1 тиждень" }],
            [{ text: "Налаштування" }],
          ],
          resize_keyboard: true,
        },
      }
    );

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
      // ctx.reply("Welcome! You have not been referred by anyone.");
    }
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

bot.command("dev", (ctx) => ctx.scene.enter("registrationScene"));
bot.hears("Заповнити анкету знову", async (ctx) =>
  {
    ctx.scene.enter("registrationScene")
  }
);

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

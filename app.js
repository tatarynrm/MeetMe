require("dotenv").config();
const { Telegraf } = require("telegraf");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const app = express();
const liqpayRouter = require('./routes/liqpay/liqpay')
const port = 5005;
const bot = new Telegraf(process.env.BOT_TOKEN);
var LiqPay = require("./my_modules/liqpay/liqpay");
const { v4: uuidv4 } = require("uuid");
const pool = require("./db/pool");
const geolib = require("geolib");
const iconv = require("iconv-lite");
const { createUser } = require("./controllers/users");
const public_key = "sandbox_i31110430124";
const private_key = "sandbox_HJjraXMdCLnz3ApcEJOYCjmSgRjhsjtuvFSVmVci";
var liqpay = new LiqPay(public_key, private_key);
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["POST", "GET"],
  })
);
app.use('/liqpay',liqpayRouter)


const getInvoice = async (amount, username,customer) => {
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
        description: `Поповнення балансу бота Чистокровнй українець ${username ? username : null}`,
        server_url:"https://api.noris.tech/liqpay/callback",
        customer:customer,
        info:"Оплата преміум підписки Telegram Bot"
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

// async function connectToDatabase() {
//     try {
//       // Connect to the database
//       const client = await pool.connect();

//       try {
//         // Testing the database connection
//         const result = await client.query('SELECT NOW()');
//         console.log('Connected to the database at:', result.rows[0].now);

//         // Example query using the pool
//         const queryResult = await client.query('SELECT * FROM users');
//         console.log('Query result:', queryResult.rows);
//       } finally {
//         // Release the client back to the pool
//         client.release();
//       }
//     } catch (error) {
//       console.error('Error connecting to the database:', error);
//     } finally {
//       // Close the pool (optional, usually it's kept open during the application's lifetime)
//       pool.end();
//     }
//   }

//   // Call the connectToDatabase function to establish the connection and execute queries
//   connectToDatabase();

bot.start(async (ctx) => {
  createUser(ctx.message.from);

  ctx.replyWithHTML("Welcome to your Telegram bot!", {
    reply_markup: {
      keyboard: [
        [{ text: "Мій аккаунт" }],
        [{ text: "Пошук анкет" }],
        [{ text: "Преміум 1 тиждень" }],
        [{ text: "Налаштування" }],
      ],
      resize_keyboard: true,
    },
  });
});

bot.hears("Преміум 1 тиждень", async (ctx) => {
  const res = await getInvoice(75, ctx.message.from.username,ctx.message.from.id);
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

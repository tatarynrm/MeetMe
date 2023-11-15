const pool = require("../db/pool");
let users = {};
const botStart = async (ctx) => {
  try {
    const user = ctx.message.from;
    // await createUser(user);
    const checkUserBan = await pool.query(
      `select * from users where tg_id = ${ctx.message.from.id}`
    );

    const userInfo = await pool.query(
      `select * from users_info where user_id = ${ctx.message.from.id}`
    );
    console.log(checkUserBan.rows[0].is_ban);
    if (checkUserBan.rows[0]?.is_ban === 1) {
      await ctx.reply("Ви забанені", {
        reply_markup: {
          keyboard: [[{ text: "Ви були забанені адміністратором" }]],
        },
      });
    } else {
      if (userInfo?.rows <= 0) {
        await ctx.replyWithHTML(`Вітаю!`, {
          reply_markup: {
            keyboard: [
              [{ text: "Створити анкету 📒" }],
              [
                {
                  text: "🌐 Відкрити сайт",
                  web_app: { url: "https://enjoyhub.space" },
                },
              ],
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
              [
                {
                  text: "🌐 Відкрити сайт",
                  web_app: { url: "https://enjoyhub.space" },
                },
              ],
            ],
            resize_keyboard: true,
          },
        });
      }
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
    // await ctx.reply('Щось пішло не по плану')
  }
};

module.exports = {
  botStart,
};

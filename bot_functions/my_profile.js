const { createUser } = require("../controllers/users");
const pool = require("../db/pool");
const moment = require('moment')
const myProfile = async (ctx)=>{
    try {
        const user = ctx.message.from;
  await createUser(user);
  const myAcc = await pool.query(`
  SELECT a.*, b.photo_url,b.type
  FROM users_info AS a
  LEFT JOIN users_photos AS b ON a.user_id = b.user_id
  WHERE a.user_id = ${ctx.message.from.id};
  `);
  const me = myAcc.rows[0];
  const banUser = await pool.query(
    `select * from users where tg_id = ${ctx.message.from.id}`
  );
  if (banUser.rows[0].is_ban === 1) {
    await ctx.reply("Ви забанені", {
      reply_markup: {
        keyboard: [[{ text: "Ви були забанені адміністратором" }]],
      },
    });
  } else {
    if (me) {
      await ctx.reply(
        `Ти ${
          me?.sex === "M" ? "приєднався" : "приєдналась"
        } до нас\n📅${moment(me?.created_at).format("LLL")} год.`
      );
      if (me === undefined || me === null || me.type === null) {
        await ctx.reply(
          "Упссс.....щось пішло не так....Спробуйте натиснути команду /start"
        );
      } else {
        const message = `👤Ім'я: ${me?.name ? me?.name : "..."}\n\n🕐Вік: ${
          me?.age ? me?.age : 50
        }\n\n💁Інфа: ${me?.text ? me?.text : "Немає інфи"}`;
        if (me.photo_url) {
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
        } else {
          return await ctx.reply("Заповніть анкету знову", {
            reply_markup: {
              keyboard: [[{ text: "🔄 Заповнити анкету знову" }]],
              resize_keyboard: true,
            },
          });
        }
      }
    } else {
      return await ctx.reply("Заповніть анкету знову", {
        reply_markup: {
          keyboard: [[{ text: "🔄 Заповнити анкету знову" }]],
          resize_keyboard: true,
        },
      });
    }
  }
    } catch (error) {
        console.log(error);
    }
}


module.exports = myProfile
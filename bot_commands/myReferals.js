const pool = require("../db/pool");


const myReferals  = async (ctx)=>{
    try {
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
    } catch (error) {
        console.log(error);
    }
}

module.exports = myReferals
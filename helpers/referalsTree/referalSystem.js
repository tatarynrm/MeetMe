// РОБОЧИЙ ВАРІАНТ ДЛЯ УСІХ РЕФЕРАЛІВ!

// bot.hears('👨‍👩‍👧‍👦 Мої реферали',async ctx =>{
// const result = await pool.query(`
// SELECT
//     u.tg_id,
//     u.username,
//     ARRAY(
//         SELECT c.username
//         FROM referrals r
//         JOIN users c ON r.referrer_id = c.tg_id
//         WHERE r.referee_id = u.tg_id
//     ) AS children
// FROM
//     users u
// WHERE ARRAY_LENGTH(
//         ARRAY(
//             SELECT  r.referrer_id
//             FROM referrals r
//             WHERE r.referee_id = u.tg_id
//         ), 1) IS NOT NULL
// `);

// let message = '';
// const mappedReferals = result.rows[0].children.map((item,idx)=> {
//   message += `${idx +1} - @${item}\n`
// })
// await ctx.reply(`Список ваших рефералів:\n${message}`)
// })


// РОБОЧИЙ ВАРІАНТ ДЛЯ УСІХ РЕФЕРАЛІВ!
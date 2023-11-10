const pool = require("../db/pool");


const botLikesValue = async (ctx)=>{
    try {
        const result = await pool.query(`select likes_per_day as likes from users where tg_id = ${ctx.message.from.id}`)
        const res = result.rows[0]
        switch (true) {
          case res.likes > 200:
            await ctx.replyWithMarkdownV2(`Ви король Enjoy Hub\nПалець боліти буде \n ||${res.likes} ❤️|| `,{parse_mode:"MarkdownV2"})
      
            break;
          case res.likes > 15:
            await ctx.replyWithMarkdownV2(`У вас ще все попереду \nЛайків багато \n ||${res.likes} ❤️|| `,{parse_mode:"MarkdownV2"})
      
            break;
          case res.likes > 9:
            await ctx.replyWithMarkdownV2(`До кінця доби у вас залишилось: \n||${res.likes} ❤️||`,{parse_mode:"MarkdownV2"})
      
            break;
          case res.likes < 9:
            await ctx.replyWithMarkdownV2(`Маловато лайкосів: \n||${res.likes} ❤️||`,{parse_mode:"MarkdownV2"})
            break;
        
          default:
            break;
        }
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    botLikesValue
}
const myPremiumCommand = async ()=>{
    try {
        const getData = await pool.query(
            `select premium_end from users where tg_id = ${ctx.message.from.id}`
          );
          const datePremiumEnd = moment(getData.rows[0].premium_end).format("LLL");
        
          const premiumLikes = await pool.query(
            `select likes_per_day from users where tg_id = ${ctx.message.from.id}`
          );
          const likes = premiumLikes.rows[0].likes_per_day;
        
          ctx.reply(
            `Ваш Premium аккаунт активний до: ${datePremiumEnd} год\n\nКілкість лайків яка залишилась: ❤️ ${likes}`
          );
    } catch (error) {
        console.log(error);
    }
}

module.exports = myPremiumCommand
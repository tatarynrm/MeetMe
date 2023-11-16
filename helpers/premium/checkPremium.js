const pool = require("../../db/pool");

const checkPremium = async ()=>{
    try {
      const data = await pool.query(`select is_premium from users where tg_id = ${ctx.message.from.id}`)
      const premium = await data.rows[0].is_premium;
     return premium;
    } catch (error) {
      console.log(error);
    }
  }

  module.exports = {
    checkPremium
  }
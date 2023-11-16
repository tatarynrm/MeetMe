const { logUserAction } = require("../controllers/bot/user_log")

const mySettings = async (ctx)=>{
    try {
        await ctx.reply("⚙ Налаштування", {
            reply_markup: {
              keyboard: [
                [{ text: "🔸Змінити ім'я" }, { text: "🔸Змінити вік" }],
                [{ text: "🔸Змінити інфо про себе" }],
                [{ text: "⬅️ Назад" }],
              ],
              resize_keyboard: true,
            },
          });
    } catch (error) {
        console.log(error);
    }
}
module.exports = mySettings
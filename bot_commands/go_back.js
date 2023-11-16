const goBack = async (ctx)=>{
    try {
        await ctx.reply("👤 Мій профіль", {
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
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    goBack
}
const sendMsgLove = async (ctx,prevUser)=>{
    try {
        const result = await  ctx.telegram.sendMessage(
            prevUser,
            `Схоже вами хтось зацікавився 😎\n\n\nПодивіться хто вас лайкнув в меню:\n\n👤 Мій профіль -> 💌 Мої вподобайки`
          );
      
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    sendMsgLove
}
const cron = require("node-cron");
const pool = require("../db/pool");

const updateLikesForEveryUser = (bot) => {
  cron.schedule("0 0 * * *", async () => {
    try {
      // Retrieve all users from the database
      const getUsersQuery = "SELECT * FROM users";
      const { rows: users } = await pool.query(getUsersQuery);
      // Update likes_per_day based on user type
      for (const user of users) {
        const updateLikesQuery = `
              UPDATE users
              SET likes_per_day = $1
              WHERE tg_id = $2;
            `;

        const likesPerDay = user.is_premium ? 9999999 : 25;
        await pool.query(updateLikesQuery, [likesPerDay, user.tg_id]);
        await bot.telegram.sendMessage(
          user.tg_id,
          `Вам нараховано ${likesPerDay} ❤️\nПриємного користування Enjoy Hub`
        );
      }

      console.log("Likes updated successfully.");
    } catch (error) {
      console.error("Error updating likes:", error);
    }
  });
};

module.exports = updateLikesForEveryUser;

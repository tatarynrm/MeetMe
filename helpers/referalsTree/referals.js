const pool = require("../../db/pool");

const buildTree = async (referrerId) => {
  // Fetch user data
  const userResult = await pool.query("SELECT * FROM users WHERE tg_id = $1", [
    referrerId,
  ]);
  const currentUser = userResult.rows[0];

  if (!currentUser) {
    return null; // Користувача з вказаним tg_id не знайдено
  }

  // Initialize children array
  currentUser.children = [];

  // Fetch all users whom the current user referred
  const referredUsersResult = await pool.query(
    "SELECT * FROM referrals WHERE referrer_id = $1",
    [referrerId]
  );
  const referredUsers = referredUsersResult.rows;

  // Process each referred user
  for (const referredUser of referredUsers) {
    const childUser = await buildTree(client, referredUser.referee_id);

    if (childUser) {
      currentUser.children.push(childUser);
    }
  }

  return currentUser;
};

module.exports = buildTree;

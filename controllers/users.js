const pool = require("../db/pool");

async function checkExistUser(user) {
  try {
    const client = await pool.connect();

    try {
      const existUser = await client.query(
        `select * from users where tg_id = ${user.id}`
      );
      // Define the SQL query for the insertion
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error inserting data:", error);
  }
}

async function createUser(user) {
  const client = await pool.connect();

  try {
    const existUser = await client.query(
      `select * from users where tg_id = ${user.id}`
    );
    console.log(existUser.rows);
    // Define the SQL query for the insertion
    if (existUser.rows < 0) {
      const text =
        "INSERT INTO users (first_name, username,tg_id) VALUES ($1, $2,$3)";
      const values = [
        user.first_name ? user.first_name : null,
        user.username ? `@${user.username}` : null,
        user.id,
      ];

      // Execute the SQL query to insert data
      const result = await client.query(text, values);
      console.log("Data inserted successfully");
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error inserting data:", error);
  }
}

module.exports = {
  createUser,
};

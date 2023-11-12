const pool = require("../db/pool");
async function createUser(user) {
  const existUser = await pool.query(
    `select * from users where tg_id = ${user.id}`
  );

  try {
    if (existUser.rows <= 0) {
      const result = await pool.query(
        `insert into users (first_name,username,tg_id) values ('${user.first_name}','${user.username}',${user.id})`
      );
      console.log("dsada", result);
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

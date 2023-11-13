const pool = require("../../db/pool");

const getAllUsersCount = async (req,res) =>{
    try {
        const result = await pool.query(`
        SELECT
            u.total_users,
            COALESCE(b.boys_count, 0) AS boys_count,
            COALESCE(g.girls_count, 0) AS girls_count
        FROM
            (SELECT COUNT(*) AS total_users FROM users) AS u
        LEFT JOIN
            (SELECT COUNT(*) AS boys_count FROM users_info WHERE sex = 'M') AS b
        ON true
        LEFT JOIN
            (SELECT COUNT(*) AS girls_count FROM users_info WHERE sex = 'W') AS g
        ON true
    `);
    console.log(result);
        res.json(result.rows)
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    getAllUsersCount
}

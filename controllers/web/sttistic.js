const pool = require("../../db/pool");

const getAllUsersCount = async (req,res) =>{
    try {
        const result = await pool.query(`select COUNT(*) from users`)
        console.log(result.rows);
        res.json(result.rows)
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    getAllUsersCount
}

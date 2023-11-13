const pool = require("../../db/pool");

async function logUserAction(tgId, actionDescription) {
    try {
        // Виклик функції в базі даних
        const query = {
            text: 'SELECT log_user_action($1, $2)',
            values: [tgId, actionDescription],
        };

        await pool.query(query);
        console.log('User action logged successfully.');
    } catch (error) {
        console.error('Error logging user action:', error);
    } 
}

// Виклик функції
module.exports = {
    logUserAction
}
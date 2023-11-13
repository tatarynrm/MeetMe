const pool = require("../../db/pool");

async function logUserAction(tgId, actionDescription,ctx) {
    try {
        // Виклик функції в базі даних
        const query = {
            text: 'SELECT log_user_action($1, $2)',
            values: [tgId, actionDescription],
        };

       const result = await pool.query(query);
  
    
    } catch (error) {
        console.error('Error logging user action:', error);
    } 
}

// Виклик функції
module.exports = {
    logUserAction
}
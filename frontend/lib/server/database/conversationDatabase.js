const pool = require('../config/dbConfig'); // Import kết nối cơ sở dữ liệu

async function getConversations() {
    const [rows] = await pool.query('SELECT conversation_id FROM messages GROUP BY conversation_id ORDER BY MAX(timestamp) DESC');
    return rows;
}

module.exports = {
    getConversations
};

const pool = require('../config/dbConfig'); // Import kết nối cơ sở dữ liệu

async function getMessagesForConversation(conversationId) {
    const [rows] = await pool.query('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp', [conversationId]);
    return rows;
}

async function addMessage(conversationId, role, content, additionalInfo) {
    const [result] = await pool.query(
        'INSERT INTO messages (conversation_id, timestamp, role, content) VALUES (?, NOW(), ?, ?)',
        [conversationId, role, content]
    );

    const messageId = result.insertId;

    // Duyệt qua list các dict trong additionalInfo
    for (const info of Object.entries(additionalInfo)) {
        const infoKey = info[1].title;  // Lấy title làm infoKey
        const infoValue = info[1].content;  // Lấy content làm infoValue

        await pool.query(
            'INSERT INTO additional_info (message_id, info_key, info_value) VALUES (?, ?, ?)',
            [messageId, infoKey, infoValue]
        );
    }
    return messageId;
}

module.exports = {
    getMessagesForConversation,
    addMessage
};

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    port: 8019,
    password: 'password',
    database: 'chat',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Successfully connected to the database');
    connection.release();
});

async function getConversations() {
    const [rows] = await pool.query('SELECT conversation_id FROM messages GROUP BY conversation_id ORDER BY MAX(timestamp) DESC');
    return rows;
}

async function getMessagesForConversation(conversationId) {
    const [rows] = await pool.query('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp', [conversationId]);
    return rows;
}

// async function addMessage(conversationId, role, content, additionalInfo) {
//   const [result] = await pool.query(
//     'INSERT INTO messages (conversation_id, timestamp, role, content) VALUES (?, NOW(), ?, ?)',
//     [conversationId, role, content]
//   );
//
//   const messageId = result.insertId;
//
//   // Duyệt qua các cặp key-value trong additionalInfo và thêm vào bảng additional_info
//
//   for (const [infoKey, infoValue] of Object.entries(additionalInfo)) {
//     console.log(infoKey, infoValue)
//     await pool.query(
//         'INSERT INTO additional_info (message_id, info_key, info_value) VALUES (?, ?, ?)',
//         [messageId, infoKey, infoValue]
//     );
//   }
//
//   return messageId;
// }

async function addMessage(conversationId, role, content, additionalInfo) {
    const [result] = await pool.query(
        'INSERT INTO messages (conversation_id, timestamp, role, content) VALUES (?, NOW(), ?, ?)',
        [conversationId, role, content]
    );

    const messageId = result.insertId;

    // Duyệt qua list các dict trong additionalInfo
    for (const info of Object.entries(additionalInfo)) {
        console.log(info)
        const infoKey = info[1].title;  // Lấy title làm infoKey
        const infoValue = info[1].content;  // Lấy content làm infoValue

        await pool.query(
            'INSERT INTO additional_info (message_id, info_key, info_value) VALUES (?, ?, ?)',
            [messageId, infoKey, infoValue]
        )
    }
    return messageId;
}


// async function getAdditionalInfo(messageId) {
//   const [rows] = await pool.query('SELECT * FROM additional_info WHERE message_id = ?', [messageId]);
//   return rows;
// }

async function addAdditionalInfo(messageId, infoKey, infoValue) {
    const [result] = await pool.query(
        'INSERT INTO additional_info (message_id, info_key, info_value) VALUES (?, ?, ?)',
        [messageId, infoKey, infoValue]
    );
    return result.insertId;
}

module.exports = {
    getConversations,
    getMessagesForConversation,
    addMessage,
    addAdditionalInfo
};
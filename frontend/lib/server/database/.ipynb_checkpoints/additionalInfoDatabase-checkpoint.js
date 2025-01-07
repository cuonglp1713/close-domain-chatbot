const pool = require('../config/dbConfig'); // Import kết nối cơ sở dữ liệu

async function addAdditionalInfo(messageId, infoKey, infoValue) {
    const [result] = await pool.query(
        'INSERT INTO additional_info (message_id, info_key, info_value) VALUES (?, ?, ?)',
        [messageId, infoKey, infoValue]
    );
    return result.insertId;
}

module.exports = {
    addAdditionalInfo
};

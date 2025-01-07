const pool = require('../config/dbConfig'); // Import kết nối cơ sở dữ liệu
const bcrypt = require('bcrypt');

// Tìm user theo username
async function findUserByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM user WHERE username = ?', [username]);
    console.log(rows[0]);
    return rows[0];  // Trả về user đầu tiên
}

// Kiểm tra mật khẩu
async function validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

async function createUser(username, password, email) {
    const hashedPassword = await bcrypt.hash(password, 10);  // Mã hóa mật khẩu với salt 10
    const [result] = await pool.query(
        'INSERT INTO user (username, password_hash, email) VALUES (?, ?, ?)',
        [username, hashedPassword, email]
    );
    return result.insertId;
}

module.exports = {
    findUserByUsername,
    validatePassword,
    createUser
};


// module.exports = {
//     findUserByUsername,
//     validatePassword
// };

const mysql = require('mysql2/promise');

// Kết nối đến MySQL trong Docker qua localhost
const pool = mysql.createPool({
    host: 'localhost',            // Kết nối qua localhost vì đã ánh xạ cổng
    port: 8019,                   // Cổng bên ngoài ánh xạ đến container
    user: 'root',                 // User MySQL
    password: 'password',         // Password đã đặt
    database: 'chat',             // Database cần kết nối
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

module.exports = pool;

// Kiểm tra kết nối
async function testConnection() {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        console.log('Database connected successfully:', rows[0].solution);
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}

testConnection();

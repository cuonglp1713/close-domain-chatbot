const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',       // Thay đổi nếu backend chạy trong container
            port: 3306,              // Port của MySQL
            user: 'root',            // User MySQL
            password: 'password',    // Password
            database: 'chat'         // Database cần kết nối
        });

        const [rows] = await connection.query('SELECT * FROM messages LIMIT 5;'); // Test query
        console.log('Database connected successfully:', rows); // Log dữ liệu trả về
        await connection.end();
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}

testConnection();

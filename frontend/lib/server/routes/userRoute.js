const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByUsername, validatePassword, createUser} = require('../database/userDatabase');  // Import các hàm xử lý user

const app = express();

// Route đăng nhập
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Tìm user trong database
        const user = await findUserByUsername(username);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Kiểm tra mật khẩu
        const isPasswordValid = await validatePassword(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Tạo JWT token (bạn có thể thay đổi secret_key theo ý muốn)
        const token = jwt.sign({ userId: user.user_id, username: user.username }, 'secret_key', { expiresIn: '1h' });

        // Trả về token
        res.json({ token, message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred during login' });
    }
});

app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        // Tạo user mới
        const userId = await createUser(username, password, email);
        res.json({ user_id: userId, message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred during registration' });
    }
});

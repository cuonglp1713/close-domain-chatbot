const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3002' }));
app.use(express.json());

// Import các routes
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Sử dụng các routes
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);

// Khởi động server
const PORT = process.env.PORT || 8018;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



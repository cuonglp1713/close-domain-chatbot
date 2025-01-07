const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { getConversations, getMessagesForConversation, addMessage } = require('./database');
const mysql = require("mysql2/promise");

// Define pool query
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

const app = express();
app.use(cors({
  origin: 'http://localhost:3002'  // địa chỉ frontend
}));
app.use(express.json());

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images and documents
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images and documents are allowed!'));
  }
});

// Add the file upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
      filename: req.file.filename,
      path: req.file.path,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Error uploading file' });
  }
});

app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await getConversations();  // Lấy dữ liệu từ database
    console.log('Conversations to return:', conversations);  // Log dữ liệu trước khi trả về response
    res.status(200).json(conversations);  // Trả về dữ liệu với mã trạng thái 200
  } catch (error) {
    console.error('Error fetching conversations:', error);  // Log lỗi
    res.status(500).json({ error: 'An error occurred while fetching conversations' });
  }
});

app.get('/api/conversations/:id', async (req, res) => {
  try {
    const messages = await getMessagesForConversation(req.params.id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching messages' });
  }
});

app.post('/api/messages', async (req, res) => {
  const { conversation_id, role, content , additionalInfo} = req.body;
  try {
    const messageId = await addMessage(conversation_id, role, content, additionalInfo);
    res.json({ message_id: messageId });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while adding the message' });
  }
});

app.get('/api/messages/:messageId/info', async (req, res) => {
  console.log(`Received request for message ID: ${req.params.messageId}`);
  try {
    const messageId = req.params.messageId;
    const [rows] = await pool.query(
        'SELECT info_key, info_value FROM additional_info WHERE message_id = ?',
        [messageId]
    );
    res.status(200).json(rows);

  } catch (error) {
    console.error('Error fetching additional info:', error);
    res.status(500).json({ error: 'Failed to fetch additional info' });
  }
});




const PORT = process.env.PORT || 8018;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


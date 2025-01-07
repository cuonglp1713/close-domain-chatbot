const { addMessage } = require('../database/messageDatabase');
const pool = require('../config/dbConfig');

exports.addMessage = async (req, res) => {
    const { conversation_id, role, content, additionalInfo } = req.body;
    try {
        const messageId = await addMessage(conversation_id, role, content, additionalInfo);
        res.json({ message_id: messageId });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while adding the message' });
    }
};

exports.getAdditionalInfo = async (req, res) => {
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
};

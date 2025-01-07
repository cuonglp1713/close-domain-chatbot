const { getConversations } = require('../database/conversationDatabase');
const { getMessagesForConversation } = require('../database/messageDatabase');

exports.getAllConversations = async (req, res) => {
    try {
        const conversations = await getConversations();
        console.log('Conversations to return:', conversations);
        res.status(200).json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'An error occurred while fetching conversations' });
    }
};

exports.getMessagesForConversation = async (req, res) => {
    try {
        const messages = await getMessagesForConversation(req.params.id);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching messages' });
    }
};

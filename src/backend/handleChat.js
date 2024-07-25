const { sendMessageToGemini } = require('./botController'); // Update the path accordingly

const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    const response = await sendMessageToGemini(message);
    return res.json(response);
  } catch (error) {
    console.error('Error handling chat request:', error);
    return res.status(500).json({ error: 'Failed to process message' });
  }
};

module.exports = { handleChat };

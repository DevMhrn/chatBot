const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { handleChat } = require('./handleChat');
const { initModels } = require('./init');

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());

app.use(bodyParser.json());

app.post('/chat', handleChat);

initModels().then(() => {
    console.log('Database initialized');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


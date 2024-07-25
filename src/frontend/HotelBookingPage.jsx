import React, { useState } from 'react';
import axios from 'axios';
import './HotelBooking.css'; // Import the CSS file

const HotelBookingPage = () => {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim()) return; // Ensure message is not empty
  
    setIsLoading(true);
  
    try {
      // Append user's message to the conversation
      setConversation((prevConversation) => [
        ...prevConversation,
        { from: 'user', text: message },
      ]);
  
      // Post the message to the bot
      const res = await axios.post('http://localhost:5000/chat', { message });
      console.log('Response:', res.data);
      
      const botResponseText = res.data; // Directly assign if it's already a string

      
      const formattedResponse = formatBotResponse(botResponseText);
      // Append bot's response to the conversation
      setConversation((prevConversation) => [
        ...prevConversation,
        { from: 'bot', text: formattedResponse }, // Use formattedResponse instead of res.data directly
      ]);
  
      // Clear the input field
      setMessage('');
    } catch (err) {
      setConversation((prevConversation) => [
        ...prevConversation,
        { from: 'error', text: 'Failed to send message. Please try again.' },
      ]);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBotResponse = (text) => {
    console.log('format function is called');
  if (typeof text !== 'string') {
    return <span>{text}</span>; // Handle non-string responses gracefully
  }

  // Split text by new lines first, then by the bold markers
  const lines = text.split('\n').filter(Boolean);

  return (
    <div>
      {lines.map((line, index) => {
        const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);
        return (
          <p key={index}>
            {parts.map((part, subIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={subIndex}>{part.slice(2, -2)}</strong>;
              } else {
                return <span key={subIndex}>{part}</span>;
              }
            })}
          </p>
        );
      })}
    </div>
  );
};




  return (
    <div className="chat-container">
      <div id="chat-history" className="chat-history">
        {conversation.map((entry, index) => (
          <div key={index} className={`chat-message ${entry.from}`}>
            <p>{entry.text}</p>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HotelBookingPage;

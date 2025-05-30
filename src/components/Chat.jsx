// src/components/Chat.js
import React, { useState, useEffect } from 'react';
import signalRService from '../utility/SignalRService';

const Chat = () => {
  const [user, setUser] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    signalRService.startConnection(token);
    signalRService.onReceiveMessage((username, messageContent) => {
        setMessages(prev => [...prev, { user: username, message: messageContent }]);
    });

    return () => {
      if (signalRService.connection) {
        signalRService.connection.stop();
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message) {
        signalRService.sendMessageToAll(message);
        setMessage('');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>SignalR Chat</h1>
      <div style={{ 
        border: '1px solid #ccc', 
        height: '300px', 
        overflowY: 'auto', 
        marginBottom: '10px',
        padding: '10px'
      }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            <strong>{msg.user}: </strong>
            <span>{msg.message}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Type your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ padding: '8px', width: '100%' }}
          />
        </div>
        <button 
          type="submit" 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            cursor: 'pointer'
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
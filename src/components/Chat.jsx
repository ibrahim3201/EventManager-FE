import React, { useState, useEffect } from 'react';
import signalRService from '../utility/SignalRService';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    const setupConnection = async () => {
      try {
        await signalRService.startConnection(token);
        setIsConnected(true);
        setConnectionError(null);
      } catch (err) {
        setConnectionError("Failed to connect to chat service. Retrying...");
      }
    };

    setupConnection();

    // Handle new messages
    signalRService.onReceiveMessage((username, messageContent) => {
      setMessages(prev => [...prev, { 
        user: username, 
        message: messageContent,
        timestamp: new Date().toISOString() 
      }]);
    });
    
    // Handle message history
    signalRService.onReceiveMessageHistory((history) => {
      const formattedHistory = history.map(msg => ({
        user: msg.username,
        message: msg.content,
        timestamp: msg.timestamp
      }));
      setMessages(formattedHistory);
    });

    return () => {
      signalRService.stopConnection();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message) return;

    try {
      await signalRService.sendMessageToAll(message);
      setMessage('');
    } catch (err) {
      console.error("Failed to send message:", err);
      // Optionally show error to user
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>SignalR Chat</h1>
      
      {connectionError && (
        <div style={{ color: 'red', marginBottom: '10px' }}>{connectionError}</div>
      )}
      
      {!isConnected && !connectionError && (
        <div style={{ color: 'orange', marginBottom: '10px' }}>Connecting to chat...</div>
      )}

      <div style={{ 
        border: '1px solid #ccc', 
        height: '300px', 
        overflowY: 'auto', 
        marginBottom: '10px',
        padding: '10px',
        opacity: isConnected ? 1 : 0.7
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
            placeholder={isConnected ? "Type your message" : "Connecting..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ padding: '8px', width: '100%' }}
            disabled={!isConnected}
          />
        </div>
        <button 
          type="submit" 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: isConnected ? '#007bff' : '#cccccc', 
            color: 'white', 
            border: 'none', 
            cursor: isConnected ? 'pointer' : 'not-allowed'
          }}
          disabled={!isConnected}
        >
          {isConnected ? 'Send' : 'Connecting...'}
        </button>
      </form>
    </div>
  );
};

export default Chat;
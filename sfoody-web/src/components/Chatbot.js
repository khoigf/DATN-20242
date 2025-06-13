import React, { useState } from 'react';
import './ChatBot.css';

const BASE_URL = process.env.REACT_APP_API;

const ChatBot = () => {
  const [messages, setMessages] = useState([
    { from: 'bot', text: '👋 Xin chào! Bạn muốn tìm món gì hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { from: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/chatgpt/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages([...newMessages, { from: 'bot', text: data.reply }]);
        localStorage.setItem('chatHistory', JSON.stringify([...newMessages, { from: 'bot', text: data.reply }]));
      } else {
        setMessages([...newMessages, { from: 'bot', text: '❌ Có lỗi xảy ra khi gọi ChatGPT.' }]);
      }
    } catch (err) {
      setMessages([...newMessages, { from: 'bot', text: '⚠️ Lỗi mạng hoặc server không phản hồi.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('📋 Đã sao chép link');
  };

  const renderMessage = (msg) => {
    const urlMatch = msg.text.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      const url = urlMatch[0];
      const parts = msg.text.split(url);
      return (
        <>
          {parts[0]}
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '4px' }}>
            🔗 Xem trên Google
          </a>
          <button className="copy-button" onClick={() => handleCopy(url)}>📋</button>
          {parts[1]}
        </>
      );
    }
    return msg.text;
  };

  return (
    <div className="chatbot-container">
      <div className="chat-window">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.from}`}>{renderMessage(msg)}</div>
        ))}
        {loading && <div className="chat-bubble bot">🤖 Đang nghĩ...</div>}
      </div>
      <div className="chat-input">
        <input
          type="text"
          placeholder="Gõ câu hỏi..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={sendMessage}>Gửi</button>
      </div>
    </div>
  );
};

export default ChatBot;

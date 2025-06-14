import React, { useState, useEffect } from 'react';
import './ChatBot.css';

const BASE_URL = process.env.REACT_APP_API;
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 phút

const INITIAL_BOT_MSG = { from: 'bot', text: '👋 Xin chào! Bạn muốn tìm món gì hôm nay?' };

const ChatBot = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatHistory');
    return saved ? JSON.parse(saved) : [INITIAL_BOT_MSG];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(() => {
    const saved = localStorage.getItem('chatFilters');
    return saved ? JSON.parse(saved) : null;
  });

  // 🕒 Auto reset after idle
  useEffect(() => {
    const lastActive = localStorage.getItem('lastActive');
    if (lastActive && Date.now() - Number(lastActive) > IDLE_TIMEOUT) {
      resetChat();
    }
    localStorage.setItem('lastActive', Date.now().toString());
  }, []);

  const resetChat = () => {
    setMessages([INITIAL_BOT_MSG]);
    setFilters(null);
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('chatFilters');
    localStorage.setItem('lastActive', Date.now().toString());
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { from: 'user', text: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    localStorage.setItem('lastActive', Date.now().toString());

    try {
      const res = await fetch(`${BASE_URL}/chatgpt/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: convertToChatFormat(newMessages),
          filters,
        }),
      });

      const data = await res.json();
      const botReply = { from: 'bot', text: data.reply || '🤖 Không có phản hồi.' };
      const updatedMessages = [...newMessages, botReply];

      setMessages(updatedMessages);
      localStorage.setItem('chatHistory', JSON.stringify(updatedMessages));

      if (!filters && data.filters) {
        setFilters(data.filters);
        localStorage.setItem('chatFilters', JSON.stringify(data.filters));
      }
    } catch (err) {
      const errorReply = { from: 'bot', text: '⚠️ Lỗi mạng hoặc server không phản hồi.' };
      setMessages([...newMessages, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const convertToChatFormat = (msgs) =>
    msgs.map((msg) => ({
      role: msg.from === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

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

      <div className="chat-actions">
        <button onClick={resetChat} className="clear-button">🗑 Xóa hội thoại</button>
      </div>
    </div>
  );
};

export default ChatBot;
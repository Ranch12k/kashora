import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';

interface Message {
  id: string;
  content: string;
  is_mine: boolean;
  created_at: string;
}

interface ChatBoxProps {
  threadId: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ threadId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await chatAPI.getMessages(threadId);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      const res = await chatAPI.sendMessage(threadId, newMessage);
      setMessages([...messages, res.data]);
      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ alignSelf: msg.is_mine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
            <div style={{ 
              background: msg.is_mine ? 'var(--byr-primary)' : '#f1f1f1', 
              color: msg.is_mine ? '#fff' : '#000',
              padding: '8px 12px', 
              borderRadius: '16px',
              borderBottomRightRadius: msg.is_mine ? '0' : '16px',
              borderBottomLeftRadius: !msg.is_mine ? '0' : '16px',
            }}>
              {msg.content}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', textAlign: msg.is_mine ? 'right' : 'left' }}>
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex', padding: '12px', borderTop: '1px solid #ddd', background: '#fafafa', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
        <input 
          type="text" 
          value={newMessage} 
          onChange={e => setNewMessage(e.target.value)} 
          placeholder="Type a message..." 
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '20px', outline: 'none' }}
        />
        <button type="submit" style={{ marginLeft: '8px', background: 'var(--byr-primary)', color: '#fff', border: 'none', borderRadius: '20px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
          Send
        </button>
      </form>
    </div>
  );
};

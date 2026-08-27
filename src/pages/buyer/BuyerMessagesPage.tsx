import React, { useState, useEffect } from 'react';
import { chatAPI } from '../../services/api';
import { ChatBox } from '../../components/ChatBox';
import BuyerLayout from '../../components/BuyerLayout';

interface Thread {
  id: string;
  seller_phone: string;
  last_message: any;
  unread_count: number;
}

const BuyerMessagesPage: React.FC = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);

  const fetchThreads = async () => {
    try {
      const res = await chatAPI.getThreads();
      setThreads(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 10000); // Poll threads every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <BuyerLayout>
      <div className="byr-container" style={{ maxWidth: '1000px' }}>
        <h1 className="byr-title">Messages</h1>
        <div style={{ display: 'flex', gap: '20px', height: '500px' }}>
          {/* Sidebar */}
          <div className="byr-box" style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {threads.map(thread => (
                <div 
                  key={thread.id} 
                  onClick={() => setSelectedThread(thread.id)}
                  style={{ 
                    padding: '16px', 
                    borderBottom: '1px solid var(--byr-card-border)', 
                    cursor: 'pointer',
                    background: selectedThread === thread.id ? '#f0f7ff' : '#fff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <p style={{ fontWeight: 600 }}>{thread.seller_phone}</p>
                    {thread.unread_count > 0 && (
                      <span style={{ background: 'var(--badge-red-bg)', color: 'var(--badge-red-txt)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {thread.unread_count}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--byr-text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {thread.last_message ? thread.last_message.content : 'No messages yet'}
                  </p>
                </div>
              ))}
              {threads.length === 0 && <p style={{ padding: '16px', color: 'var(--byr-text-3)' }}>No conversations yet.</p>}
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="byr-box" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedThread ? (
              <ChatBox threadId={selectedThread} />
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--byr-text-3)' }}>
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
};

export default BuyerMessagesPage;

import React, { useState, useEffect } from 'react';
import { chatAPI } from '../../services/api';
import { ChatBox } from '../../components/ChatBox';

interface Thread {
  id: string;
  buyer_phone: string;
  last_message: any;
  unread_count: number;
}

const SellerMessagesPage: React.FC = () => {
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
    <div className="container mx-auto p-4 flex gap-4 h-[calc(100vh-100px)]">
      {/* Sidebar list */}
      <div className="w-1/3 bg-white border rounded shadow flex flex-col">
        <h2 className="text-xl font-bold p-4 border-b">Messages</h2>
        <div className="flex-1 overflow-y-auto">
          {threads.map(thread => (
            <div 
              key={thread.id} 
              onClick={() => setSelectedThread(thread.id)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 flex justify-between items-center ${selectedThread === thread.id ? 'bg-blue-50' : ''}`}
            >
              <div>
                <p className="font-semibold">{thread.buyer_phone}</p>
                <p className="text-sm text-gray-500 truncate max-w-[150px]">
                  {thread.last_message ? thread.last_message.content : 'No messages yet'}
                </p>
              </div>
              {thread.unread_count > 0 && (
                <span className="bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
                  {thread.unread_count}
                </span>
              )}
            </div>
          ))}
          {threads.length === 0 && <p className="p-4 text-gray-500">No conversations yet.</p>}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="w-2/3 bg-white border rounded shadow p-4">
        {selectedThread ? (
          <div className="h-full flex flex-col">
            <h3 className="text-lg font-bold mb-4">Chat</h3>
            <div className="flex-1">
              <ChatBox threadId={selectedThread} />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerMessagesPage;

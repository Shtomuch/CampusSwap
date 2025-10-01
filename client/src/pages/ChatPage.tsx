import React from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getChatConnection, isConnectionReady } from '../services/realtime';
import { Conversation, ChatMessage } from '../types';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { isAuthenticated, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  
  // Отримуємо userId з URL параметрів
  const targetUserId = searchParams.get('userId');

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[Chat] User not authenticated, skipping SignalR connection');
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const conn = await getChatConnection();
        conn.off('ConversationsLoaded');
        conn.off('MessagesLoaded');
        conn.off('ReceiveMessage');
        conn.off('Error');
        conn.off('userconnected');
        conn.off('joinedconversation');
        conn.off('MessageSent');
        
        conn.on('ConversationsLoaded', (items: Conversation[]) => {
          if (!mounted) return;
          console.log('[Chat] Conversations loaded:', items);
          setConversations(items);
          
          // Якщо є targetUserId, знаходимо або створюємо розмову
          if (targetUserId && user?.id !== targetUserId) {
            console.log('[Chat] Looking for conversation with user:', targetUserId);
            const existingConv = items.find(c => c.otherUserId === targetUserId);
            
            if (existingConv) {
              console.log('[Chat] Found existing conversation:', existingConv.id);
              openConversation(existingConv);
            } else {
              console.log('[Chat] Creating new conversation with user:', targetUserId);
              createConversationWithUser(targetUserId);
            }
          }
        });

        conn.on('ConversationCreated', (conversation: Conversation) => {
          if (!mounted) return;
          console.log('[Chat] Conversation created:', conversation);
          setConversations(prev => [...prev, conversation]);
          openConversation(conversation);
        });
        conn.on('MessagesLoaded', (items: ChatMessage[]) => {
          if (!mounted) return;
          setMessages(items);
        });
        conn.on('ReceiveMessage', (msg: ChatMessage) => {
          if (!mounted) return;
          if (activeConv && msg.conversationId === activeConv.id) {
            setMessages(prev => [...prev, msg]);
          }
        });

        conn.on('MessageSent', (msg: ChatMessage) => {
          if (!mounted) return;
          console.log('[Chat] Message sent confirmation:', msg);
          if (activeConv && msg.conversationId === activeConv.id) {
            setMessages(prev => [...prev, msg]);
          }
        });

        conn.on('userconnected', (userId: string) => {
          if (!mounted) return;
          console.log('[Chat] User connected:', userId);
        });

        conn.on('joinedconversation', (conversationId: string) => {
          if (!mounted) return;
          console.log('[Chat] Joined conversation:', conversationId);
        });

        conn.on('Error', (error: string) => {
          console.error('[Chat] SignalR Error:', error);
        });
        
        await conn.invoke('GetConversations');
      } catch (error) {
        console.error('[Chat] Failed to initialize chat connection:', error);
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  const openConversation = async (c: Conversation) => {
    try {
      setActiveConv(c);
      const conn = await getChatConnection();
      await conn.invoke('JoinConversation', c.id);
      await conn.invoke('GetMessages', c.id);
    } catch (error) {
      console.error('[Chat] Failed to open conversation:', error);
    }
  };

  const createConversationWithUser = async (otherUserId: string) => {
    try {
      console.log('[Chat] Creating conversation with user:', otherUserId);
      const conn = await getChatConnection();
      if (!isConnectionReady(conn)) {
        console.warn('[Chat] Connection not ready for creating conversation');
        return;
      }
      
      // Викликаємо метод на сервері для створення розмови
      await conn.invoke('CreateConversation', otherUserId);
      console.log('[Chat] Conversation creation requested');
    } catch (error) {
      console.error('[Chat] Failed to create conversation:', error);
    }
  };

  const sendFirstMessage = async () => {
    if (!targetUserId || !input.trim()) return;
    
    console.log('[Chat] 🚀 Starting sendFirstMessage process...');
    console.log('[Chat] Target user ID:', targetUserId);
    console.log('[Chat] Message content:', input.trim());
    
    try {
      console.log('[Chat] 📞 Getting chat connection...');
      const conn = await getChatConnection();
      console.log('[Chat] Connection state:', conn.state);
      
      if (!isConnectionReady(conn)) {
        console.warn('[Chat] ⚠️ Connection not ready for sending first message');
        return;
      }
      
      console.log('[Chat] 📤 Invoking SendMessage with params:', {
        recipientId: targetUserId,
        message: input.trim()
      });
      
      // Відправляємо перше повідомлення, що створить розмову
      await conn.invoke('SendMessage', targetUserId, input.trim());
      setInput('');
      console.log('[Chat] ✅ First message sent successfully');
    } catch (error) {
      console.error('[Chat] ❌ Failed to send first message:', error);
      console.error('[Chat] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  };

  const sendMessage = async () => {
    if (!activeConv || !input.trim()) return;
    
    console.log('[Chat] 🚀 Starting sendMessage process...');
    console.log('[Chat] Active conversation ID:', activeConv.id);
    console.log('[Chat] Recipient user ID:', activeConv.otherUserId);
    console.log('[Chat] Message content:', input.trim());
    
    try {
      console.log('[Chat] 📞 Getting chat connection...');
      const conn = await getChatConnection();
      console.log('[Chat] Connection state:', conn.state);
      
      if (!isConnectionReady(conn)) {
        console.warn('[Chat] ⚠️ Connection not ready, retrying...');
        return;
      }
      
      console.log('[Chat] 📤 Invoking SendMessage with params:', {
        recipientId: activeConv.otherUserId,
        message: input.trim()
      });
      
      await conn.invoke('SendMessage', activeConv.otherUserId, input.trim());
      setInput('');
      console.log('[Chat] ✅ Message sent successfully');
    } catch (error) {
      console.error('[Chat] ❌ Failed to send message:', error);
      console.error('[Chat] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)]">
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Чати</h2>
          
          {/* Показуємо інформацію про цільового користувача, якщо розмови ще немає */}
          {targetUserId && !conversations.find(c => c.otherUserId === targetUserId) && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {targetUserId.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Нова розмова</p>
                  <p className="text-xs text-blue-600">Розмова буде створена після першого повідомлення</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {conversations.map((c) => (
              <button key={c.id} onClick={() => openConversation(c)} className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 ${activeConv?.id===c.id?'bg-gray-50':''}`}>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                    {c.otherUserName ? c.otherUserName.substring(0, 2).toUpperCase() : 'U'}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{c.otherUserName}</p>
                    <p className="text-sm text-gray-500 line-clamp-1">{c.lastMessage}</p>
                  </div>
                  {c.unreadCount>0 && <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">{c.unreadCount}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {activeConv ? (
            messages.map(m => (
              <div key={m.id} className={`max-w-lg ${m.senderId===activeConv.otherUserId?'':'ml-auto'}`}>
                <div className={`px-3 py-2 rounded-lg ${m.senderId===activeConv.otherUserId?'bg-gray-100':'bg-primary-600 text-white'}`}>{m.content}</div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500">Виберіть чат для початку спілкування</div>
          )}
        </div>
        {(activeConv || targetUserId) && (
          <div className="p-3 border-t flex gap-2">
            <input 
              value={input} 
              onChange={(e)=>setInput(e.target.value)} 
              className="flex-1 border rounded px-3 py-2" 
              placeholder={targetUserId ? "Напишіть перше повідомлення..." : "Повідомлення..."}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (activeConv) {
                    sendMessage();
                  } else if (targetUserId) {
                    sendFirstMessage();
                  }
                }
              }}
            />
            <button 
              onClick={activeConv ? sendMessage : sendFirstMessage} 
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Надіслати
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
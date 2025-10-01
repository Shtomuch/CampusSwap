import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

type ConnectionMap = {
  chat?: HubConnection;
  notifications?: HubConnection;
};

const connections: ConnectionMap = {};

function buildConnection(path: string) {
  console.log(`[SignalR] Building connection to ${API_URL}${path}`);

  return new HubConnectionBuilder()
    .withUrl(`${API_URL}${path}`, {
      withCredentials: true,
      skipNegotiation: false,
      transport: undefined, // Use default transport
      accessTokenFactory: async () => {
        const token = localStorage.getItem('accessToken');
        console.log(`[SignalR] 🔑 Getting fresh token for ${path}: ${!!token}`);
        
        if (!token) {
          console.log(`[SignalR] ❌ No access token found for ${path}`);
          throw new Error('No access token found. Please login first.');
        }

        // Перевіряємо, чи токен не закінчився
        try {
          // Перевіряємо, чи токен має правильний формат JWT (3 частини, розділені крапками)
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            console.log(`[SignalR] ⚠️ Invalid token format: expected 3 parts, got ${tokenParts.length}`);
            return token; // Повертаємо токен як є, нехай сервер розбереться
          }

          // Безпечне декодування payload
          let payload;
          try {
            payload = JSON.parse(atob(tokenParts[1]));
          } catch (decodeError) {
            console.log(`[SignalR] ⚠️ Failed to decode token payload:`, decodeError);
            return token; // Повертаємо токен як є
          }

          const exp = payload.exp * 1000; // Конвертуємо в мілісекунди
          const now = Date.now();
          const timeUntilExpiry = exp - now;
          
          console.log(`[SignalR] ⏰ Token expires in ${Math.round(timeUntilExpiry / 1000)} seconds`);
          console.log(`[SignalR] 📅 Token expires at: ${new Date(exp).toISOString()}`);
          console.log(`[SignalR] 🕐 Current time: ${new Date(now).toISOString()}`);
          
          // Якщо токен закінчується менше ніж через 5 хвилин, спробуємо оновити
          if (timeUntilExpiry < 5 * 60 * 1000) {
            console.log(`[SignalR] ⚠️ Token expires soon (${Math.round(timeUntilExpiry / 1000)}s), attempting refresh...`);
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (refreshToken) {
              console.log(`[SignalR] 🔄 Refresh token found, calling refresh endpoint...`);
              try {
                const response = await fetch(`${API_URL}/auth/refresh-token`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ refreshToken }),
                });
                
                console.log(`[SignalR] 📡 Refresh response status: ${response.status}`);
                
                if (response.ok) {
                  const data = await response.json();
                  console.log(`[SignalR] ✅ Refresh successful, updating tokens...`);
                  localStorage.setItem('accessToken', data.accessToken);
                  if (data.refreshToken) {
                    localStorage.setItem('refreshToken', data.refreshToken);
                  }
                  console.log(`[SignalR] 🎉 Token refreshed successfully, returning new token`);
                  return data.accessToken;
                } else {
                  const errorText = await response.text();
                  console.log(`[SignalR] ❌ Token refresh failed: ${response.status} - ${errorText}`);
                }
              } catch (error) {
                console.error(`[SignalR] 💥 Token refresh error:`, error);
              }
            } else {
              console.log(`[SignalR] ❌ No refresh token found`);
            }
          } else {
            console.log(`[SignalR] ✅ Token is still valid, using current token`);
          }
          
          return token;
        } catch (error) {
          console.error(`[SignalR] 💥 Token parsing error:`, error);
          return token;
        }
      }
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: retryContext => {
        if (retryContext.previousRetryCount === 0) {
          return 0;
        }
        if (retryContext.previousRetryCount === 1) {
          return 2000;
        }
        if (retryContext.previousRetryCount === 2) {
          return 5000;
        }
        if (retryContext.previousRetryCount === 3) {
          return 10000;
        }
        return 30000;
      }
    })
    .configureLogging(LogLevel.Information)
    .build();
}

export async function getChatConnection(): Promise<HubConnection> {
  try {
    console.log('[SignalR] Getting chat connection...');
    if (!connections.chat) {
      console.log('[SignalR] Creating new chat connection...');
      connections.chat = buildConnection('/hubs/chat');

      connections.chat.onreconnecting((error) => {
        console.warn('[SignalR Chat] Reconnecting...', error);
      });

      connections.chat.onreconnected((connectionId) => {
        console.log('[SignalR Chat] Reconnected with ID:', connectionId);
      });

      connections.chat.onclose((error) => {
        console.error('[SignalR Chat] Connection closed:', error);
        // Reset connection state
        connections.chat = undefined;
        // Не перезапускаємо автоматично, щоб уникнути циклів
      });

      // Handle authentication errors
      connections.chat.on('AuthenticationFailed', (error: string) => {
        console.error('[SignalR Chat] Authentication failed:', error);
        // Clear invalid token
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Reset connection
        connections.chat = undefined;
      });
    }

    if (connections.chat.state === 'Disconnected') {
      console.log('[SignalR] Starting chat connection...');
      await connections.chat.start();
      console.log('[SignalR] Chat connection started successfully');
    }

    
    if (connections.chat.state === 'Connecting') {
      console.log('[SignalR] Waiting for connection to establish...');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        const checkConnection = () => {
          if (connections.chat?.state === 'Connected') {
            clearTimeout(timeout);
            resolve();
          } else if (connections.chat?.state === 'Disconnected') {
            clearTimeout(timeout);
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    return connections.chat;
  } catch (error) {
    console.error('[SignalR] Failed to establish chat connection:', error);
  
    if (connections.chat) {
      connections.chat = undefined;
    }
    throw error;
  }
}

export async function getNotificationsConnection(): Promise<HubConnection> {
  try {
    console.log('[SignalR] Getting notifications connection...');
    if (!connections.notifications) {
      console.log('[SignalR] Creating new notifications connection...');
      connections.notifications = buildConnection('/hubs/notifications');

      connections.notifications.onreconnecting((error) => {
        console.warn('[SignalR Notifications] Reconnecting...', error);
      });

      connections.notifications.onreconnected((connectionId) => {
        console.log('[SignalR Notifications] Reconnected with ID:', connectionId);
      });

      connections.notifications.onclose((error) => {
        console.error('[SignalR Notifications] Connection closed:', error);
        // Reset connection state
        connections.notifications = undefined;
        // Не перезапускаємо автоматично, щоб уникнути циклів
      });
    }

    if (connections.notifications.state === 'Disconnected') {
      console.log('[SignalR] Starting notifications connection...');
      await connections.notifications.start();
      console.log('[SignalR] Notifications connection started successfully');
    }

    // Wait for connection to be fully established
    if (connections.notifications.state === 'Connecting') {
      console.log('[SignalR] Waiting for notifications connection to establish...');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Notifications connection timeout'));
        }, 10000);

        const checkConnection = () => {
          if (connections.notifications?.state === 'Connected') {
            clearTimeout(timeout);
            resolve();
          } else if (connections.notifications?.state === 'Disconnected') {
            clearTimeout(timeout);
            reject(new Error('Notifications connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    return connections.notifications;
  } catch (error) {
    console.error('[SignalR] Failed to establish notifications connection:', error);
    // Clean up failed connection
    if (connections.notifications) {
      connections.notifications = undefined;
    }
    throw error;
  }
}

export async function stopAllConnections() {
  await Promise.all([
    connections.chat?.stop?.(),
    connections.notifications?.stop?.(),
  ]);
}

export function isConnectionReady(connection: HubConnection | undefined): boolean {
  return connection?.state === 'Connected';
}

export async function waitForConnection(connection: HubConnection | undefined, timeoutMs: number = 5000): Promise<boolean> {
  if (!connection) return false;
  
  if (connection.state === 'Connected') return true;
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), timeoutMs);
    
    const checkConnection = () => {
      if (connection.state === 'Connected') {
        clearTimeout(timeout);
        resolve(true);
      } else if (connection.state === 'Disconnected') {
        clearTimeout(timeout);
        resolve(false);
      } else {
        setTimeout(checkConnection, 100);
      }
    };
    
    checkConnection();
  });
}



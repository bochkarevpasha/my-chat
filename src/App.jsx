import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import { usePolling } from './hooks/usePolling';

function App() {
  const [isAuth, setIsAuth] = useState(!!(localStorage.getItem('idInstance') && localStorage.getItem('apiTokenInstance')));
  const [idInstance, setIdInstance] = useState(localStorage.getItem('idInstance') || '');
  const [apiTokenInstance, setApiTokenInstance] = useState(localStorage.getItem('apiTokenInstance') || '');

  const [chats, setChats] = useState(() => {
    const savedId = localStorage.getItem('idInstance');
    if (!savedId) return {};
    try {
      const savedChats = JSON.parse(localStorage.getItem(`chats_${savedId}`) || '{}');
      // Помечаем "зависшие" отправки как ошибки
      Object.values(savedChats).forEach((chat) => {
        chat.messages = chat.messages.map((msg) =>
          msg.status === 'sending' ? { ...msg, status: 'error' } : msg
        );
      });
      return savedChats;
    } catch (e) {
      console.error(e);
      return {};
    }
  });

  const [activeChatId, setActiveChatId] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null,
    payload: null
  });

  const activeChatIdRef = useRef(activeChatId);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (isAuth && idInstance) {
      localStorage.setItem(`chats_${idInstance}`, JSON.stringify(chats));
    }
  }, [chats, isAuth, idInstance]);

  const showToast = useCallback((message, type = 'error') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleAuthError = useCallback(() => {
    showToast('Сессия истекла или неверные данные. Войдите снова.', 'error');
    localStorage.removeItem('idInstance');
    localStorage.removeItem('apiTokenInstance');
    setIdInstance('');
    setApiTokenInstance('');
    setIsAuth(false);
    setChats({});
    setActiveChatId(null);
  }, [showToast]);

  usePolling({ isAuth, idInstance, apiTokenInstance, setChats, showToast, activeChatIdRef, onAuthError: handleAuthError });

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  }, []);

  const handleLogin = async (id, token) => {
    try {
      const res = await fetch(`https://api.green-api.com/waInstance${id}/getSettings/${token}`);

      if (!res.ok) {
        return false;
      }

      localStorage.setItem('idInstance', id);
      localStorage.setItem('apiTokenInstance', token);
      setIdInstance(id);
      setApiTokenInstance(token);
      setIsAuth(true);

      try {
        const savedChats = localStorage.getItem(`chats_${id}`);
        if (savedChats) {
          setChats(JSON.parse(savedChats));
        } else {
          setChats({});
        }
      } catch (e) {
        console.error(e);
        setChats({});
      }

      return true;
    } catch (error) {
      console.error('Ошибка проверки данных:', error);
      return false;
    }
  };

  // --- ФУНКЦИИ ДЛЯ МОДАЛКИ ---
  const closeModal = () => setModalConfig({ isOpen: false, type: null, payload: null });

  const handleLogoutRequest = () => {
    setModalConfig({
      isOpen: true,
      type: 'logout',
      title: 'Выход из аккаунта',
      message: 'Вы уверены, что хотите выйти? Вы сможете вернуться в любой момент.',
      confirmText: 'Выйти'
    });
  };

  const handleDeleteChatRequest = (chatId) => {
    setModalConfig({
      isOpen: true,
      type: 'deleteChat',
      payload: chatId,
      title: 'Удаление чата',
      message: 'Вы уверены, что хотите удалить этот чат? История переписки будет потеряна.',
      confirmText: 'Удалить'
    });
  };

  const handleConfirmAction = () => {
    if (modalConfig.type === 'logout') {
      executeLogout();
    } else if (modalConfig.type === 'deleteChat' && modalConfig.payload) {
      executeDeleteChat(modalConfig.payload);
    }
    closeModal();
  };

  const executeLogout = () => {
    localStorage.removeItem('idInstance');
    localStorage.removeItem('apiTokenInstance');
    setIdInstance('');
    setApiTokenInstance('');
    setIsAuth(false);
    setChats({});
    setActiveChatId(null);
    setIsMobileChatOpen(false);
    setToasts([]);
  };

  const executeDeleteChat = useCallback((chatId) => {
    setChats((prev) => {
      const newChats = { ...prev };
      delete newChats[chatId];
      return newChats;
    });
    if (activeChatIdRef.current === chatId) {
      setActiveChatId(null);
      setIsMobileChatOpen(false);
    }
    showToast('Чат удален', 'success');
  }, [showToast]);

  const handleCreateChat = useCallback((phone) => {
    if (!chats[phone]) {
      setChats((prev) => {
        if (prev[phone]) return prev;
        return {
          ...prev,
          [phone]: { id: phone, messages: [], unreadCount: 0 },
        };
      });
      showToast('Чат создан', 'success');
    }
    setActiveChatId(phone);
    setIsMobileChatOpen(true);
  }, [chats, showToast]);

  const handleSelectChat = useCallback((chatId) => {
    setActiveChatId(chatId);
    setIsMobileChatOpen(true);
    setChats((prev) => {
      if (prev[chatId]?.unreadCount > 0) {
        return { ...prev, [chatId]: { ...prev[chatId], unreadCount: 0 } };
      }
      return prev;
    });
  }, []);

  // --- ОТПРАВКА СООБЩЕНИЯ ---
  const handleSendMessage = useCallback(async (text) => {
    if (!activeChatId) return;

    const tempId = `temp_${crypto.randomUUID()}`;
    const timestamp = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false });

    // 1. Мгновенно добавляем сообщение
    setChats((prev) => {
      if (!prev[activeChatId]) return prev;
      return {
        ...prev,
        [activeChatId]: {
          ...prev[activeChatId],
          messages: [
            ...prev[activeChatId].messages,
            { id: tempId, text, isMine: true, timestamp, status: 'sending' },
          ],
        },
      };
    });

    // 2. Отправляем запрос в фоне
    try {
      const response = await fetch(`https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: `${activeChatId}@c.us`, message: text }),
      });

      if (response.ok) {
        const resData = await response.json();
        setChats((prev) => {
          const chat = prev[activeChatId];
          if (!chat) return prev;
          return {
            ...prev,
            [activeChatId]: {
              ...chat,
              messages: chat.messages.map(msg =>
                msg.id === tempId
                  ? { ...msg, id: resData.idMessage || tempId, status: 'sent' }
                  : msg
              )
            }
          };
        });
      } else {
        throw new Error('Ошибка сервера');
      }
    } catch (error) {
      console.error('Ошибка отправки:', error);
      setChats((prev) => {
        const chat = prev[activeChatId];
        if (!chat) return prev;
        return {
          ...prev,
          [activeChatId]: {
            ...chat,
            messages: chat.messages.map(msg =>
              msg.id === tempId ? { ...msg, status: 'error' } : msg
            )
          }
        };
      });
    }
  }, [activeChatId, idInstance, apiTokenInstance]);

  if (!isAuth) {
    return (
      <div className={`theme-${theme}`} style={{ width: '100%', height: '100vh', display: 'flex' }}>
        <Login onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />
      </div>
    );
  }

  const activeChat = activeChatId ? chats[activeChatId] : null;

  return (
    <div className={`app-container theme-${theme} ${isMobileChatOpen ? 'mobile-chat-open' : ''}`}>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onCreateChat={handleCreateChat}
        onDeleteChat={handleDeleteChatRequest}
        onLogout={handleLogoutRequest}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <ChatWindow chat={activeChat} onSendMessage={handleSendMessage} onBack={() => setIsMobileChatOpen(false)} />

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        onConfirm={handleConfirmAction}
        onCancel={closeModal}
      />
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}

export default App;
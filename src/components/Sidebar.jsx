import { useState } from 'react';
import { Icon } from '@mdi/react';
import { mdiDelete, mdiPlus, mdiAccount } from '@mdi/js';
import ThemeToggle from './ThemeToggle';
import { formatPhone } from '../utils/format';

const Sidebar = ({ chats, activeChatId, onSelectChat, onCreateChat, onDeleteChat, onLogout, theme, toggleTheme }) => {
    const [newChatPhone, setNewChatPhone] = useState('');

    const handlePhoneChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.startsWith('8')) value = '7' + value.slice(1);
        if (value.length > 11) value = value.slice(0, 11);
        setNewChatPhone(value);
    };

    const isPhoneValid = /^7\d{10}$/.test(newChatPhone);

    const showError = newChatPhone.length > 0 && !isPhoneValid;

    const handleCreateChat = (e) => {
        e.preventDefault();
        if (isPhoneValid) {
            onCreateChat(newChatPhone);
            setNewChatPhone('');
        }
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h3>Чаты</h3>
                <div className="header-actions">
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                    <button onClick={onLogout} className="logout-btn">Выйти</button>
                </div>
            </div>

            <form onSubmit={handleCreateChat} className="new-chat-form">
                <input
                    type="tel"
                    placeholder="Номер телефона (7ХХХХХХХХХХ)"
                    value={newChatPhone}
                    onChange={handlePhoneChange}
                    className={showError ? 'input-error' : ''}
                    maxLength={11}
                    autoFocus
                />
                <button type="submit" disabled={!isPhoneValid} title="Добавить чат">
                    <Icon path={mdiPlus} size={1} color="currentColor" />
                </button>
            </form>

            <div className="chat-list">
                {Object.values(chats).map((chat) => (
                    <div
                        key={chat.id}
                        className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`}
                        onClick={() => onSelectChat(chat.id)}
                    >
                        <div className="avatar">
                            <Icon path={mdiAccount} size={1.5} color="currentColor" />
                        </div>
                        <div className="chat-info">
                            <div className="chat-name">{formatPhone(chat.id)}</div>
                            <div className="chat-preview">
                                {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : 'Нет сообщений'}
                            </div>
                        </div>

                        {chat.unreadCount > 0 && <div className="unread-badge">{chat.unreadCount}</div>}

                        <button
                            className="delete-chat-btn"
                            onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                            title="Удалить чат"
                        >
                            <Icon path={mdiDelete} size={0.9} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
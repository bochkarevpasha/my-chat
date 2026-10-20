import { useState, useEffect, useRef } from 'react';
import { Icon } from '@mdi/react';
import {
    mdiCheck,
    mdiCheckAll,
    mdiArrowUp,
    mdiClockOutline,
    mdiAlertCircle
} from '@mdi/js';
import { formatPhone } from '../utils/format';

const ChatWindow = ({ chat, onSendMessage, onBack }) => {
    const [messageText, setMessageText] = useState('');
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat?.messages]);

    useEffect(() => {
        if (chat?.id) {
            inputRef.current?.focus();
        }
    }, [chat?.id]);

    if (!chat) {
        return (
            <div className="chat-window empty-chat-window">
                <div className="empty-chat"><p>Выберите чат или создайте новый</p></div>
            </div>
        );
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (messageText.trim()) {
            onSendMessage(messageText);
            setMessageText('');
            inputRef.current?.focus();
        }
    };

    const renderStatus = (status) => {
        if (status === 'sending') return <Icon path={mdiClockOutline} size={0.6} color="var(--status-read)" className="loading" />;
        if (status === 'error') return <Icon path={mdiAlertCircle} size={0.6} color="var(--button-negative)" />;

        if (status === 'sent') return <Icon path={mdiCheck} size={0.6} color="var(--text-mute)" />;
        if (status === 'delivered') return <Icon path={mdiCheckAll} size={0.6} color="var(--text-mute)" />;
        if (status === 'read') return <Icon path={mdiCheckAll} size={0.6} color="var(--status-read)" />;
        return null;
    };

    return (
        <div className="chat-window">
            <div className="chat-header">
                <button className="back-btn" onClick={onBack}>←</button>
                <h3>{formatPhone(chat.id)}</h3>
            </div>

            <div className="messages-area">
                {chat.messages.map((msg) => (
                    <div key={msg.id} className={`message-bubble ${msg.isMine ? 'mine' : 'theirs'}`}>
                        <div className="message-text">{msg.text}</div>
                        <div className="message-time">
                            {msg.timestamp}
                            {msg.isMine && <span className="message-status">{renderStatus(msg.status)}</span>}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form className="message-input-form" onSubmit={handleSubmit}>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Напишите сообщение..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                />
                <button type="submit" disabled={!messageText.trim()}>
                    <Icon path={mdiArrowUp} size={1} />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;
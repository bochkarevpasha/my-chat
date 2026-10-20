import { useEffect, useRef } from 'react';

export const usePolling = ({ isAuth, idInstance, apiTokenInstance, setChats, showToast, activeChatIdRef, onAuthError }) => {
    const errorCountRef = useRef(0);

    useEffect(() => {
        let isMounted = true;
        let timeoutId;
        let stopPolling = false;

        const pollNotifications = async () => {
            if (!isAuth || !idInstance || !apiTokenInstance || stopPolling) return;

            try {
                const url = `https://api.green-api.com/waInstance${idInstance}/receiveNotification/${apiTokenInstance}?receiveTimeout=10`;
                const res = await fetch(url);

                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        stopPolling = true;
                        if (isMounted) onAuthError();
                        return;
                    }

                    const errorText = await res.text();
                    if (res.status === 400 && errorText.includes('webhook')) {
                        showToast('Ошибка настроек: очистите Webhook URL в личном кабинете GREEN-API', 'error');
                    }
                    throw new Error(`HTTP error ${res.status}`);
                }

                errorCountRef.current = 0;
                const data = await res.json();
                if (!data || !data.body) return;

                const body = data.body;

                // 1. Входящие сообщения
                if (body.typeWebhook === 'incomingMessageReceived' && body.messageData?.typeMessage === 'textMessage') {
                    const senderPhone = body.senderData.senderPhoneNumber
                        ? String(body.senderData.senderPhoneNumber)
                        : body.senderData.chatId.split('@')[0];

                    const text = body.messageData.textMessageData.textMessage;
                    const messageId = body.idMessage || `in_${crypto.randomUUID()}`;

                    if (isMounted) {
                        setChats((prev) => {
                            const currentChat = prev[senderPhone] || { id: senderPhone, messages: [], unreadCount: 0 };
                            if (currentChat.messages.some(msg => msg.id === messageId)) return prev;

                            const isOpen = activeChatIdRef.current === senderPhone;
                            const newUnreadCount = isOpen ? 0 : (currentChat.unreadCount || 0) + 1;

                            return {
                                ...prev,
                                [senderPhone]: {
                                    ...currentChat,
                                    unreadCount: newUnreadCount,
                                    messages: [
                                        ...currentChat.messages,
                                        { id: messageId, text, isMine: false, timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false }) },
                                    ],
                                },
                            };
                        });
                    }
                }

                // 2. Статусы отправленных сообщений (галочки)
                if (body.typeWebhook === 'outgoingMessageStatus') {
                    if (isMounted) {
                        setChats((prevChats) => {
                            const newChats = { ...prevChats };
                            let updated = false;

                            for (const chatId in newChats) {
                                const chat = newChats[chatId];
                                const messageIndex = chat.messages.findIndex(msg => msg.id === body.idMessage);

                                if (messageIndex !== -1) {
                                    const updatedMessages = [...chat.messages];
                                    updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], status: body.status };
                                    newChats[chatId] = { ...chat, messages: updatedMessages };
                                    updated = true;
                                    break;
                                }
                            }
                            return updated ? newChats : prevChats;
                        });
                    }
                }

                await fetch(`https://api.green-api.com/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${data.receiptId}`, {
                    method: 'DELETE',
                });
            } catch (error) {
                console.error('Ошибка поллинга:', error);
                if (errorCountRef.current < 3) {
                    showToast('Ошибка соединения с сервером.', 'error');
                }
                errorCountRef.current += 1;
            } finally {
                if (isMounted && isAuth && !stopPolling) {
                    const delay = errorCountRef.current > 0 ? Math.min(1000 * Math.pow(2, errorCountRef.current), 10000) : 0;
                    timeoutId = setTimeout(pollNotifications, delay);
                }
            }
        };

        if (isAuth) pollNotifications();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [isAuth, idInstance, apiTokenInstance, setChats, showToast, activeChatIdRef, onAuthError]);
};
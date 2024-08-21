import { useEffect, useState, useRef } from 'react'

import { addDoc, collection, onSnapshot, serverTimestamp, where, query, orderBy } from 'firebase/firestore'
import { auth, db } from '../firebase-config.js'

import '../styles/Chat.css'

export const Chat = ({ selectedChat }) => {
    const { format } = require('date-fns');

    const messagesRef = collection(db, 'messages')
    const [messages, setMessages] = useState([])

    const [newMessage, setNewMessage] = useState("")
    const [inReplyToMessageID, setinReplyToMessageID] = useState(null)

    const messagesEndRef = useRef(null)

    useEffect(() => {
        const queryChatMesssages = query(
            messagesRef,
            where("chat_id", "==", selectedChat),
            orderBy('createdAt')
        )
        const unsubscribe = onSnapshot(queryChatMesssages, (snapshot) => {
            let queriedMessages = []
            snapshot.forEach((doc) => {
                queriedMessages.push({ ...doc.data(), id: doc.id }) // if the id already existed, it would not be added
            })
            setMessages(queriedMessages)
        })

        return () => unsubscribe() // TODO: poglej, zakaj je to pomembno
    }, [])

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (newMessage === "") {
            return
        } else {
            await addDoc(messagesRef, {
                text: newMessage,
                createdAt: serverTimestamp(),
                user: auth.currentUser.displayName,
                chat_id: selectedChat
            })
            setNewMessage("")
        }
    }


    return (
        <div className="chat">
            <div className='header-background'></div>
                <div className="header">
                    <div className="chat-title">{selectedChat}</div>
                </div>
            
            <div className='messages-container'>
                <div className='messages'>
                        {messages.map((message) => (
                            <div className='message-row'>
                                <div
                                    id={message.id}
                                    key={message.id}
                                    className={message.user === auth.currentUser.displayName ? 'message own-message' : 'message not-own-message'}
                                    style={{textAlign: message.user === auth.currentUser.displayName ? 'right' : 'left'}}
                                >
                                    <div className='message-user'>{message.user}</div>
                                    <div
                                        className='message-text'
                                        style={
                                            {
                                                marginLeft: message.user === auth.currentUser.displayName ? 'auto' : '0',
                                                borderRadius: message.user === auth.currentUser.displayName ? '15px 15px 0 15px' : '15px 15px 15px 0'
                                            }
                                        }
                                        title={'Message ID: ' + message.id}
                                    >
                                        {/* Style needed to push the message text to the right even though the parent div is already pushed to the right */}
                                        {message.text}
                                    </div>
                                    <div className='message-timestamp'>
                                        {format(Date(message.createdAt?.seconds), 'dd. MM. yyyy HH:mm:ss')}
                                        {/* Potreben ? sicer vedno dobim napako */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    <div ref={messagesEndRef}></div>
                </div>
            </div>
            <div className='new-message-form-container-background'>
                <div className='new-message-form-container'>
                    <form onSubmit={handleSubmit} className="new-message-form">
                        <input
                            onChange={(e) => setNewMessage(e.target.value)}
                            value={newMessage}
                            className="new-message-input"
                            placeholder="Type a messsage..."
                        />
                        <button type="submit" className="send-button" title="Click to change the world!">Send</button>
                    </form>
                </div>
            </div>
        </div>
    )
}
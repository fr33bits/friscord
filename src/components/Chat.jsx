import { useEffect, useState, useRef } from 'react'
import { addDoc, collection, onSnapshot, serverTimestamp, where, query, orderBy } from 'firebase/firestore'
import { auth, db } from '../firebase-config.js'

import '../styles/Chat.css'

export const Chat = ({ selectedChat }) => {
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
                queriedMessages.push({ ...doc.data(), id: doc.id }) // če bi id že obstajal, ne bi bil dodan
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
            <div className="header">
                <h1>{selectedChat}</h1>
            </div>
            <div className='messages-container'>
                <div className='messages'>
                        {messages.map((message) => (
                            <div className='message-row'>
                                <div id={message.id} key={message.id} className={message.user === auth.currentUser.displayName ? 'message own-message' : 'message not-own-message'}>
                                    <span className='user' >{message.user}</span>
                                    {message.text} ob {message.createdAt?.seconds}
                                    {/* Potreben ? sicer vedno dobim napako */}
                                </div>
                            </div>
                        ))}
                    <div ref={messagesEndRef}></div>
                </div>
            </div>
            <div className='new-message-form-container'>
                <form onSubmit={handleSubmit} className="new-message-form">
                    <input
                        onChange={(e) => setNewMessage(e.target.value)}
                        value={newMessage}
                        className="new-message-input"
                        placeholder="Click send to change the world"
                    />
                    <button type="submit" className="send-button">Send</button>
                </form>
            </div>
        </div>
    )
}
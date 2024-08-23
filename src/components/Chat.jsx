import { useEffect, useState, useRef } from 'react'

import { addDoc, collection, onSnapshot, serverTimestamp, where, query, orderBy, doc, getDocs } from 'firebase/firestore'

import { auth, db } from '../firebase-config.js'

import '../styles/Chat.css'

export const Chat = ({ selectedChat, authenticatedUser }) => {
    const { format } = require('date-fns');

    const messagesRef = collection(db, 'messages')
    const [messages, setMessages] = useState([])

    const [newMessage, setNewMessage] = useState("")

    const messagesEndRef = useRef(null)

    useEffect(() => {
        const queryChatMesssages = query(
            messagesRef,
            where("chat_id", "==", selectedChat.id),
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
    }, [selectedChat])

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSubmit = async (event) => {
        console.log("tuki dela auth:" + auth.currentUser.uid)
        event.preventDefault()
        if (newMessage === "") {
            return
        } else {
            await addDoc(messagesRef, {
                text: newMessage,
                createdAt: serverTimestamp(),
                sender_id: authenticatedUser.id_global,
                chat_id: selectedChat.id
            })
            setNewMessage("")
        }
    }

    // USER DATA
    const [senders, setSenders] = useState([])
    useEffect(() => {
        const fetchSenders = async () => {
            const uniqueSenderIDs = []
            for (let i = 0; i < messages.length; i++) {
                const sender_id = messages[i].sender_id
                if (!uniqueSenderIDs.includes(sender_id)) {
                    uniqueSenderIDs.push(sender_id)
                }
            }
            
            const usersRef = collection(db, 'users')
            async function getUser(user_id) {
                const q = query(usersRef, where("id_global", "==", user_id))
                const querySnapshot = await getDocs(q);
                const users = querySnapshot.docs.map(doc => doc.data());
                return users[0]
            }
            
            const chatSenders = []
            for (let i = 0; i < uniqueSenderIDs.length; i++) {
                const data = await getUser(uniqueSenderIDs[i])
                chatSenders[uniqueSenderIDs[i]] = data
            }
            setSenders(chatSenders)
        }
    
        fetchSenders()
    }, [messages])

    return (
        <div className="chat">
            <div className='header-background'></div>
                <div className="header">
                    <div className="chat-title">{selectedChat.name}</div>
                </div>
            
            <div className='messages-container'>
                <div className='messages'>
                        {messages.map((message, index) => (
                            <div key={index} className='message-row'>
                                <div
                                    id={message.id}
                                    key={message.id}
                                    className={message.sender_id === authenticatedUser.id_global ? 'message own-message' : 'message not-own-message'}
                                    style={{textAlign: message.sender_id === authenticatedUser.id_global ? 'right' : 'left'}}
                                >
                                    <div className='message-user'>{senders[message.sender_id]?.name}</div>
                                    <div
                                        className='message-text'
                                        style={
                                            {
                                                marginLeft: message.sender_id === authenticatedUser.id_global ? 'auto' : '0',
                                                borderRadius: message.sender_id === authenticatedUser.id_global ? '15px 15px 0 15px' : '15px 15px 15px 0'
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
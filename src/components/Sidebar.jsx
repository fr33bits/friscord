import React, { useState, useEffect } from 'react'
import '../styles/Sidebar.css'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase-config.js'
import { addDoc, collection, onSnapshot, serverTimestamp, where, query, orderBy } from 'firebase/firestore'

import SettingsIcon from '../assets/settings.png'
import LogoutIcon from '../assets/logout.png'

import Cookies from 'universal-cookie'
const cookies = new Cookies();

const ChatListItem = ({ chat_id, chat_name, member_ids, setSelectedChat, setIsChatSelected }) => {

    const selectChat = () => {
        setSelectedChat(chat_name);
        setIsChatSelected(true)
    }

    return (
        <div className='sidebar-chat-item' onClick={selectChat}>
            <div className='sidebar-chat-item-pfp-container'>
                <img src="https://www.w3schools.com/howto/img_avatar2.png" alt="Avatar" className='sidebar-chat-item-pfp'/>
            </div>
            <div className='sidebar-chat-item-text'>
                <div className='sidebar-chat-item-header'>
                    <span className='sidebar-chat-item-header-name'>{chat_name} </span>
                    <span className='sidebar-chat-item-header-id'>{chat_id}</span>
                </div>
                <div className='sidebar-chat-item-last-message'>Placeholder text</div>
            </div>
        </div>
    )
}

const ChatList = ({ setSelectedChat, setIsChatSelected}) => {
    const chatsRef = collection(db, 'chats')
    const [chats, setChats] = useState([])

    useEffect(() => {
        const queryChatList = query(
            chatsRef
        )

        const unsubscribe = onSnapshot(queryChatList, (snapshot) => {
            let queriedChats = []
            snapshot.forEach((doc) => {
                queriedChats.push({ ...doc.data(), id: doc.id })
            })
            setChats(queriedChats)
        })

        return () => unsubscribe()
    }, [])

    return (
        <div>
            {chats.map((chat) => (
                <ChatListItem
                    key={chat.id}
                    chat_id={chat.id}
                    chat_name={chat.chat_id}
                    members={chat.member_ids}
                    setSelectedChat={setSelectedChat}
                    setIsChatSelected={setIsChatSelected}
                />
            ))}
        </div>
    )
}

const Header = ({ setIsAuthenticated, setSelectedChat, setIsChatSelected }) => {
    const logout = async () => { // async!!!
        await signOut(auth)
        cookies.remove("auth-token")
        setIsAuthenticated(false)
        setSelectedChat("")
        setIsChatSelected(false)
    }

    return (
        <div className="sidebar-header">
            <div className='sidebar-header-service-name'>
                FRISCORD
            </div>
            <div className="sidebar-header-button">
                <div className="sidebar-header-button-icon">
                    <img src={SettingsIcon} alt="Nastavitve" width="25"/>
                </div>
            </div>
            <div className="sidebar-header-button">
                <div className="sidebar-header-button-icon" onClick={logout}>
                    <img src={LogoutIcon} alt="Odjava" width="23"/>
                </div>
            </div>
        </div>
    )
}

export const Sidebar = ({ setIsAuthenticated, setSelectedChat, setIsChatSelected }) => {

    return (
        <div>
            <Header
                setIsAuthenticated={setIsAuthenticated}
                setSelectedChat={setSelectedChat}
                setIsChatSelected={setIsChatSelected}
            />
            <ChatList
                setSelectedChat={setSelectedChat}
                setIsChatSelected={setIsChatSelected}
            />
        </div>
    )
}
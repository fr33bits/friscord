import React, { useState, useEffect } from 'react'
import '../styles/Sidebar.css'
import firebase from 'firebase/compat/app';
import { signOut, getAuth, onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase-config.js'
import { addDoc, collection, onSnapshot, serverTimestamp, where, query, orderBy, doc, getDoc } from 'firebase/firestore'

import SettingsIcon from '../assets/settings.png'
import LogoutIcon from '../assets/logout.png'

import Cookies from 'universal-cookie'
const cookies = new Cookies();

const ChatListItem = ({ chat_id, chat_name, member_ids, setSelectedChat, setIsChatSelected }) => {

    const getChat = async (chat_id) => {
        const docRef = doc(db, "chats", chat_id)
        const docSnap = await getDoc(docRef)
        const data = docSnap.data()
        data.id = docSnap.id // manually adds back in the Firestore document ID
        return data
    }

    const selectChat = async () => {
        const data = await getChat(chat_id)
        setSelectedChat(data);
        setIsChatSelected(true)
    }

    return (
        <div className='sidebar-chat-item' onClick={selectChat}>
            <div className='sidebar-chat-item-pfp-container'>
                <img src="https://www.w3schools.com/howto/img_avatar2.png" alt="Avatar" className='sidebar-chat-item-pfp'/>
            </div>
            <div className='sidebar-chat-item-text'>
                <div className='sidebar-chat-item-header'>
                    <span className='sidebar-chat-item-header-name' title={"Chat ID: "+ chat_id}>{chat_name} </span>
                </div>
                <div className='sidebar-chat-item-last-message'>Placeholder text</div>
            </div>
        </div>
    )
}

const ChatList = ({ setSelectedChat, setIsChatSelected, authenticatedUser}) => {
    const chatsRef = collection(db, 'chats')
    const [chats, setChats] = useState([])

    // !!! THIS ABSOLUTELY ATE UP MEMORY
    // onAuthStateChanged(auth, (user) => {
    //     if (user) {
    //         const uid = user.uid;
    //         const queryChatList = query(
    //             chatsRef,
    //             where("member_ids", "array-contains", uid),
    //         )
    
    //         const unsubscribe = onSnapshot(queryChatList, (snapshot) => {
    //             let queriedChats = []
    //             snapshot.forEach((doc) => {
    //                 queriedChats.push({ ...doc.data(), id: doc.id })
    //             })
    //             setChats(queriedChats)
    //         })
    
    //         return () => unsubscribe()
    //     } else {
    //         console.log("User is signed out!!!")
    //     }
    // });

    useEffect(() => {
        const queryChatList = query(
            chatsRef,
            where("member_ids", "array-contains", authenticatedUser.id_global),
        )

        const unsubscribe = onSnapshot(queryChatList, (snapshot) => {
            let queriedChats = []
            snapshot.forEach((doc) => {
                queriedChats.push({ ...doc.data(), id: doc.id })
            })
            setChats(queriedChats)
        })

        return () => unsubscribe()
    }, [authenticatedUser]); // TODO: should really be changed every time a new message queue is created, no?

    return (
        <div>
            {chats.map((chat) => (
                <ChatListItem 
                    key={chat.id}
                    chat_id={chat.id}
                    chat_name={chat.name}
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
        <div className="sidebar-header gradient">
            <div className='sidebar-header-service-name service-name'>
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

export const Sidebar = ({ setIsAuthenticated, setSelectedChat, setIsChatSelected, authenticatedUser }) => {
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
                authenticatedUser={authenticatedUser}
            />
        </div>
    )
}
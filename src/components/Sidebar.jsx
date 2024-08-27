import React, { useState, useEffect } from 'react'
import '../styles/Sidebar.css'
import firebase from 'firebase/compat/app';
import { signOut, getAuth, onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase-config.js'
import { addDoc, collection, onSnapshot, serverTimestamp, where, query, orderBy, doc, getDoc, getDocs, limit } from 'firebase/firestore'

import Cookies from 'universal-cookie'
const cookies = new Cookies();

const Avatars = ({chat_member_ids, authenticatedUser}) => {
    const [members, setMembers] = useState([]) // excludes the authenticated user

    useEffect(() => {
        const getPhotos = async () => {
            const usersRef = collection(db, 'users')
            const getUser = async (user_id) => {
                const q = query(usersRef, where("id_global", "==", user_id))
                const querySnapshot = await getDocs(q);
                const users = querySnapshot.docs.map(doc => doc.data());
                return users[0]
            }
            const member_ids = chat_member_ids.filter(element => element !== authenticatedUser.id_global)
            const membersTemp = []
            for (let i = 0; i < member_ids.length; i++) {
                const memberTemp = await getUser(member_ids[i])
                membersTemp.push(memberTemp)
            }
            setMembers(membersTemp)
        }
        getPhotos()
    }, [chat_member_ids])

    return (
        <div>
            { members.length === 0 ? (<img src="https://www.w3schools.com/howto/img_avatar2.png" alt="Avatar" className='sidebar-chat-item-pfp'/>) : null }
            { members?.length > 0 ?
            (<img src={members[0]?.photo_url} alt="Avatar" className='sidebar-chat-item-pfp' />) : null }
        </div>
    )
}

const ChatListItem = ({ chat, setSelectedChat, setIsChatSelected, authenticatedUser }) => {
    const [lastMessage, setLastMessage] = useState(null)
    const [lastMessageUser, setLastMessageUser] = useState(null)

    useEffect(() => {
        if (lastMessage) {
            const usersRef = collection(db, 'users')
            const getUser = async (user_id) => {
                const q = query(usersRef, where("id_global", "==", user_id))
                const querySnapshot = await getDocs(q);
                const users = querySnapshot.docs.map(doc => doc.data());
                setLastMessageUser(users[0]);
            }
            getUser(lastMessage.sender_id)
        }
    }, [lastMessage])

    useEffect(() => {
        const getLastMessage = async () => {

            const messagesRef = collection(db, "messages")
            const queryMessagesList = query(
                messagesRef,
                where("chat_id", "==", chat.id),
                orderBy('createdAt', "desc"),
                limit(1)
            )

            const unsubscribe = onSnapshot(queryMessagesList, async (snapshot) => {
                let queriedMessages = []
                snapshot.forEach((doc) => {
                    queriedMessages.push({ ...doc.data(), id: doc.id })
                })
                let queriedLastMessage = queriedMessages[0]
                setLastMessage(queriedLastMessage)
            })

            return () => unsubscribe()
        }
        getLastMessage()
    }, [chat]);

    const selectChat = () => {
        setSelectedChat(chat);
        setIsChatSelected(true)
    }

    return (
        <div className='sidebar-chat-item' onClick={selectChat}>
            <div className='sidebar-chat-item-pfp-container'>
                <Avatars chat_member_ids={chat.member_ids} authenticatedUser={authenticatedUser}/>
            </div>
            <div className='sidebar-chat-item-text'>
                <div className='sidebar-chat-item-header'>
                    <span className='sidebar-chat-item-header-name' title={"Chat ID: " + chat.id}>{chat.name} </span>
                </div>
                {lastMessageUser?.name ? <div className='sidebar-chat-item-last-message'>{lastMessageUser?.name.split(' ')[0]}: {lastMessage?.text}</div> : null}
            </div>
        </div>
    )
}

const ChatList = ({ setSelectedChat, setIsChatSelected, authenticatedUser }) => {
    const chatsRef = collection(db, 'chats')
    const [chats, setChats] = useState([])

    // !!! extremely bad performance memory-wise
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

    // const getLastMessage = async (chat_id) => {
    //     const documentsRef = collection(db, "messages")
    //     const q = query(documentsRef, where("chat_id", "==", chat_id), orderBy('createdAt'))
    //     const querySnapshot = await getDocs(q)
    //     const messages = querySnapshot.docs.map(doc => doc.data());
    //     return messages[0];
    // }

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
                    chat={chat}
                    setSelectedChat={setSelectedChat}
                    setIsChatSelected={setIsChatSelected}
                    authenticatedUser={authenticatedUser}
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
            <div className="sidebar-header-button" onClick={() => setIsChatSelected(false)} title='New chat'>
                <div className="sidebar-header-button-icon">
                    <span className="material-symbols-outlined">
                        add
                    </span>
                </div>
            </div>
            <div className="sidebar-header-button" title='Log out'>
                <div className="sidebar-header-button-icon" onClick={logout}>
                    <span className="material-symbols-outlined">
                        logout
                    </span>
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
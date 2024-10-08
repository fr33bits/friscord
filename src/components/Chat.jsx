import { useEffect, useState, useRef } from 'react'

import { addDoc, collection, onSnapshot, serverTimestamp, where, query, orderBy, doc, getDocs, updateDoc, arrayRemove } from 'firebase/firestore'

import { auth, db } from '../firebase-config.js'

import '../styles/Chat.css'

const ChatSettings = ({ selectedChat, setSelectedChat, setShowChatSettings, authenticatedUser }) => { // takes a lot of things after NewChat.jsx
    const [name, setName] = useState(selectedChat.name)
    const [members, setMembers] = useState(selectedChat.member_ids)
    const [memberValidity, setMemberValidity] = useState([false]) // set to false just in case one of the users deleted their account while this window is open (though this would probably be caught upstream anyway)
    
    const generateBoolArray = (admin_ids, member_ids) => {
        let boolArray = []
        member_ids.forEach((member_id, index) => {
            boolArray.push(admin_ids.includes(member_id) ? true : false)
        })
        return boolArray
    }
    const [admins, setAdmins] = useState(generateBoolArray(selectedChat.admin_ids, selectedChat.member_ids))
    const [error, setError] = useState(null)

    const chatRef = doc(db, 'chats', selectedChat.id)
    const updateChat = async (event) => {
        event.preventDefault()
        const getAdminList = () => {
            let adminList = []
            admins.forEach((admin, index) => {
                if (admin)
                    adminList.push(members[index])
            })
            return adminList
        }
        const updatedChatData = {
            name: name,
            member_ids: members,
            admin_ids: getAdminList()
        }

        updateDoc(chatRef, updatedChatData)
            .then(() => {
                // TODO: to posodabljanje ni elegantno in bi se moglo izvesti upstream
                let prevSelectedChat = { ...selectedChat }
                prevSelectedChat.name = name
                prevSelectedChat.member_ids = members
                prevSelectedChat.admin_ids = getAdminList()
                setSelectedChat(prevSelectedChat)
                setShowChatSettings(false)
            })
            .catch((error) => {
                setError(error)
            })
    }

    const usersRef = collection(db, 'users')
    useEffect(() => { // validates for all members at once
        const validateMembers = async (members) => {
            const newMemberValidity = Array(members.length).fill(false)
            for (let i = 0; i < members.length; i++) {
                const checkValidityForSpecificMember = async (user_id_global) => {
                    // check the user isn't the currently authenticated user
                    if (authenticatedUser.id_global === user_id_global && memberAlreadyAdded(user_id_global, i)) return false

                    // check that the user has already been previously entered (the first instance of the user returns as valid)
                    for (let j = 0; j < i; j++) {
                        if (members[i] === members[j]) {
                            return false
                        }
                    }

                    // check that the user actually exists in the system
                    const q = query(usersRef, where("id_global", "==", user_id_global))
                    const querySnapshot = await getDocs(q)
                    const users = querySnapshot.docs.map(doc => doc.data())
                    return users.length > 0
                }
                newMemberValidity[i] = await checkValidityForSpecificMember(members[i])
            }
            setMemberValidity(newMemberValidity)
        }
        validateMembers(members)
    }, [members]) // ? so kakšni problemi zaradi končne spremembe identifikatorjev

    const formComplete = () => {
        return name.length > 0 && memberValidity.every(value => value === true) && !admins.every(value => value === false)
    }

    const memberAlreadyAdded = (member, index) => {
        if (member === "") return null

        for (let j = 0; j < index; j++) {
            if (member === members[j]) {
                return true
            }
        }
        return null
    }

return (
    <div className='card-container card-container-float card-container-blur' onClick={(e) => { if (e.target !== e.currentTarget) return; setShowChatSettings(false) }}>
        <div className='card' onClick={() => null}>
            {!selectedChat.admin_ids.includes(authenticatedUser.id_global) ?
                <p className='caption' style={{ color: 'red', textAlign: 'center' }}>You are not an admin of this chat. You can only view but not change the chat name and its members.</p>
                : null
            }
            <form>
                <div className='form-field'>
                    <label htmlFor='chatName'>Chat name</label>
                    <input
                        name='chatName'
                        className='form-field-input'
                        placeholder='Chat name'
                        defaultValue={selectedChat.name}
                        onChange={(e) => { setName(e.target.value) }}
                        disabled={!selectedChat.admin_ids.includes(authenticatedUser.id_global)}
                    />
                </div>
                <div>
                    <div>
                        <h4>Members</h4>
                    </div>
                    <div>
                        <p className='caption'>You cannot remove yourself as a member of this chat here. If you want to remove yourself from this chat, please use the 'Leave chat' button.</p>
                        {selectedChat.admin_ids.includes(authenticatedUser.id_global) ?
                            <div>
                                <p className='caption'>You cannot remove all other members from the chat as the chat must have at least two members. All other members can however leave the chat themselves.</p>
                                <p className='caption'>Using the fields below you can also add other users to the chat using their global ID (which ends with an @ sign followed by the service name).</p>
                                <p className='caption'>Friscord uses randomly generated unique identifiers for addressing in order to prevent spam. To add a user to the chat, ask them to provide you their global identifier, which is displayed in the bottom left corner.</p>
                            </div>
                            : null
                        }
                    </div>
                    <div>
                        <div>
                            {members.map((member, index) => (
                                <div key={index} className='form-field'>
                                    <label htmlFor={'user' + index}>
                                        User {index + 1}
                                        {member === authenticatedUser.id_global && !memberAlreadyAdded(member, index) ? <span className='pill pill-you'>You</span> : null}
                                        {selectedChat.admin_ids.includes(member) && !memberAlreadyAdded(member, index) ? <span className='pill pill-admin'>Admin</span> : null}
                                    </label>
                                    {/* TODO: fix the fact that pressing enter creates more null elements: likely simulates button press? */}
                                    {/* A separate div is needed below the label, otherwise the icon won't behave like an inline-blook */}
                                    <div className='form-field-input-container'>
                                        <input
                                            name={'user' + index}
                                            className={memberValidity[index] ? 'field-valid form-field-input' : 'field-invalid form-field-input'}
                                            placeholder='Global user ID'
                                            value={member}
                                            onChange={(e) => {
                                                const newMembers = [...members] // spread needed to make sure that the array is actually copied instead of pasting a reference
                                                newMembers[index] = e.target.value
                                                setMembers(newMembers)
                                            }}
                                            disabled={
                                                !selectedChat.admin_ids.includes(authenticatedUser.id_global) ||
                                                member === authenticatedUser.id_global && !memberAlreadyAdded(member, index)
                                            }
                                        />
                                        {selectedChat.admin_ids.includes(authenticatedUser.id_global) ? admins[index] ?
                                            <div
                                                className='form-field-input-side-button-container'
                                                title="Remove admin privileges"
                                                onClick={() => setAdmins((prevAdmins) => prevAdmins.map((admin, i) => (i === index ? false : admin)))}>
                                                <span className="material-symbols-outlined">
                                                    remove_moderator
                                                </span>
                                            </div> :
                                            <div
                                                className='form-field-input-side-button-container'
                                                title="Make user an admin"
                                                onClick={() => setAdmins((prevAdmins) => prevAdmins.map((admin, i) => (i === index ? true : admin)))}>
                                                <span className="material-symbols-outlined">
                                                    add_moderator
                                                </span>
                                            </div>
                                            : null
                                        }
                                        {selectedChat.admin_ids.includes(authenticatedUser.id_global) && (member !== authenticatedUser.id_global || memberAlreadyAdded(member, index)) ?
                                            <div
                                                className='form-field-input-side-button-container'
                                                title="Remove user"
                                                onClick={() => {
                                                    setMembers([...members.slice(0, index), ...members.slice(index + 1)])
                                                    setAdmins([...admins.slice(0, index), ...admins.slice(index + 1)]) // !!! ne začne pri 1
                                                }}
                                            >
                                                <div
                                                    style={{ display: members.length > 0 ? 'inline-block' : 'none' }}
                                                    className="material-symbols-outlined"
                                                
                                                >
                                                    cancel
                                                </div>
                                            </div>
                                            : null
                                        }
                                    </div>
                                    {memberAlreadyAdded(member, index) ?
                                        member === authenticatedUser.id_global ?
                                            <p className='caption' style={{ color: 'red' }}>You cannot add yourself!</p> :
                                            <p className='caption' style={{ color: 'red' }}>This user has already been added above!</p>
                                        : null
                                    }
                                </div>
                            ))}
                        </div>
                        {admins.every(value => value === false) ? <p className='caption' style={{ color: 'red' , textAlign: 'center'}}>The chat must have at least one admin!</p> : null}
                        {selectedChat.admin_ids.includes(authenticatedUser.id_global) ?
                            <div className='form-button'>
                                {/* !!! For some reason this is already pushed to the list of members even without the button being clicked */}
                                <button type='button' onClick={(e) => { // setting the button type to 'button' (instead of not setting the button type, which defaults to submit) has the same effect as e.preventDefault()
                                    let newMembers = [...members] // spread necessary, otherwise new members don't show up (see above)
                                    newMembers.push("");
                                    setMembers(newMembers)

                                    let newAdmins = [...admins]
                                    newAdmins.push(false);
                                    setAdmins(newAdmins)
                                }}
                                >
                                    Add member
                                </button>
                            </div>
                            : null
                        }
                    </div>
                </div>
                {!selectedChat.admin_ids.includes(authenticatedUser.id_global) ?
                    <div className='form-button'>
                        <button type='button' onClick={() => setShowChatSettings(false)}>Close</button>
                    </div>
                    :
                    <div>
                        {error ? <p className='form-error-message'>{error}</p> : null}
                        <div className='form-button'>
                            <button type='submit' disabled={!formComplete()} onClick={(e) => { updateChat(e) }}>Save</button>
                        </div>
                    </div>
                }
            </form>
        </div>
    </div>
)
}

export const Chat = ({ selectedChat, setSelectedChat, authenticatedUser, setShowChatSettings, showChatSettings }) => {
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
        // !!! console.log("tuki dela auth:" + auth.currentUser.uid) (in res dela)
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

    const getDate = (firestore_timestamp) => {
        const milliseconds = firestore_timestamp?.seconds * 1000 + firestore_timestamp?.nanoseconds / 1000000;
        const javascriptDate = new Date(milliseconds);
        return javascriptDate
    }

    const leaveChat = async () => {
        const docRef = doc(db, "chats", selectedChat.id)
        const confirmation = window.confirm(`Are you sure you want to exit the chat "${selectedChat.name}"?`)
        if (confirmation) {
            try {
                await updateDoc(docRef, {
                    member_ids: arrayRemove(authenticatedUser.id_global),
                    admin_ids: arrayRemove(authenticatedUser.id_global)
                })
            } catch (error) {
                console.error("Error leaving chat: ", error)
            }
        }
    }

    return (
        <div className="chat">
            {showChatSettings ?
                <ChatSettings
                    selectedChat={selectedChat}
                    setSelectedChat={setSelectedChat}
                    setShowChatSettings={setShowChatSettings}
                    authenticatedUser={authenticatedUser}
                /> :
                null
            }
            <div className='header-background'></div>
            <div className="header">
                <div className='header-item' style={{ float: 'left' }}>
                    <span className="material-symbols-outlined leave-chat-icon" title="Add user to chat" onClick={() => setShowChatSettings(true)}>
                        settings
                    </span>
                </div>
                <div className="header-item chat-name">{selectedChat.name}</div>
                {/* TODO: order of these float: right divs unclear */}
                <div className='header-item' style={{ float: 'right' }}>
                    <span className="material-symbols-outlined leave-chat-icon" title="Leave chat" onClick={() => leaveChat()}>
                        group_remove
                    </span>
                </div>
            </div>
            <div className='messages-container'>
                <div className='messages'>
                    {messages.map((message, index) => (
                        <div key={index} className='message-row'>
                            <div
                                id={message.id}
                                key={message.id}
                                className={message.sender_id === authenticatedUser.id_global ? 'message own-message' : 'message not-own-message'}
                                style={{ textAlign: message.sender_id === authenticatedUser.id_global ? 'right' : 'left' }}
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
                                    title={'Message ID: ' + message.id
                                        + '\n' + getDate(message.createdAt)
                                    }
                                >
                                    {/* Style needed to push the message text to the right even though the parent div is already pushed to the right */}
                                    {message.text}
                                </div>
                                {/* <div className='message-timestamp'>
                                        {message?.createdAt?.seconds ? getDate(message.createdAt.seconds) : null}
                                    </div> */}
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
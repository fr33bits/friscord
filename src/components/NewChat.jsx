import React, { Component, useEffect, useState } from 'react'

import '../styles/NewChat.css'

import { auth, db } from '../firebase-config.js'
import { addDoc, collection, onSnapshot, serverTimestamp, where, query, orderBy, doc, getDocs } from 'firebase/firestore'

export const NewChat = ({ setSelectedChat, selectedChat, isChatSelected, setIsChatSelected, authenticatedUser }) => {
    const [name, setName] = useState("")
    const [members, setMembers] = useState([""]) // TODO: implement duplicate value checking in the backend
    const [memberValidity, setMemberValidity] = useState([false])
    const [admins, setAdmins] = useState([false])

    const getAdminList = () => {
        let adminList = [authenticatedUser.id_global]
        admins.forEach((admin, index) => {
            if (admin)
                adminList.push(members[index])
        })
        return adminList
    }

    const chatsRef = collection(db, 'chats')
    const addChat = async (event) => {
        event.preventDefault()
        try {
            const chatData = {
                name: name,
                createdAt: serverTimestamp(),
                createdBy: authenticatedUser.id_global,
                member_ids: [authenticatedUser.id_global, ...members],
                admin_ids: getAdminList()
            }
            const docRef = await addDoc(chatsRef, chatData)
            chatData.id = docRef.id

            setSelectedChat(chatData)
            setIsChatSelected(true)
        } catch (err) {
            console.error(err)
        }
    }

    const usersRef = collection(db, 'users')
    useEffect(() => { // validates for all members at once
        const validateMembers = async (members) => {
            const newMemberValidity = Array(members.length).fill(false)
            for (let i = 0; i < members.length; i++) {
                const checkValidityForSpecificMember = async (user_id_global) => {
                    // check the user isn't the currently authenticated user
                    if (authenticatedUser.id_global === user_id_global) return false

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
        return name.length > 0 && memberValidity.every(value => value === true)
    }

    const memberAlreadyAdded = (member, index) => {
        if (member === "") return null

        for (let j = 0; j < index; j++) {
            if (member === members[j]) {
                return (
                    <p className='caption' style={{ color: 'red' }}>This user has already been added above!</p>
                )
            }
        }
        return null
    }

    return (
        <div className='card-container'>
            <div className='card'>
                <div className='form'>
                    <form>
                        <div className='form-field'>
                            <label htmlFor='chatName'>Chat name</label>
                            <input name='chatName' placeholder='Chat name' className='form-field-input' onChange={(e) => { setName(e.target.value) }} />
                        </div>
                        <div>
                            <div>
                                <h4>Members</h4>
                            </div>
                            <div>
                                <p className='caption'>You will automatically be added as a member of a chat that you create. Using the fields below you can also add other users to the chat using their global ID (which ends with an @ sign followed by the service name).</p>
                                <p className='caption'>Friscord uses randomly generated unique identifiers for addressing in order to prevent spam. To start a new chat, ask the people you want to chat with to provide their global identifiers, which are displayed in the bottom left corner.</p>
                            </div>
                            <div>
                                <div>
                                    {members.map((member, index) => (
                                        <div key={index} className='form-field'>
                                            <label htmlFor={'user' + index}>User {index + 1}</label>
                                            {/* TODO: fix the fact that pressing enter creates more null elements: likely simulates button press? */}
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
                                                />
                                                {admins[index] ?
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
                                                }
                                                {members.length > 1 ?
                                                    <div
                                                        className='form-field-input-side-button-container'
                                                        title="Remove user"
                                                        onClick={() => {
                                                            setMembers([...members.slice(0, index), ...members.slice(index + 1)])
                                                            setAdmins([...admins.slice(0, index), ...admins.slice(index + 1)])
                                                        }}
                                                    >
                                                        <div

                                                            style={{ display: members.length > 1 ? 'inline-block' : 'none' }}
                                                            className="material-symbols-outlined"
                                                        >
                                                            cancel
                                                        </div>
                                                    </div>
                                                    : null
                                                }
                                            </div>
                                            {member === authenticatedUser.id_global && <p className='caption' style={{ color: 'red' }}>You cannot add yourself!</p>}
                                            {memberAlreadyAdded(member, index)}
                                        </div>
                                    ))}
                                </div>
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
                            </div>
                        </div>
                        {/* <p className='form-error-message'>{error}</p> */}
                        <div className='form-button'>
                            <button type='submit' disabled={!formComplete()} onClick={(e) => { addChat(e) }}>Create chat</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

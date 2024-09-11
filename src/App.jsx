import React, { useEffect, useState, useRef } from 'react'
import './App.css' // somehow styles from other CSS files are also availible

import { auth, db } from './firebase-config.js'
import { doc, getDoc, query, where, getDocs, collection, onSnapshot } from 'firebase/firestore'

import { Auth } from './components/Auth.jsx'
import { Chat } from './components/Chat.jsx'
import { Sidebar } from './components/Sidebar.jsx'
import { NewChat } from './components/NewChat.jsx'
import { Settings } from './components/Settings.jsx'


import Cookies from 'universal-cookie'
const cookies = new Cookies()

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(cookies.get("auth-token"))
  const [authenticatedUser, setAuthenticatedUser] = useState(cookies.get("auth-user")) // user (ID) is stored in a cookie so as to not be lost on refresh
  // TODO: erase after log-out
  const [selectedChat, setSelectedChat] = useState(null)
  const [isChatSelected, setIsChatSelected] = useState(false)

  const [showSettings, setShowSettings] = useState(false)

  const [showChatSettings, setShowChatSettings] = useState(false)

  // !!! auth.currentUser.uid is not accessible here for some reason
  // const user_id = cookies.get("auth-user")
  // useEffect(() => { // other user data is fetched upon every refresh; this is also necessary because auth does not have all the details on a user
  //   const getSetUser = async () => {
  //     if (isAuthenticated) {
  //       const usersRef = collection(db, 'users')
  //       const q = query(usersRef, where("id_local", "==", user_id))
  //       const querySnapshot = await getDocs(q);
  //       const users = querySnapshot.docs.map(doc => doc.data());
  //       setAuthenticatedUser(users[0])
  //     }
  //   }
  //   getSetUser()
  // }, []) // only runs once and after refresh

  const copyToClipboard = (text_to_copy) => {
    navigator.clipboard.writeText(text_to_copy)
      .then(() => {
        console.log('Text copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  }

  // !!! tried to have selected chat details update in real time but didn't get it working
  // useEffect(() => {
  //   if (selectedChat?.id) {
  //     const chatRef = doc(db, 'chats', selectedChat.id)
  
  //     const unsubscribe = onSnapshot(chatRef, (docSnapshot) => {
  //       if (docSnapshot.exists()) {
  //         setSelectedChat(docSnapshot.data())
  //         console.log("changed!")
  //       } else {
  //         console.log("The selected chat no longer exists!")
  //       }
  //     })
  //     return () => unsubscribe()
  //   }
  // });

  if (!isAuthenticated) {
    return (
      <div className="App">
        <Auth setIsAuthenticated={setIsAuthenticated} setAuthenticatedUser={setAuthenticatedUser} />
      </div>
    )
  } else {
    return (
      <div className="signedInView">
        <div className='sidebars'>
          <Sidebar
            setIsAuthenticated={setIsAuthenticated}
            setSelectedChat={setSelectedChat}
            setIsChatSelected={setIsChatSelected}
            authenticatedUser={authenticatedUser}
            setShowChatSettings={setShowChatSettings}
            className='sidebar'
          />
          <div className='sidebar sidebar-bottom'>
            <img src={authenticatedUser.photo_url} alt="" className='pfp' />
            <div style={{ display: 'inline-block' }} className='sidebar-bottom-text'>
              <div className='user-name'>
                {authenticatedUser.name}
              </div>
              <div
                className='global-id'
                title="Click to copy to clipboard"
                data-toggle="tooltip" data-placement="top"
                onClick={() => copyToClipboard(authenticatedUser.id_global)}
              >
                {authenticatedUser.id_global}
              </div>
            </div>
            {/* <span class="material-symbols-outlined" height='25'>
              settings
            </span> */}
          </div>
        </div>

        <div className='main_view'>
          {isChatSelected
            ? <Chat selectedChat={selectedChat} setSelectedChat={setSelectedChat} authenticatedUser={authenticatedUser} showChatSettings={showChatSettings} setShowChatSettings={setShowChatSettings} />
            : <NewChat setSelectedChat={setSelectedChat} selectedChat={selectedChat} isChatSelected={isChatSelected} setIsChatSelected={setIsChatSelected} authenticatedUser={authenticatedUser} />
          }
        </div>
        {showSettings ? <Settings authenticatedUser={authenticatedUser} setShowSettings={setShowSettings} /> : null}
      </div >
    )
  }
}

export default App;

import React, { useEffect, useState, useRef } from 'react'
import './App.css'

import { auth, db } from './firebase-config.js'
import { doc, getDoc } from 'firebase/firestore'

import { Auth } from './components/Auth.jsx'
import { Chat } from './components/Chat.jsx'
import { Sidebar } from './components/Sidebar.jsx'

import Cookies from 'universal-cookie'
const cookies = new Cookies()

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(cookies.get("auth-token"))
  const [selectedChat, setSelectedChat] = useState("")
  const [isChatSelected, setIsChatSelected] = useState(false)

  const getChat = async (chat_id) => {
    const docRef = doc(db, "chats", chat_id)
    const docSnap = await getDoc(docRef)
    const data = docSnap.data()
    data.id = docSnap.id // manually adds back in the Firestore document ID
    return data
  }
  
  if (!isAuthenticated) {
    return (
      <div className="App">
        <Auth setIsAuthenticated={setIsAuthenticated} />
      </div>
    )
  } else {
    return (
      <div className="signedInView">
        <div className='sidebar'>
          <Sidebar
            setIsAuthenticated={setIsAuthenticated}
            setSelectedChat={setSelectedChat}
            setIsChatSelected={setIsChatSelected}
            className='sidebar'
          />
        </div>
        <div className='main_view'>
          {isChatSelected
            ? <Chat selectedChat={selectedChat} />
            : (
              <div className="room">
                <label>Enter chat ID: </label>
                <input onChange={async (e) => { const data = await getChat(e.target.value); setSelectedChat(data) }} />
                <button onClick={() => setIsChatSelected(true)}>Confirm</button>
              </div>
            )
          }
        </div>
      </div>
    )
  }
}

export default App;

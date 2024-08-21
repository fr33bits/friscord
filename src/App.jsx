import React, { useState } from 'react'
import './App.css'

import { Auth } from './components/Auth.jsx'
import { Chat } from './components/Chat.jsx'
import { Sidebar } from './components/Sidebar.jsx'

import Cookies from 'universal-cookie'
const cookies = new Cookies()

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(cookies.get("auth-token"))
  const [selectedChat, setSelectedChat] = useState("")
  const [isChatSelected, setIsChatSelected] = useState(false)

  if (!isAuthenticated) {
    return (
      <div className="App">
        <Auth setIsAuthenticated={setIsAuthenticated}/>
      </div>
    );
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
            ? <Chat selectedChat={selectedChat}/>
            : (
              <div className="room">
                <label>Enter chat ID: </label>
                <input onChange={(e) => setSelectedChat(e.target.value)}/>
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

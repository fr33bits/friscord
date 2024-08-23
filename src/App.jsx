import React, { useEffect, useState, useRef } from 'react'
import './App.css'

import { auth, db } from './firebase-config.js'
import { doc, getDoc, query, where, getDocs, collection } from 'firebase/firestore'

import { Auth } from './components/Auth.jsx'
import { Chat } from './components/Chat.jsx'
import { Sidebar } from './components/Sidebar.jsx'

import Cookies from 'universal-cookie'
const cookies = new Cookies()

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(cookies.get("auth-token"))
  const [authenticatedUser, setAuthenticatedUser] = useState(cookies.get("auth-user")) // user (ID) is stored in a cookie so as to not be lost on refresh
  // TODO: erase after log-out
  const [selectedChat, setSelectedChat] = useState("")
  const [isChatSelected, setIsChatSelected] = useState(false)

  const getChat = async (chat_id) => {
    const docRef = doc(db, "chats", chat_id)
    const docSnap = await getDoc(docRef)
    const data = docSnap.data()
    data.id = docSnap.id // manually adds back in the Firestore document ID
    return data
  }

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
  
  if (!isAuthenticated) {
    return (
      <div className="App">
        <Auth setIsAuthenticated={setIsAuthenticated} setAuthenticatedUser={setAuthenticatedUser}/>
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
            authenticatedUser={authenticatedUser}
            className='sidebar'
          />
        </div>
        <div className='main_view'>
          {isChatSelected
            ? <Chat selectedChat={selectedChat} authenticatedUser={authenticatedUser} />
            : (
              <div className="room">
                {/* {auth.currentUser.uid
                // !!! appears after saving but does not persist past refresh unless you're signing in for the first time
                } */}
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
